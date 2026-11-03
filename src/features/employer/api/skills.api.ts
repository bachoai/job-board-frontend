import { api } from "../../../lib/api";
import type { Skill } from "../types";

export const skillsApi = {
  skills: (signal?: AbortSignal) => api<Skill[]>("/skills", { signal }),
};
