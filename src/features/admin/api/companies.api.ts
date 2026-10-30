import { api } from "../../../lib/api";
import type { Company } from "../../employer/types";
export const companiesApi = {
  companies: (signal?: AbortSignal) => api<Company[]>("/companies", { signal }),
  deleteCompany: (id: number) => api(`/companies/${id}`, { method: "DELETE" }),
};
