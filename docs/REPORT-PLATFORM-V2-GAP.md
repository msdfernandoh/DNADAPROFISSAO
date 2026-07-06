# Relatório configurável V2 vs PDF V1

`ResultPDFPlatform.tsx` foi derivado de `components/dna/result-pdf.tsx` (cópia adaptada). **O arquivo V1 não é alterado.**

## Equivalente ao V1 (layout)

| Item | Status |
|------|--------|
| Estrutura de páginas A4 (`Page`, 794×1123) | Igual |
| Capa temática (gradientes, emoji, logo, chips, bloco personalizado) | Igual (dados configuráveis) |
| Página boas-vindas + cards 01/02/03 | Igual (textos configuráveis) |
| Página perfil principal (tagline, superpoderes, %) | Igual |
| Quem você é / analogia / como funciona / como age | Igual |
| Decisões / motiva / cansa / ambiente ideal | Igual |
| Pontos fortes / atenção / reflexão | Igual |
| Áreas de compatibilidade | Igual (JSON) |
| Cursos recomendados (até 3 páginas, 2 cursos/página) | Igual (JSON) |
| Salários de mercado | Igual (JSON + top_salary) |
| Página final (visualização, CTA comercial, rodapé) | Igual |
| Download PDF no preview admin | **Removido (Fase 8)** — Fase 9 |

## Conteúdo configurável

- **Global / capa:** `cover.*`, `global.welcome_*`, `global.compatibility_intro`, `global.closing_*`, `courses.intro_*`
- **Perfil principal:** campos `profile_main.*` (listas = uma linha por item; áreas/cursos/salários = JSON)
- **Segunda força / par:** `profile_secondary.*`, `profile_pair.synergy`
- **Tema:** `profile_main.cover_emoji`, `theme_primary*`, `cover_number`
- **Participante / motor:** nome, percentuais, perfis (não editáveis no editor de textos)

## Fallbacks quando vazio

- Listas: linha `"Conteúdo não configurado"` ou `"—"` (superpoderes: 5 placeholders)
- Áreas: uma área 0%
- Cursos: um card placeholder
- Salários: uma linha “Configure faixas salariais (JSON)”
- `topSalary` 0: exibe `—` no hero
- Tema: derivado de `questionnaire_profiles.color` quando cores não configuradas

## Ainda diferente / pendente

- **Sinergia (`profile_pair.synergy`):** campo existe no admin; **não há página dedicada no V1** (não renderizado no fluxo V1).
- **HTML rico / negrito** nos parágrafos de boas-vindas: V1 usa JSX com `<strong>`; editor grava texto puro (sem markdown).
- **Importação em massa** do conteúdo legado de `lib/dna-data.ts` para um questionário DNA clonado: manual ou script futuro.
- **Download PDF por lead:** Fase 9 (`build-pdf-props`, rota `…/report`, `html2canvas` reintroduzido na rota lead, não no preview Fase 8).

## Fase 8 vs Fase 9 vs Fase 10

Ver classificação no chat de reorganização; commits separados por fase.
