import { api } from "./api";
import type { Job } from "../features/employer/types";

/** Compatible with current paginated GET /jobs and older unpaginated fixtures. */
export async function getAllJobs(signal?: AbortSignal): Promise<Job[]> {
  const jobs: Job[] = [];
  let page = 1;
  while (true) {
    signal?.throwIfAborted();
    const result = await api<Job[] | { items: Job[]; meta: { totalPages: number } }>(
      `/jobs?page=${page}&limit=100`, { signal },
    );
    if (Array.isArray(result)) return result;
    if (!Array.isArray(result?.items) || !result.meta ||
        !Number.isSafeInteger(result.meta.totalPages) || result.meta.totalPages < 0 ||
        (result.items.length > 0 && result.meta.totalPages < page))
      throw new Error("Dữ liệu tin tuyển dụng từ máy chủ không hợp lệ.");
    jobs.push(...result.items);
    if (page >= result.meta.totalPages || result.items.length === 0) return jobs;
    page++;
  }
}
