import type {
  LookupAcademicYear,
  LookupCourse,
  LookupExam,
  LookupGradeMaster,
  LookupPattern,
  LookupSemester,
  LookupSubject,
} from "./lookupApi";

/** The {value,label} shape of components/form/Select. */
export interface SelectOption {
  value: string;
  label: string;
}

// All accept undefined (query still loading) and return [] so they can be used straight in JSX.

export const toCourseOptions = (courses?: LookupCourse[]): SelectOption[] =>
  (courses ?? []).map((c) => ({ value: c.courseId, label: c.name }));

/**
 * value = pattern NAME by default, because that is what SubjectMaster.Pattern stores and what
 * /Lookup/subjects expects. Pass "id" for screens that need the patternId.
 */
export const toPatternOptions = (patterns?: LookupPattern[], valueBy: "name" | "id" = "name"): SelectOption[] =>
  (patterns ?? []).map((p) => ({ value: valueBy === "id" ? p.patternId : p.name, label: p.name }));

/** value = "Sem-1" (stored id), label = "Semester I". */
export const toSemesterOptions = (semesters?: LookupSemester[]): SelectOption[] =>
  (semesters ?? []).map((s) => ({ value: s.value, label: s.label }));

/** label = displayName (adds " (Revaluation)" for revaluation exams). */
export const toExamOptions = (exams?: LookupExam[]): SelectOption[] =>
  (exams ?? []).map((e) => ({ value: e.examId, label: e.displayName }));

/** label = "CODE - Name". */
export const toSubjectOptions = (subjects?: LookupSubject[]): SelectOption[] =>
  (subjects ?? []).map((s) => ({ value: s.subjectId, label: s.code ? `${s.code} - ${s.name}` : s.name }));

export const toGradeMasterOptions = (grades?: LookupGradeMaster[]): SelectOption[] =>
  (grades ?? []).map((g) => ({ value: g.gradeMasterId, label: g.name }));

/** value = ayid, label = short text ("24-25"). */
export const toAcademicYearOptions = (years?: LookupAcademicYear[]): SelectOption[] =>
  (years ?? []).map((y) => ({ value: y.ayid, label: y.shortDuration }));
