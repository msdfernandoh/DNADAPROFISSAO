"use client"

import { useEffect, useState } from "react"
import { Logo } from "./logo"
import { G } from "@/lib/dna-data"

interface RegistrationProps {
  onComplete: (form: {
    name: string
    phone: string
    email: string
    city: string
    course: string
  }) => void
}

// Máscara de telefone BR: (00) 00000-0000 ou (00) 0000-0000
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function Registration({ onComplete }: RegistrationProps) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", course: "" })
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)
  const [courseList, setCourseList] = useState<string[]>([])
  const [coursesLoaded, setCoursesLoaded] = useState(false)

  // Carrega APENAS cursos cadastrados no banco
  useEffect(() => {
    fetch("/api/courses")
      .then(r => r.json())
      .then((data: { name: string }[]) => {
        setCourseList(Array.isArray(data) ? data.map(c => c.name) : [])
      })
      .catch(() => setCourseList([]))
      .finally(() => setCoursesLoaded(true))
  }, [])

  const handle = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setErr("Preencha nome, WhatsApp e email para continuar.")
      return
    }
    const phoneDigits = form.phone.replace(/\D/g, "")
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setErr("Insira um WhatsApp válido com DDD (10 ou 11 dígitos).")
      return
    }
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setErr("Por favor, insira um email válido.")
      return
    }
    setErr("")
    setLoading(true)
    onComplete(form)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: G.navy }}
    >
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-9">
          <Logo />
          <h2
            className="font-serif font-black text-3xl mt-6 mb-3"
            style={{ color: G.white }}
          >
            Antes de começar...
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: G.gray }}>
            Precisamos de algumas informações para personalizar sua análise e enviar seu diagnóstico depois.
          </p>
        </div>

        <div
          className="rounded-2xl p-7 backdrop-blur-lg flex flex-col gap-5"
          style={{
            background: "rgba(26,32,53,.7)",
            border: `1px solid rgba(201,168,76,.15)`,
          }}
        >
          <div>
            <label className="text-xs font-medium mb-1.5 block tracking-wide" style={{ color: G.gray }}>
              Seu nome completo *
            </label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Como você se chama?"
              className="w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-colors"
              style={{
                background: "rgba(26,32,53,.8)",
                border: `1.5px solid ${G.grayDark}`,
                color: G.white,
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block tracking-wide" style={{ color: G.gray }}>
              Seu WhatsApp *
            </label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: maskPhone(e.target.value) })}
              inputMode="numeric"
              maxLength={15}
              placeholder="(00) 00000-0000"
              className="w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-colors"
              style={{
                background: "rgba(26,32,53,.8)",
                border: `1.5px solid ${G.grayDark}`,
                color: G.white,
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block tracking-wide" style={{ color: G.gray }}>
              Seu email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="seuemail@exemplo.com"
              className="w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-colors"
              style={{
                background: "rgba(26,32,53,.8)",
                border: `1.5px solid ${G.grayDark}`,
                color: G.white,
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block tracking-wide" style={{ color: G.gray }}>
              Sua cidade
            </label>
            <input
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="Onde você mora?"
              className="w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-colors"
              style={{
                background: "rgba(26,32,53,.8)",
                border: `1.5px solid ${G.grayDark}`,
                color: G.white,
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block tracking-wide" style={{ color: G.gray }}>
              Qual profissão você quer testar?
            </label>
            <select
              value={form.course}
              onChange={e => setForm({ ...form, course: e.target.value })}
              disabled={!coursesLoaded || courseList.length === 0}
              className="w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "rgba(26,32,53,.8)",
                border: `1.5px solid ${G.grayDark}`,
                color: form.course ? G.white : G.gray,
              }}
            >
              <option value="">
                {!coursesLoaded
                  ? "Carregando..."
                  : courseList.length === 0
                  ? "Nenhum curso cadastrado"
                  : "Vamos descobrir se ela está no seu DNA?"}
              </option>
              {courseList.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {err && (
            <p className="text-xs text-center" style={{ color: "#F87171" }}>
              {err}
            </p>
          )}

          <button
            onClick={handle}
            disabled={loading}
            className="w-full font-bold rounded-full py-4 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
              color: G.navy,
            }}
          >
            {loading ? "Carregando..." : "Iniciar questionário"}
          </button>
        </div>
      </div>
    </div>
  )
}
