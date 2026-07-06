"use client"

import { useParams } from "next/navigation"
import { PublicQuestionnaireFunnel } from "@/components/questionnaire-public/PublicQuestionnaireFunnel"

export default function PublicQuestionnaireBySlugPage() {
  const params = useParams()
  const slug = (params.slug as string)?.toLowerCase?.() ?? ""
  return (
    <PublicQuestionnaireFunnel
      questionnaireSlug={slug}
      sourcePath={`/q/${slug}`}
    />
  )
}
