import apiClient from "../api/Client";

// Contract of the /Lookup endpoints (T-19 layer A). JSON is camelCase.

export interface LookupAcademicYear {
  ayid: string;
  fullDuration: string; // e.g. "2024-2025"
  shortDuration: string; // e.g. "24-25"
  isCurrent: boolean;
}

export interface LookupCourse {
  courseId: string;
  name: string;
  code: string;
}

export interface LookupPattern {
  patternId: string;
  name: string;
}

export interface LookupSemester {
  /** The stored id, e.g. "Sem-6" - what every API endpoint takes as `semester`. */
  value: string;
  /** Display text, e.g. "Semester VI". */
  label: string;
  number: number;
}

export interface LookupGradeMaster {
  gradeMasterId: string;
  name: string;
}

export interface LookupCollege {
  collegeId: string;
  name: string;
  code: string;
  centre: string;
  hasLogo: boolean;
  hasBanner: boolean;
}

export interface LookupBootstrap {
  academicYears: LookupAcademicYear[];
  courses: LookupCourse[];
  patterns: LookupPattern[];
  semesters: LookupSemester[];
  gradeMasters: LookupGradeMaster[];
  /** null when the user has no college (platform admin) - bootstrap is never requested for them. */
  college: LookupCollege | null;
}

/** What the exam drop-down is for; decides which exams the API returns. "seatNo" needs a semester. */
export type ExamPurpose = "master" | "regular" | "all" | "seatNo" | "hallTicket" | "process";

export interface LookupExam {
  examId: string;
  name: string;
  /** Name, plus " (Revaluation)" for a revaluation exam. Use this as the option label. */
  displayName: string;
  examType: string | null;
  isActive: boolean;
  isRevaluation: boolean;
  revaluationForExamId: string | null;
  isLocked: boolean;
}

export interface LookupSubject {
  subjectId: string;
  name: string;
  code: string;
}

export interface ExamsParams {
  courseId: string;
  ayid: string;
  purpose: ExamPurpose;
  semester?: string;
}

export interface SubjectsParams {
  courseId: string;
  /** The pattern NAME as stored on SubjectMaster.Pattern (not the patternId). */
  pattern: string;
  semester: string;
}

export const lookupApi = {
  async bootstrap(): Promise<LookupBootstrap> {
    const res = await apiClient.get<LookupBootstrap>("/Lookup/bootstrap");
    return res.data;
  },
  async exams(params: ExamsParams): Promise<LookupExam[]> {
    const res = await apiClient.get<LookupExam[]>("/Lookup/exams", { params });
    return res.data;
  },
  async subjects(params: SubjectsParams): Promise<LookupSubject[]> {
    const res = await apiClient.get<LookupSubject[]>("/Lookup/subjects", { params });
    return res.data;
  },
};
