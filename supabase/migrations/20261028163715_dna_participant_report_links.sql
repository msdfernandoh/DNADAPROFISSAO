BEGIN;
CREATE TABLE public.participant_report_links(
 token_hash text PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),
 participant_id uuid NOT NULL REFERENCES public.participants_v2(id),
 created_by uuid NOT NULL REFERENCES public.user_profiles(id),
 created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,
 revoked boolean NOT NULL DEFAULT false,
 CHECK(expires_at>created_at AND expires_at<=created_at+interval '31 days')
);
ALTER TABLE public.participant_report_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.participant_report_links FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.participant_report_links TO service_role;
CREATE INDEX participant_report_links_participant ON public.participant_report_links(participant_id);
COMMIT;
