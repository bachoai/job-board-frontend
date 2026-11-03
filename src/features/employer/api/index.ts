import { companiesApi } from "./companies.api";
import { jobsApi } from "./jobs.api";
import { applicationsApi } from "./applications.api";
import { skillsApi } from "./skills.api";
export const employerApi = { ...companiesApi, ...jobsApi, ...applicationsApi, ...skillsApi };
