import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seu Resultado — DNA da Profissão',
  description:
    'Veja o resultado do seu teste de perfil profissional e pessoal. Entenda seu perfil dominante e descubra carreiras que combinam com você.',
  keywords: [
    'resultado teste vocacional',
    'perfil profissional',
    'DNA da Profissão',
    'orientação de carreira',
    'teste de carreira',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Seu Resultado — DNA da Profissão',
    description:
      'Resultado personalizado do teste de perfil profissional. Baixe ou compartilhe seu relatório.',
    url: 'https://dnadaprofissao.com.br/resultado',
    type: 'website',
    locale: 'pt_BR',
  },
  alternates: {
    canonical: 'https://dnadaprofissao.com.br/resultado',
  },
}

export default function ResultadoLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
