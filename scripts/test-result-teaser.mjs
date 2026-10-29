import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{resultTeaser,whatsappResultUrl}=require('../.local-tests/journey/lib/saas/result-teaser.js'),{buildReviewCase}=require('../.local-tests/journey/lib/questionnaire-engine/integration/review-cases.js');
const a=buildReviewCase('Comparacao_A'),b=buildReviewCase('Comparacao_B'),before=JSON.stringify(a);
const ta=resultTeaser(a),tb=resultTeaser(b);assert.notEqual(ta.discovery,tb.discovery);assert.equal(JSON.stringify(a),before);
assert.ok(ta.points.length===5);assert.ok(ta.title&&ta.opening);assert.ok(!JSON.stringify(ta).includes('commercial'));assert.ok(!('answers'in ta));
for(const name of ['Ana','Beatriz','Camila'])assert.ok(resultTeaser(buildReviewCase(name)).name);
const url=whatsappResultUrl('+55 (66) 99610-5217','Ana & Maria','ficticio');assert.ok(url.startsWith('https://wa.me/5566996105217?text='));assert.ok(decodeURIComponent(url).includes('Ana & Maria'));assert.ok(!url.includes('token='));
for(const phone of [null,'','123','javascript:alert(1)'])assert.equal(whatsappResultUrl(phone,'Ana','ficticio'),null);
console.log('PASS teaser uses saved individual evidence, retains five scores, does not mutate result or expose commercial data; WhatsApp is encoded and validates contact');
