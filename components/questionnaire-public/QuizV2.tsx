"use client"

import { useMemo, useRef, useState } from "react"
import { G } from "@/lib/dna-data"
import type { PublicQuestion } from "@/lib/questionnaire-platform/public-funnel"
import {questionDisplayText,questionDisplayTitle} from '@/lib/questionnaire-engine/integration/question-display'
import styles from './quiz-conversation.module.css'

type Props = {
  questions: PublicQuestion[]
  participantId: string
  submitAnswers?: (answers: {questionId:string;alternativeId:string}[]) => Promise<{state:'committed'|'no_credit'}>
  initialAnswers?: Record<string,string>
  saveDraft?: (answers: {questionId:string;alternativeId:string}[]) => Promise<void>
  onDone: (meta?: { consultantWhatsapp?: string | null }) => void
}

export function QuizV2({ questions, participantId, onDone, submitAnswers, initialAnswers = {}, saveDraft }: Props) {
  const sorted = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  )

  const [index, setIndex] = useState(() => {
    const firstMissing = sorted.findIndex(q => !initialAnswers[q.id])
    return firstMissing < 0 ? Math.max(0, sorted.length - 1) : firstMissing
  })
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
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
    if (saveDraft) {
      pending.current = true
      setSubmitting(true)
      try {
        await saveDraft(sorted.filter(q => answers[q.id]).map(q => ({questionId:q.id,alternativeId:answers[q.id]})))
      } catch {
        setErr("Não foi possível salvar. Tente novamente antes de sair.")
        return
      } finally {
        pending.current = false
        setSubmitting(false)
      }
    }
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
    <div className={styles.quiz} data-tone={index%3}>
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
        className={styles.card}
      >
        {current.description&&<p className={styles.topic}>{questionDisplayTitle(current.description)}</p>}
        <h1 className={styles.question}>{questionDisplayText(current.text)}</h1>
        {current.description ? (
          <p className={styles.hint}>Qual opção mais se aproxima do seu jeito? Toque para escolher.</p>
        ) : null}

        <div className="space-y-2">
          {current.alternatives.map((alt,optionIndex) => {
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
                className={styles.option}
              >
                <span className={styles.letter} aria-hidden="true">{active?'✓':String.fromCharCode(65+optionIndex)}</span><span>{questionDisplayText(alt.text)}</span>
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
