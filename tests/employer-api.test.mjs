import assert from 'node:assert/strict';
import test from 'node:test';
import { loadApi } from './helpers/load-api.mjs';

function makeJobsApi(request) {
  const { getAllJobs } = loadApi('../../src/lib/job-list.ts', {
    './api': { api: request },
  });
  return loadApi('../../src/features/employer/api/jobs.api.ts', {
    '/lib/api': { api: request },
    '/lib/job-list': { getAllJobs },
    '/components/job-form': { jobPayload: () => ({}) },
  }).jobsApi;
}

test('AI2 employer jobs use authenticated /jobs and keep only owned jobs in all statuses', async () => {
  const calls = [];
  const rows = [
    { id: 1, createdBy: 7, status: 'open' },
    { id: 2, createdBy: 999, status: 'open' },
    { id: 3, createdBy: 7, status: 'closed' },
    { id: 4, createdBy: 7, status: 'blocked' },
  ];
  const jobsApi = makeJobsApi(async (path, options) => { calls.push({ path, options }); return rows; });
  const signal = new AbortController().signal;
  assert.deepEqual(Array.from(await jobsApi.myJobs(7, signal), job => job.id), [1, 3, 4]);
  assert.equal(calls[0].path, '/jobs?page=1&limit=100');
  assert.equal(calls[0].options.signal, signal);
  assert.notEqual(calls[0].options.auth, false);
  assert.equal((await jobsApi.myJobs(42, signal)).length, 0);
});

test('paginated AI2 jobs include owned jobs on later pages and keep closed/blocked jobs', async () => {
  const calls = [];
  const jobsApi = makeJobsApi(async (path, options) => {
    calls.push({ path, options });
    const page = Number(new URL(path, 'http://test').searchParams.get('page'));
    return { items: page === 1 ? [{ id: 1, createdBy: 999 }] : [
      { id: 2, createdBy: 7, status: 'closed' },
      { id: 3, createdBy: 7, status: 'blocked' },
    ], meta: { totalPages: 2 } };
  });
  const signal = new AbortController().signal;
  assert.deepEqual(Array.from(await jobsApi.myJobs(7, signal), job => job.id), [2, 3]);
  assert.deepEqual(calls.map(call => call.path), ['/jobs?page=1&limit=100', '/jobs?page=2&limit=100']);
  assert.ok(calls.every(call => call.options.signal === signal && call.options.auth !== false));
});

test('malformed pagination fails clearly instead of looping through unlimited requests', async () => {
  for (const totalPages of [undefined, NaN, Infinity, -1, 1.5]) {
    const jobsApi = makeJobsApi(async () => ({ items: [{ id: 1 }], meta: { totalPages } }));
    await assert.rejects(() => jobsApi.myJobs(7), /không hợp lệ/);
  }
});

test('cancelled requests do not load more job pages', async () => {
  const controller = new AbortController();
  let calls = 0;
  const jobsApi = makeJobsApi(async () => {
    calls++;
    controller.abort();
    return { items: [{ id: 1 }], meta: { totalPages: 2 } };
  });
  await assert.rejects(() => jobsApi.myJobs(7, controller.signal), { name: 'AbortError' });
  assert.equal(calls, 1);
});
