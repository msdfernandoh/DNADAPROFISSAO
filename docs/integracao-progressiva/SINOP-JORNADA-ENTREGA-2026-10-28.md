# Sinop e jornada completa — entrega de 28/10/2026

## Executado e validado
- Projeto original Next.js/TypeScript preservado; nenhum motor, catálogo ou conteúdo refeito.
- 334 regressões aprovadas: 113 motor/editorial/orientação, 102 integração/identidade/conclusão, 119 rotas/persistência/segurança. TypeScript e build webpack aprovados em cópia sem .env; 15 smoke HTTP locais OFF.
- P3 002 adaptada ensaiada em PostgreSQL 17.10 descartável: 11 grupos, incluindo autorização, isolamento institucional/unidade/responsável, revogação, expiração, FK, bloqueio de autoelevação e desativação não destrutiva. Helpers anteriores e políticas preservados. A migração falhada não deixou schema parcial. Claims simuladas, não substituem teste JWT real.
- Reutilização da P4 existente no backend oficial, com duas adaptações locais: hash SHA-256 da fonte oficial e imutabilidade de respostas também quando se tenta mover o participant_id. Ensaios afetados repetidos por alteração da transação, não como nova auditoria geral.
- Conclusão tem flag independente DNA_V1_COMPLETION_ENABLED, ausente em todos os ambientes consultados. Acesso piloto sozinho não ativa avaliação, crédito ou prévia.
- POST /api/v1/evaluations/[id]/complete exige origem confiável, corpo limitado e somente revisão/respostas. Identidade real, gate piloto e autorização SQL antecedem cliente privilegiado. Escopo/cadastro/responsável vêm do banco; motor calcula no servidor; somente recibo é retornado. SQL repete verificações dentro da transação. Erro não informa conclusão.
- GET /api/v1/evaluations/[id]/preview exige conclusão e prévia interna habilitadas, sessão piloto e autorização SQL comercial sobre o alvo armazenado. Snapshot deve concordar com participante/instituição/unidade/responsável/revisão/chave. Retorna somente prévia privada claramente marcada como rascunho, nunca homologação/oferta.
- Revisão dna-official-2026-10-26.v1 congelada no código, hash 2a1c84320d8994a2dc095dfc262d642d9c981bba38393f10ed1cb68aee97d7b2, 15 perguntas/60 alternativas. Alteração de conteúdo requer revisão explícita; o navegador não fornece o hash. Ainda não cadastrada/ativada no banco.
- Uma avaliação fictícia completa foi concluída e persistida atomicamente no PostgreSQL temporário com o motor real. Nove partes e ficha comercial foram recuperadas do snapshot persistido e exportadas em SINOP-PREVIA-CARLA.html e SINOP-AVALIACAO-FICTICIA.json. Todo crédito desse ensaio é fictício, exclusivamente local; clusters removidos.

## Limite da recuperação e bloqueio efetivo
Consulta autenticada atual confirmou seis backups físicos COMPLETED; último ID 2093853934, 28/10/2026 06:17:31.791 UTC (02:17 Cuiabá), PITR desligado. Nenhuma restauração integral foi comprovada e nenhum dado real foi copiado.

A tentativa de aplicar APENAS P3 002 foi rejeitada pela revisão automática: considerou insuficiente, para DDL estrutural permanente, o backup listado e a reversão específica das capacidades. Nada foi instalado. Não houve tentativa por CLI, SQL editor ou outro caminho após a rejeição. Um arquivo gerado em supabase/migrations foi retirado sem execução para não publicar candidata pendente como migração já aprovada; a candidata continua em scripts/pilot.

P3 001 completa, P3 002 e P4 NÃO foram aplicadas. Nenhum helper/política/permissão de produção foi alterado nesta rodada. Última leitura: unidades 0; participantes_v2 0; resultados 0; ledger 0; participantes históricos 173. P3 SQL permaneceu ausente. Hash dos helpers antigos 61fa2cab5a7b31e3d41d22640662ba79.

Necessário antes da aplicação: evidência aceita de recuperação compatível com a mudança estrutural e autorização específica do pacote com esse limite exposto. Não restaurar produção. Se for necessário ensaio em destino temporário que envolva backup/dados reais, Fernando precisa autorizar explicitamente esse destino e a cópia antes; isso não foi autorizado nem executado aqui.

## Sinop
Instituição existente preservada. Unidade e atribuições NÃO cadastradas, porque dependem da P3 002. Scripts de unidade e proposta de permissões já existentes foram mantidos. Nenhum lead antigo atribuído; nenhuma fixture convertida em funcionário; nenhum crédito concedido; nenhum usuário real liberado.

A conta fictícia previamente autorizada continua somente com vínculo institucional de teste; não recebeu permissões operacionais nesta rodada. Isolamento operacional por unidade/responsável foi comprovado localmente, ainda NÃO no Supabase real.

## Conteúdo para Carla
Abrir SINOP-PREVIA-CARLA.html: prévia privada de Ana fictícia, construída a partir do snapshot persistido. Revisar as nove partes, linguagem da ficha comercial, evidências e lacunas internas. Aprovar editorial, método dos empates/insuficiência e associações acadêmicas antes de entrega pública. Matriz original de 107 cursos intacta; nenhuma oferta ativada. Escolaridade não altera pontuação e pós-graduação continua condicionada à graduação concluída.

## Próximo incremento concreto
1. Destravar recuperação/aprovação da P3 002 e aplicar individualmente a candidata ensaiada; conferir schema/helpers/RLS antes e depois.
2. Cadastrar a unidade prevista e validar atribuição individual mínima em registros autorizados; testar isolamento real usando apenas fixtures, sem liberar funcionários automaticamente.
3. Ensaiar e aprovar P4 estrutural individualmente, cadastrar mapa congelado e revisão inicialmente desabilitada. Não inventar saldo: sem créditos válidos só rascunho de respostas, sem conclusão/débito.
4. Conectar cadastro/draft às rotas piloto e só ativar a conclusão após dependências comerciais e técnicas validadas. Fluxo legado permanece publicado; as novas rotas estão implementadas, mas não ligadas ao questionário público.

## Reversão do código
Desligar DNA_V1_COMPLETION_ENABLED e DNA_V1_INTERNAL_PREVIEW_ENABLED (já OFF/ausentes), mantendo login restrito; se necessário reverter este commit por novo commit ou promover o último deploy validado 16d4f1e. Não executar DROP, alterar ledger nem usar participantes reais como teste. A reversão SQL específica da P3 está em scripts/pilot/P3-002-disable.sql, mas a migração ainda não existe em produção.
