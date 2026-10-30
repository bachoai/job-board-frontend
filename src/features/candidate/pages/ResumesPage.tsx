import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FileText, UploadCloud, Star, Eye, Download, X, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ConfirmAction } from "../../../components/common/ConfirmAction";
import { formatDate } from "../../../components/common/format";
import { ErrorMessage, Loading, PageHeading, EmptyState } from "../../../components/common/Feedback";
import { useResource } from "../../../components/common/useResource";
import { candidateApi } from "../api/candidate.api";
import type { CandidateResume } from "../api/candidate.api";
import { validateResumeFile } from "../utils/resume-validation";
function readableBytes(bytes: number | null) { return bytes == null ? "—" : `${(bytes / 1024 / 1024).toFixed(2)} MB`; }
export function ResumesPage() {
  const data = useResource(useCallback((signal: AbortSignal) => candidateApi.resumes(signal), []));
  const [file, setFile] = useState<File | null>(null);
  const [defaultResume, setDefaultResume] = useState(false);
  const [busy, setBusy] = useState(false); const [active, setActive] = useState<number | null>(null);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<{ file: CandidateResume; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] || null;
    setFile(chosen); setError(chosen ? validateResumeFile(chosen) : ""); setSuccess("");
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!file) return;
    const validation = validateResumeFile(file); if (validation) { setError(validation); return; }
    setBusy(true); setError(""); setSuccess("");
    try { await candidateApi.upload(file, defaultResume); setFile(null); setDefaultResume(false); if (fileRef.current) fileRef.current.value = ""; setSuccess("CV đã được tải lên thành công."); data.reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể tải CV lên."); }
    finally { setBusy(false); }
  }
  async function setPrimary(id: number) {
    setActive(id); setError(""); setSuccess("");
    try { await candidateApi.setDefault(id); setSuccess("Đã đặt CV mặc định."); data.reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể đặt CV mặc định."); }
    finally { setActive(null); }
  }
  async function remove(id: number) {
    setActive(id); setError(""); setSuccess("");
    try { await candidateApi.removeResume(id); setSuccess("Đã xóa CV."); data.reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Không thể xóa CV."); }
    finally { setActive(null); }
  }
  async function openFile(resume: CandidateResume, asDownload = false) {
    setActive(resume.id); setError("");
    try {
      const blob = await candidateApi.resumeFile(resume.id);
      const url = URL.createObjectURL(new Blob([blob], { type: resume.mimeType || blob.type || "application/octet-stream" }));
      if (asDownload || !/pdf/i.test(resume.mimeType || resume.fileName)) {
        const link = document.createElement("a"); link.href = url; link.download = resume.fileName; document.body.append(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else setPreview({ file: resume, url });
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể mở tệp CV."); }
    finally { setActive(null); }
  }
  return <main className="page"><PageHeading title="Quản lý CV" description="Lưu trữ CV, chọn CV mặc định và sử dụng khi ứng tuyển." action={<Link className="secondary" to="/me/applications">Đơn ứng tuyển</Link>}/>
    <form className="candidate-card public-form candidate-upload" onSubmit={upload}><h2><UploadCloud size={20}/> Tải CV mới</h2><p>Hỗ trợ PDF, DOC, DOCX · Dung lượng tối đa 5MB.</p><label className="candidate-file"><UploadCloud size={30}/><strong>{file?.name || "Chọn tệp từ thiết bị"}</strong><span>{file ? readableBytes(file.size) : "Nhấn để duyệt tệp CV"}</span><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={choose} aria-label="Chọn tệp CV"/></label><label className="candidate-checkbox"><input type="checkbox" checked={defaultResume} onChange={e => setDefaultResume(e.target.checked)}/> Đặt làm CV mặc định</label><div className="candidate-actions"><button className="primary" disabled={!file || busy || !!error} type="submit"><UploadCloud size={17}/>{busy ? "Đang tải lên…" : "Tải lên CV"}</button></div></form>
    {error && <ErrorMessage message={error}/>} {success && <div role="status" className="candidate-success"><CheckCircle2 size={17}/>{success}</div>}
    <section className="candidate-card candidate-list"><h2>CV của tôi ({data.data?.length || 0})</h2>{data.loading ? <Loading/> : data.error ? <ErrorMessage message={data.error} retry={data.reload}/> : data.data?.length ? <div className="candidate-resume-list">{data.data.map(r => <article key={r.id} className="candidate-resume-item"><span className="candidate-file-icon"><FileText size={25}/></span><div className="candidate-resume-info"><strong>{r.fileName}</strong><p>{readableBytes(r.fileSize)} · Tải lên {formatDate(r.uploadedAt, true)}</p>{r.isDefault && <span className="candidate-default"><Star size={13}/> CV mặc định</span>}</div><div className="candidate-resume-actions"><button className="secondary" disabled={active !== null} onClick={() => void openFile(r)}><Eye size={16}/> Xem</button><button className="secondary" disabled={active !== null} onClick={() => void openFile(r, true)} aria-label={`Tải ${r.fileName}`}><Download size={16}/></button>{!r.isDefault && <button className="secondary" disabled={active !== null} onClick={() => void setPrimary(r.id)}><Star size={16}/> Mặc định</button>}<ConfirmAction label="Xóa" title="Xóa CV?" description={`Xóa “${r.fileName}” khỏi tài khoản. Thao tác này không thể hoàn tác.`} danger onConfirm={() => remove(r.id)} disabled={active !== null}/></div></article>)}</div> : <EmptyState title="Chưa có CV nào"><p>Tải CV đầu tiên để bắt đầu ứng tuyển.</p></EmptyState>}</section>
    {preview && <div className="apply-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setPreview(null); }}><section role="dialog" aria-modal="true" aria-label={`Xem ${preview.file.fileName}`} className="candidate-preview"><div className="apply-dialog-heading"><h2>{preview.file.fileName}</h2><button className="icon-button" onClick={() => setPreview(null)} aria-label="Đóng xem CV"><X size={20}/></button></div><iframe title={`Xem trước ${preview.file.fileName}`} src={preview.url}/><p>Không hiển thị được? <button className="text-button" onClick={() => void openFile(preview.file, true)}>Tải xuống CV</button></p></section></div>}
  </main>;
}
