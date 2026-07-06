"use client"

import { G } from "@/lib/dna-data"
import { inputStyle, labelStyle } from "@/components/questionnaire-admin/shell"
import type { QuestionnaireProfileRow } from "@/lib/questionnaire-platform/validators"
import { MAX_WEIGHT } from "@/lib/questionnaire-platform/questionnaire-db-helpers"

export type WeightDraft = Record<string, Record<string, number>>

type Props = {
  alternativeId: string
  alternativeText: string
  profiles: QuestionnaireProfileRow[]
  draft: WeightDraft
  onChange: (alternativeId: string, profileId: string, weight: number) => void
  showAlert?: boolean
}

export function WeightMatrix({
  alternativeId,
  alternativeText,
  profiles,
  draft,
  onChange,
  showAlert,
}: Props) {
  const activeProfiles = profiles.filter(p => p.active)
  const values = draft[alternativeId] ?? {}
  const hasPositive = activeProfiles.some(p => (values[p.id] ?? 0) > 0)

  return (
    <div
      className="rounded-xl p-3 mt-2"
      style={{
        background: G.navyMid,
        border: `1px solid ${showAlert && !hasPositive ? "#FB923C66" : G.grayDark}`,
      }}
    >
      <div className="text-xs mb-2" style={{ color: G.gray }}>
        Pesos — <span style={{ color: G.white }}>{alternativeText}</span>
      </div>
      {showAlert && !hasPositive ? (
        <p className="text-xs mb-2" style={{ color: "#FB923C" }}>
          Esta alternativa não possui nenhum peso maior que zero.
        </p>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {activeProfiles.map(p => (
          <div key={p.id}>
            <div style={labelStyle}>{p.code}</div>
            <input
              type="number"
              min={0}
              max={MAX_WEIGHT}
              step={1}
              value={values[p.id] ?? 0}
              onChange={e => {
                let v = parseInt(e.target.value, 10)
                if (Number.isNaN(v) || v < 0) v = 0
                if (v > MAX_WEIGHT) v = MAX_WEIGHT
                onChange(alternativeId, p.id, v)
              }}
              className="w-full rounded-lg px-2 py-1.5 text-sm outline-none font-mono"
              style={inputStyle}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function buildWeightDraftFromTree(
  questions: {
    alternatives: { id: string; weights: { profile_id: string; weight: number }[] }[]
  }[],
  profiles: QuestionnaireProfileRow[]
): WeightDraft {
  const draft: WeightDraft = {}
  const activeProfileIds = profiles.filter(p => p.active).map(p => p.id)

  for (const q of questions) {
    for (const alt of q.alternatives) {
      draft[alt.id] = {}
      for (const pid of activeProfileIds) {
        draft[alt.id][pid] = 0
      }
      for (const w of alt.weights) {
        if (!draft[alt.id]) draft[alt.id] = {}
        draft[alt.id][w.profile_id] = w.weight
      }
    }
  }
  return draft
}

export function flattenWeightDraft(
  draft: WeightDraft,
  alternativeIds?: string[]
): { alternative_id: string; profile_id: string; weight: number }[] {
  const rows: { alternative_id: string; profile_id: string; weight: number }[] = []
  const altKeys = alternativeIds ?? Object.keys(draft)

  for (const altId of altKeys) {
    const byProfile = draft[altId]
    if (!byProfile) continue
    for (const [profileId, weight] of Object.entries(byProfile)) {
      rows.push({ alternative_id: altId, profile_id: profileId, weight })
    }
  }
  return rows
}
