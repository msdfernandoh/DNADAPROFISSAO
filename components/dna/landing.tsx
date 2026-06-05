"use client"

import { Logo } from "./logo"
import { G, PROFILES } from "@/lib/dna-data"

interface LandingProps {
  onStart: () => void
}

export function Landing({ onStart }: LandingProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: `radial-gradient(ellipse at 20% 0%,${G.purple}55 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,${G.purpleVib}33 0%,transparent 60%),${G.navy}`
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Logo />
        <button
          onClick={onStart}
          className="font-semibold text-sm border rounded-full px-7 py-2.5 transition-all hover:border-opacity-100"
          style={{ 
            color: G.gold, 
            borderColor: `${G.gold}66`,
            background: "transparent"
          }}
        >
          Iniciar agora
        </button>
      </header>

      {/* Hero */}
      <div className="max-w-[760px] mx-auto px-6 pt-12 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 animate-fadeUp tracking-wider"
          style={{
            background: `${G.purpleVib}22`,
            border: `1px solid ${G.purpleVib}44`,
            color: G.goldLight,
          }}
        >
          DIREÇÃO • NATUREZA • APTIDÃO
        </div>

        <h1
          className="font-serif font-black leading-[1.05] mb-6 animate-fadeUp"
          style={{ fontSize: "clamp(2.4rem,8vw,4rem)", animationDelay: ".1s" }}
        >
          Descubra o seu<br />
          <span
            style={{
              background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DNA Profissional
          </span>
        </h1>

        <p
          className="text-base leading-relaxed max-w-[600px] mx-auto mb-5 animate-fadeUp"
          style={{ color: G.white, animationDelay: ".15s" }}
        >
          O <strong style={{ color: G.gold }}>DNA PROFISSIONAL</strong> foi criado para ajudar você a entender melhor quais áreas realmente combinam com seu jeito natural de pensar, agir e se desenvolver.
        </p>

        <p
          className="text-sm leading-relaxed max-w-[600px] mx-auto mb-5 animate-fadeUp"
          style={{ color: G.gray, animationDelay: ".2s" }}
        >
          Através de situações simples do cotidiano, essa análise identifica padrões do seu comportamento e áreas profissionais com maior compatibilidade com seu perfil.
        </p>

        <p
          className="text-sm font-semibold mb-10 animate-fadeUp"
          style={{ color: G.goldLight, animationDelay: ".25s" }}
        >
          Não existem respostas certas ou erradas.
        </p>

        <button
          onClick={onStart}
          className="font-bold text-base rounded-full px-12 py-4 transition-all hover:-translate-y-0.5 animate-fadeUp"
          style={{
            background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
            color: G.navy,
            boxShadow: `0 12px 32px ${G.gold}44`,
            animationDelay: ".3s",
          }}
        >
          Iniciar minha análise gratuita
        </button>

        <p
          className="text-xs mt-4 animate-fadeUp"
          style={{ color: G.gray, animationDelay: ".4s" }}
        >
          24 perguntas • Aproximadamente 8 minutos • 100% gratuito
        </p>
      </div>

      {/* Features */}
      <div className="max-w-[900px] mx-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "🧬", title: "Perfil comportamental", desc: "Entenda seus padrões reais de comportamento e tomada de decisão." },
          { icon: "🎯", title: "Direcionamento de carreira", desc: "Áreas e cursos que combinam com o seu jeito de funcionar." },
          { icon: "🔓", title: "Travas profissionais", desc: "Descubra o que pode estar impedindo você de avançar." },
          { icon: "📄", title: "Relatório personalizado", desc: "Diagnóstico completo entregue por um consultor." },
        ].map((f, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 text-center backdrop-blur-lg animate-fadeUp"
            style={{
              background: "rgba(26,32,53,.7)",
              border: `1px solid rgba(201,168,76,.15)`,
              animationDelay: `${(i + 1) * 0.1}s`
            }}
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="font-bold text-sm mb-2" style={{ color: G.white }}>{f.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: G.gray }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Profiles preview */}
      <div className="max-w-[700px] mx-auto px-6 py-20">
        <h2
          className="font-serif font-black text-center text-2xl mb-8"
          style={{ color: G.white }}
        >
          Qual dos 5 perfis é o <span style={{ color: G.gold }}>seu</span>?
        </h2>

        <div className="flex flex-col gap-3">
          {Object.entries(PROFILES).map(([k, p]) => (
            <div
              key={k}
              className="flex items-center gap-4 rounded-xl p-4 backdrop-blur-sm"
              style={{
                background: "rgba(26,32,53,.5)",
                border: `1px solid ${G.purpleVib}33`
              }}
            >
              <div className="text-2xl">{p.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: p.color }}>{p.name}</div>
                <div className="text-xs mt-1" style={{ color: G.gray }}>
                  {p.strong.slice(0, 3).join(" - ")}
                </div>
              </div>
              <div
                className="w-2.5 h-2.5 rounded-full opacity-70"
                style={{ background: p.color }}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onStart}
            className="font-bold rounded-full px-11 py-4 transition-all hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg,${G.gold},${G.goldLight})`,
              color: G.navy
            }}
          >
            Descobrir meu perfil agora
          </button>
        </div>
      </div>
    </div>
  )
}
