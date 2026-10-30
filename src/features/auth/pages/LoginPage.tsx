import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/useAuth";
import { ErrorMessage } from "../../../components/common/Feedback";
export function roleHome(role: string) { return role === "admin" ? "/admin/users" : role === "employer" ? "/employer/jobs" : "/me"; }
export function LoginPage() {
  const { session, login, busy, error } = useAuth();
  const [show, setShow] = useState(false);
  const location = useLocation(); const navigate = useNavigate();
  const from = typeof location.state?.from === "string" && location.state.from.startsWith("/") && !location.state.from.startsWith("//") ? location.state.from : null;
  if (session) return <Navigate to={from && (session.user.role === "candidate" && (from.startsWith("/jobs/") || from.startsWith("/me")) || from.startsWith(`/${session.user.role}/`)) ? from : roleHome(session.user.role)} replace/>;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try { const result = await login(String(form.get("email")), String(form.get("password"))); const allowed = from && (result.user.role === "candidate" && (from.startsWith("/jobs/") || from.startsWith("/me")) || from.startsWith(`/${result.user.role}/`)); navigate(allowed ? from! : roleHome(result.user.role), { replace: true }); }
    catch { /* Error displayed from auth provider. */ }
  }
  return <main className="session-screen"><section className="session-intro"><Link className="brand" to="/jobs"><span className="brand-icon"><BriefcaseBusiness size={23}/></span>Jobboard<span className="brand-dot">.</span></Link><span className="session-label">NỀN TẢNG KẾT NỐI NGHỀ NGHIỆP</span><h1>Hành trình mới <br/>bắt đầu từ <br/><span>đúng cơ hội.</span></h1><p>Khám phá việc làm phù hợp, lưu trữ CV và theo dõi mọi bước ứng tuyển của bạn.</p><ul><li><CheckCircle2 size={17}/> Khám phá công việc đang tuyển</li><li><CheckCircle2 size={17}/> Ứng tuyển bằng CV của bạn</li><li><CheckCircle2 size={17}/> Theo dõi trạng thái từng hồ sơ</li></ul><div className="session-security"><ShieldCheck size={18}/> Kết nối nhà tuyển dụng và ứng viên</div></section>
    <section className="session-form"><div className="session-form-inner"><span className="section-kicker">CHÀO MỪNG TRỞ LẠI</span><h2>Đăng nhập</h2><p>Tiếp tục hành trình cùng Jobboard.</p><form className="login-card" onSubmit={submit}><fieldset className="form-fields" disabled={busy}><label>Email<input name="email" type="email" maxLength={255} autoComplete="username" required placeholder="ban@email.com"/></label><label htmlFor="login-password">Mật khẩu</label><div className="password-field"><input id="login-password" type={show ? "text" : "password"} name="password" autoComplete="current-password" required placeholder="Nhập mật khẩu"/><button type="button" className="password-toggle" onClick={() => setShow(!show)} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{error && <ErrorMessage message={error}/>}<button className="primary" type="submit">{busy ? "Đang đăng nhập…" : <>Đăng nhập <ArrowRight size={17}/></>}</button></fieldset></form><p className="login-note">Chưa có tài khoản? <Link to="/register">Đăng ký miễn phí</Link></p><p className="login-note"><Link to="/jobs">← Xem việc làm không cần đăng nhập</Link></p></div><div className="session-copyright">© Jobboard · Kết nối cơ hội nghề nghiệp</div></section></main>;
}
