# Matriz profissional local — dados e propostas para revisão

107 cursos do catálogo recebido: 39 graduação e 68 pós. build-course-matrix.ts produz estrutura reproduzível com origem por registro, descrições recebidas, atividades citadas, termos de conhecimentos/habilidades e contextos explicitados. Anotação por termos não é validação profissional ou acadêmica. Quando a descrição não permite classificar uma atividade/contexto com segurança, o campo fica vazio com pendência. Não preencher por nome ou perfil.

As tags de interesse/objetivo são propostas distintas dos dados de origem. candidate-proposals.json contém dez associações demonstrativas para iniciar a revisão; as outras 97 linhas não ganham uma associação automática de recomendação. Todas aguardam Carla. Requisitos específicos e formações de origem não confirmados ficam null. Não confundir nível elegível com requisito específico já conferido.

demonstrateCareerLinks recebe cadastro sintético explícito e a análise comportamental existente. Interesse e objetivo são condições necessárias; Q05/Q06 só orientam a explicação de como investigar a opção, nunca atribuem interesse/aptidão. mode=review_only, productionRecommendations=[] e enrollmentOfferAllowed=false sempre. Se mais de cinco possibilidades preliminares combinarem, não cortar por ordem alfabética/perfil: pedir priorização e retornar unresolvedSelection. Não é ranking comercial homologado.

evaluateLocalOffer modela bloqueios em contexto interno de teste. Não é um endpoint seguro de servidor nem substitui autenticação/RLS. Nenhuma oferta real é liberada, mesmo com todas as flags sintéticas ativadas, pois a matriz ainda não está homologada. A integração futura deve ler identidade, instituição/unidade, cadastro e configurações autorizadas no servidor; não aceitar flags do navegador como autoridade.

A autorização das quatro instituições para comercializar os 68 cursos de pós é preservada; ativação geral, institucional/unidade/curso e requisitos continuam separados. Graduação/pós completas são necessárias para pós; comprovação na matrícula. Escolaridade não participa da pontuação.

Execute npm run test:individual. Artefatos em docs/especificacoes-2026-10-26/fechamento-v2-matriz. Sem clientes de banco, env de produção, importação no banco ou publicação. IDs locais são referências de matriz, não novos IDs cadastrados no Supabase.
