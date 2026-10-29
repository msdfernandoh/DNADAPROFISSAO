"use client"

import { useParams } from "next/navigation"
import { PublicQuestionnaireFunnel } from "@/components/questionnaire-public/PublicQuestionnaireFunnel"
import {PublicDnaJourney} from '@/components/saas/PublicDnaJourney';

export default function PublicQuestionnaireBySlugPage() {
  const params = useParams()
  const slug = (params.slug as string)?.toLowerCase?.() ?? ""
  if(slug==='dna-oficial-2026-10-26-v1')return <PublicDnaJourney/>;
  return (
    <PublicQuestionnaireFunnel
      questionnaireSlug={slug}
      sourcePath={`/q/${slug}`}
    />
  )
}
