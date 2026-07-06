"use client"

import { G } from "@/lib/dna-data"
import type { LeadResultSummary } from "@/lib/questionnaire-platform/lead-types"

type Props = {
  result: LeadResultSummary | null
  compact?: boolean
}

export function ResultSummary({ result, compact }: Props) {
  if (!result) {
    return (
      <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${G.grayDark}88`, color: G.gray }}>
        Pendente
      </span>
    )
  }

  if (compact) {
    return (
      <div className="text-xs space-y-0.5">
        <div>
          <span style={{ color: G.gray }}>Principal: </span>
          <strong style={{ color: G.goldLight }}>{result.main_profile ?? "—"}</strong>
          {result.secondary_profile ? (
            <span style={{ color: G.gray }}> · {result.secondary_profile}</span>
          ) : null}
        </div>
        {result.result_code ? (
          <div className="font-mono opacity-80">{result.result_code}</div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-4">
        <div>
          <div className="text-xs" style={{ color: G.gray }}>
            Perfil principal
          </div>
          <div className="font-semibold" style={{ color: G.goldLight }}>
            {result.main_profile ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-xs" style={{ color: G.gray }}>
            Segunda força
          </div>
          <div className="font-semibold">{result.secondary_profile ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: G.gray }}>
            Código
          </div>
          <div className="font-mono text-xs">{result.result_code ?? "—"}</div>
        </div>
      </div>

      {result.ranking && result.ranking.length > 0 ? (
        <div>
          <div className="text-xs mb-2" style={{ color: G.gray }}>
            Ranking
          </div>
          <ul className="space-y-1">
            {result.ranking.map((r, i) => (
              <li
                key={r.profileCode}
                className="flex justify-between text-xs px-2 py-1 rounded"
                style={{ background: i < 2 ? `${G.gold}15` : "transparent" }}
              >
                <span>
                  {i + 1}. {r.profileCode}
                </span>
                <span style={{ color: G.gray }}>
                  {r.score} pts · {r.percentage}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.percentages && Object.keys(result.percentages).length > 0 ? (
        <div>
          <div className="text-xs mb-2" style={{ color: G.gray }}>
            Percentuais
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(result.percentages)
              .sort((a, b) => b[1] - a[1])
              .map(([code, pct]) => (
                <span
                  key={code}
                  className="text-xs px-2 py-1 rounded font-mono"
                  style={{ background: G.navyLight, border: `1px solid ${G.grayDark}` }}
                >
                  {code}: {pct}%
                </span>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
