import municipalities from './municipalities.json';
export const cityCatalog=municipalities as {id:string;name:string;state:string}[];
export const locationKey=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
export function findCity(value:string){const cleaned=value.trim().replace(/\s*(?:,|\/| - )\s*/g,',');const parts=cleaned.split(',');const name=parts[0],state=parts[1]?.toUpperCase();return cityCatalog.find(c=>locationKey(c.name)===locationKey(name)&&(!state||c.state===state));}
export const cityText=(c:{name:string;state:string})=>c.name+', '+c.state;
