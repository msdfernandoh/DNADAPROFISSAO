import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"]
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["700", "900"]
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dnadaprofissao.com.br'),
  title: 'DNA da Profissão — Descubra Qual Profissão Combina com Você',
  description:
    'Faça o teste de perfil profissional e pessoal gratuito. Descubra com clareza qual profissão tem mais a ver com seu jeito de ser. Para alunos, leads e quem está escolhendo sua carreira.',
  keywords: [
    'teste de perfil profissional',
    'qual profissão escolher',
    'orientação vocacional',
    'DNA profissional',
    'teste de carreira',
    'perfil pessoal',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'DNA da Profissão — Qual Profissão Combina com Você?',
    description:
      'Teste gratuito de perfil profissional e pessoal. Descubra com clareza qual carreira tem mais a ver com você.',
    url: 'https://dnadaprofissao.com.br/',
    type: 'website',
    locale: 'pt_BR',
  },
  alternates: {
    canonical: 'https://dnadaprofissao.com.br/',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-[#0B0E1A] text-[#F5F7FF]">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
