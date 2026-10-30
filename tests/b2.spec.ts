import { test, expect } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const token = (seconds = 900) =>
  `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString("base64url")}.signature`;
const makeSession = (role = "employer", seconds = 900) => ({
  accessToken: token(seconds),
  refreshToken: "test-refresh",
  user: {
    id: 7,
    fullName: "Nguyễn Tuyển Dụng",
    email: "employer@example.test",
    role,
  },
});
const company = { id: 12, name: "Công ty Kiểm Thử", ownerId: 7 };
const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

async function setup(
  page: Page,
  options: {
    companies?: (typeof company)[];
    companyStatus?: number;
    loginRole?: string;
    session?: ReturnType<typeof makeSession>;
  } = {},
) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("http://localhost:3000/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204 });
    if (path === "/api/auth/login")
      return json(route, makeSession(options.loginRole));
    if (path === "/api/auth/logout") return json(route, { message: "OK" });
    if (path === "/api/companies/owner/7")
      return json(
        route,
        options.companyStatus
          ? { message: "Chưa có công ty" }
          : { data: options.companies ?? [company] },
        options.companyStatus ?? 200,
      );
    return json(route, { message: `Unexpected request: ${path}` }, 500);
  });
  if (options.session)
    await page.addInitScript(
      (session) =>
        localStorage.setItem("jobboard.session", JSON.stringify(session)),
      options.session,
    );
  await page.goto("/employer/jobs/new");
  return errors;
}

async function login(page: Page) {
  await page.getByLabel("Email").fill("employer@example.test");
  await page.getByLabel("Mật khẩu").fill("test-password");
  await page.getByRole("button", { name: "Đăng nhập →" }).click();
  await expect(page.getByLabel("Công ty đăng tuyển")).toHaveValue("12");
}

const postButton = (page: Page) =>
  page.getByRole("button", { name: "Đăng tin tuyển dụng →" });

test("complete B2 submits exact backend payload once and clears draft on success", async ({
  page,
}) => {
  const errors = await setup(page);
  let posts = 0;
  let payload: unknown;
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route("**/api/jobs", async (route) => {
    posts++;
    payload = route.request().postDataJSON();
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    await responseGate;
    await json(
      route,
      { id: 89, title: "Backend Developer", status: "open" },
      201,
    );
  });
  await login(page);
  await page.getByLabel("Tiêu đề tuyển dụng").fill("  Backend Developer  ");
  await page
    .getByLabel("Mô tả công việc")
    .fill("Xây dựng API NestJS.\nYêu cầu: TypeScript.");
  await page.getByLabel("Hình thức làm việc").selectOption("contract");
  await page.getByLabel("Cấp bậc").selectOption("senior");
  await page.getByLabel("Tỉnh / thành phố").fill("Hà Nội");
  await page.getByLabel("Địa điểm làm việc").fill("Văn phòng Hà Nội");
  await page.getByLabel("Lương tối thiểu").fill("0");
  await page.getByLabel("Lương tối đa").fill("25000000");
  await page.getByLabel("Hạn nộp hồ sơ").fill("2099-12-31");
  await expect(page.locator(".preview-card h2")).toHaveText(
    "Backend Developer",
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/b2-desktop.png",
    fullPage: true,
  });
  await postButton(page).click();
  await expect(
    page.getByRole("button", { name: "Đang đăng tin…" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeDisabled();
  releaseResponse();
  await expect(
    page.getByRole("heading", { name: "Tin tuyển dụng đã sẵn sàng." }),
  ).toBeFocused();
  expect(posts).toBe(1);
  expect(payload).toEqual({
    companyId: 12,
    title: "Backend Developer",
    description: "Xây dựng API NestJS.\nYêu cầu: TypeScript.",
    jobType: "contract",
    level: "senior",
    province: "Hà Nội",
    location: "Văn phòng Hà Nội",
    salaryMin: 0,
    salaryMax: 25000000,
    deadline: "2099-12-31",
    currency: "VND",
  });
  expect(
    await page.evaluate(() => sessionStorage.getItem("jobboard.new-job.7")),
  ).toBeNull();
  await page.getByRole("button", { name: "Đăng một tin khác" }).click();
  await expect(page.getByLabel("Tiêu đề tuyển dụng")).toHaveValue("");
  await expect(page.getByLabel("Công ty đăng tuyển")).toHaveValue("12");
  expect(errors).toEqual([]);
});

test("validates title, salary ordering and past deadline without posting", async ({
  page,
}) => {
  await setup(page);
  await login(page);
  let posts = 0;
  await page.route("**/api/jobs", (route) => {
    posts++;
    return json(route, {}, 201);
  });
  await postButton(page).click();
  await expect(
    page.getByText("Vui lòng nhập tiêu đề tuyển dụng."),
  ).toBeVisible();
  await expect(page.getByLabel("Tiêu đề tuyển dụng")).toBeFocused();
  await page.getByLabel("Tiêu đề tuyển dụng").fill("Developer");
  await page.getByLabel("Lương tối thiểu").fill("200");
  await page.getByLabel("Lương tối đa").fill("100");
  await page.getByLabel("Hạn nộp hồ sơ").fill("2000-01-01");
  await postButton(page).click();
  await expect(
    page.getByText("Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu."),
  ).toBeVisible();
  await expect(
    page.getByText("Hạn nộp phải là ngày hợp lệ từ hôm nay trở đi."),
  ).toBeVisible();
  expect(posts).toBe(0);
});

test("requires selection for multiple owned companies", async ({ page }) => {
  await setup(page, {
    companies: [company, { ...company, id: 13, name: "Công ty thứ hai" }],
  });
  await page.getByLabel("Email").fill("employer@example.test");
  await page.getByLabel("Mật khẩu").fill("test-password");
  await page.getByRole("button", { name: "Đăng nhập →" }).click();
  await expect(page.getByLabel("Công ty đăng tuyển")).toBeEnabled();
  await page.getByLabel("Tiêu đề tuyển dụng").fill("Developer");
  await postButton(page).click();
  await expect(
    page.getByText("Vui lòng chọn một công ty của bạn."),
  ).toBeVisible();
  await page.getByLabel("Công ty đăng tuyển").selectOption("13");
  await expect(page.locator(".preview-card")).toContainText("Công ty thứ hai");
});

test("missing company blocks publishing and supports loading again", async ({
  page,
}) => {
  await setup(page, { companyStatus: 404, session: makeSession() });
  await expect(page.getByText(/Tài khoản chưa có công ty/)).toBeVisible();
  await expect(postButton(page)).toHaveCount(0);
  await page.route("**/api/companies/owner/7", (route) =>
    json(route, { data: [company] }),
  );
  await page.getByRole("button", { name: "Tải lại công ty" }).click();
  await expect(page.getByLabel("Công ty đăng tuyển")).toHaveValue("12");
  await expect(postButton(page)).toBeEnabled();
});

test("server error keeps entered data, draft survives reload, and retry succeeds", async ({
  page,
}) => {
  await setup(page, { session: makeSession() });
  await expect(page.getByLabel("Công ty đăng tuyển")).toHaveValue("12");
  await page.getByLabel("Tiêu đề tuyển dụng").fill("Tin được giữ lại");
  await page.route("**/api/jobs", (route) =>
    json(route, { message: "Công ty không thuộc về bạn" }, 403),
  );
  await postButton(page).click();
  await expect(page.getByRole("alert")).toContainText(
    "Công ty không thuộc về bạn",
  );
  await expect(page.getByRole("alert")).toBeFocused();
  await expect(page.getByLabel("Tiêu đề tuyển dụng")).toHaveValue(
    "Tin được giữ lại",
  );
  await page.reload();
  await expect(page.getByLabel("Tiêu đề tuyển dụng")).toHaveValue(
    "Tin được giữ lại",
  );
  await page.route("**/api/jobs", (route) =>
    json(route, { id: 90, title: "Tin được giữ lại" }, 201),
  );
  await postButton(page).click();
  await expect(
    page.getByRole("heading", { name: "Tin tuyển dụng đã sẵn sàng." }),
  ).toBeVisible();
});

test("expired session returns to login and restores same-account draft", async ({
  page,
}) => {
  await setup(page, { session: makeSession() });
  await expect(page.getByLabel("Công ty đăng tuyển")).toHaveValue("12");
  await page.getByLabel("Tiêu đề tuyển dụng").fill("Bản nháp khi hết phiên");
  await page.route("**/api/jobs", (route) =>
    json(route, { message: "Access token hết hạn" }, 401),
  );
  await postButton(page).click();
  await expect(
    page.getByRole("heading", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "Phiên đăng nhập đã hết hạn",
  );
  await login(page);
  await expect(page.getByLabel("Tiêu đề tuyển dụng")).toHaveValue(
    "Bản nháp khi hết phiên",
  );
});

test("refreshes a still-valid token before posting with the renewed token", async ({
  page,
}) => {
  await setup(page, { session: makeSession("employer", 30) });
  const renewedToken = token(1800);
  let refreshes = 0;
  await page.route("**/api/auth/refresh", (route) => {
    refreshes++;
    expect(route.request().postDataJSON()).toEqual({
      refreshToken: "test-refresh",
    });
    return json(route, { accessToken: renewedToken });
  });
  // Reload after installing refresh handler; this also exercises startup renewal.
  await page.reload();
  await expect(page.getByLabel("Công ty đăng tuyển")).toHaveValue("12");
  await page.getByLabel("Tiêu đề tuyển dụng").fill("Developer");
  await page.route("**/api/jobs", (route) => {
    expect(route.request().headers().authorization).toBe(
      `Bearer ${renewedToken}`,
    );
    return json(route, { id: 91, title: "Developer" }, 201);
  });
  await postButton(page).click();
  await expect(
    page.getByRole("heading", { name: "Tin tuyển dụng đã sẵn sàng." }),
  ).toBeVisible();
  expect(refreshes).toBeGreaterThanOrEqual(1);
});

test("wrong role stays on login with an explanation", async ({ page }) => {
  await setup(page, { loginRole: "candidate" });
  await page.getByLabel("Email").fill("candidate@example.test");
  await page.getByLabel("Mật khẩu").fill("test-password");
  await page.getByRole("button", { name: "Đăng nhập →" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "tài khoản nhà tuyển dụng",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("jobboard.session")),
  ).toBeNull();
});

test("company network failure has a retry action", async ({ page }) => {
  await page.route("**/api/companies/owner/7", (route) => route.abort());
  await setup(page, { session: makeSession() });
  // Latest matching route wins.
  await page.route("**/api/companies/owner/7", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "Không thể kết nối máy chủ",
  );
  await page.route("**/api/companies/owner/7", (route) =>
    json(route, { data: [company] }),
  );
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByLabel("Công ty đăng tuyển")).toHaveValue("12");
});

test("mobile form fits viewport and remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await setup(page, { session: makeSession() });
  await expect(page.getByLabel("Công ty đăng tuyển")).toHaveValue("12");
  await page.getByLabel("Tiêu đề tuyển dụng").fill("Frontend Developer");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await postButton(page).scrollIntoViewIfNeeded();
  await expect(postButton(page)).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/b2-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});
