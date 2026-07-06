const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizeVendorSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export function isValidVendorSlug(slug: string): boolean {
  return slug.length >= 2 && SLUG_PATTERN.test(slug)
}

export function phoneToWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.length <= 11) return `55${digits}`
  return digits
}

export function buildVendorRegistrationUrl(origin: string, slug: string): string {
  const base = origin.replace(/\/$/, "")
  return `${base}/?v=${encodeURIComponent(slug)}`
}

export function buildWhatsAppResultUrl(phoneDigits: string, participantFirstName: string): string {
  const text =
    `Olá! Me chamo ${participantFirstName}. Acabei de concluir o DNA Profissional e gostaria de receber o resultado do meu teste. Pode me ajudar?`
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`
}
