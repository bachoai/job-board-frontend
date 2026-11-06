import { api } from "../../../lib/api";
import type { Company, Job } from "../../employer/types";
import { isOpenJob } from "../utils/open-job";

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
const params = (input: Record<string, string | number | undefined>) => {
  const values = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== "") values.set(key, String(value));
  });
  return values.toString();
};

export const publicApi = {
  async jobs(filters: JobFilters, signal?: AbortSignal): Promise<JobPage> {
    const result = await api<JobPage | JobWithCompany[]>(`/jobs?${params({ page: filters.page, limit: filters.limit, province: filters.province, level: filters.level, companyName: filters.companyName })}`, { auth: false, signal });
    if (!Array.isArray(result)) {
      if (!Array.isArray(result?.items) || !result.meta || !Number.isFinite(result.meta.total) || !Number.isFinite(result.meta.totalPages))
        throw new Error("Dữ liệu danh sách việc làm từ máy chủ không hợp lệ. Vui lòng thử lại.");
      return result;
    }
    // AI2 returns the complete array and ignores pagination/location/level queries.
    const companyName = filters.companyName?.trim().toLocaleLowerCase("vi");
    const companies = companyName ? await this.companies(signal) : [];
    const companyIds = new Set(companies.filter(company => company.name.toLocaleLowerCase("vi").includes(companyName!)).map(company => company.id));
    const matched = result.filter(job => isOpenJob(job)
      && (!filters.province || job.province?.toLocaleLowerCase("vi") === filters.province.toLocaleLowerCase("vi"))
      && (!filters.level || job.level === filters.level)
      && (!companyName || companyIds.has(job.companyId) || job.company?.name.toLocaleLowerCase("vi").includes(companyName)));
    return {
      items: matched.slice((filters.page - 1) * filters.limit, filters.page * filters.limit),
      meta: { page: filters.page, limit: filters.limit, total: matched.length, totalPages: Math.ceil(matched.length / filters.limit) },
    };
  },
  job(id: number, signal?: AbortSignal): Promise<JobWithCompany> {
    return api<JobWithCompany>(`/jobs/${id}`, { auth: false, signal });
  },
  /** Basic keyword search uses ONLY jobs returned by the real public API. */
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
