# Análise técnica — Plataforma configurável de questionários e PDF

> **Documento:** análise e proposta (sem implementação)  
> **Projeto:** DNA da Profissão® / DNA Profissional (V1 em produção)  
> **Data de referência:** julho/2026  
> **Escopo:** transformar futuramente o sistema em plataforma onde o admin cria questionários, perfis, pesos e textos do relatório **sem alterar código** — **reaproveitando o layout visual do PDF atual**.

**Trava explícita:** este documento **não autoriza** implementação. V1 permanece intocada até aprovação fase a fase.

---

## PARTE 1 — Raio-X do sistema atual

Referência complementar: [`RAIO-X-DNA-FINANCEIRO.md`](./RAIO-X-DNA-FINANCEIRO.md) (mapa V1 já existente).

### 1.1 Onde estão as perguntas atuais

| Item | Local | Detalhe |
|------|--------|---------|
| 24 perguntas completas | `lib/dna-data.ts` → `QUESTIONS` | Array de `{ q, opts: [{ l: "A"\|"B"\|…, t }] }` |
| DNA Rápido (10 perguntas) | Mesmo array + índices | `QUICK_QUESTION_INDICES` em `dna-data.ts`; override admin em `app_settings` via `lib/app-settings.ts` |
| Renderização | `components/dna/quiz.tsx` | Importa `QUESTIONS`; uma pergunta por tela |

### 1.2 Onde estão as alternativas atuais

- Embutidas em cada item de `QUESTIONS[].opts` (`l` = rótulo A–E, `t` = texto).
- **Não há tabela** nem entidade separada no banco.
- Na UI, as letras A–E são exibidas como badges; o valor armazenado na memória do quiz é a **letra**, não o índice da alternativa.

### 1.3 Onde estão os perfis atuais

| Item | Local |
|------|--------|
| Definição rica (textos PDF + admin) | `lib/dna-data.ts` → `PROFILES` (chaves `A`–`E`) |
| Cursos recomendados no PDF (5 por perfil) | `lib/dna-data.ts` → `COURSES_BY_PROFILE` |
| Preview landing | `components/dna/landing.tsx` (usa `PROFILES`) |
| Status CRM | `lib/dna-data.ts` → `STATUS_OPTS`, `STATUS_CLASS` |

Mapeamento V1 letra → perfil:

| Código | Nome |
|--------|------|
| A | LÍDER E EXECUTOR |
| B | COMUNICADOR E INFLUENTE |
| C | ESTRATÉGICO E ANALÍTICO |
| D | HUMANIZADO E DESENVOLVEDOR |
| E | PRÁTICO E EMPREENDEDOR |

### 1.4 Onde estão os textos usados no PDF

| Fonte | Campos usados no PDF |
|-------|----------------------|
| `PROFILES[primary]` | `name`, `subtitle`, `tagline`, `color`, `theme.*`, `superPowers`, `whoYouAre`, `dailyAnalogy`, `howYouFunction`, `howYouAct`, `howYouDecide`, `whatMotivates`, `whatDrains`, `idealEnvironment`, `strong`, `attention`, `reflection`, `compatibilityAreas`, `salaries`, `topSalary`, `final`, `visualization` |
| `PROFILES[secondary]` | `name`, `color` (bloco secundário na pág. 3) |
| `COURSES_BY_PROFILE[primary]` | `name`, `pct`, `description`, `areas[]`, `idealFor` (imagens `image` existem no dado mas **não são renderizadas** no PDF atual) |
| Hardcoded em `result-pdf.tsx` | Títulos de seção genéricos (“Este é o seu retrato profissional.”), copy de boas-vindas, índice 01/02/03, rodapés “DNA PROFISSIONAL · página NN”, taglines de marca, textos de salários (fontes Robert Half etc.), CTA consultor |

**Campos em `PROFILES` não usados no PDF:** `desc`, `block`, `areas[]`, `courses[]` (lista curta) — usados no **admin** (`app/admin/page.tsx`), não no template PDF.

### 1.5 Onde está a lógica de cálculo

| Arquivo | Responsabilidade |
|---------|------------------|
| `components/dna/quiz.tsx` → `finishQuiz()` | Único algoritmo em runtime |
| `lib/dna-data.ts` | **Não calcula**; apenas define perguntas e conteúdo estático |

Regras V1:

1. Contagem por letra A–E (+1 por resposta).
2. Percentual = `round(count / N * 100)` com N = total de perguntas respondidas (24 ou 10).
3. Principal = maior contagem; secundário = segundo maior.
4. Desempate: ordem estável das chaves `A, B, C, D, E` no `Object.entries` + `sort`.
5. **Sem pesos variáveis** — cada alternativa equivale implicitamente a +1 no perfil da letra.
6. `course_interest` **não entra** no cálculo.

### 1.6 Onde o resultado é salvo

| Etapa | API | Tabela | Colunas |
|-------|-----|--------|---------|
| Cadastro (pré-quiz) | `POST /api/participants` | `participants` | `name`, `phone`, `email`, `city`, `course_interest`, `escolaridade`, `tipo_questionario`, `vendor_slug`, `status: Aguardando teste`, `quiz_completed: false` |
| Fim do quiz | `PATCH /api/participants` | `participants` | `primary_profile`, `secondary_profile`, `percentages` (JSON A–E), `quiz_completed`, `quiz_completed_at`, `status: Novo` |

Implementação: `app/api/participants/route.ts`.  
**Respostas individuais por pergunta não são persistidas** na V1.

Admin lê/atualiza: `GET/PATCH /api/admin/participants` → `app/api/admin/participants/route.ts`.

### 1.7 Como o PDF recebe dados

```
Admin ou URL manual
  → /resultado?name=&primary=&secondary=&percentages=<JSON encoded>
  → app/resultado/page.tsx (parse query)
  → <ResultPDF name primaryProfile secondaryProfile percentages />
  → result-pdf.tsx resolve PROFILES + COURSES_BY_PROFILE no client
  → html2canvas + jsPDF → download local
```

Nenhum dado de relatório vem do banco na V1 — apenas query string + constantes TypeScript.

### 1.8 Textos fixos no PDF (layout/marca)

- Marca: componente `Logo` (“DNA” / “PROFISSIONAL”), “DNA PROFISSIONAL™”.
- Rótulos estruturais: “DIAGNÓSTICO COMPLETO”, “RELATÓRIO PERSONALIZADO PARA”, números de capítulo (“01 · BEM-VINDO(A)”, …).
- Parágrafos introdutórios completos na página 2 (obrigado, clareza, autoconhecimento).
- Grid “01 QUEM VOCÊ É / 02 COMO FUNCIONA / 03 POR ONDE IR”.
- Títulos de seção repetidos: “Quem é você?”, “Como você funciona”, “Seus superpoderes naturais”, “Áreas com maior compatibilidade”, “Cursos ideais para o seu perfil”, etc.
- Frase de rodapé de capa: “Mais clareza · Mais direção · Mais você no seu futuro”.
- Bloco legal/comercial final: consultor entrará em contato; fontes salariais.
- Nome do arquivo: `DNA_Profissional_{nome}.pdf` (fixo no código).

### 1.9 Textos que variam conforme perfil (principal)

Quase todo o corpo narrativo vem de `PROFILES[primary]`. O **tema visual** (`theme.primary`, gradientes, emoji de capa) também é por perfil principal.

Secundário: apenas nome, cor e % na página 3.

### 1.10 Partes que podem virar campos configuráveis

| Categoria | Exemplos |
|-----------|----------|
| Globais do produto/questionário | Nome do teste na capa, subtítulo do diagnóstico, textos de abertura pág. 2, rodapé, CTA consultor |
| Por perfil (`questionnaire_profiles` + conteúdo) | Todos os campos atuais de `PROFILES` + `COURSES_BY_PROFILE` |
| Por combinação principal + secundário | Hoje **inexistente** no PDF; oportunidade V2 (textos de sinergia) |
| Por curso escolhido no cadastro | Hoje **não usado** no PDF; opcional futuro (personalizar 1 curso destacado) |
| Gerados pelo cálculo | `percentages`, ranking, `mainProfile` / `secondaryProfile`, eventual `resultCode` |

### 1.11 Fluxo e arquivos principais (resumo)

| Papel | Arquivo |
|-------|---------|
| Orquestração funil | `app/page.tsx` |
| Cadastro | `components/dna/registration.tsx` |
| Quiz | `components/dna/quiz.tsx` |
| Obrigado | `components/dna/thank-you.tsx` |
| PDF | `components/dna/result-pdf.tsx`, `app/resultado/page.tsx` |
| Dados | `lib/dna-data.ts` |
| Admin leads | `app/admin/page.tsx` |
| APIs | `app/api/participants/route.ts`, `app/api/admin/participants/route.ts` |
| SQL | `scripts/004_*.sql`, `005_*.sql`, `006_sales_vendors.sql`, `007_rls_*.sql` |
| Stack PDF | `html2canvas`, `jspdf` (`package.json`) |

### 1.12 Mensagem WhatsApp (admin)

Template **fixo em código** em `app/admin/page.tsx` (`copyWA`): usa primeiro nome, `PROFILES[primary].name`, secundário opcional — **não** configurável pelo admin hoje.

---

## Fatiamento do PDF atual

Arquivo analisado: `components/dna/result-pdf.tsx` (~12 páginas A4, ids `p1` … `p10`, `p-salaries`, `p-final`).

Legenda de dependências: **P** = perfil principal, **S** = secundário, **%** = percentuais do quiz, **N** = nome participante, **C** = curso cadastro (hoje não usado).

### Detalhamento por bloco

#### Página 1 — Capa (`p1`)

| Bloco | Tipo | Origem | Dinâmico? | Configurável? |
|-------|------|--------|-----------|---------------|
| Logo DNA Profissional | UI fixa | `Logo` em `result-pdf.tsx` | Não | Marca global (opcional URL logo) |
| Ornamentos / gradientes | Layout | `T.primary` de `PROFILES[P].theme` | Sim (cor) | `theme.*` por perfil |
| Emoji / número capa | Conteúdo | `theme.coverEmoji`, `theme.coverNumber` | Sim | Por perfil |
| Data | Sistema | `new Date()` client | Sim | Fixo formato |
| Label “DIAGNÓSTICO COMPLETO” | Texto fixo | hardcoded | Não | Global questionário |
| Título perfil (2 linhas) | Conteúdo | `primary.name` | Sim | Por perfil |
| Subtítulo capa | Conteúdo | `primary.subtitle` | Sim | Por perfil |
| Chips superpoderes (5) | Lista | `primary.superPowers` | Sim | Por perfil |
| “RELATÓRIO PERSONALIZADO PARA” + nome | Misto | label fixo + prop `name` | Sim (nome) | N global; label global |
| Tagline rodapé capa | Texto fixo | hardcoded | Não | Global |

#### Página 2 — Introdução (`p2`)

| Bloco | Tipo | Origem |
|-------|------|--------|
| Header logo + “01 · BEM-VINDO(A)” | Misto | layout + fixo |
| “OLÁ, {firstName}!” | Dinâmico | `name` |
| Título “Este é o seu retrato profissional.” | Fixo | hardcoded |
| 3 parágrafos de abertura | Fixo | hardcoded |
| Índice 01/02/03 (títulos + descrições) | Fixo | hardcoded |
| Rodapé “DNA PROFISSIONAL · página 02” | Fixo | hardcoded |

#### Página 3 — Seu perfil (`p3`)

| Bloco | Origem | Depende |
|-------|--------|---------|
| Nome perfil principal | `PROFILES[P].name` | P |
| Subtítulo | `subtitle` | P |
| Tagline “EM UMA FRASE” | `tagline` | P |
| Grid 5 superpoderes | `superPowers` | P |
| % principal | `percentages[P]` | P, % |
| Nome + % secundário | `PROFILES[S]`, `percentages[S]` | P, S, % |

#### Página 4 — Quem você é (`p4`)

| Bloco | Origem | Depende |
|-------|--------|---------|
| `whoYouAre` | PROFILES[P] | P |
| `dailyAnalogy` | PROFILES[P] | P |
| `howYouFunction[]` | PROFILES[P] | P |
| `howYouAct[]` | PROFILES[P] | P |

#### Página 5 — O que te move (`p5`)

| Bloco | Origem | Depende |
|-------|--------|---------|
| `howYouDecide[]` | PROFILES[P] | P |
| `whatMotivates[]` | PROFILES[P] | P |
| `whatDrains[]` | PROFILES[P] | P |
| `idealEnvironment[]` | PROFILES[P] | P |

#### Página 6 — Forças e desafios (`p6`)

| Bloco | Origem | Depende |
|-------|--------|---------|
| `strong[]` | PROFILES[P] | P |
| `attention[]` | PROFILES[P] | P |
| `reflection` | PROFILES[P] | P |

#### Página 7 — Compatibilidade (`p7`)

| Bloco | Origem | Depende |
|-------|--------|---------|
| 5 áreas + barras | `compatibilityAreas[{name,pct}]` | P (**pct marketing**, não do quiz) |

#### Páginas 8–10 — Cursos (`p8`, `p9`, `p10`)

| Bloco | Origem | Depende |
|-------|--------|---------|
| Título seção (só p8) | fixo + hardcoded | — |
| Até 2 cards por página | `COURSES_BY_PROFILE[P]` (5 cursos) | P |
| Por card: nome, pct, description, areas[], idealFor | COURSES_BY_PROFILE | P |

#### Página salários (`p-salaries`)

| Bloco | Origem | Depende |
|-------|--------|---------|
| Título + copy intro | misto fixo + `primary.name`, `firstName` | P, N |
| Hero `topSalary` | PROFILES[P] | P |
| Tabela `salaries[]` | PROFILES[P] | P |
| Nota fontes / disclaimer | fixo + `firstName` | N |

#### Página final (`p-final`)

| Bloco | Origem | Depende |
|-------|--------|---------|
| Saudação `{firstName}, seu caminho está claro` | fixo + N | N |
| Citação `primary.final` | PROFILES[P] | P |
| `visualization[]` (4 itens) | PROFILES[P] | P |
| Bloco salário + perfil | fixo + P + topSalary | P |
| CTA consultor | fixo | global |
| Rodapé data + marca | `today` + fixo | — |

### Tabela consolidada

| Bloco do PDF | Tipo | Origem atual | Dinâmico? | Configurável pelo admin? | Observação |
|---|---|---|---|---|---|
| Capa — logo e marca | Layout | `result-pdf.tsx` | Não | Parcial (branding global) | Design fixo |
| Capa — tema cores/emoji | Visual | `PROFILES[P].theme` | Sim | Sim (por perfil) | Não altera grid |
| Capa — título/subtítulo perfil | Texto | `PROFILES[P]` | Sim | Sim | |
| Capa — nome participante | Dado | prop `name` | Sim | N/A (lead) | |
| Capa — data | Dado | client `Date` | Sim | N/A | |
| Capa — tagline inferior | Texto | hardcoded | Não | Sim (global) | |
| Intro — boas-vindas + corpo | Texto | hardcoded | Parcial (nome) | Sim (global + merge nome) | |
| Intro — índice 3 colunas | Texto | hardcoded | Não | Sim (global) | |
| Perfil — resumo + tagline | Texto | `PROFILES[P]` | Sim | Sim | |
| Perfil — % principal/secundário | Cálculo | `percentages` + S | Sim | N/A | Gerado |
| Quem é / analogia / listas | Texto/lista | `PROFILES[P]` | Sim | Sim | |
| Decisões / motiva / cansa / ambiente | Lista | `PROFILES[P]` | Sim | Sim | |
| Pontos fortes / atenção / reflexão | Lista/texto | `PROFILES[P]` | Sim | Sim | |
| Áreas compatibilidade | Lista+número | `compatibilityAreas` | Sim | Sim | pct editável (hoje não vem do quiz) |
| Cursos recomendados (5) | Lista estruturada | `COURSES_BY_PROFILE[P]` | Sim | Sim | 5 slots por perfil |
| Salários mercado | Tabela+número | `salaries`, `topSalary` | Sim | Sim | |
| Fechamento — mensagem final | Texto | `final`, `visualization` | Sim | Sim | |
| Fechamento — CTA comercial | Texto | hardcoded | Não | Sim | |
| Rodapés de página | Texto | hardcoded | Não | Sim (global) | |
| Botão download / pipeline PDF | Código | html2canvas+jsPDF | — | Não (layout engine) | Fase 10 |

---

## PARTE 3 — Modelo configurável de relatório

### Conceito

- **Layout fixo:** o React/CSS de `result-pdf.tsx` (ou cópia V2) define posições, tipografia, cores de sistema (`C.*`), componentes `Page`, `SectionTitle`, `GoldDivider`.
- **Conteúdo configurável:** strings e listas vindas do banco, keyed por `section_key` + `field_key`.
- **Admin não edita HTML/CSS** — edita campos em formulários/abas.

### Entidades propostas

#### `report_templates`

- Um questionário publicado aponta para um template ativo.
- `layout_key`: ex. `dna_profissional_v1` → mapeia para componente React congelado.
- Vários questionários podem compartilhar o **mesmo** `layout_key` (mesmo visual, textos diferentes).

#### `report_sections`

- Espelham as seções lógicas do PDF (capa, intro, perfil_resumo, quem_e, …).
- `section_key` estável para o renderer saber onde injetar conteúdo.
- `sort_order` alinha com ordem de páginas (informativo; ordem real continua no layout).

#### `report_fields` (schema / catálogo)

- Define **quais campos existem** para um `layout_key` (tipo, obrigatoriedade, max length).
- Evita admin criar chaves arbitrárias que o PDF não consome.
- Opcional na Fase 5; pode começar só com `report_contents` + enum de keys no código V2.

#### `report_contents` (valores)

Campos sugeridos (alinhado ao pedido):

| Campo | Uso |
|-------|-----|
| `questionnaire_id` | FK |
| `profile_id` | NULL = global |
| `secondary_profile_id` | NULL = não combinação |
| `section_key` | ex. `cover`, `intro`, `profile_summary`, `courses_slot_1` |
| `field_key` | ex. `tagline`, `who_you_are`, `course_description` |
| `content_type` | `text`, `rich_text`, `list`, `number`, `image_url`, `json` |
| `content_value` | payload serializado |
| `active` | soft delete |

#### `profile_report_content` (visão lógica)

Agregação de `report_contents` filtrada por `profile_id` — equivalente ao que hoje é um objeto `PROFILES.A` inteiro.

### Escopo dos campos

| Escopo | Exemplos | Onde guardar |
|--------|----------|--------------|
| 1. Globais do questionário | Título relatório, textos pág. 2, rodapé, CTA consultor, nome produto na capa | `profile_id` NULL |
| 2. Por perfil | name, subtitle, tagline, listas, theme JSON, compatibilityAreas, salaries, 5 cursos | `profile_id` = perfil |
| 3. Combinação P + S | Texto “sinergia entre X e Y” (hoje não existe) | `profile_id` + `secondary_profile_id` |
| 4. Por curso/profissão | Destaque se lead escolheu curso X | `course_id` ou match por nome + FK opcional |
| 5. Gerados pelo cálculo | percentages, ranking, main/secondary codes | `questionnaire_results` — **não** editável pelo admin |

### Renderização V2 (futura)

```text
loadQuestionnaire(slug)
loadReportTemplate(questionnaire_id)
loadReportContents(questionnaire_id, profile_ids...)
calculateResult(answers) → scores, percentages, main, secondary
merge(layout_key, contents, runtime) → props para ResultPDFConfigurable
```

O merge substitui `PROFILES[x]` por objetos montados a partir de `report_contents`, mantendo **a mesma forma** esperada pelo template (contrato TypeScript).

---

## PARTE 4 — Motor de questionários (entidades)

### 1. `questionnaires`

Representa um teste (DNA Profissão, DNA Financeiro, …).

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | text | “DNA da Profissão” |
| slug | text unique | URL `/q/dna-profissao` |
| description | text | Admin |
| status | enum | `draft`, `published`, `archived` |
| version | int | incremento ao republicar |
| active | boolean | flag operacional |
| created_at, updated_at | timestamptz | |

### 2. `questionnaire_profiles`

| Campo | Notas |
|-------|-------|
| questionnaire_id | FK |
| code | ex. `A`, `LID`, `COM` (único por questionário) |
| name, short_description, long_description | |
| color, icon | UI + PDF |
| sort_order | desempate no cálculo |
| active | |

### 3. `questions`

| Campo | Notas |
|-------|-------|
| questionnaire_id | FK |
| text, description | enunciado |
| order | |
| type | inicial: `single_choice` |
| required, active | |

### 4. `alternatives`

| Campo | Notas |
|-------|-------|
| question_id | FK |
| text | |
| order | |
| active | |

### 5. `alternative_weights`

| Campo | Notas |
|-------|-------|
| alternative_id, profile_id | |
| weight | int ≥ 0 |

**Migração conceitual V1:** cada opção `l: "A"` → peso 1 no perfil código `A`; demais 0.

### 6. `questionnaire_results`

| Campo | Notas |
|-------|-------|
| questionnaire_id, participant_id | |
| scores | jsonb `Record<code, number>` |
| percentages | jsonb |
| main_profile_id, secondary_profile_id | FK perfis |
| result_code | ex. `A-B` ou `LID-COM` |
| created_at | |

### 7. `questionnaire_answers`

| Campo | Notas |
|-------|-------|
| questionnaire_id, participant_id, question_id, alternative_id | |
| created_at | auditoria / recomputo |

### 8–10. Relatório

Conforme Parte 3: `report_templates`, `report_sections`, `report_contents`.

---

## PARTE 5 — Proposta de Admin Builder

Rotas **novas** (não substituir `/admin` V1):

### `/admin/questionarios`

Lista: nome, slug, status, versão, # perguntas, # perfis, leads (join `participants_v2` ou contagem por `questionnaire_id`), ações (editar, duplicar, arquivar, preview).

### `/admin/questionarios/novo`

Form: nome, slug (auto), descrição, status inicial `draft`, ativo.

### `/admin/questionarios/[id]/perfis`

CRUD perfis: código, nome, cor, ícone, descrições, ordem, ativo.  
Validação: códigos únicos; mínimo 2 perfis para publicar.

### `/admin/questionarios/[id]/perguntas`

- CRUD perguntas, reordenar (drag ou set order).
- Por pergunta: alternativas + matriz de pesos (linhas = alternativas, colunas = perfis).
- UI sugerida:

```text
Pergunta 1 — "No dia a dia..."
  Alternativa A — "Toma a frente..."
    LID: 3  COM: 0  EST: 1  ...
```

- Indicadores: alternativa sem peso; perfil nunca pontua; pergunta com uma única coluna não-zero.

### `/admin/questionarios/[id]/relatorio`

Abas:

1. **Textos gerais** — intro, rodapés, CTA, marca.
2. **Conteúdo por perfil** — espelha campos `PROFILES` + theme JSON.
3. **Combinações** — matriz opcional P×S (textos curtos).
4. **Cursos/áreas** — 5 slots × perfil (como `COURSES_BY_PROFILE`).
5. **Mensagem final / WhatsApp** — template com variáveis `{{firstName}}`, `{{mainProfileName}}`.

### `/admin/questionarios/[id]/preview`

- Simulador: escolher respostas ou “perfil alvo” auto.
- Rodar `calculateQuestionnaireResult`.
- Render PDF preview (iframe `/admin/.../preview-pdf`) com conteúdo do banco.
- Checklist de campos vazios antes de publicar.

---

## PARTE 6 — Cálculo padronizado

### Assinatura proposta

```typescript
function calculateQuestionnaireResult(input: {
  questionnaire: QuestionnaireMeta
  profiles: QuestionnaireProfile[] // ordered by sort_order
  questions: Question[]
  alternatives: Alternative[]
  weights: AlternativeWeight[]
  answers: Array<{ questionId: string; alternativeId: string }>
}): {
  scores: Record<string, number>
  percentages: Record<string, number>
  mainProfile: string // code
  secondaryProfile: string
  resultCode: string // `${main}-${secondary}`
  ranking: Array<{ profileCode: string; score: number; percentage: number }>
}
```

### Algoritmo

1. Inicializar `scores[code] = 0` para cada perfil ativo.
2. Para cada resposta, localizar alternativa e somar `weight` em cada perfil.
3. `total = sum(scores)` (ou sum of max per question — **definir política**; V1 usa N perguntas no denominador dos %, não sum scores).
4. **Percentuais V2 recomendados:**  
   - Opção A (compatível V1 com pesos 1): `pct[code] = round(score / numQuestions * 100)` se uma resposta por pergunta.  
   - Opção B (normalizado): `pct[code] = round(score / total * 100)` se pesos variados.  
   Documentar escolha por questionário (`scoring_mode` em `questionnaires`).
5. Ordenar ranking por score desc; desempate por `sort_order` asc do perfil.
6. `mainProfile = ranking[0].code`, `secondaryProfile = ranking[1].code`.
7. `resultCode = `${main}-${secondary}``.

### Validações de configuração

| Problema | Detecção |
|----------|----------|
| Alternativa sem pesos | sum weights = 0 |
| Peso negativo | constraint DB + UI |
| Perfil órfão | nenhum weight > 0 em todo questionário |
| Pergunta sem alternativa | count < 2 |
| Empate main/secondary | sort_order (determinístico) |

### Publicação

- Endpoint `POST .../publish` roda checklist (Parte 7) e só então `status = published`.

---

## PARTE 7 — Checklist obrigatório antes de publicar

Um questionário **só** publica se:

- [ ] ≥ 2 perfis ativos  
- [ ] ≥ 5 perguntas ativas  
- [ ] Cada pergunta ≥ 2 alternativas ativas  
- [ ] Cada alternativa tem ≥ 1 peso definido (≥ 1 entry em `alternative_weights`)  
- [ ] Nenhum peso negativo  
- [ ] ≥ 80% das perguntas pontuam > 1 perfil **ou** flag admin `allow_single_profile_questions` com justificativa  
- [ ] Todo perfil ativo recebe peso > 0 em alguma alternativa  
- [ ] Conteúdo de relatório completo para **cada** perfil (campos obrigatórios do `layout_key`)  
- [ ] Texto de fechamento global presente  
- [ ] `report_templates` ativo vinculado  
- [ ] Preview gera PDF sem erro e sem placeholder vazio  
- [ ] Simulação de cálculo retorna `mainProfile` e `secondaryProfile` distintos quando possível (alerta se empate permanente)

---

## PARTE 8 — Estratégia para não quebrar a V1

### Princípios

1. **Motor novo:** `lib/questionnaire-engine/` (ou `lib/dna-v2/`) — zero imports da V1 no funil `/`.
2. **Tabelas novas** — prefixo ou sufixo `_v2` / schema separado; migrations **aditivas**.
3. **Admin builder** em rotas `/admin/questionarios/*` separadas da lista de leads V1.
4. **APIs novas:** `/api/v2/questionnaires`, `/api/v2/participants`, etc.
5. **PDF:** copiar `result-pdf.tsx` → `result-pdf-configurable.tsx` na Fase 10; V1 file intacto.
6. **Funil público V2** em rota dedicada (`/q/[slug]`) até migração aprovada.
7. **Migração DNA Profissão → motor novo** somente como projeto “V3/homologação”, com testes de paridade de scoring (pesos 1 = V1).

### Arquivos que **NÃO** devem ser alterados na implementação inicial (sem aprovação explícita)

- `app/page.tsx`
- `app/resultado/page.tsx`
- `components/dna/result-pdf.tsx`
- `lib/dna-data.ts`
- `components/dna/quiz.tsx` (V1)
- `app/api/participants/route.ts` (contrato V1)

Alterações permitidas na preparação: **somente** este markdown e documentação.

---

## PARTE 9 — Banco de dados sugerido

### DDL pseudo-SQL (PostgreSQL / Supabase)

```sql
-- Questionários
CREATE TABLE questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  version INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  scoring_mode TEXT NOT NULL DEFAULT 'per_question'
    CHECK (scoring_mode IN ('per_question','normalized_sum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questionnaire_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  color TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (questionnaire_id, code)
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single_choice',
  required BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "order" INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE alternative_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alternative_id UUID NOT NULL REFERENCES alternatives(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES questionnaire_profiles(id) ON DELETE CASCADE,
  weight INT NOT NULL DEFAULT 0 CHECK (weight >= 0),
  UNIQUE (alternative_id, profile_id)
);

CREATE TABLE participants_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID REFERENCES questionnaires(id),
  unit_id UUID REFERENCES units_v2(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  course_interest TEXT,
  escolaridade TEXT,
  vendor_slug TEXT,
  status TEXT NOT NULL DEFAULT 'Aguardando teste',
  notes TEXT,
  quiz_completed BOOLEAN NOT NULL DEFAULT false,
  quiz_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questionnaire_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id),
  participant_id UUID NOT NULL REFERENCES participants_v2(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  alternative_id UUID NOT NULL REFERENCES alternatives(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participant_id, question_id)
);

CREATE TABLE questionnaire_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id),
  participant_id UUID NOT NULL REFERENCES participants_v2(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  percentages JSONB NOT NULL,
  main_profile_id UUID REFERENCES questionnaire_profiles(id),
  secondary_profile_id UUID REFERENCES questionnaire_profiles(id),
  result_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participant_id)
);

CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout_key TEXT NOT NULL DEFAULT 'dna_profissional_v1',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (report_template_id, section_key)
);

CREATE TABLE report_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES questionnaire_profiles(id),
  secondary_profile_id UUID REFERENCES questionnaire_profiles(id),
  section_key TEXT NOT NULL,
  field_key TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  content_value JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (questionnaire_id, profile_id, secondary_profile_id, section_key, field_key)
);
```

### Multiunidade (fase posterior)

```sql
CREATE TABLE units_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  active BOOLEAN DEFAULT true
);

CREATE TABLE admin_users_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units_v2(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor'
);

CREATE TABLE sellers_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units_v2(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  slug TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

CREATE TABLE credit_events_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units_v2(id),
  delta INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Diagrama textual

```text
questionnaires
  ├── questionnaire_profiles
  ├── questions
  │     └── alternatives
  │           └── alternative_weights → questionnaire_profiles
  ├── report_templates
  │     └── report_sections
  ├── report_contents (valores; pode referenciar profiles 1 ou 2)
  ├── questionnaire_results → participants_v2
  └── questionnaire_answers → participants_v2

units_v2
  ├── participants_v2 (opcional FK)
  ├── admin_users_v2
  ├── sellers_v2
  └── credit_events_v2
```

**Relacionamento com V1:** tabela `participants` permanece para leads históricos; novos funis configuráveis usam `participants_v2` + `questionnaire_id`.

---

## PARTE 10 — Ordem recomendada de implementação

| Fase | Objetivo | Arquivos prováveis | Risco | Testes |
|------|----------|-------------------|-------|--------|
| **0 — Análise e aprovação** | Validar este MD + RAIO-X | docs | Baixo | Revisão stakeholders |
| **1 — Banco configurável** | Migrations novas tabelas | `scripts/008_questionnaire_platform.sql` | Médio | Apply staging Supabase |
| **2 — Motor de cálculo** | `calculateQuestionnaireResult` + testes unitários | `lib/questionnaire-engine/*` | Alto | Fixtures espelhando V1 (peso 1) |
| **3 — Admin perfis** | CRUD perfis | `app/admin/questionarios/[id]/perfis`, API v2 | Baixo | CRUD manual |
| **4 — Admin perguntas/pesos** | Builder matriz pesos | `app/admin/questionarios/[id]/perguntas`, API | Alto | Validações publish |
| **5 — Admin textos relatório** | `report_contents` editor | `app/admin/questionarios/[id]/relatorio` | Médio | Completude checklist |
| **6 — Preview relatório** | Simulador + PDF preview | preview route, engine merge | Médio | Visual diff vs V1 PDF |
| **7 — Funil público** | `/q/[slug]` publicado | `app/q/[slug]/*`, APIs v2 | Alto | E2E cadastro→quiz→save |
| **8 — Admin comercial/leads** | Lista leads v2, WhatsApp template DB | admin leads v2 | Médio | Paridade CRM V1 |
| **9 — Créditos/multiunidade** | units, credits | tables + middleware | Médio | Consumo crédito |
| **10 — PDF configurável** | Cópia layout + injeção conteúdo | `result-pdf-configurable.tsx` | Alto | Pixel/regression PDF |

---

## PARTE 11 — Entrega

Arquivo criado: **`ANALISE-PLATAFORMA-QUESTIONARIOS-E-PDF.md`** (este documento).

---

## Resumo executivo

### O que existe hoje

- Funil monolítico em `app/page.tsx` com questionário **fixo** (24 perguntas + DNA Rápido 10) em `lib/dna-data.ts`.
- Scoring **implícito** (+1 por letra A–E) em `quiz.tsx`.
- Perfis e **todo** conteúdo narrativo do PDF em `PROFILES` e `COURSES_BY_PROFILE` (TypeScript).
- PDF premium **client-side** (`result-pdf.tsx`, 12 páginas) alimentado por query string + constantes.
- Persistência: `participants` (resultado agregado, **sem** respostas item a item).
- Admin: leads, PDF link, WhatsApp hardcoded, settings DNA Rápido, cursos.

### O que precisa virar configurável

- Perguntas, alternativas, pesos por perfil, perfis customizados (códigos/nomes/cores).
- Textos do relatório/PDF e slots de cursos/salários por perfil.
- Templates WhatsApp/comercial.
- (Opcional) combinações principal+secundário e destaque por curso.

### Como fatiar o PDF

- Manter **páginas e componentes** como estão; mapear cada bloco a `section_key` + `field_key`.
- Separar **fixos de marca** (editáveis globalmente) vs **dinâmicos por perfil** vs **runtime** (nome, %).
- `COURSES_BY_PROFILE` vira 5 slots configuráveis por perfil; `compatibilityAreas` idem.

### Como criar questionários pelo admin

- CRUD em `/admin/questionarios` com fluxo draft → validação → published.
- Matriz de pesos por alternativa; checklist bloqueia publicação incompleta.

### Como manter layout sem mexer no design

- `layout_key` aponta para componente React **congelado** (cópia do atual).
- Admin só altera `report_contents`; renderer faz merge para props compatíveis.

### Como salvar perguntas/respostas/pesos

- Tabelas normalizadas (`questions`, `alternatives`, `alternative_weights`, `questionnaire_answers`, `questionnaire_results`).

### Como calcular resultado genérico

- Função única com soma de pesos, ranking, desempate por `sort_order`, `resultCode`, modos de percentual documentados.

### Como evitar quebrar a V1

- Código, rotas, APIs e PDF V1 intocados; parallel run em V2; migração do DNA Profissão só após paridade testada.

### Melhor caminho para implementar

Seguir fases 0→10: **banco → motor → admin conteúdo → preview → funil → PDF configurável por último**, reutilizando o investimento visual já feito em `result-pdf.tsx` via injeção de dados, não reescrita de layout.

---

## PARTE 12 — Confirmação

- **Nenhuma** tabela, migration, tela, API ou alteração funcional foi implementada nesta tarefa.
- **Nenhum** commit automático — aguardar aprovação para próximas fases.

---

## Apêndice — Principais arquivos analisados

`RAIO-X-DNA-FINANCEIRO.md`, `app/page.tsx`, `components/dna/quiz.tsx`, `components/dna/registration.tsx`, `components/dna/thank-you.tsx`, `components/dna/result-pdf.tsx`, `app/resultado/page.tsx`, `lib/dna-data.ts`, `app/admin/page.tsx`, `app/api/participants/route.ts`, `app/api/admin/participants/route.ts`, `scripts/*.sql`, `package.json`, `lib/app-settings.ts`.
