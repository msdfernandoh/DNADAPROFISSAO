# Plano de implementação faseado — Plataforma configurável de questionários

> **Status:** plano executável (sem implementação automática)  
> **Base:** [`RAIO-X-DNA-FINANCEIRO.md`](./RAIO-X-DNA-FINANCEIRO.md), [`ANALISE-PLATAFORMA-QUESTIONARIOS-E-PDF.md`](./ANALISE-PLATAFORMA-QUESTIONARIOS-E-PDF.md)  
> **Princípio:** commits pequenos, V1 intocada, rotas/APIs/tabelas **novas** até homologação explícita.

---

## Visão do objetivo final

| # | Capacidade | Fase alvo (MVP vs depois) |
|---|------------|---------------------------|
| 1 | Criar questionários | MVP — Fases 1, 3 |
| 2 | Criar perfis | MVP — Fases 1, 3 |
| 3 | Criar perguntas | MVP — Fase 4 |
| 4 | Criar alternativas | MVP — Fase 4 |
| 5 | Definir pesos por perfil | MVP — Fase 4 |
| 6 | Textos relatório/PDF sem mudar layout | Pós-MVP — Fases 8–9 |
| 7 | Publicar questionário | MVP — Fase 5 |
| 8 | Captar leads | MVP — Fase 6 |
| 9 | Salvar respostas | MVP — Fase 6 |
| 10 | Calcular resultado | MVP — Fases 2, 6 |
| 11 | Gerar/visualizar relatório layout padrão | Pós-MVP — Fases 8–9 |
| 12 | Multiunidade, vendedores, créditos | Fase 10 |

---

## Convenções do plano

- **Prefixo sugerido de branch por fase:** `platform/fase-N-descricao-curta` (ex.: `platform/fase-2-calculation-engine`).
- **APIs V2:** namespace `/api/v2/...` (nunca alterar contrato V1).
- **Admin V2:** rotas sob `/admin/questionarios/...`; reutilizar auth existente (`dna_admin_session`) até Fase 10 evoluir permissões.
- **Um commit = uma unidade de valor testável** (ver sugestão por fase); PR pequeno preferível a PR monolítico.

---

## FASE 0 — Segurança e backup

### 1. Objetivo

Garantir que a V1 em produção está documentada, versionada e verificável **antes** de qualquer código de plataforma.

### 2. Arquivos novos previstos

- `docs/SMOKE-TEST-V1.md` (opcional, checklist manual)
- Tag git anotada ou branch de referência documentada no README interno

### 3. Arquivos existentes que podem ser alterados

- `README.md` (apenas seção “Plataforma V2” / links para estes planos)
- `.env.example` (comentários futuros `V2_*`, **sem** secrets)

### 4. Arquivos proibidos

Todos os listados em [Arquivos que não podem ser tocados sem aprovação](#arquivos-que-não-podem-ser-tocados-sem-aprovação) — **nenhuma alteração funcional na Fase 0**.

### 5. Tabelas envolvidas

Nenhuma (somente leitura do Supabase produção/staging se necessário para inventário).

### 6. APIs previstas

Nenhuma nova.

### 7. Testes

**Smoke test V1 (manual, ~15 min):**

| Passo | Rota / ação | Resultado esperado |
|-------|-------------|-------------------|
| 1 | `/` landing → cadastro → quiz completo | Thank you sem erro |
| 2 | Admin login `/admin` | Lista leads |
| 3 | Lead com quiz done | Link PDF `/resultado?...` abre |
| 4 | DNA Rápido (se habilitado) | 10 perguntas, PATCH ok |
| 5 | `/admin/cursos` | CRUD/import não quebrado |
| 6 | `npm run build` | Build passa |

### 8. Riscos

- Trabalhar direto em `main` sem tag → rollback difícil.
- Staging desatualizado vs produção → falso “V1 ok”.

### 9. Critério de aceite

- [ ] Tag ou branch `v1-baseline-YYYY-MM-DD` criada e anotada no plano/changelog interno.
- [ ] Smoke test V1 documentado e executado em staging (e produção só leitura se aplicável).
- [ ] Lista de arquivos proibidos acordada com o time.
- [ ] Supabase: backup/snapshot confirmado (painel ou política do projeto).

### 10. Sugestão de commit

```text
docs: baseline V1 smoke test and platform implementation plan
```

### Checklist operacional Fase 0

**Arquivos proibidos de alterar (implementação V2):**

- `app/page.tsx`
- `app/resultado/page.tsx`
- `components/dna/result-pdf.tsx`
- `components/dna/quiz.tsx`
- `components/dna/registration.tsx`
- `lib/dna-data.ts`
- `app/api/participants/route.ts`
- `app/admin/page.tsx`

**Backup:**

- Export/schema dump Supabase (participants, courses, app_settings).
- Snapshot Vercel deployment atual (anotar URL + commit SHA).

**Branch recomendada:**

- `main` permanece estável; trabalho em `platform/main` ou branches `platform/fase-*` com merge via PR.

**Ambiente:**

- Projeto Supabase **staging** (ou branch DB) para Fases 1+; produção só após checklist da fase.

---

## FASE 1 — Banco configurável mínimo

### 1. Objetivo

Criar **somente** tabelas do motor de questionários (sem relatório, sem multiunidade).

### 2. Arquivos novos previstos

- `scripts/008_questionnaire_platform_core.sql` (ou `supabase/migrations/...`)
- `types/questionnaire-platform.ts` (tipos espelhando DB, opcional nesta fase)

### 3. Arquivos existentes que podem ser alterados

- `README.md` (como aplicar migration 008)
- `.env.example` (nenhuma var obrigatória nova na Fase 1)

### 4. Arquivos proibidos

Lista completa da seção final + qualquer componente de funil V1.

### 5. Tabelas envolvidas (detalhe)

#### `questionnaires`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | default gen_random_uuid() |
| name | TEXT NOT NULL | |
| slug | TEXT NOT NULL | UNIQUE, lowercase, regex validado na app |
| description | TEXT | nullable |
| status | TEXT NOT NULL | CHECK `draft`, `published`, `archived` |
| version | INT NOT NULL DEFAULT 1 | incremento ao republicar |
| active | BOOLEAN NOT NULL DEFAULT true | |
| scoring_mode | TEXT NOT NULL DEFAULT `per_question` | CHECK `per_question`, `normalized_sum` |
| created_at, updated_at | TIMESTAMPTZ | |

**Constraints:** UNIQUE(slug); CHECK status/scoring_mode.  
**Índices:** `questionnaires_slug_idx` (slug); `questionnaires_status_idx` (status) para listagem admin.  
**Relacionamentos:** 1:N profiles, questions, participants_v2, results.  
**Riscos:** slug colide com rotas Next (`/admin`, `/q` reservados na app).  
**Teste:** INSERT draft; UNIQUE slug falha no duplicate.

---

#### `questionnaire_profiles`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| questionnaire_id | UUID FK → questionnaires ON DELETE CASCADE | |
| code | TEXT NOT NULL | ex. A, LID — UNIQUE por questionário |
| name | TEXT NOT NULL | |
| short_description, long_description | TEXT | nullable |
| color, icon | TEXT | nullable |
| sort_order | INT NOT NULL DEFAULT 0 | desempate cálculo |
| active | BOOLEAN DEFAULT true | |

**Constraints:** UNIQUE(questionnaire_id, code).  
**Índices:** `(questionnaire_id, sort_order)`.  
**Teste:** CASCADE delete questionnaire remove perfis.

---

#### `questions`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| questionnaire_id | UUID FK CASCADE | |
| text | TEXT NOT NULL | |
| description | TEXT | |
| order | INT NOT NULL | UNIQUE(questionnaire_id, order) recomendado |
| type | TEXT DEFAULT `single_choice` | extensível depois |
| required, active | BOOLEAN | |

**Índices:** `(questionnaire_id, order)`.  
**Teste:** ordenação estável na listagem.

---

#### `alternatives`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| question_id | UUID FK CASCADE | |
| text | TEXT NOT NULL | |
| order | INT NOT NULL | |
| active | BOOLEAN | |

**Índices:** `(question_id, order)`.  
**Teste:** ≥2 alternativas por pergunta (validação na app Fase 4).

---

#### `alternative_weights`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| alternative_id | UUID FK CASCADE | |
| profile_id | UUID FK → questionnaire_profiles CASCADE | |
| weight | INT NOT NULL DEFAULT 0 | CHECK weight >= 0 |

**Constraints:** UNIQUE(alternative_id, profile_id).  
**Índices:** `(alternative_id)`, `(profile_id)`.  
**Teste:** peso negativo rejeitado no DB.

---

#### `participants_v2`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| questionnaire_id | UUID FK → questionnaires | nullable até escolher teste |
| name, phone, email | TEXT NOT NULL | |
| city, course_interest, escolaridade | TEXT | nullable |
| vendor_slug | TEXT | nullable (sem FK sellers até Fase 10) |
| status | TEXT NOT NULL DEFAULT `Aguardando teste` | |
| notes | TEXT | |
| quiz_completed | BOOLEAN DEFAULT false | |
| quiz_completed_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

**Nota:** **Não** criar `unit_id` nesta fase (Fase 10).  
**Índices:** `(questionnaire_id, created_at DESC)`, `(email)` opcional para busca admin.  
**Riscos:** RLS ausente → dados expostos via anon key; definir policies mínimas na mesma migration ou commit seguinte `008b_rls_questionnaire_platform.sql`.  
**Teste:** INSERT lead v2 não aparece em `participants` V1.

---

#### `questionnaire_answers`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| questionnaire_id | UUID FK | |
| participant_id | UUID FK → participants_v2 CASCADE | |
| question_id | UUID FK → questions | |
| alternative_id | UUID FK → alternatives | |
| created_at | TIMESTAMPTZ | |

**Constraints:** UNIQUE(participant_id, question_id).  
**Índices:** `(participant_id)`, `(questionnaire_id)`.  
**Teste:** segunda resposta mesma pergunta → upsert ou erro conforme política API.

---

#### `questionnaire_results`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| questionnaire_id | UUID FK | |
| participant_id | UUID FK UNIQUE | 1 resultado por lead |
| scores | JSONB NOT NULL | Record code → number |
| percentages | JSONB NOT NULL | |
| main_profile_id, secondary_profile_id | UUID FK profiles | |
| result_code | TEXT | ex. `A-B` |
| created_at | TIMESTAMPTZ | |

**Teste:** FK profile_id pertence ao mesmo questionnaire_id (validar na API ou trigger opcional Fase 5).

**Deixar para depois:** `report_*`, `units_v2`, `sellers_v2`, `credit_events_v2`, `admin_users_v2`.

### 6. APIs previstas

Nenhuma (somente SQL + apply staging).

### 7. Testes

- Apply migration em staging.
- Queries manuais: insert questionnaire + 2 profiles + 1 question + 2 alternatives + weights.
- Confirmar zero impacto: V1 funil ainda usa `participants`.

### 8. Riscos

- Migration quebrada bloqueia deploy → testar só staging primeiro.
- RLS permissiva demais.

### 9. Critério de aceite

- [ ] 8 tabelas criadas conforme spec.
- [ ] V1 smoke test repassou após migration em staging.
- [ ] Documentado no README como rodar `008_...sql`.

### 10. Sugestão de commit

```text
db: add questionnaire platform core tables (v2, additive)
```

**Commit opcional separado (recomendado):**

```text
db: RLS policies for questionnaire platform tables
```

---

## FASE 2 — Motor de cálculo genérico

### 1. Objetivo

Implementar `calculateQuestionnaireResult` **puro** (sem DB, sem UI), com testes e paridade conceitual V1 (pesos 1, uma resposta por pergunta).

### 2. Arquivos novos previstos

- `lib/questionnaire-engine/types.ts`
- `lib/questionnaire-engine/calculate-result.ts`
- `lib/questionnaire-engine/index.ts` (re-exports)
- `lib/questionnaire-engine/__tests__/calculate-result.test.ts` (ou `vitest`/`node:test` conforme projeto)
- `lib/questionnaire-engine/__fixtures__/dna-profissao-v1-equivalent.json`

### 3. Arquivos existentes que podem ser alterados

- `package.json` (apenas se adicionar script `test:engine` e devDependency de test runner — **commit separado**)

### 4. Arquivos proibidos

Funil V1, `quiz.tsx`, `dna-data.ts` (não importar PROFILES/QUESTIONS no motor — fixtures isoladas).

### 5. Tabelas envolvidas

Nenhuma (entrada/saída in-memory).

### 6. APIs previstas

Nenhuma.

### 7. Testes

**Regras implementadas:**

1. Scores zero por perfil ativo.
2. Somar pesos por resposta.
3. Percentuais: default `per_question` → `round(score / answeredCount * 100)` por perfil **ou** política documentada igual V1 (contagem/N por perfil independente — **replicar V1:** cada resposta +1 em um perfil → pct[k]=round(count[k]/N*100)).
3. Ranking desc por score; desempate `sort_order` asc.
4. `mainProfile`, `secondaryProfile` = códigos (strings).
5. `resultCode = `${main}-${secondary}``.

**Fixtures:**

- 5 perfis A–E, 3 perguntas, pesos estilo V1 → comparar com saída manual de `finishQuiz`.
- Empate main: sort_order menor vence.
- Alternativa com todos pesos 0 → alerta em validador separado (`validateQuestionnaireConfig`, opcional nesta fase).

### 8. Riscos

- Divergência de percentual vs V1 se usar `normalized_sum` por engano.
- Sem testes → regressão silenciosa na Fase 6.

### 9. Critério de aceite

- [ ] Testes automatizados verdes localmente e CI (se existir).
- [ ] Nenhum import de `@/lib/dna-data` no engine.
- [ ] Documentação JSDoc da função pública.

### 10. Sugestão de commit

```text
feat(engine): add calculateQuestionnaireResult with unit tests
```

---

## FASE 3 — Admin básico de questionários

### 1. Objetivo

CRUD mínimo: questionários (draft) + perfis; navegação admin sem tocar `/admin` V1.

### 2. Arquivos novos previstos

- `app/admin/questionarios/layout.tsx` (nav secundária, auth guard reutilizado)
- `app/admin/questionarios/page.tsx` (lista)
- `app/admin/questionarios/novo/page.tsx`
- `app/admin/questionarios/[id]/page.tsx` (overview + links)
- `app/admin/questionarios/[id]/perfis/page.tsx`
- `app/api/v2/admin/questionnaires/route.ts` (GET, POST)
- `app/api/v2/admin/questionnaires/[id]/route.ts` (GET, PATCH)
- `app/api/v2/admin/questionnaires/[id]/profiles/route.ts` (GET, POST, PATCH, DELETE)
- `lib/questionnaire-platform/auth.ts` (wrapper `isAdmin` cookie)

### 3. Arquivos existentes que podem ser alterados

- `app/admin/layout.tsx` (link discreto “Questionários (V2)” — **opcional**, commit separado)
- `components/dna/logo.tsx` — não necessário

### 4. Arquivos proibidos

`app/admin/page.tsx` (CRM V1 intacto).

### 5. Tabelas envolvidas

`questionnaires`, `questionnaire_profiles`.

### 6. APIs previstas

| Método | Rota | Auth |
|--------|------|------|
| GET | `/api/v2/admin/questionnaires` | admin cookie |
| POST | `/api/v2/admin/questionnaires` | admin |
| GET/PATCH | `/api/v2/admin/questionnaires/[id]` | admin |
| CRUD | `/api/v2/admin/questionnaires/[id]/profiles` | admin |

### 7. Testes

- Criar questionário draft, slug único.
- Adicionar 2 perfis, reorder sort_order.
- 401 sem cookie admin.

### 8. Riscos

- Duplicar lógica auth → extrair helper único.
- Slug inválido quebrando rota `/q/[slug]` futura.

### 9. Critério de aceite

- [ ] Lista + criar + editar metadados + CRUD perfis funcional em staging.
- [ ] V1 admin leads inalterado.

### 10. Sugestão de commit(s)

```text
feat(admin): questionnaire list and create (v2 API)
```

```text
feat(admin): profile CRUD for questionnaires
```

---

## FASE 4 — Admin de perguntas, alternativas e pesos

### 1. Objetivo

Montar questionário completo no admin: perguntas, alternativas, matriz de pesos; permanece `draft`.

### 2. Arquivos novos previstos

- `app/admin/questionarios/[id]/perguntas/page.tsx`
- `components/questionnaire-admin/WeightMatrix.tsx` (UI matriz)
- `components/questionnaire-admin/QuestionEditor.tsx`
- `app/api/v2/admin/questionnaires/[id]/questions/route.ts`
- `app/api/v2/admin/questionnaires/[id]/questions/[questionId]/route.ts`
- `app/api/v2/admin/questionnaires/[id]/questions/[questionId]/alternatives/route.ts`
- `app/api/v2/admin/questionnaires/[id]/weights/route.ts` (bulk upsert)
- `lib/questionnaire-engine/validate-config.ts` (soft validation, warnings)

### 3. Arquivos existentes que podem ser alterados

- `app/admin/questionarios/[id]/page.tsx` (link “Perguntas”)

### 4. Arquivos proibidos

V1 quiz/dna-data.

### 5. Tabelas envolvidas

`questions`, `alternatives`, `alternative_weights`.

### 6. APIs previstas

REST aninhado sob `/api/v2/admin/questionnaires/[id]/...` + bulk weights.

### 7. Testes

- Criar 5 perguntas × 5 alternativas × pesos.
- Salvar e recarregar matriz idempotente.
- Warning se perfil nunca pontua.

### 8. Riscos

- Payload grande no bulk → transação única ou batch.
- UX matriz confusa → validar com 5 perfis primeiro.

### 9. Critério de aceite

- [ ] Admin consegue montar questionário equivalente simplificado (ex. 5 perguntas) sem SQL manual.
- [ ] Status permanece draft até Fase 5.

### 10. Sugestão de commit(s)

```text
feat(admin): questions and alternatives CRUD (v2)
```

```text
feat(admin): alternative weight matrix bulk save
```

---

## FASE 5 — Publicação com validação

### 1. Objetivo

Endpoint e UI **Publicar** com checklist bloqueante; version bump opcional.

### 2. Arquivos novos previstos

- `lib/questionnaire-engine/publish-checklist.ts`
- `app/api/v2/admin/questionnaires/[id]/publish/route.ts` (POST)
- `app/api/v2/admin/questionnaires/[id]/unpublish/route.ts` (POST, opcional)
- UI: botão + modal checklist em `[id]/page.tsx`

### 3. Arquivos existentes que podem ser alterados

- `app/admin/questionarios/[id]/page.tsx`

### 4. Arquivos proibidos

V1.

### 5. Tabelas envolvidas

Leitura em todas core; update `questionnaires.status`, `version`.

### 6. APIs previstas

- `POST .../publish` → roda checklist + `status=published`
- `GET .../publish/preview` → dry-run checklist (opcional)

**Checklist (bloqueante):**

- ≥ 2 perfis ativos  
- ≥ 5 perguntas ativas  
- ≥ 2 alternativas por pergunta  
- Toda alternativa: soma pesos > 0  
- Nenhum peso < 0  
- Todo perfil ativo: ∑pesos > 0 em alguma alternativa  
- Simulação: respostas dummy (primeira alt de cada pergunta) → engine retorna main e secondary  

### 7. Testes

- Publicar questionário incompleto → 400 com lista erros.
- Publicar válido → slug disponível para Fase 6.
- Arquivar republicação incrementa version (se implementado).

### 8. Riscos

- Publicar config que empata sempre → aceitar com warning não bloqueante.
- Questionário publicado editado → política: só draft editable ou nova version (documentar: **MVP = bloquear edição estrutural se published** ou exigir unpublish).

### 9. Critério de aceite

- [ ] Impossível `published` sem checklist verde.
- [ ] Teste integração engine + DB config passa.

### 10. Sugestão de commit

```text
feat(admin): publish questionnaire with validation checklist
```

---

## FASE 6 — Funil público genérico

### 1. Objetivo

Rota **`/q/[slug]`** isolada: cadastro, quiz dinâmico, persistência answers + result, thank you simples (**sem PDF**).

### 2. Arquivos novos previstos

- `app/q/[slug]/page.tsx` (orquestrador)
- `app/q/[slug]/layout.tsx` (metadata)
- `components/questionnaire-public/RegistrationV2.tsx`
- `components/questionnaire-public/QuizV2.tsx`
- `components/questionnaire-public/ThankYouV2.tsx`
- `app/api/v2/questionnaires/public/[slug]/route.ts` (GET published config: perguntas, alternativas — **sem pesos expostos**)
- `app/api/v2/participants/route.ts` (POST/PATCH participants_v2)
- `app/api/v2/participants/[id]/answers/route.ts` (POST batch ou per answer)
- `app/api/v2/participants/[id]/complete/route.ts` (calcula + grava result)

### 3. Arquivos existentes que podem ser alterados

- `middleware.ts` (se existir, rate limit opcional — commit separado)
- `app/sitemap.ts` — **não** indexar `/q/*` draft

### 4. Arquivos proibidos

`app/page.tsx`, `quiz.tsx`, `registration.tsx`, `thank-you.tsx` V1, `app/api/participants/route.ts`.

### 5. Tabelas envolvidas

Todas core + writes em answers/results.

### 6. APIs previstas

| Método | Rota | Público |
|--------|------|---------|
| GET | `/api/v2/questionnaires/public/[slug]` | sim (published only) |
| POST/PATCH | `/api/v2/participants` | sim |
| POST | `/api/v2/participants/[id]/answers` | sim |
| POST | `/api/v2/participants/[id]/complete` | sim (server-side calculate) |

**Importante:** cálculo no **servidor** na complete (não confiar no client).

### 7. Testes

- E2E manual: slug publicado → 5 perguntas → lead + answers + result no DB.
- Slug draft → 404.
- Pesos não aparecem no JSON público.
- V1 `/` inalterado.

### 8. Riscos

- Spam POST → rate limit / honeypot (backlog).
- Expor UUID questionário → usar slug only.

### 9. Critério de aceite

- [ ] Fluxo completo MVP funcional em staging.
- [ ] `participants` V1 não recebe inserts do funil V2.

### 10. Sugestão de commit(s)

```text
feat(api): public questionnaire fetch and v2 participants
```

```text
feat(funnel): public quiz flow at /q/[slug]
```

---

## FASE 7 — Admin comercial dos leads V2

### 1. Objetivo

Listar leads e resultados por questionário (CRM mínimo V2).

### 2. Arquivos novos previstos

- `app/admin/questionarios/[id]/leads/page.tsx`
- `app/api/v2/admin/questionnaires/[id]/participants/route.ts` (GET lista + filtros)
- `components/questionnaire-admin/ResultSummary.tsx` (barras % por perfil)
- Reutilizar `RadarChart` **via novo wrapper** que aceita códigos dinâmicos — **não** alterar comportamento V1 admin se extraído; preferível `components/questionnaire-admin/RadarChartV2.tsx` copiado/adaptado.

### 3. Arquivos existentes que podem ser alterados

- `app/admin/questionarios/[id]/page.tsx` (link Leads)

### 4. Arquivos proibidos

`app/admin/page.tsx`.

### 5. Tabelas envolvidas

`participants_v2`, `questionnaire_results`, join profiles.

### 6. APIs previstas

- GET admin participants by questionnaire_id
- PATCH status/notes (opcional MVP)

### 7. Testes

- Após funil Fase 6, lead aparece na lista com main/secondary/%.
- Filtro por data.

### 8. Riscos

- PII exposto → admin auth obrigatório.

### 9. Critério de aceite

- [ ] Consultor vê resultado V2 sem acessar Supabase manualmente.
- [ ] Sem link PDF ainda (ok MVP).

### 10. Sugestão de commit

```text
feat(admin): v2 leads list and result summary per questionnaire
```

---

## FASE 8 — Relatório configurável (sem alterar layout V1)

### 1. Objetivo

Tabelas de conteúdo + editor admin + **preview HTML simples**; copiar layout PDF para componente novo.

### 2. Arquivos novos previstos

- `scripts/009_questionnaire_report_content.sql` (`report_templates`, `report_sections`, `report_contents`)
- `app/admin/questionarios/[id]/relatorio/page.tsx` (abas textos)
- `app/api/v2/admin/questionnaires/[id]/report-contents/route.ts`
- `lib/questionnaire-engine/merge-report-content.ts`
- `components/questionnaire-report/ResultPDFPlatform.tsx` (**cópia** de `result-pdf.tsx`, refatorada para props genéricas)
- `app/admin/questionarios/[id]/preview/page.tsx` (iframe preview, fake participant)

### 3. Arquivos existentes que podem ser alterados

- Nenhum arquivo V1 de PDF/funil.

### 4. Arquivos proibidos

- `components/dna/result-pdf.tsx` (**proibido editar** — apenas copiar para novo path)
- `app/resultado/page.tsx`

### 5. Tabelas envolvidas

`report_templates`, `report_sections`, `report_contents`.

### 6. APIs previstas

- CRUD report contents (admin)
- GET merge preview (admin)

### 7. Testes

- Seed conteúdo mínimo para 1 perfil → preview renderiza sem placeholders críticos.
- Diff visual manual vs V1 (mesmo layout).

### 8. Riscos

- Drift entre cópia e V1 PDF → congelar layout_key; merges futuros manuais.
- Escopo editor gigante → MVP editor só campos essenciais (name, subtitle, tagline, final).

### 9. Critério de aceite

- [ ] Admin edita textos salvos no DB.
- [ ] Preview admin funciona.
- [ ] `result-pdf.tsx` original byte-identical ao baseline V1 (verificar git).

### 10. Sugestão de commit(s)

```text
db: report templates and contents tables
```

```text
feat(admin): report content editor and HTML preview
```

```text
feat(report): add ResultPDFPlatform copied from v1 layout
```

---

## FASE 9 — PDF configurável

### 1. Objetivo

Download PDF a partir de `ResultPDFPlatform` + conteúdo DB; rota admin ou `/q/[slug]/resultado/[token]` (protegida).

### 2. Arquivos novos previstos

- `app/admin/questionarios/[id]/leads/[participantId]/pdf/page.tsx`
- ou `app/q/[slug]/resultado/page.tsx` (com token assinado)
- `lib/questionnaire-engine/build-pdf-props.ts`
- Botão “Gerar PDF” no admin leads

### 3. Arquivos existentes que podem ser alterados

- `app/admin/questionarios/[id]/leads/page.tsx` (link PDF)

### 4. Arquivos proibidos

`components/dna/result-pdf.tsx`, `app/resultado/page.tsx` (V1).

### 5. Tabelas envolvidas

report_contents + questionnaire_results + participants_v2.

### 6. APIs previstas

- GET PDF data bundle (admin) ou server render

### 7. Testes

- Gerar PDF 12 páginas com conteúdo customizado vs default seed.
- html2canvas smoke em staging.

### 8. Riscos

- Performance client-side; imagens ausentes (validar URLs).

### 9. Critério de aceite

- [ ] PDF baixável para lead V2 com textos do banco.
- [ ] V1 `/resultado` intacto.

### 10. Sugestão de commit

```text
feat(report): configurable PDF generation for v2 participants
```

---

## FASE 10 — Multiunidade, vendedores e créditos

### 1. Objetivo

Operação comercial avançada após motor + funil + PDF V2 validados.

### 2. Arquivos novos previstos

- `scripts/010_units_sellers_credits.sql`
- `app/admin/unidades/...` (opcional)
- `app/api/v2/admin/units/...`
- Middleware créditos por unidade
- Migrar `vendor_slug` → FK `sellers_v2` opcional
- Validação backend escolaridade (paridade registration)
- Filtros cidade no admin leads (já parcial V1)

### 3. Arquivos existentes que podem ser alterados

- `app/api/v2/participants/route.ts` (unit_id, credit debit)
- `.env.example` (flags créditos)

### 4. Arquivos proibidos

V1 funil/API participants V1 até decisão de migração.

### 5. Tabelas envolvidas

`units_v2`, `sellers_v2`, `admin_users_v2`, `credit_events_v2`; ALTER `participants_v2 ADD unit_id`.

### 6. APIs previstas

- CRUD units/sellers (admin)
- POST credit_events
- Guard: bloquear publish/funnel se crédito zero

### 7. Testes

- Lead consome 1 crédito.
- Vendedor `?v=slug` associado ao participant_v2.
- RLS por unit_id.

### 8. Riscos

- Complexidade auth; regressão comercial.

### 9. Critério de aceite

- [ ] Piloto uma unidade em staging.
- [ ] V1 continua sem créditos.

### 10. Sugestão de commit(s)

```text
db: units sellers credits schema
```

```text
feat(commercial): credit consumption and unit scoping for v2
```

---

## MVP recomendado

### Escopo mínimo que já entrega valor

Inclui **Fases 0 → 7** (exceto partes opcionais de polish), **sem** Fases 8–10:

| Entrega | Fase |
|---------|------|
| Banco core 8 tabelas | 1 |
| Motor + testes | 2 |
| Admin: questionários + perfis | 3 |
| Admin: perguntas + pesos | 4 |
| Publicar com checklist | 5 |
| Funil `/q/[slug]` + APIs v2 | 6 |
| Admin leads + resultado (% e perfis) | 7 |

### Fora do MVP (explicitamente depois)

- PDF configurável e download (Fases 8–9)
- Multiunidade, créditos, sellers_v2 formal (Fase 10)
- Migração do DNA Profissão V1 para o motor (projeto separado “V3 paridade”)
- WhatsApp template configurável (pode ser commit pequeno pós-MVP em Fase 7)
- Rate limit / captcha APIs públicas (hardening paralelo)

### Por que esse MVP é o sweet spot

- Admin **cria e publica** testes novos (DNA Financeiro, Vocacional, etc.) sem deploy de código.
- Lead **real** entra pelo link público; respostas e resultado **auditáveis** no banco.
- Consultor **vê resultado** no admin V2.
- **Zero** risco ao funil `/` e PDF `/resultado` V1.
- Escopo ~7 fases incrementais, cada uma com commit(s) revisável.

### Sequência de commits MVP (sugestão macro)

1. `docs: baseline V1 smoke test` (F0)  
2. `db: questionnaire platform core` (F1)  
3. `feat(engine): calculateQuestionnaireResult` (F2)  
4. `feat(admin): questionnaires + profiles` (F3)  
5. `feat(admin): questions + weights` (F4)  
6. `feat(admin): publish checklist` (F5)  
7. `feat(api): v2 participants + public slug` (F6a)  
8. `feat(funnel): /q/[slug] flow` (F6b)  
9. `feat(admin): v2 leads list` (F7)  

---

## Mapa de dependências entre fases

```text
F0 ──► F1 ──► F2 ──► F3 ──► F4 ──► F5 ──► F6 ──► F7 ──► MVP ✓
                                              │
                                              └──► F8 ──► F9 (PDF)
                                              │
                                              └──► F10 (commercial scale)
```

---

## Arquivos que não podem ser tocados sem aprovação

Alteração **somente** com aprovação explícita por escrito (issue/PR tag `v1-breaking-approved`):

| Arquivo | Motivo |
|---------|--------|
| `app/page.tsx` | Funil V1 produção |
| `app/resultado/page.tsx` | Entrada PDF V1 |
| `components/dna/result-pdf.tsx` | Layout PDF produção |
| `components/dna/quiz.tsx` | Questionário V1 |
| `components/dna/registration.tsx` | Cadastro V1 |
| `lib/dna-data.ts` | Perguntas, perfis, textos V1 |
| `app/api/participants/route.ts` | Contrato API leads V1 |
| `app/admin/page.tsx` | CRM admin V1 |

**Permitido sem aprovação V1:** novos paths (`app/q/*`, `app/admin/questionarios/*`, `app/api/v2/*`, `lib/questionnaire-engine/*`, `components/questionnaire-*`, migrations aditivas, docs).

---

## Controle de execução

Antes de iniciar cada fase:

1. Confirmar branch `platform/fase-N-...` a partir de `main` atualizado.
2. Re-executar smoke test V1 se a fase tocar DB ou deploy compartilhado.
3. Marcar critérios de aceite desta fase no PR.
4. **Não** iniciar fase N+1 se critérios de N pendentes.

---

## Referências

- [`ANALISE-PLATAFORMA-QUESTIONARIOS-E-PDF.md`](./ANALISE-PLATAFORMA-QUESTIONARIOS-E-PDF.md) — modelo de dados, fatiamento PDF, checklist publicação.
- [`RAIO-X-DNA-FINANCEIRO.md`](./RAIO-X-DNA-FINANCEIRO.md) — comportamento V1 de referência.

**Fim do plano — nenhuma implementação incluída neste artefato.**
