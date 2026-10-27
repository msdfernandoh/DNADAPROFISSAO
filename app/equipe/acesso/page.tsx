import {recoveryEnabled} from '@/lib/saas/recovery';
import { notFound } from 'next/navigation';
import { IndividualAccess } from '@/components/saas/IndividualAccess';
import { v1Flags } from '@/lib/saas/flags';
export const dynamic='force-dynamic';
export const metadata={title:'Acesso individual — DNA da Profissão',robots:{index:false,follow:false}};
export default function AccessPage(){if(!v1Flags(process.env).individualAccess)notFound();return <main className="min-h-screen p-8 flex items-center justify-center"><IndividualAccess recoveryAvailable={recoveryEnabled(process.env)}/></main>}
