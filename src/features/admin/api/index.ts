import { usersApi } from "./users.api";
import { jobsApi } from "./jobs.api";
import { companiesApi } from "./companies.api";
export const adminApi = { ...usersApi, ...jobsApi, ...companiesApi };
