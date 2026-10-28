# Aprovação do ensaio de recuperação — piloto Sinop

**STATUS ATUAL: proposta de outro projeto CANCELADA pela direção em 28/10/2026. Não criar recurso, não copiar backup e não contratar serviço. O restante é referência histórica da opção avaliada, não instrução de execução.**

A direção autorizou reapresentar a P3 002 sob controles incrementais e sem custo, registrando a ausência de restore comprovado. A revisão automática rejeitou novamente a aplicação por falta dessa prova. Nenhuma mudança estrutural foi feita.

## Destino proposto
- Recurso: projeto temporário Supabase independente, via Restore to a New Project, não branch e nunca restauração sobre a origem.
- Nome solicitado: dna-recuperacao-sinop-20261028 (se o fluxo permitir nomear; caso contrário, registrar o nome/ID gerado antes de qualquer alteração no clone).
- Organização da origem e destino proposto: hugo-8097's projects, ID vercel_icfg_5XDlmJAtbFhDLDxEC2ffWfM5, plano Pro confirmado.
- Região: us-east-1, mesma região obrigatória da origem.
- Origem: ejcpumiypodpdmhiulwk; backup físico COMPLETED ID 2093853934, 28/10/2026 06:17:31.791 UTC. Reconferir disponibilidade e resumo antes da confirmação.
- O novo ref/endpoint só existe após provisionamento. Não é possível informar antecipadamente um ID ainda não criado. Não criar um projeto vazio adicional antes de usar o recurso de restauração.

## Proteção e duração propostas
- A cópia contém dados pessoais e Auth, inclusive hashes de senhas e registros de autenticação; aprovação precisa cobrir explicitamente esse escopo.
- Não conectar Vercel, Git, DNS, aplicação, SMTP, OAuth, webhooks ou integrações comerciais ao destino. Não copiar .env nem chaves/configuração Auth da origem.
- Nenhum novo membro convidado à organização. Operações restritas ao responsável e à sessão administrativa autorizada; nunca publicar URL/chaves/credenciais em relatórios.
- O serviço herda SSL e restrições de rede da origem, mas um projeto Supabase tem endpoint de serviço. Isso NÃO equivale a uma rede privada ou à suspensão automática de todos os usuários Auth restaurados.
- Antes de iniciar, conferir a proteção herdada e aceitar explicitamente o acesso possível nesse intervalo. Se a política exigir bloqueio de Auth/Data API antes de haver dados e o fluxo não o permitir, interromper e tratar com suporte, sem contornar a exigência.
- Na origem foi confirmado em leitura: nenhuma extensão pg_net, pg_cron, wrappers ou http instalada. Reconferir antes da restauração; examinar jobs, triggers e integrações externas no escopo de metadados para evitar saídas indesejadas.
- Após o clone ficar disponível: conferir restrições de rede, grants, RLS e configurações Auth no destino; desativar cadastro/envio de e-mail no destino antes dos testes. Usar apenas contas marcadas como fixtures, sem login ou redefinição de senha de pessoas reais.
- Janela proposta: até 2 horas de existência para o ensaio, contadas do provisionamento. Se ultrapassar, interromper testes e excluir o destino; uma extensão exige nova aprovação.
- Evidências persistentes: somente contagens, hashes de metadados, resultados de testes, ref do destino, horários e comprovante de exclusão. Nenhum dump de participantes ou auth, senha, JWT ou cookie salvo em logs.

## Custo: aprovação ainda pendente
- get_cost para novo projeto nesta organização retornou US$ 10/mês (recorrência mensal). É uma cotação genérica, NÃO uma cotação definitiva do clone.
- A restauração replica compute, atributos de disco e recursos da origem. O resumo de custos do próprio fluxo é a referência antes de confirmar. A cobrança de compute é por hora; não assumir que US$ 10 será cobrado integralmente nem prometer custo zero.
- Fernando precisa informar o compute/disco e o custo mostrados no resumo da tela. Nenhum confirm_cost, criação, restauração ou mudança de plano foi executado.
- Aprovação final deve fixar teto total em USD, prazo, destino, cópia de Auth/dados reais e exclusão. Não iniciar se a estimativa ou proteção exceder o aprovado.

## Prova a executar depois da aprovação específica
1. Registrar ponto de backup e metadados de origem; manter somente contagens/hashes, sem consultar participantes individuais.
2. Restaurar via Restore to a New Project, registrar ref e região do destino; nunca chamar Restore/PITR sobre ejcpumiypodpdmhiulwk. A ferramenta MCP restore_project não é o fluxo de clonar um backup e não será usada como substituto.
3. Conferir estrutura, índices, FKs, ausência de órfãos por contagens, RLS/grants/helpers e dados Auth restaurados por metadados/contagens. Comparar com o momento do backup, não presumir que contagens atuais sejam idênticas se houve movimento posterior.
4. Conferir usuários/perfis/vínculos/sessões restaurados, sem expor campos pessoais. Sessões e hashes presentes não provam login: usar somente fixtures autorizadas e a configuração Auth própria do destino para testar JWT novo, revogação/logout e negações.
5. Aplicar somente a P3 002 candidata no destino isolado, comparar helpers/RLS/ACL e testar instituição/unidade/responsável com fixtures. Ensaiar desativação/reversão e preservar evidências. Não aplicar P4 junto.
6. A evidência vale para recuperação de banco desse ponto. Não prova Storage, e-mails/OAuth, Edge Functions, configurações e segredos, Realtime ou recuperação ponta a ponta da aplicação.

## Exclusão proposta
Excluir o projeto temporário pelo ref registrado no Dashboard → Settings → General → Delete project (reconfirmar layout e identidade do destino). Antes, abortar se o ref for o da produção. Remover eventuais arquivos temporários com dados reais; neste método não haverá download planejado. Confirmar que o ref deixa de constar nos projetos ativos e que o endpoint não atende; registrar horário e uso/cobrança acumulada. Não prometer apagamento físico imediato de cópias retidas pelo provedor: essa retenção interna não foi confirmada e exige esclarecimento se for requisito do responsável.

## Bloqueio único atual
Faltam o resumo de custo/configuração do clone e a aprovação específica de destino, proteção, até 2 horas, teto de custo e exclusão. Por isso nenhuma cópia foi feita e P3 002/unidade/isolamento real permanecem pendentes. Não repetir a migração de 173 participantes.

Referências oficiais:
- https://supabase.com/docs/guides/platform/clone-project
- https://supabase.com/docs/guides/platform/billing-faq
