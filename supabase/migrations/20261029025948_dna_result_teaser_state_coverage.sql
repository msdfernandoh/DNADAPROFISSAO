-- Coverage and business contacts are separate from immutable participant results.
CREATE TABLE public.unit_state_coverage(institution_id uuid NOT NULL REFERENCES public.institutions(id),state text NOT NULL CHECK(state IN('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),unit_id uuid NOT NULL REFERENCES public.units_v2(id),PRIMARY KEY(institution_id,state));
CREATE TABLE public.seller_whatsapp_contacts(user_id uuid PRIMARY KEY REFERENCES public.user_profiles(id),phone text NOT NULL CHECK(phone ~ '^55[0-9]{10,11}$'));
CREATE TABLE public.unit_principal_sellers(unit_id uuid PRIMARY KEY REFERENCES public.units_v2(id),user_id uuid NOT NULL REFERENCES public.user_profiles(id));
ALTER TABLE public.unit_state_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_principal_sellers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.unit_state_coverage,public.seller_whatsapp_contacts,public.unit_principal_sellers FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.unit_state_coverage,public.seller_whatsapp_contacts,public.unit_principal_sellers TO service_role;

CREATE FUNCTION dna_private.unit_has_public_credit(tenant uuid,uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM dna_private.public_entrypoints WHERE institution_id=tenant AND unit_id=uid AND key='website') OR EXISTS(SELECT 1 FROM public.credit_events_v2 WHERE institution_id=tenant AND unit_id=uid AND type IN('v1_grant','v1_adjustment') AND amount>0)
$$;
REVOKE ALL ON FUNCTION dna_private.unit_has_public_credit(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION dna_private.authorized_unit_person(tenant uuid,uid uuid,person uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_profiles up JOIN public.institution_memberships m ON m.user_id=up.id AND m.institution_id=tenant AND m.active AND NOT m.scope_pending
 JOIN public.membership_unit_scopes s ON s.membership_id=m.id AND s.unit_id=uid AND s.institution_id=tenant AND s.active WHERE up.id=person AND up.active
 AND EXISTS(SELECT 1 FROM public.user_permission_grants g WHERE g.membership_id=m.id AND g.resource='commercial_report' AND g.action='read' AND g.allowed)
 AND NOT EXISTS(SELECT 1 FROM public.user_permission_grants g WHERE g.membership_id=m.id AND g.resource='commercial_report' AND g.action='read' AND NOT g.allowed))
$$;
REVOKE ALL ON FUNCTION dna_private.authorized_unit_person(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.dna_resolve_public_route(p_city text,p_vendor text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $route$
DECLARE c jsonb;tenant uuid;uid uuid;seller uuid;city text;uf text;route text;v public.personal_vendor_routes%ROWTYPE;
BEGIN
 c:=public.dna_public_entry_context();IF c IS NULL THEN RAISE EXCEPTION 'Public entry unavailable';END IF;tenant:=(c->>'institutionId')::uuid;
 IF nullif(btrim(p_vendor),'') IS NOT NULL THEN
 SELECT * INTO v FROM public.personal_vendor_routes WHERE slug=p_vendor AND active AND institution_id=tenant;
 IF NOT FOUND THEN RAISE EXCEPTION 'Personal seller link unavailable; never redistribute this lead';END IF;
 uid:=v.unit_id;seller:=v.user_id;route:='personal_link';
 IF NOT dna_private.authorized_unit_person(tenant,uid,seller) THEN RAISE EXCEPTION 'Personal seller not eligible';END IF;
 ELSE
 SELECT ibge_code,state INTO city,uf FROM public.city_catalog WHERE dna_private.city_key(name||', '||state)=dna_private.city_key(regexp_replace(coalesce(p_city,''),'[[:space:]]*[/,][[:space:]]*',', ','g'));
 SELECT id INTO uid FROM public.units_v2 WHERE institution_id=tenant AND active AND city_ibge_code=city AND dna_private.unit_has_public_credit(tenant,id);
 IF uid IS NOT NULL THEN route:='own_city';ELSE
 SELECT coverage.unit_id INTO uid FROM public.unit_city_coverage coverage JOIN public.units_v2 u ON u.id=coverage.unit_id AND u.institution_id=tenant AND u.active WHERE coverage.institution_id=tenant AND coverage.city_ibge_code=city AND dna_private.unit_has_public_credit(tenant,u.id);
 IF uid IS NOT NULL THEN route:='neighbor_city';ELSE
 SELECT coverage.unit_id INTO uid FROM public.unit_state_coverage coverage JOIN public.units_v2 u ON u.id=coverage.unit_id AND u.institution_id=tenant AND u.active WHERE coverage.institution_id=tenant AND coverage.state=uf AND dna_private.unit_has_public_credit(tenant,u.id);
 IF uid IS NOT NULL THEN route:='state_coverage';ELSE uid:=(c->>'unitId')::uuid;route:='mother_unit';END IF;END IF;END IF;
 SELECT e.user_id INTO seller FROM dna_private.eligible_unit_sellers(tenant,uid)e ORDER BY random() LIMIT 1;
 IF seller IS NULL THEN SELECT p.user_id INTO seller FROM public.unit_principal_sellers p WHERE p.unit_id=uid AND dna_private.authorized_unit_person(tenant,uid,p.user_id);END IF;
 IF seller IS NULL THEN RAISE EXCEPTION 'Selected unit has no enabled seller; do not send to another unit';END IF;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.units_v2 WHERE id=uid AND institution_id=tenant AND active) THEN RAISE EXCEPTION 'Unit unavailable';END IF;
 RETURN c||jsonb_build_object('unitId',uid,'unitName',(SELECT name FROM public.units_v2 WHERE id=uid),'assignedUserId',seller,'route',route,'cityIbgeCode',city);
END $route$;

CREATE FUNCTION public.dna_set_state_coverage(p_state text,p_unit uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE tenant uuid;
BEGIN
 tenant:=dna_private.require_unit_admin();
 IF NOT EXISTS(SELECT 1 FROM public.platform_owners WHERE user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Master admin required';END IF;
 IF p_state NOT IN('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') OR p_state IS NULL THEN RAISE EXCEPTION 'Invalid state';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('dna-unit-geography:'||tenant,0));
 IF p_unit IS NULL THEN DELETE FROM public.unit_state_coverage WHERE institution_id=tenant AND state=p_state;
 ELSE
 IF NOT EXISTS(SELECT 1 FROM public.units_v2 WHERE id=p_unit AND institution_id=tenant AND active AND dna_private.unit_has_public_credit(tenant,id)) THEN RAISE EXCEPTION 'Active credited unit required';END IF;
 INSERT INTO public.unit_state_coverage VALUES(tenant,p_state,p_unit) ON CONFLICT(institution_id,state) DO UPDATE SET unit_id=excluded.unit_id;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.dna_set_state_coverage(text,uuid) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_set_state_coverage(text,uuid) TO authenticated;

CREATE FUNCTION public.dna_list_unit_contacts() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE tenant uuid;
BEGIN tenant:=dna_private.require_unit_admin();RETURN jsonb_build_object(
 'states',(SELECT coalesce(jsonb_agg(to_jsonb(c)),'[]') FROM public.unit_state_coverage c WHERE c.institution_id=tenant),
 'contacts',(SELECT coalesce(jsonb_agg(jsonb_build_object('user_id',c.user_id,'phone',c.phone)),'[]') FROM public.seller_whatsapp_contacts c WHERE EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.user_id=c.user_id AND m.institution_id=tenant AND m.active AND NOT m.scope_pending)),
 'principals',(SELECT coalesce(jsonb_agg(to_jsonb(p)),'[]') FROM public.unit_principal_sellers p JOIN public.units_v2 u ON u.id=p.unit_id WHERE u.institution_id=tenant));END $$;
REVOKE ALL ON FUNCTION public.dna_list_unit_contacts() FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_list_unit_contacts() TO authenticated;

CREATE FUNCTION public.dna_save_unit_contact(p_unit uuid,p_user uuid,p_phone text,p_principal boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE tenant uuid;phone text;
BEGIN tenant:=dna_private.require_unit_admin();
 IF NOT EXISTS(SELECT 1 FROM public.units_v2 WHERE id=p_unit AND institution_id=tenant) OR NOT dna_private.authorized_unit_person(tenant,p_unit,p_user) THEN RAISE EXCEPTION 'Authorized unit person required';END IF;
 phone:=regexp_replace(p_phone,'[^0-9]','','g');IF phone IS NULL OR phone !~ '^55[0-9]{10,11}$' THEN RAISE EXCEPTION 'Invalid Brazilian WhatsApp';END IF;
 INSERT INTO public.seller_whatsapp_contacts VALUES(p_user,phone) ON CONFLICT(user_id) DO UPDATE SET phone=excluded.phone;
 IF p_principal THEN INSERT INTO public.unit_principal_sellers VALUES(p_unit,p_user) ON CONFLICT(unit_id) DO UPDATE SET user_id=excluded.user_id;
 ELSE DELETE FROM public.unit_principal_sellers WHERE unit_id=p_unit AND user_id=p_user;END IF;
END $$;
REVOKE ALL ON FUNCTION public.dna_save_unit_contact(uuid,uuid,text,boolean) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_save_unit_contact(uuid,uuid,text,boolean) TO authenticated;

-- Called only after the server validates the participant's HttpOnly session.
CREATE FUNCTION public.dna_result_contact(p_participant uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('name',up.display_name,'phone',coalesce(nullif(regexp_replace(v.phone,'[^0-9]','','g'),''),sc.phone))
 FROM public.participants_v2 p JOIN public.units_v2 u ON u.id=p.unit_id AND u.institution_id=p.institution_id AND u.active
 JOIN public.user_profiles up ON up.id=p.assigned_user_id AND up.active
 LEFT JOIN public.seller_whatsapp_contacts sc ON sc.user_id=p.assigned_user_id
 LEFT JOIN public.personal_vendor_routes r ON r.slug=p.vendor_slug AND r.user_id=p.assigned_user_id AND r.unit_id=p.unit_id AND r.institution_id=p.institution_id AND r.active
 LEFT JOIN public.sales_vendors v ON v.slug=r.slug AND v.active
 WHERE p.id=p_participant AND p.quiz_completed AND dna_private.authorized_unit_person(p.institution_id,p.unit_id,p.assigned_user_id)
$$;
REVOKE ALL ON FUNCTION public.dna_result_contact(uuid) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.dna_result_contact(uuid) TO service_role;
