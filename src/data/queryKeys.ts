import type { ExamPurpose } from "./lookupApi";

/**
 * Every lookup key starts with ["lookup", collegeId] so one college's cache can never be served to another,
 * and everything can be dropped with queryClient.removeQueries({ queryKey: ["lookup"] }).
 * Keys that depend on the academic year carry the ayid, so changing the year refetches them.
 */
export const lookupKeys = {
  all: (collegeId: string) => ["lookup", collegeId] as const,
  bootstrap: (collegeId: string) => ["lookup", collegeId, "bootstrap"] as const,
  exams: (
    collegeId: string,
    ayid: string,
    p: { courseId: string; purpose: ExamPurpose; semester?: string },
  ) => ["lookup", collegeId, "exams", ayid, p.courseId, p.purpose, p.semester ?? ""] as const,
  subjects: (collegeId: string, p: { courseId: string; pattern: string; semester: string }) =>
    ["lookup", collegeId, "subjects", p.courseId, p.pattern, p.semester] as const,
  /** Fallback for the academic-year list if bootstrap fails (see AcademicYearContext). */
  legacyYears: (collegeId: string) => ["lookup", collegeId, "legacyYears"] as const,
};

// Position of the "kind" segment, used by the college-independent invalidation helpers.
export const LOOKUP_KIND_INDEX = 2;
