import { api, apiBlob } from "../../../lib/api";
import type { Application, ApplicationHistory, Resume, User } from "../../employer/types";

export type CandidateResume = Resume & { isDefault: boolean; uploadedAt: string };
export type CandidateApplication = Application & {
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
};
export const candidateApi = {
  me: (signal?: AbortSignal) => api<User>("/users/me", { signal }),
  updateMe: (id: number, body: { fullName: string; phone: string | null }) =>
    api<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  resumes: (signal?: AbortSignal) => api<CandidateResume[]>("/resumes/users/me", { signal }),
  upload(file: File, isDefault: boolean) {
    const body = new FormData();
    body.append("file", file);
    body.append("isDefault", String(isDefault));
    return api<CandidateResume>("/resumes", { method: "POST", body });
  },
  setDefault: (id: number) => api<CandidateResume>(`/resumes/${id}`, { method: "PATCH", body: JSON.stringify({ isDefault: true }) }),
  removeResume: (id: number) => api(`/resumes/${id}`, { method: "DELETE" }),
  resumeFile: (id: number, signal?: AbortSignal) => apiBlob(`/resumes/${id}/file`, signal),
  apply: (jobId: number, resumeId: number, coverLetter: string) =>
    api<Application>("/applications", { method: "POST", body: JSON.stringify({ jobId, resumeId, coverLetter: coverLetter.trim() || undefined }) }),
  applications: (signal?: AbortSignal) => api<CandidateApplication[]>("/applications", { signal }),
  application: (id: number, signal?: AbortSignal) => api<CandidateApplication>(`/applications/${id}`, { signal }),
  history: (id: number, signal?: AbortSignal) => api<ApplicationHistory[]>(`/applications/${id}/history`, { signal }),
  withdraw: (id: number) => api(`/applications/${id}`, { method: "DELETE" }),
};
