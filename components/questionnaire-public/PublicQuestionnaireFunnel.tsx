"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { G } from "@/lib/dna-data"
import { RegistrationV2 } from "@/components/questionnaire-public/RegistrationV2"
import { QuizV2 } from "@/components/questionnaire-public/QuizV2"
import { ThankYouV2 } from "@/components/questionnaire-public/ThankYouV2"
import type { PublicQuestionnairePayload } from "@/lib/questionnaire-platform/public-funnel"
import { buildWhatsAppUrl } from "@/lib/questionnaire-platform/whatsapp"

type Step = "loading" | "notfound" | "register" | "quiz" | "thanks"

type Props = {
  questionnaireSlug: string
  sourcePath: string
}

function PublicQuestionnaireFunnelInner({ questionnaireSlug, sourcePath }: Props) {
  const searchParams = useSearchParams()
  const vendorSlug = searchParams.get("v") || searchParams.get("vendor") || null

  const [step, setStep] = useState<Step>("loading")
  const [payload, setPayload] = useState<PublicQuestionnairePayload | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [consultantWa, setConsultantWa] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!questionnaireSlug) {
      setStep("notfound")
      return
    }
    setStep("loading")
    setLoadError(null)
    try {
      const res = await fetch(`/api/v2/questionnaires/public/${encodeURIComponent(questionnaireSlug)}`)
      const json = await res.json()
      if (!res.ok) {
        setLoadError(json.error || "Questionário indisponível.")
        setStep("notfound")
        return
      }
      setPayload(json.data as PublicQuestionnairePayload)
      setStep("register")
    } catch {
      setLoadError("Não foi possível carregar o questionário.")
      setStep("notfound")
    }
  }, [questionnaireSlug])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: G.navy, color: G.white }}
    >
      {step === "loading" ? (
        <p className="text-sm animate-pulse" style={{ color: G.gray }}>
          Carregando questionário…
        </p>
      ) : null}

      {step === "notfound" ? (
        <div className="text-center max-w-sm space-y-4">
          <h1 className="text-xl font-bold">Questionário não encontrado</h1>
          <p className="text-sm" style={{ color: G.gray }}>
            {loadError ?? "Este link pode estar incorreto ou o teste ainda não foi publicado."}
          </p>
        </div>
      ) : null}

      {step === "register" && payload ? (
        <RegistrationV2
          questionnaireId={payload.questionnaire.id}
          questionnaireName={payload.questionnaire.name}
          description={payload.questionnaire.description}
          vendorSlug={vendorSlug}
          sourceLink={sourcePath}
          onRegistered={id => {
            setParticipantId(id)
            setStep("quiz")
          }}
        />
      ) : null}

      {step === "quiz" && payload && participantId ? (
        <QuizV2
          questions={payload.questions}
          participantId={participantId}
          onDone={meta => {
            if (meta?.consultantWhatsapp) setConsultantWa(meta.consultantWhatsapp)
            setStep("thanks")
          }}
        />
      ) : null}

      {step === "thanks" ? (
        <ThankYouV2
          whatsappUrl={
            consultantWa
              ? buildWhatsAppUrl(
                  consultantWa,
                  "Olá! Concluí meu DNA da Profissão e gostaria de falar com meu consultor."
                )
              : null
          }
        />
      ) : null}
    </div>
  )
}

export function PublicQuestionnaireFunnel(props: Props) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: G.navy, color: G.gray }}
        >
          Carregando…
        </div>
      }
    >
      <PublicQuestionnaireFunnelInner {...props} />
    </Suspense>
  )
}
