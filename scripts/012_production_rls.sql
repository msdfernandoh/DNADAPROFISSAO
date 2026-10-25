-- Reexecutável: aplicar após a estrutura importada. Não contém dados pessoais.
BEGIN;
SET LOCAL search_path = public;
DO $dna$ DECLARE p record; t text; BEGIN
  FOREACH t IN ARRAY ARRAY['admin_users_v2','alternative_weights','alternatives','app_settings','cities','courses','credit_events_v2','participants','participants_v2','questionnaire_answers','questionnaire_profiles','questionnaire_results','questionnaires','questions','report_contents','report_sections','report_templates','sales_vendors','sellers_v2','units_v2'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  END LOOP;
  FOR p IN SELECT tablename,policyname FROM pg_policies WHERE schemaname='public' AND tablename=ANY(ARRAY['admin_users_v2','alternative_weights','alternatives','app_settings','cities','courses','credit_events_v2','participants','participants_v2','questionnaire_answers','questionnaire_profiles','questionnaire_results','questionnaires','questions','report_contents','report_sections','report_templates','sales_vendors','sellers_v2','units_v2']) LOOP
    EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename);
  END LOOP;
END $dna$;

REVOKE ALL PRIVILEGES ON TABLE public.admin_users_v2, public.alternative_weights, public.alternatives, public.app_settings, public.cities, public.courses, public.credit_events_v2, public.participants, public.participants_v2, public.questionnaire_answers, public.questionnaire_profiles, public.questionnaire_results, public.questionnaires, public.questions, public.report_contents, public.report_sections, public.report_templates, public.sales_vendors, public.sellers_v2, public.units_v2 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.cities, public.courses, public.app_settings, public.questionnaires, public.questionnaire_profiles, public.questions, public.alternatives, public.alternative_weights TO anon, authenticated;
CREATE POLICY dna_public_read ON public.cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY dna_public_read ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY dna_public_read ON public.app_settings FOR SELECT TO anon, authenticated USING (key IN ('dna_rapido_button_enabled','dna_rapido_question_indices'));
CREATE POLICY dna_public_read ON public.questionnaires FOR SELECT TO anon, authenticated USING (active AND status = 'published');
CREATE POLICY dna_public_read ON public.questionnaire_profiles FOR SELECT TO anon, authenticated USING (active AND EXISTS (SELECT 1 FROM public.questionnaires q WHERE q.id = questionnaire_id AND q.active AND q.status = 'published'));
CREATE POLICY dna_public_read ON public.questions FOR SELECT TO anon, authenticated USING (active AND EXISTS (SELECT 1 FROM public.questionnaires q WHERE q.id = questionnaire_id AND q.active AND q.status = 'published'));
CREATE POLICY dna_public_read ON public.alternatives FOR SELECT TO anon, authenticated USING (active AND EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.active));
CREATE POLICY dna_public_read ON public.alternative_weights FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.alternatives a WHERE a.id = alternative_id AND a.active) AND EXISTS (SELECT 1 FROM public.questionnaire_profiles p WHERE p.id = profile_id AND p.active));
COMMIT;