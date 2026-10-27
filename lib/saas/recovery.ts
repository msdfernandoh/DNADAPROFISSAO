import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
export const RECOVERY_COOKIE='dna-recovery-v1';
export function recoveryEnabled(env:Record<string,string|undefined>){return env.DNA_V1_RECOVERY_ENABLED==='true'&&!!env.DNA_RECOVERY_SECRET&&env.DNA_RECOVERY_SECRET.length>=32;}
export function recoveryGrant(userId:string,sessionId:string,secret:string,now=Date.now()){
 if(secret.length<32)throw Error('Recovery configuration missing');
 const payload=Buffer.from(JSON.stringify({purpose:'dna-password-recovery-v1',userId,sessionId,expires:now+600000,nonce:randomUUID()})).toString('base64url');
 return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');
}
export function verifyRecoveryGrant(value:string|undefined,userId:string,sessionId:string,secret:string|undefined,now=Date.now()):boolean {
 if(!value||value.length>2048||!secret||secret.length<32)return false;
 try{const [payload,signature,...extra]=value.split('.');if(extra.length||!payload||!signature)return false;
 const expected=createHmac('sha256',secret).update(payload).digest(),supplied=Buffer.from(signature,'base64url');
 if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return false;
 const body=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
 return body.purpose==='dna-password-recovery-v1'&&body.userId===userId&&body.sessionId===sessionId&&typeof body.expires==='number'&&body.expires>now&&body.expires<=now+600000;
 }catch{return false;}
}
