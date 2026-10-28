BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='30s';
CREATE FUNCTION public.dna_list_evaluations(p_institution uuid)
RETURNS TABLE(id uuid,name text,quiz_completed boolean,updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $list$
BEGIN
 IF public.dna_current_session() IS NULL OR NOT dna_private.is_active_user() THEN RAISE EXCEPTION 'Live session required';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.institution_memberships m JOIN public.institutions i ON i.id=m.institution_id AND i.active
 WHERE m.user_id=auth.uid() AND m.institution_id=p_institution AND m.active AND NOT m.scope_pending) THEN RAISE EXCEPTION 'Institution unavailable';END IF;
 RETURN QUERY SELECT p.id,p.name,p.quiz_completed,p.updated_at FROM public.participants_v2 p
 WHERE p.institution_id=p_institution AND p.v1_revision IS NOT NULL
 AND dna_private.can_operate_participant(p.id,'lead','read') ORDER BY p.updated_at DESC,p.id LIMIT 100;
 INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,reason,metadata)
 VALUES(p_institution,auth.uid(),'evaluation_list','evaluation','Authorized scoped list',jsonb_build_object('limit',100));
END
$list$;
REVOKE ALL ON FUNCTION public.dna_list_evaluations(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dna_list_evaluations(uuid) TO authenticated;
COMMIT;
