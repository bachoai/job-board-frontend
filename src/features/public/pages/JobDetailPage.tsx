import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Building2, CalendarDays, Clock3, MapPin, Wallet, BriefcaseBusiness, ArrowUpRight } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/useAuth";
import { routeId, formatDate } from "../../../components/common/format";
import { ErrorMessage, Loading } from "../../../components/common/Feedback";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useResource } from "../../../components/common/useResource";
import { publicApi, isOpenJob } from "../api/public.api";
import { salaryLabel, typeLabel, levelLabel } from "./JobCard";
import { ApplyDialog } from "../../candidate/components/ApplyDialog";
export function JobDetailPage() {
  const { id } = useParams(); const jobId = routeId(id);
  const { session } = useAuth(); const location = useLocation();
  const [apply, setApply] = useState(false);
  const job = useResource(useCallback((signal: AbortSignal) => jobId ? publicApi.job(jobId, signal) : Promise.reject(new Error("Mã tin không hợp lệ.")), [jobId]));
  useEffect(() => { setApply(false); }, [jobId]);
  if (job.loading) return <main className="public-page public-section"><Loading/></main>;
  if (job.error || !job.data) return <main className="public-page public-section"><ErrorMessage message={job.error || "Không tìm thấy tin tuyển dụng."} retry={job.reload}/><Link to="/jobs" className="public-back"><ArrowLeft size={16}/> Danh sách việc làm</Link></main>;
  const item = job.data; const open = isOpenJob(item);
  const applyButton = !open ? <button className="primary" disabled>Tin đã đóng hoặc hết hạn</button> : !session ? <Link className="primary" to="/login" state={{ from: location.pathname }}>Đăng nhập để ứng tuyển <ArrowUpRight size={17}/></Link> : session.user.role === "candidate" ? <button className="primary" onClick={() => setApply(true)}>Ứng tuyển ngay <ArrowUpRight size={17}/></button> : <p>Đăng nhập bằng tài khoản ứng viên để ứng tuyển.</p>;
  return <main className="public-page public-section"><Link className="public-back" to="/jobs"><ArrowLeft size={17}/> Trở lại danh sách việc làm</Link>
    <div className="public-job-detail"><article className="public-detail-main"><div className="public-panel"><span className="public-kicker"><BriefcaseBusiness size={15}/> THÔNG TIN TUYỂN DỤNG</span><h1>{item.title}</h1><div className="public-detail-company"><Building2 size={17}/>{item.company ? <Link to={`/companies/${item.companyId}`}>{item.company.name}</Link> : <span>Công ty #{item.companyId}</span>}</div><div className="public-detail-tags"><StatusBadge status={item.status}/><span className="public-tag">{typeLabel[item.jobType] || item.jobType}</span><span className="public-tag">{levelLabel[item.level || ""] || "Mọi cấp độ"}</span></div><div className="public-detail-facts"><span><MapPin size={18}/>{[item.location, item.province].filter(Boolean).join(", ") || "Chưa cập nhật địa điểm"}</span><span><Wallet size={18}/>{salaryLabel(item)}</span><span><CalendarDays size={18}/>Hạn nộp: {formatDate(item.deadline)}</span><span><Clock3 size={18}/>Đăng: {formatDate(item.createdAt)}</span></div><div className="public-apply-top">{applyButton}</div></div>
      <div className="public-panel"><h2>Mô tả công việc</h2><p className="public-description">{item.description || "Nhà tuyển dụng chưa cập nhật mô tả chi tiết."}</p></div>
      {item.skills?.length ? <div className="public-panel"><h2>Kỹ năng liên quan</h2><div className="public-detail-tags">{item.skills.map(skill => <span className="public-tag" key={skill.id}>{skill.name}</span>)}</div></div> : null}</article>
    <aside className="public-detail-aside"><div className="public-panel"><h2>Tổng quan</h2><dl className="public-overview"><dt>Công ty</dt><dd>{item.company?.name || `#${item.companyId}`}</dd><dt>Hình thức</dt><dd>{typeLabel[item.jobType] || item.jobType}</dd><dt>Cấp bậc</dt><dd>{levelLabel[item.level || ""] || "Chưa yêu cầu"}</dd><dt>Hạn nộp</dt><dd>{formatDate(item.deadline)}</dd></dl></div>{item.company && <Link to={`/companies/${item.companyId}`} className="public-panel public-company-side"><Building2 size={25}/><h3>{item.company.name}</h3><span>Khám phá doanh nghiệp <ArrowUpRight size={15}/></span></Link>}</aside></div>
    {apply && jobId && open && <ApplyDialog jobId={jobId} jobTitle={item.title} close={() => setApply(false)}/>}
  </main>;
}
