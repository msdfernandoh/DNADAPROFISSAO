-- Fase 8 — Templates e conteúdos configuráveis do relatório (preview HTML; PDF na fase seguinte)
-- Aplicar após scripts/008_questionnaire_platform_core.sql

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout_key TEXT NOT NULL DEFAULT 'dna_profissional_v1',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_templates_questionnaire_idx
  ON report_templates (questionnaire_id);

CREATE TABLE IF NOT EXISTS report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_template_id UUID NOT NULL REFERENCES report_templates (id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT report_sections_template_key_unique UNIQUE (report_template_id, section_key)
);

CREATE INDEX IF NOT EXISTS report_sections_template_sort_idx
  ON report_sections (report_template_id, sort_order);

CREATE TABLE IF NOT EXISTS report_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires (id) ON DELETE CASCADE,
  profile_id UUID REFERENCES questionnaire_profiles (id) ON DELETE CASCADE,
  secondary_profile_id UUID REFERENCES questionnaire_profiles (id) ON DELETE SET NULL,
  section_key TEXT NOT NULL,
  field_key TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  content_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT report_contents_unique_key
    UNIQUE (questionnaire_id, profile_id, secondary_profile_id, section_key, field_key)
);

CREATE INDEX IF NOT EXISTS report_contents_questionnaire_idx
  ON report_contents (questionnaire_id);

COMMENT ON TABLE report_templates IS 'Layout do PDF V2 por questionário';
COMMENT ON TABLE report_sections IS 'Seções ordenadas do template';
COMMENT ON TABLE report_contents IS 'Textos configuráveis (global, por perfil ou par main+secondary)';

ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_templates_anon_select" ON report_templates;
DROP POLICY IF EXISTS "report_templates_anon_insert" ON report_templates;
DROP POLICY IF EXISTS "report_templates_anon_update" ON report_templates;
DROP POLICY IF EXISTS "report_templates_anon_delete" ON report_templates;

CREATE POLICY "report_templates_anon_select" ON report_templates
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "report_templates_anon_insert" ON report_templates
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "report_templates_anon_update" ON report_templates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "report_templates_anon_delete" ON report_templates
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "report_sections_anon_select" ON report_sections;
DROP POLICY IF EXISTS "report_sections_anon_insert" ON report_sections;
DROP POLICY IF EXISTS "report_sections_anon_update" ON report_sections;
DROP POLICY IF EXISTS "report_sections_anon_delete" ON report_sections;

CREATE POLICY "report_sections_anon_select" ON report_sections
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "report_sections_anon_insert" ON report_sections
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "report_sections_anon_update" ON report_sections
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "report_sections_anon_delete" ON report_sections
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "report_contents_anon_select" ON report_contents;
DROP POLICY IF EXISTS "report_contents_anon_insert" ON report_contents;
DROP POLICY IF EXISTS "report_contents_anon_all" ON report_contents;
DROP POLICY IF EXISTS "report_contents_anon_update" ON report_contents;
DROP POLICY IF EXISTS "report_contents_anon_delete" ON report_contents;

CREATE POLICY "report_contents_anon_select" ON report_contents
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "report_contents_anon_insert" ON report_contents
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "report_contents_anon_update" ON report_contents
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "report_contents_anon_delete" ON report_contents
  FOR DELETE TO anon, authenticated USING (true);
