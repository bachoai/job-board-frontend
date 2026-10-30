import type { LucideIcon } from "lucide-react";
export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "violet" | "slate";
}) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>
        <span className="stat-dot" />
        {detail}
      </p>
    </div>
  );
}
