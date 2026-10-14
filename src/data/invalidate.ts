import { queryClient } from "./queryClient";
import { LOOKUP_KIND_INDEX } from "./queryKeys";

// Call these after a save so every screen's drop-downs pick up the change. They do not need the college id:
// the cache only ever holds the signed-in college's data (it is cleared on logout / 401).
// Each marks the matching queries stale and refetches the ones currently on screen.
//
//   Exam Master save / update / delete, exam lock, revaluation exam created ......... invalidateExams()
//   Subject Master saves (add / edit / delete / import) ............................. invalidateSubjects()
//   Ordinance pattern / grade-scale changes, College Details, Platform changes,
//   a new academic year or course ................................................... invalidateBootstrap()

const invalidateKind = (kind: "bootstrap" | "exams" | "subjects") =>
  queryClient.invalidateQueries({
    predicate: (q) => q.queryKey[0] === "lookup" && q.queryKey[LOOKUP_KIND_INDEX] === kind,
  });

export const invalidateExams = () => invalidateKind("exams");
export const invalidateSubjects = () => invalidateKind("subjects");
export const invalidateBootstrap = () => invalidateKind("bootstrap");
/** Refresh everything lookup-related (rarely needed). */
export const invalidateAllLookups = () => queryClient.invalidateQueries({ queryKey: ["lookup"] });
