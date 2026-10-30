export interface Company {
  id: number;
  ownerId: number;
  name: string;
  description: string | null;
  website: string | null;
  address: string | null;
  province: string | null;
  ward: string | null;
  logoPath: string | null;
  createdAt: string;
}
export interface Job {
  id: number;
  companyId: number;
  createdBy: number;
  title: string;
  description: string | null;
  location: string | null;
  province: string | null;
  jobType: string;
  level: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  deadline: string | null;
  status: "open" | "closed" | "blocked";
  createdAt: string;
}
export interface Application {
  id: number;
  jobId: number;
  candidateId: number;
  resumeId: number | null;
  coverLetter: string | null;
  status: "new" | "viewed" | "interview" | "rejected";
  createdAt: string;
  updatedAt: string;
}
export interface ApplicationHistory {
  id: number;
  applicationId: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: number | null;
  note: string | null;
  createdAt: string;
}
export interface Resume {
  id: number;
  userId: number;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
}
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: "candidate" | "employer" | "admin";
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}
export type CompanyInput = Pick<
  Company,
  "name" | "description" | "website" | "address" | "province" | "ward"
>;
