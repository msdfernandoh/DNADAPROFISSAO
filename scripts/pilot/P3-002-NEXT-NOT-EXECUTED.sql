-- CANDIDATA SEGUINTE NAO EXECUTADA. Requer revisao/ensaio e recuperacao propria.
-- Depende SOMENTE da RPC dna_current_session adicionada; preserva helpers antigos.
BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='30s';
ALTER TABLE public.units_v2 ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.units_v2 ADD CONSTRAINT units_v2_id_institution_unique UNIQUE(id,institution_id);
ALTER TABLE public.participants_v2 ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.participants_v2 ADD COLUMN assigned_user_id uuid REFERENCES public.user_profiles(id);
ALTER TABLE public.participants_v2 ADD COLUMN participant_user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.participants_v2 ADD COLUMN report_released boolean NOT NULL DEFAULT false;
ALTER TABLE public.participants_v2 ADD COLUMN content_homologated boolean NOT NULL DEFAULT false;
ALTER TABLE public.participants_v2 ADD CONSTRAINT participants_v2_tenant_unit_fk FOREIGN KEY(unit_id,institution_id) REFERENCES public.units_v2(id,institution_id);
CREATE TABLE public.membership_unit_scopes(
 membership_id uuid NOT NULL,institution_id uuid NOT NULL,unit_id uuid NOT NULL,active boolean NOT NULL DEFAULT true,
 PRIMARY KEY(membership_id,unit_id),
 FOREIGN KEY(membership_id,institution_id) REFERENCES public.institution_memberships(id,institution_id),
 FOREIGN KEY(unit_id,institution_id) REFERENCES public.units_v2(id,institution_id)
);
ALTER TABLE public.membership_unit_scopes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.membership_unit_scopes FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.membership_unit_scopes TO service_role;
CREATE FUNCTION dna_private.can_operate_participant(p_participant uuid,p_resource text,p_action text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $fn$
DECLARE p public.participants_v2%ROWTYPE;
BEGIN
 IF public.dna_current_session() IS NULL OR NOT dna_private.is_active_user() OR p_resource IS NULL OR p_action IS NULL OR p_resource NOT IN ('lead','participant_report','commercial_report') OR p_action NOT IN ('read','create','update','archive','transfer') THEN RETURN false;END IF;
 SELECT * INTO p FROM public.participants_v2 WHERE id=p_participant;
 IF NOT FOUND OR p.institution_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.institutions i WHERE i.id=p.institution_id AND i.active) THEN RETURN false;END IF;
 IF p_resource='participant_report' AND p_action='read' AND p.participant_user_id=auth.uid() THEN RETURN p.report_released AND p.content_homologated;END IF;
 IF dna_private.is_platform_owner() THEN RETURN true;END IF;
 IF EXISTS(SELECT 1 FROM public.user_permission_grants g JOIN public.institution_memberships m ON m.id=g.membership_id AND m.institution_id=g.institution_id WHERE m.user_id=auth.uid() AND m.active AND NOT m.scope_pending AND m.institution_id=p.institution_id AND g.resource=p_resource AND g.action=p_action AND NOT g.allowed) THEN RETURN false;END IF;
 RETURN EXISTS(
 SELECT 1 FROM public.institution_memberships m
 JOIN public.membership_unit_scopes u ON u.membership_id=m.id AND u.institution_id=m.institution_id AND u.unit_id=p.unit_id AND u.active
 JOIN public.units_v2 unit ON unit.id=u.unit_id AND unit.institution_id=u.institution_id AND unit.active
 JOIN public.user_permission_grants g ON g.membership_id=m.id AND g.institution_id=m.institution_id
 WHERE m.user_id=auth.uid() AND m.institution_id=p.institution_id AND m.active AND NOT m.scope_pending
 AND g.resource=p_resource AND g.action=p_action AND g.allowed
 AND (g.scope_type='institution' OR (g.scope_type='assigned_leads' AND p.assigned_user_id=auth.uid()))
 AND (m.role_code IN ('institution_admin','unit_manager') OR (m.role_code='seller' AND p_action IN ('read','update') AND p.assigned_user_id=auth.uid())));
END
$fn$;
REVOKE ALL ON FUNCTION dna_private.can_operate_participant(uuid,text,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.dna_authorize_participant(p_participant uuid,p_resource text,p_action text) RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $fn$
DECLARE allowed boolean; tenant uuid;
BEGIN
 IF public.dna_current_session() IS NULL OR NOT dna_private.is_active_user() THEN RETURN false;END IF;
 allowed:=dna_private.can_operate_participant(p_participant,p_resource,p_action);
 SELECT institution_id INTO tenant FROM public.participants_v2 WHERE id=p_participant;
 INSERT INTO public.access_audit_events(institution_id,actor_user_id,action,resource_type,resource_id,reason,metadata)
 VALUES(tenant,auth.uid(),'authorization',p_resource,p_participant,'P3 authorization decision',jsonb_build_object('operation',p_action,'allowed',allowed));
 RETURN allowed;
END
$fn$;
REVOKE ALL ON FUNCTION public.dna_authorize_participant(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dna_authorize_participant(uuid,text,text) TO authenticated;
-- Nenhuma leitura direta de leads e nenhum CRUD de permissoes concedidos.
-- Ainda sem rota de dados operacionais; a RPC apenas decide e audita.
REVOKE ALL ON public.participants_v2,public.questionnaire_answers,public.questionnaire_results,public.credit_events_v2 FROM anon,authenticated;
COMMIT;
