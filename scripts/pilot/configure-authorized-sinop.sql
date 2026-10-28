-- Authorized by Fernando in this chat on 2026-10-28.
-- Execute only after all three Auth identities exist. No passwords or historic lead assignment.
BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='30s';
DO $pilot$
DECLARE tenant uuid; unit uuid; owner_id uuid; person record; member uuid; event_id uuid;
 reason_text constant text := 'Fernando authorization 2026-10-28: Sinop pilot, named accounts and 1000 test credits without commercial charge';
BEGIN
 SELECT id INTO STRICT tenant FROM public.institutions WHERE slug='unifecaf-sinop' AND active FOR UPDATE;
 SELECT id INTO STRICT unit FROM public.units_v2 WHERE slug='unifecaf-sinop-piloto' AND institution_id=tenant AND active;
 SELECT id INTO STRICT owner_id FROM auth.users WHERE lower(email)='msdfernando@gmail.com';
 IF NOT EXISTS(SELECT 1 FROM public.platform_owners WHERE user_id=owner_id AND active) THEN RAISE EXCEPTION 'Existing global owner required';END IF;
 IF (SELECT count(*) FROM auth.users WHERE lower(email) IN ('msdfernando@gmail.com','msdcarla@gmail.com','roberta@msdeducacao.com.br'))<>3 THEN RAISE EXCEPTION 'All three authorized Auth identities must exist';END IF;
 IF (SELECT count(*) FROM auth.users u JOIN public.user_profiles p ON p.id=u.id AND p.active WHERE lower(u.email) IN ('msdfernando@gmail.com','msdcarla@gmail.com','roberta@msdeducacao.com.br'))<>3 THEN RAISE EXCEPTION 'All three authorized profiles must be active';END IF;
 FOR person IN SELECT u.id,u.email,CASE WHEN lower(u.email)='roberta@msdeducacao.com.br' THEN 'seller' ELSE 'institution_admin' END AS role_code
 FROM auth.users u JOIN public.user_profiles p ON p.id=u.id AND p.active
 WHERE lower(u.email) IN ('msdfernando@gmail.com','msdcarla@gmail.com','roberta@msdeducacao.com.br') LOOP
  INSERT INTO public.institution_memberships(institution_id,user_id,role_code,active,scope_pending)
  VALUES(tenant,person.id,person.role_code,true,false)
  ON CONFLICT(institution_id,user_id) DO UPDATE SET role_code=EXCLUDED.role_code,active=true,scope_pending=false
  RETURNING id INTO member;
  INSERT INTO public.membership_unit_scopes(membership_id,institution_id,unit_id,active) VALUES(member,tenant,unit,true)
  ON CONFLICT(membership_id,unit_id) DO UPDATE SET active=true;
  INSERT INTO public.user_permission_grants(membership_id,institution_id,resource,action,scope_type,allowed,granted_by,reason)
  SELECT member,tenant,permission.resource,permission.action,
  CASE WHEN person.role_code='seller' THEN 'assigned_leads' ELSE 'institution' END,true,owner_id,reason_text
  FROM (VALUES('lead','read'),('lead','update'),('commercial_report','read'),('participant_report','read'),('lead','create')) permission(resource,action)
  WHERE person.role_code<>'seller' OR permission.action<>'create'
  ON CONFLICT(membership_id,resource,action,scope_type) DO UPDATE SET allowed=true,granted_by=EXCLUDED.granted_by,reason=EXCLUDED.reason;
  INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,resource_id,reason,metadata)
  VALUES(tenant,owner_id,'pilot_scope_configured','membership',member,reason_text,jsonb_build_object('unitId',unit,'role',person.role_code,'subjectId',person.id));
 END LOOP;
 -- Stable business marker prevents repeated grants. Lock above serializes retries.
 IF NOT EXISTS(SELECT 1 FROM public.credit_events_v2 WHERE institution_id=tenant AND type='v1_grant' AND description='sinop-test-grant-2026-10-28-1000') THEN
  INSERT INTO public.credit_events_v2(institution_id,type,amount,description)
  VALUES(tenant,'v1_grant',1000,'sinop-test-grant-2026-10-28-1000') RETURNING id INTO event_id;
  INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,resource_id,reason,metadata)
  VALUES(tenant,owner_id,'pilot_test_credits_granted','credit_event',event_id,reason_text,jsonb_build_object('amount',1000,'commercialCharge',false));
 END IF;
END
$pilot$;
COMMIT;
