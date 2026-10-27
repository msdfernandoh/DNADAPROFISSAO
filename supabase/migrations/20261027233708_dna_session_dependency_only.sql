-- Aditiva: cria somente a RPC necessaria para confirmar a sessao. NAO EXECUTADA em producao.
-- Gate: evidencia atual de recuperacao + compatibilidade confirmadas antes de aplicar.
-- Sem substituicao de helpers, tabelas, politicas RLS, backfill ou dados.
BEGIN;
SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='30s';
CREATE FUNCTION public.dna_current_session() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $session$
 SELECT jsonb_build_object('user_id',s.user_id,'session_id',s.id)
 FROM auth.sessions s JOIN public.user_profiles p ON p.id=s.user_id
 WHERE s.id=(NULLIF(auth.jwt()->>'session_id',''))::uuid
 AND s.user_id=auth.uid() AND p.active
 AND (s.not_after IS NULL OR s.not_after>now())
 AND (auth.jwt()->>'exp')::bigint>extract(epoch FROM now())
$session$;
REVOKE ALL ON FUNCTION public.dna_current_session() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.dna_current_session() TO authenticated;
COMMIT;
