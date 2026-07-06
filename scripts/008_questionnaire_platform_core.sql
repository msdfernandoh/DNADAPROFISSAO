-- Fase 1 — Plataforma configurável de questionários (core)
-- ADITIVO: não altera participants, courses, app_settings ou demais tabelas V1.
-- Aplicar em Supabase staging antes de produção.
-- Arquivo: scripts/008_questionnaire_platform_core.sql

-- ---------------------------------------------------------------------------
-- 1. questionnaires
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  scoring_mode TEXT NOT NULL DEFAULT 'per_question',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT questionnaires_status_check
    CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT questionnaires_scoring_mode_check
    CHECK (scoring_mode IN ('per_question', 'normalized_sum'))
);

CREATE INDEX IF NOT EXISTS questionnaires_slug_idx ON questionnaires (slug);
CREATE INDEX IF NOT EXISTS questionnaires_status_idx ON questionnaires (status);

COMMENT ON TABLE questionnaires IS 'Testes configuráveis (V2); V1 continua em lib/dna-data.ts';

-- ---------------------------------------------------------------------------
-- 2. questionnaire_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questionnaire_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires (id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  color TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT questionnaire_profiles_questionnaire_code_unique
    UNIQUE (questionnaire_id, code)
);

CREATE INDEX IF NOT EXISTS questionnaire_profiles_questionnaire_sort_idx
  ON questionnaire_profiles (questionnaire_id, sort_order);

-- ---------------------------------------------------------------------------
-- 3. questions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires (id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single_choice',
  required BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT questions_questionnaire_order_unique
    UNIQUE (questionnaire_id, "order")
);

CREATE INDEX IF NOT EXISTS questions_questionnaire_order_idx
  ON questions (questionnaire_id, "order");

-- ---------------------------------------------------------------------------
-- 4. alternatives
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "order" INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT alternatives_question_order_unique
    UNIQUE (question_id, "order")
);

CREATE INDEX IF NOT EXISTS alternatives_question_order_idx
  ON alternatives (question_id, "order");

-- ---------------------------------------------------------------------------
-- 5. alternative_weights
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alternative_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alternative_id UUID NOT NULL REFERENCES alternatives (id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES questionnaire_profiles (id) ON DELETE CASCADE,
  weight INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT alternative_weights_alternative_profile_unique
    UNIQUE (alternative_id, profile_id),
  CONSTRAINT alternative_weights_weight_non_negative
    CHECK (weight >= 0)
);

CREATE INDEX IF NOT EXISTS alternative_weights_alternative_id_idx
  ON alternative_weights (alternative_id);

CREATE INDEX IF NOT EXISTS alternative_weights_profile_id_idx
  ON alternative_weights (profile_id);

-- ---------------------------------------------------------------------------
-- 6. participants_v2
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS participants_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID REFERENCES questionnaires (id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  course_interest TEXT,
  escolaridade TEXT,
  vendor_slug TEXT,
  status TEXT NOT NULL DEFAULT 'Aguardando teste',
  notes TEXT,
  quiz_completed BOOLEAN NOT NULL DEFAULT false,
  quiz_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS participants_v2_questionnaire_created_idx
  ON participants_v2 (questionnaire_id, created_at DESC);

CREATE INDEX IF NOT EXISTS participants_v2_email_idx ON participants_v2 (email);

CREATE INDEX IF NOT EXISTS participants_v2_phone_idx ON participants_v2 (phone);

COMMENT ON TABLE participants_v2 IS 'Leads do funil /q/[slug]; separado de participants (V1)';

-- ---------------------------------------------------------------------------
-- 7. questionnaire_answers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questionnaire_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires (id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants_v2 (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  alternative_id UUID NOT NULL REFERENCES alternatives (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT questionnaire_answers_participant_question_unique
    UNIQUE (participant_id, question_id)
);

CREATE INDEX IF NOT EXISTS questionnaire_answers_participant_id_idx
  ON questionnaire_answers (participant_id);

CREATE INDEX IF NOT EXISTS questionnaire_answers_questionnaire_id_idx
  ON questionnaire_answers (questionnaire_id);

-- ---------------------------------------------------------------------------
-- 8. questionnaire_results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questionnaire_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires (id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants_v2 (id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  percentages JSONB NOT NULL,
  main_profile_id UUID REFERENCES questionnaire_profiles (id) ON DELETE SET NULL,
  secondary_profile_id UUID REFERENCES questionnaire_profiles (id) ON DELETE SET NULL,
  result_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT questionnaire_results_participant_unique
    UNIQUE (participant_id)
);

CREATE INDEX IF NOT EXISTS questionnaire_results_questionnaire_id_idx
  ON questionnaire_results (questionnaire_id);

-- ---------------------------------------------------------------------------
-- RLS (Row Level Security)
-- O app V1 usa @supabase/ssr com anon key nas API Routes (ver 007_*).
-- Sem políticas, RLS bloqueia tudo. Políticas abaixo espelham cities/app_settings
-- até existir service role ou auth dedicada na Fase 3+.
-- Endurecer em produção: restringir INSERT/UPDATE em questionnaires* ao admin.
-- ---------------------------------------------------------------------------

ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternative_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_results ENABLE ROW LEVEL SECURITY;

-- questionnaires
DROP POLICY IF EXISTS "questionnaires_anon_select" ON questionnaires;
DROP POLICY IF EXISTS "questionnaires_anon_insert" ON questionnaires;
DROP POLICY IF EXISTS "questionnaires_anon_update" ON questionnaires;
DROP POLICY IF EXISTS "questionnaires_anon_delete" ON questionnaires;

CREATE POLICY "questionnaires_anon_select" ON questionnaires
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "questionnaires_anon_insert" ON questionnaires
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "questionnaires_anon_update" ON questionnaires
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "questionnaires_anon_delete" ON questionnaires
  FOR DELETE TO anon, authenticated USING (true);

-- questionnaire_profiles
DROP POLICY IF EXISTS "questionnaire_profiles_anon_select" ON questionnaire_profiles;
DROP POLICY IF EXISTS "questionnaire_profiles_anon_insert" ON questionnaire_profiles;
DROP POLICY IF EXISTS "questionnaire_profiles_anon_update" ON questionnaire_profiles;
DROP POLICY IF EXISTS "questionnaire_profiles_anon_delete" ON questionnaire_profiles;

CREATE POLICY "questionnaire_profiles_anon_select" ON questionnaire_profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "questionnaire_profiles_anon_insert" ON questionnaire_profiles
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "questionnaire_profiles_anon_update" ON questionnaire_profiles
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "questionnaire_profiles_anon_delete" ON questionnaire_profiles
  FOR DELETE TO anon, authenticated USING (true);

-- questions
DROP POLICY IF EXISTS "questions_anon_select" ON questions;
DROP POLICY IF EXISTS "questions_anon_insert" ON questions;
DROP POLICY IF EXISTS "questions_anon_update" ON questions;
DROP POLICY IF EXISTS "questions_anon_delete" ON questions;

CREATE POLICY "questions_anon_select" ON questions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "questions_anon_insert" ON questions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "questions_anon_update" ON questions
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "questions_anon_delete" ON questions
  FOR DELETE TO anon, authenticated USING (true);

-- alternatives
DROP POLICY IF EXISTS "alternatives_anon_select" ON alternatives;
DROP POLICY IF EXISTS "alternatives_anon_insert" ON alternatives;
DROP POLICY IF EXISTS "alternatives_anon_update" ON alternatives;
DROP POLICY IF EXISTS "alternatives_anon_delete" ON alternatives;

CREATE POLICY "alternatives_anon_select" ON alternatives
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "alternatives_anon_insert" ON alternatives
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "alternatives_anon_update" ON alternatives
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "alternatives_anon_delete" ON alternatives
  FOR DELETE TO anon, authenticated USING (true);

-- alternative_weights
DROP POLICY IF EXISTS "alternative_weights_anon_select" ON alternative_weights;
DROP POLICY IF EXISTS "alternative_weights_anon_insert" ON alternative_weights;
DROP POLICY IF EXISTS "alternative_weights_anon_update" ON alternative_weights;
DROP POLICY IF EXISTS "alternative_weights_anon_delete" ON alternative_weights;

CREATE POLICY "alternative_weights_anon_select" ON alternative_weights
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "alternative_weights_anon_insert" ON alternative_weights
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "alternative_weights_anon_update" ON alternative_weights
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "alternative_weights_anon_delete" ON alternative_weights
  FOR DELETE TO anon, authenticated USING (true);

-- participants_v2
DROP POLICY IF EXISTS "participants_v2_anon_select" ON participants_v2;
DROP POLICY IF EXISTS "participants_v2_anon_insert" ON participants_v2;
DROP POLICY IF EXISTS "participants_v2_anon_update" ON participants_v2;
DROP POLICY IF EXISTS "participants_v2_anon_delete" ON participants_v2;

CREATE POLICY "participants_v2_anon_select" ON participants_v2
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "participants_v2_anon_insert" ON participants_v2
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "participants_v2_anon_update" ON participants_v2
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "participants_v2_anon_delete" ON participants_v2
  FOR DELETE TO anon, authenticated USING (true);

-- questionnaire_answers
DROP POLICY IF EXISTS "questionnaire_answers_anon_select" ON questionnaire_answers;
DROP POLICY IF EXISTS "questionnaire_answers_anon_insert" ON questionnaire_answers;
DROP POLICY IF EXISTS "questionnaire_answers_anon_update" ON questionnaire_answers;
DROP POLICY IF EXISTS "questionnaire_answers_anon_delete" ON questionnaire_answers;

CREATE POLICY "questionnaire_answers_anon_select" ON questionnaire_answers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "questionnaire_answers_anon_insert" ON questionnaire_answers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "questionnaire_answers_anon_update" ON questionnaire_answers
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "questionnaire_answers_anon_delete" ON questionnaire_answers
  FOR DELETE TO anon, authenticated USING (true);

-- questionnaire_results
DROP POLICY IF EXISTS "questionnaire_results_anon_select" ON questionnaire_results;
DROP POLICY IF EXISTS "questionnaire_results_anon_insert" ON questionnaire_results;
DROP POLICY IF EXISTS "questionnaire_results_anon_update" ON questionnaire_results;
DROP POLICY IF EXISTS "questionnaire_results_anon_delete" ON questionnaire_results;

CREATE POLICY "questionnaire_results_anon_select" ON questionnaire_results
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "questionnaire_results_anon_insert" ON questionnaire_results
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "questionnaire_results_anon_update" ON questionnaire_results
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "questionnaire_results_anon_delete" ON questionnaire_results
  FOR DELETE TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- TESTES SQL MANUAIS (executar no SQL Editor — staging)
-- Copiar bloco a bloco; substituir UUIDs nos passos seguintes pelos retornados.
-- ---------------------------------------------------------------------------
/*
-- 1) Questionnaire draft
INSERT INTO questionnaires (name, slug, description, status)
VALUES ('Teste Fase 1', 'teste-fase-1', 'Smoke SQL', 'draft')
RETURNING id;
-- anote: :questionnaire_id

-- 2) Dois perfis (substituir :questionnaire_id)
INSERT INTO questionnaire_profiles (questionnaire_id, code, name, sort_order)
VALUES
  (:questionnaire_id, 'A', 'Perfil A', 0),
  (:questionnaire_id, 'B', 'Perfil B', 1)
RETURNING id, code;
-- anote: :profile_a_id, :profile_b_id

-- 3) Uma pergunta
INSERT INTO questions (questionnaire_id, text, "order")
VALUES (:questionnaire_id, 'Pergunta de teste?', 1)
RETURNING id;
-- anote: :question_id

-- 4) Duas alternativas
INSERT INTO alternatives (question_id, text, "order")
VALUES
  (:question_id, 'Alternativa 1', 1),
  (:question_id, 'Alternativa 2', 2)
RETURNING id, "order";
-- anote: :alt1_id, :alt2_id

-- 5) Pesos (alt1 favorece A; alt2 favorece B)
INSERT INTO alternative_weights (alternative_id, profile_id, weight)
VALUES
  (:alt1_id, :profile_a_id, 2),
  (:alt1_id, :profile_b_id, 0),
  (:alt2_id, :profile_a_id, 0),
  (:alt2_id, :profile_b_id, 3);

-- 6) Confirmar leitura
SELECT q.slug, qp.code, qu.text, a.text AS alt, aw.weight
FROM questionnaires q
JOIN questionnaire_profiles qp ON qp.questionnaire_id = q.id
JOIN questions qu ON qu.questionnaire_id = q.id
JOIN alternatives a ON a.question_id = qu.id
LEFT JOIN alternative_weights aw ON aw.alternative_id = a.id
WHERE q.slug = 'teste-fase-1'
ORDER BY qp.sort_order, qu."order", a."order";

-- 7) Constraints (devem FALHAR)
-- slug duplicado:
-- INSERT INTO questionnaires (name, slug) VALUES ('X', 'teste-fase-1');
-- peso negativo:
-- INSERT INTO alternative_weights (alternative_id, profile_id, weight) VALUES (:alt1_id, :profile_a_id, -1);
-- code duplicado no mesmo questionário:
-- INSERT INTO questionnaire_profiles (questionnaire_id, code, name) VALUES (:questionnaire_id, 'A', 'Dup');

-- 8) Limpeza (opcional)
-- DELETE FROM questionnaires WHERE slug = 'teste-fase-1';
*/
