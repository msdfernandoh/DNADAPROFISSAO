import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {resolve,dirname} from 'node:path';
const require=createRequire(import.meta.url),ts=require('typescript');
const root=resolve('..','modelos-relatorios-humanizados');
const examples=JSON.parse(readFileSync(resolve(root,'exemplos-ficticios.json'),'utf8'));
const slug=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
for(const example of examples)test('Rendered reports and links: '+example.name,()=>{
 for(const audience of ['participante','comercial']){
  const file=resolve(root,'caso-'+slug(example.name)+'-'+audience+'.html'),html=readFileSync(file,'utf8');
  const article=html.slice(html.indexOf('<article '),html.indexOf('</article>')+10);
  assert.equal((article.match(/class="chapter"/g)||[]).length,9);assert.doesNotMatch(article,/Q\d{2}|\.md\b|\.json\b|Texto (novo|adaptado|recuperado)|origem e evidências|obsessiv|homologação/i);
  if(audience==='participante')assert.doesNotMatch(article,/WhatsApp|ficha comercial|exclusivo da equipe/i);
  assert.match(html,/data-editorial-audit/);assert.doesNotMatch(html,/�|Ã£|Ã§/);
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const m of html.matchAll(/href="([^"]+)"/g)){const href=m[1];if(href.startsWith('#'))assert.ok(ids.has(href.slice(1)),href);else if(!/^https?:/.test(href))assert.ok(existsSync(resolve(dirname(file),decodeURIComponent(href.split('#')[0]))),href);}
 }
});
test('Review route refuses anonymous users and sellers before constructing any report',async()=>{
 const code=ts.transpileModule(readFileSync('app/equipe/revisao-relatorios/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 for(const [enabled,identity,expected]of [[false,null,'404'],[true,null,'login'],[true,{globalOwner:false,memberships:[{role_code:'seller'}]},'404']]){
  let reports=0;const module={exports:{}};
  const deps={'next/navigation':{notFound(){throw Error('404')},redirect(){throw Error('login')}},'@/lib/saas/flags':{v1Flags:()=>({internalPreview:enabled})},'@/lib/saas/server':{currentIdentity:async()=>identity},'@/lib/questionnaire-engine/integration/restored-review-cases':{buildRestoredReview(){reports++;throw Error('Report should not be built')}}};
  runInNewContext(code,{module,exports:module.exports,process:{env:{}},require(name){return deps[name]||{};}});
  await assert.rejects(()=>module.exports.default({searchParams:Promise.resolve({})}),new RegExp(expected));assert.equal(reports,0);
 }
});
