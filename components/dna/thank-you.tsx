"use client"

import { G } from "@/lib/dna-data"

interface ThankYouProps {
  name: string
}

export function ThankYou({ name }: ThankYouProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 text-center"
      style={{
        background: `radial-gradient(ellipse at 50% 0%,${G.purple}55 0%,transparent 60%),${G.navy}`,
      }}
    >
      <div className="max-w-[560px] animate-fadeUp">
        <div className="text-7xl mb-6 animate-float">🧬</div>

        <h1
          className="font-serif font-black text-3xl md:text-4xl mb-4 leading-tight"
          style={{ color: G.white }}
        >
          Seu <span style={{ color: G.gold }}>DNA Profissional</span>
          <br />
          foi concluído!
        </h1>

        <div
          className="rounded-2xl p-7 my-7 backdrop-blur-lg text-left"
          style={{
            background: "rgba(26,32,53,.7)",
            border: `1px solid rgba(201,168,76,.2)`,
          }}
        >
          <p className="text-base leading-relaxed" style={{ color: "#D1D5EF" }}>
            Obrigado, <strong style={{ color: G.gold }}>{name}</strong>! 😊
          </p>
          <p className="text-base leading-relaxed mt-4" style={{ color: "#D1D5EF" }}>
            Esse teste vai além de mostrar áreas que combinam com você. Ele revela como você pensa, age e onde naturalmente brilha. A clareza sobre o seu perfil é o primeiro passo para tomar decisões mais alinhadas com quem você realmente é.
          </p>
          <p className="text-base leading-relaxed mt-4" style={{ color: "#D1D5EF" }}>
            Em até <strong style={{ color: G.gold }}>1 dia útil</strong>, um consultor especializado vai entrar em contato com você para apresentar seu resultado completo e ajudar você a entender o que ele significa na prática.
          </p>
          <p className="text-base leading-relaxed mt-4 font-semibold" style={{ color: G.goldLight }}>
            Fique atento(a) ao seu celular — sua análise personalizada está a caminho.
          </p>
        </div>

        <div
          className="mt-8 p-5 rounded-xl"
          style={{
            background: `${G.gold}11`,
            border: `1px solid ${G.gold}33`,
          }}
        >
          <div className="text-xs tracking-[0.2em] font-bold mb-1" style={{ color: G.goldLight }}>
            DNA PROFISSIONAL
          </div>
          <div className="text-xs" style={{ color: G.gray }}>
            Mais clareza. Mais direção. Mais você no seu futuro.
          </div>
        </div>
      </div>
    </div>
  )
}
