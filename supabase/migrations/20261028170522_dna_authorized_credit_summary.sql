BEGIN;
SET LOCAL lock_timeout='3s';SET LOCAL statement_timeout='30s';
CREATE FUNCTION public.dna_credit_summary(p_institution uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $credits$
DECLARE balance bigint; events jsonb;
BEGIN
 IF public.dna_current_session() IS NULL OR NOT dna_private.is_active_user() THEN RAISE EXCEPTION 'Live session required';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.institution_memberships m JOIN public.institutions i ON i.id=m.institution_id AND i.active
 WHERE m.user_id=auth.uid() AND m.institution_id=p_institution AND m.active AND NOT m.scope_pending AND m.role_code='institution_admin') THEN RAISE EXCEPTION 'Administrator required';END IF;
 SELECT coalesce(sum(amount),0) INTO balance FROM public.credit_events_v2 WHERE institution_id=p_institution AND type IN ('v1_grant','v1_consume','v1_refund','v1_adjustment');
 SELECT coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) INTO events FROM(
 SELECT id,type,amount,created_at FROM public.credit_events_v2 WHERE institution_id=p_institution
 AND type IN ('v1_grant','v1_consume','v1_refund','v1_adjustment') ORDER BY created_at DESC,id LIMIT 25)e;
 RETURN jsonb_build_object('balance',balance,'events',events);
END
$credits$;
REVOKE ALL ON FUNCTION public.dna_credit_summary(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dna_credit_summary(uuid) TO authenticated;
COMMIT;
