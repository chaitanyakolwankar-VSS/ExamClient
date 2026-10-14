// Single import point for lookup data:  import { useCourses, useExams, invalidateExams } from "../../data";
export * from "./lookupApi";
export * from "./options";
export * from "./invalidate";
export { queryClient } from "./queryClient";
export { lookupKeys } from "./queryKeys";
export {
  useBootstrap,
  useCollegeId,
  useCourses,
  usePatterns,
  useSemesters,
  useGradeMasters,
  useCollegeInfo,
  useAcademicYears,
} from "./useBootstrap";
export { useExams } from "./useExams";
export { useSubjects } from "./useSubjects";
// The selected academic year lives in the context; re-exported here so screens import everything from "data".
export { useAcademicYear } from "../context/AcademicYearContext";
