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
};
