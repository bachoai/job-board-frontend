import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const company = { id: 12, ownerId: 7, name: "Công ty kiểm thử", description: "Phần mềm", website: null, address: null, province: "Hà Nội", ward: null, logoPath: null, createdAt: "2026-10-01T00:00:00Z" };
const jobs = Array.from({ length: 12 }, (_, index) => ({ id: 20 + index, companyId: 12, createdBy: 7, title: `Backend ${20 + index}`, description: "Backend React TypeScript", company, province: index % 2 ? "Đà Nẵng" : "Hà Nội", location: "Văn phòng", level: "junior", jobType: "full_time", salaryMin: 15000000, salaryMax: 25000000, currency: "VND", status: "open", deadline: "2099-12-31", createdAt: "2026-10-01T00:00:00Z" }));
const resume = { id: 40, userId: 8, fileName: "CV-default.pdf", fileUrl: "/uploads/cv.pdf", mimeType: "application/pdf", fileSize: 2000, isDefault: true, uploadedAt: "2026-10-01T00:00:00Z" };
const info = { skills: ["React", "TypeScript"], mentionedSkills: ["React", "Docker"], years: 0, level: "junior", province: "Hà Nội", desiredTitle: "Frontend Developer" };
const parsed = { resumeId: 40, status: "done", parsedAt: "2026-11-01T10:00:00Z", data: info };
const application = { id: 30, jobId: 20, candidateId: 8, resumeId: 40, status: "new", coverLetter: "Thư giới thiệu", createdAt: "2026-10-30T10:00:00Z", updatedAt: "2026-10-30T10:00:00Z" };
const scored = { status: "scored", score: 0.82, label: "suitable", cosine: 0.84, skillRatio: 0.8, levelGap: 0, matchedSkills: ["React"], missingSkills: ["Docker"], reason: null, scoredAt: "2026-11-01T10:00:00Z" };
const applicants = [
  { applicationId: 30, candidateId: 8, candidateName: "Nguyễn Minh An", resumeId: 40, applicationStatus: "new", appliedAt: application.createdAt, ai: scored },
  { applicationId: 31, candidateId: 9, candidateName: "Lê Đang Chờ", resumeId: 42, applicationStatus: "viewed", appliedAt: application.createdAt, ai: { status: "pending" } },
  { applicationId: 32, candidateId: 10, candidateName: "Trần Chưa Chấm", resumeId: null, applicationStatus: "new", appliedAt: application.createdAt, ai: { status: "unscored", score: null, label: null, reason: "Ứng viên chưa có CV" } },
  { applicationId: 33, candidateId: 11, candidateName: "Võ Xem Xét", resumeId: 43, applicationStatus: "interview", appliedAt: application.createdAt, ai: { ...scored, score: 0.15, label: "unsuitable" } },
];
const session = (role: string) => ({ accessToken: `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.sig`, refreshToken: "refresh", user: { id: role === "employer" ? 7 : 8, fullName: "Người kiểm thử", email: `${role}@example.test`, role } });
const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
async function screenshot(page: Page, name: string) {
  await page.evaluate(() => { window.scrollTo(0, 0); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
}

async function setup(page: Page, path: string, role = "candidate") {
  const requests: { path: string; method: string }[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  if (role !== "guest") await page.addInitScript(value => {
    if (window === window.top && location.origin === "http://127.0.0.1:5173") localStorage.setItem("jobboard.session", JSON.stringify(value));
  }, session(role));
  await page.route("http://localhost:3000/api/**", route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (method === "OPTIONS") return route.fulfill({ status: 204 });
    requests.push({ path, method });
    if (path.startsWith("/api/ai/") && path !== "/api/ai/search") expect(route.request().headers().authorization).toMatch(/^Bearer /);
    if (path === "/api/jobs") {
      const page = Number(url.searchParams.get("page") || 1);
      const limit = Number(url.searchParams.get("limit") || 9);
      return json(route, { items: jobs.slice((page - 1) * limit, page * limit), meta: { page, limit, total: jobs.length, totalPages: Math.ceil(jobs.length / limit) } });
    }
    if (path === "/api/jobs/mine") return json(route, [jobs[0]]);
    if (/^\/api\/jobs\/\d+$/.test(path)) return json(route, jobs.find(job => job.id === Number(path.split("/").at(-1))));
    if (path === "/api/companies") return json(route, [company]);
    if (path === "/api/users/me") return json(route, { ...session(role).user, phone: null, isActive: true });
    if (path === "/api/resumes" && method === "GET") return json(route, [{ ...resume, id: 41, userId: 99, fileName: "Foreign-private.pdf" }, { ...resume, id: 42, isDefault: false, fileName: "CV-second.pdf" }, resume]);
    if (path === "/api/resumes" && method === "POST") return json(route, { ...resume, id: 44, fileName: "Uploaded.pdf" }, 201);
    if (path === "/api/applications") return json(route, [application]);
    if (path === "/api/applications/30") return role === "employer" ? json(route, { message: "Forbidden" }, 403) : json(route, application);
    if (path === "/api/ai/search") {
      expect(route.request().headers().authorization).toBeUndefined();
      expect(url.searchParams.get("mode")).toBe("hybrid");
      expect(url.searchParams.get("limit")).toBe("50");
      return json(route, { query: url.searchParams.get("q"), mode: "hybrid", count: 12, items: [...jobs].reverse().map(job => ({ id: job.id, title: job.title, level: job.level, province: job.province, location: job.location, score: 0.03 })) });
    }
    if (path === "/api/ai/resumes/40/parsed") return json(route, parsed);
    if (path === "/api/ai/resumes/42/parsed") return json(route, { resumeId: 42, status: "pending", parsedAt: null, data: null });
    if (path === "/api/ai/resumes/40/matches") return json(route, { resumeId: 40, items: [{ jobId: 20, title: jobs[0].title, company: company.name, province: "Hà Nội", level: "junior", ...scored, matchedSkills: ["React"], missingSkills: ["Docker"] }] });
    if (path === "/api/ai/jobs/20/applicants") return json(route, { jobId: 20, count: applicants.length, items: applicants });
    return json(route, { message: `Unexpected request: ${method} ${path}` }, 500);
  });
  await page.goto(path);
  return { requests, errors };
}

test("AI search enriches ranked IDs, retains order and locally filters and paginates without percent scores", async ({ page }) => {
  const { requests, errors } = await setup(page, "/jobs", "guest");
  await expect(page.getByRole("checkbox", { name: "Tìm kiếm thông minh bằng AI" })).toBeChecked();
  await page.getByLabel("Từ khóa tìm việc").fill("Tôi muốn tìm việc Backend cho sinh viên");
  await page.getByRole("button", { name: "Tìm việc", exact: true }).click();
  await expect(page.getByText("Kết quả tìm kiếm bằng AI", { exact: true })).toBeVisible();
  await expect(page.locator(".public-job-name").first()).toHaveText("Backend 31");
  await expect(page.locator(".public-job-name")).toHaveCount(9);
  await expect(page.locator(".public-job-grid")).not.toContainText("%");
  await page.getByRole("button", { name: "Sau", exact: true }).click();
  await expect(page.locator(".public-job-name").first()).toHaveText("Backend 22");
  await page.getByLabel("Địa điểm", { exact: true }).fill("Hà Nội");
  await expect(page.locator(".public-job-name")).toHaveCount(6);
  await expect(page.locator(".public-job-name").first()).toHaveText("Backend 30");
  expect(requests.filter(r => r.path === "/api/ai/search")).toHaveLength(1);
  expect(requests.some(r => r.path === "/api/search/jobs")).toBe(false);
  expect(errors).toEqual([]);
  await screenshot(page, "ai-search-desktop");
});

test("AI search unavailable displays an honest error and offers basic search over real jobs", async ({ page }) => {
  await setup(page, "/jobs", "guest");
  await page.route("**/api/ai/search?*", route => json(route, { message: "Cannot GET /api/ai/search" }, 404));
  await page.getByLabel("Từ khóa tìm việc").fill("Backend");
  await page.getByRole("button", { name: "Tìm việc", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("chưa được bật");
  await expect(page.locator(".public-job-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Tìm kiếm cơ bản", exact: true }).click();
  await expect(page.locator(".public-job-name")).toHaveCount(9);
  await expect(page.getByRole("checkbox", { name: "Tìm kiếm thông minh bằng AI" })).not.toBeChecked();
});

test("CV analysis is loaded only on demand and excludes foreign CVs", async ({ page }) => {
  const { requests, errors } = await setup(page, "/me/resumes");
  await expect(page.getByText("CV-default.pdf", { exact: true })).toBeVisible();
  await expect(page.getByText("Foreign-private.pdf")).toHaveCount(0);
  expect(requests.some(r => r.path.includes("/parsed"))).toBe(false);
  const cv = page.locator("article").filter({ hasText: "CV-default.pdf" });
  await cv.getByRole("button", { name: "Phân tích bằng AI", exact: true }).click();
  const panel = page.getByRole("region", { name: "Phân tích CV bằng AI" });
  await expect(panel.getByText("Frontend Developer", { exact: true })).toBeVisible();
  await expect(panel.getByText("0 năm", { exact: true })).toBeVisible();
  await expect(panel.locator(".ai-skills").first()).toContainText("TypeScript");
  await screenshot(page, "ai-resume-analysis");
  expect(requests.some(r => r.method === "POST")).toBe(false);
  expect(errors).toEqual([]);
});

test("CV processing failures can be retried with one explicit request and persisted results reloaded", async ({ page }) => {
  const { requests } = await setup(page, "/me/resumes");
  await page.route("**/api/ai/resumes/40/parsed", route => json(route, { ...parsed, status: "error", parsedAt: null, data: { error: "Không đọc được tệp PDF" } }));
  await page.locator("article").filter({ hasText: "CV-default.pdf" }).getByRole("button", { name: "Phân tích bằng AI", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Không đọc được tệp PDF");
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let posts = 0;
  await page.route("**/api/ai/resumes/40/process", async route => {
    posts++;
    await gate;
    await json(route, { resumeId: 40, info, textLength: 200 });
  });
  await page.getByRole("button", { name: "Phân tích lại", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đang phân tích…", exact: true })).toBeDisabled();
  await page.route("**/api/ai/resumes/40/parsed", route => json(route, parsed));
  release();
  await expect(page.getByText("Frontend Developer", { exact: true })).toBeVisible();
  expect(posts).toBe(1);
  expect(requests.filter(r => r.path.includes("/resumes/41/"))).toHaveLength(0);
});

test("AI errors do not block normal CV uploads and do not trigger automatic processing", async ({ page }) => {
  const { requests } = await setup(page, "/me/resumes");
  await page.route("**/api/ai/resumes/40/parsed", route => json(route, { message: "Cannot GET /api/ai/resumes/40/parsed" }, 404));
  await page.locator("article").filter({ hasText: "CV-default.pdf" }).getByRole("button", { name: "Phân tích bằng AI", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("chưa được bật");
  await page.getByLabel("Chọn tệp CV").setInputFiles({ name: "Uploaded.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7 demo fixture") });
  await page.getByRole("button", { name: "Tải lên CV", exact: true }).click();
  await expect(page.locator(".candidate-success")).toContainText("CV đã được tải lên thành công");
  expect(requests.filter(r => r.path.endsWith("/process") && r.method === "POST")).toHaveLength(0);
});

test("recommendations choose the default owned CV and map score and labels correctly", async ({ page }) => {
  const { requests } = await setup(page, "/me/recommended-jobs");
  await expect(page.getByLabel("Chọn CV để tìm việc phù hợp")).toHaveValue("40");
  await expect(page.getByRole("option", { name: "Foreign-private.pdf" })).toHaveCount(0);
  await page.getByRole("button", { name: "Tìm việc phù hợp", exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Điểm phù hợp" })).toHaveAttribute("aria-valuenow", "82");
  await expect(page.getByText("Phù hợp cao", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem chi tiết", exact: true })).toHaveAttribute("href", "/jobs/20");
  expect(requests.some(r => r.path === "/api/ai/resumes/40/matches")).toBe(true);
  await page.getByLabel("Chọn CV để tìm việc phù hợp").selectOption("42");
  await page.getByRole("button", { name: "Tìm việc phù hợp", exact: true }).click();
  await expect(page.getByRole("heading", { name: "CV đang được xử lý", exact: true })).toBeVisible();
  expect(requests.some(r => r.path === "/api/ai/resumes/42/matches")).toBe(false);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("recommendations handle no CV and empty matches without fabricated results", async ({ page }) => {
  await setup(page, "/me/recommended-jobs");
  await page.route("**/api/resumes", route => json(route, []));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Bạn chưa tải CV lên" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tải CV của bạn" })).toHaveAttribute("href", "/me/resumes");
  await page.route("**/api/resumes", route => json(route, [resume]));
  await page.route("**/api/ai/resumes/40/matches?*", route => json(route, { resumeId: 40, items: [] }));
  await page.reload();
  await page.getByRole("button", { name: "Tìm việc phù hợp", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Chưa có việc làm phù hợp" })).toBeVisible();
});

test("ranked applicants distinguish pending, unscored and unsuitable and support filters and sorting", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  const { requests, errors } = await setup(page, "/employer/jobs/20/applications", "employer");
  await page.getByRole("button", { name: "Xếp hạng ứng viên theo AI", exact: true }).click();
  await expect(page.locator("tbody").getByText("Chưa chấm được", { exact: true })).toBeVisible();
  await expect(page.locator("tbody").getByText("Đang chờ đánh giá", { exact: true })).toBeVisible();
  await expect(page.locator("tbody").getByText("Ít phù hợp", { exact: true })).toBeVisible();
  await expect(page.locator("tbody tr").first()).toContainText("Nguyễn Minh An");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await screenshot(page, "ai-ranked-applicants-tablet");
  await page.getByLabel("Sắp xếp điểm AI").selectOption("asc");
  await expect(page.locator("tbody tr").first()).toContainText("Võ Xem Xét");
  await page.getByLabel("Lọc đánh giá AI").selectOption("pending");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Lê Đang Chờ");
  await page.getByLabel("Lọc đánh giá AI").selectOption("");
  await page.getByLabel("Tìm tên ứng viên, mã hồ sơ…").fill("Minh An");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  expect(requests.some(r => r.path.endsWith("/status") && r.method === "PATCH")).toBe(false);
  expect(errors).toEqual([]);
});

test("employer uses authorized AI applicants when normal detail is forbidden and rescores without changing application status", async ({ page }) => {
  const { requests, errors } = await setup(page, "/employer/applications/30?jobId=20", "employer");
  await expect(page.getByRole("alert")).toContainText("chưa cấp quyền");
  const panel = page.getByRole("region", { name: "Đánh giá AI", exact: true });
  await expect(panel.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "82");
  let posts = 0;
  await page.route("**/api/ai/applications/30/score", route => {
    posts++;
    return json(route, { applicationId: 30, status: "scored", score: 0.91, label: "suitable", reason: null });
  });
  await page.route("**/api/ai/jobs/20/applicants", route => json(route, { jobId: 20, count: 1, items: [{ ...applicants[0], ai: { ...scored, score: 0.91 } }] }));
  await panel.getByRole("button", { name: "Chấm điểm lại bằng AI", exact: true }).click();
  await expect(panel.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "91");
  expect(posts).toBe(1);
  expect(requests.some(r => r.path.endsWith("/status") && r.method === "PATCH")).toBe(false);
  expect(requests.some(r => r.path === "/api/resumes/40/file")).toBe(false);
  expect(errors).toEqual([]);
  await screenshot(page, "ai-application-panel");
});

test("AI permission failures do not expose scores or offer rescore workarounds", async ({ page }) => {
  await setup(page, "/employer/applications/30?jobId=999", "employer");
  await page.route("**/api/ai/jobs/999/applicants", route => json(route, { message: "Forbidden" }, 403));
  await page.reload();
  const panel = page.getByRole("region", { name: "Đánh giá AI", exact: true });
  await expect(panel.getByRole("alert")).toContainText("không có quyền");
  await expect(panel.getByRole("progressbar")).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "Chấm điểm lại bằng AI" })).toHaveCount(0);
});

test("AI candidate pages fit mobile and clear results when a different CV is selected", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { errors } = await setup(page, "/me/recommended-jobs");
  await page.getByRole("button", { name: "Tìm việc phù hợp", exact: true }).click();
  await expect(page.getByText("Phù hợp cao", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await screenshot(page, "ai-recommendations-mobile");
  await page.getByLabel("Chọn CV để tìm việc phù hợp").selectOption("42");
  await expect(page.getByText("Phù hợp cao", { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("search omits expired/deleted jobs while preserving the remaining AI ranking", async ({ page }) => {
  await setup(page, "/jobs", "guest");
  await page.route("**/api/jobs/31", route => json(route, { message: "Job deleted" }, 404));
  await page.route("**/api/jobs/30", route => json(route, { ...jobs[10], deadline: "2000-01-01" }));
  await page.getByLabel("Từ khóa tìm việc").fill("Backend");
  await page.getByRole("button", { name: "Tìm việc", exact: true }).click();
  await expect(page.getByText("Kết quả tìm kiếm bằng AI", { exact: true })).toBeVisible();
  await expect(page.locator(".public-job-name").first()).toHaveText("Backend 29");
  await expect(page.locator(".public-job-grid")).not.toContainText("Backend 31");
  await expect(page.locator(".public-job-grid")).not.toContainText("Backend 30");
});

test("switching CVs aborts an in-flight recommendation request", async ({ page }) => {
  const { errors } = await setup(page, "/me/recommended-jobs");
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/ai/resumes/40/matches?*", async route => {
    await gate;
    await json(route, { resumeId: 40, items: [] }).catch(() => {});
  });
  const requested = page.waitForRequest(request => new URL(request.url()).pathname === "/api/ai/resumes/40/matches");
  await page.getByRole("button", { name: "Tìm việc phù hợp", exact: true }).click();
  await requested;
  const aborted = page.waitForEvent("requestfailed", request => new URL(request.url()).pathname === "/api/ai/resumes/40/matches");
  await page.getByLabel("Chọn CV để tìm việc phù hợp").selectOption("42");
  await aborted;
  release();
  await expect(page.getByRole("heading", { name: "Khám phá cơ hội từ CV của bạn" })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("rescore errors are recoverable and unscored remains distinct from a low score", async ({ page }) => {
  const { requests } = await setup(page, "/employer/applications/30?jobId=20", "employer");
  const panel = page.getByRole("region", { name: "Đánh giá AI", exact: true });
  await expect(panel.getByRole("progressbar")).toBeVisible();
  await page.route("**/api/ai/applications/30/score", route => json(route, { message: "Ollama chưa sẵn sàng" }, 503));
  await panel.getByRole("button", { name: "Chấm điểm lại bằng AI", exact: true }).click();
  await expect(panel.getByRole("alert")).toContainText("Ollama chưa sẵn sàng");
  await expect(panel.getByRole("button", { name: "Chấm điểm lại bằng AI", exact: true })).toBeEnabled();
  await page.route("**/api/ai/applications/30/score", route => json(route, { applicationId: 30, status: "unscored", score: null, label: null, reason: "Chưa có vector cho CV hoặc tin" }));
  await page.route("**/api/ai/jobs/20/applicants", route => json(route, { jobId: 20, count: 1, items: [{ ...applicants[0], ai: { status: "unscored", reason: "Chưa có vector cho CV hoặc tin" } }] }));
  await panel.getByRole("button", { name: "Chấm điểm lại bằng AI", exact: true }).click();
  await expect(panel.locator(".ai-score-badge")).toHaveText("Chưa chấm được");
  await expect(panel.getByRole("progressbar")).toHaveCount(0);
  expect(requests.some(request => request.method === "PATCH")).toBe(false);
});
