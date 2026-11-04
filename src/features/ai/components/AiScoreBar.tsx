import { scorePercent } from "../utils/ai";

export function AiScoreBar({ score, label = "Điểm phù hợp" }: { score?: number | null; label?: string }) {
  const percent = scorePercent(score);
  if (percent === null) return <span className="hint">Chưa có điểm</span>;
  return <div className="ai-score-bar"><div><span>{label}</span><strong>{percent}%</strong></div>
    <div className="ai-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <span style={{ width: `${percent}%` }}/>
    </div>
  </div>;
}
