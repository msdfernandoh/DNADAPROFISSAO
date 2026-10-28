import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {approvedParticipantReport}=require('../../.local-tests/journey/lib/saas/approved-report.js');
const {buildReviewCase}=require('../../.local-tests/journey/lib/questionnaire-engine/integration/review-cases.js');
const {frozenRevision}=require('../../.local-tests/journey/lib/questionnaire-engine/integration/frozen-revision.js');
const j=buildReviewCase('Ana');
const actor={id:'approved-reviewer',active:true,role:'platform_owner',explicitGlobalOwner:true,institutionIds:[],unitIds:[]};
const approval={revision:j.analysis.revision,editorialVersion:j.editorial.version,sourceHash:frozenRevision().sourceHash,approvedBy:'authorized-responsible',approvedAt:'2026-10-28T16:00:00Z',active:true};
assert.throws(()=>approvedParticipantReport(j,null,approval));
assert.throws(()=>approvedParticipantReport(j,actor,null));
for(const change of [{active:false},{revision:'other'},{editorialVersion:'other'},{sourceHash:'0'.repeat(64)},{approvedBy:''},{approvedAt:'invalid'}])assert.throws(()=>approvedParticipantReport(j,actor,{...approval,...change}));
if(j.readiness.missingSections.length||j.readiness.unsafeSections.length)assert.throws(()=>approvedParticipantReport(j,actor,approval));
else{
 const before=JSON.stringify(j),report=approvedParticipantReport(j,actor,approval);
 assert.equal(report.sections.length,9);assert.equal(report.audience,'participant');
 assert.ok(!('commercial'in report)&&!('registration'in report));assert.equal(JSON.stringify(j),before);
}
console.log('PASS approved report authorization, version/source binding, completeness and participant-only projection');
