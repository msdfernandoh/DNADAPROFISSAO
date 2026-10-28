-- P4 transacional: depende da sessao e da fundacao/autorizacao operacional.
-- Nao migra registros historicos, nao concede creditos, nao ativa questionarios.
BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='30s';
ALTER TABLE public.institutions ADD COLUMN credit_mode text NOT NULL DEFAULT 'shared' CHECK(credit_mode IN ('shared','unit_cap'));
ALTER TABLE public.units_v2 ADD COLUMN credit_cap integer CHECK(credit_cap>=0);
ALTER TABLE public.participants_v2 ADD COLUMN v1_revision text;
ALTER TABLE public.participants_v2 ADD COLUMN v1_registration jsonb CHECK(v1_registration IS NULL OR jsonb_typeof(v1_registration)='object');
ALTER TABLE public.credit_events_v2 ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
-- Saldo compartilhado admite concessoes institucionais sem unidade. Linhas antigas ficam intactas.
ALTER TABLE public.credit_events_v2 ALTER COLUMN unit_id DROP NOT NULL;
ALTER TABLE public.credit_events_v2 ADD CONSTRAINT credit_events_v2_tenant_unit_fk FOREIGN KEY(unit_id,institution_id) REFERENCES public.units_v2(id,institution_id);
CREATE UNIQUE INDEX credit_events_v2_one_v1_debit ON public.credit_events_v2(participant_id) WHERE type='v1_consume';
ALTER TABLE public.credit_events_v2 ADD CONSTRAINT credit_events_v2_v1_shape CHECK(
 type NOT LIKE 'v1_%' OR (institution_id IS NOT NULL AND amount<>0 AND
 ((type='v1_consume' AND amount=-1 AND participant_id IS NOT NULL AND unit_id IS NOT NULL) OR
 (type IN ('v1_grant','v1_refund') AND amount>0) OR type='v1_adjustment')));
ALTER TABLE public.questionnaire_results ADD COLUMN v1_revision text;
ALTER TABLE public.questionnaire_results ADD COLUMN v1_snapshot jsonb;
ALTER TABLE public.questionnaire_results ADD COLUMN v1_snapshot_key text;
ALTER TABLE public.questionnaire_results ADD COLUMN v1_fingerprint text;
ALTER TABLE public.questionnaire_results ADD COLUMN v1_debit_id uuid UNIQUE REFERENCES public.credit_events_v2(id);
ALTER TABLE public.questionnaire_results ADD CONSTRAINT questionnaire_results_v1_complete CHECK(v1_revision IS NULL OR (v1_snapshot IS NOT NULL AND v1_snapshot_key IS NOT NULL AND v1_fingerprint IS NOT NULL AND v1_debit_id IS NOT NULL));
-- Mapeia a revisao oficial para IDs existentes; carga futura especifica, revisada e autorizada.
CREATE TABLE dna_private.evaluation_revisions(revision text PRIMARY KEY,questionnaire_id uuid NOT NULL REFERENCES public.questionnaires(id),completion_enabled boolean NOT NULL DEFAULT false,source_hash text NOT NULL);
CREATE TABLE dna_private.revision_options(
 revision text NOT NULL REFERENCES dna_private.evaluation_revisions(revision),question_key text NOT NULL,alternative_key text NOT NULL,
 question_id uuid NOT NULL REFERENCES public.questions(id),alternative_id uuid NOT NULL REFERENCES public.alternatives(id),weights jsonb NOT NULL,
 PRIMARY KEY(revision,question_key,alternative_key),CHECK(jsonb_typeof(weights)='object')
);
REVOKE ALL ON dna_private.evaluation_revisions,dna_private.revision_options FROM PUBLIC,anon,authenticated,service_role;
-- Somente migracoes aprovadas preparam/ativam a revisao. Runtime nao pode trocar pesos.
CREATE FUNCTION dna_private.freeze_v1_result() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $fn$
BEGIN
 IF OLD.v1_revision IS NOT NULL THEN RAISE EXCEPTION 'Immutable V1 result';END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END
$fn$;
CREATE TRIGGER freeze_v1_result BEFORE UPDATE OR DELETE ON public.questionnaire_results FOR EACH ROW EXECUTE FUNCTION dna_private.freeze_v1_result();
CREATE FUNCTION dna_private.freeze_v1_answer() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $fn$
BEGIN
 IF EXISTS(SELECT 1 FROM public.questionnaire_results r WHERE r.participant_id=ANY(ARRAY[NEW.participant_id,OLD.participant_id]) AND r.v1_revision IS NOT NULL) THEN RAISE EXCEPTION 'Immutable completed V1 answers';END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END
$fn$;
CREATE TRIGGER freeze_v1_answer BEFORE INSERT OR UPDATE OR DELETE ON public.questionnaire_answers FOR EACH ROW EXECUTE FUNCTION dna_private.freeze_v1_answer();
CREATE FUNCTION dna_private.freeze_v1_credit() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $fn$
BEGIN
 IF OLD.type LIKE 'v1_%' THEN RAISE EXCEPTION 'Immutable V1 credit event; append an authorized correction';END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END
$fn$;
CREATE TRIGGER freeze_v1_credit BEFORE UPDATE OR DELETE ON public.credit_events_v2 FOR EACH ROW EXECUTE FUNCTION dna_private.freeze_v1_credit();
CREATE FUNCTION public.dna_complete_evaluation_v1(p_command jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE
 actor uuid:=(p_command->>'actorId')::uuid; sid uuid:=(p_command->>'sessionId')::uuid;
 pid uuid:=(p_command->>'participantId')::uuid; tenant uuid:=(p_command->>'institutionId')::uuid;
 uid uuid:=(p_command->>'unitId')::uuid; qid uuid:=(p_command->>'questionnaireId')::uuid;
 v_revision text:=p_command->>'revision'; v_key text:=p_command->>'snapshotKey';
 p public.participants_v2%ROWTYPE; i public.institutions%ROWTYPE; u public.units_v2%ROWTYPE;
 r public.questionnaire_results%ROWTYPE; option_row record; v_answer jsonb;
 scores jsonb:='{"L":0,"C":0,"E":0,"H":0,"P":0}'::jsonb; v_code text; weight integer;
 balance bigint; unit_used bigint; debit uuid; fingerprint text; maximum integer; top_count integer; second_count integer;
 main_code text; second_code text; main_id uuid; second_id uuid; pair text;
BEGIN
 IF jsonb_typeof(p_command)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(p_command))<>12 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_command) k WHERE k NOT IN ('actorId','sessionId','participantId','institutionId','unitId','questionnaireId','revision','revisionSourceHash','answers','scores','snapshot','snapshotKey')) THEN RAISE EXCEPTION 'Invalid server command';END IF;
 IF actor IS NULL OR sid IS NULL OR pid IS NULL OR tenant IS NULL OR uid IS NULL OR qid IS NULL OR v_key IS NULL OR v_key !~ '^[a-f0-9]{64}$' OR v_revision IS NULL THEN RAISE EXCEPTION 'Missing verified context';END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.sessions s JOIN public.user_profiles up ON up.id=s.user_id WHERE s.id=sid AND s.user_id=actor AND up.active AND (s.not_after IS NULL OR s.not_after>now())) THEN RAISE EXCEPTION 'Session revoked';END IF;
 -- Stable lock order: institution -> unit -> evaluation. Serializes shared balance across units.
 SELECT * INTO i FROM public.institutions WHERE id=tenant FOR UPDATE;
 IF NOT FOUND OR NOT i.active THEN RAISE EXCEPTION 'Institution unavailable';END IF;
 SELECT * INTO u FROM public.units_v2 WHERE id=uid AND institution_id=tenant FOR UPDATE;
 IF NOT FOUND OR NOT u.active THEN RAISE EXCEPTION 'Unit unavailable';END IF;
 SELECT * INTO p FROM public.participants_v2 WHERE id=pid FOR UPDATE;
 IF NOT FOUND OR p.institution_id IS DISTINCT FROM tenant OR p.unit_id IS DISTINCT FROM uid OR p.questionnaire_id IS DISTINCT FROM qid OR p.v1_revision IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Stored scope mismatch';END IF;
 IF NOT COALESCE((p.participant_user_id=actor OR EXISTS(SELECT 1 FROM public.platform_owners o WHERE o.user_id=actor AND o.active) OR (
 NOT EXISTS(SELECT 1 FROM public.user_permission_grants g JOIN public.institution_memberships m ON m.id=g.membership_id AND m.institution_id=g.institution_id WHERE m.user_id=actor AND m.institution_id=tenant AND m.active AND NOT m.scope_pending AND g.resource='lead' AND g.action='update' AND NOT g.allowed)
 AND EXISTS(SELECT 1 FROM public.institution_memberships m JOIN public.membership_unit_scopes mus ON mus.membership_id=m.id AND mus.institution_id=m.institution_id AND mus.unit_id=uid AND mus.active JOIN public.user_permission_grants g ON g.membership_id=m.id AND g.institution_id=m.institution_id
 WHERE m.user_id=actor AND m.institution_id=tenant AND m.active AND NOT m.scope_pending AND g.resource='lead' AND g.action='update' AND g.allowed AND (g.scope_type='institution' OR (g.scope_type='assigned_leads' AND p.assigned_user_id=actor)) AND (m.role_code IN ('institution_admin','unit_manager') OR (m.role_code='seller' AND p.assigned_user_id=actor))))),false) THEN RAISE EXCEPTION 'Unauthorized evaluation';END IF;
 IF NOT EXISTS(SELECT 1 FROM dna_private.evaluation_revisions er WHERE er.revision=v_revision AND er.questionnaire_id=qid AND er.source_hash=p_command->>'revisionSourceHash' AND er.completion_enabled) THEN RAISE EXCEPTION 'Revision unavailable';END IF;
 IF p.v1_registration IS NULL OR p_command->'snapshot'->'registration' IS DISTINCT FROM p.v1_registration OR p_command->'snapshot'->'scope'->>'participantId' IS DISTINCT FROM pid::text OR p_command->'snapshot'->'scope'->>'institutionId' IS DISTINCT FROM tenant::text OR p_command->'snapshot'->'scope'->>'unitId' IS DISTINCT FROM uid::text OR p_command->'snapshot'->'scope'->'assignedUserId' IS DISTINCT FROM COALESCE(to_jsonb(p.assigned_user_id),'null'::jsonb) OR p_command->'snapshot'->>'snapshot' IS DISTINCT FROM v_key OR p_command->'snapshot'->'analysis'->>'revision' IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Server snapshot mismatch';END IF;
 IF jsonb_typeof(p_command->'answers') IS DISTINCT FROM 'array' OR jsonb_array_length(p_command->'answers')<>15 OR (SELECT count(DISTINCT a->>'questionId') FROM jsonb_array_elements(p_command->'answers') a)<>15 THEN RAISE EXCEPTION 'All fifteen distinct answers required';END IF;
 -- Verify every alternative against the immutable revision and recompute scores as an integrity check.
 FOR v_answer IN SELECT value FROM jsonb_array_elements(p_command->'answers') LOOP
 IF jsonb_typeof(v_answer)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(v_answer))<>2 THEN RAISE EXCEPTION 'Invalid answer';END IF;
 SELECT ro.* INTO option_row FROM dna_private.revision_options ro JOIN public.questions q ON q.id=ro.question_id AND q.questionnaire_id=qid JOIN public.alternatives a ON a.id=ro.alternative_id AND a.question_id=q.id WHERE ro.revision=v_revision AND ro.question_key=v_answer->>'questionId' AND ro.alternative_key=v_answer->>'alternativeId';
 IF NOT FOUND THEN RAISE EXCEPTION 'Foreign or invalid alternative';END IF;
 FOREACH v_code IN ARRAY ARRAY['L','C','E','H','P'] LOOP
 weight:=COALESCE((option_row.weights->>v_code)::integer,0);IF weight<0 THEN RAISE EXCEPTION 'Invalid frozen weight';END IF;
 scores:=jsonb_set(scores,ARRAY[v_code],to_jsonb((scores->>v_code)::integer+weight));
 END LOOP;
 END LOOP;
 IF p_command->'scores' IS DISTINCT FROM scores OR p_command->'snapshot'->'analysis'->'scores' IS DISTINCT FROM scores THEN RAISE EXCEPTION 'Score tampering';END IF;
 fingerprint:=encode(sha256(convert_to((p_command-'actorId'-'sessionId')::text,'UTF8')),'hex');
 SELECT * INTO r FROM public.questionnaire_results WHERE participant_id=pid;
 IF FOUND THEN
 IF r.v1_revision IS NULL OR r.v1_fingerprint IS DISTINCT FROM fingerprint OR r.v1_snapshot_key IS DISTINCT FROM v_key OR NOT p.quiz_completed THEN RAISE EXCEPTION 'Historical or conflicting completion';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.credit_events_v2 e WHERE e.id=r.v1_debit_id AND e.participant_id=pid AND e.institution_id=tenant AND e.type='v1_consume' AND e.amount=-1) THEN RAISE EXCEPTION 'Inconsistent debit';END IF;
 RETURN jsonb_build_object('state','committed','snapshotKey',v_key,'debitId',r.v1_debit_id,'replay',true);
 END IF;
 IF p.quiz_completed THEN RAISE EXCEPTION 'Historical completed evaluation';END IF;
 -- Save validated draft answers even when balance is zero. No result/debit/completion in that case.
 INSERT INTO public.questionnaire_answers(questionnaire_id,participant_id,question_id,alternative_id)
 SELECT qid,pid,ro.question_id,ro.alternative_id FROM jsonb_array_elements(p_command->'answers') a JOIN dna_private.revision_options ro ON ro.revision=v_revision AND ro.question_key=a->>'questionId' AND ro.alternative_key=a->>'alternativeId'
 ON CONFLICT(participant_id,question_id) DO UPDATE SET alternative_id=EXCLUDED.alternative_id;
 SELECT COALESCE(sum(e.amount),0) INTO balance FROM public.credit_events_v2 e WHERE e.institution_id=tenant AND e.type IN ('v1_grant','v1_consume','v1_refund','v1_adjustment');
 SELECT -COALESCE(sum(e.amount),0) INTO unit_used FROM public.credit_events_v2 e WHERE e.institution_id=tenant AND e.unit_id=uid AND e.type IN ('v1_consume','v1_refund');
 IF i.credit_mode='unit_cap' AND u.credit_cap IS NULL THEN RAISE EXCEPTION 'Unit cap not configured';END IF;
 IF balance<1 OR (i.credit_mode='unit_cap' AND unit_used>=u.credit_cap) THEN
 INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,resource_id,reason,metadata) VALUES(tenant,actor,'evaluation_waiting_credit','evaluation',pid,'Validated answers retained',jsonb_build_object('revision',v_revision));
 RETURN jsonb_build_object('state','no_credit','answersSaved',true);
 END IF;
 SELECT max(value::integer) INTO maximum FROM jsonb_each_text(scores);
 SELECT count(*),min(k) INTO top_count,main_code FROM jsonb_each_text(scores) kv(k,v) WHERE v::integer=maximum;
 IF maximum<=0 OR top_count<>1 THEN main_code:=NULL;ELSE
 SELECT max(v::integer) INTO maximum FROM jsonb_each_text(scores) kv(k,v) WHERE k<>main_code;
 SELECT count(*),min(k) INTO second_count,second_code FROM jsonb_each_text(scores) kv(k,v) WHERE k<>main_code AND v::integer=maximum;
 IF second_count<>1 THEN second_code:=NULL;END IF;END IF;
 IF main_code IS NOT NULL THEN SELECT id INTO main_id FROM public.questionnaire_profiles qp WHERE qp.questionnaire_id=qid AND qp.code=main_code;END IF;
 IF second_code IS NOT NULL THEN SELECT id INTO second_id FROM public.questionnaire_profiles qp WHERE qp.questionnaire_id=qid AND qp.code=second_code;END IF;
 IF (main_code IS NOT NULL AND main_id IS NULL) OR (second_code IS NOT NULL AND second_id IS NULL) THEN RAISE EXCEPTION 'Profile mapping missing';END IF;
 IF main_code IS NOT NULL AND second_code IS NOT NULL THEN pair:=main_code||second_code;END IF;
 -- One ledger only. created_by remains NULL: its legacy FK references admin_users_v2, not Auth users.
 INSERT INTO public.credit_events_v2(institution_id,unit_id,participant_id,type,amount,description) VALUES(tenant,uid,pid,'v1_consume',-1,'Valid persisted V1 evaluation') RETURNING id INTO debit;
 INSERT INTO public.questionnaire_results(questionnaire_id,participant_id,scores,percentages,main_profile_id,secondary_profile_id,result_code,v1_revision,v1_snapshot,v1_snapshot_key,v1_fingerprint,v1_debit_id)
 VALUES(qid,pid,scores,'{}'::jsonb,main_id,second_id,pair,v_revision,p_command->'snapshot',v_key,fingerprint,debit);
 UPDATE public.participants_v2 SET quiz_completed=true,quiz_completed_at=now(),updated_at=now() WHERE id=pid;
 INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,resource_id,reason,metadata) VALUES(tenant,actor,'evaluation_completed','evaluation',pid,'Atomic completion',jsonb_build_object('revision',v_revision,'snapshotKey',v_key,'debitId',debit));
 RETURN jsonb_build_object('state','committed','snapshotKey',v_key,'debitId',debit,'replay',false);
END
$fn$;
REVOKE ALL ON FUNCTION public.dna_complete_evaluation_v1(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dna_complete_evaluation_v1(jsonb) TO service_role;
REVOKE ALL ON FUNCTION dna_private.freeze_v1_result(),dna_private.freeze_v1_answer(),dna_private.freeze_v1_credit() FROM PUBLIC,anon,authenticated;
COMMIT;
