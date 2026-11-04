import type { AiMatchLabel, AiScoreStatus } from "../types/ai.types";
import { matchLabels } from "../utils/ai";

export function AiScoreBadge({ status = "scored", label }: { status?: AiScoreStatus; label?: AiMatchLabel | null }) {
  const text = status === "pending" ? "Đang chờ đánh giá" : status === "unscored" ? "Chưa chấm được"
    : label && Object.hasOwn(matchLabels, label) ? matchLabels[label] : "Chưa có nhãn";
  const tone = status === "scored" && label && Object.hasOwn(matchLabels, label) ? label : "neutral";
  return <span className={`ai-score-badge ai-tone-${tone}`}>{text}</span>;
}
