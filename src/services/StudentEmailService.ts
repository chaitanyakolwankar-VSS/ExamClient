import apiClient from "../api/Client";

/** What the review shows for a student's email. */
export type EmailState = "Missing" | "Flagged" | "Unchecked" | "Verified";

export interface StudentEmailRow {
  studentId: string;
  name: string;
  branch: string;
  semesterId: string | null;
  email: string | null;
  status: EmailState;
  reason: string | null;
  isActive: boolean;
}

export interface StudentEmailList {
  missing: number;
  flagged: number;
  unchecked: number;
  verified: number;
  rows: StudentEmailRow[];
}

/** "attention" = missing + flagged. */
export type EmailShow = "attention" | "unchecked" | "verified" | "all";

export interface EmailSettings {
  allowedEmailDomains: string | null;
  examOfficeEmail: string | null;
  dailyEmailLimit: number;
}

/** Student Master > Check emails (api/StudentEmails). */
export const StudentEmailService = {
  async list(p: { ayid: string; courseId?: string; semesterId?: string; show: EmailShow }): Promise<StudentEmailList> {
    const res = await apiClient.get<StudentEmailList>("/StudentEmails", {
      params: { AYID: p.ayid, CourseId: p.courseId || undefined, SemesterId: p.semesterId || undefined, Show: p.show },
    });
    return res.data;
  },
  /** Sets the email; verify also marks it checked by staff. */
  async update(studentId: string, email: string, verify: boolean): Promise<StudentEmailRow> {
    const res = await apiClient.put<StudentEmailRow>(`/StudentEmails/${encodeURIComponent(studentId)}`, { email, verify });
    return res.data;
  },
  /** Marks these students' emails verified; answers how many changed. */
  async verify(studentIds: string[]): Promise<number> {
    const res = await apiClient.post<{ verified: number }>("/StudentEmails/verify", { studentIds });
    return res.data.verified;
  },
  async getSettings(): Promise<EmailSettings> {
    const res = await apiClient.get<EmailSettings>("/StudentEmails/settings");
    return res.data;
  },
  /** College admin only. Answers how many unverified emails are flagged after the re-check. */
  async saveSettings(s: EmailSettings): Promise<number> {
    const res = await apiClient.put<{ flagged: number }>("/StudentEmails/settings", s);
    return res.data.flagged;
  },
};
