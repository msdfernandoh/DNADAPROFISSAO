# Camada editorial local — prévias para Carla

Versão dna-editorial-preview-2026-10-26.v1. Composição determinística sobre IndividualAnalysis existente, sem recalcular pontos ou consultar banco. Nenhum import no fluxo publicado.

draft-rules.json contém 15 blocos narrativos condicionais novos, todos em rascunho para aprovação; não são apresentados como textos já homologados. compose-editorial.ts valida o pacote, seleciona condições por evidências reais e monta nove seções e uma ficha comercial com saída separada. Regras de abertura, síntese/contextualização e informações de processo também são versionadas no compositor. Cada parágrafo tem regra/evidências/tipo/uso interno; participantEditorialText remove essas referências da saída de leitura. Conteúdo sem evidência individual é apenas orientação geral de processo, sem inferências pessoais.

O pacote cobre os cinco casos fictícios desta rodada. Não cobre automaticamente todas as alternativas ou combinações. Lacunas são registradas internamente; não publicar sem homologar conteúdo e ampliar cobertura por casos aprovados.

Nenhuma recomendação de graduação/pós é gerada. A escolaridade apenas informa pendência de elegibilidade declarada, nunca autoriza oferta. Na integração futura, validar no servidor o cadastro autorizado, graduação ou pós concluída, habilitação de oferta e requisitos; comprovação na matrícula.

Execução: npm run test:individual. Gera os relatórios e comparação em docs/especificacoes-2026-10-26/previas-editoriais. Testes de composição e geração local ficam em scripts/test-editorial-preview.ts e scripts/demo-editorial-preview.ts. O texto público nunca deve receber o objeto interno completo. As projeções não constituem autorização de acesso nem controle RLS.
