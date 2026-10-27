// Offline route tests: production imports are replaced before route evaluation; no SDK or env files loaded.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ts = createRequire(import.meta.url)('typescript');
function load(relative, dependencies = {}) {
  const filename = resolve(root, relative);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports, require(name) {
    if (!Object.hasOwn(dependencies, name)) throw new Error('Unmocked dependency blocked: ' + name);
    return dependencies[name];
  } }, { filename });
  return module.exports;
}
const { STATUS_OPTS } = load('lib/dna-data.ts');
const parser = load('lib/security/admin-participant-update.ts', { '../dna-data': { STATUS_OPTS } });
const id = '00000000-0000-4000-8000-000000000001';
function harness({ authed = true, dbError = null } = {}) {
  const calls = [];
  const chain = {
    update(updates) { calls.push(['update', updates]); return this; },
    eq(key, value) { calls.push(['eq', key, value]); return this; },
    select() { calls.push(['select']); return this; },
    async single() { return { data: { id, status: 'Novo' }, error: dbError }; }
  };
  const route = load('app/api/admin/participants/route.ts', {
    '@/lib/supabase/service': { async createServiceClient() { calls.push(['client']); return { from(table) { calls.push(['from', table]); return chain; } }; } },
    '@/lib/questionnaire-platform/auth': { async isAdminAuthed() { calls.push(['auth']); return authed; } },
    '@/lib/security/admin-participant-update': parser,
    'next/server': { NextResponse: { json(body, options) { return Response.json(body, options); } } }
  });
  return { calls, route };
}
const req = body => new Request('http://offline.test/api/admin/participants', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
test('unauthenticated request is rejected before parsing or creating privileged client', async () => {
  const h = harness({ authed: false });
  const r = await h.route.PATCH({ json() { throw Error('Must not parse'); } });
  assert.equal(r.status, 401); assert.deepEqual(h.calls, [['auth']]);
});
for (const status of STATUS_OPTS) test('existing panel status remains usable: ' + status, async () => {
  const h = harness(); const r = await h.route.PATCH(req({ id, status }));
  assert.equal(r.status, 200);
  assert.equal(h.calls.find(c => c[0] === 'update')[1].status, status);
  assert.deepEqual(h.calls.find(c => c[0] === 'eq'), ['eq', 'id', id]);
});
test('notes preserve typed whitespace and permit clearing with empty string or null', async () => {
  for (const notes of ['  atendimento em andamento  ', '', null]) {
    const h = harness(); const r = await h.route.PATCH(req({ id, notes }));
    assert.equal(r.status, 200); assert.equal(h.calls.find(c => c[0] === 'update')[1].notes, notes);
  }
});
test('status and notes may be sent together; input is not mutated', () => {
  const input = Object.freeze({ id, status: ' Novo ', notes: 'OK' });
  const r = parser.parseAdminParticipantUpdate(input);
  assert.equal(r.ok, true); assert.equal(r.data.updates.status, 'Novo');
  assert.equal(input.status, ' Novo ');
});
for (const field of ['institution_id', 'unit_id', 'seller_id', 'vendor_slug', 'primary_profile', 'secondary_profile', 'percentages', 'quiz_completed', 'quiz_completed_at', 'name', 'email', 'created_at', 'role']) {
  test('protected or unknown field rejected before DB access: ' + field, async () => {
    const h = harness(); const r = await h.route.PATCH(req({ id, notes: 'legitimate', [field]: 'forged' }));
    assert.equal(r.status, 400); assert.deepEqual(h.calls, [['auth']]);
  });
}
test('invalid JSON returns 400 without privileged DB access', async () => {
  const h = harness(); const r = await h.route.PATCH({ async json() { throw new SyntaxError('invalid'); } });
  assert.equal(r.status, 400); assert.deepEqual(h.calls, [['auth']]);
});
test('invalid shapes ids status notes and empty changes fail closed', async () => {
  for (const body of [null, [], true, 'text', {}, { id }, { id: 'not-uuid', notes: 'x' }, { id: 42, notes: 'x' }, { id, status: '' }, { id, status: 'inventado' }, { id, notes: {} }, { id, notes: 0 }, { id, status: null }]) {
    const h = harness(); const r = await h.route.PATCH(req(body));
    assert.equal(r.status, 400); assert.deepEqual(h.calls, [['auth']]);
  }
});
test('own __proto__ JSON key cannot be mass assigned', async () => {
  const h = harness(); const body = JSON.parse('{"id":"' + id + '","notes":"ok","__proto__":{"role":"owner"}}');
  assert.equal((await h.route.PATCH(req(body))).status, 400); assert.deepEqual(h.calls, [['auth']]);
});
test('database failure is not reported as success', async () => {
  const h = harness({ dbError: { message: 'synthetic failure' } });
  const r = await h.route.PATCH(req({ id, notes: 'x' }));
  assert.equal(r.status, 500); assert.equal((await r.json()).success, undefined);
});
test('valid edit targets participants and sends only supplied editable fields', async () => {
  const h = harness(); const r = await h.route.PATCH(req({ id, notes: 'x' }));
  assert.equal(r.status, 200); assert.deepEqual(h.calls.slice(0, 3), [['auth'], ['client'], ['from', 'participants']]);
  assert.equal(JSON.stringify(h.calls.find(c => c[0] === 'update')[1]), '{"notes":"x"}');
});
