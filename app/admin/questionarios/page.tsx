"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { G } from "@/lib/dna-data"
import { QuestionnaireAdminShell, useAdminGate } from "@/components/questionnaire-admin/shell"
import type { QuestionnaireRow } from "@/lib/questionnaire-platform/validators"

export default function QuestionnairesListPage() {
  const ready = useAdminGate()
  const [items, setItems] = useState<QuestionnaireRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v2/admin/questionnaires")
      const json = await res.json()
      if (res.status === 401) {
        window.location.href = "/admin"
        return
      }
      if (!res.ok) {
        setError(json.error || "Erro ao carregar.")
        return
      }
      setItems(json.data ?? [])
    } catch {
      setError("Falha de rede.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (ready) load()
  }, [ready, load])

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
    <QuestionnaireAdminShell title="Questionários configuráveis" subtitle="Motor V2 — não altera o DNA Profissional V1">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm" style={{ color: G.gray }}>
          {loading ? "Carregando…" : `${items.length} questionário(s)`}
        </p>
        <Link
          href="/admin/questionarios/novo"
          className="font-semibold px-4 py-2 rounded-lg"
          style={{ background: G.gold, color: G.navy }}
        >
          + Novo questionário
        </Link>
      </div>

      {error ? (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FB923C22", color: "#FB923C" }}>
          {error}
          {error.includes("relation") || error.includes("does not exist") ? (
            <span className="block mt-1 text-xs opacity-90">
              Aplique a migration <code className="text-white">scripts/008_questionnaire_platform_core.sql</code> no
              Supabase.
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(26,32,53,.85)", border: `1px solid ${G.grayDark}` }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${G.grayDark}`, color: G.gray }}>
              <th className="text-left p-3 font-medium">Nome</th>
              <th className="text-left p-3 font-medium">Slug</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Ver.</th>
              <th className="text-left p-3 font-medium">Ativo</th>
              <th className="text-left p-3 font-medium">Criado</th>
              <th className="text-right p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center" style={{ color: G.gray }}>
                  Nenhum questionário. Crie o primeiro em &quot;Novo questionário&quot;.
                </td>
              </tr>
            ) : null}
            {items.map(q => (
              <tr key={q.id} style={{ borderBottom: `1px solid ${G.grayDark}44` }}>
                <td className="p-3 font-medium">{q.name}</td>
                <td className="p-3 font-mono text-xs" style={{ color: G.goldLight }}>
                  {q.slug}
                </td>
                <td className="p-3">{q.status}</td>
                <td className="p-3">{q.version}</td>
                <td className="p-3">{q.active ? "Sim" : "Não"}</td>
                <td className="p-3 whitespace-nowrap" style={{ color: G.gray }}>
                  {new Date(q.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Link
                      href={`/admin/questionarios/${q.id}`}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: G.navyLight, border: `1px solid ${G.grayDark}` }}
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/admin/questionarios/${q.id}/perfis`}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: `${G.purpleVib}33`, border: `1px solid ${G.purpleVib}55` }}
                    >
                      Perfis
                    </Link>
                    <Link
                      href={`/admin/questionarios/${q.id}/perguntas`}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: `${G.gold}22`, border: `1px solid ${G.gold}44` }}
                    >
                      Perguntas
                    </Link>
                    <Link
                      href={`/admin/questionarios/${q.id}/leads`}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: `${G.purpleVib}22`, border: `1px solid ${G.purpleVib}55` }}
                    >
                      Leads
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </QuestionnaireAdminShell>
  )
}
