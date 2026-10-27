import {notFound} from 'next/navigation';
import {RecoveryAccess} from '@/components/saas/RecoveryAccess';
import {v1Flags} from '@/lib/saas/flags';
import {recoveryEnabled} from '@/lib/saas/recovery';
export const dynamic='force-dynamic';
export const metadata={title:'Recuperar acesso — DNA da Profissão',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Page(){if(!v1Flags(process.env).individualAccess||!recoveryEnabled(process.env))notFound();return <main className="min-h-screen"><RecoveryAccess mode="request"/></main>}
