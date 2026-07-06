import { getField, type MergedReportFields } from "@/lib/questionnaire-engine/merge-report-content"
import {
  parseCompatibilityAreas,
  parseNumber,
  parseRecommendedCourses,
  parseSalaries,
  parseStringList,
  type RecommendedCourse,
  type SalaryRow,
} from "@/lib/questionnaire-report/report-field-parsers"

export type ReportProfileTheme = {
  primary: string
  primaryLight: string
  primaryDark: string
  accent: string
  coverEmoji: string
  coverWord: string
  coverNumber: string
}

export type ReportProfileContent = {
  name: string
  subtitle: string
  tagline: string
  color: string
  whoYouAre: string
  dailyAnalogy: string
  howYouFunction: string[]
  howYouAct: string[]
  howYouDecide: string[]
  whatMotivates: string[]
  whatDrains: string[]
  idealEnvironment: string[]
  strong: string[]
  attention: string[]
  reflection: string
  compatibilityAreas: { name: string; pct: number }[]
  superPowers: string[]
  visualization: string[]
  final: string
  theme: ReportProfileTheme
  salaries: SalaryRow[]
  topSalary: number
}

export type ReportGlobalCopy = {
  coverDiagnosisLabel: string
  coverBottomTagline: string
  welcomeSectionLabel: string
  welcomeTitle: string
  welcomeParagraphs: string[]
  welcomeCards: { n: string; t: string; d: string }[]
  compatibilityIntro: string
  coursesIntroTitle: string
  coursesIntroSubtitle: string
  salariesIntroNote: string
  salariesFootnote: string
  finalClosingParagraph: string
  brandTitle: string
  brandSubtitle: string
}

const PLACEHOLDER_LIST = ["Conteúdo não configurado"]
const PLACEHOLDER_AREAS = [{ name: "Área a configurar", pct: 0 }]
const PLACEHOLDER_COURSES: RecommendedCourse[] = [
  {
    name: "Curso a configurar",
    pct: 0,
    description: "Configure os cursos recomendados no admin (JSON ou campos).",
    areas: ["—"],
    idealFor: "—",
  },
]

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "")
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mixHex(a: string, b: string, t: number): string {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  if (!ra || !rb) return a
  const c = ra.map((v, i) => Math.round(v + (rb[i]! - v) * t)) as [number, number, number]
  return `#${c.map(x => x.toString(16).padStart(2, "0")).join("")}`
}

export function themeFromColor(baseColor: string, fields: MergedReportFields, prefix: string): ReportProfileTheme {
  const primary = getField(fields, prefix, "theme_primary", baseColor || "#C9A84C")
  const primaryLight = getField(fields, prefix, "theme_primary_light", mixHex(primary, "#FFFFFF", 0.35))
  const primaryDark = getField(fields, prefix, "theme_primary_dark", mixHex(primary, "#0B0E1A", 0.55))
  const accent = getField(fields, prefix, "theme_accent", mixHex(primary, "#5B3FA6", 0.4))
  return {
    primary,
    primaryLight,
    primaryDark,
    accent,
    coverEmoji: getField(fields, prefix, "cover_emoji", "✦"),
    coverWord: getField(fields, prefix, "cover_word", "PROFISSIONAL"),
    coverNumber: getField(fields, prefix, "cover_number", "DIAGNÓSTICO"),
  }
}

type DbProfile = { name: string; color: string | null; short_description: string | null }

export function buildMainProfileContent(
  fields: MergedReportFields,
  db: DbProfile,
  displayNameOverride?: string
): ReportProfileContent {
  const prefix = "profile_main"
  const color = db.color || "#C9A84C"
  const name =
    displayNameOverride ||
    (getField(fields, prefix, "display_name", db.name) !== "Conteúdo não configurado"
      ? getField(fields, prefix, "display_name", db.name)
      : db.name)

  const strong = parseStringList(getField(fields, prefix, "strengths", ""), PLACEHOLDER_LIST)
  const attention = parseStringList(getField(fields, prefix, "attention_points", ""), PLACEHOLDER_LIST)

  return {
    name,
    subtitle: getField(fields, prefix, "subtitle", db.short_description || "—"),
    tagline: getField(fields, prefix, "tagline"),
    color,
    whoYouAre: getField(fields, prefix, "who_you_are"),
    dailyAnalogy: getField(fields, prefix, "daily_analogy"),
    howYouFunction: parseStringList(getField(fields, prefix, "how_you_function", ""), PLACEHOLDER_LIST),
    howYouAct: parseStringList(getField(fields, prefix, "how_you_act", ""), PLACEHOLDER_LIST),
    howYouDecide: parseStringList(getField(fields, prefix, "how_you_decide", ""), PLACEHOLDER_LIST),
    whatMotivates: parseStringList(getField(fields, prefix, "what_motivates", ""), PLACEHOLDER_LIST),
    whatDrains: parseStringList(getField(fields, prefix, "what_drains", ""), PLACEHOLDER_LIST),
    idealEnvironment: parseStringList(getField(fields, prefix, "ideal_environment", ""), PLACEHOLDER_LIST),
    strong,
    attention,
    reflection: getField(fields, prefix, "reflection"),
    compatibilityAreas: parseCompatibilityAreas(
      getField(fields, prefix, "compatibility_areas_json", ""),
      PLACEHOLDER_AREAS
    ),
    superPowers: parseStringList(getField(fields, prefix, "super_powers", ""), [
      "—",
      "—",
      "—",
      "—",
      "—",
    ]),
    visualization: parseStringList(getField(fields, prefix, "visualization", ""), PLACEHOLDER_LIST),
    final: getField(fields, prefix, "final_message"),
    theme: themeFromColor(color, fields, prefix),
    salaries: (() => {
      const rows = parseSalaries(getField(fields, prefix, "salaries_json", ""), [])
      return rows.length > 0
        ? rows
        : [{ role: "Configure faixas salariais (JSON)", min: 0, max: 0, note: "Admin: profile_main.salaries_json" }]
    })(),
    topSalary: parseNumber(getField(fields, prefix, "top_salary", ""), 0),
  }
}

export function buildSecondaryProfileContent(fields: MergedReportFields, db: DbProfile): ReportProfileContent {
  const prefix = "profile_secondary"
  const color = db.color || "#5B3FA6"
  const name = db.name
  return {
    name,
    subtitle: getField(fields, prefix, "subtitle", db.short_description || "—"),
    tagline: getField(fields, prefix, "tagline"),
    color,
    whoYouAre: getField(fields, prefix, "who_you_are"),
    dailyAnalogy: "",
    howYouFunction: [],
    howYouAct: [],
    howYouDecide: [],
    whatMotivates: [],
    whatDrains: [],
    idealEnvironment: [],
    strong: [],
    attention: [],
    reflection: "",
    compatibilityAreas: [],
    superPowers: [],
    visualization: [],
    final: "",
    theme: themeFromColor(color, fields, prefix),
    salaries: [],
    topSalary: 0,
  }
}

export function buildRecommendedCourses(fields: MergedReportFields): RecommendedCourse[] {
  const parsed = parseRecommendedCourses(getField(fields, "courses", "recommended_json", ""), [])
  return parsed.length > 0 ? parsed : PLACEHOLDER_COURSES
}

export function buildGlobalCopy(fields: MergedReportFields, questionnaireName: string): ReportGlobalCopy {
  const welcomeParagraphs = parseStringList(getField(fields, "global", "welcome_paragraphs", ""), [
    getField(fields, "cover", "opening_text", ""),
    "Leia com calma. Sublinhe o que ressoar.",
  ]).filter(Boolean)

  const welcomeCardsRaw = getField(fields, "global", "welcome_cards_json", "")
  let welcomeCards = [
    { n: "01", t: "QUEM VOCÊ É", d: "Seu perfil principal e secundário" },
    { n: "02", t: "COMO FUNCIONA", d: "Forças, desafios e motivações" },
    { n: "03", t: "POR ONDE IR", d: "Áreas e cursos que combinam" },
  ]
  if (welcomeCardsRaw && welcomeCardsRaw !== "Conteúdo não configurado" && welcomeCardsRaw.trim().startsWith("[")) {
    try {
      const arr = JSON.parse(welcomeCardsRaw) as { n?: string; t?: string; d?: string }[]
      if (Array.isArray(arr) && arr.length > 0) {
        welcomeCards = arr.map((c, i) => ({
          n: c.n || String(i + 1).padStart(2, "0"),
          t: c.t || "—",
          d: c.d || "",
        }))
      }
    } catch {
      /* keep default */
    }
  }

  return {
    coverDiagnosisLabel: getField(fields, "cover", "diagnosis_label", "DIAGNÓSTICO COMPLETO"),
    coverBottomTagline: getField(
      fields,
      "cover",
      "bottom_tagline",
      "Mais clareza · Mais direção · Mais você no seu futuro"
    ),
    welcomeSectionLabel: getField(fields, "global", "welcome_section_label", "01 · BEM-VINDO(A)"),
    welcomeTitle: getField(fields, "global", "welcome_title", "Este é o seu retrato profissional."),
    welcomeParagraphs:
      welcomeParagraphs.length > 0
        ? welcomeParagraphs
        : ["Configure os parágrafos de boas-vindas no admin (global.welcome_paragraphs)."],
    welcomeCards,
    compatibilityIntro: getField(
      fields,
      "global",
      "compatibility_intro",
      "Estas são as cinco grandes áreas profissionais com maior aderência ao seu perfil natural."
    ),
    coursesIntroTitle: getField(fields, "courses", "intro_title", "Cursos ideais para o seu perfil"),
    coursesIntroSubtitle: getField(
      fields,
      "courses",
      "intro_subtitle",
      "Os 5 cursos com maior compatibilidade comportamental com você."
    ),
    salariesIntroNote: getField(fields, "global", "salaries_note", ""),
    salariesFootnote: getField(
      fields,
      "global",
      "salaries_footnote",
      "Fontes: Robert Half · Catho · Glassdoor · Pesquisa Salarial 2024/25 · Brasil"
    ),
    finalClosingParagraph: getField(
      fields,
      "global",
      "closing_commercial",
      "Esse não é apenas um relatório. É o início da sua próxima fase."
    ),
    brandTitle: getField(fields, "cover", "footer", questionnaireName || "DNA PROFISSIONAL™"),
    brandSubtitle: getField(fields, "cover", "subtitle", "Mais clareza. Mais direção. Mais você no seu futuro."),
  }
}

export function coverHeadlineName(profileName: string): { first: string; rest: string } {
  const parts = profileName.trim().split(/\s+/)
  return {
    first: parts[0] || profileName,
    rest: parts.slice(1).join(" ") || "PROFISSIONAL",
  }
}
