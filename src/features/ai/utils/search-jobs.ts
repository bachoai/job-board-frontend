import type { AiSearchHit } from "../types/ai.types";
import type { JobCardData } from "../../public/pages/JobCard";
import { isOpenJob } from "../../public/utils/open-job";

export function searchCard(hit: AiSearchHit): JobCardData | null {
  if (!["companyName", "jobType", "salaryMin", "salaryMax", "deadline"].every(key => Object.hasOwn(hit, key))) return null;
  return { id: hit.id, title: hit.title, level: hit.level, province: hit.province, location: hit.location,
    company: hit.companyName ? { name: hit.companyName } : undefined, jobType: hit.jobType || "Chưa cập nhật",
    salaryMin: hit.salaryMin ?? null, salaryMax: hit.salaryMax ?? null, deadline: hit.deadline ?? null };
}
export async function resolveSearchJobs(hits: AiSearchHit[], load: (id: number, signal: AbortSignal) => Promise<JobCardData & { status: string }>, signal: AbortSignal) {
  const unique = [...new Map(hits.map(hit => [hit.id, hit])).values()];
  const jobs: JobCardData[] = [];
  for (let start = 0; start < unique.length; start += 4) {
    signal.throwIfAborted();
    const batch = await Promise.all(unique.slice(start, start + 4).map(async hit => {
      const card = searchCard(hit);
      if (card) return isOpenJob({ status: "open", deadline: card.deadline }) ? card : null;
      try { const job = await load(hit.id, signal); return isOpenJob(job) ? job : null; }
      catch (error) { if ((error as { status?: number }).status === 404) return null; throw error; }
    }));
    jobs.push(...batch.filter((job): job is JobCardData => job !== null));
  }
  return jobs;
}
