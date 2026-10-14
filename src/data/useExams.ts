import { useQuery } from "@tanstack/react-query";
import { useAcademicYear } from "../context/AcademicYearContext";
import { lookupApi } from "./lookupApi";
import type { ExamPurpose } from "./lookupApi";
import { lookupKeys } from "./queryKeys";
import { useCollegeId } from "./useBootstrap";

const TWO_MINUTES = 2 * 60 * 1000;

export interface UseExamsInput {
  courseId?: string;
  purpose: ExamPurpose;
  /** Only used (and required) for purpose "seatNo"; ignored for the others so a semester change does not refetch. */
  semester?: string;
}

/**
 * Exams of the selected course for the CURRENT academic year (from useAcademicYear), filtered by what the
 * drop-down is for. Waits (data undefined, nothing fetched) until course + year (+ semester for "seatNo") are set.
 * Call invalidateExams() after Exam Master changes.
 */
export const useExams = ({ courseId, purpose, semester }: UseExamsInput) => {
  const collegeId = useCollegeId();
  const { ayid } = useAcademicYear();
  const sem = purpose === "seatNo" ? semester || undefined : undefined;
  const enabled = !!collegeId && !!ayid && !!courseId && !!purpose && (purpose !== "seatNo" || !!sem);

  return useQuery({
    queryKey: lookupKeys.exams(collegeId ?? "", ayid ?? "", { courseId: courseId ?? "", purpose, semester: sem }),
    queryFn: () => lookupApi.exams({ courseId: courseId!, ayid: ayid!, purpose, semester: sem }),
    enabled,
    staleTime: TWO_MINUTES,
  });
};
