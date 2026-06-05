"use client"

import { useState } from "react"
import { G, QUESTIONS } from "@/lib/dna-data"

interface QuizProps {
  onComplete: (result: {
    primary: string
    secondary: string
    counts: Record<string, number>
    pct: Record<string, number>
  }) => void
}

export function Quiz({ onComplete }: QuizProps) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const q = QUESTIONS[current]
  const pct = Math.round((current / QUESTIONS.length) * 100)

  const choose = (l: string) => setSelected(l)

  const next = () => {
    if (!selected) return

    const na = { ...answers, [current]: selected }
    setAnswers(na)

    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
    } else {
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
      Object.values(na).forEach(v => counts[v]++)

      const total = QUESTIONS.length
      const pcts: Record<string, number> = {}
      Object.keys(counts).forEach(k => pcts[k] = Math.round(counts[k] / total * 100))

      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      onComplete({ primary: sorted[0][0], secondary: sorted[1][0], counts, pct: pcts })
    }
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: G.navy }}>
      {/* Top bar */}
      <div
        className="p-4"
        style={{ background: G.navyMid, borderBottom: `1px solid ${G.grayDark}` }}
      >
        <div className="max-w-[640px] mx-auto flex items-center gap-4">
          <div className="text-xs whitespace-nowrap" style={{ color: G.gray }}>
            {current + 1} / {QUESTIONS.length}
          </div>
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: G.grayDark }}
          >
            <div
              className="h-full rounded-full transition-all duration-400"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg,${G.purpleVib},${G.gold})`
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

      <div className="max-w-[640px] mx-auto px-6 pt-10">
        <div key={current} className="animate-fadeUp">
          {/* Question */}
          <div
            className="rounded-2xl p-7 mb-6 backdrop-blur-lg"
            style={{
              background: "rgba(26,32,53,.7)",
              border: `1px solid rgba(201,168,76,.15)`
            }}
          >
            <div
              className="text-xs mb-3 tracking-wide font-medium"
              style={{ color: G.gray }}
            >
              PERGUNTA {current + 1}
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
                  border: selected === o.l ? `1.5px solid ${G.gold}` : `1.5px solid ${G.grayDark}`,
                  boxShadow: selected === o.l ? `0 0 20px ${G.gold}22` : "none"
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all"
                  style={{
                    background: selected === o.l ? G.gold : G.grayDark,
                    color: selected === o.l ? G.navy : G.white
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

          <button
            onClick={next}
            disabled={!selected}
            className="w-full font-bold rounded-full py-4 mt-7 transition-all"
            style={{
              background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
              color: G.navy,
              opacity: selected ? 1 : 0.4
            }}
          >
            {current < QUESTIONS.length - 1 ? "Próxima pergunta" : "Ver meu resultado"}
          </button>
        </div>
      </div>
    </div>
  )
}
