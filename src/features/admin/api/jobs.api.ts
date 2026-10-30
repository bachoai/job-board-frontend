import { api } from "../../../lib/api";
import { getAllJobs } from "../../../lib/job-list";
import type { Job } from "../../employer/types";
export const jobsApi = {
  jobs: (signal?: AbortSignal) => getAllJobs(signal),
  blockJob: (id: number) => api<Job>(`/jobs/${id}/block`, { method: "PATCH" }),
  deleteJob: (id: number) => api(`/jobs/${id}`, { method: "DELETE" }),
};
