import { api } from "../../../lib/api";
import type { Application, ApplicationHistory, Resume } from "../types";
import { jobsApi } from "./jobs.api";
export const applicationsApi = {
  applications: (jobId: number, signal?: AbortSignal) =>
    api<Application[]>(`/applications?jobId=${jobId}`, { signal }),
  application: (id: number, signal?: AbortSignal) =>
    api<Application>(`/applications/${id}`, { signal }),
  history: (id: number, signal?: AbortSignal) =>
    api<ApplicationHistory[]>(`/applications/${id}/history`, { signal }),
  updateStatus: (id: number, status: string, note: string) =>
    api<Application>(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    }),
  resume: (id: number, signal?: AbortSignal) =>
    api<Resume>(`/resumes/${id}`, { signal }),
  async allApplications(ownerId: number, signal: AbortSignal) {
    const jobs = await jobsApi.myJobs(ownerId, signal);
    const batches = [];
    for (let start = 0; start < jobs.length; start += 4) {
      signal.throwIfAborted();
      batches.push(
        ...(await Promise.all(
          jobs
            .slice(start, start + 4)
            .map(async (job) => ({
              job,
              applications: await api<Application[]>(
                `/applications?jobId=${job.id}`,
                { signal },
              ),
            })),
        )),
      );
    }
    return {
      jobs,
      rows: batches
        .flatMap(({ job, applications }) =>
          applications.map((application) => ({
            ...application,
            jobTitle: job.title,
          })),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  },
};
