"use client"

import { useCallback, useEffect, useState } from "react"
import { ESCOLARIDADE_OPTIONS, G } from "@/lib/dna-data"

const inputStyle = {
  background: "rgba(26,32,53,.8)",
  border: `1.5px solid ${G.grayDark}`,
  color: G.white,
} as const

export type RegistrationV2Form = {
  name: string
  phone: string
  email: string
  city: string
  course_interest: string
  escolaridade: string
}

type Props = {
  questionnaireId: string
  questionnaireName: string
  description: string | null
  vendorSlug?: string | null
  unitId?: string | null
  sellerId?: string | null
  sourceLink?: string | null
  onRegistered: (participantId: string) => void
}

export function RegistrationV2({
  questionnaireId,
  questionnaireName,
  description,
  vendorSlug,
  unitId,
  sellerId,
  sourceLink,
  onRegistered,
}: Props) {
  const [form, setForm] = useState<RegistrationV2Form>({
    name: "",
    phone: "",
    email: "",
    city: "",
    course_interest: "",
    escolaridade: "",
  })
  const [courses, setCourses] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/courses")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data.map((c: { name: string }) => c.name).filter(Boolean))
        }
      })
      .catch(() => {})
  }, [])

  const submit = useCallback(async () => {
    setErr(null)
    if (!form.name.trim()) {
      setErr("Informe seu nome.")
      return
    }
    if (!form.phone.trim()) {
      setErr("Informe seu telefone.")
      return
    }
    if (!form.email.trim()) {
      setErr("Informe seu e-mail.")
      return
    }
    if (!form.escolaridade) {
      setErr("Selecione sua escolaridade.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/v2/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaire_id: questionnaireId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          city: form.city.trim() || null,
          course_interest: form.course_interest || null,
          escolaridade: form.escolaridade,
          vendor_slug: vendorSlug || null,
          unit_id: unitId || null,
          seller_id: sellerId || null,
          source_link: sourceLink || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErr(json.error || "Não foi possível iniciar. Tente novamente.")
        return
      }
      onRegistered(json.data.id as string)
    } catch {
      setErr("Falha de rede. Verifique sua conexão.")
    } finally {
      setLoading(false)
    }
  }, [form, questionnaireId, vendorSlug, unitId, sellerId, sourceLink, onRegistered])

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs tracking-widest" style={{ color: G.gold }}>
          DNA DA PROFISSÃO®
        </p>
        <h1 className="text-2xl font-bold text-white">{questionnaireName}</h1>
        {description ? (
          <p className="text-sm leading-relaxed" style={{ color: G.gray }}>
            {description}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: G.gray }}>
            Nome completo *
          </label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl px-5 py-3.5 text-sm outline-none"
            style={inputStyle}
            autoComplete="name"
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: G.gray }}>
            WhatsApp / telefone *
          </label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-xl px-5 py-3.5 text-sm outline-none"
            style={inputStyle}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: G.gray }}>
            E-mail *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl px-5 py-3.5 text-sm outline-none"
            style={inputStyle}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: G.gray }}>
            Cidade
          </label>
          <input
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="w-full rounded-xl px-5 py-3.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: G.gray }}>
            Escolaridade *
          </label>
          <select
            value={form.escolaridade}
            onChange={e => setForm(f => ({ ...f, escolaridade: e.target.value }))}
            className="w-full rounded-xl px-5 py-3.5 text-sm outline-none"
            style={{ ...inputStyle, color: form.escolaridade ? G.white : G.gray }}
          >
            <option value="">Selecione sua escolaridade</option>
            {ESCOLARIDADE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: G.gray }}>
            Qual profissão você quer testar?
          </label>
          <select
            value={form.course_interest}
            onChange={e => setForm(f => ({ ...f, course_interest: e.target.value }))}
            className="w-full rounded-xl px-5 py-3.5 text-sm outline-none"
            style={{ ...inputStyle, color: form.course_interest ? G.white : G.gray }}
          >
            <option value="">Vamos descobrir se ela está no seu DNA?</option>
            {courses.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {err ? (
          <p className="text-xs text-center" style={{ color: "#F87171" }}>
            {err}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="w-full font-bold rounded-full py-4 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
            color: G.navy,
          }}
        >
          {loading ? "Carregando…" : "Iniciar questionário"}
        </button>
      </div>
    </div>
  )
}
