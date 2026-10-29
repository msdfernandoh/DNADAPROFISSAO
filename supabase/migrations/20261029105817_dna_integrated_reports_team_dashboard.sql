BEGIN;
CREATE TABLE public.evaluation_editorial_editions(
 participant_id uuid NOT NULL REFERENCES public.participants_v2(id),
 version text NOT NULL REFERENCES public.report_editorial_approvals(version),
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 publication jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(participant_id,version),
 CHECK(publication->>'version'=version AND publication->>'sourceHash'=source_hash AND jsonb_array_length(publication->'participant')=9 AND jsonb_array_length(publication->'commercial')=9)
);
ALTER TABLE public.evaluation_editorial_editions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.evaluation_editorial_editions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.evaluation_editorial_editions TO service_role;
CREATE FUNCTION dna_private.keep_editorial_edition() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'Editorial editions are immutable; publish a new version';END $$;
CREATE TRIGGER keep_editorial_edition BEFORE UPDATE OR DELETE ON public.evaluation_editorial_editions FOR EACH ROW EXECUTE FUNCTION dna_private.keep_editorial_edition();
REVOKE ALL ON FUNCTION dna_private.keep_editorial_edition() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.dna_store_editorial_edition(p_participant uuid,p_publication jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE saved jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.participants_v2 p JOIN public.questionnaire_results r ON r.participant_id=p.id JOIN public.credit_events_v2 e ON e.id=r.v1_debit_id AND e.participant_id=p.id AND e.type='v1_consume' AND e.amount=-1 WHERE p.id=p_participant AND p.quiz_completed AND r.v1_snapshot IS NOT NULL) THEN RAISE EXCEPTION 'Persisted completed result required';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.report_editorial_approvals a WHERE a.version=p_publication->>'version' AND a.source_hash=p_publication->>'sourceHash' AND a.active) THEN RAISE EXCEPTION 'Approved editorial required';END IF;
 INSERT INTO public.evaluation_editorial_editions(participant_id,version,source_hash,publication) VALUES(p_participant,p_publication->>'version',p_publication->>'sourceHash',p_publication) ON CONFLICT DO NOTHING;
 SELECT publication INTO STRICT saved FROM public.evaluation_editorial_editions WHERE participant_id=p_participant AND version=p_publication->>'version';RETURN saved;
END $$;
REVOKE ALL ON FUNCTION public.dna_store_editorial_edition(uuid,jsonb) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_store_editorial_edition(uuid,jsonb) TO service_role;

CREATE FUNCTION public.dna_team_dashboard(p_institution uuid,p_filter text DEFAULT 'all',p_after timestamptz DEFAULT NULL,p_after_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF public.dna_current_session() IS NULL OR NOT dna_private.is_active_user() OR NOT EXISTS(SELECT 1 FROM public.institution_memberships m JOIN public.institutions i ON i.id=m.institution_id AND i.active WHERE m.user_id=auth.uid() AND m.institution_id=p_institution AND m.active AND NOT m.scope_pending) THEN RAISE EXCEPTION 'Live institution membership required';END IF;
 IF p_filter NOT IN('all','report','enrolled') OR p_filter IS NULL OR (p_after IS NULL)<>(p_after_id IS NULL) THEN RAISE EXCEPTION 'Invalid dashboard filter';END IF;
 WITH visible AS MATERIALIZED(
 SELECT p.id,p.name,p.quiz_completed,p.status,p.updated_at,
 EXISTS(SELECT 1 FROM public.questionnaire_results r WHERE r.participant_id=p.id AND r.v1_snapshot IS NOT NULL AND r.v1_debit_id IS NOT NULL) AS has_report,
 dna_private.can_operate_participant(p.id,'lead','update') AS can_update
 FROM public.participants_v2 p WHERE p.institution_id=p_institution AND p.v1_revision IS NOT NULL AND dna_private.can_operate_participant(p.id,'lead','read')
 ),matches AS(SELECT * FROM visible WHERE (p_filter='all' OR p_filter='report' AND has_report OR p_filter='enrolled' AND status='Matriculado') AND (p_after IS NULL OR (updated_at,id)<(p_after,p_after_id)) ORDER BY updated_at DESC,id DESC LIMIT 51),page AS(SELECT * FROM matches ORDER BY updated_at DESC,id DESC LIMIT 50)
 SELECT jsonb_build_object('counts',jsonb_build_object('all',(SELECT count(*) FROM visible),'report',(SELECT count(*) FROM visible WHERE has_report),'enrolled',(SELECT count(*) FROM visible WHERE status='Matriculado')),'leads',(SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.updated_at DESC,p.id DESC),'[]') FROM page p),'nextCursor',CASE WHEN (SELECT count(*) FROM matches)>50 THEN(SELECT jsonb_build_object('updatedAt',updated_at,'id',id) FROM page ORDER BY updated_at,id LIMIT 1) ELSE NULL END) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.dna_team_dashboard(uuid,text,timestamptz,uuid) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_team_dashboard(uuid,text,timestamptz,uuid) TO authenticated;
COMMIT;

CREATE OR REPLACE FUNCTION public.dna_get_follow_up(p_participant uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $follow$
DECLARE p public.participants_v2%ROWTYPE; history jsonb;
BEGIN
 IF NOT dna_private.can_operate_participant(p_participant,'lead','read') THEN RAISE EXCEPTION 'Participant unavailable';END IF;
 SELECT * INTO STRICT p FROM public.participants_v2 WHERE id=p_participant;
 SELECT coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) INTO history FROM(
  SELECT a.created_at,up.display_name AS author,a.metadata->>'previousStatus' AS previous_status,a.metadata->>'status' AS status,
   coalesce((a.metadata->>'notesChanged')::boolean,false) AS notes_changed
  FROM public.access_audit_events a LEFT JOIN public.user_profiles up ON up.id=a.actor_user_id
  WHERE a.institution_id=p.institution_id AND a.resource_id=p.id AND a.action='follow_up_updated'
  ORDER BY a.created_at DESC,a.id LIMIT 30)e;
 RETURN jsonb_build_object('id',p.id,'name',p.name,'status',p.status,'notes',p.notes,'updatedAt',p.updated_at,'history',history,
  'hasReport',EXISTS(SELECT 1 FROM public.questionnaire_results r WHERE r.participant_id=p.id AND r.v1_snapshot IS NOT NULL AND r.v1_debit_id IS NOT NULL),'canUpdate',dna_private.can_operate_participant(p.id,'lead','update'));
END
$follow$;
