import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BriefcaseBusiness, Search, FilterX, Sparkles } from "lucide-react";
import { ErrorMessage, Loading, EmptyState } from "../../../components/common/Feedback";
import { useResource } from "../../../components/common/useResource";
import { JobCard } from "./JobCard";
import { publicApi, isOpenJob } from "../api/public.api";
import { ApiError } from "../../../lib/api";
import { aiApi } from "../../ai/api/ai.api";
import { AI_ENABLED } from "../../ai/config";
import { orderSearchResults } from "../../ai/utils/ai";
import type { JobPage, JobWithCompany } from "../api/public.api";

const size = 9;
type Results = { kind: "list"; data: JobPage } | { kind: "ai" | "basic"; jobs: JobWithCompany[] };

export function JobsPage() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [provinceDraft, setProvinceDraft] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [useAi, setUseAi] = useState(AI_ENABLED);
  const fetchPage = query ? 1 : page;
  const serverProvince = query ? undefined : province || undefined;
  const serverLevel = query ? undefined : level || undefined;
  useEffect(() => {
    const timer = window.setTimeout(() => { setProvince(provinceDraft.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [provinceDraft]);
  const resource = useResource(useCallback(async (signal: AbortSignal): Promise<Results> => {
    if (!query) return { kind: "list", data: await publicApi.jobs({ page: fetchPage, limit: size, province: serverProvince, level: serverLevel }, signal) };
    if (!useAi) return { kind: "basic", jobs: await publicApi.basicSearch(query, signal) };
    const hits = await aiApi.searchJobs(query, "hybrid", 50, signal);
    const ids = [...new Set(hits.items.map((hit) => hit.id))];
    const jobs: JobWithCompany[] = [];
    // Keep API ordering; batch requests so 50 hits do not create 50 simultaneous fetches.
    for (let start = 0; start < ids.length; start += 4) {
      signal.throwIfAborted();
      const batch = await Promise.all(ids.slice(start, start + 4).map(async (id) => {
        try { return await publicApi.job(id, signal); }
        catch (err) { if (err instanceof ApiError && err.status === 404) return null; throw err; }
      }));
      jobs.push(...batch.filter((job): job is JobWithCompany => job !== null && isOpenJob(job)));
    }
    return { kind: "ai", jobs: orderSearchResults(hits.items, jobs) };
  }, [query, useAi, fetchPage, serverProvince, serverLevel]));
  const results = resource.data;
  const matched = results && results.kind !== "list" ? results.jobs.filter((job) =>
    (!province || job.province?.toLocaleLowerCase("vi") === province.toLocaleLowerCase("vi")) && (!level || job.level === level)) : [];
  const total = results?.kind === "list" ? results.data.meta.total : matched.length;
  const countPages = results?.kind === "list" ? Math.max(1, results.data.meta.totalPages) : Math.max(1, Math.ceil(matched.length / size));
  const currentPage = Math.min(page, countPages);
  const visible = results?.kind === "list" ? results.data.items : matched.slice((currentPage - 1) * size, currentPage * size);
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setPage(1); setQuery(draft.trim()); };
  const clear = () => { setQuery(""); setDraft(""); setProvince(""); setProvinceDraft(""); setLevel(""); setPage(1); };
  return <main className="public-page">
    <section className="public-hero"><div className="public-hero-copy"><span className="public-kicker"><BriefcaseBusiness size={16}/> CƠ HỘI DÀNH CHO BẠN</span><h1>Tìm công việc <span>phù hợp</span> với hành trình của bạn.</h1><p>Khám phá vị trí đang tuyển dụng, lọc theo địa điểm và cấp bậc để bắt đầu bước tiếp theo.</p></div>
      <form className="public-search" onSubmit={submitSearch} role="search"><Search size={20}/><input type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Vị trí, kỹ năng, từ khóa…" aria-label="Từ khóa tìm việc"/><button className="primary" type="submit">Tìm việc</button></form>
    </section>
    <section className="public-section"><div className="public-heading"><div><span className="public-kicker">KHÁM PHÁ VIỆC LÀM</span><h2>Việc làm đang tuyển</h2><p>{resource.loading ? "Đang tải…" : `${total} vị trí phù hợp${query ? ` với “${query}”` : ""}`}</p></div></div>
      {AI_ENABLED && <div className="ai-mode"><label className="ai-search-toggle"><input type="checkbox" checked={useAi} onChange={(event) => { setUseAi(event.target.checked); setPage(1); }}/><Sparkles size={18}/> Tìm kiếm thông minh bằng AI</label><p className="hint">Mô tả công việc bạn mong muốn bằng ngôn ngữ tự nhiên.</p></div>}
      <div className="public-toolbar"><label>Địa điểm<input list="public-provinces" type="search" placeholder="Toàn quốc / Nhập tỉnh" value={provinceDraft} onChange={(event) => setProvinceDraft(event.target.value)}/><datalist id="public-provinces">{["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Đồng Nai"].map((value) => <option key={value} value={value}/>)}</datalist></label><label>Cấp bậc<select value={level} onChange={(event) => { setLevel(event.target.value); setPage(1); }}><option value="">Mọi cấp bậc</option><option value="intern">Thực tập</option><option value="junior">Junior</option><option value="middle">Middle</option><option value="senior">Senior</option></select></label><button className="secondary" onClick={clear}><FilterX size={16}/> Xóa lọc</button></div>
      {results?.kind === "ai" && !resource.loading && <span className="ai-search-label"><Sparkles size={16}/> Kết quả tìm kiếm bằng AI</span>}
      {resource.loading ? <Loading/> : resource.error ? <><ErrorMessage message={resource.error} retry={resource.reload}/>{useAi && query && <div className="ai-actions"><button className="secondary" onClick={() => { setUseAi(false); setPage(1); }}>Tìm kiếm cơ bản</button></div>}</>
        : visible.length ? <div className="public-job-grid">{visible.map((job) => <JobCard key={job.id} job={job}/>)}</div> : <EmptyState title="Chưa tìm thấy công việc phù hợp"><p>Thử từ khóa hoặc bộ lọc khác.</p></EmptyState>}
      {!resource.loading && !resource.error && countPages > 1 && <div className="public-pagination"><span>Trang {currentPage}/{countPages}</span><button className="secondary" disabled={currentPage <= 1} onClick={() => { setPage(currentPage - 1); window.scrollTo(0, 0); }}>Trước</button><button className="secondary" disabled={currentPage >= countPages} onClick={() => { setPage(currentPage + 1); window.scrollTo(0, 0); }}>Sau</button></div>}
      {!resource.loading && !resource.error && results?.kind === "basic" && <p className="public-note">Tìm kiếm cơ bản trên tối đa 1.000 tin công khai từ hệ thống; kết quả có thể chưa đầy đủ.</p>}
      {!resource.loading && !resource.error && results?.kind === "ai" && <p className="public-note">Tối đa 50 kết quả theo thứ tự AI xếp hạng; bộ lọc và phân trang áp dụng trên danh sách này. Điểm xếp hạng tìm kiếm không phải phần trăm phù hợp.</p>}
    </section>
  </main>;
}
