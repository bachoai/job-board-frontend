import test from 'node:test';
import assert from 'node:assert/strict';
import { validateResumeFile, MAX_RESUME_BYTES } from './resume-validation.ts';
import { isOpenJob } from '../../public/utils/open-job.ts';
const file = (name, type, size = 1024) => ({ name, type, size });
test('CV validation permits valid PDF/DOC/DOCX under 5MB', () => {
  assert.equal(validateResumeFile(file('cv.pdf', 'application/pdf', MAX_RESUME_BYTES)), '');
  assert.equal(validateResumeFile(file('cv.doc', 'application/msword')), '');
  assert.equal(validateResumeFile(file('cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')), '');
});
test('CV validation rejects oversized and unsupported files', () => {
  assert.match(validateResumeFile(file('cv.pdf', 'application/pdf', MAX_RESUME_BYTES + 1)), /5MB/);
  assert.match(validateResumeFile(file('cv.exe', 'application/octet-stream')), /PDF/);
  assert.match(validateResumeFile(file('cv.pdf', 'text/plain')), /PDF/);
});
test('job closing and deadline rules', () => {
  const now = new Date(2026, 9, 30);
  assert.equal(isOpenJob({ status: 'open', deadline: null }, now), true);
  assert.equal(isOpenJob({ status: 'open', deadline: '2026-10-30' }, now), true);
  assert.equal(isOpenJob({ status: 'open', deadline: '2026-10-29' }, now), false);
  assert.equal(isOpenJob({ status: 'closed', deadline: '2026-12-12' }, now), false);
  assert.equal(isOpenJob({ status: 'blocked', deadline: null }, now), false);
});
