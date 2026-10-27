import { notFound,redirect } from 'next/navigation';
import Link from 'next/link';
import { v1Flags } from '@/lib/saas/flags';
import { currentIdentity } from '@/lib/saas/server';
import { IndividualSignOut } from '@/components/saas/IndividualAccess';
export const dynamic='force-dynamic';
export const metadata={title:'Equipe — DNA da Profissão',robots:{index:false,follow:false}};
export default async function TeamPage(){
 const flags=v1Flags(process.env);if(!flags.individualAccess)notFound();
 const identity=await currentIdentity();if(!identity||(!identity.globalOwner&&!identity.memberships.length))redirect('/equipe/acesso');
 return <main className="max-w-4xl mx-auto p-8 space-y-6"><h1 className="font-serif text-3xl">Olá, {identity.displayName}</h1><p>Seu acesso individual foi confirmado.</p><p>{identity.globalOwner?'Proprietário da plataforma':identity.institutionIds.length+' instituição(ões) autorizada(s)'}</p>{identity.globalOwner&&flags.internalPreview&&<Link className="underline" href="/admin/integracao-v1">Revisão interna dos relatórios</Link>}<IndividualSignOut/></main>;
}
