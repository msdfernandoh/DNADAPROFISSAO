BEGIN;
SET LOCAL lock_timeout='3s';SET LOCAL statement_timeout='30s';
CREATE TABLE public.report_revision_approvals(
 revision text PRIMARY KEY REFERENCES dna_private.evaluation_revisions(revision),
 editorial_version text NOT NULL,source_hash text NOT NULL,
 approved_by uuid NOT NULL REFERENCES public.user_profiles(id),
 approved_at timestamptz NOT NULL DEFAULT now(),active boolean NOT NULL DEFAULT true,reason text NOT NULL
);
ALTER TABLE public.report_revision_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_revision_approvals FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.report_revision_approvals TO service_role;
INSERT INTO public.report_revision_approvals(revision,editorial_version,source_hash,approved_by,reason)
SELECT r.revision,'dna-editorial-v2-corrections-2026-10-26.v1',r.source_hash,u.id,
 'Fernando confirmou nesta conversa a aprovação final da Carla em 28/10/2026; sem novas recomendações acadêmicas ou alteração de pontuação.'
FROM dna_private.evaluation_revisions r JOIN auth.users u ON lower(u.email)='msdcarla@gmail.com'
WHERE r.revision='dna-official-2026-10-26.v1' AND r.source_hash='2a1c84320d8994a2dc095dfc262d642d9c981bba38393f10ed1cb68aee97d7b2';
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.report_revision_approvals WHERE revision='dna-official-2026-10-26.v1') THEN RAISE EXCEPTION 'Approved revision missing';END IF;END $$;
UPDATE dna_private.evaluation_revisions SET completion_enabled=true WHERE revision='dna-official-2026-10-26.v1';
INSERT INTO public.access_audit_events(actor_user_id,action,resource_type,reason,metadata)
SELECT approved_by,'report_revision_approved','revision',reason,jsonb_build_object('revision',revision,'editorialVersion',editorial_version,'sourceHash',source_hash)
FROM public.report_revision_approvals;
COMMIT;
