# Smoke test manual — V1 (DNA da Profissão® / DNA Profissional)

> **Propósito:** validar que o funil, admin e PDF em produção/staging continuam íntegros **antes** e **depois** de cada fase da plataforma configurável (V2).  
> **Fase:** 0 — Segurança e backup  
> **Tempo estimado:** 15–25 minutos  
> **Ambiente:** preferir **staging**; em produção, usar apenas leitura onde couber (evitar criar leads reais desnecessários).

---

## Pré-requisitos

- [ ] Variáveis de ambiente configuradas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD` recomendado).
- [ ] App rodando local (`npm run dev`) **ou** URL de staging/produção acordada.
- [ ] Acesso ao painel Supabase (backup/snapshot, se aplicável à Fase 0).
- [ ] Baseline git registrada: tag ou branch `v1-baseline-YYYY-MM-DD` (ver seção abaixo).

---

## Checklist manual — Funil público

Execute na ordem. Marque **OK** / **FALHA** / **N/A** e anote observações.

| # | Passo | Como testar | Esperado | OK? | Observações |
|---|--------|-------------|----------|-----|-------------|
| 1 | Abrir `/` | Navegar para a home | Landing carrega; CTAs visíveis; sem erro no console crítico | | |
| 2 | Iniciar cadastro | Clicar em iniciar análise / equivalente | Tela de cadastro (`Registration`) abre | | |
| 3 | Preencher cadastro | Nome, WhatsApp, email, escolaridade; curso opcional | Validação passa; inicia questionário | | |
| 4 | Questionário **completo** | Responder todas as perguntas (24) | Barra de progresso; botão final dispara conclusão | | |
| 5 | Tela de obrigado | Após última pergunta | `ThankYou` exibe mensagem; **não** exibe perfil/PDF ao usuário | | |
| 6 | DNA Rápido (se ativo) | Admin: toggle DNA Rápido **ou** `app_settings` | Botão “DNA Rápido” no cadastro; 10 perguntas; thank you ok | | N/A se desligado |
| 7 | Persistência (opcional) | Admin ou Supabase | Lead com `quiz_completed`, perfis A–E, `percentages` | | |

**Data do teste:** _______________  
**Testador:** _______________  
**URL / commit SHA:** _______________

---

## Checklist manual — Admin V1

| # | Passo | Como testar | Esperado | OK? | Observações |
|---|--------|-------------|----------|-----|-------------|
| 8 | Abrir `/admin` | Login com senha configurada | Painel de leads carrega | | |
| 9 | Ver leads | Lista participantes | Ordenação recente; busca/filtros básicos funcionam | | |
| 10 | Lead com quiz concluído | Selecionar lead completo | Perfis principal/secundário; barras ou radar; status CRM | | |
| 11 | Link resultado / PDF | “Ver Resultado PDF” | Abre `/resultado?...` em nova aba; preview + download PDF | | |
| 12 | Copiar WhatsApp | Botão WA (lead completo) | Texto copiado com nomes de perfil | | |
| 13 | Abrir `/admin/cursos` | Menu ou URL direta | Lista cursos; CRUD/import não quebra | | |
| 14 | Config DNA Rápido (opcional) | Toggle / perguntas rápidas no admin | Salva settings sem erro | | |

---

## Checklist — Build e qualidade (CI local)

| # | Comando | Esperado | OK? | Saída resumida |
|---|---------|----------|-----|----------------|
| 15 | `npm run build` | Exit code 0 | | Ver registro Fase 0 no repositório |
| 16 | `npm run lint` | Exit code 0 ou issues conhecidos documentados | | |

---

## Confirmação final

- [ ] **Nada quebrou** no fluxo V1 acima (ou falhas documentadas com issue/link).
- [ ] Nenhum arquivo da lista **proibida** foi alterado nesta rodada de trabalho (ver abaixo).
- [ ] Backup Supabase / snapshot deployment anotado (data, responsável).

**Assinatura / aprovação para iniciar Fase 1:** _______________  **Data:** _______________

---

## Arquivos proibidos de alteração (plataforma V2)

Durante a implementação da plataforma configurável, **não alterar** estes arquivos **sem aprovação explícita** (issue/PR com tag acordada, ex. `v1-breaking-approved`):

| Arquivo | Motivo |
|---------|--------|
| `app/page.tsx` | Orquestração do funil V1 (`/`) |
| `app/resultado/page.tsx` | Entrada do PDF V1 via query string |
| `components/dna/result-pdf.tsx` | Layout e geração PDF V1 |
| `components/dna/quiz.tsx` | UI e cálculo inline do quiz V1 |
| `components/dna/registration.tsx` | Cadastro V1 |
| `lib/dna-data.ts` | Perguntas, perfis, textos e cursos V1 |
| `app/api/participants/route.ts` | API pública de leads V1 |
| `app/admin/page.tsx` | CRM, PDF link e WhatsApp V1 |

**Permitido:** novos diretórios/arquivos (`docs/`, `app/q/`, `app/admin/questionarios/`, `app/api/v2/`, `lib/questionnaire-engine/`, `scripts/` **novos** migrations, etc.) conforme [`PLANO-IMPLEMENTACAO-PLATAFORMA-QUESTIONARIOS.md`](../PLANO-IMPLEMENTACAO-PLATAFORMA-QUESTIONARIOS.md).

---

## Git — branch e baseline recomendados

### Branch de trabalho (Fase 0)

```text
platform/fase-0-seguranca-v1
```

Use esta branch para commits **somente de documentação** da Fase 0 (ex.: este smoke test, notas de baseline). Implementação funcional V2 inicia a partir de `main` atualizado após Fase 0 aprovada.

### Tag ou referência de baseline V1

Antes de mergear qualquer código V2 em `main`, registrar um ponto de restauração:

```text
v1-baseline-YYYY-MM-DD
```

Exemplo: `v1-baseline-2026-07-06`

**Como criar (quando autorizado):**

```bash
git tag -a v1-baseline-2026-07-06 -m "V1 baseline before questionnaire platform"
```

Anotar no changelog interno:

- SHA do commit tagueado
- URL do deploy Vercel correspondente
- Data do smoke test executado neste documento

---

## Backup recomendado (Fase 0)

| Item | Ação |
|------|------|
| Supabase | Export/schema ou snapshot do projeto (staging + produção conforme política) |
| Git | Tag `v1-baseline-YYYY-MM-DD` no commit estável |
| Vercel | Anotar deployment ID / URL de produção |
| Env | Confirmar secrets no painel (sem commitar `.env`) |

---

## Referências

- [`PLANO-IMPLEMENTACAO-PLATAFORMA-QUESTIONARIOS.md`](../PLANO-IMPLEMENTACAO-PLATAFORMA-QUESTIONARIOS.md) — Fase 0  
- [`ANALISE-PLATAFORMA-QUESTIONARIOS-E-PDF.md`](../ANALISE-PLATAFORMA-QUESTIONARIOS-E-PDF.md)  
- [`RAIO-X-DNA-FINANCEIRO.md`](../RAIO-X-DNA-FINANCEIRO.md)

---

## Histórico de execuções

| Data | Ambiente | Commit SHA | Build | Lint | Resultado geral | Notas |
|------|----------|------------|-------|------|-----------------|-------|
| | | | | | | |

*(Preencher a primeira linha ao concluir a Fase 0.)*
