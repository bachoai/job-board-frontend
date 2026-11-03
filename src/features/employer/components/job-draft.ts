import { emptyForm } from "./job-form";
import type { JobForm } from "./job-form";

const key = (userId: number) => `jobboard.new-job.${userId}`;

export function loadDraft(userId: number): JobForm {
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem(key(userId)) || "null",
    );
    if (!saved || typeof saved !== "object") return { ...emptyForm };
    const { skillIds: _, ...textFields } = emptyForm;
    const ids = "skillIds" in saved ? saved.skillIds : [];
    return {
      ...Object.fromEntries(
        Object.entries(textFields).map(([name, fallback]) => [
          name,
          name in saved && typeof saved[name as keyof typeof saved] === "string"
            ? saved[name as keyof typeof saved]
            : fallback,
        ]),
      ),
      skillIds: Array.isArray(ids)
        ? [...new Set(ids.filter((id): id is number => Number.isSafeInteger(id) && id > 0))]
        : [],
    } as JobForm;
  } catch {
    return { ...emptyForm };
  }
}

export function saveDraft(userId: number, form: JobForm) {
  try {
    sessionStorage.setItem(key(userId), JSON.stringify(form));
  } catch {
    /* Storage can be unavailable. */
  }
}

export function clearDraft(userId: number) {
  try {
    sessionStorage.removeItem(key(userId));
  } catch {
    /* Storage can be unavailable. */
  }
}
