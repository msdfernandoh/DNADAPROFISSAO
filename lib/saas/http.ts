import { NextResponse } from 'next/server';
export const privateReply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
export async function smallJson(request:Request,max=4096):Promise<Record<string,unknown>|null>{
 // Read incrementally; do not allocate an unbounded request before checking its size.
 const reader=request.body?.getReader();if(!reader)return null;let size=0;const chunks:Uint8Array[]=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();return null;}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return data&&typeof data==='object'&&!Array.isArray(data)?data:null;
 }catch{return null;}finally{reader.releaseLock();}
}
