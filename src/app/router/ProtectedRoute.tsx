import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  BriefcaseBusiness,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/useAuth";
import { ErrorMessage } from "../../components/common/Feedback";

// Reuses the standalone login fallback already present in part B; no public/candidate pages.
export function ProtectedRoute({
  role,
  children,
}: {
  role: "candidate" | "employer" | "admin";
  children: ReactNode;
}) {
  const { session, error, busy, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await login(
        String(form.get("email")),
        String(form.get("password")),
      );
      if (!location.pathname.startsWith(`/${result.user.role}/`))
        navigate(
          result.user.role === "admin" ? "/admin/users" : result.user.role === "candidate" ? "/me" : "/employer/jobs",
          { replace: true },
        );
    } catch {
      /* The existing auth provider supplies the error message. */
    }
  }
  if (!session && role === "candidate") return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!session)
    return (
      <main className="session-screen">
        <section className="session-intro">
          <Link className="brand" to="/">
            <span className="brand-icon">
              <BriefcaseBusiness size={23} />
            </span>
            Jobboard<span className="brand-dot">.</span>
          </Link>
          <span className="session-label">KHÔNG GIAN TUYỂN DỤNG</span>
          <h1>
            Mọi cơ hội tốt
            <br />
            đều bắt đầu từ
            <br />
            <span>đúng người.</span>
          </h1>
          <p>
            Quản lý tuyển dụng trong một không gian rõ ràng, tập trung và hiệu
            quả.
          </p>
          <ul>
            <li>
              <Check size={17} /> Quản lý tin tuyển dụng tập trung
            </li>
            <li>
              <Check size={17} /> Theo dõi từng hồ sơ ứng viên
            </li>
            <li>
              <Check size={17} /> Kiểm soát thông tin tuyển dụng
            </li>
          </ul>
          <div className="session-security">
            <ShieldCheck size={18} /> Dành cho nhà tuyển dụng và quản trị viên
          </div>
        </section>
        <section className="session-form">
          <div className="session-form-inner">
            <span className="section-kicker">CHÀO MỪNG TRỞ LẠI</span>
            <h2>Đăng nhập</h2>
            <p>Tiếp tục hành trình tuyển dụng của bạn.</p>
            <form className="login-card" onSubmit={submit} aria-busy={busy}>
              <fieldset className="form-fields" disabled={busy}>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="ban@congty.vn"
                  />
                </label>
                <label htmlFor="session-password">Mật khẩu</label>
                <div className="password-field">
                  <input
                    id="session-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Nhập mật khẩu của bạn"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ẩn ký tự" : "Hiển thị ký tự"}
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
                {error && <ErrorMessage message={error} />}
                <button
                  className="primary"
                  disabled={busy}
                  aria-label={busy ? "Đang đăng nhập…" : "Đăng nhập →"}
                >
                  {busy ? (
                    "Đang đăng nhập…"
                  ) : (
                    <>
                      Đăng nhập <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </fieldset>
            </form>
            <p className="login-note">
              <ShieldCheck size={15} /> Truy cập theo quyền tài khoản của bạn.
            </p>
          </div>
          <div className="session-copyright">
            © Jobboard · Hệ thống quản lý tuyển dụng
          </div>
        </section>
      </main>
    );
  if (session.user.role !== role)
    return (
      <main className="access-screen">
        <ShieldCheck size={38} />
        <h1>Không có quyền truy cập</h1>
        <p>
          Trang này dành cho{" "}
          {role === "admin" ? "quản trị viên" : role === "candidate" ? "ứng viên" : "nhà tuyển dụng"}.
        </p>
        <Link
          className="primary"
          to={session.user.role === "admin" ? "/admin/users" : session.user.role === "candidate" ? "/me" : "/employer/jobs"}
        >
          Về không gian của bạn →
        </Link>
      </main>
    );
  return children;
}
