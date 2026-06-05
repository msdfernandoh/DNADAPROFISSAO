import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const SESSION_COOKIE = "dna_admin_session"
const SESSION_VALUE = "authenticated"

async function isAuthed() {
  const c = await cookies()
  return c.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

/**
 * Parser CSV simples com suporte a aspas duplas, quebras de linha em campos
 * e separador automático entre `,` e `;`.
 */
function parseCSV(text: string): string[][] {
  // Remove BOM UTF-8 caso o arquivo tenha sido salvo com BOM (comum no Excel)
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  // Detecta separador (vírgula ou ponto e vírgula) com base na primeira linha
  const firstLine = text.split(/\r?\n/, 1)[0] || ""
  const sep = firstLine.split(";").length > firstLine.split(",").length ? ";" : ","

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === sep) {
        row.push(field)
        field = ""
      } else if (ch === "\n") {
        row.push(field)
        rows.push(row)
        row = []
        field = ""
      } else if (ch === "\r") {
        // ignora — \n cuida disso
      } else {
        field += ch
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter(r => r.some(c => c.trim().length > 0))
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  let csv: string = body?.csv || ""
  if (!csv.trim()) {
    return NextResponse.json({ error: "CSV vazio" }, { status: 400 })
  }

  // Detecta CSVs salvos em latin1/Windows-1252 (Excel padrão BR).
  // Heurística: se aparecerem caracteres "Ã", "Â" ou substituição (U+FFFD)
  // junto a sequências típicas de mojibake, tenta reinterpretar como latin1.
  if (/Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|\uFFFD/.test(csv)) {
    try {
      // Reconstrói os bytes originais e decodifica como latin1.
      const bytes = new Uint8Array(csv.length)
      for (let i = 0; i < csv.length; i++) bytes[i] = csv.charCodeAt(i) & 0xff
      const decoded = new TextDecoder("latin1").decode(bytes)
      // Só usa se o resultado tiver caracteres acentuados válidos
      if (/[áéíóúãõâêîôûàçÁÉÍÓÚÃÕÂÊÎÔÛÀÇ]/.test(decoded)) {
        csv = decoded
      }
    } catch {
      // ignora — usa o original
    }
  }

  const rows = parseCSV(csv)
  if (rows.length === 0) return NextResponse.json({ error: "Nenhuma linha encontrada" }, { status: 400 })

  // Detecta header — qualquer cabeçalho que contenha "name", "nome" ou "level" é tratado como header
  const head = rows[0].map(h => h.trim().toLowerCase())
  const hasHeader =
    head.includes("name") ||
    head.includes("nome") ||
    head.includes("level") ||
    head.includes("nivel") ||
    head.includes("nível")

  // Mapeia índices das colunas — aceita: name|nome, level|nivel, external_id|id
  const colIndex = (keys: string[]) => head.findIndex(h => keys.includes(h))
  const idxName = hasHeader ? colIndex(["name", "nome"]) : 0
  const idxLevel = hasHeader ? colIndex(["level", "nivel", "nível"]) : 1
  const idxExternal = hasHeader ? colIndex(["external_id", "id", "id_externo"]) : 2

  const dataRows = hasHeader ? rows.slice(1) : rows

  const records = dataRows
    .map(r => ({
      name: (r[idxName >= 0 ? idxName : 0] || "").trim(),
      level: idxLevel >= 0 ? (r[idxLevel] || "").trim() || null : null,
      external_id: idxExternal >= 0 ? (r[idxExternal] || "").trim() || null : null,
    }))
    .filter(r => r.name)

  if (records.length === 0) {
    return NextResponse.json({ error: "Nenhum curso válido encontrado no CSV" }, { status: 400 })
  }

  const supabase = await createClient()

  // Upsert por external_id quando informado, senão insert simples evitando duplicar pelo nome
  const withExternal = records.filter(r => r.external_id)
  const withoutExternal = records.filter(r => !r.external_id)

  let inserted = 0
  let errors: string[] = []

  if (withExternal.length > 0) {
    const { data, error } = await supabase
      .from("courses")
      .upsert(withExternal, { onConflict: "external_id" })
      .select()
    if (error) errors.push(error.message)
    else inserted += data?.length || 0
  }

  if (withoutExternal.length > 0) {
    // Para os sem external_id, evitamos duplicar pelo name (case-insensitive)
    const { data: existing } = await supabase.from("courses").select("name")
    const existingNames = new Set((existing || []).map(c => c.name.toLowerCase()))
    const toInsert = withoutExternal.filter(r => !existingNames.has(r.name.toLowerCase()))
    if (toInsert.length > 0) {
      const { data, error } = await supabase.from("courses").insert(toInsert).select()
      if (error) errors.push(error.message)
      else inserted += data?.length || 0
    }
  }

  return NextResponse.json({
    inserted,
    total: records.length,
    skipped: records.length - inserted,
    errors,
  })
}
