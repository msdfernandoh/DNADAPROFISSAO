-- Adiciona colunas para rastrear se o teste foi concluído
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quiz_completed_at TIMESTAMPTZ;

-- Permitir que primary/secondary/percentages fiquem nulos enquanto não fez o quiz
ALTER TABLE participants
  ALTER COLUMN primary_profile DROP NOT NULL,
  ALTER COLUMN secondary_profile DROP NOT NULL,
  ALTER COLUMN percentages DROP NOT NULL;

-- Marcar registros antigos que já têm perfil como concluídos
UPDATE participants
SET quiz_completed = TRUE, quiz_completed_at = created_at
WHERE primary_profile IS NOT NULL AND quiz_completed = FALSE;
