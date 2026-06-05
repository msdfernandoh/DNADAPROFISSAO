"use client"

import { G } from "@/lib/dna-data"

export function HelixIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <ellipse cx="18" cy="18" rx="17" ry="17" stroke={G.gold} strokeWidth="1.5" opacity=".3" />
      <path d="M12 10 C16 14,20 14,24 10" stroke={G.gold} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M12 18 C16 22,20 22,24 18" stroke={G.goldLight} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M12 26 C16 30,20 30,24 26" stroke={G.gold} strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="12" y1="10" x2="12" y2="26" stroke={G.gold} strokeWidth="1.5" opacity=".5" />
      <line x1="24" y1="10" x2="24" y2="26" stroke={G.gold} strokeWidth="1.5" opacity=".5" />
    </svg>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <HelixIcon />
      <div>
        <div className="font-serif font-black text-xl tracking-wide" style={{ color: G.gold }}>
          DNA PROFISSIONAL™
        </div>
        <div className="text-[9px] tracking-[3px] -mt-0.5" style={{ color: G.gray }}>
          SEU MAPA. SEU FUTURO.
        </div>
      </div>
    </div>
  )
}
