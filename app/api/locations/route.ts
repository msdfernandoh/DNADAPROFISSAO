import {NextResponse} from 'next/server';
import {cityCatalog,locationKey} from '@/lib/locations/catalog';
import {BRAZIL_UFS} from '@/lib/brazil-ufs';
export async function GET(request:Request){const params=new URL(request.url).searchParams,state=params.get('state')?.toUpperCase(),search=locationKey(params.get('q')||'');
 if(state&&!BRAZIL_UFS.includes(state as typeof BRAZIL_UFS[number]))return NextResponse.json({error:'UF inválida.'},{status:400});
 const cities=cityCatalog.filter(c=>(!state||c.state===state)&&(!search||locationKey(c.name).includes(search))).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 return NextResponse.json(cities,{headers:{'Cache-Control':'public, max-age=86400'}});
}
