# Ranking automático de cursos — versão inicial provisória

Versão do algoritmo: dna-course-ranking-2026-10-29.v1. Matriz: dna-course-matrix-2026-10-29.v1.

Esta versão foi implementada por autorização explícita do proprietário para uma matriz inicial provisória. Não há homologação metodológica, estudo de validade preditiva ou calibração psicométrica declarados. “Publicado” significa disponível no sistema; não significa método cientificamente validado. O rótulo provisório aparece nos relatórios individual e comercial.

## Escopo e fontes

39 cursos de graduação conferidos contra `public.courses` em 29/10/2026. Os IDs e nomes cadastrados são preservados. Enfermagem está cadastrada como Técnico e fica fora deste ranking de graduação. Bacharelado e Licenciatura em Educação Física são graduações diferentes, não duplicações. Os aliases resolvem Gestão de TI, Recursos Humanos, Estética, Segurança Pública, Segurança Privada e Agronegócios sem criar registros novos.

A matriz associa tarefas e contextos de trabalho a cinco forças. As descrições recebidas no catálogo do projeto e os referenciais do MEC orientam a revisão das atividades; **nenhuma dessas fontes valida os pesos comportamentais propostos**. Os vetores, as associações de respostas, os coeficientes e as explicações são critérios editoriais provisórios, passíveis de revisão acadêmica/metodológica. Não foram encontrados os pesos de uma matriz original homologada que permitissem alegar sua recuperação integral.

Referências: catálogo recebido em `lib/questionnaire-engine/__fixtures__/individual/catalog.json`; MEC CNCST (https://cncst.mec.gov.br/); índice de diretrizes de graduação do MEC (https://portal.mec.gov.br/secretaria-de-regulacao-e-supervisao-da-educacao-superior-seres/323-secretarias-112877938/orgaos-vinculados-82187207/12991-diretrizes-curriculares-cursos-de-graduacao). As fontes e sua condição estão registradas na matriz; não se alega validação externa de cada linha ou oferta da unidade.

## Fórmula auditável

Para cada curso, o vetor W tem cinco valores inteiros entre 0 e 4: sem ênfase, contribuição secundária, frequente, central e definidora na descrição provisória de tarefas. Todos os cursos usam o mesmo denominador 4. Não se normaliza cada curso pelo seu próprio maior peso: isso favoreceria artificialmente vetores amplos de pesos médios.

1. **Distribuição (D):** soma, para cada força, de `(pontos da força / soma dos cinco pontos) × (peso do curso para a força / 4)`. Usa todos os pontos, inclusive a informação de zero. Intervalo 0–1.
2. **Par ordenado (P):** `(2 × peso da principal/4 + peso da secundária/4) / 3`. A ordem altera a contribuição; não há lista fixa de cursos por par. Todos os 20 cruzamentos são derivados do vetor e sua regra está exposta em `ranking-pair-matrix.json`. Em empate principal, usa a média das forças líderes, sem escolher uma vencedora. Em empate secundário, usa a média das segundas. Sem segunda força positiva, considera só o grupo líder. Zero nunca vira segunda força.
3. **Evidências (R):** quantidade de questões cujas tags de ação observada encontram ao menos uma tag de tarefa do curso, dividida por oito. As questões consideradas são Q02, Q06, Q07, Q08, Q09, Q12, Q13 e Q15. Cada questão conta no máximo uma vez, mesmo com várias tags. Alternativas de descanso, disposição do dia ou afastamento da discussão não recebem inferência profissional automática. O registro guarda exatamente a alternativa que fundamentou cada coincidência. Esta camada usa as respostas, além da distribuição, e sua sobreposição com os pontos é uma decisão provisória explícita, não nova evidência independente.
4. **Interesse (I):** 1 para curso declarado com correspondência canônica/alias; 0,5 para área explicitamente declarada e correspondente às áreas da matriz; 0 sem correspondência. Não se infere interesse pelo perfil. Aliases não usam busca aproximada que possa confundir cursos distintos.

**Índice = 70 × D + 15 × P + 10 × R + 5 × I.**

O resultado é um índice de 0 a 100 pontos, não porcentagem nem probabilidade. Os coeficientes 70/15/10/5 são escolhas iniciais de produto, documentadas e provisórias. Priorizam a distribuição, preservam a ordem do par, permitem diferenças por resposta e limitam o interesse a cinco pontos. O interesse não recebe um lugar reservado nem força o curso ao topo. Se aparecer fora dos cinco, fica em bloco separado, com sua posição e índice. Interesse não encontrado, inclusive pós-graduação, continua registrado sem forçar equivalência ou misturá-lo ao ranking de graduação.

## Ordem e empates

O índice bruto é guardado com quatro casas e exibido com uma casa. A classificação usa o bruto, não a casa exibida. Empates brutos compartilham posição e são identificados. O ID canônico é usado apenas para apresentação estável de empatados. Se o empate atravessar a quinta posição, os outros cursos empatados são informados; não se atribui superioridade profissional ao que apareceu primeiro. Não há sorteio. A mesma entrada e a mesma edição produzem a mesma saída. Somatório zero retorna insuficiência de evidência e não inventa cinco recomendações.

## Entrega e preservação

Cada opção traz índice, motivo, forças, atividade prática e desafio específico. A ficha comercial usa os mesmos cinco IDs, na mesma ordem e com os mesmos índices, acrescentando perguntas consultivas. Uma única estrutura de ranking gera as duas entregas. A lista não confirma capacidade técnica, oferta ativa, requisitos de ingresso, registro profissional, salário, emprego ou prontidão de matrícula.

Escolaridade não muda os pontos comportamentais. As graduações são possibilidades de formação; a instituição deve confirmar elegibilidade, oferta e modalidade antes de matrícula. Esta versão não recomenda pós automaticamente.

O ranking é armazenado na nova edição do relatório, com versão, hash, decomposição por curso e referências de alternativas em metadados internos. O participante recebe apenas as explicações da sua entrega, sem transcrição técnica. Resultados anteriores ganham uma edição adicional imutável; o original, respostas, pontuações e crédito continuam preservados. Reabrir a página usa a mesma edição salva, sem novo cálculo variável ou débito.

## Revisão futura

Validar cada vetor com a equipe acadêmica; revisar as associações de tarefas e respostas; verificar sensibilidade e distribuição de recomendações por curso; avaliar situações de empate; testar a compreensão do rótulo provisório; registrar uma nova versão para qualquer alteração. Não modificar pesos dentro de uma versão já emitida. A aprovação comercial da publicação pelo proprietário não deve ser registrada como homologação metodológica.
