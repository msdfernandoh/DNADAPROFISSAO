"use client"

import { G, PROFILES } from "@/lib/dna-data"

interface RadarChartProps {
  scores: Record<string, number>
}

export function RadarChart({ scores }: RadarChartProps) {
  const labels = ["A", "B", "C", "D", "E"]
  const colors: Record<string, string> = { 
    A: G.goldLight, 
    B: "#C084FC", 
    C: "#60A5FA", 
    D: "#34D399", 
    E: "#FB923C" 
  }
  const max = Math.max(...Object.values(scores), 1)
  const cx = 100
  const cy = 100
  const r = 72

  const pts = labels.map((l, i) => {
    const angle = (i * 72 - 90) * Math.PI / 180
    const val = (scores[l] || 0) / max
    return [cx + r * val * Math.cos(angle), cy + r * val * Math.sin(angle)]
  })

  const polygon = pts.map(p => p.join(",")).join(" ")

  const axes = labels.map((l, i) => {
    const angle = (i * 72 - 90) * Math.PI / 180
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (r + 18) * Math.cos(angle),
      ly: cy + (r + 18) * Math.sin(angle),
      l
    }
  })

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px]">
      {[.25, .5, .75, 1].map(s => (
        <polygon
          key={s}
          points={labels.map((_, i) => {
            const a = (i * 72 - 90) * Math.PI / 180
            return `${cx + r * s * Math.cos(a)},${cy + r * s * Math.sin(a)}`
          }).join(" ")}
          fill="none"
          stroke={G.grayDark}
          strokeWidth=".5"
        />
      ))}
      {axes.map(a => (
        <line key={a.l} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke={G.grayDark} strokeWidth=".5" />
      ))}
      <polygon points={polygon} fill={`${G.purpleVib}44`} stroke={G.gold} strokeWidth="1.5" />
      {axes.map(a => (
        <text
          key={a.l}
          x={a.lx}
          y={a.ly}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 11, fontWeight: 700, fill: colors[a.l], fontFamily: "var(--font-sans)" }}
        >
          {a.l}
        </text>
      ))}
    </svg>
  )
}
