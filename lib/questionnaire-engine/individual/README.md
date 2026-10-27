# Motor individual — execução local

Núcleo TypeScript do mesmo projeto, ainda sem integração pública. Reutiliza calculate-result para somar pesos, preserva empates e seleciona somente condições/textos recebidos. Não possui cliente de banco, envio de mensagens, acesso a env ou chamadas de rede. Deve ser integrado no servidor em lote posterior; o hash utiliza node:crypto.

Execute npm run test:individual na raiz. O adaptador recebe JSON/revisão e escolhas explícitas; não busca configuração remota. As fixtures oficiais e os hashes estão em ../__fixtures__/individual. Resultados completos, limites e testes estão em docs/especificacoes-2026-10-26/ENTREGA-MOTOR-INDIVIDUAL.md.

As funções públicas deste núcleo são createIndividualInstrument, validateIndividualAnswers, answersFromLetters, analyzeIndividual, classifyIndividualScores, compareIndividualAnalyses, participantAnalysis e commercialAnalysis. Importe os módulos diretamente; o index.ts legado não foi alterado. A saída integral é interna e inclui as duas audiências: nunca enviar o objeto completo ao participante. As projeções não substituem autenticação/autorização.

Condições e cruzamentos são referências editoriais, não conteúdo final homologado. productionReady permanece false; lacunas são parte obrigatória da saída e não devem ser ocultadas como se houvesse cobertura integral. Nenhum componente do relatório publicado foi modificado.
