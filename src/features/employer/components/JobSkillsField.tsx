import { useState } from "react";
import { Search, X } from "lucide-react";
import { ErrorMessage } from "../../../components/common/ErrorMessage";
import type { Skill } from "../types";

export function JobSkillsField({
  skills,
  selectedIds,
  selectedSkills = [],
  loading,
  loadError,
  error,
  onRetry,
  onChange,
}: {
  skills: Skill[];
  selectedIds: number[];
  selectedSkills?: Skill[];
  loading: boolean;
  loadError: string;
  error?: string;
  onRetry: () => void;
  onChange: (ids: number[]) => void;
}) {
  const [query, setQuery] = useState("");
  const matched = skills.filter((skill) =>
    skill.name.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")),
  );
  const names = new Map([...selectedSkills, ...skills].map((skill) => [skill.id, skill.name]));

  return (
    <fieldset
      id="skillIds"
      className="job-skills-field"
      tabIndex={-1}
      aria-invalid={!!error}
      aria-describedby={error ? "skillIds-error" : "skillIds-hint"}
    >
      <legend>Kỹ năng yêu cầu</legend>
      <p id="skillIds-hint" className="hint">
        Chọn các kỹ năng phù hợp với vị trí. Có thể chọn nhiều kỹ năng hoặc để trống.
      </p>
      {selectedIds.length > 0 && (
        <div className="job-skills-selected" aria-label="Kỹ năng đã chọn">
          {selectedIds.map((id) => {
            const name = names.get(id) || `Kỹ năng #${id}`;
            return (
              <button
                key={id}
                type="button"
                className="job-skill-chip"
                aria-label={`Bỏ kỹ năng ${names.get(id) || `#${id}`}`}
                onClick={() => onChange(selectedIds.filter((value) => value !== id))}
              >
                {name} <X size={13} aria-hidden="true" />
              </button>
            );
          })}
          <button type="button" className="text-button" onClick={() => onChange([])}>
            Bỏ chọn tất cả
          </button>
        </div>
      )}
      {loading ? (
        <p className="hint" role="status">Đang tải kỹ năng…</p>
      ) : loadError ? (
        <ErrorMessage message={`Không tải được danh sách kỹ năng. ${loadError}`} retry={onRetry} />
      ) : skills.length === 0 ? (
        <p className="hint">Chưa có kỹ năng trong danh sách. Bạn có thể đăng tin không kèm kỹ năng.</p>
      ) : (
        <>
          <label className="job-skill-search" htmlFor="job-skill-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Tìm kỹ năng</span>
            <input
              id="job-skill-search"
              type="search"
              placeholder="Tìm kỹ năng, ví dụ React, NestJS…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="job-skill-options">
            {matched.map((skill) => (
              <label key={skill.id} className="job-skill-option">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(skill.id)}
                  onChange={(event) => onChange(
                    event.target.checked
                      ? [...selectedIds, skill.id]
                      : selectedIds.filter((id) => id !== skill.id),
                  )}
                />
                <span>{skill.name}</span>
              </label>
            ))}
          </div>
          {matched.length === 0 && <p className="hint">Không tìm thấy kỹ năng phù hợp.</p>}
        </>
      )}
      <p className="hint job-skill-count">Đã chọn {selectedIds.length} kỹ năng</p>
      {error && <p id="skillIds-error" className="field-error" role="alert">{error}</p>}
    </fieldset>
  );
}
