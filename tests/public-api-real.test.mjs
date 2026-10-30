import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../src/features/public/api/public.api.ts', import.meta.url), 'utf8');

function makeApi(responses) {
  const calls = [];
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal((js.diagnostics || []).length, 0);
  const exports = {};
  const context = {
    exports,
    URLSearchParams,
    require: (name) => {
      if (name.endsWith('/lib/api')) return {
        api: (path, options) => {
          calls.push({ path, options });
          const value = responses[path];
          return value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
        },
      };
      if (name.endsWith('/utils/open-job')) return { isOpenJob: () => true };
      throw new Error(`Unknown import: ${name}`);
    },
  };
  vm.runInNewContext(js.outputText, context);
  return { api: exports.publicApi, calls };
}

test('all public endpoints use real backend, without demo data or alternative stores', async () => {
  const { api, calls } = makeApi({
    '/jobs?page=1&limit=9&province=H%C3%A0+N%E1%BB%99i&level=intern': { items: [], meta: { page: 1, limit: 9, total: 0, totalPages: 0 } },
    '/jobs/11': { id: 11, companyId: 4 },
    '/search/jobs?q=SQL&limit=50': { count: 0, items: [] },
    '/companies': [{ id: 4, name: 'Company from DB' }],
    '/companies/4': { id: 4, name: 'Company from DB' },
  });
  await api.jobs({ page: 1, limit: 9, province: 'Hà Nội', level: 'intern' });
  assert.equal((await api.job(11)).id, 11);
  assert.equal((await api.search('SQL')).count, 0);
  assert.equal((await api.companies())[0].name, 'Company from DB');
  assert.equal((await api.company(4)).name, 'Company from DB');
  assert.equal(calls.length, 5);
  assert.ok(calls.every(call => call.options.auth === false));
});

test('company jobs come from paginated backend and match companyId', async () => {
  const path = '/jobs?page=1&limit=100&companyName=ABC';
  const { api, calls } = makeApi({
    [path]: { items: [{ id: 1, companyId: 4 }, { id: 2, companyId: 5 }], meta: { page: 1, limit: 100, totalPages: 1 } },
  });
  const jobs = await api.companyJobs(4, 'ABC');
  assert.deepEqual(Array.from(jobs, job => job.id), [1]);
  assert.equal(calls[0].path, path);
});

test('HTTP failures propagate to UI and do not fall back to fabricated data', async () => {
  const error = new Error('GET /jobs — HTTP 500');
  const { api } = makeApi({ '/jobs?page=1&limit=9': error, '/companies': error });
  await assert.rejects(() => api.jobs({ page: 1, limit: 9 }), /HTTP 500/);
  await assert.rejects(() => api.companies(), /HTTP 500/);
});
