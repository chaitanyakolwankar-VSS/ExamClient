// Types and the empty value for LookupFilterBar (kept apart from the component for fast refresh).

export type LookupFilterField = "course" | "pattern" | "semester" | "exam" | "subject";

export interface LookupFilterValue {
  courseId: string;
  /** Pattern name. */
  pattern: string;
  /** Stored semester id, e.g. "Sem-3". */
  semester: string;
  examId: string;
  subjectId: string;
}

export const EMPTY_LOOKUP_FILTER: LookupFilterValue = {
  courseId: "",
  pattern: "",
  semester: "",
  examId: "",
  subjectId: "",
};
