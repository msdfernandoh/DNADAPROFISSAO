'use client';
import {Analytics} from '@vercel/analytics/next';
/** Private report tokens and institutional paths must never enter analytics events. */
export function PublicAnalytics(){return <Analytics beforeSend={event=>{const path=new URL(event.url).pathname;return /^\/(relatorio|equipe|admin|api)(\/|$)/.test(path)?null:event;}}/>;}
