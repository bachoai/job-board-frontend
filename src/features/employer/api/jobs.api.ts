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
  // AI2 exposes GET /jobs with Bearer authentication, but no /jobs/mine.
  async myJobs(ownerId: number, signal?: AbortSignal): Promise<Job[]> {
    const jobs = await api<Job[]>("/jobs", { signal });
    return jobs.filter(job => job.createdBy === ownerId);
  },
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
