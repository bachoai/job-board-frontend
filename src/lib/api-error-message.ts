/** Frontend-only HTTP diagnostics. Never include query parameters, tokens or body data. */
export function requestLabel(method: string, path: string): string {
  const safeMethod = /^[a-z]+$/i.test(method) ? method.toUpperCase() : "GET";
  const safePath = path.split("?")[0].split("#")[0];
  return `${safeMethod} ${safePath}`;
}

export function apiErrorMessage(body: unknown, status: number, method: string, path: string): string {
  const record = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>) : {};
  const nested = record.error && typeof record.error === "object" && !Array.isArray(record.error)
    ? (record.error as Record<string, unknown>) : {};
  const message = record.message ?? nested.message ?? record.error;
  const detail = Array.isArray(message)
    ? message.filter((item): item is string => typeof item === "string").join(" · ")
    : typeof message === "string" ? message : "";
  const title = detail || "Không thể thực hiện yêu cầu. Vui lòng thử lại.";
  if (status >= 500) {
    return `${title} (${requestLabel(method, path)} — HTTP ${status}). Máy chủ đang gặp lỗi. Hãy kiểm tra log NestJS.`;
  }
  return title;
}
