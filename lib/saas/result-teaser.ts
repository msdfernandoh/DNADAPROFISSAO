import type {IntegratedJourney} from '../questionnaire-engine/integration/journey';
import {profileDisplaySummary} from '../questionnaire-engine/integration/profile-summary';
import {profileNames} from '../questionnaire-engine/individual/editorial/restore-humanized';
const contributions={L:'transformar uma intenção em um próximo passo',C:'abrir conversas e aproximar ideias',E:'compreender os caminhos antes de escolher',H:'considerar as pessoas que fazem parte de uma situação',P:'experimentar uma solução e aprender com o que acontece'};
const learning:Record<string,string>={A:'Ao aprender algo novo, você escolheu entender a lógica antes de começar. Uma boa pergunta pode abrir um caminho que ainda não estava visível.',B:'Ao aprender algo novo, você escolheu experimentar e ajustar. Cada tentativa pode trazer uma descoberta para a próxima.',C:'Ao aprender algo novo, você escolheu a troca com outras pessoas. Uma conversa pode ampliar o que você percebe sozinho.',D:'Ao aprender algo novo, você escolheu partir de um objetivo concreto. Entender para quê aprender ajuda a enxergar por onde começar.'};
/** Participant-only, short projection of the saved result. Never returns raw answers or commercial data. */
export function resultTeaser(j:IntegratedJourney){
 const c=j.analysis.classification,p=profileDisplaySummary(j.analysis),codes=c.state==='tied_main'?c.groups[0].profiles:c.main?[c.main,...c.secondaryCandidates]:[];
 const names=codes.map(code=>profileNames[code]);
 const title=c.state==='tied_main'?'Seu jeito reúne mais de uma força em destaque.':c.main?({L:'Você enxerga um próximo passo onde tudo ainda é ideia.',C:'Sua forma de conectar ideias merece ser conhecida.',E:'Você procura compreender o caminho das suas escolhas.',H:'As pessoas têm espaço na forma como você olha as situações.',P:'Você encontra descobertas quando coloca as ideias em movimento.'})[c.main]:'Suas escolhas têm uma história para contar.';
 const first=codes[0],second=codes[1];
 const opening=first?'Nas situações que respondeu, apareceu espaço para '+contributions[first]+(second?' e para '+contributions[second]:'')+'. Essa combinação merece um olhar mais de perto: em quais momentos cada força ajuda você a avançar?':'Seu resultado foi salvo. Há escolhas para observar com mais atenção e caminhos para investigar.';
 return {name:j.registration.name.split(' ')[0],title,opening,discovery:learning[j.analysis.evidence.find(e=>e.questionId==='Q06')?.letter||'A'],profiles:names,tied:c.state!=='defined',points:p.distribution.map(f=>({name:f.name,points:f.points})),closing:'A parte mais interessante está nos detalhes: como suas escolhas se combinam, o que elas ajudam a fazer e quais possibilidades você quer conhecer melhor.'};
}
export function whatsappResultUrl(phone:string|null,name:string,reference:string){
 if(typeof phone!=='string')return null;
 const digits=phone.replace(/\D/g,'');if(!/^55\d{10,11}$/.test(digits))return null;
 const message='Olá! Sou '+name+'. Acabei de concluir meu DNA da Profissão® e quero receber minha ficha completa para conversar sobre meu resultado. Referência do cadastro: '+reference+'.';
 return 'https://wa.me/'+digits+'?text='+encodeURIComponent(message);
}
