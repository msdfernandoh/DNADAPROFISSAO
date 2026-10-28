export function assertLocalFictitiousTarget(value){
 if(!value)throw Error('Set DNA_P4_TEST_DATABASE_URL only after approval of a disposable local database');
 const url=new URL(value);
 if(!['postgres:','postgresql:'].includes(url.protocol)||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.pathname!=='/dna_p4_ficticio'||url.search||url.hash)throw Error('Only the approved local database dna_p4_ficticio is accepted');
 return value;
}
