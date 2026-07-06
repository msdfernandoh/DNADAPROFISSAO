"use client"

import { G } from "@/lib/dna-data"
import { inputStyle, labelStyle } from "@/components/questionnaire-admin/shell"
import { AlternativeEditor } from "@/components/questionnaire-admin/AlternativeEditor"
import { WeightMatrix } from "@/components/questionnaire-admin/WeightMatrix"
import type { QuestionWithAlternatives } from "@/lib/questionnaire-platform/question-types"
import type { QuestionnaireProfileRow } from "@/lib/questionnaire-platform/validators"
import type { WeightDraft } from "@/components/questionnaire-admin/WeightMatrix"

type Props = {
  question: QuestionWithAlternatives
  profiles: QuestionnaireProfileRow[]
  weightDraft: WeightDraft
  onWeightChange: (alternativeId: string, profileId: string, weight: number) => void
  onSaveQuestion: (
    q: QuestionWithAlternatives,
    patch: { text?: string; description?: string | null; order?: number; active?: boolean }
  ) => Promise<void>
  onInactivateQuestion: (questionId: string) => Promise<void>
  onAddAlternative: (questionId: string, text: string) => Promise<void>
  onSaveAlternative: (
    questionId: string,
    altId: string,
    patch: { text?: string; order?: number; active?: boolean }
  ) => Promise<void>
  onInactivateAlternative: (questionId: string, altId: string) => Promise<void>
  onSaveQuestionWeights: (questionId: string) => Promise<void>
  busy?: boolean
}

export function QuestionEditor({
  question,
  profiles,
  weightDraft,
  onWeightChange,
  onSaveQuestion,
  onInactivateQuestion,
  onAddAlternative,
  onSaveAlternative,
  onInactivateAlternative,
  onSaveQuestionWeights,
  busy,
}: Props) {
  const activeAlts = question.alternatives.filter(a => a.active)
  const altCountWarning = question.active && activeAlts.length < 2

  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: "rgba(26,32,53,.85)",
        border: `1px solid ${altCountWarning ? "#FB923C55" : G.grayDark}`,
        opacity: question.active ? 1 : 0.6,
      }}
    >
      <div className="flex flex-wrap justify-between gap-2 mb-3">
        <h3 className="font-semibold text-sm" style={{ color: G.goldLight }}>
          Pergunta {question.order}
        </h3>
        {altCountWarning ? (
          <span className="text-xs" style={{ color: "#FB923C" }}>
            Menos de 2 alternativas ativas
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="md:col-span-2">
          <div style={labelStyle}>Enunciado *</div>
          <textarea
            defaultValue={question.text}
            id={`q-text-${question.id}`}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
            style={inputStyle}
          />
        </div>
        <div className="md:col-span-2">
          <div style={labelStyle}>Descrição (opcional)</div>
          <input
            defaultValue={question.description ?? ""}
            id={`q-desc-${question.id}`}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>Ordem</div>
          <input
            type="number"
            defaultValue={question.order}
            id={`q-order-${question.id}`}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const text = (document.getElementById(`q-text-${question.id}`) as HTMLTextAreaElement)?.value
              const description = (document.getElementById(`q-desc-${question.id}`) as HTMLInputElement)?.value
              const order = parseInt(
                (document.getElementById(`q-order-${question.id}`) as HTMLInputElement)?.value ??
                  String(question.order),
                10
              )
              onSaveQuestion(question, {
                text: text?.trim(),
                description: description?.trim() || null,
                order: order || question.order,
              })
            }}
            className="text-xs px-3 py-2 rounded-lg disabled:opacity-50"
            style={{ background: G.gold, color: G.navy }}
          >
            Salvar pergunta
          </button>
          {question.active ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onInactivateQuestion(question.id)}
              className="text-xs px-3 py-2 rounded-lg"
              style={{ border: `1px solid ${G.grayDark}` }}
            >
              Inativar pergunta
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-t pt-4 mt-2" style={{ borderColor: G.grayDark }}>
        <p className="text-xs font-semibold mb-2" style={{ color: G.gray }}>
          Alternativas
        </p>

        {question.alternatives.map(alt => (
          <AlternativeEditor
            key={alt.id}
            alternative={alt}
            saving={busy}
            onSave={(_, patch) => onSaveAlternative(question.id, alt.id, patch)}
            onInactivate={altId => onInactivateAlternative(question.id, altId)}
          >
            <WeightMatrix
              alternativeId={alt.id}
              alternativeText={alt.text}
              profiles={profiles}
              draft={weightDraft}
              onChange={onWeightChange}
              showAlert={alt.active}
            />
          </AlternativeEditor>
        ))}

        <AddAlternativeForm questionId={question.id} onAdd={onAddAlternative} busy={busy} />

        <button
          type="button"
          disabled={busy || question.alternatives.length === 0}
          onClick={() => onSaveQuestionWeights(question.id)}
          className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
          style={{ background: `${G.purpleVib}44`, border: `1px solid ${G.purpleVib}`, color: G.white }}
        >
          Salvar pesos desta pergunta
        </button>
      </div>
    </div>
  )
}

function AddAlternativeForm({
  questionId,
  onAdd,
  busy,
}: {
  questionId: string
  onAdd: (questionId: string, text: string) => Promise<void>
  busy?: boolean
}) {
  return (
    <form
      className="flex flex-wrap gap-2 mt-3 items-end"
      onSubmit={async e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const text = String(fd.get("text") ?? "").trim()
        if (!text) return
        await onAdd(questionId, text)
        e.currentTarget.reset()
      }}
    >
      <div className="flex-1 min-w-[200px]">
        <div style={labelStyle}>Nova alternativa</div>
        <input
          name="text"
          required
          placeholder="Texto da alternativa"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="text-xs px-4 py-2.5 rounded-lg disabled:opacity-50"
        style={{ background: G.navyLight, border: `1px solid ${G.gold}55`, color: G.goldLight }}
      >
        + Alternativa
      </button>
    </form>
  )
}
