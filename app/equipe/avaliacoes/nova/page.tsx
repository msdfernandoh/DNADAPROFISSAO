import {notFound,redirect} from 'next/navigation';
import {evaluationFlags} from '@/lib/saas/flags';
import {currentIdentity} from '@/lib/saas/server';
import {RegistrationForm} from '@/components/saas/RegistrationForm';
export const dynamic='force-dynamic';
export const metadata={title:'Cadastrar participante — DNA da Profissão',robots:{index:false,follow:false}};
export default async function Page(){
 if(!evaluationFlags(process.env).completion)notFound();
 const identity=await currentIdentity();if(!identity)redirect('/equipe/acesso');
 if(!identity.grants.some(g=>g.resource==='lead'&&g.action==='create'&&g.allowed))notFound();
 return <main className="max-w-xl mx-auto px-4 py-8"><h1 className="font-serif text-3xl mb-6">Cadastrar participante</h1><RegistrationForm/></main>;
}
