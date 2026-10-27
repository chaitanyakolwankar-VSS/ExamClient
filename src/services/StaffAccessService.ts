import axios from "axios";

/**
 * The staff letters site's own API client: no staff sign-in token and no sign-in redirect (it is for people who got
 * an emailed link). The session id lives in this tab's sessionStorage (gone when the tab closes) and goes out in the
 * X-Staff-Session header.
 */
const staffClient = axios.create({
  baseURL: import.meta.env.DEV ? "https://localhost:7225/api" : `${(import.meta.env.VITE_API_BASE || "/ExamAPI").replace(/\/+$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
});

const PREFIX = `${import.meta.env.BASE_URL}:staffletters:`;
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

export const staffStore = {
  token: () => read("link"),
  setToken: (t: string) => write("link", t),
  session: () => read("session"),
  setSession: (s: string | null) => write("session", s),
  clear: () => {
    write("link", null);
    write("session", null);
  },
};

staffClient.interceptors.request.use((config) => {
  const session = staffStore.session();
  if (session) config.headers["X-Staff-Session"] = session;
  return config;
});

/** POST open: the same fields as the student link (extra ones the API adds are ignored). */
export interface StaffLinkInfo {
  state: "ready" | "closed" | "invalid";
  message: string;
  college: string | null;
  firstName: string | null;
  maskedEmail: string | null;
  deadline: string | null;
  helpEmail: string | null;
  /** Sent by the API when it has them; the page works without. */
  examTitle?: string | null;
  updatedAt?: string | null;
}

export interface StaffCodeSent {
  sentNow: boolean;
  maskedEmail: string;
  validMinutes: number;
  message: string;
}

/** What is printed on the letters, and what the person may change. */
export interface StaffDetails {
  title: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  departmentId: string | null;
  designationId: string | null;
  isExternal: boolean;
  externalCollege: string | null;
  externalCity: string | null;
}

export interface StaffNamed {
  id: string;
  name: string;
}

export type StaffLetterKind = "Supervision" | "Examiner" | "Moderator";

export interface StaffSiteLetter {
  letterId: string;
  letterNo: string;
  letterDate: string;
  kind: StaffLetterKind;
  /** "Supervision duty — Junior Supervisor, 5 dates" or "Examiner — CSC601 System Programming". */
  title: string;
  examTitle: string;
  /** True for the exam this link was sent for; the others are earlier letters. */
  current: boolean;
}

/** GET me, and the answer to POST details. */
export interface StaffHome {
  firstName: string;
  maskedEmail: string;
  examTitle: string;
  collegeName: string;
  needsDetails: boolean;
  details: StaffDetails;
  options: { titles: string[]; departments: StaffNamed[]; designations: StaffNamed[] };
  letters: StaffSiteLetter[];
}

/** The API's sentence from an axios error, else the fallback. */
export const staffReason = (err: unknown, fallback: string): string => {
  const e = err as { response?: { status?: number; data?: unknown } };
  if (e?.response?.status === 429) return "Too many attempts. Wait a few minutes and try again.";
  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (data as { message?: string } | undefined)?.message || fallback;
};

/** api/StaffAccess. */
export const StaffAccessService = {
  async open(token: string): Promise<StaffLinkInfo> {
    return (await staffClient.post<StaffLinkInfo>("/StaffAccess/open", { token })).data;
  },
  async sendCode(token: string): Promise<StaffCodeSent> {
    return (await staffClient.post<StaffCodeSent>("/StaffAccess/code", { token })).data;
  },
  async verify(token: string, code: string): Promise<{ sessionToken: string; expiresAt: string }> {
    return (await staffClient.post<{ sessionToken: string; expiresAt: string }>("/StaffAccess/verify", { token, code })).data;
  },
  async me(): Promise<StaffHome> {
    return (await staffClient.get<StaffHome>("/StaffAccess/me")).data;
  },
  async signOut(): Promise<void> {
    await staffClient.post("/StaffAccess/signout");
  },
  /** Saves the details printed on the letters; answers like `me`. */
  async saveDetails(details: StaffDetails): Promise<StaffHome> {
    return (await staffClient.post<StaffHome>("/StaffAccess/details", details)).data;
  },
  /** One of the person's own letters as a PDF (the session header can't go on a plain link, so it comes as a blob). */
  async letterPdf(letterId: string): Promise<Blob> {
    return (await staffClient.get<Blob>(`/StaffAccess/letters/${letterId}/pdf`, { responseType: "blob" })).data;
  },
};

/**
 * The text of an API error whose body arrived as a blob (a failed PDF download): the sentence in its JSON
 * {message}, else the fallback.
 */
export const staffBlobReason = async (err: unknown, fallback: string): Promise<string> => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text()) as { message?: string };
      if (body?.message) return body.message;
    } catch {
      /* not JSON: use the fallback */
    }
    return fallback;
  }
  return staffReason(err, fallback);
};
