"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { G } from "@/lib/dna-data"

export function useAdminGate() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch("/api/admin/login")
      .then(r => r.json())
      .then(j => {
        if (!j.authed) {
          router.replace("/admin")
          return
        }
        setReady(true)
      })
      .catch(() => router.replace("/admin"))
  }, [router])

  return ready
}

/** V1 admin OU sessão admin V2 (super_admin, city_admin, seller). */
export function useCommercialAdminGate() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/login").then(r => r.json()),
      fetch("/api/v2/admin/auth/me").then(r => r.json()),
    ])
      .then(([v1, v2]) => {
        if (v1.authed || v2.authed) {
          setReady(true)
          return
        }
        router.replace("/admin/v2/login")
      })
      .catch(() => router.replace("/admin/v2/login"))
  }, [router])

  return ready
}

export function QuestionnaireAdminShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: G.navy, color: G.white }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs tracking-widest mb-1" style={{ color: G.gold }}>
              PLATAFORMA V2
            </p>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle ? (
              <p className="text-sm mt-1" style={{ color: G.gray }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/admin/questionarios"
              className="px-3 py-2 rounded-lg"
              style={{ background: G.navyLight, border: `1px solid ${G.grayDark}` }}
            >
              Questionários
            </Link>
            <Link
              href="/admin/questionarios/unidades"
              className="px-3 py-2 rounded-lg"
              style={{ background: `${G.purpleVib}22`, border: `1px solid ${G.purpleVib}55` }}
            >
              Unidades
            </Link>
            <Link
              href="/admin/questionarios/vendedores"
              className="px-3 py-2 rounded-lg"
              style={{ background: `${G.purpleVib}22`, border: `1px solid ${G.purpleVib}55` }}
            >
              Vendedores
            </Link>
            <Link
              href="/admin/questionarios/creditos"
              className="px-3 py-2 rounded-lg"
              style={{ background: `${G.purpleVib}22`, border: `1px solid ${G.purpleVib}55` }}
            >
              Créditos
            </Link>
            <Link
              href="/admin"
              className="px-3 py-2 rounded-lg"
              style={{ background: `${G.gold}22`, border: `1px solid ${G.gold}44`, color: G.goldLight }}
            >
              Admin V1
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  background: G.navyLight,
  border: `1px solid ${G.grayDark}`,
  color: G.white,
}

export const labelStyle: React.CSSProperties = {
  color: G.gray,
  fontSize: "0.75rem",
  marginBottom: "0.25rem",
}
