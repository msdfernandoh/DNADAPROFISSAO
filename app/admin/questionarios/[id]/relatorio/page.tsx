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
import { contentKey } from "@/lib/questionnaire-platform/report-template-defaults"
import {
  REPORT_EDITOR_TABS,
  type ReportEditorTabId,
} from "@/lib/questionnaire-platform/report-editor-fields"

type Profile = { id: string; code: string; name: string; sort_order: number }

export default function QuestionnaireReportEditorPage() {
  const ready = useAdminGate()
  const params = useParams()
  const questionnaireId = params.id as string

  const [tab, setTab] = useState<ReportEditorTabId>("general")
  const [values, setValues] = useState<Record<string, string>>({})
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [templateName, setTemplateName] = useState("")
  const [profileId, setProfileId] = useState("")
  const [mainPairId, setMainPairId] = useState("")
  const [secondaryPairId, setSecondaryPairId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const activeTab = useMemo(() => REPORT_EDITOR_TABS.find(t => t.id === tab)!, [tab])

  const load = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/report-contents`)
      const json = await res.json()
      if (res.status === 401) {
        window.location.href = "/admin"
        return
      }
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Erro ao carregar." })
        return
      }
      const data = json.data as {
        values: Record<string, string>
        profiles: Profile[]
        template: { name: string }
      }
      setValues(data.values ?? {})
      const plist = data.profiles ?? []
      setProfiles(plist)
      setTemplateName(data.template?.name ?? "")
      if (plist.length > 0) {
        setProfileId(plist[0].id)
        setMainPairId(plist[0].id)
        setSecondaryPairId(plist[1]?.id ?? plist[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [questionnaireId])

  useEffect(() => {
    if (ready && questionnaireId) load()
  }, [ready, questionnaireId, load])

  const scopeForField = (section_key: string) => {
    if (activeTab.id === "profile") {
      return { profile_id: profileId, secondary_profile_id: null as string | null }
    }
    if (activeTab.id === "pair") {
      if (section_key === "profile_pair") {
        return { profile_id: mainPairId, secondary_profile_id: secondaryPairId }
      }
      if (section_key === "profile_secondary") {
        return { profile_id: secondaryPairId, secondary_profile_id: null as string | null }
      }
    }
    return { profile_id: null as string | null, secondary_profile_id: null as string | null }
  }

  const fieldValue = (section_key: string, field_key: string) => {
    const scope = scopeForField(section_key)
    const k = contentKey(section_key, field_key, scope.profile_id, scope.secondary_profile_id)
    return values[k] ?? ""
  }

  const setFieldValue = (section_key: string, field_key: string, text: string) => {
    const scope = scopeForField(section_key)
    const k = contentKey(section_key, field_key, scope.profile_id, scope.secondary_profile_id)
    setValues(prev => ({ ...prev, [k]: text }))
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const items = activeTab.fields.map(f => {
        const scope = scopeForField(f.section_key)
        return {
          section_key: f.section_key,
          field_key: f.field_key,
          text: fieldValue(f.section_key, f.field_key),
          profile_id: scope.profile_id,
          secondary_profile_id: scope.secondary_profile_id,
        }
      })
      const res = await fetch(`/api/v2/admin/questionnaires/${questionnaireId}/report-contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ type: "err", text: json.error || "Falha ao salvar." })
        return
      }
      setMsg({ type: "ok", text: `Salvo (${json.saved ?? items.length} campos).` })
      await load()
    } catch {
      setMsg({ type: "err", text: "Falha de rede." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <QuestionnaireAdminShell
      title="Editor de relatório"
      subtitle={templateName || "Fase 8 — textos configuráveis"}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={`/admin/questionarios/${questionnaireId}`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ border: `1px solid ${G.grayDark}`, color: G.gray }}
        >
          ← Questionário
        </Link>
        <Link
          href={`/admin/questionarios/${questionnaireId}/preview`}
          className="text-sm px-3 py-2 rounded-lg"
          style={{ background: "#22C55E18", border: "1px solid #22C55E55", color: "#86EFAC" }}
        >
          Preview HTML
        </Link>
      </div>

      {loading ? (
        <p style={{ color: G.gray }}>Carregando…</p>
      ) : (
        <>
          {msg ? (
            <p
              className="text-sm p-2 rounded mb-4 max-w-2xl"
              style={{
                background: msg.type === "ok" ? `${G.gold}22` : "#FB923C22",
                color: msg.type === "ok" ? G.goldLight : "#FB923C",
              }}
            >
              {msg.text}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 mb-6 max-w-3xl">
            {REPORT_EDITOR_TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="text-sm px-3 py-2 rounded-lg"
                style={{
                  background: tab === t.id ? `${G.gold}33` : "rgba(26,32,53,.85)",
                  border: `1px solid ${tab === t.id ? G.gold : G.grayDark}`,
                  color: tab === t.id ? G.goldLight : G.gray,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <section
            className="rounded-2xl p-6 max-w-2xl space-y-4"
            style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
          >
            <div>
              <h2 className="text-sm font-semibold text-white">{activeTab.label}</h2>
              <p className="text-xs mt-1" style={{ color: G.gray }}>
                {activeTab.description}
              </p>
            </div>

            {activeTab.needsProfile ? (
              <div>
                <div style={labelStyle}>Perfil (principal)</div>
                <select
                  value={profileId}
                  onChange={e => setProfileId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {activeTab.needsPair ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div style={labelStyle}>Perfil principal</div>
                  <select
                    value={mainPairId}
                    onChange={e => setMainPairId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Segunda força</div>
                  <select
                    value={secondaryPairId}
                    onChange={e => setSecondaryPairId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {activeTab.fields.map(f => (
              <div key={`${f.section_key}.${f.field_key}`}>
                <div style={labelStyle}>{f.label}</div>
                {f.hint ? (
                  <p className="text-[10px] mb-1" style={{ color: G.gray }}>
                    {f.hint}
                  </p>
                ) : null}
                {f.multiline ? (
                  <textarea
                    rows={4}
                    value={fieldValue(f.section_key, f.field_key)}
                    onChange={e => setFieldValue(f.section_key, f.field_key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y"
                    style={inputStyle}
                  />
                ) : (
                  <input
                    value={fieldValue(f.section_key, f.field_key)}
                    onChange={e => setFieldValue(f.section_key, f.field_key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  />
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
              style={{ background: G.gold, color: G.navy }}
            >
              {saving ? "Salvando…" : "Salvar aba atual"}
            </button>
          </section>
        </>
      )}
    </QuestionnaireAdminShell>
  )
}
