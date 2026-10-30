import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Save, UserRound } from "lucide-react";
import { useAuth } from "../../../app/providers/useAuth";
import { useResource } from "../../../components/common/useResource";
import { PageHeading, Loading, ErrorMessage } from "../../../components/common/Feedback";
import { candidateApi } from "../api/candidate.api";
import { saveSession } from "../../../lib/api";

export function ProfilePage() {
  const { session } = useAuth();
  const user = useResource(useCallback((signal: AbortSignal) => candidateApi.me(signal), []));
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(false);
  useEffect(() => { if (user.data) { setName(user.data.fullName); setPhone(user.data.phone || ""); } }, [user.data]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSuccess(false); setError("");
    if (!user.data) return;
    if (!name.trim()) { setError("Họ tên không được bỏ trống."); return; }
    if (name.trim().length > 150) { setError("Họ tên tối đa 150 ký tự."); return; }
    if (phone.trim() && !/^(0|\+84)\d{9}$/.test(phone.trim())) { setError("Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx."); return; }
    setBusy(true);
    try {
      const updated = await candidateApi.updateMe(user.data.id, { fullName: name.trim(), phone: phone.trim() || null });
      user.setData(updated);
      if (session) saveSession({ ...session, user: { ...session.user, fullName: updated.fullName } });
      setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể lưu thông tin."); }
    finally { setBusy(false); }
  }
  return <main className="page"><PageHeading title="Hồ sơ cá nhân" description="Chỉnh sửa thông tin tài khoản của bạn."/>
    {user.loading ? <Loading/> : user.error ? <ErrorMessage message={user.error} retry={user.reload}/> : user.data && <div className="candidate-content"><div className="candidate-profile-heading"><span className="candidate-profile-avatar"><UserRound size={34}/></span><div><h2>{user.data.fullName}</h2><p>{user.data.email}</p></div></div><form className="public-form candidate-card" onSubmit={submit}>
      <label>Họ và tên *<input type="text" value={name} maxLength={150} onChange={e => setName(e.target.value)} required/></label>
      <label>Email (không thể thay đổi)<input type="email" readOnly value={user.data.email}/></label>
      <label>Số điện thoại<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" maxLength={12}/></label>
      <label>Loại tài khoản<input readOnly value={user.data.role === "candidate" ? "Ứng viên" : user.data.role === "employer" ? "Nhà tuyển dụng" : "Quản trị"}/></label>
      {error && <ErrorMessage message={error}/>}{success && <div role="status" className="candidate-success"><CheckCircle2 size={17}/> Đã cập nhật hồ sơ thành công.</div>}
      <div className="candidate-actions"><button type="submit" className="primary" disabled={busy}><Save size={17}/>{busy ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
    </form></div>}
  </main>;
}
