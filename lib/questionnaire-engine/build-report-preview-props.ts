import { buildRankingFromResult } from "@/lib/questionnaire-platform/lead-types"
import {
  getField,
  mergeReportContents,
  REPORT_CONTENT_FALLBACK,
  type ReportContentRow,
} from "@/lib/questionnaire-engine/merge-report-content"
import type { ResultPDFPlatformProps } from "@/components/questionnaire-report/types"
import {
  buildGlobalCopy,
  buildMainProfileContent,
  buildRecommendedCourses,
  buildSecondaryProfileContent,
} from "@/lib/questionnaire-report/map-profile-content"

type ProfileRow = {
  id: string
  code: string
  name: string
  color: string | null
  short_description: string | null
  sort_order: number
}

export type BuildReportPreviewInput = {
  questionnaire: { id: string; name: string; slug: string }
  template: { id: string; name: string; layout_key: string } | null
  sectionDefs: { section_key: string; title: string | null; sort_order: number }[]
  contentRows: ReportContentRow[]
  profiles: ProfileRow[]
  mainProfileId: string
  secondaryProfileId: string
  participantName: string
  participantEmail?: string
  courseInterest?: string | null
  percentages: Record<string, number>
}

export function buildReportPreviewProps(input: BuildReportPreviewInput): ResultPDFPlatformProps {
  const mainRow = input.profiles.find(p => p.id === input.mainProfileId)
  const secRow = input.profiles.find(p => p.id === input.secondaryProfileId)

  const merged = mergeReportContents(
    input.contentRows,
    input.mainProfileId,
    input.secondaryProfileId
  )
  const fields = merged.fields
  const warnings = [...merged.warnings]

  const codes = input.profiles.map(p => p.code)
  const scores: Record<string, number> = {}
  for (const c of codes) scores[c] = 0
  for (const [code, pct] of Object.entries(input.percentages)) {
    scores[code] = pct
  }

  const profileMeta = input.profiles.map(p => ({ code: p.code, sort_order: p.sort_order }))
  const ranking = buildRankingFromResult(scores, input.percentages, profileMeta)

  const mainCode = mainRow?.code ?? ""
  const secondaryCode = secRow?.code ?? ""

  const sections = input.sectionDefs.map(sec => {
    const prefix = `${sec.section_key}.`
    const sectionFields: Record<string, string> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (key.startsWith(prefix)) sectionFields[key.slice(prefix.length)] = value
    }
    return {
      sectionKey: sec.section_key,
      title: sec.title,
      sortOrder: sec.sort_order,
      fields: sectionFields,
    }
  })

  const displayMainName =
    getField(fields, "profile_main", "display_name", "") !== REPORT_CONTENT_FALLBACK
      ? getField(fields, "profile_main", "display_name")
      : undefined

  const primaryContent = buildMainProfileContent(
    fields,
    {
      name: mainRow?.name ?? mainCode,
      color: mainRow?.color ?? null,
      short_description: mainRow?.short_description ?? null,
    },
    displayMainName
  )

  const secondaryContent = buildSecondaryProfileContent(fields, {
    name: secRow?.name ?? secondaryCode,
    color: secRow?.color ?? null,
    short_description: secRow?.short_description ?? null,
  })

  const globalCopy = buildGlobalCopy(fields, input.questionnaire.name)

  return {
    participantName: input.participantName,
    participantEmail: input.participantEmail ?? "preview@exemplo.local",
    courseInterest: input.courseInterest ?? null,
    questionnaireName: input.questionnaire.name,
    questionnaireSlug: input.questionnaire.slug,
    resultCode: mainCode && secondaryCode ? `${mainCode}_${secondaryCode}` : null,
    mainProfile: {
      code: mainCode,
      name: primaryContent.name,
      color: mainRow?.color ?? null,
      shortDescription:
        primaryContent.subtitle !== "—" ? primaryContent.subtitle : mainRow?.short_description ?? null,
    },
    secondaryProfile: {
      code: secondaryCode,
      name: secondaryContent.name,
      color: secRow?.color ?? null,
      shortDescription: secRow?.short_description ?? null,
    },
    scores,
    percentages: input.percentages,
    ranking,
    template: input.template
      ? { id: input.template.id, name: input.template.name, layoutKey: input.template.layout_key }
      : null,
    sections,
    contentFields: fields,
    primaryContent,
    secondaryContent,
    recommendedCourses: buildRecommendedCourses(fields),
    globalCopy,
    synergyText: getField(fields, "profile_pair", "synergy"),
    closingMessage: getField(fields, "global", "closing_message"),
    ctaText: getField(fields, "global", "cta", "Fale com nossa equipe para liberar seu mapa completo."),
    warnings,
    generatedAt: new Date().toISOString(),
  }
}
