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

  async settings(): Promise<LetterSettings> {
    const res = await apiClient.get<LetterSettings>("/StaffLetters/settings");
    return res.data;
  },

  async saveSettings(dto: LetterSettingsSave): Promise<void> {
    await apiClient.put("/StaffLetters/settings", dto);
  },
};
