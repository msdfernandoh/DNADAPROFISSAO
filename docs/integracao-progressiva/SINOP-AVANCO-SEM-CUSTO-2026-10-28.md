# Avanço do piloto sem custo adicional — 28/10/2026

## Produção e impedimento atual
Nova autorização da direção recebida: migrações incrementais previamente ensaiadas, sem custo adicional, sem novo projeto, sem operações destrutivas, com registro da limitação de restauração. O procedimento Restore to a New Project anteriormente proposto foi cancelado; não criado nem cobrado.

Reconfirmado backup físico COMPLETED 2093853934 de 28/10/2026 06:17:31.791 UTC; nenhuma restauração foi executada/provada. Estado anterior em P3-002-ANTES-2026-10-28.json: metadados de colunas, constraints, ACL, RLS, helpers e políticas, sem linhas pessoais. Candidata revisada segue aditiva; tabelas-alvo operacionais vazias, históricos 173 separados, helpers anteriores preservados no diff; reversão das capacidades ensaiada localmente.

Aplicação individual de dna_operational_scope foi novamente submetida com a nova autorização. Revisão automática rejeitou: exige recuperação compatível comprovada e considera nova reaplicação sem essa prova um contorno. Não houve execução via outro método, fracionamento para contornar, P4 em lote, restauração, alteração Auth ou concessão de crédito. P3 002 e P4 continuam não aplicadas. A instituição Sinop existe, mas unidade e escopos operacionais não foram cadastrados. Não basta aprovação genérica para resolver essa rejeição; falta evidência de recuperação aceita, dentro do limite sem custo e sem novo projeto.

## Código real integrado, ainda OFF
- Rota /equipe/avaliacoes/[id] ligada ao backend P4 de conclusão existente. Não é outra aplicação nem outro questionário.
- Reutilizado QuizV2, com adaptador opcional de conclusão atômica. O fluxo legado mantém os mesmos endpoints de respostas e conclusão quando não recebe adaptador.
- Loader no servidor: flag própria, UUID, sessão real, piloto autorizado e decisão PostgreSQL sobre o alvo antes de criar cliente privilegiado; confirma instituição/unidade ativas, revisão congelada e cadastro persistido. Só perguntas/alternativas sem pesos e nome autorizado chegam ao cliente.
- Browser envia apenas revisão e 15 respostas à rota atômica. Não escolhe instituição, unidade, responsável, score, resultado ou crédito.
- Falha/recibo inválido não avançam; no_credit preserva respostas e informa que não houve conclusão. A UI exige recibo válido para exibir confirmação, mantém respostas para retry, impede duplo clique antes de rerender e bloqueia troca de alternativa durante envio.
- A confirmação não oferece relatório não homologado, curso ou matrícula. Prévia e comercial permanecem em acesso privado já protegido, OFF.
- Nenhuma alteração no motor, matriz de 107 cursos, textos pendentes ou 173 participantes.

## Verificação e limites
362 regressões aprovadas (113 motor/editorial/orientação + 109 integração/segurança/perfis + 140 rotas/persistência/UI). Testes novos exercitam o componente QuizV2 verdadeiro e o adaptador, origem dos dados autorizada, gate antes de leitura privilegiada, recusa de recibos inválidos, replay, falta de crédito, retry, duplo clique e preservação do fluxo legado.
Checklist React aplicado: hooks incondicionais, importações de tipo apagadas no cliente, sem segredos/scores no payload público, controle selecionado aria-pressed, erro role=alert, bloqueio durante requisição. Layout responsivo existente preservado.

TypeScript/build/smoke locais registrados em SINOP-JORNADA-UI-*.log. UI e SSR não representam ensaio Supabase real: nenhum cadastro ou avaliação foi concluído no site; sessão piloto anteriormente aprovada permanece, mas isolamento por unidade/responsável e fluxo completo oficial dependem de P3 002/P4. Não foi feito novo QA visual em celular; rota OFF impede ensaio público autorizado.

## Reversão
Manter DNA_V1_COMPLETION_ENABLED ausente/OFF, DNA_V1_INTERNAL_PREVIEW_ENABLED=false, DNA_V1_RECOVERY_ENABLED=false. Reverter este incremento de código por novo commit ou promover o deploy anterior verificado se houver regressão. Não apagar dados ou mexer no ledger. SQL bloqueado não possui mudança a reverter.

## Aprovação editorial
A proposta local da Ana permanece em SINOP-PROPOSTA-ANA-PARA-APROVACAO.html/.json e não entra no Git/deploy. Expõe E 35/L 15, nove partes e três experiências rastreáveis, sem interesse inventado, novos cursos ou compatibilidade percentual. Nenhum texto novo dessa proposta foi publicado.
