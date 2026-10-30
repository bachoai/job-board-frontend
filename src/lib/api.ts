import axios from "axios";
import { axiosInstance } from "./axios";
import { apiErrorMessage, requestLabel } from "./api-error-message";
export interface Session {
  accessToken: string;
  refreshToken: string;
  user: { id: number; fullName: string; email: string; role: string };
}

export const SESSION_EVENT = "jobboard:session";
const key = "jobboard.session";

export function getSession(): Session | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return typeof value?.accessToken === "string" &&
      typeof value?.refreshToken === "string" &&
      Number.isSafeInteger(value?.user?.id) &&
      value.user.id > 0 &&
      typeof value.user.fullName === "string" &&
      typeof value.user.email === "string" &&
      typeof value.user.role === "string"
      ? value
      : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(key, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(reason = "") {
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: reason }));
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const expiredMessage =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
let refreshing: Promise<Session> | null = null;

type ApiOptions = RequestInit & { auth?: boolean };

async function request<T>(
  path: string,
  options: RequestInit,
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await axiosInstance.request<unknown>({
      url: path,
      method: options.method || "GET",
      data: options.body,
      headers: Object.fromEntries(headers.entries()),
      signal: options.signal || undefined,
    });
  } catch (err) {
    if (options.signal?.aborted) throw err;
    if (
      axios.isAxiosError(err) &&
      ["ECONNABORTED", "ETIMEDOUT"].includes(err.code || "")
    ) {
      throw new ApiError("Máy chủ phản hồi quá lâu. Vui lòng thử lại.", 0);
    }
    throw new ApiError(
      `Không thể kết nối API (${requestLabel(options.method || "GET", path)}). Kiểm tra backend đã chạy, địa chỉ API trong .env của frontend và cấu hình CORS.`,
      0,
    );
  }

  const body = response.data;
  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(
      apiErrorMessage(body, response.status, options.method || "GET", path),
      response.status,
    );
  }
  if (!body && response.status !== 204) {
    throw new ApiError(
      "Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.",
      response.status,
    );
  }
  return body as T;
}

function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function usableSession(): Promise<Session | null> {
  const session = getSession();
  if (!session) return null;
  const expiresAt = tokenExpiry(session.accessToken);
  if (expiresAt === null || expiresAt > Date.now() + 60000) return session;
  if (expiresAt <= Date.now()) throw new ApiError(expiredMessage, 401);

  // Backend requires a valid access token on /auth/refresh, so renew before expiry.
  if (!refreshing) {
    refreshing = request<{ accessToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      },
      session.accessToken,
    )
      .then((result) => {
        if (
          typeof result.accessToken !== "string" ||
          getSession()?.accessToken !== session.accessToken
        ) {
          throw new ApiError(expiredMessage, 401);
        }
        const renewed = { ...session, accessToken: result.accessToken };
        saveSession(renewed);
        return renewed;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function api<T>(
  path: string,
  { auth = true, ...options }: ApiOptions = {},
): Promise<T> {
  let requestToken = getSession()?.accessToken;
  try {
    const session = auth ? await usableSession() : null;
    requestToken = session?.accessToken;
    return await request<T>(path, options, session?.accessToken);
  } catch (err) {
    if (auth && err instanceof ApiError && err.status === 401) {
      if (getSession()?.accessToken === requestToken)
        clearSession(expiredMessage);
      throw new ApiError(expiredMessage, 401);
    }
    throw err;
  }
}

/** Download protected CV as a Blob. Never expose the user's token in a URL. */
export async function apiBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  const session = await usableSession();
  if (!session) throw new ApiError("Vui lòng đăng nhập để xem CV.", 401);
  try {
    const response = await axiosInstance.get<Blob>(path, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      responseType: "blob",
      signal,
    });
    if (response.status < 200 || response.status >= 300) {
      let message = "Không thể tải tệp CV.";
      try {
        const body: unknown = JSON.parse(await response.data.text());
        if (body && typeof body === "object" && "message" in body) {
          const detail = (body as { message: unknown }).message;
          if (typeof detail === "string") message = detail;
        }
      } catch { /* Binary or unparsable response. */ }
      throw new ApiError(
        apiErrorMessage({ message }, response.status, "GET", path),
        response.status,
      );
    }
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      `Không thể tải tệp CV (${requestLabel("GET", path)}). Kiểm tra kết nối đến backend.`,
      0,
    );
  }
}

/** Proactive no-op for healthy tokens; refreshes before expiry without a data request. */
export async function renewSessionIfNeeded() {
  try { await usableSession(); }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) clearSession(expiredMessage);
    throw error;
  }
}
