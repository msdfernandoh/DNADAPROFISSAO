-- Cidades pré-cadastradas para o formulário público (select + opção "Outra")

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL CHECK (char_length(trim(state)) = 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, state)
);

CREATE INDEX IF NOT EXISTS cities_name_state_idx ON cities (name, state);

COMMENT ON TABLE cities IS 'Cidades exibidas no cadastro; participantes fora da lista usam opção Outra';

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cities_anon_select" ON cities;
DROP POLICY IF EXISTS "cities_anon_insert" ON cities;
DROP POLICY IF EXISTS "cities_anon_update" ON cities;
DROP POLICY IF EXISTS "cities_anon_delete" ON cities;

CREATE POLICY "cities_anon_select" ON cities
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cities_anon_insert" ON cities
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "cities_anon_update" ON cities
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cities_anon_delete" ON cities
  FOR DELETE TO anon, authenticated USING (true);
