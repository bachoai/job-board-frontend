import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";
const session = (role = "employer") => ({
  accessToken: `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.sig`,
  refreshToken: "refresh",
  user: {
    id: role === "admin" ? 1 : 7,
    fullName: role === "admin" ? "Quản trị viên" : "Nhà tuyển dụng",
    email: `${role}@example.test`,
    role,
  },
});
const company = {
  id: 12,
  ownerId: 7,
  name: "Công ty Mẫu",
  description: "Công nghệ phần mềm",
  website: "https://example.test",
  address: "123 Đường Mới",
  province: "Hà Nội",
  ward: "Ba Đình",
  logoPath: null,
  createdAt: "2026-10-01T00:00:00Z",
};
const job = {
  id: 20,
  companyId: 12,
  createdBy: 7,
  title: "Backend Developer",
  description: "Phát triển API tuyển dụng",
  location: "Văn phòng",
  province: "Hà Nội",
  jobType: "full_time",
  level: "junior",
  salaryMin: 10000000,
  salaryMax: 20000000,
  currency: "VND",
  status: "open",
  deadline: "2099-12-31",
  createdAt: "2026-10-01T00:00:00Z",
};
const application = {
  id: 30,
  jobId: 20,
  candidateId: 8,
  resumeId: 40,
  coverLetter: "Tôi có kinh nghiệm TypeScript.",
  status: "new",
  createdAt: "2026-10-25T12:00:00Z",
  updatedAt: "2026-10-25T12:00:00Z",
};
const users = [
  {
    id: 1,
    fullName: "Quản trị viên",
    email: "admin@example.test",
    role: "admin",
    isActive: true,
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: 8,
    fullName: "Ứng viên A",
    email: "candidate@example.test",
    role: "candidate",
    isActive: true,
    createdAt: "2026-10-01T00:00:00Z",
  },
];
const json = (route: Route, data: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
async function setup(page: Page, path: string, role = "employer") {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(
    (value) => localStorage.setItem("jobboard.session", JSON.stringify(value)),
    session(role),
  );
  await page.route("http://localhost:3000/api/**", (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204 });
    if (path === "/api/companies/owner/7")
      return json(route, { data: [company] });
    if (path === "/api/companies") return json(route, [company]);
    if (path === "/api/jobs")
      return json(route, [
        job,
        { ...job, id: 21, title: "Tin của người khác", createdBy: 999 },
      ]);
    if (path === "/api/jobs/20") return json(route, job);
    if (path === "/api/applications" && url.searchParams.get("jobId") === "20")
      return json(route, [application]);
    if (path === "/api/applications/30") return json(route, application);
    if (path === "/api/applications/30/history") return json(route, []);
    if (path === "/api/resumes/40/file")
      return route.fulfill({ status: 200, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", body: "mock-word-cv" });
    if (path === "/api/users") return json(route, users);
    return json(
      route,
      { message: `Unexpected: ${route.request().method()} ${path}` },
      500,
    );
  });
  await page.goto(path);
  return errors;
}

test("B1 creates company with URL validation and selects saved company", async ({
  page,
}) => {
  await setup(page, "/employer/company");
  await page.getByLabel("Chọn công ty").selectOption("new");
  await page.getByRole("button", { name: "Tạo công ty", exact: true }).click();
  await expect(page.getByText("Vui lòng nhập tên công ty.")).toBeVisible();
  await page.getByLabel("Tên công ty").fill("Công ty mới");
  await page.getByLabel("Website", { exact: true }).fill("khong-phai-url");
  await page.getByRole("button", { name: "Tạo công ty", exact: true }).click();
  await expect(
    page.getByText("Nhập URL hợp lệ, ví dụ https://congty.vn."),
  ).toBeVisible();
  let payload: Record<string, unknown> = {};
  await page.route("**/api/companies", (route) => {
    payload = route.request().postDataJSON();
    return json(route, { ...company, ...payload, id: 13 }, 201);
  });
  await page
    .getByLabel("Website", { exact: true })
    .fill("https://company.test");
  await page.getByRole("button", { name: "Tạo công ty", exact: true }).click();
  await expect(page.getByLabel("Chọn công ty")).toHaveValue("13");
  await expect(page.getByRole("status").first()).toContainText(
    "Đã lưu thông tin công ty",
  );
  expect(payload.name).toBe("Công ty mới");
  expect(payload).not.toHaveProperty("ownerId");
});

test("B1 surfaces existing backend update permission error without losing edits", async ({
  page,
}) => {
  await setup(page, "/employer/company");
  await page.getByLabel("Tên công ty").fill("Tên đã chỉnh sửa");
  await page.route("**/api/companies/12", (route) =>
    json(
      route,
      { message: "Bạn không có quyền chỉnh sửa thông tin của công ty này" },
      403,
    ),
  );
  await page.getByRole("button", { name: "Lưu thông tin" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "không có quyền chỉnh sửa",
  );
  await expect(page.getByLabel("Tên công ty")).toHaveValue("Tên đã chỉnh sửa");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("B3 loads job, preserves immutable company/currency and omits unchanged expired deadline", async ({
  page,
}) => {
  await setup(page, "/employer/jobs/20/edit");
  const oldJob = { ...job, currency: "USD", deadline: "2000-01-01" };
  await page.route("**/api/jobs/20", (route) => json(route, oldJob));
  await page.reload();
  await expect(page.getByLabel("Công ty đăng tuyển")).toBeDisabled();
  await expect(page.getByLabel("Tiêu đề tuyển dụng")).toHaveValue(job.title);
  let payload: Record<string, unknown> = {};
  await page.route("**/api/jobs/20", (route) => {
    payload = route.request().postDataJSON();
    return json(route, { ...oldJob, ...payload });
  });
  await page.getByLabel("Tiêu đề tuyển dụng").fill("Vị trí cập nhật");
  await page.getByLabel("Mô tả công việc").fill("");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi");
  expect(payload.title).toBe("Vị trí cập nhật");
  expect(payload.description).toBeNull();
  expect(payload.currency).toBe("USD");
  expect(payload).not.toHaveProperty("companyId");
  expect(payload).not.toHaveProperty("deadline");
});

test("B3 blocks editing another owner and blocked jobs before rendering the form", async ({
  page,
}) => {
  await setup(page, "/employer/jobs/20/edit");
  await page.route("**/api/jobs/20", (route) =>
    json(route, { ...job, createdBy: 999 }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "không có quyền chỉnh sửa",
  );
  await expect(page.getByLabel("Tiêu đề tuyển dụng")).toHaveCount(0);
  await page.route("**/api/jobs/20", (route) =>
    json(route, { ...job, status: "blocked" }),
  );
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "đã bị quản trị viên chặn",
  );
});

test("B4 shows only own jobs, application count, confirms closing and preserves backend delete error", async ({
  page,
}) => {
  const errors = await setup(page, "/employer/jobs");
  await expect(
    page.getByRole("cell", { name: /Backend Developer/ }),
  ).toBeVisible();
  await expect(page.getByText("Tin của người khác")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "1 hồ sơ →" })).toBeVisible();
  await page.route("**/api/jobs/20", (route) =>
    route.request().method() === "PATCH"
      ? json(route, { ...job, status: "closed" })
      : json(
          route,
          { message: "Tin đã có hồ sơ, hãy đóng tin thay vì xoá" },
          400,
        ),
  );
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Đã đóng", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "đã có hồ sơ",
  );
  expect(errors).toEqual([]);
});

test("B5 filters applicants by status and opens B6 detail with CV", async ({
  page,
}) => {
  await setup(page, "/employer/jobs/20/applications");
  await expect(page.getByText("Ứng viên #8", { exact: true })).toBeVisible();
  await page.getByLabel("Lọc trạng thái hồ sơ").selectOption("rejected");
  await expect(page.getByText("Không có kết quả phù hợp")).toBeVisible();
  await page.getByLabel("Lọc trạng thái hồ sơ").selectOption("new");
  await page.getByRole("link", { name: "Xem hồ sơ →" }).click();
  await expect(page).toHaveURL(/\/employer\/applications\/30$/);
  await expect(page.getByText(application.coverLetter)).toBeVisible();
  await expect(page.getByRole("button", { name: "Tải CV" })).toBeEnabled();
});

test("B6 rejection saves status/note/history and makes rejected status final", async ({
  page,
}) => {
  const errors = await setup(page, "/employer/applications/30");
  await expect(page.getByLabel("Trạng thái mới")).toBeVisible();
  await page.getByLabel("Trạng thái mới").selectOption("rejected");
  await page
    .getByLabel("Ghi chú cho ứng viên")
    .fill("Chưa phù hợp với vị trí hiện tại.");
  let payload: unknown;
  await page.route("**/api/applications/30/status", (route) => {
    payload = route.request().postDataJSON();
    return json(route, { ...application, status: "rejected" });
  });
  await page.route("**/api/applications/30/history", (route) =>
    json(route, [
      {
        id: 2,
        applicationId: 30,
        fromStatus: "new",
        toStatus: "rejected",
        changedBy: 7,
        note: "Chưa phù hợp với vị trí hiện tại.",
        createdAt: "2026-10-30T12:00:00Z",
      },
    ]),
  );
  await page.getByRole("button", { name: "Cập nhật trạng thái" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "không thể đổi lại trạng thái",
  );
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(
    page.getByText("Hồ sơ đã bị từ chối và không thể thay đổi trạng thái."),
  ).toBeVisible();
  await expect(page.getByLabel("Trạng thái mới")).toHaveCount(0);
  await expect(page.locator(".timeline")).toContainText(
    "Chưa phù hợp với vị trí hiện tại.",
  );
  expect(payload).toEqual({
    status: "rejected",
    note: "Chưa phù hợp với vị trí hiện tại.",
  });
  expect(errors).toEqual([]);
});

test("B7 locks user, disables unsupported unlocking and deletes only after confirmation", async ({
  page,
}) => {
  await setup(page, "/admin/users", "admin");
  await page
    .getByLabel("Tìm theo tên, email, mã người dùng…")
    .fill("candidate@example.test");
  await page.route("**/api/users/lock/8", (route) =>
    json(route, { ...users[1], isActive: false }),
  );
  await page.getByRole("button", { name: "Khóa", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mở khóa", exact: true }),
  ).toBeDisabled();
  await page.route("**/api/users/8", (route) =>
    json(route, { message: "Đã xóa" }),
  );
  await page.getByRole("button", { name: "Xóa", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("không thể hoàn tác");
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("cell", { name: /Ứng viên A/ })).toHaveCount(0);
});

test("B8 reviews and blocks a job and reflects filter results", async ({
  page,
}) => {
  const errors = await setup(page, "/admin/jobs", "admin");
  const row = page.getByRole("row").filter({ hasText: "Backend Developer" });
  await row.getByRole("button", { name: "Xem", exact: true }).click();
  await expect(page.locator(".job-review")).toContainText(job.description);
  await page.route("**/api/jobs/20/block", (route) =>
    json(route, { ...job, status: "blocked" }),
  );
  await row.getByRole("button", { name: "Chặn", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await page.getByLabel("Lọc trạng thái tin").selectOption("blocked");
  await expect(
    page.getByRole("cell", { name: "Bị chặn", exact: true }),
  ).toBeVisible();
  await expect(
    row.getByRole("button", { name: "Chặn", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/admin-jobs.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("B9 company deletion explains cascading consequences and updates the list", async ({
  page,
}) => {
  await setup(page, "/admin/companies", "admin");
  await page.route("**/api/companies/12", (route) =>
    json(route, { message: "Đã xóa" }),
  );
  await page.getByRole("button", { name: "Xóa", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "tin tuyển dụng và các dữ liệu ứng tuyển liên quan",
  );
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("cell", { name: /Công ty Mẫu/ })).toHaveCount(0);
});

test("role guards deny cross-role routes without calling restricted APIs", async ({
  page,
}) => {
  await setup(page, "/admin/users");
  let restrictedRequests = 0;
  await page.route("**/api/users", (route) => {
    restrictedRequests++;
    return json(route, users);
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Không có quyền truy cập" }),
  ).toBeVisible();
  expect(restrictedRequests).toBe(0);
});

test("common table searches, paginates and filters a large user list", async ({
  page,
}) => {
  await setup(page, "/admin/users", "admin");
  await page.route("**/api/users", (route) =>
    json(
      route,
      Array.from({ length: 25 }, (_, index) => ({
        ...users[1],
        id: index + 100,
        fullName: `Người dùng ${index + 1}`,
        email: `user${index + 1}@example.test`,
      })),
    ),
  );
  await page.reload();
  await expect(page.getByText("25 kết quả · Trang 1/3")).toBeVisible();
  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(page.getByText("25 kết quả · Trang 2/3")).toBeVisible();
  await page.getByLabel("Tìm theo tên, email, mã người dùng…").fill("user25@");
  await expect(page.getByRole("cell", { name: /Người dùng 25/ })).toBeVisible();
  await expect(page.getByText("1 kết quả · Trang 1/1")).toBeVisible();
});

test("employer and admin management pages fit a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await setup(page, "/employer/jobs");
  await expect(page.getByRole("link", { name: "1 hồ sơ →" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/employer-jobs-mobile.png",
    fullPage: true,
  });
  await page.goto("/employer/applications/30");
  await expect(page.getByLabel("Trạng thái mới")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("B3 uses the latest saved values when clearing an optional field on a second save", async ({
  page,
}) => {
  await setup(page, "/employer/jobs/20/edit");
  let stored = { ...job, description: null as string | null };
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/jobs/20", (route) => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON();
      bodies.push(body);
      stored = { ...stored, ...body };
    }
    return json(route, stored);
  });
  await page.reload();
  await page.getByLabel("Mô tả công việc").fill("Mô tả vừa thêm");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi");
  await page.getByLabel("Mô tả công việc").fill("");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu thay đổi");
  expect(bodies).toHaveLength(2);
  expect(bodies[1].description).toBeNull();
});

test("admin login from an employer URL opens the admin workspace", async ({
  page,
}) => {
  await setup(page, "/employer/jobs/new");
  await page.evaluate(() => localStorage.removeItem("jobboard.session"));
  // Use a new navigation without the stored-session initializer.
  await page.context().clearCookies();
  await page.evaluate(() =>
    window.dispatchEvent(new Event("jobboard:session")),
  );
  await page.route("**/api/auth/login", (route) =>
    json(route, session("admin")),
  );
  await page.getByLabel("Email").fill("admin@example.test");
  await page.getByLabel("Mật khẩu").fill("password");
  await page.getByRole("button", { name: "Đăng nhập →" }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  await expect(
    page.getByRole("heading", { name: "Quản lý người dùng" }),
  ).toBeVisible();
});

test("B6 missing CV is recoverable and does not prevent reviewing the application", async ({
  page,
}) => {
  await setup(page, "/employer/applications/30");
  await page.route("**/api/resumes/40/file", (route) =>
    json(route, { message: "CV không còn tồn tại" }, 404),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("CV không còn tồn tại");
  await expect(page.getByLabel("Trạng thái mới")).toBeEnabled();
  await expect(page.getByText(application.coverLetter)).toBeVisible();
});

test("SaaS mobile navigation opens, switches to all applicants and closes after selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await setup(page, "/employer/jobs");
  await expect(page.getByRole("link", { name: "1 hồ sơ →" })).toBeVisible();
  await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
  const drawer = page.getByRole("dialog", { name: "Menu điều hướng" });
  await expect(drawer).toBeVisible();
  await drawer
    .getByRole("link", { name: "Hồ sơ ứng tuyển", exact: true })
    .click();
  await expect(page).toHaveURL(/\/employer\/applications$/);
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole("cell", { name: /Ứng viên #8/ })).toBeVisible();
  await page.getByLabel("Lọc trạng thái hồ sơ").selectOption("rejected");
  await expect(page.getByText("Không có kết quả phù hợp")).toBeVisible();
  await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("SaaS dashboard renders the blue design, live counts and posting date", async ({
  page,
}) => {
  const errors = await setup(page, "/employer/jobs");
  await expect(
    page.getByRole("columnheader", { name: "Ngày đăng" }),
  ).toBeVisible();
  await expect(page.locator(".stat-card")).toHaveCount(4);
  const style = await page
    .getByRole("link", { name: "Đăng tin mới", exact: true })
    .last()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(style).toBe("rgb(37, 99, 235)");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/saas-employer-desktop.png",
    fullPage: true,
  });
  await page.goto("/employer/company");
  await expect(page.locator(".company-profile")).toContainText(company.name);
  await page.screenshot({
    path: "test-results/saas-company-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
