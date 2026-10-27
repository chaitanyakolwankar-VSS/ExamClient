import apiClient from "../api/Client";

/** One exam (all branches together) that has a timetable: the thing a letter is for. */
export interface ExamGroup {
  /** The exam's own id (the earliest saved copy); whichever copy is sent, letters keep this one. */
  examId: string;
  name: string;
  examType: string;
  /** "{name} {type}" as the letters print it. */
  title: string;
  /** "First Half", "Second Half" or "" when the papers mix both. */
  half: string;
  branchCount: number;
  slotCount: number;
  letterCount: number;
  /** Live examiner and moderator letters. */
  appointmentCount: number;
}

/** One date and time of the exam on which staff can be on duty. */
export interface SupervisionSlot {
  date: string;
  time: string;
  papers: number;
  branches: string[];
}

export interface LetterDuty {
  date: string;
  time: string;
}

export interface SupervisionLetter {
  letterId: string;
  staffId: string;
  staffName: string;
  letterNo: string;
  /** yyyy-MM-dd */
  letterDate: string;
  role: string | null;
  duties: LetterDuty[];
}

export interface SupervisionData {
  exam: ExamGroup;
  roles: string[];
  slots: SupervisionSlot[];
  letters: SupervisionLetter[];
}

export interface SupervisionAssignment {
  staffId: string;
  role: string;
  duties: LetterDuty[];
}

/** The whole grid for one exam: staff left out lose their letter. */
export interface SupervisionSave {
  examId: string;
  /** yyyy-MM-dd, used for letters created by this save. */
  letterDate: string;
  assignments: SupervisionAssignment[];
}

export interface SupervisionSaveResult {
  created: number;
  updated: number;
  unchanged: number;
  removed: number;
  message: string;
  letters: SupervisionLetter[];
}

/** One subject of the exam (any branch) that an examiner or moderator can be appointed for. */
export interface AppointmentSubject {
  subjectId: string;
  code: string;
  name: string;
  branch: string;
  courseId: string;
  /** The semester number (6 for Sem-6), or null when the subject has none. */
  semester: number | null;
  pattern: string;
}

export type AppointmentType = "EXAMINER" | "MODERATOR";

export interface AppointmentLetter {
  letterId: string;
  staffId: string;
  staffName: string;
  letterNo: string;
  /** yyyy-MM-dd */
  letterDate: string;
  type: AppointmentType;
  subjectId: string;
}

export interface AppointmentData {
  exam: ExamGroup;
  subjects: AppointmentSubject[];
  letters: AppointmentLetter[];
}

export interface AppointmentSubjectSave {
  subjectId: string;
  examiners: string[];
  moderators: string[];
}

/** The whole screen for one exam: people left out lose their letter. */
export interface AppointmentSave {
  examId: string;
  /** yyyy-MM-dd, used for letters created by this save. */
  letterDate: string;
  subjects: AppointmentSubjectSave[];
}

export interface AppointmentSaveResult {
  created: number;
  unchanged: number;
  removed: number;
  message: string;
  letters: AppointmentLetter[];
}

export interface LetterSettings {
  letterPrefix: string | null;
  capContact: string | null;
  /** What the prefix is when none is set: "{college code}/EXAM". */
  defaultPrefix: string;
}

export interface LetterSettingsSave {
  letterPrefix: string;
  capContact: string;
}

/** Which letters an email or a merged PDF is about. */
export type LetterKind = "supervision" | "appointment";

export interface LetterEmailRequest {
  examId: string;
  kind: LetterKind | "all";
  /** Only these people; left out for everyone with a letter. */
  staffIds?: string[];
  /** Skip people who were already emailed. */
  onlyNotSent: boolean;
}

export interface LetterEmailPreview {
  /** People with a live letter of this kind for the exam (after the filters above). */
  people: number;
  withEmail: number;
  alreadySent: number;
  letters: number;
  /** Names of the people with no email address. */
  noEmail: string[];
  /** False when no email account is set up, so nothing can be sent. */
  senderReady: boolean;
}

export interface LetterEmailResult {
  queued: number;
  skipped: number;
  message: string;
}

/** How far each person got with the link they were emailed (the latest link for the exam). */
export interface LetterEmailStatus {
  staffId: string;
  sentAt: string | null;
  openedAt: string | null;
  downloadedAt: string | null;
}

/** The address of this app, so the emailed link points back to it. */
const appUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/+$/, "");

/** A PDF response; when the API answers with an error the blob holds its JSON, so the reason is read out of it. */
async function getPdf(url: string, params?: Record<string, string>): Promise<{ blob: Blob; fileName: string }> {
  try {
    const res = await apiClient.get<Blob>(url, { params, responseType: "blob" });
    const disposition = String(res.headers["content-disposition"] ?? "");
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { blob: new Blob([res.data], { type: "application/pdf" }), fileName: match ? decodeURIComponent(match[1]) : "Letter.pdf" };
  } catch (err) {
    const data = (err as { response?: { data?: unknown } })?.response?.data;
    if (data instanceof Blob) {
      let message = "";
      try {
        const parsed = JSON.parse(await data.text());
        message = typeof parsed === "string" ? parsed : (parsed?.message ?? "");
      } catch {
        /* not JSON: the fallback wording is used */
      }
      throw { response: { data: { message } } };
    }
    throw err;
  }
}

export const StaffLetterService = {
  async exams(ayid: string): Promise<ExamGroup[]> {
    const res = await apiClient.get<ExamGroup[]>("/StaffLetters/exams", { params: { ayid } });
    return res.data;
  },

  async supervision(examId: string): Promise<SupervisionData> {
    const res = await apiClient.get<SupervisionData>("/StaffLetters/supervision", { params: { examId } });
    return res.data;
  },

  async saveSupervision(dto: SupervisionSave): Promise<SupervisionSaveResult> {
    const res = await apiClient.put<SupervisionSaveResult>("/StaffLetters/supervision", dto);
    return res.data;
  },

  async appointments(examId: string): Promise<AppointmentData> {
    const res = await apiClient.get<AppointmentData>("/StaffLetters/appointments", { params: { examId } });
    return res.data;
  },

  async saveAppointments(dto: AppointmentSave): Promise<AppointmentSaveResult> {
    const res = await apiClient.put<AppointmentSaveResult>("/StaffLetters/appointments", dto);
    return res.data;
  },

  /** One letter as a PDF. */
  pdf(letterId: string) {
    return getPdf(`/StaffLetters/${letterId}/pdf`);
  },

  /** Every live letter of one kind for the exam, in one PDF. */
  pdfAll(examId: string, kind: LetterKind) {
    return getPdf("/StaffLetters/pdf", { examId, kind });
  },

  async emailPreview(dto: LetterEmailRequest): Promise<LetterEmailPreview> {
    const res = await apiClient.post<LetterEmailPreview>("/StaffLetters/email/preview", dto);
    return res.data;
  },

  async emailSend(dto: LetterEmailRequest): Promise<LetterEmailResult> {
    const res = await apiClient.post<LetterEmailResult>("/StaffLetters/email", { ...dto, appUrl: appUrl() });
    return res.data;
  },

  async emailStatus(examId: string): Promise<LetterEmailStatus[]> {
    const res = await apiClient.get<LetterEmailStatus[]>("/StaffLetters/email/status", { params: { examId } });
    return res.data;
  },

  async settings(): Promise<LetterSettings> {
    const res = await apiClient.get<LetterSettings>("/StaffLetters/settings");
    return res.data;
  },

  async saveSettings(dto: LetterSettingsSave): Promise<void> {
    await apiClient.put("/StaffLetters/settings", dto);
  },
};
