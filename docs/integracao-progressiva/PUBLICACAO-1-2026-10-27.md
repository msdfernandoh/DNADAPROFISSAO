# Publicação 1 — segurança e confirmação de persistência

Autorização: Fernando confirmou neste chat executar o que falta, enviar para main e publicar o que está pronto.

Base: 7836348f8c6f130c3dfcecc9df67f37527686e39. Branch de preparação: integracao/publicacao-1-2026-10-27.

Lote: PATCH administrativo permite somente status/notes; cadastro só inicia o quiz após confirmação HTTP/JSON/id; conclusão só avança após PATCH confirmado; componentes conservam formulário/respostas durante falhas e bloqueiam envio duplo. Sem mudanças no questionário, pesos, conteúdo, schema ou políticas. Sem SQL necessário. Não inclui nova jornada editorial, laboratório ou ofertas.

Validação executada em 27/10/2026: 48 testes aprovados no clone oficial; git diff --check sem erros; build Next 16.2.6 webpack completo com TypeScript e 26 páginas estáticas aprovado em cópia temporária sem .env, com ambiente sanitizado e URL Supabase fictícia de loopback. Arquivos de código/testes comparados byte a byte com a cópia de build. .env.production.local original preservado sem leitura. Passo .v0 de injeção é preexistente e não foi executado no build de validação. Nenhuma dependência alterada.

Limites: cálculo legado ainda vem do cliente, acesso administrativo segue compartilhado e esta correção não implementa SaaS completo. Retry manual após resposta de criação perdida ainda não é idempotência de servidor; não há persistência das respostas após recarregar a página. Não foram feitos testes mutáveis de produção.

Rollback: usar reversão normal do commit deste lote (sem reset/force) ou promover o deploy saudável anterior pela Vercel, após confirmar o destino. Não há mudança de banco a desfazer. Reverter restaura os comportamentos anteriores; preferir correção incremental se houver incidente. Nenhum restore de banco necessário.

Estado do envio e deploy será registrado separadamente após confirmação externa; este arquivo não é prova de publicação.
