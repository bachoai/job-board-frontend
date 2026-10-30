import { useCallback } from "react";
import { ArrowLeft, Building2, Globe, MapPin } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorMessage, Loading, EmptyState } from "../../../components/common/Feedback";
import { routeId } from "../../../components/common/format";
import { useResource } from "../../../components/common/useResource";
import { publicApi } from "../api/public.api";
import { JobCard } from "./JobCard";
export function CompanyDetailPage() {
  const { id } = useParams(); const companyId = routeId(id);
  const data = useResource(useCallback(async (signal: AbortSignal) => {
    if (!companyId) throw new Error("Mã công ty không hợp lệ.");
    const company = await publicApi.company(companyId, signal);
    // Fetch jobs separately, so the page remains usable even if job pagination fails.
    let jobs: Awaited<ReturnType<typeof publicApi.companyJobs>> = [];
    let jobsError = "";
    try { jobs = await publicApi.companyJobs(companyId, company.name, signal); } catch (err) { jobsError = err instanceof Error ? err.message : "Không thể tải tin tuyển dụng."; }
    return { company, jobs, jobsError };
  }, [companyId]));
  if (data.loading) return <main className="public-page public-section"><Loading/></main>;
  if (data.error) return <main className="public-page public-section"><ErrorMessage message={data.error} retry={data.reload}/></main>;
  if (!data.data) return null;
  const { company, jobs, jobsError } = data.data;
  const site = company.website && /^https?:\/\//i.test(company.website) ? company.website : null;
  return <main className="public-page public-section"><Link className="public-back" to="/companies"><ArrowLeft size={17}/> Danh sách công ty</Link>
    <section className="public-detail-header"><span className="public-company-icon public-company-icon-lg"><Building2 size={32}/></span><div><span className="public-kicker">HỒ SƠ DOANH NGHIỆP</span><h1>{company.name}</h1><p><MapPin size={17}/> {[company.address, company.ward, company.province].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ"}</p>{site && <a href={site} target="_blank" rel="noopener noreferrer" className="public-site"><Globe size={16}/> Website công ty</a>}</div></section>
    <div className="public-detail-body"><section className="public-panel"><h2>Giới thiệu công ty</h2><p className="public-description">{company.description || "Công ty chưa cập nhật phần giới thiệu."}</p></section><section className="public-panel"><h2>Vị trí đang tuyển ({jobs.length})</h2>{jobsError ? <ErrorMessage message={jobsError} retry={data.reload}/> : jobs.length ? <div className="public-job-grid">{jobs.map(job => <JobCard key={job.id} job={{...job, company}}/>)}</div> : <EmptyState title="Chưa có tin tuyển dụng đang mở"/>}</section></div>
  </main>;
}
