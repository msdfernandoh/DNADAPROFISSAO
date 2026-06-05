"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { G } from "@/lib/dna-data"

interface Course {
  id: string
  name: string
  level: string | null
  external_id: string | null
  created_at: string
}

export default function CursosAdminPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // form de cadastro / edição manual
  const [form, setForm] = useState({ name: "", level: "", external_id: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // import csv
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    inserted: number
    total: number
    skipped: number
    errors: string[]
  } | null>(null)

  const [filter, setFilter] = useState("")

  useEffect(() => {
    fetch("/api/admin/login")
      .then(r => r.json())
      .then(j => {
        if (!j.authed) {
          router.push("/admin")
          return
        }
        setAuthChecked(true)
        load()
      })
      .catch(() => router.push("/admin"))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/courses")
      const d = await r.json()
      setCourses(Array.isArray(d) ? d : [])
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (!form.name.trim()) {
      setMsg({ type: "err", text: "Nome do curso é obrigatório." })
      return
    }
    setSaving(true)
    try {
      const isEdit = !!editingId
      const r = await fetch("/api/courses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...form } : form),
      })
      const d = await r.json()
      if (!r.ok) {
        setMsg({ type: "err", text: d.error || "Erro ao salvar." })
      } else {
        setMsg({
          type: "ok",
          text: isEdit
            ? `Curso "${d.name}" atualizado.`
            : `Curso "${d.name}" cadastrado.`,
        })
        setForm({ name: "", level: "", external_id: "" })
        setEditingId(null)
        load()
      }
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 3500)
    }
  }

  const startEdit = (c: Course) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      level: c.level || "",
      external_id: c.external_id || "",
    })
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: "", level: "", external_id: "" })
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return
    await fetch(`/api/courses?id=${id}`, { method: "DELETE" })
    load()
  }

  const handleCSVFile = async (file: File) => {
    setImporting(true)
    setImportResult(null)
    try {
      // Lê como bytes para conseguir tentar UTF-8 e cair pra latin1 quando necessário
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let text = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
      // Se aparecer o caractere de substituição, a planilha veio em latin1/ANSI
      if (text.includes("\uFFFD")) {
        text = new TextDecoder("latin1").decode(bytes)
      }
      const r = await fetch("/api/courses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      })
      const d = await r.json()
      if (!r.ok) {
        setMsg({ type: "err", text: d.error || "Erro ao importar." })
      } else {
        setImportResult(d)
        load()
      }
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const filtered = courses.filter(
    c =>
      !filter ||
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      (c.level || "").toLowerCase().includes(filter.toLowerCase()) ||
      (c.external_id || "").toLowerCase().includes(filter.toLowerCase()),
  )

  if (!authChecked) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: G.navy, color: G.gray }}
      >
        Verificando sessão...
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: G.navy, color: G.white }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link
              href="/admin"
              className="text-xs hover:underline"
              style={{ color: G.goldLight }}
            >
              ← Voltar para participantes
            </Link>
            <h1
              className="text-3xl font-bold mt-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Cursos
            </h1>
            <p className="text-sm" style={{ color: G.gray }}>
              Cadastre os cursos disponíveis no formulário público.
            </p>
          </div>
          <div
            className="rounded-lg px-4 py-2 text-center"
            style={{ background: `${G.gold}11`, border: `1px solid ${G.gold}33` }}
          >
            <div className="text-[10px]" style={{ color: G.gray }}>
              TOTAL
            </div>
            <div className="text-xl font-bold" style={{ color: G.goldLight }}>
              {courses.length}
            </div>
          </div>
        </div>

        {msg && (
          <div
            className="rounded-lg px-4 py-3 mb-6 text-sm"
            style={{
              background: msg.type === "ok" ? "#10B98122" : "#EF444422",
              border: `1px solid ${msg.type === "ok" ? "#10B981" : "#EF4444"}66`,
              color: msg.type === "ok" ? "#34D399" : "#FCA5A5",
            }}
          >
            {msg.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Cadastro manual */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(26,32,53,.7)", border: `1px solid ${G.grayDark}44` }}
          >
            <h2 className="text-base font-bold mb-4" style={{ color: G.goldLight }}>
              {editingId ? "Editar curso" : "Cadastrar curso"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] tracking-wider" style={{ color: G.gray }}>
                  NOME DO CURSO *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "#0F1429",
                    border: `1px solid ${G.grayDark}55`,
                    color: G.white,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] tracking-wider" style={{ color: G.gray }}>
                    NÍVEL
                  </label>
                  <input
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                    placeholder="Técnico, Graduação..."
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "#0F1429",
                      border: `1px solid ${G.grayDark}55`,
                      color: G.white,
                    }}
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-wider" style={{ color: G.gray }}>
                    ID EXTERNO
                  </label>
                  <input
                    value={form.external_id}
                    onChange={e => setForm({ ...form, external_id: e.target.value })}
                    placeholder="opcional"
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "#0F1429",
                      border: `1px solid ${G.grayDark}55`,
                      color: G.white,
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={saving}
                  className="flex-1 rounded-lg py-2 text-sm font-bold transition-all disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${G.gold}, ${G.goldLight})`,
                    color: G.navy,
                  }}
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                    ? "Salvar alterações"
                    : "Cadastrar curso"}
                </button>
                {editingId && (
                  <button
                    onClick={cancelEdit}
                    type="button"
                    className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                    style={{
                      background: "transparent",
                      border: `1px solid ${G.grayDark}66`,
                      color: G.gray,
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Import CSV */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(26,32,53,.7)", border: `1px solid ${G.grayDark}44` }}
          >
            <h2 className="text-base font-bold mb-1" style={{ color: G.goldLight }}>
              Importar via CSV
            </h2>
            <p className="text-xs mb-4" style={{ color: G.gray }}>
              Colunas aceitas: <code className="text-[11px]">name</code> (ou{" "}
              <code className="text-[11px]">nome</code>),{" "}
              <code className="text-[11px]">level</code> (ou{" "}
              <code className="text-[11px]">nivel</code>),{" "}
              <code className="text-[11px]">external_id</code>. Separador vírgula ou ponto-e-vírgula.
            </p>

            <div
              className="rounded-lg border-2 border-dashed p-6 text-center transition-all hover:bg-white/5"
              style={{ borderColor: `${G.gold}55` }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleCSVFile(f)
                }}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer inline-block rounded-lg px-4 py-2 text-sm font-semibold"
                style={{
                  background: `${G.purpleVib}33`,
                  border: `1px solid ${G.purpleVib}66`,
                  color: G.goldLight,
                }}
              >
                {importing ? "Processando..." : "Selecionar arquivo CSV"}
              </label>
              <div className="text-[11px] mt-2" style={{ color: G.gray }}>
                Cursos com <code>external_id</code> repetido são atualizados.
              </div>
            </div>

            <div className="mt-3">
              <a
                href="data:text/csv;charset=utf-8,name,level,external_id%0AAdministra%C3%A7%C3%A3o,Gradua%C3%A7%C3%A3o,ADM001%0ANutri%C3%A7%C3%A3o,Gradua%C3%A7%C3%A3o,NUT001%0ARadiologia,T%C3%A9cnico,RAD001"
                download="modelo-cursos.csv"
                className="text-[11px] hover:underline"
                style={{ color: G.goldLight }}
              >
                Baixar modelo de CSV
              </a>
            </div>

            {importResult && (
              <div
                className="mt-4 rounded-lg p-3 text-sm"
                style={{
                  background: "#10B98122",
                  border: "1px solid #10B98166",
                  color: "#86EFAC",
                }}
              >
                <strong>{importResult.inserted}</strong> de{" "}
                <strong>{importResult.total}</strong> cursos importados (
                {importResult.skipped} ignorados/duplicados).
                {importResult.errors.length > 0 && (
                  <div className="text-xs mt-1" style={{ color: "#FCA5A5" }}>
                    Erros: {importResult.errors.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lista */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(26,32,53,.7)", border: `1px solid ${G.grayDark}44` }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between flex-wrap gap-2"
            style={{ borderBottom: `1px solid ${G.grayDark}33` }}
          >
            <div className="text-xs font-bold tracking-wider" style={{ color: G.goldLight }}>
              CURSOS CADASTRADOS
            </div>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Buscar..."
              className="rounded-md px-3 py-1.5 text-xs outline-none"
              style={{
                background: "#0F1429",
                border: `1px solid ${G.grayDark}55`,
                color: G.white,
                minWidth: 180,
              }}
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: G.gray }}>
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: G.gray }}>
              {filter
                ? "Nenhum curso encontrado para esse filtro."
                : "Nenhum curso cadastrado ainda. Adicione manualmente ou importe um CSV."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0F1429" }}>
                  <th
                    className="text-left px-4 py-3 text-[10px] tracking-wider font-bold"
                    style={{ color: G.gray }}
                  >
                    NOME
                  </th>
                  <th
                    className="text-left px-4 py-3 text-[10px] tracking-wider font-bold hidden sm:table-cell"
                    style={{ color: G.gray }}
                  >
                    NÍVEL
                  </th>
                  <th
                    className="text-left px-4 py-3 text-[10px] tracking-wider font-bold hidden md:table-cell"
                    style={{ color: G.gray }}
                  >
                    ID EXTERNO
                  </th>
                  <th
                    className="text-right px-4 py-3 text-[10px] tracking-wider font-bold"
                    style={{ color: G.gray }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{ borderBottom: `1px solid ${G.grayDark}22` }}
                    >
                      {c.name}
                    </td>
                    <td
                      className="px-4 py-3 hidden sm:table-cell"
                      style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}22` }}
                    >
                      {c.level || "—"}
                    </td>
                    <td
                      className="px-4 py-3 hidden md:table-cell font-mono text-xs"
                      style={{ color: G.gray, borderBottom: `1px solid ${G.grayDark}22` }}
                    >
                      {c.external_id || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      style={{ borderBottom: `1px solid ${G.grayDark}22` }}
                    >
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: `${G.gold}22`,
                            border: `1px solid ${G.gold}55`,
                            color: G.goldLight,
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => remove(c.id, c.name)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            background: "#EF444422",
                            border: "1px solid #EF444466",
                            color: "#FCA5A5",
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
