import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin, Sparkles } from "lucide-react";
import { useResource } from "../../../components/common/useResource";
import { EmptyState, ErrorMessage, Loading, PageHeading } from "../../../components/common/Feedback";
import { candidateApi } from "../api/candidate.api";
import { aiApi } from "../../ai/api/ai.api";
import { AiScoreBadge } from "../../ai/components/AiScoreBadge";
import { AiScoreBar } from "../../ai/components/AiScoreBar";
import { AiSkillsList } from "../../ai/components/AiSkillsList";
import { AiResumeAnalysis } from "../../ai/components/AiResumeAnalysis";
import { parsedInfo } from "../../ai/utils/ai";
import { levelLabel } from "../../public/pages/JobCard";

function ResumeMatches({ resumeId }: { resumeId: number }) {
  const [attempt, setAttempt] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const resource = useResource(useCallback(async (signal: AbortSignal) => {
    if (!attempt) return null;
    const parsed = await aiApi.getParsedResume(resumeId, signal);
    if (!parsedInfo(parsed)) return { parsed, matches: null };
    return { parsed, matches: await aiApi.getResumeMatches(resumeId, 10, signal) };
  }, [resumeId, attempt]));
  return <>
    <div className="ai-actions"><button className="primary" disabled={attempt > 0 && resource.loading} onClick={() => setAttempt((value) => value + 1)}>
      <Sparkles size={17}/>{attempt > 0 && resource.loading ? "Đang tìm việc…" : "Tìm việc phù hợp"}
    </button></div>
    {!attempt ? <EmptyState title="Khám phá cơ hội từ CV của bạn"><p>Chọn CV rồi nhấn Tìm việc phù hợp để xem gợi ý từ AI.</p></EmptyState>
      : resource.loading ? <Loading/> : resource.error ? <ErrorMessage message={resource.error} retry={resource.reload}/>
      : resource.data?.matches ? <>
        <p className="ai-note">Các kết quả AI chỉ là gợi ý, không phải cam kết trúng tuyển.</p>
        {resource.data.matches.items.length ? <div className="ai-match-grid">{resource.data.matches.items.map((job) => <article className="public-job-card ai-match-card" key={job.jobId}>
          <div className="public-job-card-top"><span className="public-company-icon"><Building2 size={22}/></span><AiScoreBadge label={job.label}/></div>
          <Link className="public-job-name" to={`/jobs/${job.jobId}`}>{job.title}</Link>
          <p>{job.company || "Chưa cập nhật công ty"}</p>
          <div className="public-job-facts"><span><MapPin size={16}/>{job.province || "Chưa cập nhật địa điểm"}</span><span>{levelLabel[job.level || ""] || "Chưa xác định cấp bậc"}</span></div>
          <AiScoreBar score={job.score}/>
          <AiSkillsList title="Kỹ năng đã đáp ứng" skills={job.matchedSkills} tone="matched"/>
          <AiSkillsList title="Kỹ năng còn thiếu" skills={job.missingSkills} tone="missing"/>
          <Link className="secondary" to={`/jobs/${job.jobId}`}>Xem chi tiết</Link>
        </article>)}</div> : <EmptyState title="Chưa có việc làm phù hợp"><p>Thử lại sau khi hệ thống có thêm tin tuyển dụng được xử lý.</p></EmptyState>}
      </> : resource.data && <section className="ai-notice">
        <h2>{resource.data.parsed.status === "error" ? "CV chưa phân tích được" : "CV đang được xử lý"}</h2>
        <p>Cần hoàn thành phân tích CV trước khi tìm việc phù hợp.</p>
        <div className="ai-actions"><button className="secondary" onClick={resource.reload}>Kiểm tra lại</button><button className="secondary" onClick={() => setShowAnalysis((value) => !value)}>Phân tích CV</button><Link className="text-button" to="/me/resumes">Quản lý CV</Link></div>
        {showAnalysis && <AiResumeAnalysis key={resumeId} resumeId={resumeId}/>}
      </section>}
  </>;
}

export function RecommendedJobsPage() {
  const resumes = useResource(useCallback((signal: AbortSignal) => candidateApi.resumes(signal), []));
  const [selection, setSelection] = useState("");
  const current = resumes.data?.find((resume) => String(resume.id) === selection)
    || resumes.data?.find((resume) => resume.isDefault) || resumes.data?.[0];
  return <main className="page">
    <PageHeading title="Việc làm phù hợp với bạn" description="Khám phá những công việc được AI gợi ý dựa trên kỹ năng và kinh nghiệm trong CV của bạn."/>
    {resumes.loading ? <Loading/> : resumes.error ? <ErrorMessage message={resumes.error} retry={resumes.reload}/>
      : !current ? <section className="candidate-card"><EmptyState title="Bạn chưa tải CV lên"><p>Tải CV để AI gợi ý những công việc phù hợp.</p><Link className="primary" to="/me/resumes">Tải CV của bạn</Link></EmptyState></section>
      : <><section className="candidate-card ai-resume-select"><label htmlFor="recommended-resume">Chọn CV để tìm việc phù hợp</label>
        <select id="recommended-resume" value={current.id} onChange={(event) => setSelection(event.target.value)}>{resumes.data?.map((resume) => <option key={resume.id} value={resume.id}>{resume.fileName}{resume.isDefault ? " · CV mặc định" : ""}</option>)}</select>
      </section><ResumeMatches key={current.id} resumeId={current.id}/></>}
  </main>;
}
