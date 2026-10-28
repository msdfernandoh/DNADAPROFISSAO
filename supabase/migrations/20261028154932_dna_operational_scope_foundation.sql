-- Inert foundation only: no RPC, helper replacement, policy, data assignment or credit.
-- Existing RLS, helpers, participants and authorizations remain unchanged.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.units_v2
  ADD COLUMN institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.units_v2
  ADD CONSTRAINT units_v2_id_institution_unique UNIQUE (id, institution_id);

ALTER TABLE public.participants_v2
  ADD COLUMN institution_id uuid REFERENCES public.institutions(id),
  ADD COLUMN assigned_user_id uuid REFERENCES public.user_profiles(id),
  ADD COLUMN participant_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN report_released boolean NOT NULL DEFAULT false,
  ADD COLUMN content_homologated boolean NOT NULL DEFAULT false;
ALTER TABLE public.participants_v2
  ADD CONSTRAINT participants_v2_tenant_unit_fk
  FOREIGN KEY (unit_id, institution_id)
  REFERENCES public.units_v2(id, institution_id);

CREATE TABLE public.membership_unit_scopes (
  membership_id uuid NOT NULL,
  institution_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (membership_id, unit_id),
  FOREIGN KEY (membership_id, institution_id)
    REFERENCES public.institution_memberships(id, institution_id),
  FOREIGN KEY (unit_id, institution_id)
    REFERENCES public.units_v2(id, institution_id)
);
ALTER TABLE public.membership_unit_scopes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.membership_unit_scopes FROM PUBLIC, anon, authenticated;
CREATE INDEX membership_unit_scopes_unit_idx
  ON public.membership_unit_scopes(unit_id, institution_id);
CREATE INDEX participants_v2_tenant_assigned_idx
  ON public.participants_v2(institution_id, assigned_user_id);
COMMIT;
