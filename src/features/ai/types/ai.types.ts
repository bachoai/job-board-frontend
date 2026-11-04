export type AiSearchMode = "like" | "fts" | "vector" | "hybrid";
export type AiMatchLabel = "suitable" | "review" | "unsuitable";
export type AiScoreStatus = "pending" | "scored" | "unscored";
export interface AiSearchHit {
  id: number;
  title: string;
  level: string | null;
  province: string | null;
  location: string | null;
  score: number;
}
export interface AiSearchResult {
  mode: AiSearchMode;
  query: string;
  count: number;
  items: AiSearchHit[];
}
export interface AiCvInfo {
  skills: string[];
  mentionedSkills: string[];
  years: number | null;
  level: "intern" | "junior" | "middle" | "senior" | null;
  province: string | null;
  desiredTitle: string | null;
}
export interface AiParsedResume {
  resumeId: number;
  status: "pending" | "done" | "error";
  parsedAt: string | null;
  data: AiCvInfo | { error: string } | null;
}
export interface AiProcessResult {
  resumeId: number;
  info: AiCvInfo;
  textLength: number;
}
export interface AiJobMatch {
  jobId: number;
  title: string;
  company: string | null;
  province: string | null;
  level: string | null;
  score: number;
  label: AiMatchLabel;
  cosine: number;
  skillRatio: number;
  matchedSkills: string[];
  missingSkills: string[];
  levelGap: number | null;
}
export interface AiResumeMatches {
  resumeId: number;
  items: AiJobMatch[];
}
export interface AiEvaluation {
  status: AiScoreStatus;
  score?: number | null;
  label?: AiMatchLabel | null;
  cosine?: number | null;
  skillRatio?: number | null;
  levelGap?: number | null;
  matchedSkills?: string[] | null;
  missingSkills?: string[] | null;
  reason?: string | null;
  scoredAt?: string | null;
}
export interface AiApplicant {
  applicationId: number;
  candidateId: number;
  candidateName: string;
  resumeId: number | null;
  applicationStatus: string;
  appliedAt: string;
  ai: AiEvaluation;
}
export interface AiRankedApplicants {
  jobId: number;
  count: number;
  items: AiApplicant[];
}
export interface AiRescoreResult {
  applicationId: number;
  status: "scored" | "unscored";
  score: number | null;
  label: AiMatchLabel | null;
  reason: string | null;
}
