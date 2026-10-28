BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='30s';
CREATE FUNCTION public.dna_register_evaluation_draft(p_unit uuid,p_revision text,p_registration jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $register$
DECLARE u public.units_v2%ROWTYPE; r dna_private.evaluation_revisions%ROWTYPE; pid uuid;
BEGIN
 IF public.dna_current_session() IS NULL OR NOT dna_private.is_active_user() THEN RAISE EXCEPTION 'Live session required';END IF;
 SELECT * INTO u FROM public.units_v2 WHERE id=p_unit AND active FOR SHARE;
 IF NOT FOUND OR u.institution_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.institutions i WHERE i.id=u.institution_id AND i.active) THEN RAISE EXCEPTION 'Unit unavailable';END IF;
 IF NOT EXISTS(
  SELECT 1 FROM public.institution_memberships m
  JOIN public.membership_unit_scopes s ON s.membership_id=m.id AND s.institution_id=m.institution_id AND s.unit_id=u.id AND s.active
  JOIN public.user_permission_grants g ON g.membership_id=m.id AND g.institution_id=m.institution_id
  WHERE m.user_id=auth.uid() AND m.institution_id=u.institution_id AND m.active AND NOT m.scope_pending
  AND m.role_code IN ('institution_admin','unit_manager') AND g.resource='lead' AND g.action='create' AND g.scope_type='institution' AND g.allowed
 ) OR EXISTS(SELECT 1 FROM public.user_permission_grants g JOIN public.institution_memberships m ON m.id=g.membership_id
    WHERE m.user_id=auth.uid() AND m.institution_id=u.institution_id AND m.active AND NOT m.scope_pending AND g.resource='lead' AND g.action='create' AND NOT g.allowed)
 THEN RAISE EXCEPTION 'Registration not authorized';END IF;
 SELECT * INTO r FROM dna_private.evaluation_revisions WHERE revision=p_revision;
 IF NOT FOUND THEN RAISE EXCEPTION 'Revision unavailable';END IF;
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
 INSERT INTO public.participants_v2(questionnaire_id,name,phone,email,city,escolaridade,course_interest,institution_id,unit_id,assigned_user_id,v1_revision,v1_registration)
 VALUES(r.questionnaire_id,btrim(p_registration->>'name'),p_registration->>'phone',lower(btrim(p_registration->>'email')),p_registration->>'city',p_registration->>'escolaridade',p_registration->>'course_interest',u.institution_id,u.id,auth.uid(),p_revision,p_registration) RETURNING id INTO pid;
 INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,resource_id,reason,metadata)
 VALUES(u.institution_id,auth.uid(),'evaluation_registered','evaluation',pid,'Individual scoped registration',jsonb_build_object('revision',p_revision,'unitId',u.id));
 RETURN pid;
END
$register$;
REVOKE ALL ON FUNCTION public.dna_register_evaluation_draft(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dna_register_evaluation_draft(uuid,text,jsonb) TO authenticated;
COMMIT;
