import { useCallback, useState } from "react";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeading, Loading, ErrorMessage } from "../../../components/common/Feedback";
import { DataTable } from "../../../components/common/DataTable";
import { ConfirmAction } from "../../../components/common/ConfirmAction";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { formatDate } from "../../../components/common/format";
import { useResource } from "../../../components/common/useResource";
import { candidateApi } from "../api/candidate.api";
export function ApplicationsPage() {
  const data = useResource(useCallback((signal: AbortSignal) => candidateApi.applications(signal), []));
  const [status, setStatus] = useState(""); const [error, setError] = useState("");
  async function withdraw(id: number) {
    setError("");
    try {
      await candidateApi.withdraw(id);
      data.setData(current => current ? current.filter(item => item.id !== id) : current);
    } catch (err) { const message = err instanceof Error ? err.message : "Không thể rút đơn."; setError(message); throw err; }
  }
  return <main className="page"><PageHeading title="Đơn đã ứng tuyển" description="Theo dõi tiến độ hồ sơ và rút đơn khi hồ sơ còn ở trạng thái mới." action={<Link to="/jobs" className="primary"><ClipboardList size={17}/> Tìm việc làm</Link>}/>
    {error && <ErrorMessage message={error}/>}
    {data.loading ? <Loading/> : data.error ? <ErrorMessage message={data.error} retry={data.reload}/> : <DataTable title="Lịch sử ứng tuyển" searchText={a => `${a.jobTitle || a.jobId} ${a.companyName || ""} ${a.status}`} searchLabel="Tìm theo vị trí, công ty..." filtered={!!status} rows={(data.data || []).filter(a => !status || a.status === status)} filters={<select aria-label="Lọc trạng thái đơn" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option><option value="new">Mới</option><option value="viewed">Đã xem</option><option value="interview">Phỏng vấn</option><option value="rejected">Từ chối</option></select>} emptyTitle="Bạn chưa ứng tuyển vị trí nào" columns={[
      { key: "job", title: "Vị trí tuyển dụng", render: a => <div><Link className="candidate-table-link" to={`/me/applications/${a.id}`}>{a.jobTitle || `Tin #${a.jobId}`}</Link><p>{a.companyName || "Chưa có thông tin công ty"}</p></div> },
      { key: "date", title: "Ngày ứng tuyển", render: a => formatDate(a.createdAt, true) },
      { key: "status", title: "Trạng thái", render: a => <StatusBadge status={a.status}/> },
      { key: "action", title: "Thao tác", render: a => <div className="candidate-table-actions"><Link className="secondary" to={`/me/applications/${a.id}`}>Chi tiết <ArrowUpRight size={15}/></Link>{a.status === "new" && <ConfirmAction label="Rút đơn" title="Rút đơn ứng tuyển?" description={`Bạn có chắc muốn rút hồ sơ ứng tuyển “${a.jobTitle || `#${a.jobId}`}”?`} onConfirm={() => withdraw(a.id)} danger/>}</div> },
    ]}/>}
  </main>;
}
