-- Public participant adapter for the EXISTING frozen motor and shared atomic completion.
-- No historical answer, result, weight, question or credit event is rewritten.
BEGIN;
SET LOCAL lock_timeout='3s';SET LOCAL statement_timeout='30s';
ALTER TABLE public.participants_v2 ADD COLUMN v1_public_entry boolean NOT NULL DEFAULT false;
CREATE TABLE public.report_editorial_approvals(version text PRIMARY KEY,source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),approved_by text NOT NULL,approved_at timestamptz NOT NULL DEFAULT now(),active boolean NOT NULL DEFAULT false);
ALTER TABLE public.report_editorial_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_editorial_approvals FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.report_editorial_approvals TO service_role;
CREATE TABLE dna_private.public_entrypoints(key text PRIMARY KEY,institution_id uuid NOT NULL REFERENCES public.institutions(id),unit_id uuid NOT NULL,assigned_user_id uuid NOT NULL REFERENCES public.user_profiles(id),revision text NOT NULL REFERENCES dna_private.evaluation_revisions(revision),editorial_version text NOT NULL REFERENCES public.report_editorial_approvals(version),enabled boolean NOT NULL DEFAULT false,FOREIGN KEY(unit_id,institution_id) REFERENCES public.units_v2(id,institution_id));
REVOKE ALL ON dna_private.public_entrypoints FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO public.report_editorial_approvals(version,source_hash,approved_by) VALUES('dna-restored-humanized-2026-10-28.v2.public-1','2d92ff20d55445a1df410eb3ed1fad65b7854723880d30d1957baf82863c9fd2','Solicitacao explicita do proprietario para uso real em 28/10/2026');
-- Bind by existing named unit and the existing active seller membership, not generated IDs.
INSERT INTO dna_private.public_entrypoints(key,institution_id,unit_id,assigned_user_id,revision,editorial_version)
SELECT 'website',u.institution_id,u.id,up.id,r.revision,'dna-restored-humanized-2026-10-28.v2.public-1'
FROM public.units_v2 u JOIN public.institution_memberships m ON m.institution_id=u.institution_id AND m.active AND NOT m.scope_pending AND m.role_code='seller'
JOIN public.user_profiles up ON up.id=m.user_id AND up.active JOIN auth.users au ON au.id=up.id
CROSS JOIN dna_private.evaluation_revisions r WHERE u.slug='unifecaf-sinop-piloto' AND u.active AND lower(au.email)='roberta@msdeducacao.com.br' AND r.revision='dna-official-2026-10-26.v1';
DO $$ BEGIN IF (SELECT count(*) FROM dna_private.public_entrypoints WHERE key='website')<>1 THEN RAISE EXCEPTION 'Public entry scope must be unambiguous';END IF;END $$;
CREATE FUNCTION public.dna_public_entry_context() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $context$
 SELECT jsonb_build_object('institutionId',i.id,'institutionName',i.name,'unitId',u.id,'unitName',u.name,'assignedUserId',ep.assigned_user_id,'revision',ep.revision,'questionnaireId',er.questionnaire_id,'sourceHash',er.source_hash,'editorialVersion',ea.version,'editorialSourceHash',ea.source_hash)
 FROM dna_private.public_entrypoints ep JOIN public.institutions i ON i.id=ep.institution_id AND i.active JOIN public.units_v2 u ON u.id=ep.unit_id AND u.institution_id=i.id AND u.active
 JOIN dna_private.evaluation_revisions er ON er.revision=ep.revision AND er.completion_enabled JOIN public.report_editorial_approvals ea ON ea.version=ep.editorial_version AND ea.active
 WHERE ep.key='website' AND ep.enabled AND EXISTS(SELECT 1 FROM public.user_profiles up JOIN public.institution_memberships m ON m.user_id=up.id AND m.institution_id=i.id AND m.active AND NOT m.scope_pending
 JOIN public.membership_unit_scopes mus ON mus.membership_id=m.id AND mus.unit_id=u.id AND mus.active
 JOIN public.user_permission_grants g ON g.membership_id=m.id AND g.resource='commercial_report' AND g.action='read' AND g.allowed AND g.scope_type='assigned_leads'
 WHERE up.id=ep.assigned_user_id AND up.active AND m.role_code='seller')
$context$;
REVOKE ALL ON FUNCTION public.dna_public_entry_context() FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_public_entry_context() TO service_role;
CREATE FUNCTION public.dna_register_public_evaluation(p_registration jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $register$
DECLARE c jsonb;pid uuid;
BEGIN
 c:=public.dna_public_entry_context();IF c IS NULL THEN RAISE EXCEPTION 'Public journey unavailable';END IF;
 IF jsonb_typeof(p_registration) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_registration) k WHERE k NOT IN ('name','phone','email','city','escolaridade','course_interest','objective','priorCourse','orientationMode','declaredArea'))
 OR octet_length(p_registration::text)>8192 THEN RAISE EXCEPTION 'Invalid registration';END IF;
 IF jsonb_typeof(p_registration->'name') IS DISTINCT FROM 'string' OR length(btrim(p_registration->>'name')) NOT BETWEEN 2 AND 250
 OR jsonb_typeof(p_registration->'phone') IS DISTINCT FROM 'string' OR regexp_replace(p_registration->>'phone','[^0-9]','','g') !~ '^[0-9]{10,13}$'
 OR jsonb_typeof(p_registration->'email') IS DISTINCT FROM 'string' OR length(p_registration->>'email')>250 OR p_registration->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 OR p_registration->>'orientationMode' IS NULL OR p_registration->>'orientationMode' NOT IN ('declared_interest','area_undecided','undefined_interest')
 THEN RAISE EXCEPTION 'Invalid required registration';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(p_registration) e WHERE e.key NOT IN ('name','phone','email') AND (jsonb_typeof(e.value) NOT IN ('null','string') OR length(e.value#>>'{}')>500)) THEN RAISE EXCEPTION 'Invalid registration field';END IF;
 IF (p_registration->>'orientationMode'='declared_interest' AND nullif(btrim(p_registration->>'course_interest'),'') IS NULL)
 OR (p_registration->>'orientationMode'='area_undecided' AND nullif(btrim(p_registration->>'declaredArea'),'') IS NULL)
 OR (p_registration->>'orientationMode'='undefined_interest' AND (nullif(btrim(p_registration->>'course_interest'),'') IS NOT NULL OR nullif(btrim(p_registration->>'declaredArea'),'') IS NOT NULL)) THEN RAISE EXCEPTION 'Inconsistent declared interests';END IF;

 PERFORM pg_advisory_xact_lock(hashtextextended('dna-public-registration:'||(c->>'unitId'),0));
 IF (SELECT count(*) FROM public.participants_v2 WHERE v1_public_entry AND unit_id=(c->>'unitId')::uuid AND created_at>now()-interval '1 hour')>=100
 OR (SELECT count(*) FROM public.participants_v2 WHERE v1_public_entry AND unit_id=(c->>'unitId')::uuid AND lower(email)=lower(btrim(p_registration->>'email')) AND created_at>now()-interval '1 day')>=5
 THEN RAISE EXCEPTION 'Registration limit reached';END IF;
 INSERT INTO public.participants_v2(questionnaire_id,name,phone,email,city,escolaridade,course_interest,institution_id,unit_id,assigned_user_id,v1_revision,v1_registration,v1_public_entry)
 VALUES((c->>'questionnaireId')::uuid,btrim(p_registration->>'name'),p_registration->>'phone',lower(btrim(p_registration->>'email')),p_registration->>'city',p_registration->>'escolaridade',p_registration->>'course_interest',(c->>'institutionId')::uuid,(c->>'unitId')::uuid,(c->>'assignedUserId')::uuid,c->>'revision',p_registration,true) RETURNING id INTO pid;
 INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,resource_id,reason,metadata) VALUES((c->>'institutionId')::uuid,NULL,'public_evaluation_registered','evaluation',pid,'Participant self-registration',jsonb_build_object('revision',c->>'revision'));
 RETURN pid;
END $register$;
REVOKE ALL ON FUNCTION public.dna_register_public_evaluation(jsonb) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_register_public_evaluation(jsonb) TO service_role;
CREATE FUNCTION dna_private.complete_evaluation_v1(p_command jsonb,p_public boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
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
 IF pid IS NULL OR tenant IS NULL OR uid IS NULL OR qid IS NULL OR v_key IS NULL OR v_key !~ '^[a-f0-9]{64}$' OR v_revision IS NULL THEN RAISE EXCEPTION 'Missing verified context';END IF;
 IF p_public THEN
 IF actor IS NOT NULL OR sid IS NOT NULL THEN RAISE EXCEPTION 'Public completion cannot impersonate a team member';END IF;
 ELSE
 IF actor IS NULL OR sid IS NULL THEN RAISE EXCEPTION 'Live team session required';END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.sessions s JOIN public.user_profiles up ON up.id=s.user_id WHERE s.id=sid AND s.user_id=actor AND up.active AND (s.not_after IS NULL OR s.not_after>now())) THEN RAISE EXCEPTION 'Session revoked';END IF;
 END IF;
 -- Stable lock order: institution -> unit -> evaluation. Serializes shared balance across units.
 SELECT * INTO i FROM public.institutions WHERE id=tenant FOR UPDATE;
 IF NOT FOUND OR NOT i.active THEN RAISE EXCEPTION 'Institution unavailable';END IF;
 SELECT * INTO u FROM public.units_v2 WHERE id=uid AND institution_id=tenant FOR UPDATE;
 IF NOT FOUND OR NOT u.active THEN RAISE EXCEPTION 'Unit unavailable';END IF;
 SELECT * INTO p FROM public.participants_v2 WHERE id=pid FOR UPDATE;
 IF NOT FOUND OR p.institution_id IS DISTINCT FROM tenant OR p.unit_id IS DISTINCT FROM uid OR p.questionnaire_id IS DISTINCT FROM qid OR p.v1_revision IS DISTINCT FROM v_revision THEN RAISE EXCEPTION 'Stored scope mismatch';END IF;
 IF p_public THEN
 IF NOT p.v1_public_entry OR NOT EXISTS(SELECT 1 FROM dna_private.public_entrypoints ep JOIN public.report_editorial_approvals ea ON ea.version=ep.editorial_version AND ea.active
 WHERE ep.enabled AND ep.institution_id=tenant AND ep.unit_id=uid AND ep.assigned_user_id=p.assigned_user_id AND ep.revision=v_revision
 AND ep.editorial_version=p_command->'snapshot'->'publication'->>'version' AND ea.source_hash=p_command->'snapshot'->'publication'->>'sourceHash')
 THEN RAISE EXCEPTION 'Public journey unavailable';END IF;
 ELSE
 IF NOT COALESCE((p.participant_user_id=actor OR EXISTS(SELECT 1 FROM public.platform_owners o WHERE o.user_id=actor AND o.active) OR (
 NOT EXISTS(SELECT 1 FROM public.user_permission_grants g JOIN public.institution_memberships m ON m.id=g.membership_id AND m.institution_id=g.institution_id WHERE m.user_id=actor AND m.institution_id=tenant AND m.active AND NOT m.scope_pending AND g.resource='lead' AND g.action='update' AND NOT g.allowed)
 AND EXISTS(SELECT 1 FROM public.institution_memberships m JOIN public.membership_unit_scopes mus ON mus.membership_id=m.id AND mus.institution_id=m.institution_id AND mus.unit_id=uid AND mus.active JOIN public.user_permission_grants g ON g.membership_id=m.id AND g.institution_id=m.institution_id
 WHERE m.user_id=actor AND m.institution_id=tenant AND m.active AND NOT m.scope_pending AND g.resource='lead' AND g.action='update' AND g.allowed AND (g.scope_type='institution' OR (g.scope_type='assigned_leads' AND p.assigned_user_id=actor)) AND (m.role_code IN ('institution_admin','unit_manager') OR (m.role_code='seller' AND p.assigned_user_id=actor))))),false) THEN RAISE EXCEPTION 'Unauthorized evaluation';END IF;
 END IF;
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

REVOKE ALL ON FUNCTION dna_private.complete_evaluation_v1(jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.dna_complete_evaluation_v1(p_command jsonb) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT dna_private.complete_evaluation_v1(p_command,false) $$;
CREATE FUNCTION public.dna_complete_public_evaluation_v1(p_command jsonb) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT dna_private.complete_evaluation_v1(p_command,true) $$;
REVOKE ALL ON FUNCTION public.dna_complete_public_evaluation_v1(jsonb) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_complete_public_evaluation_v1(jsonb) TO service_role;
CREATE FUNCTION public.dna_save_public_evaluation_draft(p_participant uuid,p_revision text,p_answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $draft$
DECLARE p public.participants_v2%ROWTYPE; a jsonb;
BEGIN
 SELECT * INTO p FROM public.participants_v2 WHERE id=p_participant FOR UPDATE;
 IF NOT FOUND OR NOT p.v1_public_entry OR p.quiz_completed OR p.v1_revision IS DISTINCT FROM p_revision OR p_revision IS NULL THEN
   RAISE EXCEPTION 'Evaluation unavailable';
 END IF;
 IF jsonb_typeof(p_answers) IS DISTINCT FROM 'array' OR jsonb_array_length(p_answers)>15 THEN RAISE EXCEPTION 'Invalid answers';END IF;
 IF (SELECT count(DISTINCT value->>'questionId') FROM jsonb_array_elements(p_answers))<>jsonb_array_length(p_answers) THEN RAISE EXCEPTION 'Duplicate question';END IF;
 FOR a IN SELECT value FROM jsonb_array_elements(p_answers) LOOP
   IF jsonb_typeof(a) IS DISTINCT FROM 'object' OR (SELECT count(*) FROM jsonb_object_keys(a))<>2
   OR NOT EXISTS(SELECT 1 FROM dna_private.revision_options o JOIN dna_private.evaluation_revisions r ON r.revision=o.revision
       WHERE o.revision=p_revision AND r.questionnaire_id=p.questionnaire_id AND o.question_key=a->>'questionId' AND o.alternative_key=a->>'alternativeId')
   THEN RAISE EXCEPTION 'Invalid revision answer';END IF;
 END LOOP;
 UPDATE public.participants_v2 SET v1_draft_answers=p_answers,updated_at=now() WHERE id=p_participant;
 RETURN jsonb_build_object('saved',true,'answerCount',jsonb_array_length(p_answers));
END
$draft$;

REVOKE ALL ON FUNCTION public.dna_save_public_evaluation_draft(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_save_public_evaluation_draft(uuid,text,jsonb) TO service_role;
COMMIT;
