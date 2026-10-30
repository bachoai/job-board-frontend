import type { ReactNode } from "react";
export function FormInput({
  name,
  label,
  error,
  children,
  hint,
}: {
  name: string;
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children}
      {error ? (
        <span id={`${name}-error`} className="field-error" role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${name}-hint`} className="hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
