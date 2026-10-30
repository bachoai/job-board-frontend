import { api } from "../../../lib/api";
import type { Job } from "../../employer/types";
export const jobsApi = {
  jobs: (signal?: AbortSignal) => api<Job[]>("/jobs", { signal }),
  blockJob: (id: number) => api<Job>(`/jobs/${id}/block`, { method: "PATCH" }),
  deleteJob: (id: number) => api(`/jobs/${id}`, { method: "DELETE" }),
};
