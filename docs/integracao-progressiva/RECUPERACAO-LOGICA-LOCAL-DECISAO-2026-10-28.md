# Ensaio lógico local — decisão técnica, 28/10/2026

## Estado e exigência conhecida
Nenhum dado real exportado, nenhum backup baixado e nenhuma tentativa de reaplicar P3 002 nesta execução. Nenhum recurso contratado.
A revisão anterior rejeitou o DDL por falta de recuperação compatível comprovada; backup físico listado e desativação das RPCs não foram aceitos. Ela não forneceu uma especificação completa de prova ou garantia antecipada de aceitação de restore lógico. Não presumir que outro pedido genérico de autorização resolve essa exigência.

## Acessos restabelecidos e leitura atual
Aplicativos Supabase e Vercel responderam em leitura autenticada. Supabase ejcpumiypodpdmhiulwk: ACTIVE_HEALTHY, PostgreSQL 17.11.0.003, us-east-1. Vercel: dnadaprofissao, prj_kx4r7pZUJB7WQtfxm1CBKVRMaKjG, equipe team_dDXF2nqwNnCGn3FUEGHwcYNA.
Banco: 13.276.851 bytes (aproximadamente 12,7 MiB); históricos 173; unidades 0; RPC P3 002 ausente; RPC P4 ausente. Extensões: plpgsql, pg_stat_statements, uuid-ossp, pgcrypto, supabase_vault. Não foram lidas linhas pessoais ou segredos do Vault.

## Viabilidade sem custo
Um ensaio lógico em PostgreSQL temporário pode comprovar restauração dos objetos de banco efetivamente exportados e aplicar P3 002 sobre essa estrutura recuperada. Não comprova recuperação do backup físico do provedor, perda do projeto, Storage, infraestrutura, SMTP/OAuth/JWT real ou serviços gerenciados.
O procedimento oficial usa supabase db dump (roles/schema/data) e restauração transacional com ON_ERROR_STOP, mas usa Docker e parte de um destino Supabase/self-hosted com objetos gerenciados compatíveis. PostgreSQL puro não é equivalente: auth.uid/auth.jwt/roles, extensões e objetos internos precisam de tratamento explícito; reconstruí-los como fixtures enfraquece a prova e deve ser identificado.
A CLI está instalada e o PostgreSQL existente executa clusters. Nos caminhos examinados o runtime oferece initdb/pg_ctl/postgres, não pg_dump/pg_restore/psql; Docker não encontrado no PATH. Nada instalado. Antes de instalar utilitários gratuitos ou Docker, solicitar aprovação específica e verificar licença/requisitos aplicáveis; não presumir instalação disponível ou comercialmente gratuita em qualquer contexto.

## Proposta de destino, ainda NÃO criado
C:/Users/msdfe/DNA-DA-PROFISSAO/.recuperacao-dna/ensaio-p3002/
Fora do repositório oficial e dos diretórios de build. Não usar Downloads, pasta sincronizada, armazenamento compartilhado ou .env.
ACL dedicada sem herança, somente usuário responsável e SYSTEM; administradores locais continuam sendo uma fronteira de confiança. ACL da pasta pai atualmente inclui leitura para CodexSandboxUsers: não copiar dados sensíveis ali herdando essa ACL.
C: tem 469.637.197.824 bytes livres (cerca de 437 GiB), muito acima do tamanho observado. Reserva proposta para o ensaio: 2 GiB; medir tamanho final antes de exportar, incluindo WAL, índices, logs e temporários.

## Proteção ainda não validada
Consulta ao BitLocker negada por falta de direitos administrativos. Cipher informou que novos arquivos da pasta oficial não serão criptografados por EFS. Isso NÃO demonstra que o volume inteiro esteja sem BitLocker; demonstra apenas que sua proteção ainda não foi comprovada nesta sessão.
Exigir antes da cópia: evidência de volume protegido/contêiner criptografado que cubra arquivos exportados, PGDATA, WAL, logs e temporários. Proteger só o dump com AES não protege o cluster restaurado. Não alterar configurações de segurança ou habilitar criptografia automaticamente.
Arquivo de exportação deve ser cifrado desde o primeiro byte persistido, com implementação existente e verificada; chave em memória ou proteção do sistema, nunca senha em argumentos/logs, chave no mesmo diretório ou credencial em .env. Não criar SQL temporário em claro para cifrar depois.
Sem essa proteção verificada, a cópia permanece bloqueada mesmo com espaço disponível.

## Minimização e consistência
Não exportar Vault, chaves API/JWT, senha de conexão, hashes de senhas de pessoas reais, refresh tokens ou sessões reais. Não copiar credenciais para o destino. Conexão deve usar o acesso autorizado, TLS verificado e segredo somente em memória, sem reset de senha de produção.
Definir e aprovar previamente inventário exato de schemas/tabelas/colunas necessários à prova. Um dump integral contendo auth.users/vault conflita com a exigência de não copiar credenciais e dados pessoais desnecessários. Não executar esse dump indiscriminadamente.
Preferir escopo da aplicação/P3, schema e metadados gerenciados necessários; dados identificáveis somente se indispensáveis e explicitamente aprovados. Excluir participantes históricos da cópia quando não necessários; se excluídos, declarar que a recuperação de seus 173 registros não foi provada.
Exportar schema e dados de um snapshot consistente; se houver vários comandos, coordenar snapshot compartilhado e registrar os limites dos catálogos/roles. Não afirmar que três dumps independentes representam automaticamente um único instante. pg_dump transacional isolado é consistente no seu próprio escopo; consistência entre comandos exige coordenação.
Restaurar em transação local; validar FKs sem órfãos, contagens do mesmo snapshot, sequências, índices, funções, ACL e políticas. Triggers desativados no carregamento precisam de validação posterior: a simples reativação não valida retroativamente os dados.

## Isolamento e retenção propostos
Cluster só em 127.0.0.1, porta dinâmica, SCRAM e senha aleatória; sem Auth/SMTP/Storage/API/web frontend rodando. listen_addresses não controla saída: revisar funções, triggers, linguagens e extensões antes de executá-las; não instalar pg_cron/pg_net/http/wrappers/dblink nem schedulers. Sem mecanismos de saída auditados não executar funções restauradas de origem.
No banco atual essas extensões de saída não aparecem na lista, mas isso não prova ausência de todo efeito externo. Revisar metadados de funções/triggers/event triggers. Não copiar segredos de jobs, Vault ou webhooks.
Duração máxima proposta: 2 horas, sem retenção de dados reais após o ensaio. Parar cluster, conferir processos/handles, excluir PGDATA/dumps/temporários somente dentro do caminho absoluto validado e destruir a chave efêmera. Guardar apenas contagens/hashes de schema e recibos sem dados pessoais.
Exclusão de arquivo/reescrita não garante apagamento físico em SSD, snapshots, pagefile ou backup do sistema. A proteção de volume e o escopo das cópias do computador devem estar comprovados. Não prometer exclusão forense segura sem evidência.

## Critério de avanço
Somente depois de ferramentas e proteção comprovadas, apresentar inventário definitivo e obter autorização específica de cópia para esse destino/retencão. Executar restore local, conferir integridade e P3 002 somente na cópia, testar escopos e reversão; registrar limitações. Nenhuma prova existe ainda.
Depois, determinar se a evidência atende à revisão; não prometer aceitação e não reaplicar produção com a mesma evidência. Se a revisão exigir recuperação física ou serviços Auth reais, este ensaio lógico limitado não satisfará esse requisito.

## Incremento independente
Preparado prepareRegistrationDraft no projeto original: cadastro validado ligado à revisão congelada, instituição/unidade/responsável vindos do contexto de servidor autorizado. Impede alegações do navegador, criação por vendedor sem autorização, vínculo revogado e unidade não atribuída. Não grava banco, não conclui avaliação e não concede créditos; falta futura persistência atômica com revalidação no banco. Nada disso substitui P3 002/P4.
13 testes novos; regressão total 375. Questionário, matriz de 107 cursos e textos pendentes preservados.

Fontes oficiais consultadas:
- https://supabase.com/docs/guides/self-hosting/restore-from-platform
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
