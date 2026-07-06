"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { G } from "@/lib/dna-data"
import { QuestionnaireAdminShell, inputStyle, labelStyle, useAdminGate } from "@/components/questionnaire-admin/shell"
import { QuestionEditor } from "@/components/questionnaire-admin/QuestionEditor"
import {
  buildWeightDraftFromTree,
  flattenWeightDraft,
} from "@/components/questionnaire-admin/WeightMatrix"
import type { WeightDraft } from "@/components/questionnaire-admin/WeightMatrix"
import { collectConfigWarnings } from "@/lib/questionnaire-platform/config-warnings"
import type { QuestionWithAlternatives } from "@/lib/questionnaire-platform/question-types"
import type { QuestionnaireProfileRow } from "@/lib/questionnaire-platform/validators"

export default function QuestionnaireQuestionsPage() {
  const ready = useAdminGate()
  const params = useParams()
  const questionnaireId = params.id as string

  const [questions, setQuestions] = useState<QuestionWithAlternatives[]>([])
  const [profiles, setProfiles] = useState<QuestionnaireProfileRow[]>([])
  const [weightDraft, setWeightDraft] = useState<WeightDraft>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [newQuestionText, setNewQuestionText] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/questions`)
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao carregar." })
        return
      }
      const qs = (json.data?.questions ?? []) as QuestionWithAlternatives[]
      const pr = (json.data?.profiles ?? []) as QuestionnaireProfileRow[]
      setQuestions(qs)
      setProfiles(pr)
      setWeightDraft(buildWeightDraftFromTree(qs, pr))
    } finally {
      setLoading(false)
    }
  }, [questionnaireId])

  useEffect(() => {
    if (ready && questionnaireId) load()
  }, [ready, questionnaireId, load])

  const warnings = useMemo(
    () => collectConfigWarnings(questions, profiles),
    [questions, profiles]
  )

  const onWeightChange = (alternativeId: string, profileId: string, weight: number) => {
    setWeightDraft(prev => ({
      ...prev,
      [alternativeId]: {
        ...(prev[alternativeId] ?? {}),
        [profileId]: weight,
      },
    }))
  }

  const saveWeightsForQuestion = async (questionId: string) => {
    const q = questions.find(x => x.id === questionId)
    if (!q) return
    const altIds = q.alternatives.map(a => a.id)
    setBusy(true)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/weights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights: flattenWeightDraft(weightDraft, altIds) }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao salvar pesos." })
        return
      }
      setMsg({ type: "ok", text: "Pesos salvos." })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const saveAllWeights = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/weights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights: flattenWeightDraft(weightDraft) }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao salvar pesos." })
        return
      }
      setMsg({ type: "ok", text: "Todos os pesos salvos." })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestionText.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newQuestionText.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao criar pergunta." })
        return
      }
      setNewQuestionText("")
      setMsg({ type: "ok", text: "Pergunta criada." })
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: G.navy }}>
        <div className="text-sm" style={{ color: G.gray }}>
          Verificando acesso…
        </div>
      </div>
    )
  }

  return (
    <QuestionnaireAdminShell title="Perguntas e pesos" subtitle="Montagem do questionário (draft)">
      <Link
        href={`/admin/questionarios/${questionnaireId}`}
        className="inline-block text-sm mb-4"
        style={{ color: G.goldLight }}
      >
        ← Voltar ao questionário
      </Link>

      {msg ? (
        <p
          className="text-sm p-2 rounded mb-4"
          style={{
            background: msg.type === "ok" ? `${G.gold}22` : "#FB923C22",
            color: msg.type === "ok" ? G.goldLight : "#FB923C",
          }}
        >
          {msg.text}
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: "#FB923C15", border: "1px solid #FB923C44" }}
        >
          <p className="font-semibold mb-2" style={{ color: "#FB923C" }}>
            Avisos (não bloqueiam publicação nesta fase)
          </p>
          <ul className="list-disc pl-5 space-y-1" style={{ color: G.white }}>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={createQuestion}
        className="rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end max-w-2xl"
        style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
      >
        <div className="flex-1 min-w-[240px]">
          <div style={labelStyle}>Nova pergunta</div>
          <input
            value={newQuestionText}
            onChange={e => setNewQuestionText(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
            placeholder="Enunciado da pergunta"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          style={{ background: G.gold, color: G.navy }}
        >
          + Pergunta
        </button>
      </form>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          disabled={busy || loading}
          onClick={saveAllWeights}
          className="text-sm px-4 py-2 rounded-lg disabled:opacity-40"
          style={{ background: `${G.purpleVib}55`, border: `1px solid ${G.purpleVib}` }}
        >
          Salvar todos os pesos
        </button>
      </div>

      {loading ? (
        <p style={{ color: G.gray }}>Carregando…</p>
      ) : questions.length === 0 ? (
        <p style={{ color: G.gray }}>Nenhuma pergunta. Crie a primeira acima.</p>
      ) : (
        questions.map(q => (
          <QuestionEditor
            key={q.id}
            question={q}
            profiles={profiles}
            weightDraft={weightDraft}
            onWeightChange={onWeightChange}
            busy={busy}
            onSaveQuestion={async (question, patch) => {
              setBusy(true)
              try {
                const res = await fetch(
                  `/api/v2/admin/questionnaires/${questionnaireId}/questions/${question.id}`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patch),
                  }
                )
                const json = await res.json()
                if (!res.ok) {
                  setMsg({ type: "err", text: json.error || "Erro." })
                  return
                }
                setMsg({ type: "ok", text: "Pergunta atualizada." })
                await load()
              } finally {
                setBusy(false)
              }
            }}
            onInactivateQuestion={async questionId => {
              if (!confirm("Inativar esta pergunta?")) return
              setBusy(true)
              try {
                await fetch(
                  `/api/v2/admin/questionnaires/${questionnaireId}/questions/${questionId}`,
                  { method: "DELETE" }
                )
                await load()
              } finally {
                setBusy(false)
              }
            }}
            onAddAlternative={async (questionId, text) => {
              setBusy(true)
              try {
                const res = await fetch(
                  `/api/v2/admin/questionnaires/${questionnaireId}/questions/${questionId}/alternatives`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                  }
                )
                const json = await res.json()
                if (!res.ok) {
                  setMsg({ type: "err", text: json.error || "Erro." })
                  return
                }
                await load()
              } finally {
                setBusy(false)
              }
            }}
            onSaveAlternative={async (questionId, altId, patch) => {
              setBusy(true)
              try {
                const res = await fetch(
                  `/api/v2/admin/questionnaires/${questionnaireId}/questions/${questionId}/alternatives`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: altId, ...patch }),
                  }
                )
                const json = await res.json()
                if (!res.ok) {
                  setMsg({ type: "err", text: json.error || "Erro." })
                  return
                }
                await load()
              } finally {
                setBusy(false)
              }
            }}
            onInactivateAlternative={async (questionId, altId) => {
              if (!confirm("Inativar alternativa?")) return
              setBusy(true)
              try {
                await fetch(
                  `/api/v2/admin/questionnaires/${questionnaireId}/questions/${questionId}/alternatives?alternativeId=${altId}`,
                  { method: "DELETE" }
                )
                await load()
              } finally {
                setBusy(false)
              }
            }}
            onSaveQuestionWeights={saveWeightsForQuestion}
          />
        ))
      )}
    </QuestionnaireAdminShell>
  )
}
