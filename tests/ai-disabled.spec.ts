import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";

let server: ChildProcess;
let url: string;
test.beforeAll(async () => {
  const code = `import {createServer} from 'vite';
    const app=await createServer({server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});
    await app.listen(); console.log('AI_DISABLED_READY '+app.resolvedUrls.local[0]);`;
  server = spawn(process.execPath, ["--input-type=module", "-e", code], {
    cwd: process.cwd(), env: { ...process.env, VITE_AI_ENABLED: "false" }, windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  url = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("AI-disabled preview did not start")), 20000);
    let output = "";
    server.stdout?.on("data", data => {
      output += data.toString();
      const match = output.match(/AI_DISABLED_READY (http[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    server.once("error", error => { clearTimeout(timeout); reject(error); });
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Preview exited: ${code}`)); });
  });
});
test.afterAll(() => { server?.kill(); });
test("turning the frontend AI flag off hides AI controls, menu and route and makes no AI requests", async ({ page }) => {
  const calls: string[] = [];
  await page.route("http://localhost:3000/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    calls.push(path);
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(path === "/api/jobs" ? { items: [], meta: { page: 1, total: 0, totalPages: 1, limit: 9 } } : []) });
  });
  await page.addInitScript(() => localStorage.setItem("jobboard.session", JSON.stringify({ accessToken: "valid-test", refreshToken: "refresh", user: { id: 8, fullName: "Ứng viên", email: "candidate@example.test", role: "candidate" } })));
  await page.goto(`${url}jobs`);
  await expect(page.getByRole("heading", { name: "Việc làm đang tuyển" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Tìm kiếm thông minh bằng AI" })).toHaveCount(0);
  await page.goto(`${url}me/resumes`);
  await expect(page.getByRole("heading", { name: "Quản lý CV", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Việc làm phù hợp", exact: true })).toHaveCount(0);
  await page.goto(`${url}me/recommended-jobs`);
  await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  expect(calls.some(path => path.startsWith("/api/ai/"))).toBe(false);
});
