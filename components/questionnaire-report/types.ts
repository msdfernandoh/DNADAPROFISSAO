import type {
  ReportGlobalCopy,
  ReportProfileContent,
} from "@/lib/questionnaire-report/map-profile-content"
import type { RecommendedCourse } from "@/lib/questionnaire-report/report-field-parsers"

export type PlatformProfileSnapshot = {
  code: string
  name: string
  color: string | null
  shortDescription: string | null
}

export type PlatformRankingEntry = {
  profileCode: string
  score: number
  percentage: number
}

export type PlatformReportSectionProps = {
  sectionKey: string
  title: string | null
  sortOrder: number
  fields: Record<string, string>
}

export type ResultPDFPlatformProps = {
  participantName: string
  participantEmail: string
  courseInterest: string | null
  questionnaireName: string
  questionnaireSlug: string
  resultCode: string | null
  mainProfile: PlatformProfileSnapshot
  secondaryProfile: PlatformProfileSnapshot
  scores: Record<string, number>
  percentages: Record<string, number>
  ranking: PlatformRankingEntry[]
  template: { id: string; name: string; layoutKey: string } | null
  sections: PlatformReportSectionProps[]
  contentFields: Record<string, string>
  /** Conteúdo principal mapeado para layout V1 */
  primaryContent: ReportProfileContent
  secondaryContent: ReportProfileContent
  recommendedCourses: RecommendedCourse[]
  globalCopy: ReportGlobalCopy
  synergyText: string
  closingMessage: string
  ctaText: string
  warnings: string[]
  generatedAt: string
}
