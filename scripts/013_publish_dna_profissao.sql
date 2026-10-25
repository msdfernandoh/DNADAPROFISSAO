-- Publicação validada pelo checklist do aplicativo em 25/10/2026.
BEGIN;
DO $dna$ DECLARE q uuid; BEGIN
 SELECT id INTO STRICT q FROM public.questionnaires WHERE slug='dna-profissao-v2';
 IF (SELECT count(*) FROM public.questions WHERE questionnaire_id=q AND active) <> 15 OR (SELECT count(*) FROM public.questionnaire_profiles WHERE questionnaire_id=q AND active) <> 5 THEN RAISE EXCEPTION 'Configuração inesperada; revisar antes de publicar.'; END IF;
 UPDATE public.questionnaires SET status='published', version=version+1, updated_at=now() WHERE id=q AND active AND status='draft';
END $dna$;
COMMIT;
