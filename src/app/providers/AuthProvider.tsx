import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  api,
  clearSession,
  getSession,
  saveSession,
  SESSION_EVENT,
  renewSessionIfNeeded,
} from "../../lib/api";
import type { Session } from "../../lib/api";
import { AuthContext } from "./auth-context";

// Extracted from the existing app shell; keeps part B compatible with part A's session.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(getSession);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    function sync(event: Event) {
      setSession(getSession());
      if (event instanceof CustomEvent && typeof event.detail === "string")
        setError(event.detail);
    }
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  async function login(email: string, password: string) {
    if (pending.current) throw new Error("Đang xử lý đăng nhập.");
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<Session>("/auth/login", {
        auth: false,
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!["candidate", "employer", "admin"].includes(result.user?.role))
        throw new Error("Tài khoản có vai trò không hợp lệ.");
      saveSession(result);
      setSession(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập.");
      throw err;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function register(body: {
    email: string; password: string; confirmPassword: string;
    fullName: string; role: "candidate" | "employer";
  }) {
    if (pending.current) throw new Error("Đang xử lý yêu cầu.");
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<Session>("/auth/register", {
        auth: false,
        method: "POST",
        body: JSON.stringify({ ...body, email: body.email.trim(), fullName: body.fullName.trim() }),
      });
      saveSession(result);
      setSession(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng ký.");
      throw err;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  // Refresh proactively while the app is open, including during idle periods.
  useEffect(() => {
    if (!session) return;
    const renew = () => { void renewSessionIfNeeded().catch(() => {}); };
    renew();
    const handle = window.setInterval(renew, 30000);
    return () => window.clearInterval(handle);
  }, [session?.user.id]);
  async function logout() {
    if (busy || submittingJob) return;
    setBusy(true);
    try {
      if (session)
        await api("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
    } catch {
      /* Allow local sign-out when the server is unavailable. */
    } finally {
      clearSession();
      setSession(null);
      setError("");
      setBusy(false);
    }
  }
  return (
    <AuthContext.Provider
      value={{
        session,
        error,
        busy,
        submittingJob,
        setSubmittingJob,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
