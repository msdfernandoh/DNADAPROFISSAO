"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { formatEscolaridade, G } from "@/lib/dna-data"
import { LeadDetailV2 } from "@/components/questionnaire-admin/LeadDetailV2"
import { ResultSummary } from "@/components/questionnaire-admin/ResultSummary"
import { QuestionnaireAdminShell, inputStyle, labelStyle, useCommercialAdminGate } from "@/components/questionnaire-admin/shell"
import type { LeadListItem } from "@/lib/questionnaire-platform/lead-types"
import { buildWhatsAppUrl, defaultLeadWhatsAppMessage } from "@/lib/questionnaire-platform/whatsapp"

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function pctSummary(pct: Record<string, number> | undefined) {
  if (!pct) return "—"
  return Object.entries(pct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, v]) => `${c} ${v}%`)
    .join(" · ")
}

export default function QuestionnaireLeadsPage() {
  const ready = useCommercialAdminGate()
  const params = useParams()
  const questionnaireId = params.id as string

  const [questionnaireName, setQuestionnaireName] = useState("")
  const [leads, setLeads] = useState<LeadListItem[]>([])
  const [statusOptions, setStatusOptions] = useState<string[]>([])
  const [profileOptions, setProfileOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterProfile, setFilterProfile] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [detailLead, setDetailLead] = useState<LeadListItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/participants`)
      const json = await res.json()
      if (res.status === 401) {
        window.location.href = "/admin"
        return
      }
      if (!res.ok) {
        setError(json.error || "Erro ao carregar leads.")
        return
      }
      setLeads(json.data ?? [])
      setQuestionnaireName(json.questionnaire?.name ?? "Questionário")
      setStatusOptions(json.filters?.statuses ?? [])
      setProfileOptions(json.filters?.mainProfiles ?? [])
    } catch {
      setError("Falha de rede.")
    } finally {
      setLoading(false)
    }
  }, [questionnaireId])

  useEffect(() => {
    if (ready && questionnaireId) load()
  }, [ready, questionnaireId, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null

    return leads.filter(lead => {
      if (q) {
        const hay = `${lead.name} ${lead.phone} ${lead.email}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filterStatus && lead.status !== filterStatus) return false
      if (filterProfile) {
        const main = lead.result?.main_profile
        if (main !== filterProfile) return false
      }
      const created = new Date(lead.created_at).getTime()
      if (fromMs !== null && created < fromMs) return false
      if (toMs !== null && created > toMs) return false
      return true
    })
  }, [leads, search, filterStatus, filterProfile, dateFrom, dateTo])

  const copyWhatsApp = async (lead: LeadListItem) => {
    try {
      await navigator.clipboard.writeText(lead.phone.replace(/\D/g, ""))
      setCopiedId(lead.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      /* ignore */
    }
  }

  const patchLead = (id: string, patch: { status?: string; notes?: string | null }) => {
    setLeads(prev =>
      prev.map(l => (l.id === id ? { ...l, ...patch } : l))
    )
    if (detailLead?.id === id) {
      setDetailLead(d => (d ? { ...d, ...patch } : d))
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
    <QuestionnaireAdminShell
      title={`Leads — ${questionnaireName}`}
      subtitle={`${filtered.length} de ${leads.length} lead(s)`}
    >
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/admin/questionarios/${questionnaireId}`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: G.navyLight, border: `1px solid ${G.grayDark}` }}
        >
          ← Questionário
        </Link>
        <Link
          href={`/admin/questionarios/${questionnaireId}/perfis`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: `${G.purpleVib}33`, border: `1px solid ${G.purpleVib}55` }}
        >
          Perfis
        </Link>
        <Link
          href={`/admin/questionarios/${questionnaireId}/perguntas`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: `${G.gold}22`, border: `1px solid ${G.gold}55`, color: G.goldLight }}
        >
          Perguntas
        </Link>
      </div>

      {error ? (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FB923C22", color: "#FB923C" }}>
          {error}
        </div>
      ) : null}

      <div
        className="rounded-2xl p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
      >
        <div className="lg:col-span-2">
          <div style={labelStyle}>Busca</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nome, WhatsApp ou e-mail"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={labelStyle}>Status</div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="">Todos</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Perfil principal</div>
          <select
            value={filterProfile}
            onChange={e => setFilterProfile(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="">Todos</option>
            {profileOptions.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 gap-2">
          <div>
            <div style={labelStyle}>De</div>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={labelStyle}>Até</div>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-x-auto"
        style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
      >
        <table className="w-full text-sm min-w-[960px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${G.grayDark}`, color: G.gray }}>
              <th className="text-left p-3 font-medium">Nome</th>
              <th className="text-left p-3 font-medium">Contato</th>
              <th className="text-left p-3 font-medium">Cidade / Curso</th>
              <th className="text-left p-3 font-medium">Resultado</th>
              <th className="text-left p-3 font-medium">Percentuais</th>
              <th className="text-left p-3 font-medium">Data</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center" style={{ color: G.gray }}>
                  Carregando…
                </td>
              </tr>
            ) : null}
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center" style={{ color: G.gray }}>
                  Nenhum lead encontrado.
                </td>
              </tr>
            ) : null}
            {filtered.map(lead => (
              <tr key={lead.id} style={{ borderBottom: `1px solid ${G.grayDark}44` }}>
                <td className="p-3">
                  <div className="font-medium">{lead.name}</div>
                  {lead.escolaridade ? (
                    <div className="text-xs mt-0.5" style={{ color: G.gray }}>
                      {formatEscolaridade(lead.escolaridade)}
                    </div>
                  ) : null}
                </td>
                <td className="p-3 text-xs">
                  <div>{lead.phone}</div>
                  <div style={{ color: G.gray }}>{lead.email}</div>
                </td>
                <td className="p-3 text-xs" style={{ color: G.gray }}>
                  {lead.city || "—"}
                  {lead.course_interest ? (
                    <div className="text-white mt-0.5">{lead.course_interest}</div>
                  ) : null}
                </td>
                <td className="p-3">
                  <ResultSummary result={lead.result} compact />
                </td>
                <td className="p-3 text-xs font-mono" style={{ color: G.gray }}>
                  {lead.result ? pctSummary(lead.result.percentages) : "—"}
                </td>
                <td className="p-3 text-xs whitespace-nowrap" style={{ color: G.gray }}>
                  {formatDate(lead.quiz_completed_at ?? lead.created_at)}
                </td>
                <td className="p-3 text-xs">{lead.status}</td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => copyWhatsApp(lead)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ border: `1px solid ${G.grayDark}` }}
                      title="Copiar número"
                    >
                      {copiedId === lead.id ? "Copiado" : "Copiar WA"}
                    </button>
                    <a
                      href={buildWhatsAppUrl(lead.phone, defaultLeadWhatsAppMessage(lead.name))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: "#25D36622", border: "1px solid #25D36655" }}
                    >
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setDetailLead(lead)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: `${G.gold}22`, border: `1px solid ${G.gold}55` }}
                    >
                      Detalhes
                    </button>
                    {lead.quiz_completed && lead.result ? (
                      <>
                        <Link
                          href={`/admin/questionarios/${questionnaireId}/leads/${lead.id}/relatorio`}
                          className="px-2 py-1 rounded text-xs"
                          style={{ background: `${G.purpleVib}33`, border: `1px solid ${G.purpleVib}55` }}
                        >
                          Ver relatório
                        </Link>
                        <Link
                          href={`/admin/questionarios/${questionnaireId}/leads/${lead.id}/relatorio`}
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ background: G.gold, color: G.navy }}
                        >
                          Gerar PDF
                        </Link>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailLead ? (
        <LeadDetailV2
          questionnaireId={questionnaireId}
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onUpdated={patch => patchLead(detailLead.id, patch)}
        />
      ) : null}
    </QuestionnaireAdminShell>
  )
}
