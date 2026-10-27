# Primeiro login real — piloto Sinop

## Entrega executada

Código de runtime: 20b51b34d3573a93a6305cdac2fbf1b42ebeaeac, integrado à main. Deploy com configuração piloto: dpl_2PSkfCCxNqddbTo9LbKXDp1h19JF, READY/Production/main, aliases oficiais confirmados. Primeiro deploy do gate ainda OFF: dpl_72asoYUVVP624Rm4hmSso4LHa857.

### Recuperação e SQL mínimo

CLI já instalada v2.115.0: backups list confirmou cinco backups físicos COMPLETED; último ID 2084139176, 2026-10-27T06:17:32.367Z (02:17:32 Cuiabá). PITR=false; walg=true. Nenhum backup foi criado/restaurado e dados reais não foram copiados. Backup listado NÃO comprova restore integral. Essa pendência continua para migrações maiores.

A recuperação específica do incremento aditivo foi comprovada em PostgreSQL fictício: aplicar somente RPC nova; conferir helper anterior/RLS intactos; testar sessão ausente/válida/revogada e ACL; desativar por REVOKE sem alterar dados. Cluster removido. A reversão compatível é desligar DNA_V1_ACCESS_ENABLED e revogar EXECUTE da função nova; não precisa restaurar/dropar tabelas nem substituir helpers. Só esta alteração pequena avançou com o ponto de backup atual e a reversão específica validada.

Migração aplicada: dna_session_dependency_only, versão registrada 20261027233924. Arquivo local alinhado ao histórico real em supabase/migrations/20261027233924_dna_session_dependency_only.sql. Cria somente public.dna_current_session(), search_path vazio, SECURITY DEFINER justificado para conferir auth.sessions do próprio auth.uid/session_id, EXECUTE somente authenticated. Sem JWT retorna null; anon não possui EXECUTE. Helpers anteriores mantiveram hash 61fa2cab5a7b31e3d41d22640662ba79 antes/depois. Nenhuma tabela ou política RLS alterada; não foram aplicadas P3 001 integral, P3 002 ou P4.

### Restrição efetiva

lib/saas/pilot.ts exige identidade/sessão verificada, UUID explicitamente permitido na configuração do servidor, instituição configurada e vínculo ativo sem scope_pending. Retorna somente Sinop e seus grants/vínculos. A projeção piloto não confere autoridade global, mesmo que exista papel proprietário na base; não modifica o papel armazenado. Não cria associação, unidade ou permissão por inferência. Gate aplicado ao login/GET de identidade, páginas SSR e fluxos internos de recuperação. API DELETE permanece disponível para logout sem exigir vínculo ativo.

Configuração Vercel Production:

- DNA_V1_ACCESS_ENABLED=true.
- DNA_V1_PILOT_INSTITUTION_ID=2de1fc01-8398-4633-86e4-5383b76b67bf.
- DNA_V1_PILOT_USER_IDS contém SOMENTE os dois IDs fictícios do ensaio.
- DNA_APP_ORIGIN=https://www.dnadaprofissao.com.br.
- DNA_V1_INTERNAL_PREVIEW_ENABLED=false; DNA_V1_RECOVERY_ENABLED=false.
- Nenhum segredo de recuperação criado; Preview/Development não foram habilitados.

A tela de login pode abrir publicamente, mas qualquer identidade fora dessa lista/vínculo é negada pelo servidor. Nenhum usuário real teve credencial alterada. Duas contas de teste @example.invalid foram criadas via Auth admin, confirmadas sem e-mail; senhas fortes aleatórias, chaves e tokens usados apenas em memória. Uma conta tem perfil e vínculo vendedor ativo em Sinop; a outra possui perfil sem vínculo, para negação. Não foram concedidos grants de leads, relatórios, unidade ou créditos. Identidades fictícias permanecem identificadas; senhas não foram entregues no chat ou salvas em evidências. O ensaio encerrou as sessões utilizadas. Nenhum convite ou e-mail enviado.

### Testes reais concluídos

Evidência: PILOTO-LOGIN-REAL-RESULTADO.json.

1. Auth real em /auth/v1/token e /auth/v1/user confirmou o UUID da fixture; RPC confirmou sessão do JWT.
2. Logout Supabase revogou a sessão; a RPC negou o token anteriormente válido.
3. Site oficial: conta sem vínculo retornou HTTP 403.
4. Conta com vínculo retornou HTTP 200; cookie HttpOnly no namespace dna-saas-auth; GET identity mostrou apenas Sinop, globalOwner=false e operationalLeadAccess=false.
5. /equipe renderizou via SSR com a sessão real; /admin/integracao-v1 e recuperação continuaram 404.
6. Revogação temporária do vínculo DA FIXTURE fez nova chamada retornar 401; vínculo fictício foi reativado ao fim.
7. Logout no site HTTP 200; replay dos cookies anteriores recebeu 401.

Não alegamos teste de expiração natural do JWT por espera de TTL; revogação real foi demonstrada. Não testamos escopo de unidade com dado real: P3 002 e unidades ainda não existem. Nenhum lead/relatório foi liberado para tentar provar isolamento. A proteção atual é bloqueio integral dessas superfícies, confirmado nas rotas existentes.

Uma tentativa durante propagação da Vercel encontrou página já ativa e API ainda 404. O executor passou a esperar página 200 E API 401 antes do teste. Reutilizou SOMENTE as mesmas duas fixtures (nenhuma pessoa real), renovou senhas efêmeras e completou todos os testes. Isso não foi registrado como login aprovado na tentativa inicial.

295 testes locais passaram (113 motor/editorial/orientação + 82 integração/identidade/gate + 100 rotas/persistência). TypeScript/build completo e 13 HTTP OFF aprovados antes da ativação. Ensaio SQL mínimo é específico desta mudança; concorrência P4 aprovada anteriormente não foi repetida.

### Sinop e continuação

Instituição existente unifecaf-sinop confirmada ativa. Configurado DE FATO: gate de dois IDs fictícios, um vínculo vendedor fictício Sinop e evento access_audit_events de validação piloto. Não foi criada unidade, distribuído lead, atribuído responsável antigo ou concedido crédito.

Preparados, não executados: scripts/pilot/prepare-sinop-unit-NOT-EXECUTED.sql e permissions-for-review.json. P3-002-NEXT-NOT-EXECUTED.sql reaproveita a candidata e exige a nova prova de sessão diretamente nas RPCs; isso evita depender da substituição dos helpers antigos, que foram preservados. Essa adaptação ainda precisa de ensaio próprio antes de aplicar. P4 transacional anterior continua intacta na branch técnica, sem rota pública ligada.

Próximo incremento: revisar/ensaiar P3 002 adaptada, preparar recuperação compatível com essa mudança maior, aprovar atribuições de unidade e ações, cadastrar unidade piloto sem leads antigos. Depois congelar revisão/IDs das 15 perguntas e integrar P4; créditos, textos/relatórios e associações acadêmicas não podem ser ativados sem suas decisões/homologações. Primeiro login real já foi entregue; a jornada completa de avaliação ainda não.

Acesso humano ao piloto é etapa distinta: nenhum funcionário foi incluído automaticamente na allowlist e não foi usada senha de Fernando/Carla/Roberta nos testes. Manter controle de identidade e canal de acesso antes de habilitar pessoas reais.
