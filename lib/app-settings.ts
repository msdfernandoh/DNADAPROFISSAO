export const SETTING_DNA_RAPIDO_BUTTON = "dna_rapido_button_enabled"

export function parseSettingBoolean(value: unknown): boolean {
  if (value === true) return true
  if (value === false) return false
  if (typeof value === "string") return value === "true"
  return false
}
