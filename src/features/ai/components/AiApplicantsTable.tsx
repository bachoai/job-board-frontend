import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { DataTable } from "../../../components/common/DataTable";
import { Loading, ErrorMessage } from "../../../components/common/Feedback";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { formatDate } from "../../../components/common/format";
import { useResource } from "../../../components/common/useResource";
import { aiApi } from "../api/ai.api";
import { matchLabels, sortApplicants } from "../utils/ai";
import { AiScoreBadge } from "./AiScoreBadge";
import { AiScoreBar } from "./AiScoreBar";
import { AiSkillsList } from "./AiSkillsList";

export function AiApplicantsTable({ jobId }: { jobId: number }) {
  const resource = useResource(useCallback((signal: AbortSignal) => aiApi.getRankedApplicants(jobId, signal), [jobId]));
  const [filter, setFilter] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  return <section>
    <p className="ai-note">AI hỗ trợ tham khảo; nhà tuyển dụng quyết định cuối cùng. Hồ sơ đang chờ hoặc chưa chấm được không có nghĩa là ít phù hợp.</p>
    <div className="ai-actions"><button className="secondary" disabled={resource.loading} onClick={resource.reload}><RefreshCw size={16}/> Tải lại đánh giá</button></div>
    {resource.loading ? <Loading/> : resource.error ? <ErrorMessage message={resource.error} retry={resource.reload}/>
      : resource.data && <DataTable
        title="Xếp hạng ứng viên theo AI"
        rows={sortApplicants(resource.data.items, order).filter((item) => !filter || (item.ai.status === "scored" ? item.ai.label === filter : item.ai.status === filter)).map((item) => ({ ...item, id: item.applicationId }))}
        searchText={(item) => `${item.candidateName} ${item.candidateId} ${item.applicationId}`}
        searchLabel="Tìm tên ứng viên, mã hồ sơ…"
        filtered={!!filter}
        filterKey={`${filter}:${order}`}
        emptyTitle="Chưa có hồ sơ ứng tuyển"
        filters={<><select aria-label="Lọc đánh giá AI" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">Mọi đánh giá</option>{Object.entries(matchLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          <option value="pending">Đang chờ đánh giá</option><option value="unscored">Chưa chấm được</option>
        </select><select aria-label="Sắp xếp điểm AI" value={order} onChange={(event) => setOrder(event.target.value as "asc" | "desc")}>
          <option value="desc">Điểm cao trước</option><option value="asc">Điểm thấp trước</option>
        </select></>}
        columns={[
          { key: "candidate", title: "Ứng viên", render: (item) => <><strong>{item.candidateName || `Ứng viên #${item.candidateId}`}</strong><div className="cell-muted">Hồ sơ #{item.applicationId} · {formatDate(item.appliedAt)}</div></> },
          { key: "status", title: "Trạng thái hồ sơ", render: (item) => <StatusBadge status={item.applicationStatus}/> },
          { key: "label", title: "Đánh giá AI", render: (item) => <AiScoreBadge status={item.ai.status} label={item.ai.label}/> },
          { key: "score", title: "Điểm phù hợp", render: (item) => item.ai.status === "scored" ? <AiScoreBar score={item.ai.score}/> : <span className="hint">Chưa có điểm</span> },
          { key: "skills", title: "Thông tin đánh giá", render: (item) => item.ai.status === "scored" ? <details className="ai-skills-details"><summary>Xem kỹ năng</summary><AiSkillsList title="Đã đáp ứng" skills={item.ai.matchedSkills} tone="matched"/><AiSkillsList title="Còn thiếu" skills={item.ai.missingSkills} tone="missing"/></details> : <span className="cell-muted">{item.ai.reason || (item.ai.status === "pending" ? "Hồ sơ đang chờ hệ thống đánh giá." : "Chưa đủ dữ liệu để đánh giá.")}</span> },
          { key: "actions", title: "Thao tác", render: (item) => <Link className="table-link" to={`/employer/applications/${item.applicationId}?jobId=${jobId}`}>Xem đánh giá →</Link> },
        ]}
      />}
  </section>;
}
