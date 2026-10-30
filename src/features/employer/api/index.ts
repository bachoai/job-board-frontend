import { companiesApi } from "./companies.api";
import { jobsApi } from "./jobs.api";
import { applicationsApi } from "./applications.api";
export const employerApi = { ...companiesApi, ...jobsApi, ...applicationsApi };
