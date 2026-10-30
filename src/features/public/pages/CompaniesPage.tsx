import { useCallback, useState } from "react";
import { Building2, MapPin, Search, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorMessage, Loading, EmptyState } from "../../../components/common/Feedback";
import { useResource } from "../../../components/common/useResource";
import { publicApi } from "../api/public.api";
export function CompaniesPage() {
  const [search, setSearch] = useState("");
  const companies = useResource(useCallback((signal: AbortSignal) => publicApi.companies(signal), []));
  const filtered = (companies.data || []).filter(c => c.name.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi").trim()));
  return <main className="public-page public-section"><div className="public-heading"><div><span className="public-kicker">ĐỐI TÁC TUYỂN DỤNG</span><h1>Khám phá công ty</h1><p>Tìm hiểu môi trường làm việc và các vị trí đang mở tại từng doanh nghiệp.</p></div></div>
    <label className="public-company-search"><Search size={18}/><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên công ty…" aria-label="Tìm công ty"/></label>
    {companies.loading ? <Loading/> : companies.error ? <ErrorMessage message={companies.error} retry={companies.reload}/> : filtered.length ? <div className="public-job-grid">{filtered.map(company => <Link className="public-job-card public-company-card" to={`/companies/${company.id}`} key={company.id}><span className="public-company-icon"><Building2 size={26}/></span><h2>{company.name}</h2><p>{company.description ? company.description.slice(0, 135) : "Khám phá cơ hội nghề nghiệp tại doanh nghiệp này."}</p><span><MapPin size={16}/>{company.province || company.address || "Chưa cập nhật địa điểm"}</span><strong>Xem công ty <ArrowUpRight size={16}/></strong></Link>)}</div> : <EmptyState title="Không tìm thấy công ty"/>}
  </main>;
}
