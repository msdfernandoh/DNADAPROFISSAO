# Produção DNA da Profissão

Projeto Supabase: DNA-DA-PRODUCAO (ejcpumiypodpdmhiulwk), organização hugo-8097. Vercel: hugo-8097s-projects/dnadaprofissao, branch main.

A estrutura e os dados já foram importados: 20 tabelas e 435 registros. Não execute novamente o dump. Os scripts antigos de RLS são históricos e permissivos; não os reaplique na produção. O script 012_production_rls.sql substitui suas políticas e pode ser reexecutado. Ele mantém RLS ativa, leitura pública restrita a catálogos/configurações e questionários publicados e bloqueia escrita e leitura de dados pessoais para anon/authenticated.

SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) deve existir somente no servidor. Rotas administrativas verificam sessão assinada; rotas de respostas/conclusão verificam sessão HttpOnly vinculada ao participante. Registros importados não recebem sessões públicas. A chave privada nunca deve receber prefixo NEXT_PUBLIC_.

ADMIN_PASSWORD deve ser definida pelo responsável na Vercel para ativar o login; não há senha padrão. ADMIN_SESSION_SECRET é opcional: na ausência, as sessões usam HMAC com chave privada do Supabase e separação de domínio. Alterar esse segredo invalida as sessões atuais. Não inclua dados pessoais, dumps ou arquivos .env no Git.

O desenvolvimento local pendente da fase 10 na pasta DNA não faz parte desta publicação.

O questionário dna-profissao-v2 foi aprovado pelo checklist real sem erros ou avisos (simulação LID_PRA) e publicado via 013_publish_dna_profissao.sql. Nenhum dado de participantes foi alterado.
