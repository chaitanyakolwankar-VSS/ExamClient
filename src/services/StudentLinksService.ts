import apiClient from "../api/Client";

/** Student Master fields a details link can let the student change (the API's StudentFields). */
export type StudentField =
  | "firstName"
  | "middleName"
  | "lastName"
  | "motherName"
  | "dateOfBirth"
  | "gender"
  | "category"
  | "phone"
  | "address"
  | "prn"
  | "photo"
  | "signature";

export const FIELD_GROUPS: { title: string; fields: { key: StudentField; label: string }[] }[] = [
  {
    title: "Personal",
    fields: [
      { key: "firstName", label: "First name" },
      { key: "middleName", label: "Middle name" },
      { key: "lastName", label: "Last name" },
      { key: "motherName", label: "Mother's name" },
      { key: "dateOfBirth", label: "Date of birth" },
      { key: "gender", label: "Gender" },
      { key: "category", label: "Category" },
    ],
  },
  { title: "Contact", fields: [{ key: "phone", label: "Phone" }, { key: "address", label: "Address" }] },
  { title: "Photo and signature", fields: [{ key: "photo", label: "Photo" }, { key: "signature", label: "Signature" }] },
  { title: "Registration", fields: [{ key: "prn", label: "ERN / PRN" }] },
];

export const ALL_FIELDS: StudentField[] = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

export const FIELD_LABEL: Record<StudentField, string> = Object.fromEntries(
  FIELD_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.label])),
) as Record<StudentField, string>;

export type LinkState = "Queued" | "Sent" | "EmailFailed" | "Opened" | "Updated" | "Closed" | "Stopped";

export interface LinkRow {
  id: string;
  studentId: string;
  name: string;
  email: string | null;
  state: LinkState;
  note: string | null;
  /** What the student changed last, e.g. "Phone: '' -> '9876543210'". */
  changes: string | null;
  sentAt: string | null;
  openedAt: string | null;
  updatedAt: string | null;
  expiresAt: string;
}

export interface LinkBatch {
  id: string;
  title: string;
  taskType: string;
  deadline: string | null;
  createdAt: string;
  isOpen: boolean;
  editableFields: StudentField[];
  total: number;
  updated: number;
  opened: number;
  notOpened: number;
  failed: number;
  stopped: number;
}

export interface LinkBatchDetail extends LinkBatch {
  links: LinkRow[];
}

export interface SendLinksResult {
  batchId: string;
  queued: number;
  noEmail: number;
  flagged: number;
  inactive: number;
  replaced: number;
  goTomorrow: number;
  message: string;
}

/** The student site as this browser sees it; the API only accepts an address it already trusts. */
const appUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/+$/, "");

/** Student Master > Student links (api/StudentLinks). */
export const StudentLinksService = {
  /** student: one student by Student ID or email (branch and semester are then ignored); empty = the whole class. */
  async send(p: { ayid: string; courseId?: string; semesterId?: string; days: number; editableFields: StudentField[]; student?: string }): Promise<SendLinksResult> {
    const res = await apiClient.post<SendLinksResult>("/StudentLinks/send", {
      ayid: p.ayid,
      courseId: p.courseId || null,
      semesterId: p.semesterId || null,
      taskType: "STUDENT_MASTER",
      days: p.days,
      editableFields: p.editableFields,
      student: p.student?.trim() || null,
      appUrl: appUrl(),
    });
    return res.data;
  },
  async batches(p: { ayid: string; courseId?: string; semesterId?: string }): Promise<LinkBatch[]> {
    const res = await apiClient.get<LinkBatch[]>("/StudentLinks/batches", {
      params: { AYID: p.ayid, CourseId: p.courseId || undefined, SemesterId: p.semesterId || undefined },
    });
    return res.data;
  },
  async batch(id: string): Promise<LinkBatchDetail> {
    return (await apiClient.get<LinkBatchDetail>(`/StudentLinks/batches/${id}`)).data;
  },
  /** date: "yyyy-mm-dd", the last day the links work. */
  async setDeadline(id: string, date: string): Promise<LinkBatchDetail> {
    return (await apiClient.post<LinkBatchDetail>(`/StudentLinks/batches/${id}/deadline`, { date })).data;
  },
  async stopBatch(id: string): Promise<number> {
    return (await apiClient.post<{ stopped: number }>(`/StudentLinks/batches/${id}/stop`)).data.stopped;
  },
  /** Emails the link again: who="notOpened" (default) or "notUpdated" (everyone who hasn't saved yet). */
  async remind(id: string, who: "notOpened" | "notUpdated" = "notOpened"): Promise<number> {
    return (await apiClient.post<{ reminded: number }>(`/StudentLinks/batches/${id}/remind`, null, { params: { who } })).data.reminded;
  },
  async stopLink(id: string): Promise<LinkRow> {
    return (await apiClient.post<LinkRow>(`/StudentLinks/links/${id}/stop`)).data;
  },
  async resend(id: string): Promise<LinkRow> {
    return (await apiClient.post<LinkRow>(`/StudentLinks/links/${id}/resend`)).data;
  },
};
