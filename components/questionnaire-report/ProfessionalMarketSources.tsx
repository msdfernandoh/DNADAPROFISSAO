/** Consultation fallback: no occupation, salary or open vacancy is inferred from a profile. */
export function ProfessionalMarketSources() {
  const sources = [
    { label: 'RAIS e Novo CAGED · Ministério do Trabalho', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho', detail: 'Consulte o período, a ocupação e o município. Remuneração média e salário de admissão são indicadores diferentes.' },
    { label: 'SINE-MT · SETASC', href: 'https://www.setasc.mt.gov.br/', detail: 'Procure o quadro de vagas e a unidade de Sinop, ou a cidade onde deseja trabalhar. Confirme a data e a disponibilidade no atendimento.' },
    { label: 'Prefeitura de Sinop · portal oficial', href: 'https://www.sinop.mt.gov.br/', detail: 'Consulte os editais de concursos e processos seletivos. Confira cargo, formação exigida, remuneração e prazo de inscrição no edital.' },
  ]
  return (
    <section aria-label="Consulta de mercado profissional" style={{ color: '#2A2F45', fontSize: 14, lineHeight: 1.6 }}>
      <p style={{ marginBottom: 20 }}>
        Escolha uma ocupação que queira conhecer e a cidade onde pretende trabalhar.
        Estas fontes ajudam a pesquisar atividades, oportunidades e remuneração.
        Ainda não há dados verificados de uma ocupação específica neste relatório.
      </p>
      {sources.map(source => (
        <div key={source.href} style={{ marginBottom: 18, padding: 16, background: '#FFFFFF', border: '1px solid #C9A84C', borderRadius: 12 }}>
          <a href={source.href} target="_blank" rel="noopener noreferrer" style={{ color: '#2D1F5E', fontWeight: 700, textDecoration: 'underline' }}>{source.label}</a>
          <p style={{ marginTop: 6 }}>{source.detail}</p>
          <p style={{ marginTop: 6, fontSize: 10, overflowWrap: 'anywhere', color: '#505973' }}>{source.href}</p>
        </div>
      ))}
      <p style={{ marginBottom: 14 }}>
        Ao comparar salários, registre fonte, período, localidade e jornada. Separe
        remuneração média, salário de admissão, piso profissional, valor anunciado
        em vaga e remuneração de edital.
      </p>
      <p style={{ fontSize: 12 }}>
        Admissões históricas não representam vagas disponíveis hoje. A possibilidade
        de concurso não significa edital aberto. O perfil do DNA não determina salário.
        Sua avaliação pode ser concluída sem essas consultas.
      </p>
    </section>
  )
}
