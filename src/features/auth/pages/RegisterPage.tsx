import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/useAuth";
import { ErrorMessage } from "../../../components/common/Feedback";
import { roleHome } from "./LoginPage";
export function RegisterPage() {
  const { session, register, busy, error } = useAuth(); const navigate = useNavigate();
  const [localError, setLocalError] = useState("");
  if (session) return <Navigate to={roleHome(session.user.role)} replace/>;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLocalError("");
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName")).trim(); const email = String(form.get("email")).trim();
    const password = String(form.get("password")); const confirmPassword = String(form.get("confirmPassword"));
    const role = String(form.get("role")) as "candidate" | "employer";
    if (!fullName || fullName.length > 150) { setLocalError("Họ tên cần từ 1 đến 150 ký tự."); return; }
    if (password.length < 8 || password.length > 64 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) { setLocalError("Mật khẩu phải từ 8–64 ký tự và có cả chữ và số."); return; }
    if (password !== confirmPassword) { setLocalError("Mật khẩu nhập lại không khớp."); return; }
    try { const result = await register({ fullName, email, password, confirmPassword, role }); navigate(roleHome(result.user.role), { replace: true }); }
    catch { /* Error displayed by provider. */ }
  }
  return <main className="session-screen"><section className="session-intro"><Link className="brand" to="/jobs"><span className="brand-icon"><BriefcaseBusiness size={23}/></span>Jobboard<span className="brand-dot">.</span></Link><span className="session-label">CỘNG ĐỒNG NGHỀ NGHIỆP</span><h1>Gia nhập cộng đồng, <br/>khám phá <span>cơ hội.</span></h1><p>Tạo tài khoản ứng viên để ứng tuyển hoặc tài khoản doanh nghiệp để đăng tuyển và tìm kiếm nhân sự.</p><ul><li><CheckCircle2 size={17}/> Hồ sơ và tin tuyển dụng tập trung</li><li><CheckCircle2 size={17}/> Quy trình rõ ràng và minh bạch</li><li><CheckCircle2 size={17}/> Chủ động quản lý hành trình của bạn</li></ul><div className="session-security"><ShieldCheck size={18}/> Tài khoản phân quyền theo vai trò</div></section>
    <section className="session-form"><div className="session-form-inner"><span className="section-kicker">BẮT ĐẦU CÙNG JOBBOARD</span><h2>Tạo tài khoản</h2><p>Vui lòng cung cấp thông tin để đăng ký.</p><form className="login-card public-register" onSubmit={submit}><fieldset className="form-fields" disabled={busy}><label>Họ và tên<input name="fullName" required maxLength={150} autoComplete="name" placeholder="Nguyễn Văn A"/></label><label>Email<input name="email" required type="email" maxLength={255} autoComplete="email" placeholder="ban@email.com"/></label><label>Vai trò<select name="role" defaultValue="candidate"><option value="candidate">Ứng viên</option><option value="employer">Nhà tuyển dụng</option></select></label><label>Mật khẩu<input name="password" required type="password" autoComplete="new-password" minLength={8} maxLength={64} placeholder="Tối thiểu 8 ký tự, có chữ và số"/></label><label>Nhập lại mật khẩu<input name="confirmPassword" required type="password" autoComplete="new-password" placeholder="Xác nhận mật khẩu"/></label>{(localError || error) && <ErrorMessage message={localError || error}/>}<button className="primary" type="submit">{busy ? "Đang đăng ký…" : <>Đăng ký <ArrowRight size={17}/></>}</button></fieldset></form><p className="login-note">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></div><div className="session-copyright">© Jobboard · Kết nối cơ hội nghề nghiệp</div></section></main>;
}
