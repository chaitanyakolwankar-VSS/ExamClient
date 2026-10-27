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

  async settings(): Promise<LetterSettings> {
    const res = await apiClient.get<LetterSettings>("/StaffLetters/settings");
    return res.data;
  },

  async saveSettings(dto: LetterSettingsSave): Promise<void> {
    await apiClient.put("/StaffLetters/settings", dto);
  },
};
