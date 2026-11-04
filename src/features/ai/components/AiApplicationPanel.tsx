import { useCallback } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useResource } from "../../../components/common/useResource";
import { EmptyState, ErrorMessage, Loading } from "../../../components/common/Feedback";
import { formatDate } from "../../../components/common/format";
import { aiApi } from "../api/ai.api";
import { useAiAction } from "../useAiAction";
import type { AiRescoreResult } from "../types/ai.types";
import { levelGapText, scorePercent } from "../utils/ai";
import { AiScoreBadge } from "./AiScoreBadge";
import { AiScoreBar } from "./AiScoreBar";
import { AiSkillsList } from "./AiSkillsList";

export function AiApplicationPanel({ applicationId, jobId }: { applicationId: number; jobId: number }) {
  const resource = useResource(useCallback(async (signal: AbortSignal) => {
    const ranked = await aiApi.getRankedApplicants(jobId, signal);
    return ranked.items.find((item) => item.applicationId === applicationId) || null;
  }, [applicationId, jobId]));
  const action = useAiAction<AiRescoreResult>();
  const evaluation = resource.data?.ai;
  const skillPercent = scorePercent(evaluation?.skillRatio);
  return <section className="card ai-application-panel" aria-label="Đánh giá AI">
    <h2><Sparkles size={18}/> Đánh giá AI</h2>
    {resource.loading ? <Loading/> : resource.error ? <ErrorMessage message={resource.error} retry={resource.reload}/>
      : !resource.data ? <EmptyState title="Không tìm thấy hồ sơ trong tin tuyển dụng này"><p>Mở hồ sơ từ danh sách ứng viên của tin bạn sở hữu.</p></EmptyState>
      : <>
        <p className="ai-note">{resource.data.candidateName} · Hồ sơ #{resource.data.applicationId}</p>
        <AiScoreBadge status={evaluation?.status} label={evaluation?.label}/>
        {evaluation?.status === "scored" ? <>
          <AiScoreBar score={evaluation.score}/>
          <dl className="ai-facts">
            <div><dt>Nội dung CV và công việc tương đồng</dt><dd>{typeof evaluation.cosine === "number" && Number.isFinite(evaluation.cosine) ? evaluation.cosine.toLocaleString("vi-VN", { maximumFractionDigits: 3 }) : "Chưa có dữ liệu"}</dd></div>
            <div><dt>Tỷ lệ đáp ứng kỹ năng</dt><dd>{skillPercent === null ? "Chưa có dữ liệu" : `${skillPercent}%`}</dd></div>
            <div><dt>Cấp bậc</dt><dd>{levelGapText(evaluation.levelGap)}</dd></div>
            <div><dt>Đánh giá gần nhất</dt><dd>{formatDate(evaluation.scoredAt, true)}</dd></div>
          </dl>
          <p className="hint">Chỉ số tương đồng càng gần 1, nội dung càng giống nhau; đây không phải xác suất trúng tuyển.</p>
          <AiSkillsList title="Kỹ năng phù hợp" skills={evaluation.matchedSkills} tone="matched"/>
          <AiSkillsList title="Kỹ năng còn thiếu" skills={evaluation.missingSkills} tone="missing"/>
          {evaluation.reason && <p className="ai-note">{evaluation.reason}</p>}
        </> : <p className="ai-note">{evaluation?.reason || (evaluation?.status === "pending" ? "Hồ sơ đang chờ hệ thống đánh giá." : "Chưa đủ dữ liệu để chấm điểm.")} Trạng thái này không có nghĩa là ứng viên ít phù hợp.</p>}
        <div className="ai-actions"><button type="button" className="secondary" disabled={action.busy} onClick={() => void action.run((signal) => aiApi.rescoreApplication(applicationId, signal), resource.reload)}>
          <RefreshCw size={16} className={action.busy ? "spinner-icon" : undefined}/>{action.busy ? "Đang chấm điểm…" : "Chấm điểm lại bằng AI"}
        </button></div>
      </>}
    {action.busy && <p className="ai-note" role="status">Đang phân tích CV và thông tin công việc. Trạng thái ứng tuyển được giữ nguyên.</p>}
    {action.error && <ErrorMessage message={action.error}/>}
    {action.result && <p className="ai-note" role="status">{action.result.status === "scored" ? "Đã chấm điểm lại hồ sơ." : `Chưa chấm được hồ sơ: ${action.result.reason || "Chưa đủ dữ liệu."}`}</p>}
    <p className="ai-note">AI chỉ hỗ trợ ra quyết định. Nhà tuyển dụng quyết định cuối cùng; điểm thấp không tự động từ chối hồ sơ.</p>
  </section>;
}
