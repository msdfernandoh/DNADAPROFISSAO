import {createHash} from 'node:crypto';
import questions from '../__fixtures__/individual/questions.json';
import {createIndividualInstrument} from '../individual/instrument';
import {INTEGRATED_REVISION} from './journey';
export const OFFICIAL_SOURCE_HASH='2a1c84320d8994a2dc095dfc262d642d9c981bba38393f10ed1cb68aee97d7b2';
/** Frozen input content and weights. Any change requires a new explicitly reviewed revision. */
export function frozenRevision(){
 const hash=createHash('sha256').update(JSON.stringify(questions)).digest('hex');
 if(hash!==OFFICIAL_SOURCE_HASH)throw Error('Official revision content changed without approval');
 const instrument=createIndividualInstrument(questions,INTEGRATED_REVISION);
 const options=instrument.questions.flatMap(q=>q.options.map(o=>({questionKey:'Q'+String(q.number).padStart(2,'0'),alternativeKey:'Q'+String(q.number).padStart(2,'0')+':'+o.letter,weights:{...o.weights}})));
 return {revision:INTEGRATED_REVISION,sourceHash:hash,options};
}
