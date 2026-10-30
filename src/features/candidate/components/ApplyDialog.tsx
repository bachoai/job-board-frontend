import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { X, Send, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorMessage, Loading } from "../../../components/common/Feedback";
import { useResource } from "../../../components/common/useResource";
import { ApiError } from "../../../lib/api";
import { candidateApi } from "../api/candidate.api";

export function ApplyDialog({ jobId, jobTitle, close }: { jobId: number; jobTitle: string; close: () => void }) {
  const navigate = useNavigate();
  const list = useResource(useCallback((signal: AbortSignal) => candidateApi.resumes(signal), []));
  const [selected, setSelected] = useState("");
  const [letter, setLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const resumes = list.data || [];
  const preferred = resumes.find(r => r.isDefault)?.id || resumes[0]?.id;
  const resumeId = Number(selected || preferred || 0);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resumeId) { setError("Vui lòng tải lên CV trước khi ứng tuyển."); return; }
    setError(""); setSubmitting(true);
    try {
      const application = await candidateApi.apply(jobId, resumeId, letter);
      navigate(`/me/applications/${application.id}`, { replace: true });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setError(status === 409 ? "Bạn đã ứng tuyển vị trí này rồi." : status === 400 ? "Tin tuyển dụng đã đóng, hết hạn hoặc dữ liệu chưa hợp lệ." : err instanceof Error ? err.message : "Không thể nộp hồ sơ.");
    } finally { setSubmitting(false); }
  }
  return <div className="apply-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) close(); }}>
    <section className="apply-dialog" role="dialog" aria-modal="true" aria-labelledby="apply-title">
      <div className="apply-dialog-heading"><div><span className="public-kicker">ỨNG TUYỂN NGAY</span><h2 id="apply-title">Gửi hồ sơ ứng tuyển</h2><p>{jobTitle}</p></div><button className="icon-button" aria-label="Đóng" disabled={submitting} onClick={close}><X size={21}/></button></div>
      {list.loading ? <Loading/> : list.error ? <ErrorMessage message={list.error} retry={list.reload}/> : !resumes.length ? <div className="apply-empty"><FileText size={35}/><h3>Bạn chưa có CV</h3><p>Vui lòng tải CV trước khi ứng tuyển.</p><Link className="primary" to="/me/resumes">Quản lý CV</Link></div> : <form className="public-form" onSubmit={submit}>
        <label>Chọn CV *<select aria-label="Chọn CV ứng tuyển" value={selected || String(preferred)} onChange={(e) => setSelected(e.target.value)} required>{resumes.map(r => <option key={r.id} value={r.id}>{r.fileName}{r.isDefault ? " · Mặc định" : ""}</option>)}</select></label>
        <label>Thư giới thiệu (tùy chọn)<textarea rows={6} maxLength={2000} value={letter} onChange={(e) => setLetter(e.target.value)} placeholder="Giới thiệu ngắn gọn về kinh nghiệm và lý do bạn phù hợp…"/><span className="field-note">{letter.length}/2000 ký tự</span></label>
        {error && <ErrorMessage message={error}/>}
        <div className="apply-actions"><button type="button" className="secondary" disabled={submitting} onClick={close}>Hủy</button><button className="primary" disabled={submitting} type="submit"><Send size={17}/>{submitting ? "Đang gửi…" : "Gửi hồ sơ"}</button></div>
      </form>}
    </section>
  </div>;
}
