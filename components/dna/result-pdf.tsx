"use client"

import { PROFILES, COURSES_BY_PROFILE, type ProfileKey } from "@/lib/dna-data"
import { useRef, useState } from "react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface ResultPDFProps {
  name: string
  primaryProfile: string
  secondaryProfile: string
  percentages: Record<string, number>
}

// Cores do PDF (compatíveis com html2canvas - sem oklch)
const C = {
  navy: "#0B0E1A",
  navyDeep: "#080B17",
  navyLight: "#1A2035",
  purple: "#2D1F5E",
  purpleVib: "#5B3FA6",
  purpleSoft: "#3D2B7E",
  gold: "#C9A84C",
  goldLight: "#E2C97E",
  cream: "#F5EFD9",
  white: "#FFFFFF",
  textMuted: "#8B93B0",
  textDark: "#2A2F45",
  bgPage: "#F8F5EC",
}

const PAGE_W = 794 // px @ ~96dpi for A4
const PAGE_H = 1123

function Page({ children, bg = C.white, id }: { children: React.ReactNode; bg?: string; id: string }) {
  return (
    <div
      id={id}
      className="pdf-page relative overflow-hidden"
      style={{
        width: `${PAGE_W}px`,
        height: `${PAGE_H}px`,
        background: bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: C.textDark,
      }}
    >
      {children}
    </div>
  )
}

function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
      <div className="w-2 h-2 rounded-full" style={{ background: C.gold }} />
      <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
    </div>
  )
}

function SectionTitle({ children, color = C.purple }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] tracking-[0.3em] font-bold mb-1" style={{ color: C.gold }}>
        ━━━━
      </div>
      <h3 className="text-[22px] font-black leading-tight" style={{ color, fontFamily: "'Playfair Display', serif" }}>
        {children}
      </h3>
    </div>
  )
}

function Logo({ small = false }: { small?: boolean }) {
  const size = small ? 36 : 52
  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-xl flex items-center justify-center font-black"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
          color: C.navy,
          fontSize: small ? 18 : 26,
          fontFamily: "'Playfair Display', serif",
        }}
      >
        D
      </div>
      <div>
        <div className={`font-black ${small ? "text-sm" : "text-lg"}`} style={{ color: C.gold, letterSpacing: "0.15em" }}>
          DNA
        </div>
        <div className={`${small ? "text-[8px]" : "text-[10px]"} tracking-[0.3em] font-semibold`} style={{ color: C.cream }}>
          PROFISSIONAL
        </div>
      </div>
    </div>
  )
}

export function ResultPDF({ name, primaryProfile, secondaryProfile, percentages }: ResultPDFProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  const primary = PROFILES[primaryProfile]
  const secondary = PROFILES[secondaryProfile] || PROFILES["A"]
  const courses = COURSES_BY_PROFILE[primaryProfile as ProfileKey] || COURSES_BY_PROFILE["A"]
  const firstName = name.split(" ")[0]
  // Tema dinâmico do perfil (cada perfil tem identidade visual própria)
  const T = primary.theme
  const fmtMoney = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`

  const generatePDF = async () => {
    if (!containerRef.current) return
    setGenerating(true)

    try {
      const pages = containerRef.current.querySelectorAll(".pdf-page")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
          width: PAGE_W,
          height: PAGE_H,
          windowWidth: PAGE_W,
          windowHeight: PAGE_H,
          imageTimeout: 15000,
        })
        // PNG preserva a qualidade de gradientes e textos no PDF
        const imgData = canvas.toDataURL("image/png", 1.0)
        if (i > 0) pdf.addPage()
        // Encaixa exatamente o canvas no tamanho A4 sem margens em branco
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST")
      }

      pdf.save(`DNA_Profissional_${name.replace(/\s+/g, "_")}.pdf`)
    } catch (error) {
      console.error("[v0] Erro ao gerar PDF:", error)
    } finally {
      setGenerating(false)
    }
  }

  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: C.navyDeep }}>
      {/* Botão de Download */}
      <div className="max-w-[820px] mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-white font-bold">Pré-visualização do Relatório</h1>
        <button
          onClick={generatePDF}
          disabled={generating}
          className="flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          style={{ background: C.gold, color: C.navy }}
        >
          {generating ? "Gerando PDF..." : "📄 Baixar PDF Completo"}
        </button>
      </div>

      <div ref={containerRef} className="max-w-[820px] mx-auto flex flex-col gap-6">
        {/* ───── PÁGINA 1 — CAPA (tematizada por perfil) ───── */}
        <Page id="p1" bg={C.navy}>
          {/* Background ornamental usando a cor do perfil */}
          <div className="absolute inset-0">
            <div
              className="absolute"
              style={{
                width: 700,
                height: 700,
                top: -250,
                right: -250,
                background: `radial-gradient(circle, ${T.primary}55, transparent 70%)`,
              }}
            />
            <div
              className="absolute"
              style={{
                width: 500,
                height: 500,
                bottom: -150,
                left: -150,
                background: `radial-gradient(circle, ${T.primaryDark}88, transparent 70%)`,
              }}
            />
            {/* Selo emoji gigante translúcido ao fundo */}
            <div
              className="absolute select-none"
              style={{
                fontSize: 480,
                top: -80,
                left: -60,
                opacity: 0.04,
                lineHeight: 1,
              }}
            >
              {T.coverEmoji}
            </div>
          </div>

          <div className="relative h-full flex flex-col justify-between p-12">
            {/* Top */}
            <div className="flex justify-between items-start">
              <Logo />
              <div className="text-right">
                <div
                  className="text-[10px] tracking-[0.3em] font-bold px-3 py-1.5 rounded-full inline-block"
                  style={{ background: `${T.primary}22`, color: T.primaryLight, border: `1px solid ${T.primary}55` }}
                >
                  {T.coverNumber}
                </div>
                <div className="text-[10px] mt-2" style={{ color: C.textMuted }}>
                  {today}
                </div>
              </div>
            </div>

            {/* Center */}
            <div>
              <div className="text-[60px] mb-2" style={{ lineHeight: 1 }}>
                {T.coverEmoji}
              </div>
              <div className="text-[11px] tracking-[0.4em] mb-3" style={{ color: T.primaryLight }}>
                ━━━ DIAGNÓSTICO COMPLETO
              </div>

              <h1
                className="font-black leading-[0.92] mb-1"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 72,
                  color: C.white,
                }}
              >
                {primary.name.split(" ")[0]}
              </h1>
              <h1
                className="font-black leading-[0.92] mb-6"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 72,
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {primary.name.split(" ").slice(1).join(" ") || "PROFISSIONAL"}
              </h1>

              <p className="text-[16px] italic mb-6 max-w-[520px]" style={{ color: C.cream }}>
                {primary.subtitle}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {primary.superPowers.slice(0, 5).map((sp, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider"
                    style={{
                      background: `${T.primary}22`,
                      border: `1px solid ${T.primary}66`,
                      color: T.primaryLight,
                    }}
                  >
                    {sp}
                  </div>
                ))}
              </div>

              <div
                className="inline-block px-7 py-4 rounded-2xl"
                style={{
                  background: `${T.primaryDark}55`,
                  border: `1px solid ${T.primary}55`,
                }}
              >
                <div className="text-[10px] tracking-[0.3em] mb-1" style={{ color: T.primaryLight }}>
                  RELATÓRIO PERSONALIZADO PARA
                </div>
                <div className="text-[26px] font-bold" style={{ color: C.white, fontFamily: "'Playfair Display', serif" }}>
                  {name}
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full" style={{ background: `${T.primary}15`, border: `1px solid ${T.primary}33` }}>
                <span className="text-[11px] tracking-wider font-semibold" style={{ color: T.primaryLight }}>
                  Mais clareza · Mais direção · Mais você no seu futuro
                </span>
              </div>
            </div>
          </div>
        </Page>

        {/* ───── PÁGINA 2 — INTRODUÇÃO ───── */}
        <Page id="p2" bg={C.bgPage}>
          <div className="h-full flex flex-col p-14">
            <div className="flex justify-between items-center pb-6 border-b" style={{ borderColor: `${C.gold}44` }}>
              <Logo small />
              <div className="text-[10px] tracking-[0.2em]" style={{ color: C.purple }}>
                01 · BEM-VINDO(A)
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="text-[12px] tracking-[0.3em] font-bold mb-3" style={{ color: C.gold }}>
                ━━━ OLÁ, {firstName.toUpperCase()}!
              </div>

              <h2
                className="font-black mb-6 leading-tight"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 48,
                  color: C.purple,
                }}
              >
                Este é o seu retrato profissional.
              </h2>

              <p className="text-[16px] leading-relaxed mb-5" style={{ color: C.textDark }}>
                Antes de qualquer coisa: <strong>obrigado por confiar nesse processo</strong>. As próximas páginas reúnem uma análise cuidadosa sobre quem você é, como você funciona e quais caminhos profissionais mais combinam com a sua natureza.
              </p>

              <p className="text-[16px] leading-relaxed mb-5" style={{ color: C.textDark }}>
                Não se trata de rótulos ou caixinhas. Trata-se de <strong style={{ color: C.purple }}>te oferecer clareza</strong> sobre seus pontos fortes, seus desafios naturais e as áreas onde você pode brilhar de verdade.
              </p>

              <p className="text-[16px] leading-relaxed mb-8" style={{ color: C.textDark }}>
                Leia com calma. Sublinhe o que ressoar. E lembre-se: <em style={{ color: C.purple }}>autoconhecimento é o primeiro passo de toda transformação real.</em>
              </p>

              <GoldDivider />

              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { n: "01", t: "QUEM VOCÊ É", d: "Seu perfil principal e secundário" },
                  { n: "02", t: "COMO FUNCIONA", d: "Forças, desafios e motivações" },
                  { n: "03", t: "POR ONDE IR", d: "Áreas e cursos que combinam" },
                ].map((item, i) => (
                  <div key={i} className="text-center p-4 rounded-xl" style={{ background: C.white, border: `1px solid ${C.gold}33` }}>
                    <div className="text-[28px] font-black" style={{ color: C.gold, fontFamily: "'Playfair Display', serif" }}>
                      {item.n}
                    </div>
                    <div className="text-[12px] font-bold mt-1 tracking-wide" style={{ color: C.purple }}>
                      {item.t}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: C.textMuted }}>
                      {item.d}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-[10px]" style={{ color: C.textMuted }}>
              DNA PROFISSIONAL · página 02
            </div>
          </div>
        </Page>

        {/* ───── PÁGINA 3 — SEU PERFIL ───── */}
        <Page id="p3" bg={C.navy}>
          <div className="absolute inset-0">
            <div
              className="absolute"
              style={{
                width: 700,
                height: 700,
                top: -300,
                right: -300,
                background: `radial-gradient(circle, ${primary.color}33, transparent 70%)`,
              }}
            />
          </div>

          <div className="relative h-full flex flex-col p-14">
            <div className="flex justify-between items-center pb-5 border-b" style={{ borderColor: `${C.gold}33` }}>
              <Logo small />
              <div className="text-[10px] tracking-[0.2em]" style={{ color: C.gold }}>
                02 · SEU PERFIL
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="text-[11px] tracking-[0.3em] font-bold mb-4" style={{ color: C.gold }}>
                SEU PERFIL PRINCIPAL
              </div>

              <h2
                className="font-black leading-[0.95] mb-3"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 56,
                  color: primary.color,
                }}
              >
                {primary.name}
              </h2>

              <div className="text-[18px] italic mb-6" style={{ color: C.cream }}>
                {primary.subtitle}
              </div>

              <div
                className="rounded-2xl p-6 mb-5"
                style={{
                  background: `${C.purpleVib}33`,
                  border: `1px solid ${primary.color}44`,
                }}
              >
                <div className="text-[10px] tracking-[0.3em] font-bold mb-2" style={{ color: primary.color }}>
                  EM UMA FRASE
                </div>
                <p className="text-[18px] leading-relaxed italic" style={{ color: C.white, fontFamily: "'Playfair Display', serif" }}>
                  &ldquo;{primary.tagline}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-6">
                {primary.superPowers.map((sp, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: `${primary.color}15`,
                      border: `1px solid ${primary.color}55`,
                    }}
                  >
                    <div className="text-[11px] font-bold tracking-wider" style={{ color: primary.color }}>
                      {sp}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-xl p-5" style={{ background: `${C.white}08`, border: `1px solid ${C.gold}33` }}>
                  <div className="text-[10px] tracking-[0.3em] font-bold mb-2" style={{ color: C.gold }}>
                    PERFIL PRINCIPAL
                  </div>
                  <div className="text-[36px] font-black" style={{ color: primary.color, fontFamily: "'Playfair Display', serif" }}>
                    {Math.round(percentages[primaryProfile] || 0)}%
                  </div>
                  <div className="text-[12px]" style={{ color: C.cream }}>
                    de identificação
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: `${C.white}08`, border: `1px solid ${C.gold}33` }}>
                  <div className="text-[10px] tracking-[0.3em] font-bold mb-2" style={{ color: C.gold }}>
                    PERFIL SECUNDÁRIO
                  </div>
                  <div className="text-[20px] font-black leading-tight" style={{ color: secondary.color, fontFamily: "'Playfair Display', serif" }}>
                    {secondary.name}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: C.cream }}>
                    {Math.round(percentages[secondaryProfile] || 0)}% de identificação
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px]" style={{ color: C.textMuted }}>
              DNA PROFISSIONAL · página 03
            </div>
          </div>
        </Page>

        {/* ───── PÁGINA 4 — QUEM VOCÊ É / COMO FUNCIONA ───── */}
        <Page id="p4" bg={C.bgPage}>
          <div className="h-full flex flex-col p-14">
            <div className="flex justify-between items-center pb-5 border-b" style={{ borderColor: `${C.gold}44` }}>
              <Logo small />
              <div className="text-[10px] tracking-[0.2em]" style={{ color: C.purple }}>
                03 · QUEM VOCÊ É
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-6">
              <div>
                <SectionTitle>Quem é você?</SectionTitle>
                <p className="text-[15px] leading-relaxed" style={{ color: C.textDark }}>
                  {primary.whoYouAre}
                </p>
              </div>

              <div className="rounded-2xl p-6" style={{ background: C.white, border: `1px solid ${C.gold}33` }}>
                <div className="text-[10px] tracking-[0.3em] font-bold mb-2" style={{ color: C.gold }}>
                  ANALOGIA DO DIA A DIA
                </div>
                <p className="text-[14px] leading-relaxed italic" style={{ color: C.textDark }}>
                  {primary.dailyAnalogy}
                </p>
              </div>

              <div>
                <SectionTitle>Como você funciona</SectionTitle>
                <ul className="space-y-2">
                  {primary.howYouFunction.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[14px]" style={{ color: C.textDark }}>
                      <div
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold mt-0.5"
                        style={{ background: C.gold }}
                      >
                        {i + 1}
                      </div>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <SectionTitle>Como você age no dia a dia</SectionTitle>
                <div className="grid grid-cols-1 gap-2">
                  {primary.howYouAct.map((item, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 rounded-lg text-[13px] flex items-center gap-2"
                      style={{ background: C.white, border: `1px solid ${C.purpleVib}22`, color: C.textDark }}
                    >
                      <span style={{ color: C.gold }}>▸</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center text-[10px]" style={{ color: C.textMuted }}>
              DNA PROFISSIONAL · página 04
            </div>
          </div>
        </Page>

        {/* ───── PÁGINA 5 — COMO DECIDE / O QUE MOTIVA E DESMOTIVA ───── */}
        <Page id="p5" bg={C.bgPage}>
          <div className="h-full flex flex-col p-14">
            <div className="flex justify-between items-center pb-5 border-b" style={{ borderColor: `${C.gold}44` }}>
              <Logo small />
              <div className="text-[10px] tracking-[0.2em]" style={{ color: C.purple }}>
                04 · O QUE TE MOVE
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-6">
              <div>
                <SectionTitle>Como você toma decisões</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {primary.howYouDecide.map((item, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: C.white, border: `1px solid ${C.gold}33` }}>
                      <div className="text-[11px] font-bold mb-1" style={{ color: C.gold }}>
                        0{i + 1}
                      </div>
                      <div className="text-[13px] leading-relaxed" style={{ color: C.textDark }}>
                        {item}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-2xl p-5" style={{ background: `${C.gold}15`, border: `2px solid ${C.gold}` }}>
                  <div className="text-[11px] tracking-[0.3em] font-bold mb-3" style={{ color: C.purple }}>
                    ✦ O QUE TE MOTIVA
                  </div>
                  <ul className="space-y-2">
                    {primary.whatMotivates.map((item, i) => (
                      <li key={i} className="text-[13px] flex items-start gap-2" style={{ color: C.textDark }}>
                        <span style={{ color: C.gold }}>●</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl p-5" style={{ background: `${C.purple}11`, border: `2px solid ${C.purpleVib}` }}>
                  <div className="text-[11px] tracking-[0.3em] font-bold mb-3" style={{ color: C.purple }}>
                    ✕ O QUE TE CANSA
                  </div>
                  <ul className="space-y-2">
                    {primary.whatDrains.map((item, i) => (
                      <li key={i} className="text-[13px] flex items-start gap-2" style={{ color: C.textDark }}>
                        <span style={{ color: C.purpleVib }}>●</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <SectionTitle>Ambiente ideal para você</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {primary.idealEnvironment.map((item, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 rounded-full text-[12px] font-semibold"
                      style={{ background: C.purple, color: C.white }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center text-[10px]" style={{ color: C.textMuted }}>
              DNA PROFISSIONAL · página 05
            </div>
          </div>
        </Page>

        {/* ───── PÁGINA 6 — PONTOS FORTES E DE ATENÇÃO ───── */}
        <Page id="p6" bg={C.navy}>
          <div className="absolute inset-0">
            <div
              className="absolute"
              style={{
                width: 600,
                height: 600,
                bottom: -200,
                right: -200,
                background: `radial-gradient(circle, ${C.gold}22, transparent 70%)`,
              }}
            />
          </div>

          <div className="relative h-full flex flex-col p-14">
            <div className="flex justify-between items-center pb-5 border-b" style={{ borderColor: `${C.gold}33` }}>
              <Logo small />
              <div className="text-[10px] tracking-[0.2em]" style={{ color: C.gold }}>
                05 · FORÇAS E DESAFIOS
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-6">
              <div>
                <div className="text-[11px] tracking-[0.3em] font-bold mb-3" style={{ color: C.gold }}>
                  ━━━ PONTOS FORTES
                </div>
                <h2
                  className="font-black leading-tight mb-5"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 38,
                    color: C.white,
                  }}
                >
                  Seus superpoderes naturais
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {primary.strong.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl px-4 py-3 flex items-center gap-3"
                      style={{
                        background: `${primary.color}15`,
                        border: `1px solid ${primary.color}55`,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
                        style={{ background: primary.color, color: C.navy }}
                      >
                        ✓
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: C.white }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: `${C.purpleVib}33`, border: `1px solid ${C.gold}55` }}>
                <div className="text-[11px] tracking-[0.3em] font-bold mb-3" style={{ color: C.gold }}>
                  ⚠ PONTOS DE ATENÇÃO
                </div>
                <ul className="space-y-2">
                  {primary.attention.map((item, i) => (
                    <li key={i} className="text-[13px] leading-relaxed flex items-start gap-2" style={{ color: C.cream }}>
                      <span style={{ color: C.gold }}>›</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl p-6" style={{ background: `${C.gold}11`, border: `1px dashed ${C.gold}77` }}>
                <div className="text-[11px] tracking-[0.3em] font-bold mb-2" style={{ color: C.gold }}>
                  💡 REFLEXÃO IMPORTANTE
                </div>
                <p className="text-[14px] leading-relaxed italic" style={{ color: C.white, fontFamily: "'Playfair Display', serif" }}>
                  &ldquo;{primary.reflection}&rdquo;
                </p>
              </div>
            </div>

            <div className="text-center text-[10px]" style={{ color: C.textMuted }}>
              DNA PROFISSIONAL · página 06
            </div>
          </div>
        </Page>

        {/* ───── PÁGINA 7 — ÁREAS DE COMPATIBILIDADE ───── */}
        <Page id="p7" bg={C.bgPage}>
          <div className="h-full flex flex-col p-14">
            <div className="flex justify-between items-center pb-5 border-b" style={{ borderColor: `${C.gold}44` }}>
              <Logo small />
              <div className="text-[10px] tracking-[0.2em]" style={{ color: C.purple }}>
                06 · COMPATIBILIDADE
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="text-[11px] tracking-[0.3em] font-bold mb-3" style={{ color: C.gold }}>
                ━━━ ONDE VOCÊ BRILHA
              </div>

              <h2
                className="font-black leading-tight mb-2"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 42,
                  color: C.purple,
                }}
              >
                Áreas com maior compatibilidade
              </h2>

              <p className="text-[14px] mb-8" style={{ color: C.textMuted }}>
                Estas são as cinco grandes áreas profissionais com maior aderência ao seu perfil natural.
              </p>

              <div className="space-y-4">
                {primary.compatibilityAreas.map((area, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: C.white, border: `1px solid ${C.gold}33` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[16px]"
                          style={{
                            background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                            color: C.navy,
                            fontFamily: "'Playfair Display', serif",
                          }}
                        >
                          {i + 1}
                        </div>
                        <div className="text-[16px] font-bold" style={{ color: C.purple }}>
                          {area.name}
                        </div>
                      </div>
                      <div className="text-[24px] font-black" style={{ color: C.gold, fontFamily: "'Playfair Display', serif" }}>
                        {area.pct}%
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: `${C.purple}11` }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${area.pct}%`,
                          background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-[10px]" style={{ color: C.textMuted }}>
              DNA PROFISSIONAL · página 07
            </div>
          </div>
        </Page>

        {/* ───── PÁGINAS 8-10 — CURSOS RECOMENDADOS (5 cursos divididos em páginas) ───── */}
        {[0, 2, 4].map((startIdx, pageIdx) => {
          const pageCourses = courses.slice(startIdx, startIdx + 2)
          if (pageCourses.length === 0) return null
          return (
            <Page key={`courses-${pageIdx}`} id={`p${8 + pageIdx}`} bg={C.bgPage}>
              <div className="h-full flex flex-col p-14">
                <div className="flex justify-between items-center pb-5 border-b" style={{ borderColor: `${C.gold}44` }}>
                  <Logo small />
                  <div className="text-[10px] tracking-[0.2em]" style={{ color: C.purple }}>
                    07 · CURSOS RECOMENDADOS · {pageIdx + 1}/3
                  </div>
                </div>

                {pageIdx === 0 && (
                  <div className="mb-2 mt-2">
                    <div className="text-[11px] tracking-[0.3em] font-bold mb-2" style={{ color: C.gold }}>
                      ━━━ CAMINHOS QUE COMBINAM
                    </div>
                    <h2
                      className="font-black leading-tight mb-1"
                      style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: C.purple }}
                    >
                      Cursos ideais para o seu perfil
                    </h2>
                    <p className="text-[13px]" style={{ color: C.textMuted }}>
                      Os 5 cursos com maior compatibilidade comportamental com você.
                    </p>
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center gap-5">
                  {pageCourses.map((course, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: C.white, border: `1px solid ${C.gold}44` }}
                    >
                      <div
                        className="p-5"
                        style={{
                          background: `linear-gradient(135deg, ${C.purple}, ${C.purpleVib})`,
                          color: C.white,
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[10px] tracking-[0.3em] font-bold mb-1" style={{ color: C.gold }}>
                              {String(startIdx + i + 1).padStart(2, "0")} · CURSO RECOMENDADO
                            </div>
                            <h3 className="font-black text-[24px] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {course.name}
                            </h3>
                          </div>
                          <div
                            className="rounded-xl px-4 py-2 text-center"
                            style={{ background: C.gold, color: C.navy }}
                          >
                            <div className="text-[9px] tracking-wider font-bold">COMPATIB.</div>
                            <div className="text-[22px] font-black leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {course.pct}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <p className="text-[13px] leading-relaxed mb-3" style={{ color: C.textDark }}>
                          {course.description}
                        </p>

                        <div className="text-[10px] tracking-[0.2em] font-bold mb-2" style={{ color: C.gold }}>
                          ÁREAS DE ATUAÇÃO
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {course.areas.map((a, j) => (
                            <span
                              key={j}
                              className="px-3 py-1 rounded-full text-[11px]"
                              style={{ background: `${C.purple}11`, color: C.purple, border: `1px solid ${C.purple}33` }}
                            >
                              {a}
                            </span>
                          ))}
                        </div>

                        <div
                          className="rounded-lg p-3 mt-2"
                          style={{ background: `${C.gold}11`, border: `1px solid ${C.gold}44` }}
                        >
                          <div className="text-[10px] tracking-[0.2em] font-bold mb-1" style={{ color: C.gold }}>
                            IDEAL PARA QUEM
                          </div>
                          <p className="text-[12px] italic" style={{ color: C.textDark }}>
                            {course.idealFor}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center text-[10px]" style={{ color: C.textMuted }}>
                  DNA PROFISSIONAL · página {String(8 + pageIdx).padStart(2, "0")}
                </div>
              </div>
            </Page>
          )
        })}

        {/* ───── PÁGINA SALÁRIOS — IMPACTO DE MERCADO ───── */}
        <Page id="p-salaries" bg={C.bgPage}>
          <div className="h-full flex flex-col p-12">
            <div className="flex justify-between items-center pb-5 border-b" style={{ borderColor: `${T.primary}66` }}>
              <Logo small />
              <div className="text-[10px] tracking-[0.2em] font-bold" style={{ color: T.primaryDark }}>
                SALÁRIOS DE MERCADO
              </div>
            </div>

            <div className="flex-1 flex flex-col py-6">
              <div className="text-[11px] tracking-[0.3em] font-bold mb-3" style={{ color: T.primaryDark }}>
                ━━━ DADOS REAIS DE MERCADO · BRASIL 2024/25
              </div>

              <h2
                className="font-black leading-tight mb-3"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 40,
                  color: C.purple,
                }}
              >
                Quanto ganha quem<br />
                <span style={{ color: T.primaryDark }}>vive seu DNA, {firstName}?</span>
              </h2>

              <p className="text-[14px] leading-relaxed mb-5 max-w-[640px]" style={{ color: C.textDark }}>
                As profissões alinhadas com o seu perfil <strong style={{ color: T.primaryDark }}>{primary.name}</strong> oferecem remunerações que vão muito além do salário médio brasileiro. Veja os números:
              </p>

              {/* Hero card com salário máximo */}
              <div
                className="rounded-2xl p-6 mb-5 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${T.primaryDark}, ${C.navy})`,
                  border: `2px solid ${T.primary}`,
                }}
              >
                <div
                  className="absolute"
                  style={{
                    top: -40,
                    right: -40,
                    fontSize: 200,
                    opacity: 0.08,
                    lineHeight: 1,
                  }}
                >
                  {T.coverEmoji}
                </div>
                <div className="relative">
                  <div className="text-[10px] tracking-[0.3em] font-bold mb-1" style={{ color: T.primaryLight }}>
                    POTENCIAL DE GANHO MENSAL
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div
                      className="font-black leading-none"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 64,
                        background: `linear-gradient(135deg, ${T.primaryLight}, ${C.white})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {fmtMoney(primary.topSalary)}+
                    </div>
                    <div className="text-[14px]" style={{ color: T.primaryLight }}>
                      / mês
                    </div>
                  </div>
                  <div className="text-[12px] mt-2" style={{ color: C.cream }}>
                    com formação correta, experiência e perfil alinhado
                  </div>
                </div>
              </div>

              {/* Tabela de salários */}
              <div className="rounded-2xl overflow-hidden" style={{ background: C.white, border: `1px solid ${T.primary}44` }}>
                <div className="grid grid-cols-12 px-5 py-3" style={{ background: `${T.primaryDark}`, color: C.white }}>
                  <div className="col-span-7 text-[10px] tracking-[0.2em] font-bold">PROFISSÃO</div>
                  <div className="col-span-5 text-[10px] tracking-[0.2em] font-bold text-right">FAIXA SALARIAL</div>
                </div>
                {primary.salaries.map((s, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 px-5 py-3 items-center"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${T.primary}22`,
                    }}
                  >
                    <div className="col-span-7">
                      <div className="text-[13px] font-bold" style={{ color: C.textDark }}>
                        {s.role}
                      </div>
                      {s.note && (
                        <div className="text-[10px] italic" style={{ color: C.textMuted }}>
                          {s.note}
                        </div>
                      )}
                    </div>
                    <div className="col-span-5 text-right">
                      <div className="text-[14px] font-black" style={{ color: T.primaryDark, fontFamily: "'Playfair Display', serif" }}>
                        {fmtMoney(s.min)} – {fmtMoney(s.max)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl p-4 mt-5 flex items-start gap-3"
                style={{
                  background: `${T.primary}11`,
                  border: `1px solid ${T.primary}55`,
                }}
              >
                <div className="text-[20px]">💡</div>
                <p className="text-[12px] leading-relaxed" style={{ color: C.textDark }}>
                  <strong style={{ color: T.primaryDark }}>{firstName}</strong>, esses números não são teoria — são dados reais coletados em pesquisas de mercado, sites de vagas (Glassdoor, Catho) e relatórios da Robert Half. <strong>O que separa quem ganha o mínimo de quem ganha o máximo é a formação e o autoconhecimento.</strong> E você acabou de dar o primeiro passo.
                </p>
              </div>
            </div>

            <div className="text-center text-[10px]" style={{ color: C.textMuted }}>
              Fontes: Robert Half · Catho · Glassdoor · Pesquisa Salarial 2024/25 · Brasil
            </div>
          </div>
        </Page>

        {/* ───── PÁGINA FINAL — DIRECIONAMENTO ───── */}
        <Page id="p-final" bg={C.navy}>
          <div className="absolute inset-0">
            <div
              className="absolute"
              style={{
                width: 800,
                height: 800,
                top: -300,
                left: -200,
                background: `radial-gradient(circle, ${C.purpleVib}55, transparent 70%)`,
              }}
            />
            <div
              className="absolute"
              style={{
                width: 600,
                height: 600,
                bottom: -200,
                right: -200,
                background: `radial-gradient(circle, ${C.gold}33, transparent 70%)`,
              }}
            />
          </div>

          <div className="relative h-full flex flex-col p-14">
            <div className="flex justify-between items-center pb-5 border-b" style={{ borderColor: `${C.gold}33` }}>
              <Logo small />
              <div className="text-[10px] tracking-[0.2em]" style={{ color: C.gold }}>
                08 · DIRECIONAMENTO FINAL
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center text-center">
              <div className="text-[11px] tracking-[0.3em] font-bold mb-4" style={{ color: C.gold }}>
                ━━━ UMA MENSAGEM PARA VOCÊ
              </div>

              <h2
                className="font-black leading-tight mb-8"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 44,
                  color: C.white,
                }}
              >
                {firstName},
                <br />
                <span style={{ color: C.gold }}>seu caminho está claro.</span>
              </h2>

              <div
                className="rounded-2xl p-7 mb-7 mx-auto max-w-[640px]"
                style={{
                  background: `${C.purpleVib}33`,
                  border: `1px solid ${C.gold}55`,
                }}
              >
                <p className="text-[16px] leading-relaxed italic" style={{ color: C.white, fontFamily: "'Playfair Display', serif" }}>
                  &ldquo;{primary.final}&rdquo;
                </p>
              </div>

              <div className="text-[11px] tracking-[0.3em] font-bold mb-3" style={{ color: C.gold }}>
                IMAGINE-SE EM 3 A 5 ANOS
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-[640px] mx-auto mb-8">
                {primary.visualization.map((v, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 text-left"
                    style={{
                      background: `${C.white}08`,
                      border: `1px solid ${C.gold}33`,
                    }}
                  >
                    <div className="text-[10px] font-bold mb-1" style={{ color: C.gold }}>
                      0{i + 1}
                    </div>
                    <div className="text-[13px]" style={{ color: C.cream }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <GoldDivider />

              <div
                className="rounded-2xl p-5 mx-auto max-w-[640px] mb-5"
                style={{
                  background: `${T.primary}22`,
                  border: `2px solid ${T.primary}`,
                }}
              >
                <div className="text-[10px] tracking-[0.3em] font-bold mb-2" style={{ color: T.primaryLight }}>
                  ✦ O DETALHE QUE MUDA TUDO
                </div>
                <p className="text-[14px] leading-relaxed" style={{ color: C.cream }}>
                  Com o seu perfil <strong style={{ color: T.primaryLight }}>{primary.name}</strong> e a formação correta, profissionais como você chegam a ganhar até <strong style={{ color: T.primaryLight, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>{fmtMoney(primary.topSalary)}+</strong> por mês. Os salários nessas áreas são <em>surpreendentes</em> — e estão ao seu alcance.
                </p>
              </div>

              <p className="text-[14px] leading-relaxed max-w-[600px] mx-auto" style={{ color: C.cream }}>
                Esse não é apenas um relatório. É o início da sua próxima fase. Em breve, um consultor entrará em contato para te ajudar a transformar essa clareza em <strong style={{ color: C.gold }}>ação concreta.</strong>
              </p>
            </div>

            <div className="border-t pt-4" style={{ borderColor: `${C.gold}33` }}>
              <div className="flex justify-between items-center">
                <div className="text-[10px]" style={{ color: C.textMuted }}>
                  Relatório gerado em {today}
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-bold" style={{ color: C.gold }}>
                    DNA PROFISSIONAL™
                  </div>
                  <div className="text-[10px]" style={{ color: C.textMuted }}>
                    Mais clareza. Mais direção. Mais você no seu futuro.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Page>
      </div>
    </div>
  )
}
