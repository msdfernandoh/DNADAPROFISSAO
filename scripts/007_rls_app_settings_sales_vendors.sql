-- Políticas RLS para tabelas usadas pela API com anon key (Next.js)
-- Corrige: toggle DNA Rápido, app_settings e cadastro de sales_vendors

INSERT INTO app_settings (key, value)
VALUES
  ('dna_rapido_button_enabled', 'false'::jsonb),
  ('dna_rapido_question_indices', '[0,5,8,10,11,14,15,17,19,23]'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_anon_select" ON app_settings;
DROP POLICY IF EXISTS "app_settings_anon_insert" ON app_settings;
DROP POLICY IF EXISTS "app_settings_anon_update" ON app_settings;
DROP POLICY IF EXISTS "app_settings_anon_all" ON app_settings;

CREATE POLICY "app_settings_anon_select" ON app_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "app_settings_anon_insert" ON app_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "app_settings_anon_update" ON app_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE sales_vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_vendors_anon_select" ON sales_vendors;
DROP POLICY IF EXISTS "sales_vendors_anon_insert" ON sales_vendors;
DROP POLICY IF EXISTS "sales_vendors_anon_update" ON sales_vendors;
DROP POLICY IF EXISTS "sales_vendors_anon_delete" ON sales_vendors;
DROP POLICY IF EXISTS "sales_vendors_anon_all" ON sales_vendors;

CREATE POLICY "sales_vendors_anon_select" ON sales_vendors
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "sales_vendors_anon_insert" ON sales_vendors
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "sales_vendors_anon_update" ON sales_vendors
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "sales_vendors_anon_delete" ON sales_vendors
  FOR DELETE TO anon, authenticated USING (true);
