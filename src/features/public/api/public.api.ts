import { api } from "../../../lib/api";
import type { Company, Job } from "../../employer/types";

/** Public pages always read data from NestJS; no mock/demo fallback. */
export type JobWithCompany = Job & {
  company?: Company;
  skills?: { id: number; name: string }[];
};
export interface JobPage {
  items: JobWithCompany[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export interface JobFilters {
  page: number;
  limit: number;
  province?: string;
  level?: string;
  companyName?: string;
}
export interface JobSearchHit {
  id: number;
  title: string;
  level: string | null;
  province: string | null;
  location: string | null;
  score: number;
}
const params = (input: Record<string, string | number | undefined>) => {
  const values = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== "") values.set(key, String(value));
  });
  return values.toString();
};

export const publicApi = {
  jobs(filters: JobFilters, signal?: AbortSignal): Promise<JobPage> {
    return api<JobPage>(`/jobs?${params({ page: filters.page, limit: filters.limit, province: filters.province, level: filters.level, companyName: filters.companyName })}`, { auth: false, signal });
  },
  job(id: number, signal?: AbortSignal): Promise<JobWithCompany> {
    return api<JobWithCompany>(`/jobs/${id}`, { auth: false, signal });
  },
  search(query: string, signal?: AbortSignal): Promise<{ items: JobSearchHit[]; count: number }> {
    return api<{ items: JobSearchHit[]; count: number }>(`/search/jobs?${params({ q: query, limit: 50 })}`, { auth: false, signal });
  },
  /** If full-text search is unavailable, search ONLY jobs returned by the real API. */
  async basicSearch(query: string, signal?: AbortSignal): Promise<JobWithCompany[]> {
    const term = query.trim().toLocaleLowerCase("vi");
    if (!term) return [];
    const matched: JobWithCompany[] = [];
    let page = 1;
    // Capped at 1,000 jobs. No fabricated data when the API fails.
    while (page <= 10) {
      const result = await this.jobs({ page, limit: 100 }, signal);
      matched.push(...result.items.filter(job =>
        [job.title, job.description, job.company?.name, job.province, job.location]
          .some(value => typeof value === "string" && value.toLocaleLowerCase("vi").includes(term))
      ));
      if (!result.items.length || page >= result.meta.totalPages) break;
      page++;
    }
    return matched;
  },
  companies(signal?: AbortSignal): Promise<Company[]> {
    return api<Company[]>("/companies", { auth: false, signal });
  },
  company(id: number, signal?: AbortSignal): Promise<Company> {
    return api<Company>(`/companies/${id}`, { auth: false, signal });
  },
  // No GET /companies/:id/jobs. Query the public paginated jobs and match company ID.
  async companyJobs(companyId: number, companyName: string, signal?: AbortSignal): Promise<JobWithCompany[]> {
    const results: JobWithCompany[] = [];
    let page = 1;
    while (true) {
      const data = await this.jobs({ page, limit: 100, companyName }, signal);
      results.push(...data.items.filter((job) => job.companyId === companyId));
      if (page >= data.meta.totalPages || data.items.length === 0) break;
      page++;
    }
    return results;
  },
};

export { isOpenJob } from "../utils/open-job";
