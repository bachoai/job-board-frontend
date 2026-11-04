import { useCallback } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { ErrorMessage, Loading } from "../../../components/common/Feedback";
import { formatDate } from "../../../components/common/format";
import { useResource } from "../../../components/common/useResource";
import { aiApi } from "../api/ai.api";
import { parsedInfo } from "../utils/ai";
import { useAiAction } from "../useAiAction";
import type { AiProcessResult } from "../types/ai.types";
import { AiSkillsList } from "./AiSkillsList";

export function AiResumeAnalysis({ resumeId }: { resumeId: number }) {
  const resource = useResource(useCallback((signal: AbortSignal) => aiApi.getParsedResume(resumeId, signal), [resumeId]));
  const action = useAiAction<AiProcessResult>();
  const info = parsedInfo(resource.data);
  return <section className="ai-panel" id={`ai-resume-${resumeId}`} aria-label="Phân tích CV bằng AI">
    <div className="ai-heading"><h2><Sparkles size={18}/> Phân tích CV bằng AI</h2></div>
    {resource.loading ? <Loading/> : resource.error ? <ErrorMessage message={resource.error} retry={resource.reload}/> : resource.data && <>
      {resource.data.status === "pending" && <div className="ai-notice"><strong>CV đang được xử lý</strong><p>CV mới được xử lý tự động khi AI khả dụng. Kiểm tra lại sau hoặc yêu cầu phân tích lại nếu đã chờ lâu.</p></div>}
      {resource.data.status === "error" && <ErrorMessage message={resource.data.data && "error" in resource.data.data ? resource.data.data.error : "Chưa phân tích được CV này."}/>}
      {info && <>
        <AiSkillsList title="Kỹ năng được trích xuất" skills={info.skills} tone="matched"/>
        <AiSkillsList title="Kỹ năng được nhắc đến trong CV" skills={info.mentionedSkills}/>
        <dl className="ai-facts">
          <div><dt>Kinh nghiệm</dt><dd>{info.years == null ? "Chưa xác định" : `${info.years} năm`}</dd></div>
          <div><dt>Cấp bậc chuyên môn</dt><dd>{info.level || "Chưa xác định"}</dd></div>
          <div><dt>Địa điểm</dt><dd>{info.province || "Chưa xác định"}</dd></div>
          <div><dt>Vị trí mong muốn</dt><dd>{info.desiredTitle || "Chưa xác định"}</dd></div>
          <div><dt>Phân tích gần nhất</dt><dd>{formatDate(resource.data.parsedAt, true)}</dd></div>
        </dl>
      </>}
      <div className="ai-actions">
        <button type="button" className="secondary" disabled={action.busy} onClick={resource.reload}><RefreshCw size={16}/> Kiểm tra lại</button>
        <button type="button" className="primary" disabled={action.busy} onClick={() => void action.run((signal) => aiApi.processResume(resumeId, signal), resource.reload)}>
          <Sparkles size={16}/>{action.busy ? "Đang phân tích…" : "Phân tích lại"}
        </button>
      </div>
    </>}
    {action.busy && <p role="status" className="ai-note">Đang đọc và phân tích CV. Bạn có thể quay lại kiểm tra kết quả nếu cần chuyển trang.</p>}
    {action.error && <ErrorMessage message={action.error}/>}
    {action.result && <p role="status" className="ai-note">Đã xử lý CV. Kết quả được tải lại từ hệ thống.</p>}
  </section>;
}
