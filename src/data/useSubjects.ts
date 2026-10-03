import { useQuery } from "@tanstack/react-query";
import { lookupApi } from "./lookupApi";
import { lookupKeys } from "./queryKeys";
import { useCollegeId } from "./useBootstrap";

const TWO_MINUTES = 2 * 60 * 1000;

export interface UseSubjectsInput {
  courseId?: string;
  /** The pattern NAME (SubjectMaster.Pattern), not the patternId. */
  pattern?: string;
  /** Stored semester id, e.g. "Sem-3". */
  semester?: string;
}

/** Subjects of course + pattern + semester. Fetches only once all three are set. Call invalidateSubjects() after Subject Master saves. */
export const useSubjects = ({ courseId, pattern, semester }: UseSubjectsInput) => {
  const collegeId = useCollegeId();
  return useQuery({
    queryKey: lookupKeys.subjects(collegeId ?? "", {
      courseId: courseId ?? "",
      pattern: pattern ?? "",
      semester: semester ?? "",
    }),
    queryFn: () => lookupApi.subjects({ courseId: courseId!, pattern: pattern!, semester: semester! }),
    enabled: !!collegeId && !!courseId && !!pattern && !!semester,
    staleTime: TWO_MINUTES,
  });
};
