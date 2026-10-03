import axios from "axios";
import apiClient from "../api/Client";

// Platform (developer) console API: api/Platform/*. Every endpoint needs the platform-admin login.

export interface PlatformCollegeListItem {
  collegeId: string;
  name: string;
  collegeCode: string;
  adminCount: number;
  branchCount: number;
  currentAcademicYear: string | null;
  hasLogo: boolean;
  hasBanner: boolean;
}

export interface PlatformBranch {
  courseId: string;
  name: string;
  courseCode: string;
}

export interface PlatformPattern {
  patternId: string;
  patternName: string;
}

export interface PlatformAcademicYear {
  ayid: string;
  fullDuration: string;
  shortDuration: string | null;
  isCurrent: boolean;
}

export interface PlatformAdmin {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface PlatformCollegeDetail {
  collegeId: string;
  name: string;
  collegeCode: string;
  collegeCenter: string;
  address: string | null;
  contactEmail: string;
  contactPhone: string;
  hasLogo: boolean;
  hasBanner: boolean;
  branches: PlatformBranch[];
  patterns: PlatformPattern[];
  academicYears: PlatformAcademicYear[];
  admins: PlatformAdmin[];
  gradeScaleCount: number;
  ruleSetCount: number;
}

export interface AdminInput {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface BranchInput {
  name: string;
  code: string;
}

export interface ProvisionCollegeInput {
  name: string;
  collegeCode: string;
  collegeCenter: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  logo?: File | null;
  banner?: File | null;
  academicYear: { fullDuration: string; shortDuration: string; isCurrent: boolean };
  branches: BranchInput[];
  patterns: string[];
  templateCollegeId?: string;
  admins: AdminInput[];
}

export interface ProvisionSummary {
  collegeId: string;
  name: string;
  collegeCode: string;
  alreadyExisted: boolean;
  templateCollegeId: string | null;
  items: { item: string; created: number; alreadyPresent: number }[];
  admins: { userId: string; username: string; email: string; status: string }[];
  warnings: string[];
}

/** The API answers validation / rule errors with 400 { message }; this pulls the text out. */
export const platformErrorMessage = (err: unknown, fallback = "Something went wrong. Please try again."): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; title?: string } | undefined;
    if (data?.message) return data.message;
    if (err.response?.status === 403) return "Only the platform administrator can do this.";
    if (err.response?.status === 413) return "The upload is too large.";
    if (data?.title) return data.title;
  }
  return fallback;
};

const buildProvisionForm = (p: ProvisionCollegeInput): FormData => {
  const f = new FormData();
  f.append("Name", p.name);
  f.append("CollegeCode", p.collegeCode);
  f.append("CollegeCenter", p.collegeCenter);
  f.append("Address", p.address);
  f.append("ContactEmail", p.contactEmail);
  f.append("ContactPhone", p.contactPhone);
  if (p.logo) f.append("Logo", p.logo);
  if (p.banner) f.append("Banner", p.banner);

  f.append("AcademicYear.FullDuration", p.academicYear.fullDuration);
  f.append("AcademicYear.ShortDuration", p.academicYear.shortDuration);
  f.append("AcademicYear.IsCurrent", String(p.academicYear.isCurrent));

  p.branches.forEach((b, i) => {
    f.append(`Branches[${i}].Name`, b.name);
    f.append(`Branches[${i}].Code`, b.code);
  });
  p.patterns.forEach((name, i) => f.append(`Patterns[${i}]`, name));
  if (p.templateCollegeId) f.append("TemplateCollegeId", p.templateCollegeId);

  p.admins.forEach((a, i) => {
    f.append(`Admins[${i}].Username`, a.username);
    f.append(`Admins[${i}].Email`, a.email);
    f.append(`Admins[${i}].FirstName`, a.firstName);
    f.append(`Admins[${i}].LastName`, a.lastName);
    f.append(`Admins[${i}].Password`, a.password);
  });
  return f;
};

export const platformService = {
  async getColleges(): Promise<PlatformCollegeListItem[]> {
    const res = await apiClient.get<PlatformCollegeListItem[]>("/Platform/colleges");
    return res.data;
  },

  async getCollege(id: string): Promise<PlatformCollegeDetail> {
    const res = await apiClient.get<PlatformCollegeDetail>(`/Platform/colleges/${id}`);
    return res.data;
  },

  async provisionCollege(payload: ProvisionCollegeInput): Promise<ProvisionSummary> {
    const res = await apiClient.post<ProvisionSummary>("/Platform/colleges", buildProvisionForm(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async addAdmin(collegeId: string, admin: AdminInput): Promise<PlatformAdmin> {
    const res = await apiClient.post<PlatformAdmin>(`/Platform/colleges/${collegeId}/admins`, admin);
    return res.data;
  },

  async removeAdmin(collegeId: string, userId: string): Promise<void> {
    await apiClient.delete(`/Platform/colleges/${collegeId}/admins/${userId}`);
  },

  async addBranch(collegeId: string, branch: BranchInput): Promise<PlatformBranch> {
    const res = await apiClient.post<PlatformBranch>(`/Platform/colleges/${collegeId}/branches`, branch);
    return res.data;
  },

  async addAcademicYear(
    collegeId: string,
    year: { fullDuration: string; shortDuration: string; setCurrent: boolean },
  ): Promise<PlatformAcademicYear> {
    const res = await apiClient.post<PlatformAcademicYear>(`/Platform/colleges/${collegeId}/academic-years`, year);
    return res.data;
  },

  async setCurrentAcademicYear(collegeId: string, ayid: string): Promise<PlatformAcademicYear> {
    const res = await apiClient.put<PlatformAcademicYear>(
      `/Platform/colleges/${collegeId}/academic-years/${ayid}/current`,
    );
    return res.data;
  },
};
