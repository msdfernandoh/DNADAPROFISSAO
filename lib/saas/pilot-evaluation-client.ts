/** Client sends answers/revision only; institutional and user claims never enter this request. */
export async function submitPilotAnswers(participantId:string,revision:string,answers:{questionId:string;alternativeId:string}[]){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(participantId))throw Error('Avaliação inválida.');
 const r=await fetch('/api/v1/evaluations/'+participantId+'/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,answers})});
 const data=await r.json();
 if(r.status===409&&data?.state==='no_credit'&&data.answersSaved===true)return {state:'no_credit' as const};
 if(!r.ok||data?.state!=='committed'||typeof data.debitId!=='string'||!data.debitId||typeof data.snapshotKey!=='string'||!/^[a-f0-9]{64}$/.test(data.snapshotKey)||typeof data.replay!=='boolean')throw Error('Não foi possível confirmar a conclusão. Suas respostas permanecem nesta tela.');
 return {state:'committed' as const};
}
