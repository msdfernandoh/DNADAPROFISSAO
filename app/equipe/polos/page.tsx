import {redirect,notFound} from 'next/navigation';
import {currentIdentity} from '@/lib/saas/server';
import {RoutingUnits} from '@/components/saas/RoutingUnits';
export const dynamic='force-dynamic';
export const metadata={title:'Polos e cidades — DNA da Profissão',robots:{index:false,follow:false}};
export default async function Page(){const identity=await currentIdentity();if(!identity)redirect('/equipe/acesso');if(!identity.memberships.some(m=>m.role_code==='institution_admin'))notFound();return <RoutingUnits/>;}
