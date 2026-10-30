import { useCallback, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, FileText, Clock3 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeading, Loading, ErrorMessage, EmptyState } from "../../../components/common/Feedback";
import { ConfirmAction } from "../../../components/common/ConfirmAction";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { formatDate, routeId } from "../../../components/common/format";
import { useResource } from "../../../components/common/useResource";
import { candidateApi } from "../api/candidate.api";
const labels: Record<string, string> = { new: "Đã nộp hồ sơ", viewed: "Nhà tuyển dụng đã xem", interview: "Được mời phỏng vấn", rejected: "Không được chọn" };
export function ApplicationDetailPage() {
  const { id } = useParams(); const applicationId = routeId(id);
  const navigate = useNavigate(); const [actionError, setActionError] = useState("");
  const resource = useResource(useCallback(async (signal: AbortSignal) => {
    if (!applicationId) throw new Error("Mã đơn ứng tuyển không hợp lệ.");
    const [detail, list] = await Promise.all([candidateApi.application(applicationId, signal), candidateApi.applications(signal)]);
    const history = await candidateApi.history(applicationId, signal);
    const richer = list.find(a => a.id === applicationId);
    return { detail: { ...detail, jobTitle: richer?.jobTitle || detail.jobTitle, companyName: richer?.companyName || detail.companyName }, history };
  }, [applicationId]));
  async function withdraw() {
    if (!applicationId) return;
    try { await candidateApi.withdraw(applicationId); navigate("/me/applications", { replace: true }); }
    catch (err) { const message = err instanceof Error ? err.message : "Không thể rút đơn."; setActionError(message); throw err; }
  }
  if (resource.loading) return <main className="page"><Loading/></main>;
  if (resource.error || !resource.data) return <main className="page"><ErrorMessage message={resource.error || "Không thể tải đơn ứng tuyển."} retry={resource.reload}/></main>;
  const { detail, history } = resource.data;
  return <main className="page"><Link className="public-back" to="/me/applications"><ArrowLeft size={17}/> Đơn đã nộp</Link><PageHeading title="Chi tiết đơn ứng tuyển" description="Theo dõi các lần cập nhật trạng thái và ghi chú từ nhà tuyển dụng."/>
    {actionError && <ErrorMessage message={actionError}/>}
    <div className="candidate-detail-grid"><section className="candidate-card"><div className="candidate-detail-title"><span className="candidate-file-icon"><BriefcaseBusiness size={23}/></span><div><h2>{detail.jobTitle || `Tin tuyển dụng #${detail.jobId}`}</h2><p>{detail.companyName || "Công ty chưa xác định"}</p></div></div><dl className="public-overview"><dt>Trạng thái</dt><dd><StatusBadge status={detail.status}/></dd><dt>Ngày nộp</dt><dd><CalendarDays size={15}/> {formatDate(detail.createdAt, true)}</dd><dt>CV đã gửi</dt><dd><FileText size={15}/> {detail.resumeId ? `CV #${detail.resumeId}` : "Không có"}</dd><dt>Lần cập nhật cuối</dt><dd><Clock3 size={15}/> {formatDate(detail.updatedAt, true)}</dd></dl>{detail.status === "new" && <div className="candidate-actions"><ConfirmAction label="Rút đơn ứng tuyển" title="Bạn chắc chắn muốn rút đơn?" description="Chỉ có thể rút hồ sơ còn ở trạng thái mới. Sau khi rút, đơn sẽ bị xóa." onConfirm={withdraw} danger/></div>}</section>
    <section className="candidate-card"><h2>Thư giới thiệu</h2><p className="public-description">{detail.coverLetter || "Bạn không gửi thư giới thiệu cho đơn này."}</p></section></div>
    <section className="candidate-card candidate-history"><h2>Lịch sử xử lý hồ sơ</h2><p>Theo dõi từng bước tuyển dụng. Ghi chú được hiển thị khi nhà tuyển dụng có cung cấp.</p>{history.length ? <ol className="candidate-timeline">{history.map((event) => <li key={event.id}><span className="candidate-timeline-dot"/><div><span className="candidate-timeline-time">{formatDate(event.createdAt, true)}</span><h3>{labels[event.toStatus] || event.toStatus}</h3><p>{event.note || "Không có ghi chú từ nhà tuyển dụng."}</p><div className="candidate-timeline-transition">{event.fromStatus ? `${labels[event.fromStatus] || event.fromStatus} → ` : ""}{labels[event.toStatus] || event.toStatus}</div></div></li>)}</ol> : <EmptyState title="Chưa có lịch sử thay đổi"><p>Trạng thái hiện tại: {labels[detail.status] || detail.status}</p></EmptyState>}</section>
  </main>;
}
