import test from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage, requestLabel } from '../src/lib/api-error-message.ts';

test('HTTP 500 includes method, route and status, without query credentials', () => {
  const text = apiErrorMessage({ message: 'Lỗi hệ thống, vui lòng thử lại sau' }, 500, 'get', '/jobs?q=secret&token=unsafe');
  assert.match(text, /Lỗi hệ thống, vui lòng thử lại sau/);
  assert.match(text, /GET \/jobs — HTTP 500/);
  assert.doesNotMatch(text, /secret|token|unsafe/);
});

test('HTTP 400 preserves backend validation messages', () => {
  assert.equal(apiErrorMessage({ message: ['Tên là bắt buộc', 'Sai định dạng'] }, 400, 'POST', '/auth/register'), 'Tên là bắt buộc · Sai định dạng');
});

test('HTTP 401 remains 401-specific, without replacing original errors', () => {
  assert.equal(apiErrorMessage({ error: { message: 'Đăng nhập thất bại' } }, 401, 'POST', '/auth/login'), 'Đăng nhập thất bại');
});

test('Unknown errors still show the method and path', () => {
  const text = apiErrorMessage(null, 503, 'GET', '/companies?x=1');
  assert.match(text, /GET \/companies — HTTP 503/);
  assert.doesNotMatch(text, /x=1/);
});

test('request label strips hashes and queries', () => {
  assert.equal(requestLabel('patch', '/users/5?key=abc#frag'), 'PATCH /users/5');
});
