import { api, ApiError } from "../../../lib/api";
import type { Company, CompanyInput } from "../types";
export const companiesApi = {
  async companies(ownerId: number, signal?: AbortSignal) {
    try {
      return (
        await api<{ data: Company[] }>(`/companies/owner/${ownerId}`, {
          signal,
        })
      ).data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return [];
      throw error;
    }
  },
  createCompany: (body: CompanyInput) =>
    api<Company>("/companies", { method: "POST", body: JSON.stringify(body) }),
  updateCompany: (id: number, body: CompanyInput) =>
    api<Company>(`/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
