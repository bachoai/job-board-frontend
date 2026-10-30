import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BriefcaseBusiness, Search, FilterX } from "lucide-react";
import { ErrorMessage, Loading, EmptyState } from "../../../components/common/Feedback";
import { JobCard } from "./JobCard";
import { publicApi } from "../api/public.api";
import { ApiError } from "../../../lib/api";
import type { JobPage, JobWithCompany } from "../api/public.api";
const size = 9;
export function JobsPage() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [provinceDraft, setProvinceDraft] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<JobPage | null>(null);
  const [results, setResults] = useState<JobWithCompany[] | null>(null);
  const [searchIds, setSearchIds] = useState<number[] | null>(null);
  const [searchFallback, setSearchFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  // When showing search results, pagination happens locally (no repeat API calls).
  const fetchPage = query ? 1 : page;
  useEffect(() => {
    const timer = window.setTimeout(() => { setProvince(provinceDraft.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [provinceDraft]);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true); setError("");
    // Full-text search returns only ranked IDs, so enrich the matches with details.
    (async () => {
      if (query) {
        try {
          const hits = await publicApi.search(query, c.signal);
          const jobs = await Promise.all(hits.items.map(async (hit) => {
            try { return await publicApi.job(hit.id, c.signal); } catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
          }));
          if (!c.signal.aborted) {
            setSearchIds(hits.items.map((hit) => hit.id));
            setSearchFallback(false);
            setResults(jobs.filter((job): job is JobWithCompany => job !== null));
          }
        } catch (err) {
          // This is a visible, limited fallback, not an attempt to hide HTTP 500.
          if (!(err instanceof ApiError) || err.status < 500) throw err;
          const basicMatches = await publicApi.basicSearch(query, c.signal);
          if (!c.signal.aborted) {
            setResults(basicMatches);
            setSearchIds(null);
            setSearchFallback(true);
          }
        }
        if (!c.signal.aborted) setData(null);
      } else {
        const list = await publicApi.jobs({ page: fetchPage, limit: size, province: province || undefined, level: level || undefined }, c.signal);
        setData(list); setResults(null); setSearchIds(null); setSearchFallback(false);
      }
    })().catch((err: unknown) => { if (!c.signal.aborted) setError(err instanceof Error ? err.message : "Không thể tải việc làm."); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [fetchPage, province, level, query, version]);
  // Search results are ranked by the backend; retain their order after local filters.
  const matched = (results || []).filter((job) => (!province || job.province?.toLocaleLowerCase("vi") === province.toLocaleLowerCase("vi")) && (!level || job.level === level));
  const total = query ? matched.length : data?.meta.total || 0;
  const countPages = query ? Math.max(1, Math.ceil(matched.length / size)) : Math.max(1, data?.meta.totalPages || 1);
  const visible = query ? matched.slice((page - 1) * size, page * size) : data?.items || [];
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setPage(1); setQuery(draft.trim()); };
  const clear = () => { setQuery(""); setDraft(""); setProvince(""); setProvinceDraft(""); setLevel(""); setPage(1); };
  return <main className="public-page">
    <section className="public-hero"><div className="public-hero-copy"><span className="public-kicker"><BriefcaseBusiness size={16}/> CƠ HỘI DÀNH CHO BẠN</span><h1>Tìm công việc <span>phù hợp</span> với hành trình của bạn.</h1><p>Khám phá vị trí đang tuyển dụng, lọc theo địa điểm và cấp bậc để bắt đầu bước tiếp theo.</p></div>
      <form className="public-search" onSubmit={submitSearch} role="search"><Search size={20}/><input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Vị trí, kỹ năng, từ khóa…" aria-label="Từ khóa tìm việc"/><button className="primary" type="submit">Tìm việc</button></form>
    </section>
    <section className="public-section"><div className="public-heading"><div><span className="public-kicker">KHÁM PHÁ VIỆC LÀM</span><h2>Việc làm đang tuyển</h2><p>{loading ? "Đang tải…" : `${total} vị trí phù hợp${query ? ` với “${query}”` : ""}`}</p></div></div>
      <div className="public-toolbar"><label>Địa điểm<input list="public-provinces" type="search" placeholder="Toàn quốc / Nhập tỉnh" value={provinceDraft} onChange={(e) => setProvinceDraft(e.target.value)}/><datalist id="public-provinces">{["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Đồng Nai"].map(p => <option key={p} value={p}/>)}</datalist></label><label>Cấp bậc<select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}><option value="">Mọi cấp bậc</option><option value="intern">Thực tập</option><option value="junior">Junior</option><option value="middle">Middle</option><option value="senior">Senior</option></select></label><button className="secondary" onClick={clear}><FilterX size={16}/> Xóa lọc</button></div>
      {loading ? <Loading/> : error ? <ErrorMessage message={error} retry={reload}/> : visible.length ? <div className="public-job-grid">{visible.map((job) => <JobCard key={job.id} job={job}/>)}</div> : <EmptyState title="Chưa tìm thấy công việc phù hợp"><p>Thử từ khóa hoặc bộ lọc khác.</p></EmptyState>}
      {!loading && !error && countPages > 1 && <div className="public-pagination"><span>Trang {page}/{countPages}</span><button className="secondary" disabled={page <= 1} onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}>Trước</button><button className="secondary" disabled={page >= countPages} onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}>Sau</button></div>}
      {!loading && !error && searchFallback && <p className="public-note" role="status">Tìm kiếm toàn văn của máy chủ đang gặp lỗi. Frontend đang dùng tìm kiếm cơ bản trên tối đa 1.000 tin công khai; kết quả có thể chưa đầy đủ.</p>}
      {!loading && !error && searchIds && <p className="public-note">Kết quả tìm kiếm theo full-text từ backend (tối đa 50 tin). Các bộ lọc áp dụng trên kết quả tìm kiếm.</p>}
    </section>
  </main>;
}
