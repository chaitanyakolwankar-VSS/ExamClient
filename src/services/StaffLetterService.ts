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
  /** Live examiner and moderator letters. */
  appointmentCount: number;
}

/** One duty chart (an exam period's supervision plan) in the list. */
export interface DutyChartSummary {
  id: string;
  name: string;
  /** "First Half", "Second Half" or "". */
  half: string;
  /** yyyy-MM-dd */
  fromDate: string;
  /** yyyy-MM-dd */
  toDate: string;
  note: string | null;
  dayCount: number;
  staffCount: number;
  dutyCount: number;
  letterCount: number;
}

export interface DutyChartSave {
  ayid: string;
  name: string;
  half: string;
  fromDate: string;
  toDate: string;
  note: string;
}

/** One exam day of a chart; a null time means there is no such session that day. */
export interface DutyDay {
  /** yyyy-MM-dd */
  date: string;
  weekday: string;
  morning: string | null;
  afternoon: string | null;
  /** False when the day or its times were added or changed by hand. */
  fromTimetable: boolean;
  papers: number;
}

export type DutyKind = "duty" | "valuation" | "other";
/** M = morning, A = afternoon, MA = both. */
export type DutySession = "M" | "A" | "MA";

/** What one person does on one day. */
export interface DutyEntry {
  staffId: string;
  date: string;
  kind: DutyKind;
  session: DutySession | null;
  role: string | null;
  note: string | null;
}

export interface DutyLetterLine {
  date: string;
  time: string;
  kind: string;
  role: string;
}

export interface DutyChartLetter {
  letterId: string;
  staffId: string;
  staffName: string;
  letterNo: string;
  /** yyyy-MM-dd */
  letterDate: string;
  role: string | null;
  lines: DutyLetterLine[];
}

/** One person on the chart (whether or not they have a duty yet). */
export interface DutyChartMember {
  staffId: string;
  sortOrder: number;
}

export interface DutyChartDetail {
  chart: DutyChartSummary;
  days: DutyDay[];
  /** The people on the chart, in order. A new chart has none. */
  members: DutyChartMember[];
  entries: DutyEntry[];
  /** The supervision roles, highest first. */
  roles: string[];
  letters: DutyChartLetter[];
}

export interface DutyChartSaveResult {
  created: number;
  updated: number;
  unchanged: number;
  removed: number;
  message: string;
}

/** One row of the Excel import result. */
export interface DutyImportRow {
  row: number;
  name: string;
  email: string;
  action: "New" | "Update" | "Unchanged" | "";
  hasErrors: boolean;
  note: string | null;
}

export interface DutyImportResult {
  success: boolean;
  saved: boolean;
  message: string;
  errors: string[];
  rows: DutyImportRow[];
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
  /** Where staff report before a session; null = the default below. */
  reportingPlace: string | null;
  /** The guidelines printed on duty letters, one per line; null = the defaults below. */
  dutyGuidelines: string | string[] | null;
  defaultReportingPlace: string;
  defaultGuidelines: string[];
}

export interface LetterSettingsSave {
  letterPrefix: string;
  capContact: string;
  reportingPlace: string;
  /** One guideline per line. */
  dutyGuidelines: string;
}

/** Which letters an email or a merged PDF is about. */
export type LetterKind = "supervision" | "appointment";

/** What letters belong to: one exam (examiner and moderator letters) or one duty chart (supervision letters). */
export interface LetterTarget {
  examId?: string;
  dutyChartId?: string;
}

export interface LetterEmailRequest extends LetterTarget {
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

/** A file response; when the API answers with an error the blob holds its JSON, so the reason is read out of it. */
async function getBlob(url: string, params?: Record<string, string>): Promise<{ blob: Blob; fileName: string }> {
  try {
    const res = await apiClient.get<Blob>(url, { params, responseType: "blob" });
    const disposition = String(res.headers["content-disposition"] ?? "");
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { blob: res.data, fileName: match ? decodeURIComponent(match[1]) : "" };
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

/** A PDF response. */
async function getPdf(url: string, params?: Record<string, string>): Promise<{ blob: Blob; fileName: string }> {
  const { blob, fileName } = await getBlob(url, params);
  return { blob: new Blob([blob], { type: "application/pdf" }), fileName: fileName || "Letter.pdf" };
}

export const StaffLetterService = {
  async exams(ayid: string): Promise<ExamGroup[]> {
    const res = await apiClient.get<ExamGroup[]>("/StaffLetters/exams", { params: { ayid } });
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

  /** Every live letter of one kind for the exam, in one PDF (examiner and moderator letters). */
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

  async emailStatus(target: LetterTarget): Promise<LetterEmailStatus[]> {
    const res = await apiClient.get<LetterEmailStatus[]>("/StaffLetters/email/status", { params: { examId: target.examId, dutyChartId: target.dutyChartId } });
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

export const DutyChartService = {
  async list(ayid: string): Promise<DutyChartSummary[]> {
    const res = await apiClient.get<DutyChartSummary[]>("/DutyCharts", { params: { ayid } });
    return res.data;
  },

  async get(id: string): Promise<DutyChartDetail> {
    const res = await apiClient.get<DutyChartDetail>(`/DutyCharts/${id}`);
    return res.data;
  },

  async create(dto: DutyChartSave): Promise<DutyChartDetail> {
    const res = await apiClient.post<DutyChartDetail>("/DutyCharts", dto);
    return res.data;
  },

  async update(id: string, dto: DutyChartSave): Promise<DutyChartDetail> {
    const res = await apiClient.put<DutyChartDetail>(`/DutyCharts/${id}`, dto);
    return res.data;
  },

  /** Cancels the chart and its letters. */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/DutyCharts/${id}`);
  },

  /** Reads the timetables again: adds missing days and empty session times, never overwrites a day edited by hand. */
  async refreshDays(id: string): Promise<DutyChartDetail> {
    const res = await apiClient.post<DutyChartDetail>(`/DutyCharts/${id}/days/refresh`);
    return res.data;
  },

  /** Replaces the day list. */
  async saveDays(id: string, days: { date: string; morning: string | null; afternoon: string | null }[]): Promise<DutyChartDetail> {
    const res = await apiClient.put<DutyChartDetail>(`/DutyCharts/${id}/days`, days);
    return res.data;
  },

/** The whole chart: the ordered people on it and all their duties. People left out lose their duties and letters. */
  async saveEntries(id: string, letterDate: string, entries: DutyEntry[], members: string[]): Promise<DutyChartSaveResult> {
    const res = await apiClient.put<DutyChartSaveResult>(`/DutyCharts/${id}/entries`, { letterDate, entries, members });
    return res.data;
  },

  /** The saved chart as an Excel sheet listing the people on it (a blank template when there are none). */
  async excel(id: string): Promise<{ blob: Blob; fileName: string }> {
    const { blob, fileName } = await getBlob(`/DutyCharts/${id}/excel`);
    return { blob, fileName: fileName || "Duty Chart.xlsx" };
  },

  /** Every letter of the chart in one PDF. */
  pdf(id: string) {
    return getPdf(`/DutyCharts/${id}/pdf`);
  },

  /** Reads a filled-in sheet; preview = only check it. */
  async importSheet(id: string, file: File, preview: boolean, letterDate: string): Promise<DutyImportResult> {
    const form = new FormData();
    form.append("File", file);
    form.append("Preview", String(preview));
    form.append("LetterDate", letterDate);
    const res = await apiClient.post<DutyImportResult>(`/DutyCharts/${id}/import`, form);
    return res.data;
  },
};
