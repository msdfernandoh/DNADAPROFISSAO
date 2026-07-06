-- Escolaridade e tipo de questionário (nullable para registros antigos)
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS escolaridade TEXT,
  ADD COLUMN IF NOT EXISTS tipo_questionario TEXT DEFAULT 'completo';

COMMENT ON COLUMN participants.escolaridade IS 'Valores: ensino_medio_incompleto, ensino_medio_completo, cursando_graduacao, graduado, pos_graduado';
COMMENT ON COLUMN participants.tipo_questionario IS 'completo ou rapido';

-- Configurações do app (ex.: botão DNA Rápido na tela inicial)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'false'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value)
VALUES ('dna_rapido_button_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
