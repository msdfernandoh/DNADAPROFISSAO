import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Administração — DNA da Profissão',
  description: 'Painel interno de gestão de participantes e leads do DNA da Profissão.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
