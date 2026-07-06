"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { G } from "@/lib/dna-data"
import {
  QuestionnaireAdminShell,
  inputStyle,
  labelStyle,
  useAdminGate,
} from "@/components/questionnaire-admin/shell"
import { ResultPDFPlatform } from "@/components/questionnaire-report/ResultPDFPlatform"
import type { ResultPDFPlatformProps } from "@/components/questionnaire-report/types"

type Profile = { id: string; code: string; name: string }

export default function QuestionnaireReportPreviewPage() {
  const ready = useAdminGate()
  const params = useParams()
  const questionnaireId = params.id as string

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [mainCode, setMainCode] = useState("")
  const [secondaryCode, setSecondaryCode] = useState("")
  const [participantName, setParticipantName] = useState("Maria Preview")
  const [pctByCode, setPctByCode] = useState<Record<string, string>>({})
  const [props, setProps] = useState<ResultPDFPlatformProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/report-contents`)
      const json = await res.json()
      if (res.status === 401) {
        window.location.href = "/admin"
        return
      }
      if (!res.ok) {
        setError(json.error || "Erro ao carregar perfis.")
        return
      }
      const plist = (json.data?.profiles ?? []) as Profile[]
      setProfiles(plist)
      if (plist.length >= 1) {
        setMainCode(plist[0].code)
        setSecondaryCode(plist[1]?.code ?? plist[0].code)
        const init: Record<string, string> = {}
        const n = plist.length
        const base = Math.floor(100 / n)
        plist.forEach((p, i) => {
          init[p.code] = String(i === 0 ? 100 - base * (n - 1) : base)
        })
        setPctByCode(init)
      }
    } finally {
      setLoading(false)
    }
  }, [questionnaireId])

  const percentagesJson = useMemo(() => {
    const o: Record<string, number> = {}
    for (const [code, raw] of Object.entries(pctByCode)) {
      const n = Number(raw)
      if (!Number.isNaN(n)) o[code] = n
    }
    return JSON.stringify(o)
  }, [pctByCode])

  const refreshPreview = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const qs = new URLSearchParams({
        main: mainCode,
        secondary: secondaryCode,
        name: participantName,
        percentages: percentagesJson,
      })
      const res = await fetch(
        `/api/v2/admin/questionnaires/${questionnaireId}/report-preview?${qs.toString()}`
      )
      const json = await res.json()
      if (!res.ok) {
        setProps(null)
        setError(json.error || "Não foi possível montar o preview.")
        return
      }
      setProps(json.data as ResultPDFPlatformProps)
    } catch {
      setError("Falha de rede.")
    } finally {
      setRefreshing(false)
    }
  }, [questionnaireId, mainCode, secondaryCode, participantName, percentagesJson])

  useEffect(() => {
    if (ready && questionnaireId) loadProfiles()
  }, [ready, questionnaireId, loadProfiles])

  useEffect(() => {
    if (ready && mainCode && secondaryCode && !loading) refreshPreview()
  }, [ready, mainCode, secondaryCode, participantName, percentagesJson, loading, refreshPreview])

  return (
    <QuestionnaireAdminShell title="Preview HTML do relatório" subtitle="Fase 8 — sem download PDF">
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={`/admin/questionarios/${questionnaireId}/relatorio`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: `${G.gold}18`, border: `1px solid ${G.gold}55`, color: G.goldLight }}
        >
          Editor de textos
        </Link>
        <Link
          href={`/admin/questionarios/${questionnaireId}`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ border: `1px solid ${G.grayDark}`, color: G.gray }}
        >
          ← Questionário
        </Link>
        <button
          type="button"
          onClick={refreshPreview}
          disabled={refreshing}
          className="text-sm px-3 py-2 rounded-lg disabled:opacity-50"
          style={{ background: `${G.purpleVib}33`, border: `1px solid ${G.purpleVib}55`, color: "#fff" }}
        >
          {refreshing ? "Atualizando…" : "Atualizar preview"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: G.gray }}>Carregando…</p>
      ) : (
        <>
          <section
            className="rounded-2xl p-6 mb-6 max-w-2xl space-y-3"
            style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
          >
            <h2 className="text-sm font-semibold text-white">Cenário fake</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div style={labelStyle}>Perfil principal</div>
                <select
                  value={mainCode}
                  onChange={e => setMainCode(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.code}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div style={labelStyle}>Segunda força</div>
                <select
                  value={secondaryCode}
                  onChange={e => setSecondaryCode(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.code}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Nome do participante</div>
              <input
                value={participantName}
                onChange={e => setParticipantName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>Percentuais por perfil (%)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {profiles.map(p => (
                  <label key={p.id} className="text-xs" style={{ color: G.gray }}>
                    {p.code}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pctByCode[p.code] ?? "0"}
                      onChange={e =>
                        setPctByCode(prev => ({ ...prev, [p.code]: e.target.value }))
                      }
                      className="w-full rounded-lg px-2 py-1.5 text-sm mt-1 outline-none"
                      style={inputStyle}
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          {error ? (
            <p className="text-sm p-2 rounded mb-4" style={{ background: "#FB923C22", color: "#FB923C" }}>
              {error}
            </p>
          ) : null}

          {props ? (
            <ResultPDFPlatform {...props} previewLabel="Preview admin (Fase 8)" />
          ) : !error ? (
            <p style={{ color: G.gray }}>Montando preview…</p>
          ) : null}
        </>
      )}
    </QuestionnaireAdminShell>
  )
}
