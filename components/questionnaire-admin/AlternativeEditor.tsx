"use client"

import { G } from "@/lib/dna-data"
import { inputStyle, labelStyle } from "@/components/questionnaire-admin/shell"
import type { AlternativeWithWeights } from "@/lib/questionnaire-platform/question-types"

type Props = {
  alternative: AlternativeWithWeights
  onSave: (alt: AlternativeWithWeights, patch: { text?: string; order?: number; active?: boolean }) => Promise<void>
  onInactivate: (altId: string) => Promise<void>
  saving?: boolean
  children?: React.ReactNode
}

export function AlternativeEditor({ alternative, onSave, onInactivate, saving, children }: Props) {
  return (
    <div
      className="rounded-lg p-3 mb-2"
      style={{
        background: "rgba(11,14,26,.5)",
        border: `1px solid ${G.grayDark}`,
        opacity: alternative.active ? 1 : 0.55,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-7">
          <div style={labelStyle}>Alternativa (ordem {alternative.order})</div>
          <input
            key={alternative.id + alternative.text}
            defaultValue={alternative.text}
            id={`alt-text-${alternative.id}`}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div className="md:col-span-2">
          <div style={labelStyle}>Ordem</div>
          <input
            type="number"
            defaultValue={alternative.order}
            id={`alt-order-${alternative.id}`}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div className="md:col-span-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              const textEl = document.getElementById(`alt-text-${alternative.id}`) as HTMLInputElement
              const orderEl = document.getElementById(`alt-order-${alternative.id}`) as HTMLInputElement
              onSave(alternative, {
                text: textEl?.value ?? alternative.text,
                order: parseInt(orderEl?.value ?? String(alternative.order), 10) || alternative.order,
              })
            }}
            className="text-xs px-3 py-2 rounded-lg disabled:opacity-50"
            style={{ background: G.gold, color: G.navy }}
          >
            Salvar alt.
          </button>
          {alternative.active ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => onInactivate(alternative.id)}
              className="text-xs px-3 py-2 rounded-lg disabled:opacity-50"
              style={{ background: "#FB923C22", border: "1px solid #FB923C55" }}
            >
              Inativar
            </button>
          ) : (
            <span className="text-xs py-2" style={{ color: G.gray }}>
              Inativa
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
