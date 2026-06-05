// ─── PALETTE ────────────────────────────────────────────────
export const G = {
  navy: "#0B0E1A",
  navyMid: "#111527",
  navyLight: "#1A2035",
  purple: "#2D1F5E",
  purpleVib: "#5B3FA6",
  gold: "#C9A84C",
  goldLight: "#E2C97E",
  white: "#F5F7FF",
  gray: "#8B93B0",
  grayDark: "#3A3F58",
}

export type ProfileKey = "A" | "B" | "C" | "D" | "E"

// ─── 24 PERGUNTAS ───────────────────────────────────────────────────────
export const QUESTIONS = [
  {
    q: "No dia a dia, as pessoas costumam te ver como alguém que:",
    opts: [
      { l: "A", t: "Toma a frente e resolve as coisas." },
      { l: "B", t: "Anima o ambiente e conversa com todos." },
      { l: "C", t: "Pensa antes de agir e analisa tudo." },
      { l: "D", t: "Acolhe e cuida das pessoas." },
      { l: "E", t: "Coloca a mão na massa e faz acontecer." },
    ],
  },
  {
    q: "Em grupo de amigos ou família, você costuma ser a pessoa que:",
    opts: [
      { l: "A", t: "Organiza ou decide as coisas." },
      { l: "B", t: "Faz todo mundo conversar e rir." },
      { l: "C", t: "Observa mais antes de falar." },
      { l: "D", t: "Escuta e aconselha." },
      { l: "E", t: "Resolve as coisas práticas." },
    ],
  },
  {
    q: "Quando você vai numa loja ou resolver algo, normalmente você:",
    opts: [
      { l: "A", t: "Já vai direto ao ponto." },
      { l: "B", t: "Conversa com todo mundo." },
      { l: "C", t: "Observa tudo antes de decidir." },
      { l: "D", t: "Presta atenção no jeito que as pessoas te tratam." },
      { l: "E", t: "Resolve rápido e vai embora." },
    ],
  },
  {
    q: "Quando alguém te conta um problema, sua primeira reação costuma ser:",
    opts: [
      { l: "A", t: "Pensar no que fazer para resolver." },
      { l: "B", t: "Conversar e tentar animar a pessoa." },
      { l: "C", t: "Entender exatamente o que aconteceu." },
      { l: "D", t: "Sentir a dor da pessoa junto com ela." },
      { l: "E", t: "Procurar uma solução prática rapidamente." },
    ],
  },
  {
    q: "Quando precisa aprender algo novo, você normalmente:",
    opts: [
      { l: "A", t: "Já tenta fazer sozinho(a)." },
      { l: "B", t: "Aprende conversando com alguém." },
      { l: "C", t: "Pesquisa bastante antes." },
      { l: "D", t: "Precisa sentir conexão com aquilo." },
      { l: "E", t: "Aprende fazendo na prática." },
    ],
  },
  {
    q: "O que mais costuma te cansar?",
    opts: [
      { l: "A", t: "Pessoas enroladas." },
      { l: "B", t: "Ambientes muito quietos." },
      { l: "C", t: "Falta de organização." },
      { l: "D", t: "Gente sem empatia." },
      { l: "E", t: "Ficar parado(a) muito tempo." },
    ],
  },
  {
    q: "Quando você chega em um ambiente novo:",
    opts: [
      { l: "A", t: "Já vai tentando entender quem decide as coisas." },
      { l: "B", t: "Rapidinho já está conversando com as pessoas." },
      { l: "C", t: "Observa bastante antes de se soltar." },
      { l: "D", t: "Tenta sentir como é o clima do lugar." },
      { l: "E", t: "Vai aprendendo conforme as coisas acontecem." },
    ],
  },
  {
    q: "Quando você gosta de uma ideia nova, normalmente:",
    opts: [
      { l: "A", t: "Já pensa em como fazer acontecer." },
      { l: "B", t: "Conta para todo mundo e contagia as pessoas." },
      { l: "C", t: "Analisa todos os detalhes antes." },
      { l: "D", t: "Pensa em como aquilo pode ajudar alguém." },
      { l: "E", t: "Já começa a colocar em prática." },
    ],
  },
  {
    q: "Em uma situação de pressão, você costuma:",
    opts: [
      { l: "A", t: "Tomar o controle e decidir rápido." },
      { l: "B", t: "Conversar com alguém para aliviar a tensão." },
      { l: "C", t: "Pensar com calma antes de agir." },
      { l: "D", t: "Cuidar de quem está mais nervoso." },
      { l: "E", t: "Agir rápido para resolver logo." },
    ],
  },
  {
    q: "Como você gosta de receber um feedback?",
    opts: [
      { l: "A", t: "Direto e objetivo." },
      { l: "B", t: "Com leveza e bom humor." },
      { l: "C", t: "Com clareza e dados que comprovem." },
      { l: "D", t: "Com empatia e cuidado." },
      { l: "E", t: "Rápido, para já aplicar." },
    ],
  },
  {
    q: "Quando precisa tomar uma decisão importante, normalmente você:",
    opts: [
      { l: "A", t: "Gosta de decidir logo e resolver." },
      { l: "B", t: "Conversa com outras pessoas antes." },
      { l: "C", t: "Pensa bastante antes de escolher." },
      { l: "D", t: "Tenta sentir se aquilo realmente faz sentido." },
      { l: "E", t: "Vai resolvendo conforme as coisas acontecem." },
    ],
  },
  {
    q: "O que normalmente faz você perder o interesse em algo?",
    opts: [
      { l: "A", t: "Falta de crescimento." },
      { l: "B", t: "Ambientes sem pessoas ou interação." },
      { l: "C", t: "Bagunça ou falta de lógica." },
      { l: "D", t: "Falta de propósito ou conexão." },
      { l: "E", t: "Muita teoria e pouca prática." },
    ],
  },
  {
    q: "Quando alguém pede sua ajuda, você normalmente:",
    opts: [
      { l: "A", t: "Já tenta resolver pela pessoa." },
      { l: "B", t: "Conversa e tenta motivar." },
      { l: "C", t: "Analisa a situação antes." },
      { l: "D", t: "Escuta com atenção e compreensão." },
      { l: "E", t: "Mostra uma solução prática." },
    ],
  },
  {
    q: "Como você reage diante de uma mudança inesperada?",
    opts: [
      { l: "A", t: "Encara como desafio e parte para a ação." },
      { l: "B", t: "Compartilha com alguém para entender o que sente." },
      { l: "C", t: "Para, analisa e planeja." },
      { l: "D", t: "Pensa em como aquilo afeta as pessoas." },
      { l: "E", t: "Adapta-se rapidamente e segue em frente." },
    ],
  },
  {
    q: "Em um trabalho em equipe, você normalmente:",
    opts: [
      { l: "A", t: "Assume a liderança naturalmente." },
      { l: "B", t: "Mantém o grupo unido e motivado." },
      { l: "C", t: "Organiza as ideias e os processos." },
      { l: "D", t: "Cuida do clima e das relações." },
      { l: "E", t: "Coloca a mão na massa e executa." },
    ],
  },
  {
    q: "Qual dessas frases mais parece com você?",
    opts: [
      { l: "A", t: "“Se ninguém resolver, eu resolvo.”" },
      { l: "B", t: "“Gosto de conversar e trocar ideias.”" },
      { l: "C", t: "“Prefiro pensar bem antes de decidir.”" },
      { l: "D", t: "“Preciso sentir que faz sentido para mim.”" },
      { l: "E", t: "“Aprendo muito mais na prática.”" },
    ],
  },
  {
    q: "Em ambientes de trabalho ou estudo, você normalmente:",
    opts: [
      { l: "A", t: "Assume liderança naturalmente." },
      { l: "B", t: "Faz amizade fácil." },
      { l: "C", t: "Observa bastante antes de agir." },
      { l: "D", t: "Se preocupa com o clima entre as pessoas." },
      { l: "E", t: "Aprende rápido fazendo as tarefas." },
    ],
  },
  {
    q: "O que normalmente te motiva mais?",
    opts: [
      { l: "A", t: "Crescer e conquistar espaço." },
      { l: "B", t: "Reconhecimento e conexão com pessoas." },
      { l: "C", t: "Segurança e planejamento." },
      { l: "D", t: "Sentir que está ajudando alguém." },
      { l: "E", t: "Ver resultado rápido acontecendo." },
    ],
  },
  {
    q: "Quando você está aprendendo algo novo, o que mais te ajuda?",
    opts: [
      { l: "A", t: "Ter autonomia." },
      { l: "B", t: "Conversar e trocar experiências." },
      { l: "C", t: "Entender bem todos os detalhes." },
      { l: "D", t: "Sentir conexão com aquilo." },
      { l: "E", t: "Colocar em prática rapidamente." },
    ],
  },
  {
    q: "Qual dessas situações mais combina com você?",
    opts: [
      { l: "A", t: "Resolver problemas e assumir responsabilidades." },
      { l: "B", t: "Estar cercado(a) de pessoas." },
      { l: "C", t: "Observar detalhes antes de agir." },
      { l: "D", t: "Ajudar e acolher pessoas." },
      { l: "E", t: "Fazer acontecer na prática." },
    ],
  },
  {
    q: "Quando alguém elogia você, normalmente é por:",
    opts: [
      { l: "A", t: "Ser decidido(a) e resolver as coisas." },
      { l: "B", t: "Ser comunicativo(a) e divertido(a)." },
      { l: "C", t: "Ser inteligente e observador(a)." },
      { l: "D", t: "Ser compreensivo(a) e acolhedor(a)." },
      { l: "E", t: "Ser prático(a) e ágil." },
    ],
  },
  {
    q: "Quando você pensa em mudar de vida profissionalmente, normalmente você:",
    opts: [
      { l: "A", t: "Pensa em crescimento e independência." },
      { l: "B", t: "Imagina novas possibilidades e experiências." },
      { l: "C", t: "Analisa muito antes de tomar qualquer decisão." },
      { l: "D", t: "Busca algo que realmente faça sentido para você." },
      { l: "E", t: "Sente vontade de começar logo e aprender no caminho." },
    ],
  },
  {
    q: "Qual dessas frases mais combina com seu jeito?",
    opts: [
      { l: "A", t: "“Gosto de sentir que estou evoluindo.”" },
      { l: "B", t: "“Ambientes leves e pessoas fazem diferença para mim.”" },
      { l: "C", t: "“Prefiro analisar antes de decidir.”" },
      { l: "D", t: "“Preciso sentir conexão no que faço.”" },
      { l: "E", t: "“Aprendo muito mais fazendo.”" },
    ],
  },
  {
    q: "Hoje, o que você mais procura para sua vida?",
    opts: [
      { l: "A", t: "Crescimento e realização profissional." },
      { l: "B", t: "Motivação e novas possibilidades." },
      { l: "C", t: "Segurança e direção." },
      { l: "D", t: "Propósito e identificação." },
      { l: "E", t: "Mudança e ação." },
    ],
  },
]

// ─── PROFILES (compatibilidade + detalhes expandidos) ─────────────────────
export const PROFILES: Record<string, {
  name: string
  subtitle: string
  tagline: string
  color: string
  icon: string
  desc: string
  strong: string[]
  attention: string[]
  block: string
  areas: string[]
  courses: string[]
  final: string
  // Detalhes expandidos para o PDF
  whoYouAre: string
  howYouFunction: string[]
  dailyAnalogy: string
  howYouAct: string[]
  howYouDecide: string[]
  whatMotivates: string[]
  whatDrains: string[]
  reflection: string
  idealEnvironment: string[]
  compatibilityAreas: { name: string; pct: number }[]
  superPowers: string[]
  visualization: string[]
  // ── Tema visual exclusivo por perfil (para diferenciar relatórios) ──
  theme: {
    primary: string       // cor de destaque do perfil
    primaryLight: string  // tom claro para gradiente
    primaryDark: string   // tom escuro de fundo
    accent: string        // cor secundária de apoio
    coverEmoji: string    // emoji da capa
    coverWord: string     // palavra-chave (ex: "LIDERANÇA")
    coverNumber: string   // ex: "PERFIL 01"
  }
  // ── Salários de mercado (faixas baseadas em pesquisa Brasil 2024/25) ──
  salaries: { role: string; min: number; max: number; note?: string }[]
  topSalary: number  // salário máximo destacado (para chamada final)
}> = {
  A: {
    name: "LÍDER E EXECUTOR",
    subtitle: "Você decide, age e transforma resultados",
    tagline: "Você nasceu para liderar pessoas, decisões e construir grandes resultados.",
    color: "#E2C97E",
    icon: "🏆",
    desc: "Sabe aquela pessoa que quando entra numa sala, todo mundo percebe? Que mesmo sem pedir, acaba sendo quem organiza o grupo e define os próximos passos? Esse é você.",
    strong: ["Iniciativa natural", "Visão de crescimento", "Tomada de decisão", "Responsabilidade", "Pensamento estratégico", "Coragem", "Foco em resultado", "Liderança"],
    attention: ["Pode ser impaciente com quem tem ritmo diferente", "Tende a assumir mais do que consegue entregar", "Dificuldade em delegar tarefas importantes", "Pode ignorar detalhes importantes", "Pode pressionar quem está ao redor"],
    block: "Talvez você se frustre facilmente quando sente que está parado(a) ou sem crescimento, porque seu perfil naturalmente busca evolução e protagonismo.",
    areas: ["Liderança e Gestão", "Empreendedorismo", "Vendas Estratégicas", "Estratégia de Negócios", "Gestão de Pessoas"],
    courses: ["Administração", "Gestão Comercial", "Gestão Financeira", "Processos Gerenciais", "Marketing"],
    final: "Você nasceu para liderar. Quando se posiciona com clareza e propósito, transforma ambientes, pessoas e resultados. Acredite na sua capacidade de fazer acontecer!",
    whoYouAre: "Pessoas com perfil líder normalmente possuem facilidade em assumir o comando, decidir com agilidade e transformar ideias em resultados concretos.",
    howYouFunction: [
      "Você assume responsabilidade com naturalidade.",
      "Resolve problemas com objetividade e foco.",
      "Tem energia para crescer e conquistar espaço.",
      "Influencia pessoas pela ação, não apenas pelas palavras.",
    ],
    dailyAnalogy: "Sabe aquela pessoa que entra em um ambiente desorganizado e em poucos minutos já está organizando tudo? Perfis líderes funcionam exatamente assim.",
    howYouAct: [
      "Gosta de ambientes com desafio e movimento.",
      "Sente necessidade de evoluir constantemente.",
      "Costuma assumir o comando das situações.",
      "Tende a se posicionar com clareza e firmeza.",
      "Gosta de ver resultado e crescimento.",
    ],
    howYouDecide: [
      "Decide rápido e parte para a ação.",
      "Analisa o impacto e o retorno.",
      "Tende a confiar na própria intuição.",
      "Precisa de autonomia para se manter motivado(a).",
    ],
    whatMotivates: ["Crescimento e conquista", "Reconhecimento profissional", "Independência e autonomia", "Desafios e responsabilidades", "Resultado e performance"],
    whatDrains: ["Pessoas enroladas e indecisas", "Falta de objetivo claro", "Ambientes engessados", "Excesso de regras sem sentido", "Tarefas sem propósito de crescimento"],
    reflection: "Talvez você nunca tenha tido dificuldade em aprender, apenas nunca conseguiu se enxergar verdadeiramente em áreas que não combinam com seu perfil de liderança.",
    idealEnvironment: ["Com desafios", "Com autonomia", "Com crescimento", "Com responsabilidade", "Com possibilidade de liderar"],
    compatibilityAreas: [
      { name: "Liderança e Gestão", pct: 97 },
      { name: "Empreendedorismo", pct: 95 },
      { name: "Vendas e Negociação", pct: 92 },
      { name: "Estratégia de Negócios", pct: 90 },
      { name: "Gestão de Pessoas", pct: 87 },
    ],
    superPowers: ["DECISÃO", "FOCO", "AÇÃO", "LIDERANÇA", "CORAGEM"],
    visualization: ["Liderando equipes e projetos", "Crescendo profissionalmente", "Sendo reconhecido(a) pelo que entrega", "Construindo algo seu"],
    theme: {
      primary: "#C9A84C",
      primaryLight: "#E2C97E",
      primaryDark: "#7A6428",
      accent: "#1A2035",
      coverEmoji: "👑",
      coverWord: "LIDERANÇA",
      coverNumber: "PERFIL 01",
    },
    salaries: [
      { role: "Diretor(a) Executivo(a) / CEO", min: 18000, max: 50000, note: "com experiência consolidada" },
      { role: "Gerente Comercial / de Vendas", min: 9000, max: 22000 },
      { role: "Gestor(a) Financeiro(a)", min: 8000, max: 18000 },
      { role: "Empreendedor(a) / Sócio(a) de Negócio", min: 6000, max: 40000, note: "varia conforme empresa" },
      { role: "Coordenador(a) de Operações", min: 7000, max: 14000 },
    ],
    topSalary: 25000,
  },
  B: {
    name: "COMUNICADOR E INFLUENTE",
    subtitle: "Você conecta, inspira e transforma ideias em movimento",
    tagline: "Você tem facilidade em se conectar, influenciar pessoas e transformar conversas em oportunidades.",
    color: "#C084FC",
    icon: "💬",
    desc: "Sabe aquela pessoa que chega em um ambiente novo e em pouco tempo já está conversando com todo mundo? Que transforma qualquer conversa em uma oportunidade de conexão? Esse é você.",
    strong: ["Comunicação", "Influência", "Facilidade em relacionamento", "Criatividade", "Energia e entusiasmo", "Adaptação social", "Visão de oportunidades", "Carisma natural"],
    attention: ["Pode perder interesse rapidamente em ambientes muito parados", "Pode começar várias coisas ao mesmo tempo", "Pode agir antes de pensar em todos os detalhes", "Pode sentir dificuldade em manter foco em tarefas repetitivas", "Pode querer abraçar mais do que consegue entregar"],
    block: "Talvez algumas áreas nunca tenham despertado seu interesse porque seu perfil precisa de movimento, pessoas e conexão para se sentir motivado(a).",
    areas: ["Comunicação e Marketing", "Relacionamento e Vendas", "Gestão de Pessoas", "Criatividade e Produção", "Educação e Treinamento"],
    courses: ["Marketing", "Gestão Comercial", "Administração", "Recursos Humanos", "Processos Gerenciais"],
    final: "Seu propósito é deixar marcas positivas por onde passa. Acredite no seu potencial, confie na sua voz e siga em frente. O sucesso é consequência de quem se comunica, se conecta e se posiciona com coragem. Você nasceu para isso!",
    whoYouAre: "Pessoas com perfil comunicador normalmente possuem facilidade em criar conexão, influenciar ambientes e se sentir motivadas através de pessoas, movimento e crescimento.",
    howYouFunction: [
      "Você se expressa com facilidade e tem carisma natural.",
      "Cria conexão rapidamente e gosta de ambientes dinâmicos e interativos.",
      "Se motiva com novos desafios e com a possibilidade de crescimento.",
      "Tem energia, entusiasmo e costuma influenciar ambientes naturalmente.",
    ],
    dailyAnalogy: "Sabe aquela pessoa que chega em um ambiente novo e em pouco tempo já está conversando com todo mundo? Perfis comunicadores funcionam exatamente assim.",
    howYouAct: [
      "Gosta de ambientes mais leves, com movimento e troca de ideias.",
      "Sente necessidade de novidade e evolução constante.",
      "Costuma influenciar pessoas e situações de forma natural.",
      "Tende a se expressar com facilidade e clareza.",
      "Gosta de sentir que está fazendo a diferença e gerando impacto.",
    ],
    howYouDecide: [
      "Gosta de visualizar possibilidades e futuros.",
      "Se motiva quando consegue enxergar crescimento.",
      "Tende a agir pela empolgação e identificação.",
      "Precisa sentir entusiasmo para permanecer motivado(a) em algo.",
    ],
    whatMotivates: ["Crescimento e evolução", "Reconhecimento", "Conexão humana", "Ambientes leves e colaborativos", "Desafios e novas oportunidades", "Movimento e dinamismo"],
    whatDrains: ["Ambientes muito repetitivos", "Falta de crescimento", "Rotina extremamente parada", "Lugares sem interação com pessoas", "Tarefas muito isoladas ou burocráticas"],
    reflection: "Talvez você nunca tenha tido dificuldade em aprender, apenas nunca conseguiu se enxergar verdadeiramente em áreas que não combinam com seu jeito de funcionar.",
    idealEnvironment: ["Com pessoas", "Com troca", "Com crescimento", "Com desafios", "Com liberdade para se expressar"],
    compatibilityAreas: [
      { name: "Comunicação e Marketing", pct: 97 },
      { name: "Relacionamento e Vendas", pct: 95 },
      { name: "Gestão de Pessoas", pct: 93 },
      { name: "Criatividade e Produção", pct: 91 },
      { name: "Educação e Treinamento", pct: 88 },
    ],
    superPowers: ["COMUNICAÇÃO", "INFLUÊNCIA", "CRIATIVIDADE", "PROPÓSITO", "LIDERANÇA"],
    visualization: ["Trabalhando com o que te motiva", "Crescendo e sendo reconhecido(a)", "Gerando impacto através de pessoas", "Vivendo propósito e realização"],
    theme: {
      primary: "#A78BFA",
      primaryLight: "#C4B5FD",
      primaryDark: "#5B3FA6",
      accent: "#FBBF24",
      coverEmoji: "💬",
      coverWord: "COMUNICAÇÃO",
      coverNumber: "PERFIL 02",
    },
    salaries: [
      { role: "Diretor(a) de Marketing", min: 15000, max: 35000 },
      { role: "Gerente Comercial / Account Manager", min: 8000, max: 20000 },
      { role: "Especialista em Marketing Digital", min: 6000, max: 15000 },
      { role: "Consultor(a) de Vendas Senior", min: 5000, max: 18000, note: "com comissão" },
      { role: "Gerente de RH / Business Partner", min: 8000, max: 16000 },
    ],
    topSalary: 20000,
  },
  C: {
    name: "ESTRATÉGICO E ANALÍTICO",
    subtitle: "Você observa, analisa e decide com precisão",
    tagline: "Você enxerga o que outros não veem e decide com inteligência e clareza.",
    color: "#60A5FA",
    icon: "🧠",
    desc: "Sabe aquela pessoa que, antes de opinar, já pensou em cada cenário possível? Que quando fala, tudo que diz faz sentido e está embasado? Que raramente erra porque raramente age sem pensar? Esse é você.",
    strong: ["Raciocínio analítico", "Atenção aos detalhes", "Planejamento", "Disciplina", "Profundidade técnica", "Organização", "Pensamento crítico", "Visão de longo prazo"],
    attention: ["Pode demorar para tomar decisões", "Pode parecer distante ou reservado(a)", "Pode travar diante do excesso de análise", "Pode ter dificuldade em improvisar", "Pode evitar exposição em público"],
    block: "Talvez você demore para tomar algumas decisões importantes porque, no fundo, sempre quis ter certeza de que estava escolhendo o caminho certo.",
    areas: ["Análise e Inteligência de Dados", "Gestão Financeira", "Tecnologia e Sistemas", "Planejamento e Logística", "Auditoria e Controle"],
    courses: ["Ciências Contábeis", "Gestão Financeira", "Análise e Desenvolvimento de Sistemas", "Logística", "Processos Gerenciais"],
    final: "Você é do tipo que precisa entender o mapa antes de sair andando. E quando entende, executa com uma precisão que poucos conseguem. Áreas que exigem análise, dados e planejamento são onde você vai brilhar de verdade.",
    whoYouAre: "Pessoas com perfil analítico normalmente possuem facilidade em observar, planejar e tomar decisões com base em lógica, dados e estratégia.",
    howYouFunction: [
      "Você analisa antes de agir e enxerga detalhes que outros não veem.",
      "Toma decisões com base em raciocínio e clareza.",
      "Gosta de ambientes organizados e processos bem definidos.",
      "Tem profundidade de pensamento e atenção aos detalhes.",
    ],
    dailyAnalogy: "Sabe aquela pessoa que antes de comprar algo, pesquisa, compara e analisa tudo? Perfis analíticos funcionam exatamente assim.",
    howYouAct: [
      "Gosta de ambientes organizados e silenciosos.",
      "Sente necessidade de entender o porquê das coisas.",
      "Costuma observar antes de se posicionar.",
      "Tende a planejar antes de executar.",
      "Gosta de qualidade, profundidade e precisão.",
    ],
    howYouDecide: [
      "Decide com base em dados e análise.",
      "Pensa antes de agir.",
      "Avalia riscos e cenários.",
      "Precisa de tempo para refletir.",
    ],
    whatMotivates: ["Conhecimento e domínio técnico", "Segurança e estabilidade", "Ambientes organizados", "Reconhecimento pela competência", "Resultados consistentes"],
    whatDrains: ["Bagunça e falta de organização", "Decisões precipitadas", "Ambientes muito barulhentos", "Pressão para improvisar", "Falta de lógica nas situações"],
    reflection: "Talvez você nunca tenha tido dificuldade em aprender, apenas nunca conseguiu se enxergar em áreas que exigem improviso constante e pouca profundidade.",
    idealEnvironment: ["Com organização", "Com clareza", "Com dados", "Com processos", "Com profundidade"],
    compatibilityAreas: [
      { name: "Análise e Dados", pct: 97 },
      { name: "Gestão Financeira", pct: 95 },
      { name: "Tecnologia e Sistemas", pct: 93 },
      { name: "Planejamento e Logística", pct: 91 },
      { name: "Auditoria e Controle", pct: 88 },
    ],
    superPowers: ["ANÁLISE", "PRECISÃO", "ESTRATÉGIA", "DISCIPLINA", "PROFUNDIDADE"],
    visualization: ["Trabalhando com dados e estratégia", "Sendo referência técnica", "Crescendo de forma sólida", "Tomando decisões importantes"],
    theme: {
      primary: "#3B82F6",
      primaryLight: "#60A5FA",
      primaryDark: "#1E3A8A",
      accent: "#06B6D4",
      coverEmoji: "🧠",
      coverWord: "ESTRATÉGIA",
      coverNumber: "PERFIL 03",
    },
    salaries: [
      { role: "Analista de Dados / BI Senior", min: 8000, max: 18000 },
      { role: "Controller / Analista Financeiro", min: 9000, max: 20000 },
      { role: "Auditor(a) / Contador(a)", min: 7000, max: 16000 },
      { role: "Desenvolvedor(a) Full Stack", min: 7000, max: 22000 },
      { role: "Gestor(a) de Logística / Supply Chain", min: 8000, max: 18000 },
    ],
    topSalary: 22000,
  },
  D: {
    name: "HUMANIZADO E DESENVOLVEDOR",
    subtitle: "Você acolhe, ensina e transforma vidas",
    tagline: "Você tem a habilidade rara de cuidar, ensinar e desenvolver pessoas com propósito.",
    color: "#34D399",
    icon: "❤️",
    desc: "Sabe aquela pessoa que quando entra numa sala, as pessoas se sentem mais leves? Que ouve de verdade, sem julgar, e sempre sabe o que dizer na hora certa? Que faz qualquer ambiente se sentir mais humano? Esse é você.",
    strong: ["Empatia", "Escuta ativa", "Acolhimento", "Ensino e desenvolvimento", "Sensibilidade", "Paciência", "Conexão humana", "Visão de pessoas"],
    attention: ["Pode se sobrecarregar tentando ajudar todos", "Pode ter dificuldade em dizer não", "Pode levar críticas para o lado pessoal", "Pode adiar decisões para evitar conflitos", "Pode esquecer de cuidar de si"],
    block: "Talvez você nunca tenha conseguido escolher uma área apenas pensando em dinheiro, porque no fundo precisa sentir conexão e propósito no que faz.",
    areas: ["Educação e Desenvolvimento", "Saúde e Bem-Estar", "Recursos Humanos", "Pedagogia e Ensino", "Aconselhamento"],
    courses: ["Pedagogia", "Psicopedagogia", "Recursos Humanos", "Nutrição", "Estética"],
    final: "Você não foi feito(a) para trabalhar apenas por salário. Você precisa sentir que o que você faz muda a vida de alguém. E quando está no lugar certo, a forma como você cuida das pessoas é algo que nenhum treinamento consegue ensinar.",
    whoYouAre: "Pessoas com perfil humanizado normalmente possuem facilidade em acolher, ensinar e desenvolver pessoas, transformando vidas através do cuidado e do propósito.",
    howYouFunction: [
      "Você se conecta com as pessoas com facilidade.",
      "Tem sensibilidade para perceber o que os outros sentem.",
      "Gosta de cuidar, ensinar e ajudar a evoluir.",
      "Busca propósito e significado no que faz.",
    ],
    dailyAnalogy: "Sabe aquela pessoa que sempre é procurada quando alguém precisa desabafar ou pedir conselho? Perfis humanizados funcionam exatamente assim.",
    howYouAct: [
      "Gosta de ambientes acolhedores e harmônicos.",
      "Sente necessidade de propósito e significado.",
      "Costuma cuidar do clima e das relações.",
      "Tende a escutar com atenção e empatia.",
      "Gosta de ver pessoas evoluindo.",
    ],
    howYouDecide: [
      "Decide com base em sentimento e propósito.",
      "Pensa no impacto nas pessoas.",
      "Avalia se faz sentido para si.",
      "Precisa sentir alinhamento de valores.",
    ],
    whatMotivates: ["Propósito e identificação", "Conexão humana", "Ajudar pessoas a crescer", "Ambientes harmônicos", "Reconhecimento afetivo"],
    whatDrains: ["Pessoas sem empatia", "Ambientes hostis", "Conflitos constantes", "Falta de propósito", "Frieza nas relações"],
    reflection: "Talvez você nunca tenha tido dificuldade em aprender, apenas nunca conseguiu se enxergar em áreas frias, isoladas e sem propósito humano.",
    idealEnvironment: ["Com pessoas", "Com propósito", "Com harmonia", "Com cuidado", "Com possibilidade de ensinar"],
    compatibilityAreas: [
      { name: "Educação e Desenvolvimento", pct: 97 },
      { name: "Saúde e Bem-Estar", pct: 95 },
      { name: "Recursos Humanos", pct: 93 },
      { name: "Pedagogia e Ensino", pct: 91 },
      { name: "Psicologia e Aconselhamento", pct: 88 },
    ],
    superPowers: ["EMPATIA", "ACOLHIMENTO", "ENSINO", "PROPÓSITO", "TRANSFORMAÇÃO"],
    visualization: ["Cuidando e ensinando pessoas", "Vendo o impacto do seu trabalho", "Crescendo com propósito", "Construindo relações significativas"],
    theme: {
      primary: "#10B981",
      primaryLight: "#34D399",
      primaryDark: "#065F46",
      accent: "#F472B6",
      coverEmoji: "🌱",
      coverWord: "PROPÓSITO",
      coverNumber: "PERFIL 04",
    },
    salaries: [
      { role: "Coordenador(a) Pedagógico(a)", min: 6000, max: 14000 },
      { role: "Gerente de RH / People Partner", min: 8000, max: 18000 },
      { role: "Psicopedagogo(a) / Consultor(a)", min: 5000, max: 13000 },
      { role: "Nutricionista Clínico(a) / Esportivo(a)", min: 4500, max: 15000, note: "com clínica própria" },
      { role: "Especialista em Treinamento & Desenvolvimento", min: 7000, max: 16000 },
    ],
    topSalary: 18000,
  },
  E: {
    name: "PRÁTICO E EMPREENDEDOR",
    subtitle: "Você faz acontecer e gera resultado",
    tagline: "Você não fica parado(a). Quando vê uma oportunidade, age e faz acontecer.",
    color: "#FB923C",
    icon: "⚡",
    desc: "Sabe aquela pessoa que enquanto todo mundo está discutindo o que vai fazer, já foi lá e fez? Que aprende dez vezes mais tentando do que lendo? Que precisa de ação, resultado e movimento para se sentir vivo(a)? Esse é você.",
    strong: ["Execução", "Agilidade", "Adaptabilidade", "Resolução prática", "Visão de oportunidades", "Iniciativa", "Resiliência", "Espírito empreendedor"],
    attention: ["Pode pular etapas importantes", "Pode ter dificuldade com planejamento de longo prazo", "Pode se cansar de rotinas longas", "Pode agir antes de analisar", "Pode começar várias coisas e não terminar"],
    block: "Talvez ambientes muito teóricos ou repetitivos nunca tenham despertado seu melhor, porque você aprende muito mais vivendo e colocando as coisas em prática.",
    areas: ["Empreendedorismo", "Logística e Operações", "Esporte e Educação Física", "Estética e Beleza", "Saúde Técnica"],
    courses: ["Logística", "Educação Física", "Estética", "Radiologia", "Gestão Comercial"],
    final: "Você aprende fazendo. E isso é um talento, não uma limitação. Em um mundo que valoriza cada vez mais quem resolve e executa, seu perfil é exatamente o que as melhores empresas estão procurando.",
    whoYouAre: "Pessoas com perfil prático e empreendedor normalmente possuem facilidade em executar, adaptar-se e gerar resultados concretos com agilidade.",
    howYouFunction: [
      "Você não fica parado(a). Quando vê uma oportunidade, age.",
      "Aprende fazendo e testa na prática.",
      "Adapta-se rápido a mudanças e imprevistos.",
      "Gosta de ver resultado de forma rápida e tangível.",
    ],
    dailyAnalogy: "Sabe aquela pessoa que, quando vê um problema, já vai resolvendo sem esperar instrução? Perfis práticos funcionam exatamente assim.",
    howYouAct: [
      "Gosta de ambientes com movimento e ação.",
      "Sente necessidade de ver resultado rápido.",
      "Costuma colocar a mão na massa.",
      "Tende a aprender fazendo.",
      "Gosta de mudança e variedade.",
    ],
    howYouDecide: [
      "Decide rápido e ajusta no caminho.",
      "Confia na experiência prática.",
      "Avalia o que funciona ou não com base nos resultados.",
      "Precisa de liberdade para agir.",
    ],
    whatMotivates: ["Ação e resultado rápido", "Liberdade e variedade", "Aprender fazendo", "Empreender e construir", "Movimento constante"],
    whatDrains: ["Reuniões longas e teóricas", "Ficar parado(a) muito tempo", "Excesso de burocracia", "Ambientes engessados", "Falta de ação prática"],
    reflection: "Talvez você nunca tenha tido dificuldade em aprender, apenas nunca conseguiu se enxergar em áreas teóricas demais, sem prática e sem movimento.",
    idealEnvironment: ["Com ação", "Com liberdade", "Com variedade", "Com prática", "Com resultado visível"],
    compatibilityAreas: [
      { name: "Empreendedorismo", pct: 97 },
      { name: "Logística e Operações", pct: 95 },
      { name: "Esporte e Educação Física", pct: 93 },
      { name: "Estética e Beleza", pct: 91 },
      { name: "Saúde Técnica", pct: 88 },
    ],
    superPowers: ["AÇÃO", "AGILIDADE", "ADAPTAÇÃO", "EXECUÇÃO", "INICIATIVA"],
    visualization: ["Empreendendo ou liderando operações", "Vendo resultado do seu esforço", "Crescendo com autonomia", "Construindo algo seu"],
    theme: {
      primary: "#F97316",
      primaryLight: "#FB923C",
      primaryDark: "#9A3412",
      accent: "#EAB308",
      coverEmoji: "⚡",
      coverWord: "EXECUÇÃO",
      coverNumber: "PERFIL 05",
    },
    salaries: [
      { role: "Empreendedor(a) / Dono(a) de Negócio", min: 6000, max: 50000, note: "potencial ilimitado" },
      { role: "Gerente de Operações / Logística", min: 8000, max: 18000 },
      { role: "Personal Trainer / Coach Esportivo", min: 4000, max: 18000, note: "com clientes premium" },
      { role: "Esteticista / Dono(a) de Estúdio", min: 5000, max: 20000 },
      { role: "Técnico(a) Senior em Radiologia / Saúde", min: 6000, max: 12000 },
    ],
    topSalary: 18000,
  },
}

// ─── 5 CURSOS POR PERFIL (cobre todos os cursos da faculdade) ─────────────
export const COURSES_BY_PROFILE: Record<ProfileKey, {
  name: string
  pct: number
  description: string
  areas: string[]
  idealFor: string
  image: string
}[]> = {
  A: [
    {
      name: "ADMINISTRAÇÃO",
      pct: 97,
      description: "Seu perfil demonstra liderança, tomada de decisão e visão estratégica.",
      areas: ["Liderança de equipes", "Planejamento estratégico", "Gestão de processos", "Tomada de decisão", "Empreendedorismo"],
      idealFor: "Quem gosta de liderar, decidir e construir resultado.",
      image: "/professional-business-leader-meeting.jpg",
    },
    {
      name: "GESTÃO COMERCIAL",
      pct: 95,
      description: "Você possui facilidade em negociação, influência e foco em resultado.",
      areas: ["Vendas e negociação", "Estratégias comerciais", "Liderança de vendas", "Expansão de negócios", "Relacionamento estratégico"],
      idealFor: "Quem gosta de metas, desafios e gerar impacto através de negócios.",
      image: "/business-handshake-deal.png",
    },
    {
      name: "GESTÃO FINANCEIRA",
      pct: 93,
      description: "Seu perfil combina liderança com visão analítica de números.",
      areas: ["Análise financeira", "Controladoria", "Investimentos", "Gestão de capital", "Planejamento financeiro"],
      idealFor: "Quem busca crescer financeiramente e tomar decisões estratégicas.",
      image: "/financial-charts.png",
    },
    {
      name: "PROCESSOS GERENCIAIS",
      pct: 91,
      description: "Você tem perfil para liderar processos e otimizar resultados.",
      areas: ["Gestão de processos", "Liderança operacional", "Eficiência empresarial", "Supervisão de equipes", "Indicadores de performance"],
      idealFor: "Quem gosta de organizar, liderar e gerar resultado prático.",
      image: "/business-process-management.png",
    },
    {
      name: "MARKETING",
      pct: 88,
      description: "Você combina liderança com visão de mercado e posicionamento.",
      areas: ["Estratégia de marca", "Liderança de equipes", "Campanhas estratégicas", "Branding", "Posicionamento de mercado"],
      idealFor: "Quem quer liderar marcas e estratégias.",
      image: "/marketing-strategy-board.jpg",
    },
  ],
  B: [
    {
      name: "MARKETING",
      pct: 97,
      description: "Seu perfil demonstra criatividade, comunicação e forte capacidade de gerar conexão com pessoas.",
      areas: ["Marketing digital", "Publicidade", "Redes sociais", "Branding", "Produção de conteúdo", "Gestão de marca"],
      idealFor: "Quem gosta de criar, comunicar e transformar ideias em resultados.",
      image: "/marketing-creative-team.jpg",
    },
    {
      name: "GESTÃO COMERCIAL",
      pct: 95,
      description: "Você possui facilidade em relacionamento, influência e desenvolvimento de pessoas.",
      areas: ["Vendas", "Negociação", "Relacionamento com clientes", "Liderança de equipes", "Estratégias comerciais"],
      idealFor: "Quem gosta de metas, desafios e gerar impacto através de pessoas.",
      image: "/business-meeting-handshake.png",
    },
    {
      name: "ADMINISTRAÇÃO",
      pct: 93,
      description: "Seu perfil demonstra liderança, comunicação e facilidade em ambientes dinâmicos.",
      areas: ["Gestão de pessoas", "Processos", "Projetos", "Planejamento estratégico", "Empreendedorismo"],
      idealFor: "Quem gosta de pessoas, desafios e ver resultados acontecendo.",
      image: "/business-meeting.png",
    },
    {
      name: "RECURSOS HUMANOS",
      pct: 91,
      description: "Você demonstra forte conexão humana e facilidade em desenvolver pessoas.",
      areas: ["Recrutamento e seleção", "Treinamento e desenvolvimento", "Clima organizacional", "Cargos e salários", "Consultoria interna"],
      idealFor: "Quem gosta de pessoas, propósito e ajudar no crescimento de outros.",
      image: "/hr-people-development.jpg",
    },
    {
      name: "PROCESSOS GERENCIAIS",
      pct: 88,
      description: "Você combina comunicação com organização e visão de equipe.",
      areas: ["Liderança de processos", "Gestão de equipes", "Comunicação corporativa", "Planejamento", "Coordenação"],
      idealFor: "Quem gosta de coordenar pessoas e entregar resultados.",
      image: "/project-management-team.jpg",
    },
  ],
  C: [
    {
      name: "CIÊNCIAS CONTÁBEIS",
      pct: 97,
      description: "Seu perfil demonstra precisão, análise e profundidade técnica.",
      areas: ["Contabilidade", "Auditoria", "Perícia contábil", "Controladoria", "Tributação", "Análise financeira"],
      idealFor: "Quem gosta de números, lógica e organização.",
      image: "/accounting-spreadsheet-analysis.jpg",
    },
    {
      name: "GESTÃO FINANCEIRA",
      pct: 95,
      description: "Você possui facilidade em análise de dados e tomada de decisão estratégica.",
      areas: ["Análise financeira", "Investimentos", "Mercado de capitais", "Planejamento financeiro", "Gestão de riscos"],
      idealFor: "Quem gosta de estratégia, números e crescimento sólido.",
      image: "/financial-analysis-dashboard.png",
    },
    {
      name: "ANÁLISE E DESENVOLVIMENTO DE SISTEMAS",
      pct: 93,
      description: "Seu perfil combina lógica, raciocínio analítico e construção de soluções.",
      areas: ["Programação", "Análise de sistemas", "Banco de dados", "Engenharia de software", "Tecnologia"],
      idealFor: "Quem gosta de tecnologia, lógica e resolver problemas.",
      image: "/programmer-coding-on-computer.jpg",
    },
    {
      name: "LOGÍSTICA",
      pct: 91,
      description: "Você tem perfil para planejar, organizar e otimizar processos.",
      areas: ["Planejamento logístico", "Cadeia de suprimentos", "Distribuição", "Gestão de estoques", "Operações"],
      idealFor: "Quem gosta de organização, processos e eficiência.",
      image: "/logistics-warehouse-management.jpg",
    },
    {
      name: "PROCESSOS GERENCIAIS",
      pct: 88,
      description: "Você combina análise com gestão de processos e melhoria contínua.",
      areas: ["Mapeamento de processos", "Indicadores de performance", "Eficiência operacional", "Análise de dados", "Qualidade"],
      idealFor: "Quem gosta de estruturar e otimizar resultados.",
      image: "/process-flowchart-business.jpg",
    },
  ],
  D: [
    {
      name: "PEDAGOGIA",
      pct: 97,
      description: "Seu perfil demonstra empatia, paciência e dom para ensinar.",
      areas: ["Educação infantil", "Ensino fundamental", "Coordenação pedagógica", "Educação especial", "Gestão escolar"],
      idealFor: "Quem ama ensinar, cuidar e formar pessoas.",
      image: "/teacher-classroom-children.jpg",
    },
    {
      name: "PSICOPEDAGOGIA",
      pct: 95,
      description: "Você possui sensibilidade para entender pessoas e processos de aprendizagem.",
      areas: ["Diagnóstico de aprendizagem", "Atendimento clínico", "Apoio educacional", "Inclusão", "Desenvolvimento humano"],
      idealFor: "Quem quer transformar vidas através do desenvolvimento humano.",
      image: "/psychology-counseling-session.jpg",
    },
    {
      name: "RECURSOS HUMANOS",
      pct: 93,
      description: "Seu perfil combina cuidado com pessoas e desenvolvimento de talentos.",
      areas: ["Recrutamento e seleção", "Treinamento e desenvolvimento", "Clima organizacional", "Coaching", "Gestão humana"],
      idealFor: "Quem gosta de pessoas, propósito e crescimento humano.",
      image: "/hr-team-collaboration.jpg",
    },
    {
      name: "NUTRIÇÃO",
      pct: 91,
      description: "Você tem perfil acolhedor e dom para cuidar da saúde das pessoas.",
      areas: ["Nutrição clínica", "Nutrição esportiva", "Saúde pública", "Consultoria alimentar", "Educação nutricional"],
      idealFor: "Quem deseja cuidar do bem-estar e da saúde das pessoas.",
      image: "/nutritionist-healthy-food-consultation.jpg",
    },
    {
      name: "ESTÉTICA E COSMÉTICA",
      pct: 88,
      description: "Você combina cuidado com pessoas e atenção ao bem-estar.",
      areas: ["Tratamentos faciais", "Tratamentos corporais", "Bem-estar e autoestima", "Atendimento humanizado", "Cosmetologia"],
      idealFor: "Quem gosta de cuidar e elevar a autoestima das pessoas.",
      image: "/aesthetics-beauty-treatment.jpg",
    },
  ],
  E: [
    {
      name: "LOGÍSTICA",
      pct: 97,
      description: "Seu perfil demonstra agilidade, organização prática e foco em resultado.",
      areas: ["Operações logísticas", "Distribuição", "Cadeia de suprimentos", "Gestão de estoques", "Transportes"],
      idealFor: "Quem gosta de movimento, ação e fazer as coisas acontecerem.",
      image: "/logistics-truck-operations.jpg",
    },
    {
      name: "EDUCAÇÃO FÍSICA",
      pct: 95,
      description: "Você possui energia, motivação e facilidade em incentivar pessoas.",
      areas: ["Personal trainer", "Academias", "Treinamento esportivo", "Qualidade de vida", "Escolas e clubes"],
      idealFor: "Quem ama movimento, esporte e ajudar pessoas a evoluírem fisicamente.",
      image: "/personal-trainer-gym.jpg",
    },
    {
      name: "ESTÉTICA E COSMÉTICA",
      pct: 93,
      description: "Seu perfil combina ação prática com cuidado pessoal e empreendedorismo.",
      areas: ["Atendimento estético", "Tratamentos faciais e corporais", "Empreendedorismo na beleza", "Cosmetologia", "Bem-estar"],
      idealFor: "Quem quer empreender na área da beleza e do bem-estar.",
      image: "/beauty-spa-treatment.jpg",
    },
    {
      name: "RADIOLOGIA",
      pct: 91,
      description: "Você tem perfil prático e técnico para a área da saúde.",
      areas: ["Exames de imagem", "Tomografia", "Ressonância magnética", "Hospitais e clínicas", "Diagnóstico por imagem"],
      idealFor: "Quem gosta de tecnologia aplicada à saúde e ação prática.",
      image: "/radiology-imaging-technology.jpg",
    },
    {
      name: "GESTÃO COMERCIAL",
      pct: 88,
      description: "Você combina ação rápida com facilidade em vender e negociar.",
      areas: ["Vendas práticas", "Atendimento direto", "Empreendedorismo", "Relacionamento comercial", "Operações de venda"],
      idealFor: "Quem gosta de vender, negociar e ver resultado rápido.",
      image: "/sales-store-business.jpg",
    },
  ],
}

// ─── STATUS OPTIONS ────────────────────────────────────────────────────────
export const STATUS_OPTS = ["Aguardando teste", "Novo", "Em análise", "Resultado enviado", "Em atendimento", "Matriculado"]
export const STATUS_CLASS: Record<string, string> = {
  Novo: "s-new",
  "Em análise": "s-analysis",
  "Resultado enviado": "s-sent",
  "Em atendimento": "s-attending",
  Matriculado: "s-enrolled",
}

// ─── COURSES LIST ────────────────────────────────────────────────────────
export const COURSES = [
  "Administração",
  "Marketing",
  "Gestão Comercial",
  "Gestão Financeira",
  "Recursos Humanos",
  "Processos Gerenciais",
  "Ciências Contábeis",
  "Logística",
  "Análise e Desenvolvimento de Sistemas",
  "Pedagogia",
  "Psicopedagogia",
  "Nutrição",
  "Estética",
  "Educação Física",
  "Radiologia",
  "Outro",
]
