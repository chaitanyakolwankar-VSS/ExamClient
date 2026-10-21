import axios from "axios";
import type { StudentField } from "./StudentLinksService";

/**
 * The student site's own API client: no staff token and no staff sign-in redirect. The student session id lives in
 * this tab's sessionStorage (gone when the tab closes) and goes out in the X-Student-Session header.
 */
const studentClient = axios.create({
  baseURL: import.meta.env.DEV ? "https://localhost:7225/api" : `${(import.meta.env.VITE_API_BASE || "/ExamAPI").replace(/\/+$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
});

const PREFIX = `${import.meta.env.BASE_URL}:student:`;
const read = (key: string) => {
  try {
    return sessionStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) sessionStorage.removeItem(PREFIX + key);
    else sessionStorage.setItem(PREFIX + key, value);
  } catch {
    /* private mode: the page still works until it is reloaded */
  }
};

export const studentStore = {
  token: () => read("link"),
  setToken: (t: string) => write("link", t),
  session: () => read("session"),
  setSession: (s: string | null) => write("session", s),
  clear: () => {
    write("link", null);
    write("session", null);
  },
};

studentClient.interceptors.request.use((config) => {
  const session = studentStore.session();
  if (session) config.headers["X-Student-Session"] = session;
  return config;
});

export interface LinkInfo {
  state: "ready" | "closed" | "invalid";
  message: string;
  college: string | null;
  taskType: string | null;
  taskName: string | null;
  firstName: string | null;
  maskedEmail: string | null;
  deadline: string | null;
  updatedAt: string | null;
  helpEmail: string | null;
}

export interface CodeSent {
  sentNow: boolean;
  maskedEmail: string;
  validMinutes: number;
  message: string;
}

export interface StudentDetails {
  studentId: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  motherName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  category: string | null;
  phone: string | null;
  address: string | null;
  prn: string | null;
  abcId: string | null;
  email: string | null;
  hasPhoto: boolean;
  hasSignature: boolean;
}

export interface StudentHome {
  college: string;
  taskType: string;
  taskName: string;
  deadline: string;
  updatedAt: string | null;
  editableFields: StudentField[];
  helpEmail: string | null;
  student: StudentDetails;
}

/** The API's sentence from an axios error, else the fallback. */
export const studentReason = (err: unknown, fallback: string): string => {
  const e = err as { response?: { status?: number; data?: unknown } };
  if (e?.response?.status === 429) return "Too many attempts. Wait a few minutes and try again.";
  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (data as { message?: string } | undefined)?.message || fallback;
};

/** api/StudentAccess. */
export const StudentAccessService = {
  async open(token: string): Promise<LinkInfo> {
    return (await studentClient.post<LinkInfo>("/StudentAccess/open", { token })).data;
  },
  async sendCode(token: string): Promise<CodeSent> {
    return (await studentClient.post<CodeSent>("/StudentAccess/code", { token })).data;
  },
  async verify(token: string, code: string): Promise<{ sessionToken: string; expiresAt: string }> {
    return (await studentClient.post<{ sessionToken: string; expiresAt: string }>("/StudentAccess/verify", { token, code })).data;
  },
  async me(): Promise<StudentHome> {
    return (await studentClient.get<StudentHome>("/StudentAccess/me")).data;
  },
  async signOut(): Promise<void> {
    await studentClient.post("/StudentAccess/signout");
  },
  /** Only the fields this link allows are read by the API; the rest are ignored. */
  async saveDetails(update: StudentDetailsUpdate): Promise<StudentSaveResult> {
    return (await studentClient.put<StudentSaveResult>("/StudentAccess/details", update)).data;
  },
  /** image: a data URL (shrunk in the browser first). */
  async saveImage(kind: StudentImageKind, image: string): Promise<StudentSaveResult> {
    return (await studentClient.put<StudentSaveResult>(`/StudentAccess/${kind}`, { image })).data;
  },
  /** A hall ticket link: the hall ticket, or why it can't show yet. */
  async hallTicket(): Promise<StudentHallTicketView> {
    return (await studentClient.get<StudentHallTicketView>("/StudentAccess/hallticket")).data;
  },
  /** An object URL of the college's logo, a signature or the seal for the hall ticket, or null when there is none. */
  async hallTicketImage(kind: "logo" | "principal" | "controller" | "seal"): Promise<string | null> {
    try {
      const res = await studentClient.get(`/StudentAccess/hallticket/${kind}`, { responseType: "blob" });
      return URL.createObjectURL(res.data as Blob);
    } catch {
      return null;
    }
  },
  /** Tells staff the hall ticket was downloaded (only the first time counts). */
  async hallTicketDownloaded(): Promise<void> {
    await studentClient.post("/StudentAccess/hallticket/downloaded");
  },
  /** An object URL of the student's own picture (the header can't go on an <img>), or null when there is none. */
  async imageUrl(kind: StudentImageKind): Promise<string | null> {
    try {
      const res = await studentClient.get(`/StudentAccess/${kind}`, { responseType: "blob" });
      return URL.createObjectURL(res.data as Blob);
    } catch {
      return null;
    }
  },
};

export type StudentImageKind = "photo" | "signature";

/** api/StudentAccess/hallticket. */
export interface StudentHallTicketView {
  /** False while the hall ticket can't show yet; message says why. */
  ready: boolean;
  message: string | null;
  /** Pictures the student must add first. */
  missing: StudentImageKind[];
  examName: string;
  examType: string;
  branch: string;
  pattern: string;
  collegeName: string;
  center: string;
  hasLogo: boolean;
  hasPrincipalSign: boolean;
  hasControllerSign: boolean;
  hasSeal: boolean;
  student: {
    name: string;
    centre: string;
    seat: string;
    studentid: string;
    ern: string;
    abcId: string;
    subjects: { code: string; name: string; date: string; time: string }[];
  } | null;
}

export interface StudentDetailsUpdate {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  motherName?: string;
  /** yyyy-mm-dd, or null to clear. */
  dateOfBirth?: string | null;
  gender?: string;
  category?: string;
  phone?: string;
  address?: string;
  prn?: string;
  abcId?: string;
}

export interface StudentSaveResult {
  /** Labels of what changed ("Phone", "Photo"); empty when nothing was different. */
  changed: string[];
  home: StudentHome;
}
