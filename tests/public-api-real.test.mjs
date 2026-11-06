import assert from 'node:assert/strict';
import test from 'node:test';
import { loadApi } from './helpers/load-api.mjs';

function makeApi(responses) {
  const calls = [];
  const exports = loadApi('../../src/features/public/api/public.api.ts', {
      '/lib/api': {
        api: (path, options) => {
          calls.push({ path, options });
          const value = responses[path];
          return value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
        },
      },
      '/utils/open-job': { isOpenJob: () => true },
  });
  return { api: exports.publicApi, calls };
}

test('all public endpoints use real backend, without demo data or alternative stores', async () => {
  const { api, calls } = makeApi({
    '/jobs?page=1&limit=9&province=H%C3%A0+N%E1%BB%99i&level=intern': { items: [], meta: { page: 1, limit: 9, total: 0, totalPages: 0 } },
    '/jobs/11': { id: 11, companyId: 4 },
    '/companies': [{ id: 4, name: 'Company from DB' }],
    '/companies/4': { id: 4, name: 'Company from DB' },
  });
  await api.jobs({ page: 1, limit: 9, province: 'Hà Nội', level: 'intern' });
  assert.equal((await api.job(11)).id, 11);
  assert.equal((await api.companies())[0].name, 'Company from DB');
  assert.equal((await api.company(4)).name, 'Company from DB');
  assert.equal(calls.length, 4);
  assert.ok(calls.every(call => call.options.auth === false));
});

test('company jobs come from paginated backend and match companyId', async () => {
  const path = '/jobs?page=1&limit=100&companyName=ABC';
  const { api, calls } = makeApi({
    [path]: { items: [{ id: 1, companyId: 4 }, { id: 2, companyId: 5 }], meta: { page: 1, limit: 100, total: 2, totalPages: 1 } },
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

test('invalid job pagination becomes a recoverable API error instead of a render crash', async () => {
  const { api } = makeApi({ '/jobs?page=1&limit=9': { items: [] } });
  await assert.rejects(() => api.jobs({ page: 1, limit: 9 }), /không hợp lệ/);
});

test('AI2 array responses are filtered and paginated, including empty arrays', async () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, companyId: 4, title: 'Backend', province: 'Hà Nội', level: 'junior', status: 'open', deadline: null }));
  const path = '/jobs?page=2&limit=9&province=H%C3%A0+N%E1%BB%99i&level=junior';
  const { api } = makeApi({
    [path]: [...rows, { ...rows[0], id: 99, province: 'Đà Nẵng' }, { ...rows[0], id: 100, level: 'senior' }],
    '/jobs?page=1&limit=9': [],
    '/jobs?page=1&limit=100&companyName=ABC': rows,
    '/companies': [{ id: 4, name: 'ABC' }],
  });
  const page = await api.jobs({ page: 2, limit: 9, province: 'Hà Nội', level: 'junior' });
  assert.deepEqual(Array.from(page.items, job => job.id), [10, 11, 12]);
  assert.equal(page.meta.total, 12);
  assert.equal(page.meta.totalPages, 2);
  const empty = await api.jobs({ page: 1, limit: 9 });
  assert.equal(empty.items.length, 0);
  assert.equal(empty.meta.total, 0);
  assert.equal((await api.companyJobs(4, 'ABC')).length, 12);
});
