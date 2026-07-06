"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { formatEscolaridade, G } from "@/lib/dna-data"
import { ResultSummary } from "@/components/questionnaire-admin/ResultSummary"
import { buildWhatsAppUrl, defaultLeadWhatsAppMessage } from "@/lib/questionnaire-platform/whatsapp"
import type { LeadDetail, LeadListItem } from "@/lib/questionnaire-platform/lead-types"
import { inputStyle, labelStyle } from "@/components/questionnaire-admin/shell"

const STATUS_SUGGESTIONS = [
  "Aguardando teste",
  "Teste concluído",
  "Em contato",
  "Mapa liberado",
  "Não respondeu",
]

type Props = {
  questionnaireId: string
  lead: LeadListItem
  onClose: () => void
  onUpdated: (patch: { status?: string; notes?: string | null }) => void
}

export function LeadDetailV2({ questionnaireId, lead, onClose, onUpdated }: Props) {
  const [detail, setDetail] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState(lead.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/v2/admin/questionnaires/${questionnaireId}/participants?participantId=${encodeURIComponent(lead.id)}`
      )
      const json = await res.json()
      if (res.ok) {
        setDetail(json.data as LeadDetail)
      }
    } finally {
      setLoading(false)
    }
  }, [questionnaireId, lead.id])

  useEffect(() => {
    load()
  }, [load])

  const saveMeta = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status, notes }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error || "Erro ao salvar.")
        return
      }
      onUpdated({ status, notes: notes.trim() || null })
      setMsg("Salvo.")
    } catch {
      setMsg("Falha de rede.")
    } finally {
      setSaving(false)
    }
  }

  const waUrl = buildWhatsAppUrl(lead.phone, defaultLeadWhatsAppMessage(lead.name))

  const display = detail ?? lead

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.65)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-5"
        style={{ background: G.navyLight, border: `1px solid ${G.grayDark}` }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-lg font-bold">{display.name}</h2>
            <p className="text-xs mt-1" style={{ color: G.gray }}>
              {new Date(display.created_at).toLocaleString("pt-BR")}
              {display.quiz_completed ? " · Teste concluído" : " · Pendente"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-2 py-1 rounded"
            style={{ color: G.gray, border: `1px solid ${G.grayDark}` }}
          >
            Fechar
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span style={{ color: G.gray }}>WhatsApp: </span>
            {display.phone}
          </div>
          <div>
            <span style={{ color: G.gray }}>E-mail: </span>
            {display.email}
          </div>
          {display.city ? (
            <div>
              <span style={{ color: G.gray }}>Cidade: </span>
              {display.city}
            </div>
          ) : null}
          {display.course_interest ? (
            <div>
              <span style={{ color: G.gray }}>Curso: </span>
              {display.course_interest}
            </div>
          ) : null}
          {display.escolaridade ? (
            <div>
              <span style={{ color: G.gray }}>Escolaridade: </span>
              {formatEscolaridade(display.escolaridade)}
            </div>
          ) : null}
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "#25D36633", border: "1px solid #25D36688", color: "#86EFAC" }}
        >
          Abrir WhatsApp
        </a>

        {lead.quiz_completed && lead.result ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/questionarios/${questionnaireId}/leads/${lead.id}/relatorio`}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ background: `${G.purpleVib}44`, border: `1px solid ${G.purpleVib}`, color: "#fff" }}
            >
              Ver relatório / PDF
            </Link>
          </div>
        ) : null}

        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
        >
          <h3 className="text-sm font-semibold mb-3">Resultado</h3>
          {loading && !detail ? (
            <p className="text-xs" style={{ color: G.gray }}>
              Carregando…
            </p>
          ) : (
            <ResultSummary result={display.result} />
          )}
        </div>

        {detail?.answers && detail.answers.length > 0 ? (
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
          >
            <h3 className="text-sm font-semibold">Respostas</h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              {detail.answers.map(a => (
                <li key={a.question_id} style={{ color: G.gray }}>
                  <span className="text-white">{a.question_text}</span>
                  <div className="text-xs ml-5 mt-0.5" style={{ color: G.goldLight }}>
                    → {a.alternative_text}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="space-y-3 pt-2 border-t" style={{ borderColor: G.grayDark }}>
          <div>
            <div style={labelStyle}>Status</div>
            <input
              list="lead-status-suggestions"
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
            <datalist id="lead-status-suggestions">
              {STATUS_SUGGESTIONS.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <div style={labelStyle}>Observações</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
              style={inputStyle}
            />
          </div>
          {msg ? (
            <p className="text-xs" style={{ color: msg === "Salvo." ? G.goldLight : "#FB923C" }}>
              {msg}
            </p>
          ) : null}
          <button
            type="button"
            onClick={saveMeta}
            disabled={saving}
            className="font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ background: G.gold, color: G.navy }}
          >
            {saving ? "Salvando…" : "Salvar status / observação"}
          </button>
        </div>
      </div>
    </div>
  )
}
