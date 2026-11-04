import type { AiApplicant, AiParsedResume, AiCvInfo, AiSearchHit } from "../types/ai.types";

export const matchLabels = {
  suitable: "Phù hợp cao",
  review: "Cần xem xét",
  unsuitable: "Ít phù hợp",
};
export function scorePercent(score: number | null | undefined): number | null {
  return typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 1
    ? Math.round(score * 100) : null;
}
export function parsedInfo(result: AiParsedResume | null): AiCvInfo | null {
  return result?.status === "done" && result.data && "skills" in result.data ? result.data : null;
}
export function levelGapText(gap: number | null | undefined): string {
  if (gap == null || !Number.isInteger(gap)) return "Chưa xác định chênh lệch cấp bậc";
  if (gap === 0) return "CV và vị trí cùng cấp bậc";
  return gap > 0 ? `Vị trí yêu cầu cao hơn CV ${gap} bậc` : `CV cao hơn yêu cầu ${Math.abs(gap)} bậc`;
}
export function sortApplicants(items: AiApplicant[], direction: "asc" | "desc" = "desc"): AiApplicant[] {
  return [...items].sort((a, b) => {
    const aScored = a.ai.status === "scored" && scorePercent(a.ai.score) !== null;
    const bScored = b.ai.status === "scored" && scorePercent(b.ai.score) !== null;
    if (aScored !== bScored) return aScored ? -1 : 1;
    return aScored && bScored ? ((a.ai.score ?? 0) - (b.ai.score ?? 0)) * (direction === "desc" ? -1 : 1) : 0;
  });
}
export function orderSearchResults<T extends { id: number }>(hits: AiSearchHit[], jobs: T[]): T[] {
  const byId = new Map(jobs.map((job) => [job.id, job]));
  return [...new Set(hits.map((hit) => hit.id))].flatMap((id) => {
    const job = byId.get(id);
    return job ? [job] : [];
  });
}
export function aiErrorText(error: unknown): string {
  const record = error && typeof error === "object" ? error as { status?: number; message?: string } : {};
  const message = typeof record.message === "string" ? record.message : "Không thể tải kết quả AI. Vui lòng thử lại.";
  if (record.status === 404 && /Cannot (GET|POST)/i.test(message))
    return "Tính năng AI chưa được bật trên máy chủ. Bạn vẫn có thể sử dụng các chức năng tuyển dụng thông thường.";
  if (record.status === 401) return "Vui lòng đăng nhập lại để sử dụng chức năng AI này.";
  if (record.status === 403) return "Bạn không có quyền xem hoặc xử lý dữ liệu AI này.";
  return message;
}
