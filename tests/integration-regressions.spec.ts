import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const token = (seconds = 900) => `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64url')}.signature`;
const user = { id: 7, fullName: 'Ứng viên kiểm thử', email: 'candidate@example.test', role: 'candidate' };
async function session(page: Page, role = 'candidate') {
  await page.addInitScript(value => localStorage.setItem('jobboard.session', JSON.stringify(value)), {
    accessToken: token(), refreshToken: 'test-refresh', user: { ...user, role },
  });
}

test('employer dashboard handles paginated backend and includes jobs on later pages', async ({ page }) => {
  await session(page, 'employer');
  const pages: string[] = [];
  await page.route('**/api/jobs?**', route => {
    const page = new URL(route.request().url()).searchParams.get('page')!;
    pages.push(page);
    return route.fulfill({ json: {
      items: [{ id: Number(page), title: page === '1' ? 'Tin của người khác' : 'Tin nằm ở trang hai', createdBy: page === '1' ? 99 : 7, companyId: 12, status: 'closed', createdAt: '2026-11-01T00:00:00Z' }],
      meta: { page: Number(page), totalPages: 2 },
    } });
  });
  await page.route('**/api/applications?**', route => route.fulfill({ json: [] }));
  await page.goto('/employer/jobs');
  await expect(page.getByRole('cell', { name: /Tin nằm ở trang hai/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Tin của người khác/ })).toHaveCount(0);
  expect(pages).toEqual(['1', '2']);
});

test('failed CV upload can be retried with the same valid file', async ({ page }) => {
  await session(page);
  let uploads = 0;
  await page.route('**/api/resumes', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: [] });
    uploads++;
    return uploads === 1
      ? route.fulfill({ status: 503, json: { message: 'Dịch vụ tạm thời gián đoạn' } })
      : route.fulfill({ status: 201, json: { id: 10 } });
  });
  await page.goto('/me/resumes');
  await page.getByLabel('Chọn tệp CV').setInputFiles({ name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  const upload = page.getByRole('button', { name: 'Tải lên CV', exact: true });
  await upload.click();
  await expect(page.getByRole('alert')).toContainText('Dịch vụ tạm thời gián đoạn');
  await expect(upload).toBeEnabled();
  await upload.click();
  await expect(page.getByRole('status').filter({ hasText: 'CV đã được tải lên thành công' })).toBeVisible();
  expect(uploads).toBe(2);
});

test('saving profile retains the token refreshed while the request was pending', async ({ page }) => {
  await session(page);
  const renewedToken = token(1800);
  await page.route('**/api/users/me', route => route.fulfill({ json: { ...user, phone: null } }));
  await page.route('**/api/users/7', async route => {
    await page.evaluate(accessToken => {
      const stored = JSON.parse(localStorage.getItem('jobboard.session')!);
      localStorage.setItem('jobboard.session', JSON.stringify({ ...stored, accessToken }));
    }, renewedToken);
    await route.fulfill({ json: { ...user, fullName: 'Tên vừa cập nhật', phone: null } });
  });
  await page.goto('/me');
  await page.getByLabel('Họ và tên').fill('Tên vừa cập nhật');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('status')).toContainText('Đã cập nhật hồ sơ thành công');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('jobboard.session')!));
  expect(stored.accessToken).toBe(renewedToken);
  expect(stored.user.fullName).toBe('Tên vừa cập nhật');
});

test('unauthorized CV download clears the expired session and opens login', async ({ page }) => {
  await session(page);
  await page.route('**/api/resumes', route => route.fulfill({ json: [{ id: 10, userId: 7, fileName: 'cv.pdf', mimeType: 'application/pdf', uploadedAt: '2026-11-01T00:00:00Z' }] }));
  await page.route('**/api/resumes/10/file', route => route.fulfill({ status: 401, json: { message: 'Token không hợp lệ' } }));
  await page.goto('/me/resumes');
  await page.getByRole('button', { name: 'Xem', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('jobboard.session'))).toBeNull();
});
