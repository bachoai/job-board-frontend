import { api, ApiError } from "../../../lib/api";
import { aiErrorText } from "../utils/ai";
import type {
  AiSearchMode, AiSearchResult, AiParsedResume, AiProcessResult,
  AiResumeMatches, AiRankedApplicants, AiRescoreResult,
} from "../types/ai.types";

async function aiRequest<T>(path: string, options?: Parameters<typeof api>[1]): Promise<T> {
  try { return await api<T>(path, options); }
  catch (error) {
    if (error instanceof ApiError) throw new ApiError(aiErrorText(error), error.status);
    throw error;
  }
}

export const aiApi = {
  searchJobs(query: string, mode: AiSearchMode = "hybrid", limit = 10, signal?: AbortSignal) {
    const params = new URLSearchParams({ q: query.trim(), mode, limit: String(limit) });
    return aiRequest<AiSearchResult>(`/ai/search?${params}`, {
      auth: false, signal, timeoutMs: mode === "hybrid" || mode === "vector" ? 90000 : undefined,
    });
  },
  getParsedResume: (id: number, signal?: AbortSignal) =>
    aiRequest<AiParsedResume>(`/ai/resumes/${id}/parsed`, { signal }),
  processResume: (id: number, signal?: AbortSignal) =>
    aiRequest<AiProcessResult>(`/ai/resumes/${id}/process`, { method: "POST", signal, timeoutMs: 120000 }),
  getResumeMatches: (id: number, limit = 10, signal?: AbortSignal) =>
    aiRequest<AiResumeMatches>(`/ai/resumes/${id}/matches?limit=${limit}`, { signal }),
  getRankedApplicants: (jobId: number, signal?: AbortSignal) =>
    aiRequest<AiRankedApplicants>(`/ai/jobs/${jobId}/applicants`, { signal }),
  rescoreApplication: (id: number, signal?: AbortSignal) =>
    aiRequest<AiRescoreResult>(`/ai/applications/${id}/score`, { method: "POST", signal, timeoutMs: 180000 }),
};
