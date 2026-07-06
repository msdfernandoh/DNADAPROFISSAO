"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { G } from "@/lib/dna-data"
import { buildVendorRegistrationUrl, normalizeVendorSlug } from "@/lib/vendor-utils"

interface Vendor {
  id: string
  name: string
  phone: string
  slug: string
  active: boolean
  created_at: string
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 13)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `+${digits}`
  if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`
  if (digits.length <= 9) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`
  }
  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
}

function formatPhoneDisplay(digits: string): string {
  if (digits.startsWith("55") && digits.length >= 12) {
    const rest = digits.slice(2)
    if (rest.length === 11) {
      return `(${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7)}`
    }
    if (rest.length === 10) {
      return `(${rest.slice(0, 2)}) ${rest.slice(2, 6)}-${rest.slice(6)}`
    }
  }
  return digits
}

export default function VendedoresAdminPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", phone: "", slug: "", active: true })
  const [slugTouched, setSlugTouched] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [copyId, setCopyId] = useState<string | null>(null)
  const [origin, setOrigin] = useState("https://dnadaprofissao.com.br")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

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
  }, [router])

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/vendors")
      const j = await r.json()
      setVendors(Array.isArray(j.data) ? j.data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!slugTouched && form.name.trim()) {
      setForm(f => ({ ...f, slug: normalizeVendorSlug(f.name) }))
    }
  }, [form.name, slugTouched])

  const submit = async () => {
    if (!form.name.trim()) {
      setMsg({ type: "err", text: "Nome do vendedor é obrigatório." })
      return
    }
    if (!form.slug.trim()) {
      setMsg({ type: "err", text: "Slug é obrigatório." })
      return
    }
    setSaving(true)
    try {
      const isEdit = !!editingId
      const r = await fetch("/api/admin/vendors", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { id: editingId, ...form }
            : { name: form.name, phone: form.phone, slug: form.slug, active: form.active }
        ),
      })
      const d = await r.json()
      if (!r.ok) {
        setMsg({ type: "err", text: d.error || "Erro ao salvar." })
      } else {
        setMsg({
          type: "ok",
          text: isEdit ? `Vendedor "${d.name}" atualizado.` : `Vendedor "${d.name}" cadastrado.`,
        })
        setForm({ name: "", phone: "", slug: "", active: true })
        setSlugTouched(false)
        setEditingId(null)
        load()
      }
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  const startEdit = (v: Vendor) => {
    setEditingId(v.id)
    setForm({
      name: v.name,
      phone: maskPhone(v.phone),
      slug: v.slug,
      active: v.active,
    })
    setSlugTouched(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: "", phone: "", slug: "", active: true })
    setSlugTouched(false)
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Excluir vendedor "${name}"?`)) return
    await fetch(`/api/admin/vendors?id=${id}`, { method: "DELETE" })
    load()
  }

  const copyLink = (slug: string, id: string) => {
    const url = buildVendorRegistrationUrl(origin, slug)
    navigator.clipboard.writeText(url).then(() => {
      setCopyId(id)
      setTimeout(() => setCopyId(null), 2000)
    })
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: G.navy }}>
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: `${G.gold}33`, borderTopColor: G.gold }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: G.navy }}>
      <div
        className="flex items-center justify-between flex-wrap gap-3 p-4"
        style={{ background: G.navyMid, borderBottom: `1px solid ${G.grayDark}` }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-semibold px-4 py-2 rounded-full"
            style={{ color: G.gold, border: `1px solid ${G.gold}66` }}
          >
            ← Leads
          </Link>
          <span className="text-sm font-bold" style={{ color: G.white }}>
            Vendedores / WhatsApp
          </span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6 pt-8">
        <p className="text-sm mb-6 leading-relaxed" style={{ color: G.gray }}>
          Cadastre o WhatsApp de cada vendedor e um <strong style={{ color: G.goldLight }}>slug</strong> único.
          O link <code className="text-xs">/?v=slug</code> leva o aluno ao teste vinculado a esse vendedor. Após
          concluir, o aluno verá um botão para falar no WhatsApp e receber o resultado.
        </p>

        <div
          className="rounded-2xl p-6 mb-8 backdrop-blur-lg"
          style={{
            background: "rgba(26,32,53,.7)",
            border: `1px solid rgba(201,168,76,.15)`,
          }}
        >
          <h2 className="text-sm font-bold mb-4" style={{ color: G.goldLight }}>
            {editingId ? "Editar vendedor" : "Novo vendedor"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: G.gray }}>
                Nome do vendedor *
              </label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: "rgba(26,32,53,.8)",
                  border: `1.5px solid ${G.grayDark}`,
                  color: G.white,
                }}
                placeholder="Maria Consultora"
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: G.gray }}>
                WhatsApp *
              </label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: maskPhone(e.target.value) })}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: "rgba(26,32,53,.8)",
                  border: `1.5px solid ${G.grayDark}`,
                  color: G.white,
                }}
                placeholder="+55 (11) 99999-9999"
              />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: G.gray }}>
                Slug (link do vendedor) *
              </label>
              <input
                value={form.slug}
                onChange={e => {
                  setSlugTouched(true)
                  setForm({ ...form, slug: normalizeVendorSlug(e.target.value) })
                }}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono"
                style={{
                  background: "rgba(26,32,53,.8)",
                  border: `1.5px solid ${G.grayDark}`,
                  color: G.white,
                }}
                placeholder="maria-consultora"
              />
              {form.slug && (
                <p className="text-[11px] mt-1.5 break-all" style={{ color: G.gray }}>
                  Link: {buildVendorRegistrationUrl(origin, form.slug)}
                </p>
              )}
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer pb-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: G.white }}>
                  Ativo
                </span>
              </label>
            </div>
          </div>

          {msg && (
            <p
              className="text-xs mt-4 text-center"
              style={{ color: msg.type === "ok" ? "#34D399" : "#F87171" }}
            >
              {msg.text}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={submit}
              disabled={saving}
              className="font-bold rounded-full px-8 py-3 text-sm disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
                color: G.navy,
              }}
            >
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar vendedor"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm px-6 py-3 rounded-full"
                style={{ color: G.gray, border: `1px solid ${G.grayDark}` }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <h2 className="text-sm font-bold mb-4" style={{ color: G.white }}>
          Vendedores cadastrados ({vendors.length})
        </h2>

        {loading ? (
          <p className="text-sm" style={{ color: G.gray }}>
            Carregando...
          </p>
        ) : vendors.length === 0 ? (
          <p className="text-sm" style={{ color: G.gray }}>
            Nenhum vendedor cadastrado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {vendors.map(v => (
              <div
                key={v.id}
                className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                style={{
                  background: "rgba(26,32,53,.5)",
                  border: `1px solid ${v.active ? `${G.purpleVib}33` : "#F8717133"}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm" style={{ color: G.white }}>
                    {v.name}
                    {!v.active && (
                      <span className="ml-2 text-[10px] uppercase" style={{ color: "#F87171" }}>
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1 font-mono" style={{ color: G.goldLight }}>
                    /?v={v.slug}
                  </div>
                  <div className="text-xs mt-1" style={{ color: G.gray }}>
                    WhatsApp: {formatPhoneDisplay(v.phone)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(v.slug, v.id)}
                    className="text-xs font-semibold px-4 py-2 rounded-full"
                    style={{ color: G.gold, border: `1px solid ${G.gold}55` }}
                  >
                    {copyId === v.id ? "Link copiado!" : "Copiar link do vendedor"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(v)}
                    className="text-xs font-semibold px-4 py-2 rounded-full"
                    style={{ color: G.white, border: `1px solid ${G.grayDark}` }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(v.id, v.name)}
                    className="text-xs font-semibold px-4 py-2 rounded-full"
                    style={{ color: "#F87171", border: `1px solid #F8717155` }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
