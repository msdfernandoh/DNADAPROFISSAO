# Publicação 2 — infraestrutura integrada, desativada

Base: a3e243fb4c7e9937459512c911280667bbc18756. Branch: integracao/publicacao-2-2026-10-27. Autorização de Fernando neste chat: executar o que falta, enviar a main/publicar o que está pronto e finalizar os incrementos técnicos seguros.

## Entrega

Motores individuais, empates, terceira camada, compositores editoriais e orientação foram incorporados seletivamente ao clone oficial. Matriz única de 107 cursos preservada. Não inclui servidor de laboratório nem rota simulate-team. Adapters em scripts/testing são exclusivamente fixtures/testes.

Criados lib/saas/flags.ts, identity.ts, server.ts e request-security.ts; API /api/v1/identity, páginas /equipe/acesso, /equipe e /admin/integracao-v1 e componentes de acesso individual. Usam Supabase Auth getUser e consultas com cliente normal, sem service_role. Estado ativo, owner explícito, memberships, instituição ativa e grants são relidos por requisição. Papéis não são achatados entre instituições. Não usam metadados editáveis como autoridade.

Flags de servidor DNA_V1_ACCESS_ENABLED e DNA_V1_INTERNAL_PREVIEW_ENABLED desligadas por padrão; nenhuma variável criada/alterada. Origem de escritas exige DNA_APP_ORIGIN exato; configuração ausente nega. Sem flags, novas rotas retornam 404 antes de acessar backend. Revisão interna exige ambas as flags, identidade ativa e proprietário global explícito. Institucional e cookie compartilhado não recebem acesso aos rascunhos. Somente sete fixtures fictícias são aceitas, sem consulta a participantes.

## Verificação

node scripts/run-v1-checks.mjs: 230 testes aprovados, zero falhas: 113 originais; 32 jornada; 26 identidade/prontidão; 27 PATCH admin; 21 persistência; 11 rotas. TypeScript completo aprovado. Build Next 16.2.6 --webpack completo passou após a última mudança, em cópia sem .env, com ambiente sanitizado e dependências existentes. Sete checks HTTP no Next de produção LOCAL retornaram 404 com flags desligadas.

A primeira repetição final da suíte foi impedida por limite de uso da revisão automática; após Fernando pedir continuação, a mesma execução autorizada funcionou. Sem contorno.

## Limites antes de ativar

É infraestrutura desativada, não SaaS operacional completo. Login foi implementado com SDK real, mas testes de credenciais/SMTP/JWT/RLS em banco real não foram feitos. Recuperação de senha, política de rate limit/captcha e revogação de sessão estrita ainda precisam ser validadas antes de ativar o acesso. Escopos de unidade/leads e concessões configuráveis completas permanecem bloqueados. Nenhum usuário pode editar permissões por esta API.

Resultado/conclusão/débito ainda não têm adaptador PostgreSQL atômico novo. A porta de transação é contrato, memória é somente teste. Sem nova cobrança, relatório público, acesso a leads ou oferta. Nenhuma migração/SQL nesta publicação; não reaplicar scripts históricos. Não ativar flags para compensar falta de schema/políticas ou teste.

Homologação Carla/academia e recuperação por restore continuam pendentes. Não mudar productionReady ou conteúdo aprovado por payload/env. Não trata os 107 cursos como homologados.

## Rollback e compatibilidade

Legado permanece no fluxo da Publicação 1; nova jornada não o substitui. Em problema, desligar flags é contenção de ativação; para rollback do código, reverter normalmente o commit deste lote ou promover o deploy anterior saudável. Não há dados/migrações para reverter. A ativação posterior é outra operação: revisar identidade, SMTP, limites, origem e testes operacionais antes.

## Evidência

PROVENIENCIA-PUBLICACAO-2.json contém hashes de origem e testes. Estado efetivo de main/deploy será registrado após confirmação. Este documento isoladamente não prova publicação.
