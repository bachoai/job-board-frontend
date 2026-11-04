import assert from 'node:assert/strict';
import test from 'node:test';
import { loadApi } from './helpers/load-api.mjs';

test('AI2 employer jobs use authenticated /jobs and keep only owned jobs in all statuses', async () => {
  const calls = [];
  const rows = [
    { id: 1, createdBy: 7, status: 'open' },
    { id: 2, createdBy: 999, status: 'open' },
    { id: 3, createdBy: 7, status: 'closed' },
    { id: 4, createdBy: 7, status: 'blocked' },
  ];
  const { jobsApi } = loadApi('../../src/features/employer/api/jobs.api.ts', {
    '/lib/api': { api: async (path, options) => { calls.push({ path, options }); return rows; } },
    '/components/job-form': { jobPayload: () => ({}) },
  });
  const signal = new AbortController().signal;
  assert.deepEqual(Array.from(await jobsApi.myJobs(7, signal), job => job.id), [1, 3, 4]);
  assert.equal(calls[0].path, '/jobs');
  assert.equal(calls[0].options.signal, signal);
  assert.notEqual(calls[0].options.auth, false);
  assert.equal((await jobsApi.myJobs(42, signal)).length, 0);
});
