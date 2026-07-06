# RAIO-X técnico — DNA da Profissão / DNA Profissional (V1)

> **Documento gerado em:** julho/2026  
> **Propósito:** mapa completo do sistema **atual (V1)** para planejar uma **V2 separada** sem alterar o que está em produção.  
> **Observação de nomenclatura:** o repositório e o produto em código são **DNA da Profissão / DNA Profissional** (`dnadaprofissao.com.br`). Não há módulo ou rotas nomeadas “DNA Financeiro” na V1; esse nome aparece no escopo de evolução (V2) e é tratado aqui como **linha futura**, não como feature existente.

---

## 1. Visão geral do sistema atual

### O que é

Aplicação web **Next.js (App Router)** que conduz o usuário por um funil de **teste de perfil profissional comportamental** (“DNA Profissional”): cadastro → questionário → agradecimento. O **resultado detalhado e o PDF** não são exibidos ao usuário final no funil; ficam disponíveis para a **equipe via painel admin** (visualização, link para PDF, mensagem WhatsApp copiável).

Existem duas variantes de questionário na V1:

| Variante | Perguntas | Ativação |
|----------|-----------|----------|
| **Completo** | 24 | Sempre (botão “Iniciar questionário”) |
| **Rápido** | 10 (subset) | Botão “Iniciar DNA Rápido” só se `app_settings.dna_rapido_button_enabled = true` |

### Fluxo principal do usuário

```
Landing (/) → Cadastro (Registration) → Quiz → ThankYou
```

- **Sem rotas URL** para etapas do funil: tudo é estado React em `app/page.tsx` (`screen`: `landing` | `register` | `quiz` | `thankyou`).
- **PDF/resultado rico:** rota separada `/resultado?...` (usada pelo admin, não pelo funil público).

### Etapas (cadastro → resultado)

1. **Landing:** marketing, preview dos 5 perfis, CTA “Iniciar minha análise”.
2. **Cadastro:** nome, WhatsApp, email, cidade (opcional), escolaridade (obrigatória), curso de interesse (select alimentado pelo banco).
3. **POST participante:** cria lead com status `Aguardando teste`, `quiz_completed: false`.
4. **Quiz:** uma pergunta por tela; barra de progresso; ao final calcula perfis A–E.
5. **PATCH participante:** grava `primary_profile`, `secondary_profile`, `percentages`, marca quiz concluído, status `Novo`.
6. **ThankYou:** mensagem de conclusão; **não** mostra perfil nem PDF.
7. **Admin:** consultor vê lead, gráfico, status CRM, abre `/resultado` para PDF, copia texto WhatsApp.

### Onde começa o questionário

Após submit do formulário em `Registration`, `app/page.tsx` define `screen = "quiz"` e renderiza `<Quiz mode={quizType} />`.

### Como o usuário responde

- 5 alternativas por pergunta (rótulos **A–E**).
- Clique seleciona; botão “Próxima pergunta” / “Ver meu resultado”.
- Respostas ficam só em memória (`useState`) até o fim; **não há persistência pergunta a pergunta** no banco.

### Como o resultado é calculado

Contagem simples: cada resposta soma **+1** na letra escolhida. Percentuais = `round(count / N * 100)` com N = 24 (completo) ou 10 (rápido). Perfil principal = maior contagem; secundário = segundo maior. Empate: ordem estável `A, B, C, D, E` via `Object.entries` + sort.

**A profissão/curso escolhido no cadastro não entra no cálculo** — só é metadado do lead.

### Como o PDF é gerado

- Rota `/resultado` lê query string (`name`, `primary`, `secondary`, `percentages`).
- Componente `ResultPDF`: HTML/CSS em páginas A4 fixas → **html2canvas** (PNG) → **jsPDF** → download no browser.
- **Não** salva PDF em storage nem banco.

### Como os dados são salvos

**Supabase** (PostgreSQL) via API Routes Next.js e cliente `@supabase/ssr` com **anon key** no servidor.

### Área administrativa

- `/admin` — leads, CRM, config DNA Rápido, link PDF.
- `/admin/cursos` — CRUD e import CSV de cursos.

---

## 2. Arquitetura do projeto

| Item | Detalhe |
|------|---------|
| **Framework** | Next.js 16.x (App Router), React 19 |
| **Linguagem** | TypeScript |
| **Estilo** | Tailwind CSS 4, `app/globals.css`, inline styles com paleta `G` em `lib/dna-data.ts` |
| **Fontes** | Google Fonts: DM Sans, Playfair Display (`app/layout.tsx`) |
| **Banco** | Supabase (sem Prisma/Drizzle) |
| **Deploy** | Vercel (documentado no README; domínio `dnadaprofissao.com.br`) |
| **Analytics** | `@vercel/analytics` em produção |

### Estrutura de pastas (principais)

```
app/                    # Rotas e API Routes
  page.tsx              # Funil V1
  layout.tsx            # Root layout + metadata SEO
  resultado/            # Preview + download PDF
  admin/                # Painel admin + cursos
  api/                  # REST handlers
components/
  dna/                  # UI do produto (landing, quiz, pdf…)
  ui/                   # shadcn/Radix (uso parcial)
lib/
  dna-data.ts           # Perguntas, perfis, cursos por perfil, status CRM
  supabase/             # Cliente server/browser
  app-settings.ts       # Helpers de config
scripts/                # SQL migrations manuais (004, 005)
public/                 # robots, sitemap, icon
```

### Tabela — Área × Caminho × Função

| Área | Caminho/Arquivo | Função |
|------|-----------------|--------|
| Funil público | `app/page.tsx` | Orquestra telas e chamadas API |
| Landing | `components/dna/landing.tsx` | Hero, features, preview perfis |
| Cadastro | `components/dna/registration.tsx` | Formulário, validação, botões completo/rápido |
| Questionário | `components/dna/quiz.tsx` | UI quiz + disparo do cálculo |
| Agradecimento | `components/dna/thank-you.tsx` | Tela pós-teste (sem resultado) |
| Dados estáticos | `lib/dna-data.ts` | 24 perguntas, 5 perfis, cursos PDF, status |
| API leads | `app/api/participants/route.ts` | POST/PATCH participantes |
| API cursos | `app/api/courses/route.ts` | CRUD cursos (GET público) |
| Import CSV | `app/api/courses/import/route.ts` | Bulk insert cursos |
| Config pública | `app/api/settings/public/route.ts` | Flag DNA Rápido |
| Config admin | `app/api/admin/settings/route.ts` | Toggle DNA Rápido |
| Admin auth | `app/api/admin/login/route.ts` | Cookie `dna_admin_session` |
| Admin leads | `app/api/admin/participants/route.ts` | Lista/atualiza leads |
| Admin UI | `app/admin/page.tsx` | Painel principal |
| Admin cursos | `app/admin/cursos/page.tsx` | Gestão de cursos |
| PDF | `app/resultado/page.tsx` | Query params → `ResultPDF` |
| Template PDF | `components/dna/result-pdf.tsx` | HTML multipágina + jsPDF |
| Gráfico admin | `components/dna/radar-chart.tsx` | Radar A–E normalizado |
| Supabase server | `lib/supabase/server.ts` | Cliente SSR |
| Supabase browser | `lib/supabase/client.ts` | **Não referenciado** no app atual |
| Env exemplo | `.env.example` | Supabase + `ADMIN_PASSWORD` |
| Build | `next.config.mjs` | `ignoreBuildErrors: true`, images unoptimized |
| Migrações | `scripts/004_*.sql`, `scripts/005_*.sql` | Colunas quiz + escolaridade/settings |

### Assets

- **Logo UI:** `components/dna/logo.tsx` (componente, não arquivo estático).
- **PDF:** imagens referenciadas em `COURSES_BY_PROFILE` como paths `/nome.jpg` — **a maioria não está em `public/`** no repo (apenas `public/icon.svg`, `robots.txt`, `sitemap.xml` listados). Risco de imagens quebradas no PDF em ambiente limpo.
- **Identidade visual:** cores em `G` (`lib/dna-data.ts`) e constantes `C` em `result-pdf.tsx`.

---

## 3. Fluxo completo do usuário (passo a passo)

| # | Etapa | Arquivos | APIs | Enviado | Retorno | Banco |
|---|--------|----------|------|---------|---------|-------|
| 1 | Acessa site | `app/page.tsx`, `landing.tsx` | — | — | — | — |
| 2 | CTA → cadastro | `landing.tsx` → `page.tsx` | — | — | — | — |
| 3 | Carrega cursos | `registration.tsx` | `GET /api/courses` | — | `[{ id, name, level, … }]` | `courses` |
| 4 | Carrega flag rápido | `registration.tsx` | `GET /api/settings/public` | — | `{ dnaRapidoEnabled }` | `app_settings` |
| 5 | Preenche form | `registration.tsx` | — | — | — | — |
| 6 | Inicia teste | `registration.tsx` → `page.tsx` | `POST /api/participants` | name, phone, email, city, course_interest, escolaridade, tipo_questionario | `{ success, data: { id, … } }` | INSERT `participants` |
| 7 | Responde quiz | `quiz.tsx` | — | (memória) | — | — |
| 8 | Calcula perfil | `quiz.tsx` | — | — | `{ primary, secondary, counts, pct }` | — |
| 9 | Salva resultado | `page.tsx` | `PATCH /api/participants` | id, profiles, percentages, tipo_questionario | `{ success, data }` | UPDATE `participants` |
| 10 | Thank you | `thank-you.tsx` | — | — | — | — |
| 11 | Admin consulta | `admin/page.tsx` | `GET /api/admin/participants` | cookie admin | lista participantes | SELECT `participants` |
| 12 | PDF | link admin → `/resultado?...` | — | query string | render client | — |

**Fallback:** se POST inicial falhar, usuário ainda faz quiz; ao final `page.tsx` tenta POST com perfis incluídos (suportado em `participants/route.ts`).

**Usuário final não vê etapa 11–12.**

---

## 4. Formulário inicial / Lead / Participante

### Tabela de campos

| Campo na tela | Nome técnico | Tipo | Obrigatório | Onde salva | Observação |
|---------------|--------------|------|-------------|------------|------------|
| Nome completo | `name` | string | Sim (UI + API) | `participants.name` | — |
| WhatsApp | `phone` | string | Sim | `participants.phone` | Máscara BR; 10–11 dígitos na validação UI |
| Email | `email` | string | Sim | `participants.email` | Validação mínima `@` e `.` |
| Cidade | `city` | string | Não | `participants.city` | Enviado `null` se vazio |
| Escolaridade | `escolaridade` | string (enum) | Sim (UI) | `participants.escolaridade` | Valores snake_case (ver abaixo) |
| Profissão / curso | `course` → `course_interest` | string | Não | `participants.course_interest` | Options de `courses.name` |
| (implícito) | `tipo_questionario` | `completo` \| `rapido` | Sim (default completo) | `participants.tipo_questionario` | Botão escolhido no cadastro |
| (implícito) | `status` | string | — | `participants.status` | Inicia `Aguardando teste` |
| (implícito) | `quiz_completed` | boolean | — | `participants.quiz_completed` | `false` até PATCH |

**Valores `escolaridade`:** `ensino_medio_incompleto`, `ensino_medio_completo`, `cursando_graduacao`, `graduado`, `pos_graduado`.

### Validação

- **Cliente:** `components/dna/registration.tsx` (`validate()`).
- **Servidor:** `POST /api/participants` exige apenas `name`, `phone`, `email` — **escolaridade não é validada no backend**.

### Payload POST (cadastro)

```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "city": "string | null",
  "course_interest": "string | null",
  "escolaridade": "string",
  "tipo_questionario": "completo | rapido"
}
```

### Integrações externas no cadastro

- **Nenhuma** (sem CRM, email transacional, WhatsApp API). Telefone é armazenado para contato manual.

---

## 5. Questionário atual

### Onde ficam as perguntas

- **Arquivo único:** `lib/dna-data.ts` → constante `QUESTIONS` (array de 24 objetos).
- **DNA Rápido:** `QUICK_QUESTION_INDICES = [0, 5, 8, 10, 11, 14, 15, 17, 19, 23]` (índices 0-based no array completo).

### Estrutura de cada pergunta

```ts
{
  q: string,           // enunciado
  opts: [
    { l: "A"|"B"|"C"|"D"|"E", t: string },  // 5 opções
    ...
  ]
}
```

- **Categorias formais:** não existem no código.
- **Pesos explícitos:** não; cada resposta = **+1** na letra escolhida.
- **Lógica condicional:** não (fluxo linear).
- **Progresso:** barra em `quiz.tsx`; completo usa `current/total`; rápido usa `(current+1)/total` e label “Etapa X de 3”.
- **Blocos:** apenas no rápido (3+3+4 perguntas por etapa visual).

### Tabela resumida (24 perguntas)

| Nº | Início do enunciado | Peso | Mapeamento |
|----|---------------------|------|------------|
| 1 | No dia a dia, as pessoas costumam te ver… | 1 | A–E = 1ª–5ª opção |
| 2 | Em grupo de amigos ou família… | 1 | idem |
| 3 | Quando você vai numa loja… | 1 | idem |
| 4 | Quando alguém te conta um problema… | 1 | idem |
| 5 | Quando precisa aprender algo novo… | 1 | idem |
| 6 | O que mais costuma te cansar? | 1 | idem |
| 7 | Quando você chega em um ambiente novo… | 1 | idem |
| 8 | Quando você gosta de uma ideia nova… | 1 | idem |
| 9 | Em uma situação de pressão… | 1 | idem |
| 10 | Como você gosta de receber um feedback? | 1 | idem |
| 11 | Quando precisa tomar uma decisão importante… | 1 | idem |
| 12 | O que normalmente faz você perder o interesse… | 1 | idem |
| 13 | Quando alguém pede sua ajuda… | 1 | idem |
| 14 | Como você reage diante de uma mudança inesperada… | 1 | idem |
| 15 | Em um trabalho em equipe… | 1 | idem |
| 16 | Qual dessas frases mais parece com você? | 1 | idem |
| 17 | Em ambientes de trabalho ou estudo… | 1 | idem |
| 18 | O que normalmente te motiva mais? | 1 | idem |
| 19 | Quando você está aprendendo algo novo… | 1 | idem |
| 20 | Qual dessas situações mais combina com você? | 1 | idem |
| 21 | Quando alguém elogia você… | 1 | idem |
| 22 | Quando você pensa em mudar de vida profissionalmente… | 1 | idem |
| 23 | Qual dessas frases mais combina com seu jeito? | 1 | idem |
| 24 | Hoje, o que você mais procura para sua vida? | 1 | idem |

**Arquivo/local:** todas em `lib/dna-data.ts` (`QUESTIONS[n]`).  
**Perfil relacionado:** cada opção `l` incrementa diretamente o perfil homônimo (A→Líder, B→Comunicador, etc.).

### DNA Rápido — perguntas usadas

| Nº no completo | Índice | Etapa (rápido) |
|----------------|--------|----------------|
| 1, 6, 9 | 0, 5, 8 | 1 |
| 11, 12, 15 | 10, 11, 14 | 2 |
| 16, 18, 20, 24 | 15, 17, 19, 23 | 3 |

---

## 6. Lógica de cálculo dos resultados

### Onde está

| Arquivo | Função |
|---------|--------|
| `components/dna/quiz.tsx` | `finishQuiz()` — único algoritmo runtime |
| `lib/dna-data.ts` | Definições de perfis; **percentuais de compatibilidade de áreas/cursos no PDF são estáticos**, não calculados |

### Explicação técnica

1. Inicializa `counts = { A:0, B:0, C:0, D:0, E:0 }`.
2. Para cada resposta armazenada, incrementa `counts[letra]`.
3. `pcts[k] = round(counts[k] / total * 100)` (`total` = 24 ou 10).
4. Ordena pares `[letra, count]` por count decrescente.
5. `primary = sorted[0][0]`, `secondary = sorted[1][0]`.
6. **Desempate:** JavaScript sort estável; empates mantêm ordem de inserção das chaves A→E.
7. **Não há** normalização para soma 100% entre perfis (percentuais são independentes por contagem/N).
8. **Não há** perfis financeiros separados — apenas A–E profissionais/comportamentais.
9. **`course_interest`** não altera cálculo nem textos do PDF (exceto metadado no admin).

### Pseudocódigo

```pseudo
função finishQuiz(respostas, totalPerguntas):
    counts = { A: 0, B: 0, C: 0, D: 0, E: 0 }
    para cada resposta em respostas:
        letra = resposta.valor  // "A".."E"
        counts[letra] += 1

    pcts = {}
    para cada letra em counts:
        pcts[letra] = arredondar(counts[letra] / totalPerguntas * 100)

    sorted = ordenar counts por valor decrescente (estável)
    primary = sorted[0].letra
    secondary = sorted[1].letra

    retornar { primary, secondary, counts, pct: pcts }
```

### Arquivos × função no cálculo

| Arquivo | Função no cálculo |
|---------|-------------------|
| `components/dna/quiz.tsx` | Algoritmo completo |
| `lib/dna-data.ts` | Fonte das perguntas; não calcula |
| `app/page.tsx` | Repassa resultado à API |
| `app/api/participants/route.ts` | Persiste resultado |
| `components/dna/result-pdf.tsx` | Consome `primary`/`secondary`/`percentages` para conteúdo |
| `components/dna/radar-chart.tsx` | Visualiza `percentages` no admin |

---

## 7. Perfis existentes

Chaves técnicas: **`A`, `B`, `C`, `D`, `E`**. Configuração em `PROFILES` e `COURSES_BY_PROFILE` em `lib/dna-data.ts`.

| Perfil | Slug/ID | Descrição curta | Arquivo/local | Usado no PDF? | Observações |
|--------|---------|-----------------|---------------|---------------|-------------|
| LÍDER E EXECUTOR | A | Decide, age, lidera | `PROFILES.A` | Sim | Tema visual próprio (`theme`) |
| COMUNICADOR E INFLUENTE | B | Conecta, influencia | `PROFILES.B` | Sim | — |
| ESTRATÉGICO E ANALÍTICO | C | Analisa, planeja | `PROFILES.C` | Sim | — |
| HUMANIZADO E DESENVOLVEDOR | D | Acolhe, ensina | `PROFILES.D` | Sim | — |
| PRÁTICO E EMPREENDEDOR | E | Executa, age rápido | `PROFILES.E` | Sim | — |

### Detalhe por perfil (campos em `PROFILES`)

Cada perfil inclui, entre outros: `name`, `subtitle`, `tagline`, `color`, `icon`, `desc`, `strong[]`, `attention[]`, `block`, `areas[]`, `courses[]`, `final`, blocos expandidos (`whoYouAre`, `howYouFunction`, …), `compatibilityAreas[{ name, pct }]`, `superPowers[]`, `theme`, `salaries[]`, `topSalary`.

**PDF:** usa principalmente perfil **primário** para tema/capa/conteúdo; secundário aparece em seções comparativas. **`COURSES_BY_PROFILE[primary]`** define 5 cursos recomendados com `pct` **fixos** (marketing), não derivados do quiz.

---

## 8. Resultado na tela (usuário final)

| Elemento | Origem | Arquivo/componente |
|----------|--------|---------------------|
| Mensagem de conclusão | Texto fixo | `thank-you.tsx` |
| Nome do usuário | Form cadastro | `thank-you.tsx` ← `page.tsx` |
| Perfil / percentuais | **Não exibidos** | — |
| Gráfico | **Não** | — |
| CTA baixar PDF | **Não** | — |
| Email/WhatsApp automático | **Não** | — |

**Admin** exibe: nomes dos perfis, barras por letra, `RadarChart`, link “Ver Resultado PDF”, botão copiar WhatsApp (`admin/page.tsx`).

---

## 9. PDFs / Diagnóstico

| Aspecto | Detalhe |
|---------|---------|
| **Bibliotecas** | `html2canvas` + `jspdf` |
| **Template** | React inline em `components/dna/result-pdf.tsx` (classes `pdf-page`, ~794×1123 px) |
| **Entrada** | Props ou query: `name`, `primaryProfile`, `secondaryProfile`, `percentages` |
| **Persistência** | Apenas download local (`DNA_Profissional_{nome}.pdf`) |
| **Modelos** | Um template multipágina; visual varia por `PROFILES[primary].theme` |
| **Dependência profissão** | Não — curso escolhido no cadastro não entra no PDF |
| **Campos dinâmicos** | Nome, data (`today`), perfis, percentuais do quiz, textos de `PROFILES`, lista `COURSES_BY_PROFILE` |

### Arquivos × função no PDF

| Arquivo | Função |
|---------|--------|
| `app/resultado/page.tsx` | Parse query → monta props |
| `components/dna/result-pdf.tsx` | Layout páginas + `generatePDF()` |
| `lib/dna-data.ts` | Copy, cores, cursos, salários |

### Campos no PDF × origem

| Campo no PDF | Origem | Observação |
|--------------|--------|------------|
| Nome participante | Query / prop `name` | Primeiro nome usado em copy |
| Data | `new Date()` client-side | — |
| Perfil principal/secundário | Query + `PROFILES` | — |
| Percentuais quiz | Query JSON | Radar/barras no relatório |
| Áreas compatibilidade | `PROFILES[].compatibilityAreas` | **Pct fixos**, não do quiz |
| Cursos recomendados | `COURSES_BY_PROFILE[primary]` | **Pct fixos** |
| Salários | `PROFILES[].salaries` | Faixas estáticas |
| Imagens cursos | paths em `COURSES_BY_PROFILE` | Podem faltar em `public/` |

---

## 10. Banco de dados

> **DDL inicial** (`CREATE TABLE participants/courses`) **não está no repositório** — inferido pelo código + migrations parciais.

### Tabela geral

| Tabela | Finalidade | Usada por | Observações |
|--------|------------|-----------|-------------|
| `participants` | Leads + resultados quiz | Funil, admin | Core do CRM |
| `courses` | Lista de profissões/cursos no select | Cadastro, admin/cursos | GET público |
| `app_settings` | Feature flags | settings APIs, admin | Migration 005 |

### Tabela: `participants`

| Coluna | Tipo (inferido) | Obrigatória | Default | Observação |
|--------|-----------------|-------------|---------|------------|
| `id` | UUID | Sim | gen | PK |
| `name` | text | Sim | — | |
| `phone` | text | Sim | — | |
| `email` | text | Sim | — | |
| `city` | text | Não | null | |
| `course_interest` | text | Não | null | Nome do curso |
| `escolaridade` | text | Não* | null | *Obrigatória na UI; nullable no DB (005) |
| `tipo_questionario` | text | Não | `completo` | `completo` \| `rapido` |
| `primary_profile` | text | Não | null | A–E |
| `secondary_profile` | text | Não | null | A–E |
| `percentages` | json/jsonb | Não | null | `{ A,B,C,D,E }` |
| `status` | text | Sim | — | Pipeline CRM |
| `notes` | text | Não | null | Admin |
| `quiz_completed` | boolean | Não | false | Migration 004 |
| `quiz_completed_at` | timestamptz | Não | null | Migration 004 |
| `created_at` | timestamptz | Sim | now() | Ordenação admin |

**Status possíveis (constante):** `Aguardando teste`, `Novo`, `Em análise`, `Resultado enviado`, `Em atendimento`, `Matriculado` — `STATUS_OPTS` em `dna-data.ts`.

### Tabela: `courses`

| Coluna | Tipo | Obrigatória | Observação |
|--------|------|-------------|------------|
| `id` | UUID | Sim | |
| `name` | text | Sim | Exibido no select |
| `level` | text | Não | Ex.: Graduação (admin) |
| `external_id` | text | Não | Upsert CSV |
| `created_at` | timestamptz | Sim | |

### Tabela: `app_settings`

| Coluna | Tipo | Observação |
|--------|------|------------|
| `key` | text PK | ex.: `dna_rapido_button_enabled` |
| `value` | jsonb | boolean |
| `updated_at` | timestamptz | |

### Migrations no repo

| Arquivo | Conteúdo |
|---------|----------|
| `scripts/004_add_quiz_completed.sql` | `quiz_completed`, nullable profiles |
| `scripts/005_escolaridade_dna_rapido.sql` | escolaridade, tipo_questionario, app_settings |

**RLS/policies:** não documentadas em SQL no repo — comportamento depende da configuração Supabase (anon key usada no servidor).

---

## 11. Supabase / Backend / APIs

### Cliente

- **Server:** `lib/supabase/server.ts` — `createServerClient` + cookies Next.
- **Variáveis:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Auth Supabase (usuários):** não usado.
- **Storage buckets:** não referenciados.
- **Edge Functions:** não presentes.

### Endpoints

| Método | Rota | Entrada | Saída | Tabelas | Observação |
|--------|------|---------|-------|---------|------------|
| POST | `/api/participants` | JSON lead (+ opcional perfis) | `{ success, data }` | participants | Público |
| PATCH | `/api/participants` | id + perfis | `{ success, data }` | participants | Público |
| GET | `/api/courses` | — | array courses | courses | Público |
| POST | `/api/courses` | name, level, external_id | course | courses | Admin cookie |
| PUT | `/api/courses` | id, fields | course | courses | Admin |
| DELETE | `/api/courses?id=` | id | `{ ok }` | courses | Admin |
| POST | `/api/courses/import` | CSV | stats | courses | Admin |
| POST | `/api/admin/login` | password | `{ ok }` | — | Set cookie 8h |
| GET | `/api/admin/login` | — | `{ authed }` | — | |
| DELETE | `/api/admin/login` | — | `{ ok }` | — | Logout |
| GET | `/api/admin/participants` | cookie | `{ data }` | participants | |
| PATCH | `/api/admin/participants` | id + updates | `{ success, data }` | participants | PATCH genérico |
| GET | `/api/settings/public` | — | `{ dnaRapidoEnabled }` | app_settings | Fallback false |
| GET/PATCH | `/api/admin/settings` | cookie / boolean | config | app_settings | |

### Erros típicos

- 400: campos obrigatórios (`participants`, cursos).
- 401: admin sem cookie.
- 500: erro Supabase (mensagem exposta em JSON).

---

## 12. Área administrativa

| Tela admin | Caminho | Função | Tabelas/API |
|------------|---------|--------|-------------|
| Login + leads | `/admin` | CRM, PDF, WhatsApp copy, toggle DNA Rápido | participants, app_settings, login |
| Cursos | `/admin/cursos` | CRUD + CSV | courses |

**Login:** senha `ADMIN_PASSWORD` (env); fallback **`admin123`** no código se env ausente — **risco de segurança**.

**Não há:** edição de perguntas/perfis/PDF pelo admin (tudo em `dna-data.ts` + deploy).

**Export:** não há CSV/export de leads no código.

---

## 13. Configurações e variáveis de ambiente

| Variável | Finalidade | Obrigatória? | Observação |
|----------|------------|--------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase | Sim | Pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon | Sim | Usada server-side nas API routes |
| `ADMIN_PASSWORD` | Login `/admin` | Recomendada | Default fraco no código |
| `NODE_ENV` | Analytics Vercel | Auto | production → Analytics |

Sem chaves de email, WhatsApp API, storage ou PDF server-side.

---

## 14. Integrações externas

| Integração | Onde aparece | Finalidade | Status aparente |
|------------|--------------|------------|-----------------|
| Supabase | APIs | PostgreSQL | Ativo |
| Vercel Analytics | `app/layout.tsx` | Métricas | Produção only |
| WhatsApp | Admin UI | Copiar texto manual | Sem API |
| Email | — | — | Não implementado |
| CRM / Zapier / Make / Sheets | — | — | Não encontrado |
| Meta Pixel / gtag | — | — | Não encontrado |

---

## 15. Dependências importantes (`package.json`)

| Pacote | Uso provável |
|--------|----------------|
| `next` | Framework, SSR, API routes |
| `react` / `react-dom` | UI |
| `@supabase/ssr`, `@supabase/supabase-js` | Banco |
| `html2canvas`, `jspdf` | PDF client-side |
| `tailwindcss`, Radix UI | UI / componentes |
| `zod`, `react-hook-form` | Presentes; funil usa validação manual |
| `recharts` | Presente; radar custom SVG no admin |
| `@vercel/analytics` | Analytics |
| `lucide-react` | Ícones (ui/) |

---

## 16. Pontos frágeis / riscos da versão atual

| Risco | Arquivo/Área | Impacto | Recomendação V2 |
|-------|--------------|---------|-----------------|
| Dados monolíticos em TS | `lib/dna-data.ts` | Deploy para mudar copy/perguntas | CMS ou JSON versionado V2 |
| PDF acoplado a PROFILES | `result-pdf.tsx` | Arquivo ~1100+ linhas | Duplicar template V2 |
| Funil sem URL/deep link | `app/page.tsx` | Refresh perde estado | Rotas V2 |
| POST/PATCH públicos | `api/participants` | Spam / abuso | Rate limit, captcha V2 |
| Anon key no server | supabase/server | Depende de RLS | Revisar policies |
| Senha admin default | `admin/login` | Acesso indevido | Env obrigatório + secret manager |
| Imagens PDF ausentes | `public/` vs paths | PDF incompleto | Validar assets |
| `ignoreBuildErrors: true` | next.config | Erros TS em prod | Corrigir antes V2 |
| Quiz progress diverge | `quiz.tsx` | UX inconsistente rápido vs completo | Documentar ou unificar na V2 |
| Validação escolaridade só client | registration | Dados inconsistentes | Validar no backend V2 |
| Respostas não salvas mid-quiz | quiz | Perda se sair da página | Opcional na V2 |
| `lib/supabase/client.ts` unused | lib | Confusão | Remover só na V2 ou V1 com cuidado |

---

## 17. O que pode ser reaproveitado na V2

| Item | Reaproveitar? | Motivo | Cuidados |
|------|---------------|--------|----------|
| Paleta / tipografia / Logo | Sim | Identidade madura | Extrair tokens |
| Layout landing/cadastro | Com adaptação | Boa UX | Não alterar V1 |
| `ResultPDF` / pipeline html2canvas | Com adaptação | Investimento alto | Copiar para `dna-v2/pdf` |
| Estrutura `PROFILES` | Sim | Base de conteúdo | Versionar slugs |
| Cliente Supabase SSR | Sim | Padrão estabelecido | Novas tabelas V2 |
| Admin list/detail | Parcial | CRM útil | Rotas `/admin/v2` |
| Algoritmo contagem A–E | Copiar | Simples e testável | Novos pesos na V2 |
| `QUESTIONS` | Copiar/adaptar | 24 perguntas validadas | DNA Financeiro pode ter outro set |
| Tabela `participants` | Não misturar | V1 em produção | `participants_v2` ou coluna `versao` |
| API `/api/participants` | Não alterar | Contrato V1 | `/api/v2/...` |

---

## 18. Recomendações para V2 sem mexer na V1

1. **Rotas isoladas:** `/v2`, `/dna-v2` ou subdomínio staging.
2. **Código:** prefixo `dna-v2` em `app/`, `components/`, `lib/`.
3. **Banco:** novas tabelas ou colunas nullable + `versao_questionario`; migrations **aditivas**.
4. **Algoritmo:** copiar `finishQuiz` para módulo V2; não editar `quiz.tsx` V1.
5. **PDF:** duplicar `result-pdf.tsx` → `result-pdf-v2.tsx`.
6. **Feature flag:** estender `app_settings` ou nova chave `dna_v2_enabled`.
7. **Testes:** comparar distribuição de perfis V1 vs V2 com fixtures.
8. **Deploy:** Vercel preview branches; V1 permanece em `main` estável.

### Estrutura sugerida

```
app/dna-v2/
components/dna-v2/
lib/dna-v2/
lib/dna-v2/scoring/
lib/dna-v2/pdf/
types/dna-v2/
scripts/ ou supabase/migrations/   # apenas novas migrations
```

---

## 19. Plano técnico sugerido para V2 (fases)

| Fase | Objetivo | Arquivos prováveis | Risco | Testes |
|------|----------|-------------------|-------|--------|
| 0 | Backup + este RAIO-X | docs | Baixo | Revisão humana |
| 1 | Scaffold rotas V2 | `app/dna-v2/*` | Baixo | Build |
| 2 | Modelagem DB V2 | SQL migrations | Médio | Staging Supabase |
| 3 | Questionário V2 | `lib/dna-v2/questions` | Médio | E2E manual |
| 4 | Scoring V2 | `lib/dna-v2/scoring` | Alto | Unitários vs V1 |
| 5 | Resultado V2 | components V2 | Médio | Snapshot UI |
| 6 | PDF V2 | copy template | Médio | PDF visual |
| 7 | Admin V2 | admin routes | Médio | Auth |
| 8 | Comparação V1×V2 | scripts test | Alto | Relatório diffs |
| 9 | Feature flag prod | app_settings | Médio | Smoke V1 + V2 |

---

## 20. Checklist — não quebrar a V1

- [ ] V1 continua em `/` inalterada
- [ ] Questionário 24 perguntas intacto
- [ ] DNA Rápido opcional via settings intacto
- [ ] `/resultado` e PDF V1 intactos
- [ ] Migrations V2 só aditivas
- [ ] Admin V1 funcional
- [ ] Build CI passa
- [ ] V2 isolada por rota/config
- [ ] Nenhuma remoção de coluna/tabela V1

---

## 21. Resumo executivo para criação da V2

### O que existe hoje

- Funil **SPA-like** em uma página com cadastro, quiz (completo 24 ou rápido 10), agradecimento sem revelar perfil.
- **Scoring** por contagem A–E; perfis e textos ricos em **`lib/dna-data.ts`**.
- **PDF premium** client-side, acionado via admin ou URL `/resultado`.
- **Supabase** com `participants`, `courses`, `app_settings`.
- **Admin** com senha por cookie, CRM básico, gestão de cursos, toggle DNA Rápido.

### O que pode ser reaproveitado

- Identidade visual, estrutura de perfis, pipeline PDF, padrão Supabase/API, fluxo mental do CRM admin.

### O que deve ser separado

- Rotas, componentes de quiz, scoring, APIs de persistência, templates PDF e perguntas da **V2 (ex. DNA Financeiro)**.

### Maior risco técnico

- **Acoplamento** de conteúdo + cálculo + PDF em poucos arquivos grandes (`dna-data.ts`, `result-pdf.tsx`) e **API pública** de participantes — qualquer mudança na V1 para “servir” V2 pode quebrar produção.

### Melhor caminho

- **Fork lógico** (cópia/adaptação), **rotas e tabelas novas**, **feature flags**, validar V2 em staging com testes comparativos — **sem tocar** no funil `/` até aprovação explícita.

---

## 22. Trava de aprovação (obrigatória)

**Antes de qualquer implementação futura da V2, a equipe deve aprovar este arquivo `RAIO-X-DNA-FINANCEIRO.md`.**

Até lá:

- Não iniciar codificação da V2.
- Não alterar fluxos V1 “de passagem”.
- Usar este documento como contrato de entendimento do sistema atual.

---

## Apêndice A — Principais arquivos analisados

`app/page.tsx`, `app/layout.tsx`, `app/resultado/page.tsx`, `components/dna/*`, `lib/dna-data.ts`, `lib/app-settings.ts`, `lib/supabase/*`, `app/api/**/*.ts`, `app/admin/**`, `scripts/*.sql`, `package.json`, `next.config.mjs`, `.env.example`, `README.md`.

## Apêndice B — Rotas App Router (páginas)

| Rota | Tipo |
|------|------|
| `/` | Funil V1 |
| `/resultado` | PDF preview |
| `/admin` | Admin leads |
| `/admin/cursos` | Admin cursos |
