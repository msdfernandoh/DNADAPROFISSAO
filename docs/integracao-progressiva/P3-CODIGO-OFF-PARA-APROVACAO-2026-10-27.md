# P3 exclusiva de código — candidata com flags OFF

Data: 27/10/2026. Repositório oficial: DNADAPROFISSAO. Base remota confirmada nesta rodada: bfad0747b4783287e9361599e09e749a0e4a641b. A branch anterior integracao/p3-preparacao-p4-2026-10-27 e seus commits P3/P4/evidências permanecem preservados. Branch candidata: integracao/p3-codigo-off-2026-10-27.

## Pacote preparado

Recorte do código de 21345ac sobre main confirmada, sem cherry-pick em lote da branch P3/P4. Não contém scripts SQL candidatos, baseline PostgreSQL, executor/adapter de conclusão P4 nem alterações nas rotas públicas de conclusão. Inclui identidade/session proof, cookie SaaS próprio, SSR/proxy restrito, recuperação OFF, guards de recurso/ação/tenant/unidade/responsável, testes e utilitários de build/HTTP. operational-server.ts é somente wrapper de decisão booleana, sem rota de leitura de leads publicada; não habilita acesso operacional. Nenhum segredo/credencial/configuração real acompanha o pacote.

Flags: DNA_V1_ACCESS_ENABLED e DNA_V1_INTERNAL_PREVIEW_ENABLED só habilitam com valor servidor exatamente true; recuperação depende adicionalmente de DNA_V1_RECOVERY_ENABLED e segredo próprio válido. Todas OFF por padrão. LIVE_V1_CAPABILITIES mantém leadAccess, completion, billing, publicReports e courseOffers false. Não foi possível ler valores atuais da Vercel: a aprovação de publicação precisa exigir confirmação das flags OFF no destino; defaults de código não provam configuração do ambiente remoto.

Landing, componentes de questionário, cadastro/conclusão públicos, motor, matriz e painel legado não têm diff em relação à base. Proxy só corresponde a /equipe e /admin/integracao-v1. Testes de persistência e PATCH legado continuam exercitando os handlers existentes. Isso comprova regressão local, não sessão real nem consultas ao banco produtivo.

## Verificações desta rodada

260 testes locais passaram: 113 de motor/editorial/orientação já incorporados, 72 integração/identidade/P3 e 75 handlers/persistência/recuperação. Os 281 da missão anterior incluíam casos P4 e de destino do executor; sua ausência neste recorte não é regressão nem teste removido da branch P4. Nenhum ensaio de concorrência foi repetido.

TypeScript e build completo Next.js executados na cópia temporária validacao-p3-codigo-off-1793138613179, sem .env/.vercel e com endpoint loopback/chave fictícios. Build completo e TypeScript APROVADOS. As 13 verificações HTTP também PASSARAM. Smoke HTTP executa o build com ambiente sanitizado e flags ausentes, novas rotas 404 e landing 200. Logs desta rodada estão versionados em P3-OFF-TESTES-2026-10-27.log, P3-OFF-BUILD-2026-10-27.log e P3-OFF-HTTP-2026-10-27.log, neste diretório.

## Acessos atuais aos plugins

Supabase nativo: get_project e list_projects retornaram Unknown tool (-32001), apesar de ferramentas anunciadas. Nenhuma consulta SQL foi executada. Portanto não foi inspecionado schema/Auth/sessões/políticas/grants/contagens atuais, e não foi presumido sucesso com evidência histórica. Responsável deve restabelecer autenticação/funcionamento do plugin diretamente no app. Não enviar senha/token pelo chat. Não foi solicitada criação de conexão persistente nova.

Vercel: conexão anunciada ativa, mas consulta somente leitura de deployments do projeto dnadaprofissao/equipe hugo-8097s-projects retornou 403 / invalidToken. Não foi reconfirmado deployment/SHA/flags/aliases. Nenhuma configuração/deploy foi alterado. Git remoto main confirmado não equivale a deploy confirmado.

## Ativação real — passos exatos, sem executar

1. Restabelecer plugin Supabase e confirmar projeto ejcpumiypodpdmhiulwk. Rodar somente preflight já preparado na branch técnica: versão/schema, colunas auth.sessions(id,user_id,not_after), funções auth.uid/auth.jwt, RLS, grants e funções dna_private/public, instituições/vínculos/unidades e contagens de participantes/resultados/ledger. Não selecionar nomes/e-mails/respostas. Conferir o SQL candidato contra essas saídas.
2. Sem escrita em produção, pode-se revisar allowlist/Site URL/SMTP/roles/flags e validar defaults/rotas OFF. Sem conta fictícia existente autorizada não é possível comprovar login JWT real. Criar/alterar conta, recuperar senha ou enviar e-mail exige autorização específica, inclusive destino controlado.
3. Para piloto no projeto oficial, separar aprovação de SQL P3 001 de sessão da P3 002 de escopo, e confirmar backup/recuperação antes de aplicar. Publicar código OFF não aplica nenhum deles. Login usa obrigatoriamente dna_current_session: sua ausência causa falha fechada; não é possível validar login ligado sem instalar/aprovar essa dependência ou usar destino Auth isolado autorizado.
4. Testar primeiro conta fictícia autorizada em ambiente/controlos aprovados: getUser + JWT real + prova de sessão; conta sem vínculo; vínculo/usuário revogado; logout e nova requisição; expiração/refresh SSR; recuperação com template fixo, segredo próprio, redirect allowlist e canal de e-mail controlado. Não reutilizar senha fraca ou participante real. Restauração/backup atual ainda exige comprovação própria.
5. Instituição diferente/unidade não atribuída e relatórios exigem escopo real P3 002 e fixtures autorizadas, sem participantes reais. **A P3 atual não expõe rotas operacionais de leads/relatórios reais.** Suas negativas SQL foram testadas localmente; o teste completo navegador->rota->banco fica para o incremento que conecte uma rota privada mínima, mantendo conteúdo não homologado bloqueado. Não afirmar que publicar recuperação comprova isolamento operacional completo.
6. Não enviar convites ou e-mails reais, não mudar SMTP/Auth/flags/RLS, não criar usuários/unidades, não conceder permissões durante esta preparação. Convites/criação/ativação piloto necessitam aprovação própria. Manter público bloqueado enquanto isolamento não estiver comprovado.

## P4 e compatibilidade

A candidata P4, o ledger único, idempotência/débito único, auditoria e snapshot imutável ficam na branch técnica anterior. Nenhum arquivo do motor ou catálogo foi modificado. Sem conexão funcional ao Supabase, **não há incompatibilidade nova comprovada com o schema atual**, e também não há comprovação de compatibilidade. Dependências concretas do código: P3 001/002; vínculo institution_id em units_v2 e participants_v2; assigned_user_id/participant_user_id; membership_unit_scopes; campos V1 de revisão/cadastro/snapshot/recibo; ACL de RPC de conclusão para service_role; unicidade/imutabilidade e estrutura auth.sessions. Isso é checklist de comparação, não afirmação de ausência dessas colunas em produção. Não aplicar SQL para descobrir por tentativa.

## Publicação e rollback

Menor incremento: este código P3 exclusivo, flags OFF, sem SQL/P4, após revisão do SHA exato e confirmação das flags no destino. Precisa aprovação específica de push/deploy; não autorizado nesta solicitação. Depois publicar, confirmar SHA/Ready/domínios e repetir smoke OFF e fluxo legado com fixtures autorizadas, sem tocar participantes reais. Caso falhe: promover deploy P2 previamente verificado ou revert por commit novo; manter flags OFF, sem reset/force-push ou exclusão de dados.

Próximo avanço de piloto: restabelecer inspeção somente leitura; aprovar separadamente dependência de sessão e teste de uma identidade fictícia; só depois ativar piloto restrito. P4 continua sem rota pública ligada e sem autorização de migração.
