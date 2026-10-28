import type {IndividualAnalysis,ProfileCode} from '../individual/types';
const names:Record<ProfileCode,string>={L:'Liderança e Negócios',C:'Comunicador e Influente',E:'Estratégico e Analítico',H:'Humanizado e Desenvolvimento',P:'Prático e Operacional'};
/** Display projection only. Scores, ranks and ties are supplied by the existing official motor. */
export function profileDisplaySummary(analysis:Pick<IndividualAnalysis,'scores'|'classification'>){
 const c=analysis.classification;
 const describe=(code:ProfileCode)=>({code,name:names[code],points:analysis.scores[code]});
 return {
  state:c.state,
  main:c.main?describe(c.main):null,
  secondary:c.state==='defined'&&c.secondaryCandidates.length===1?describe(c.secondaryCandidates[0]):null,
  coPredominant:c.state==='tied_main'?(c.groups[0]?.profiles||[]).map(describe):[],
  secondaryTies:c.state==='tied_secondary'?c.secondaryCandidates.map(describe):[],
  distribution:c.groups.flatMap(g=>g.profiles.map(describe)),
  unit:'points' as const,
  compatibilityPercentage:false as const
 };
}
