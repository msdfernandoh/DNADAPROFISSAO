/** Expected origin comes from the server deployment configuration, never an untrusted Host header. */
export function allowedRequestOrigin(request: Request, configuredOrigin: string | undefined): boolean {
 if(!configuredOrigin)return false;
 try{const u=new URL(configuredOrigin);if(u.username||u.password||u.search||u.hash||u.pathname!=='/')return false;
 if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))return false;
 return request.headers.get('origin')===u.origin;
 }catch{return false;}
}

/** No browser-provided next/redirect is accepted by the recovery flow. */
export function trustedAppOrigin(value:string|undefined):string {
 if(!value)throw Error('Origin not configured');const u=new URL(value);
 if(!allowedRequestOrigin(new Request(u.origin,{headers:{origin:u.origin}}),value))throw Error('Invalid configured origin');return u.origin;
}
