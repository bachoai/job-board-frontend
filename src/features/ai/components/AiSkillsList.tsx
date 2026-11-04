export function AiSkillsList({ title, skills, tone = "neutral" }: { title: string; skills?: string[] | null; tone?: "neutral" | "matched" | "missing" }) {
  const values = [...new Set((skills || []).filter(Boolean))];
  return <div className={`ai-skills ai-skills-${tone}`}><h3>{title}</h3>
    {values.length ? <ul>{values.map((skill) => <li key={skill}>{skill}</li>)}</ul> : <p className="hint">Chưa có thông tin</p>}
  </div>;
}
