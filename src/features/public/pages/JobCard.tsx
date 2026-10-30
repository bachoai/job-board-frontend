import { ArrowUpRight, CalendarDays, MapPin, Wallet, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "../../../components/common/format";
import type { JobWithCompany } from "../api/public.api";

export const levelLabel: Record<string, string> = { intern: "Thực tập", junior: "Junior", middle: "Middle", senior: "Senior" };
export const typeLabel: Record<string, string> = { full_time: "Toàn thời gian", part_time: "Bán thời gian", internship: "Thực tập", contract: "Hợp đồng" };
export function salaryLabel(job: JobWithCompany) {
  const format = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
  if (job.salaryMin != null && job.salaryMax != null) return `${format(job.salaryMin)} – ${format(job.salaryMax)} ${job.currency || "VND"}`;
  if (job.salaryMin != null) return `Từ ${format(job.salaryMin)} ${job.currency || "VND"}`;
  if (job.salaryMax != null) return `Đến ${format(job.salaryMax)} ${job.currency || "VND"}`;
  return "Thỏa thuận";
}
export function JobCard({ job }: { job: JobWithCompany }) {
  return (
    <article className="public-job-card">
      <div className="public-job-card-top"><span className="public-company-icon"><Building2 size={22}/></span><span className="public-job-type">{typeLabel[job.jobType] || job.jobType}</span></div>
      <Link className="public-job-name" to={`/jobs/${job.id}`}>{job.title}</Link>
      <p>{job.company?.name || `Công ty #${job.companyId}`}</p>
      <div className="public-job-facts">
        <span><MapPin size={16}/>{job.province || job.location || "Chưa cập nhật địa điểm"}</span>
        <span><Wallet size={16}/>{salaryLabel(job)}</span>
        <span><CalendarDays size={16}/>Hạn: {formatDate(job.deadline)}</span>
      </div>
      <div className="public-job-bottom"><span className="public-tag">{levelLabel[job.level || ""] || "Không yêu cầu cấp độ"}</span><Link to={`/jobs/${job.id}`} aria-label={`Chi tiết ${job.title}`} className="public-card-link"><ArrowUpRight size={20}/></Link></div>
    </article>
  );
}
