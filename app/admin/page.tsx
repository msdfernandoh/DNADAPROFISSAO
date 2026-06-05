"use client"

import { useState, useEffect } from "react"
import { Logo } from "@/components/dna/logo"
import { RadarChart } from "@/components/dna/radar-chart"
import { G, PROFILES, STATUS_OPTS } from "@/lib/dna-data"

interface Participant {
  id: string
  name: string
  phone: string
  email: string
  city: string | null
  course_interest: string | null
  primary_profile: string | null
  secondary_profile: string | null
  percentages: Record<string, number> | null
  status: string
  notes: string | null
  quiz_completed: boolean | null
  quiz_completed_at: string | null
  created_at: string
}

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [authed, setAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Participant | null>(null)
  const [copyMsg, setCopyMsg] = useState("")

  // Verificar sessão ao carregar
  useEffect(() => {
    fetch("/api/admin/login")
      .then(r => r.json())
      .then(j => setAuthed(!!j.authed))
      .catch(() => setAuthed(false))
      .finally(() => setAuthLoading(false))
  }, [])

  const handleLogin = async () => {
    if (!password.trim()) return
    setLoginLoading(true)
    setLoginError("")
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setLoginError(json.error || "Senha incorreta")
        return
      }
      setAuthed(true)
      setPassword("")
    } catch {
      setLoginError("Erro ao fazer login")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" })
    setAuthed(false)
    setSelected(null)
    setParticipants([])
  }

  const fetchParticipants = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/participants")
      if (res.status === 401) {
        setAuthed(false)
        return
      }
      const json = await res.json()
      if (json.data) {
        setParticipants(json.data)
      }
    } catch (error) {
      console.error("Error fetching:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authed) {
      fetchParticipants()
    }
  }, [authed])

  const updateParticipant = async (id: string, updates: Partial<Participant>) => {
    try {
      await fetch("/api/admin/participants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      setParticipants(ps => ps.map(p => (p.id === id ? { ...p, ...updates } : p)))
      if (selected?.id === id) {
        setSelected({ ...selected, ...updates })
      }
    } catch (error) {
      console.error("Error updating:", error)
    }
  }

  const copyWA = (p: Participant) => {
    if (!p.quiz_completed || !p.primary_profile) {
      setCopyMsg(p.id + "-error")
      setTimeout(() => setCopyMsg(""), 2500)
      return
    }
    const pr = PROFILES[p.primary_profile]
    const sec = p.secondary_profile ? PROFILES[p.secondary_profile] : null
    const txt = `Olá, ${p.name.split(" ")[0]}! 😊\n\nSeu DNA PROFISSIONAL™ está pronto!\n\n🧬 Perfil principal: *${pr.name}*${sec ? `\n✨ Perfil secundário: *${sec.name}*` : ""}\n\nFicamos felizes em te contar que sua análise revela características muito únicas. Em breve entraremos em contato para te apresentar seu diagnóstico completo e como podemos te ajudar a dar o próximo passo! 🚀`
    navigator.clipboard.writeText(txt).then(() => {
      setCopyMsg(p.id)
      setTimeout(() => setCopyMsg(""), 2000)
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  // Loading da verificação de sessão
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: G.navy }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: `${G.gold}33`, borderTopColor: G.gold }}
          />
          <p className="text-xs" style={{ color: G.gray }}>
            Verificando sessão...
          </p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: G.navy }}
      >
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <Logo />
            </div>
            <h2
              className="mt-6 text-2xl font-serif font-bold"
              style={{ color: G.white }}
            >
              Painel Administrativo
            </h2>
            <p className="mt-2 text-sm" style={{ color: G.gray }}>
              Acesso restrito a equipe DNA Profissional
            </p>
          </div>
          <div
            className="rounded-2xl p-8 backdrop-blur-lg"
            style={{
              background: "rgba(26,32,53,.7)",
              border: `1px solid rgba(201,168,76,.2)`,
              boxShadow: "0 20px 60px rgba(0,0,0,.4)",
            }}
          >
            <label
              className="text-xs font-semibold mb-2 block uppercase tracking-wider"
              style={{ color: G.goldLight }}
            >
              Senha de acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                if (loginError) setLoginError("")
              }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Digite a senha"
              autoFocus
              disabled={loginLoading}
              className="w-full rounded-xl px-5 py-3.5 text-sm outline-none mb-2 transition-all focus:border-[#C9A84C]"
              style={{
                background: "rgba(11,14,26,.6)",
                border: `1.5px solid ${loginError ? "#F87171" : G.grayDark}`,
                color: G.white,
              }}
            />
            {loginError && (
              <p className="text-xs mb-2 flex items-center gap-1" style={{ color: "#F87171" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {loginError}
              </p>
            )}
            <button
              onClick={handleLogin}
              disabled={loginLoading || !password.trim()}
              className="w-full font-bold rounded-full py-3.5 mt-4 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
                color: G.navy,
                boxShadow: `0 8px 24px ${G.gold}44`,
              }}
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
            <a
              href="/"
              className="block text-xs text-center mt-5 transition-colors hover:text-[#C9A84C]"
              style={{ color: G.gray }}
            >
              ← Voltar para o site
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Selected participant detail
  if (selected) {
    const pr = selected.primary_profile ? PROFILES[selected.primary_profile] : null
    const sec = selected.secondary_profile ? PROFILES[selected.secondary_profile] : null
    const quizDone = selected.quiz_completed && pr

    return (
      <div className="min-h-screen pb-16" style={{ background: G.navy }}>
        {/* Top bar */}
        <div
          className="flex items-center gap-4 p-4"
          style={{ background: G.navyMid, borderBottom: `1px solid ${G.grayDark}` }}
        >
          <button
            onClick={() => setSelected(null)}
            className="text-xs font-semibold px-4 py-2 rounded-full transition-all"
            style={{
              color: G.gold,
              border: `1px solid ${G.gold}66`,
            }}
          >
            Voltar
          </button>
          <Logo />
        </div>

        <div className="max-w-[800px] mx-auto px-6 pt-8">
          {/* Header card */}
          <div
            className="rounded-2xl p-7 mb-6"
            style={{
              background: `linear-gradient(135deg,${G.purple}44,${G.navyLight})`,
              border: `1px solid ${G.purpleVib}33`,
            }}
          >
            <div className="flex flex-wrap items-start gap-5">
              <div className="flex-1 min-w-[200px]">
                <div className="text-xs mb-2" style={{ color: G.gray }}>
                  {formatDate(selected.created_at)}
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: G.white }}>
                  {selected.name}
                </h2>
                <div className="text-sm mb-4" style={{ color: G.gray }}>
                  {selected.phone} - {selected.email}
                  {selected.city && ` - ${selected.city}`}
                  {selected.course_interest && ` - Interesse: ${selected.course_interest}`}
                </div>
                {quizDone && pr && sec ? (
                  <div className="flex flex-wrap gap-3">
                    <div
                      className="rounded-lg px-4 py-2"
                      style={{
                        background: `${pr.color}22`,
                        border: `1px solid ${pr.color}44`,
                      }}
                    >
                      <div className="text-[10px]" style={{ color: G.gray }}>
                        PERFIL PRINCIPAL
                      </div>
                      <div className="text-sm font-bold" style={{ color: pr.color }}>
                        {pr.icon} {pr.name}
                      </div>
                    </div>
                    <div
                      className="rounded-lg px-4 py-2"
                      style={{
                        background: `${sec.color}22`,
                        border: `1px solid ${sec.color}44`,
                      }}
                    >
                      <div className="text-[10px]" style={{ color: G.gray }}>
                        PERFIL SECUNDÁRIO
                      </div>
                      <div className="text-sm font-bold" style={{ color: sec.color }}>
                        {sec.icon} {sec.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-lg px-4 py-3 inline-flex items-center gap-2"
                    style={{
                      background: "#FB923C22",
                      border: "1px solid #FB923C66",
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#FB923C" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-[10px]" style={{ color: G.gray }}>
                        QUIZ
                      </div>
                      <div className="text-sm font-bold" style={{ color: "#FB923C" }}>
                        Não concluído
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <select
                  value={selected.status}
                  onChange={e => updateParticipant(selected.id, { status: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: G.navyLight,
                    border: `1px solid ${G.grayDark}`,
                    color: G.white,
                  }}
                >
                  {STATUS_OPTS.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={() => copyWA(selected)}
                  disabled={!quizDone}
                  className="text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: `${G.purpleVib}22`,
                    border: `1px solid ${G.purpleVib}44`,
                    color: G.goldLight,
                  }}
                >
                  {copyMsg === selected.id ? "Copiado!" : "Copiar msg WhatsApp"}
                </button>
                {quizDone && pr && sec && selected.percentages ? (
                  <a
                    href={`/resultado?name=${encodeURIComponent(selected.name)}&primary=${selected.primary_profile}&secondary=${selected.secondary_profile}&percentages=${encodeURIComponent(JSON.stringify(selected.percentages))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium px-3 py-2 rounded-lg transition-all flex items-center gap-1"
                    style={{
                      background: `${G.gold}22`,
                      border: `1px solid ${G.gold}44`,
                      color: G.gold,
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ver Resultado PDF
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* Charts row + Perfil detalhado (só quando quiz concluído) */}
          {quizDone && pr && selected.percentages ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              className="rounded-2xl p-6 backdrop-blur-lg"
              style={{
                background: "rgba(26,32,53,.7)",
                border: `1px solid rgba(201,168,76,.15)`,
              }}
            >
              <div className="text-xs font-semibold mb-4" style={{ color: G.gray }}>
                DISTRIBUIÇÃO DE PERFIL
              </div>
              <div className="flex justify-center">
                <RadarChart scores={selected.percentages} />
              </div>
            </div>
            <div
              className="rounded-2xl p-6 backdrop-blur-lg"
              style={{
                background: "rgba(26,32,53,.7)",
                border: `1px solid rgba(201,168,76,.15)`,
              }}
            >
              <div className="text-xs font-semibold mb-4" style={{ color: G.gray }}>
                PORCENTAGENS
              </div>
              {Object.entries(selected.percentages)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <div key={k} className="mb-3.5">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-semibold" style={{ color: PROFILES[k]?.color }}>
                        {PROFILES[k]?.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: PROFILES[k]?.color }}>
                        {v}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: G.grayDark }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${v}%`,
                          background: PROFILES[k]?.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Profile detail */}
          <div
            className="rounded-2xl p-6 mb-6 backdrop-blur-lg"
            style={{
              background: "rgba(26,32,53,.7)",
              border: `1px solid rgba(201,168,76,.15)`,
            }}
          >
            <h3 className="text-base font-bold mb-4" style={{ color: pr.color }}>
              {pr.icon} {pr.name} — Perfil Principal
            </h3>
            <p className="text-sm leading-loose mb-5" style={{ color: "#D1D5EF" }}>
              {pr.desc}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="text-xs font-semibold mb-2.5" style={{ color: G.gray }}>
                  PONTOS FORTES
                </div>
                {pr.strong.map(s => (
                  <div key={s} className="text-sm mb-1.5 flex gap-2 items-start" style={{ color: "#D1D5EF" }}>
                    <span style={{ color: "#34D399" }}>✓</span>
                    {s}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold mb-2.5" style={{ color: G.gray }}>
                  PONTOS DE ATENÇÃO
                </div>
                {pr.attention.map(a => (
                  <div key={a} className="text-sm mb-1.5 flex gap-2 items-start" style={{ color: "#D1D5EF" }}>
                    <span style={{ color: "#FB923C" }}>⚠</span>
                    {a}
                  </div>
                ))}
              </div>
            </div>
            <div
              className="mt-5 rounded-xl p-4"
              style={{
                background: `${G.purple}33`,
                border: `1px solid ${G.purpleVib}33`,
              }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: G.gray }}>
                POSSÍVEL TRAVA PROFISSIONAL
              </div>
              <p className="text-sm leading-relaxed italic" style={{ color: "#D1D5EF" }}>
                &quot;{pr.block}&quot;
              </p>
            </div>
          </div>
            </>
          ) : (
            <div
              className="rounded-2xl p-8 mb-6 backdrop-blur-lg text-center"
              style={{
                background: "rgba(26,32,53,.7)",
                border: `1px solid #FB923C44`,
              }}
            >
              <div className="text-4xl mb-3">⏳</div>
              <h3 className="text-base font-bold mb-2" style={{ color: "#FB923C" }}>
                Teste ainda não concluído
              </h3>
              <p className="text-sm" style={{ color: G.gray }}>
                Este participante preencheu o cadastro mas não finalizou o questionário.
                <br />
                Os perfis, gráficos e ações estarão disponíveis quando o teste for concluído.
              </p>
            </div>
          )}

          {/* Notes */}
          <div
            className="rounded-2xl p-6 backdrop-blur-lg"
            style={{
              background: "rgba(26,32,53,.7)",
              border: `1px solid rgba(201,168,76,.15)`,
            }}
          >
            <div className="text-xs font-semibold mb-3" style={{ color: G.gray }}>
              OBSERVAÇÕES INTERNAS
            </div>
            <textarea
              rows={4}
              value={selected.notes || ""}
              onChange={e => updateParticipant(selected.id, { notes: e.target.value })}
              placeholder="Adicione observações sobre este participante..."
              className="w-full rounded-xl px-5 py-3.5 text-sm outline-none resize-y"
              style={{
                background: "rgba(26,32,53,.8)",
                border: `1.5px solid ${G.grayDark}`,
                color: G.white,
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Main list view
  const filtered = participants.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ background: G.navy }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between flex-wrap gap-3 p-4"
        style={{ background: G.navyMid, borderBottom: `1px solid ${G.grayDark}` }}
      >
        <Logo />
        <div className="flex items-center gap-3">
          <a
            href="/admin/cursos"
            className="text-xs font-semibold px-4 py-2 rounded-full transition-all hover:bg-white/5 flex items-center gap-1.5"
            style={{
              color: G.goldLight,
              border: `1px solid ${G.gold}55`,
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Cursos
          </a>
          <div className="text-xs hidden sm:block" style={{ color: G.gray }}>
            Painel Administrativo
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-4 py-2 rounded-full transition-all hover:bg-[#F87171]/10 flex items-center gap-1.5"
            style={{
              color: "#F87171",
              border: `1px solid #F8717155`,
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", val: participants.length, color: G.goldLight },
            { label: "Concluídos", val: participants.filter(p => p.quiz_completed).length, color: "#34D399" },
            { label: "Sem teste", val: participants.filter(p => !p.quiz_completed).length, color: "#FB923C" },
            { label: "Em análise", val: participants.filter(p => p.status === "Em análise").length, color: "#60A5FA" },
            { label: "Matriculados", val: participants.filter(p => p.status === "Matriculado").length, color: G.gold },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center backdrop-blur-sm"
              style={{
                background: "rgba(26,32,53,.5)",
                border: `1px solid ${G.purpleVib}33`,
              }}
            >
              <div className="text-2xl font-bold" style={{ color: s.color }}>
                {s.val}
              </div>
              <div className="text-xs mt-1" style={{ color: G.gray }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Buscar por nome, WhatsApp ou email..."
          className="w-full rounded-xl px-5 py-3.5 text-sm outline-none mb-5"
          style={{
            background: "rgba(26,32,53,.8)",
            border: `1.5px solid ${G.grayDark}`,
            color: G.white,
          }}
        />

        {/* Table */}
        <div
          className="rounded-2xl overflow-auto backdrop-blur-lg"
          style={{
            background: "rgba(26,32,53,.7)",
            border: `1px solid rgba(201,168,76,.15)`,
          }}
        >
          {loading ? (
            <div className="p-8 text-center" style={{ color: G.gray }}>
              Carregando...
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th
                    className="text-left text-xs font-semibold tracking-wide px-4 py-3"
                    style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}` }}
                  >
                    Participante
                  </th>
                  <th
                    className="text-left text-xs font-semibold tracking-wide px-4 py-3 hidden sm:table-cell"
                    style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}` }}
                  >
                    WhatsApp
                  </th>
                  <th
                    className="text-left text-xs font-semibold tracking-wide px-4 py-3 hidden lg:table-cell"
                    style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}` }}
                  >
                    Curso
                  </th>
                  <th
                    className="text-left text-xs font-semibold tracking-wide px-4 py-3"
                    style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}` }}
                  >
                    Perfil
                  </th>
                  <th
                    className="text-left text-xs font-semibold tracking-wide px-4 py-3 hidden md:table-cell"
                    style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}` }}
                  >
                    Status
                  </th>
                  <th
                    className="text-left text-xs font-semibold tracking-wide px-4 py-3"
                    style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}` }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8" style={{ color: G.gray }}>
                      Nenhum participante encontrado
                    </td>
                  </tr>
                )}
                {filtered.map(p => {
                  const pr = p.primary_profile ? PROFILES[p.primary_profile] : null
                  const sec = p.secondary_profile ? PROFILES[p.secondary_profile] : null
                  const done = !!p.quiz_completed && !!pr
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td
                        className="px-4 py-3"
                        style={{ borderBottom: `1px solid ${G.grayDark}22` }}
                      >
                        <div className="font-semibold text-sm" style={{ color: G.white }}>
                          {p.name}
                        </div>
                        <div className="text-xs flex items-center gap-1.5 flex-wrap" style={{ color: G.gray }}>
                          <span>{formatDate(p.created_at)}</span>
                          {p.city && (
                            <>
                              <span style={{ color: `${G.grayDark}` }}>•</span>
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {p.city}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-sm hidden sm:table-cell"
                        style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}22` }}
                      >
                        {p.phone}
                      </td>
                      <td
                        className="px-4 py-3 hidden lg:table-cell"
                        style={{ borderBottom: `1px solid ${G.grayDark}22` }}
                      >
                        {p.course_interest ? (
                          <div
                            className="inline-block text-xs font-medium px-2.5 py-1 rounded-md max-w-[180px] truncate"
                            style={{
                              background: `${G.gold}18`,
                              border: `1px solid ${G.gold}33`,
                              color: G.goldLight,
                            }}
                            title={p.course_interest}
                          >
                            {p.course_interest}
                          </div>
                        ) : (
                          <span className="text-xs italic" style={{ color: G.grayDark }}>
                            —
                          </span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ borderBottom: `1px solid ${G.grayDark}22` }}
                      >
                        {done && pr ? (
                          <>
                            <div className="text-sm font-semibold" style={{ color: pr.color }}>
                              {pr.icon} {pr.name}
                            </div>
                            {sec && (
                              <div className="text-xs" style={{ color: sec.color }}>
                                {sec.icon} Sec.
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{
                              background: "#FB923C22",
                              border: "1px solid #FB923C66",
                              color: "#FB923C",
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FB923C" }} />
                            SEM TESTE
                          </div>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 hidden md:table-cell"
                        style={{ borderBottom: `1px solid ${G.grayDark}22` }}
                      >
                        <select
                          value={p.status}
                          onChange={e => updateParticipant(p.id, { status: e.target.value })}
                          className="bg-transparent border-none text-xs cursor-pointer outline-none"
                          style={{ color: G.gray }}
                        >
                          {STATUS_OPTS.map(s => (
                            <option key={s} style={{ background: G.navyMid }}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ borderBottom: `1px solid ${G.grayDark}22` }}
                      >
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setSelected(p)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                            style={{
                              background: `${G.purpleVib}22`,
                              border: `1px solid ${G.purpleVib}44`,
                              color: G.goldLight,
                            }}
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => copyWA(p)}
                            disabled={!done}
                            title={done ? "Copiar mensagem de WhatsApp" : "Aguardando conclusão do teste"}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                              background: `${G.purpleVib}22`,
                              border: `1px solid ${G.purpleVib}44`,
                              color: G.goldLight,
                            }}
                          >
                            {copyMsg === p.id ? "✓" : copyMsg === p.id + "-error" ? "—" : "WA"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
