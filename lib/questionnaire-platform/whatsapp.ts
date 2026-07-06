import { normalizePhone } from "@/lib/questionnaire-platform/participant-validators"

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = normalizePhone(phone)
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`
}

export function defaultLeadWhatsAppMessage(name: string): string {
  const firstName = name.trim().split(/\s+/)[0] || name
  return `Olá, ${firstName}! Vi que você concluiu seu DNA da Profissão. Estou passando para liberar seu mapa personalizado e te orientar nos próximos passos.`
}
