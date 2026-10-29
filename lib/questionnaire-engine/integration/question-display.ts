/** Editorial display only. Frozen option IDs, weights and historical selectedText remain unchanged. */
export function questionDisplayText(text:string){return text
 .replace('Fico super empolgada no começo','Começo com muito entusiasmo')
 .replace('Fico empolgada para usar isso','Sinto entusiasmo para usar isso')
 .replace('Fico animada com a novidade','A novidade me anima')
 .replace('ser atendida mesmo estando errada','conseguir atendimento mesmo tendo confundido a data')
 .replace('para continuar engajada','para manter meu envolvimento')
 .replace('Se eu ficar muito tempo parada sem fazer nada produtivo, começo a ficar agoniada.','Se eu passar muito tempo sem fazer algo produtivo, começo a sentir inquietação.')
 .replace('Um amigo muito próximo','Uma pessoa muito próxima')
 .replace(/\bsozinha\b/g,'por conta própria');}
export function questionDisplayTitle(title:string){return title.replace(/\s*\((?:Peso Reduzido|Ajustada com)[^)]*\)/g,'');}
