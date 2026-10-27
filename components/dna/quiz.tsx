"use client"

import { useMemo, useState, useRef } from "react"
import { DEFAULT_DNA_RAPIDO_QUESTION_INDICES, getQuickQuizStageInfo } from "@/lib/app-settings"
import {
  G,
  QUESTIONS,
  type QuestionnaireType,
} from "@/lib/dna-data"

interface QuizProps {
  mode?: QuestionnaireType
  quickQuestionIndices?: number[]
  onComplete: (result: {
    primary: string
    secondary: string
    counts: Record<string, number>
    pct: Record<string, number>
  }) => void | Promise<void>
}

export function Quiz({ mode = "completo", quickQuestionIndices, onComplete }: QuizProps) {
  const questions = useMemo(() => {
    if (mode === "rapido") {
      const indices =
        quickQuestionIndices?.length && quickQuestionIndices.length > 0
          ? quickQuestionIndices
          : [...DEFAULT_DNA_RAPIDO_QUESTION_INDICES]
      return indices.map(i => QUESTIONS[i]).filter(Boolean)
    }
    return QUESTIONS
  }, [mode, quickQuestionIndices])

  const total = questions.length
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const submitting = useRef(false)

  const q = questions[current]
  const pct =
    mode === "rapido"
      ? Math.round(((current + 1) / total) * 100)
      : Math.round((current / total) * 100)
  const stageInfo =
    mode === "rapido" && total > 0 ? getQuickQuizStageInfo(current, total) : null

  const choose = (l: string) => { if (!submitting.current) setSelected(l) }

  const finishQuiz = async (na: Record<number, string>) => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
    Object.values(na).forEach(v => counts[v]++)

    const pcts: Record<string, number> = {}
    Object.keys(counts).forEach(k => {
      pcts[k] = Math.round((counts[k] / total) * 100)
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    await onComplete({ primary: sorted[0][0], secondary: sorted[1][0], counts, pct: pcts })
  }

  const next = async () => {
    if (!selected || submitting.current) return

    const na = { ...answers, [current]: selected }
    setAnswers(na)

    if (current < total - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
    } else {
      submitting.current = true
      setSaving(true)
      setSaveError("")
      try { await finishQuiz(na) }
      catch (error) { setSaveError(error instanceof Error ? error.message : "Não foi possível confirmar seu resultado. Tente novamente.") }
      finally { submitting.current = false; setSaving(false) }
    }
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: G.navy }}>
      {/* Top bar */}
      <div
        className="p-4"
        style={{ background: G.navyMid, borderBottom: `1px solid ${G.grayDark}` }}
      >
        <div className="max-w-[640px] mx-auto flex flex-col gap-2">
          {stageInfo !== null && (
            <div className="text-xs font-semibold tracking-wide" style={{ color: G.goldLight }}>
              Etapa {stageInfo.stage} de {stageInfo.totalStages}
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="text-xs whitespace-nowrap" style={{ color: G.gray }}>
              {current + 1} / {total}
            </div>
            <div
              className="flex-1 h-1 rounded-full overflow-hidden"
              style={{ background: G.grayDark }}
            >
              <div
                className="h-full rounded-full transition-all duration-400"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg,${G.purpleVib},${G.gold})`,
                }}
              />
            </div>
            <div
              className="text-xs whitespace-nowrap font-semibold"
              style={{ color: G.gold }}
            >
              {pct}%
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-6 pt-10">
        <div key={current} className="animate-fadeUp">
          {/* Question */}
          <div
            className="rounded-2xl p-7 mb-6 backdrop-blur-lg"
            style={{
              background: "rgba(26,32,53,.7)",
              border: `1px solid rgba(201,168,76,.15)`,
            }}
          >
            <div
              className="text-xs mb-3 tracking-wide font-medium"
              style={{ color: G.gray }}
            >
              PERGUNTA {current + 1}
              {mode === "rapido" ? " · DNA Rápido" : ""}
            </div>
            <h2
              className="font-semibold leading-relaxed"
              style={{ fontSize: "clamp(1rem,4vw,1.25rem)", color: G.white }}
            >
              {q.q}
            </h2>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {q.opts.map(o => (
              <div
                key={o.l}
                onClick={() => choose(o.l)}
                className="flex items-center gap-4 rounded-xl p-4 cursor-pointer transition-all"
                style={{
                  background: selected === o.l ? `rgba(201,168,76,.08)` : "rgba(26,32,53,.6)",
                  border:
                    selected === o.l ? `1.5px solid ${G.gold}` : `1.5px solid ${G.grayDark}`,
                  boxShadow: selected === o.l ? `0 0 20px ${G.gold}22` : "none",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all"
                  style={{
                    background: selected === o.l ? G.gold : G.grayDark,
                    color: selected === o.l ? G.navy : G.white,
                  }}
                >
                  {o.l}
                </div>
                <div className="text-sm leading-relaxed" style={{ color: G.white }}>
                  {o.t}
                </div>
              </div>
            ))}
          </div>

          {saveError && <p role="alert" className="text-sm mt-6" style={{ color: "#F87171" }}>{saveError}</p>}
          <button
            onClick={next}
            disabled={!selected || saving}
            className="w-full font-bold rounded-full py-4 mt-7 transition-all"
            style={{
              background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
              color: G.navy,
              opacity: selected ? 1 : 0.4,
            }}
          >
            {saving ? "Salvando resultado..." : current < total - 1 ? "Próxima pergunta" : saveError ? "Tentar salvar novamente" : "Ver meu resultado"}
          </button>
        </div>
      </div>
    </div>
  )
}
