/** Expected origin comes from the server deployment configuration, never an untrusted Host header. */
export function allowedRequestOrigin(request: Request, configuredOrigin: string | undefined): boolean {
 if(!configuredOrigin)return false;
 try{const u=new URL(configuredOrigin);if(u.username||u.password||u.search||u.hash||u.pathname!=='/')return false;
 if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))return false;
 return request.headers.get('origin')===u.origin;
 }catch{return false;}
}
