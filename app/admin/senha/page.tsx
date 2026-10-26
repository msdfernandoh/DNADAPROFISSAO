"use client"
import { useState, type FormEvent } from "react"
import { useAdminGate, QuestionnaireAdminShell, inputStyle } from "@/components/questionnaire-admin/shell"
import { G } from "@/lib/dna-data"
export default function PasswordPage() {
  const ready = useAdminGate()
  const [currentPassword, setCurrent] = useState("")
  const [newPassword, setNew] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setSuccess(false)
    if (newPassword !== confirmation) { setMessage("A confirmação não corresponde à nova senha."); return }
    setBusy(true)
    try {
      const response = await fetch("/api/admin/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword, confirmation }) })
      const body = await response.json()
      if (!response.ok) { setMessage(body.error || "Não foi possível alterar a senha."); return }
      setCurrent(""); setNew(""); setConfirmation("")
      setSuccess(true)
      setMessage("Senha alterada com sucesso. As outras sessões foram encerradas.")
    } catch { setMessage("Falha de conexão. Tente novamente.") }
    finally { setBusy(false) }
  }
  if (!ready) return <div className="min-h-screen p-8" style={{ background: G.navy, color: G.white }}>Verificando sessão...</div>
  return <QuestionnaireAdminShell title="Trocar senha" subtitle="Atualize a senha de acesso ao painel administrativo.">
    <form onSubmit={submit} className="max-w-md space-y-5 rounded-2xl p-6" style={{ background: G.navyLight, border: "1px solid " + G.grayDark }}>
      <label className="block text-sm">Senha atual<input className="mt-2 block w-full rounded-lg px-3 py-3" style={inputStyle} type="password" autoComplete="current-password" required maxLength={1024} value={currentPassword} onChange={e => setCurrent(e.target.value)} disabled={busy} /></label>
      <label className="block text-sm">Nova senha<input className="mt-2 block w-full rounded-lg px-3 py-3" style={inputStyle} type="password" autoComplete="new-password" required minLength={8} maxLength={1024} value={newPassword} onChange={e => setNew(e.target.value)} disabled={busy} /><span className="mt-1 block text-xs" style={{ color: G.gray }}>Use pelo menos 8 caracteres.</span></label>
      <label className="block text-sm">Confirmar nova senha<input className="mt-2 block w-full rounded-lg px-3 py-3" style={inputStyle} type="password" autoComplete="new-password" required minLength={8} maxLength={1024} value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></label>
      {message && <p role={success ? "status" : "alert"} className="text-sm" style={{ color: success ? "#34D399" : "#F87171" }}>{message}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-lg px-4 py-3 font-semibold disabled:opacity-50" style={{ background: G.gold, color: G.navy }}>{busy ? "Salvando..." : "Salvar nova senha"}</button>
    </form>
  </QuestionnaireAdminShell>
}
