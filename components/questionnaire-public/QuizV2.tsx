"use client"

import { useMemo, useRef, useState } from "react"
import { G } from "@/lib/dna-data"
import type { PublicQuestion } from "@/lib/questionnaire-platform/public-funnel"

type Props = {
  questions: PublicQuestion[]
  participantId: string
  submitAnswers?: (answers: {questionId:string;alternativeId:string}[]) => Promise<{state:'committed'|'no_credit'}>
  onDone: (meta?: { consultantWhatsapp?: string | null }) => void
}

export function QuizV2({ questions, participantId, onDone, submitAnswers }: Props) {
  const sorted = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  )

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const pending = useRef(false)
  const current = sorted[index]
  const total = sorted.length
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0
  const selected = current ? answers[current.id] : undefined

  const goNext = async () => {
    if (!current || pending.current) return
    if (!selected) {
      setErr("Selecione uma alternativa para continuar.")
      return
    }
    setErr(null)

    const isLast = index >= total - 1
    if (!isLast) {
      setIndex(i => i + 1)
      return
    }

    pending.current = true
    setSubmitting(true)
    try {
      const missing = sorted.filter(q => !answers[q.id])
      if (missing.length > 0) {
        setErr("Responda todas as perguntas antes de finalizar.")
        setSubmitting(false)
        return
      }

      const payload = {
        answers: sorted.map(q => ({
          questionId: q.id,
          alternativeId: answers[q.id],
        })),
      }

      if (submitAnswers) {
        const receipt = await submitAnswers(payload.answers)
        if (receipt.state === 'no_credit') {
          setErr("As respostas foram salvas, mas a avaliação ainda não foi concluída por falta de créditos disponíveis.")
          return
        }
        if (receipt.state !== 'committed') throw new Error("Conclusão sem confirmação")
        onDone()
        return
      }

      const saveRes = await fetch(`/api/v2/participants/${participantId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const saveJson = await saveRes.json()
      if (!saveRes.ok) {
        setErr(saveJson.error || "Erro ao salvar respostas.")
        return
      }

      const completeRes = await fetch(`/api/v2/participants/${participantId}/complete`, {
        method: "POST",
      })
      const completeJson = await completeRes.json()
      if (!completeRes.ok) {
        setErr(completeJson.error || "Erro ao finalizar.")
        return
      }

      onDone({ consultantWhatsapp: completeJson.data?.consultantWhatsapp ?? null })
    } catch {
      setErr("Falha de rede. Tente novamente.")
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  const goBack = () => {
    if (index > 0) {
      setErr(null)
      setIndex(i => i - 1)
    }
  }

  if (!current) {
    return (
      <p className="text-center text-sm" style={{ color: G.gray }}>
        Nenhuma pergunta disponível.
      </p>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div>
        <div className="flex justify-between text-xs mb-2" style={{ color: G.gray }}>
          <span>
            Pergunta {index + 1} de {total}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(26,32,53,.8)", border: `1px solid ${G.grayDark}` }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${G.purpleVib}, ${G.gold})`,
            }}
          />
        </div>
      </div>

      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
      >
        <p className="text-lg font-semibold text-white leading-snug">{current.text}</p>
        {current.description ? (
          <p className="text-sm" style={{ color: G.gray }}>
            {current.description}
          </p>
        ) : null}

        <div className="space-y-2">
          {current.alternatives.map(alt => {
            const active = selected === alt.id
            return (
              <button
                key={alt.id}
                type="button"
                disabled={submitting}
                aria-pressed={active}
                onClick={() => {
                  setAnswers(a => ({ ...a, [current.id]: alt.id }))
                  setErr(null)
                }}
                className="w-full text-left rounded-xl px-4 py-3 text-sm transition-colors"
                style={{
                  background: active ? `${G.gold}22` : "rgba(15,20,35,.6)",
                  border: `1.5px solid ${active ? G.gold : G.grayDark}`,
                  color: active ? G.goldLight : G.white,
                }}
              >
                {alt.text}
              </button>
            )
          })}
        </div>

        {err ? (
          <p role="alert" className="text-xs text-center" style={{ color: "#F87171" }}>
            {err}
          </p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0 || submitting}
            className="flex-1 py-3 rounded-full text-sm disabled:opacity-40"
            style={{ border: `1px solid ${G.grayDark}`, color: G.gray }}
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={submitting}
            className="flex-[2] py-3 rounded-full text-sm font-bold disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
              color: G.navy,
            }}
          >
            {submitting ? "Enviando…" : index >= total - 1 ? "Finalizar" : "Próxima"}
          </button>
        </div>
      </div>
    </div>
  )
}
