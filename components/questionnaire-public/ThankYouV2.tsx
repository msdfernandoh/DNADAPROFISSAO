"use client"

import { G } from "@/lib/dna-data"

type Props = {
  whatsappUrl?: string | null
  consultantLabel?: string | null
}

export function ThankYouV2({ whatsappUrl, consultantLabel }: Props) {
  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6 py-8">
      <div
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{ background: `${G.gold}22`, border: `2px solid ${G.gold}` }}
      >
        🧬
      </div>
      <h2 className="text-xl font-bold text-white leading-snug">
        Seu DNA foi identificado com sucesso.
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: G.gray }}>
        Agora nossa equipe vai liberar seu mapa personalizado.
      </p>
      {consultantLabel ? (
        <p className="text-xs" style={{ color: G.goldLight }}>
          {consultantLabel}
        </p>
      ) : null}
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-bold rounded-full py-3 px-6 text-sm"
          style={{
            background: "#25D366",
            color: "#fff",
          }}
        >
          Falar com meu consultor no WhatsApp
        </a>
      ) : null}
      <p className="text-xs" style={{ color: G.grayDark }}>
        Você receberá o retorno pelo contato informado no cadastro.
      </p>
    </div>
  )
}
