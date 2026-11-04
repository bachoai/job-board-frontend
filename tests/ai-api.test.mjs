import assert from 'node:assert/strict';
import test from 'node:test';
import { loadApi } from './helpers/load-api.mjs';
import { aiErrorText } from '../src/features/ai/utils/ai.ts';

class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }
test('AI APIs use actual paths, public search, protected CVs and per-request timeouts', async () => {
  const calls = [];
  const { aiApi } = loadApi('../../src/features/ai/api/ai.api.ts', {
    '/lib/api': { ApiError, api: async (path, options) => { calls.push({ path, options }); return {}; } },
    '/utils/ai': { aiErrorText },
  });
  const controller = new AbortController();
  await aiApi.searchJobs('  React developer  ', undefined, undefined, controller.signal);
  await aiApi.getParsedResume(40, controller.signal);
  await aiApi.processResume(40, controller.signal);
  await aiApi.getResumeMatches(40, 10, controller.signal);
  await aiApi.getRankedApplicants(20, controller.signal);
  await aiApi.rescoreApplication(30, controller.signal);
  assert.deepEqual(calls.map(call => call.path), ['/ai/search?q=React+developer&mode=hybrid&limit=10', '/ai/resumes/40/parsed', '/ai/resumes/40/process', '/ai/resumes/40/matches?limit=10', '/ai/jobs/20/applicants', '/ai/applications/30/score']);
  assert.equal(calls[0].options.auth, false);
  assert.ok(calls.slice(1).every(call => call.options.auth !== false));
  assert.ok(calls.every(call => call.options.signal === controller.signal));
  assert.equal(calls[0].options.timeoutMs, 90000);
  assert.equal(calls[2].options.timeoutMs, 120000);
  assert.equal(calls[5].options.timeoutMs, 180000);
  assert.equal(calls[2].options.method, 'POST');
  assert.equal(calls[5].options.method, 'POST');
  assert.ok(calls.every(call => !call.path.startsWith('/api/')));
});
test('AI errors retain HTTP status for permissions and no-data handling', async () => {
  const { aiApi } = loadApi('../../src/features/ai/api/ai.api.ts', {
    '/lib/api': { ApiError, api: async () => { throw new ApiError('Cannot GET /api/ai/search', 404); } },
    '/utils/ai': { aiErrorText },
  });
  await assert.rejects(aiApi.searchJobs('backend'), error => error.status === 404 && /chưa được bật/.test(error.message));
});
test('candidate resumes use GET /resumes and exclude CVs owned by another account', async () => {
  const calls = [];
  const { candidateApi } = loadApi('../../src/features/candidate/api/candidate.api.ts', {
    '/lib/api': { ApiError, apiBlob: () => {}, getSession: () => ({ user: { id: 8 } }), api: async (path) => { calls.push(path); return [{ id: 1, userId: 99 }, { id: 2, userId: 8 }]; } },
  });
  assert.deepEqual(Array.from(await candidateApi.resumes(), row => row.id), [2]);
  assert.deepEqual(calls, ['/resumes']);
});
