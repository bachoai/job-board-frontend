import { api } from "../../../lib/api";
import type { Job } from "../types";
import type { JobForm } from "../components/job-form";
import { jobPayload } from "../components/job-form";
export const jobsApi = {
  createJob: (form: JobForm) =>
    api<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(jobPayload(form)),
    }),
  // Backend gốc có GET /jobs/mine trả về tin của chính chủ tài khoản.
  // Không cần tải tất cả tin rồi lọc tại frontend.
  myJobs: (_ownerId: number, signal?: AbortSignal) =>
    api<Job[]>("/jobs/mine", { signal }),
  job: (id: number, signal?: AbortSignal) =>
    api<Job>(`/jobs/${id}`, { signal }),
  updateJob(id: number, form: JobForm, original: Job) {
    const { companyId: _, ...payload } = jobPayload(form);
    const body: Record<string, unknown> = {
      ...payload,
      currency: original.currency,
    };
    const clearable = [
      "description",
      "location",
      "province",
      "level",
      "salaryMin",
      "salaryMax",
      "deadline",
    ] as const;
    for (const name of clearable)
      if (form[name] === "" && original[name] !== null) body[name] = null;
    if (form.deadline === original.deadline) delete body.deadline;
    return api<Job>(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  closeJob: (id: number) =>
    api<Job>(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    }),
  deleteJob: (id: number) => api(`/jobs/${id}`, { method: "DELETE" }),
};
