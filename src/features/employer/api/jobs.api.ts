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
  async myJobs(ownerId: number, signal?: AbortSignal) {
    // Backend does not yet have GET /jobs/mine. Authenticated employers see every status.
    return (await api<Job[]>("/jobs", { signal })).filter(
      (job) => job.createdBy === ownerId,
    );
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
