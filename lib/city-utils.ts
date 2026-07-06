/** Valor do select quando o participante informa cidade manualmente. */
export const CITY_SELECT_OTHER = "__other__"

export function formatCityLabel(name: string, state: string): string {
  const n = name.trim()
  const uf = state.trim().toUpperCase()
  return uf ? `${n} - ${uf}` : n
}

/** Texto gravado em participants.city (compatível com leads antigos). */
export function formatCityForParticipant(name: string, state: string): string {
  const n = name.trim()
  const uf = state.trim().toUpperCase()
  return uf ? `${n}, ${uf}` : n
}

export function normalizeCityState(state: string): string {
  return state.trim().toUpperCase().slice(0, 2)
}
