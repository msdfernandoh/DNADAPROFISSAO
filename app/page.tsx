"use client"
import {Landing} from '@/components/dna/landing';
export default function DNAPage(){return <Landing onStart={()=>window.location.assign('/dna'+window.location.search)}/>;}
