/** Navigation groups only. They do not recommend courses or change the participant's result. */
export const COURSE_AREAS=[
 {id:'technology',name:'Tecnologia e inovação',pattern:/sistema|computa|cibern|dados|inteligencia artificial|software|tecnologia da informacao|automacao digital/},
 {id:'education',name:'Educação e ensino',pattern:/pedagog|educacao|ensino|docencia|alfabet|libras|escolar|aprendizagem|psicopedag/},
 {id:'health',name:'Saúde e bem-estar',pattern:/saude|biomed|farmac|fisiot|nutri|radiol|terapia|estetica|cosmet|psicolo|enferm|hospital|clinica|educacao fisica|esport/},
 {id:'communication',name:'Comunicação, criatividade e design',pattern:/marketing|design|creator|influencer|comunicacao|publicidade|audiovisual|moda/},
 {id:'engineering',name:'Engenharia e arquitetura',pattern:/engenharia|arquitet|urbanismo|construcao|ambiental|energia/},
 {id:'law',name:'Direito e segurança',pattern:/direito|juridic|seguranca|penal|criminal|advoc|forense|constitucional|legislacao/},
 {id:'business',name:'Negócios, gestão e finanças',pattern:/administr|gestao|financeir|contab|gerencia|logistica|negocio|empreend|agronegocio|economia|comercial|recursos humanos|projetos/},
] as const;
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function groupCourses(names:string[]){
 const groups=new Map<string,{id:string;name:string;courses:string[]}>();
 for(const name of [...new Set(names)].sort((a,b)=>a.localeCompare(b,'pt-BR'))){
  const value=norm(name);
  // Educação Física is health unless explicitly a teaching degree; avoid a vague "educação" match.
  const area=value.includes('educacao fisica')&&!value.includes('licenciatura')?COURSE_AREAS.find(a=>a.id==='health'):COURSE_AREAS.find(a=>a.pattern.test(value));
  const key=area?.id||'other';if(!groups.has(key))groups.set(key,{id:key,name:area?.name||'Outras possibilidades',courses:[]});groups.get(key)!.courses.push(name);
 }
 return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
