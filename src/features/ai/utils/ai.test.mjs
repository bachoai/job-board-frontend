import assert from 'node:assert/strict';
import test from 'node:test';
import { scorePercent, parsedInfo, levelGapText, sortApplicants, orderSearchResults, matchLabels, aiErrorText } from './ai.ts';

test('matching scores map 0..1 to percent and invalid scores stay missing', () => {
  assert.equal(scorePercent(0), 0);
  assert.equal(scorePercent(0.825), 83);
  assert.equal(scorePercent(1), 100);
  for (const value of [null, undefined, NaN, Infinity, -0.1, 82, '0.8']) assert.equal(scorePercent(value), null);
  assert.equal(matchLabels.suitable, 'Phù hợp cao');
  assert.equal(matchLabels.review, 'Cần xem xét');
  assert.equal(matchLabels.unsuitable, 'Ít phù hợp');
});
test('pending/unscored applicants remain last in either sort direction, including score zero', () => {
  const rows = [
    { applicationId: 1, ai: { status: 'pending', score: 1 } },
    { applicationId: 2, ai: { status: 'scored', score: 0 } },
    { applicationId: 3, ai: { status: 'unscored', reason: 'No CV' } },
    { applicationId: 4, ai: { status: 'scored', score: 0.9 } },
  ];
  assert.deepEqual(sortApplicants(rows).map(r => r.applicationId), [4, 2, 1, 3]);
  assert.deepEqual(sortApplicants(rows, 'asc').map(r => r.applicationId), [2, 4, 1, 3]);
  assert.deepEqual(rows.map(r => r.applicationId), [1, 2, 3, 4]);
});
test('AI search keeps backend ranking, skips missing jobs and removes duplicate IDs', () => {
  const hits = [{ id: 3, score: 0.03 }, { id: 1, score: 4 }, { id: 9 }, { id: 3 }];
  assert.deepEqual(orderSearchResults(hits, [{ id: 1 }, { id: 3 }, { id: 5 }]), [{ id: 3 }, { id: 1 }]);
});
test('only done analysis exposes CV info; extraction errors remain errors', () => {
  assert.equal(parsedInfo({ status: 'pending', data: null }), null);
  assert.equal(parsedInfo({ status: 'error', data: { error: 'Cannot read PDF' } }), null);
  const info = { skills: [], years: 0 };
  assert.equal(parsedInfo({ status: 'done', data: info }), info);
  assert.match(levelGapText(2), /cao hơn CV 2 bậc/);
  assert.match(levelGapText(-1), /CV cao hơn yêu cầu 1 bậc/);
  assert.match(levelGapText(0), /cùng cấp/);
  assert.match(levelGapText(null), /Chưa xác định/);
});
test('AI unavailable, permission errors and backend reasons remain distinguishable', () => {
  assert.match(aiErrorText({ status: 404, message: 'Cannot GET /api/ai/search' }), /chưa được bật/);
  assert.match(aiErrorText({ status: 403, message: 'Forbidden' }), /không có quyền/);
  assert.match(aiErrorText({ status: 401 }), /đăng nhập lại/);
  assert.match(aiErrorText({ status: 404, message: 'CV đang được xử lý' }), /CV đang được xử lý/);
  assert.equal(aiErrorText(new Error('Ollama unavailable')), 'Ollama unavailable');
});
