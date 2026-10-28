-- Operational rollback: retain all data/columns and the existing login RPC.
-- Turn operational feature flags OFF before this transaction.
BEGIN;
SET LOCAL lock_timeout='3s';
REVOKE ALL ON FUNCTION public.dna_authorize_participant(uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON public.membership_unit_scopes FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
