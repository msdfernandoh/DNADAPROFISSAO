import { createHash } from 'node:crypto';
/** Per-process defence only; provider/distributed limits must also be validated before activation. */
export class AuthThrottle {
 private entries=new Map<string,{count:number;until:number}>();
 constructor(private now:()=>number=Date.now,private capacity=10000){}
 take(kind:'login'|'recovery'|'confirm',identity:string):boolean {
  const now=this.now();for(const [k,v]of this.entries)if(v.until<=now)this.entries.delete(k);
  const key=kind+':'+createHash('sha256').update(identity.trim().toLowerCase()).digest('hex');
  const current=this.entries.get(key);
  if(!current){if(this.entries.size>=this.capacity)return false;this.entries.set(key,{count:1,until:now+(kind==='recovery'?1800000:900000)});return true;}
  if(current.count>=(kind==='recovery'?3:5))return false;current.count++;return true;
 }
}
export const authThrottle=new AuthThrottle();
