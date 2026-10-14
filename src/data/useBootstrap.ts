import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { bootstrapQueryOptions } from "./bootstrapQuery";
import type { LookupBootstrap } from "./lookupApi";
import { readCollegeId } from "./session";

/**
 * The signed-in college's id (from the JWT), or null when nobody is signed in or for the platform admin.
 * Everything in the lookup layer is keyed by it and only runs when it is set.
 */
export const useCollegeId = (): string | null => {
  const { token, user, isPlatformAdmin } = useAuth();
  return isPlatformAdmin ? null : readCollegeId(token, user);
};

/**
 * Courses, patterns, semesters, grade scales, academic years and the college record in ONE request, kept for
 * the whole session. The hooks below all read from this same cache entry (select), so using any number of them
 * on any number of screens costs a single GET /Lookup/bootstrap.
 */
export const useBootstrap = () => {
  const collegeId = useCollegeId();
  return useQuery({
    ...bootstrapQueryOptions(collegeId ?? ""),
    enabled: !!collegeId,
  });
};

// Module-level selectors keep a stable identity, so React Query can skip re-running them.
const selectCourses = (b: LookupBootstrap) => b.courses;
const selectPatterns = (b: LookupBootstrap) => b.patterns;
const selectSemesters = (b: LookupBootstrap) => b.semesters;
const selectGradeMasters = (b: LookupBootstrap) => b.gradeMasters;
const selectCollege = (b: LookupBootstrap) => b.college;
const selectYears = (b: LookupBootstrap) => b.academicYears;

const useBootstrapSlice = <T>(select: (b: LookupBootstrap) => T) => {
  const collegeId = useCollegeId();
  return useQuery({
    ...bootstrapQueryOptions(collegeId ?? ""),
    enabled: !!collegeId,
    select,
  });
};

export const useCourses = () => useBootstrapSlice(selectCourses);
export const usePatterns = () => useBootstrapSlice(selectPatterns);
export const useSemesters = () => useBootstrapSlice(selectSemesters);
export const useGradeMasters = () => useBootstrapSlice(selectGradeMasters);
export const useCollegeInfo = () => useBootstrapSlice(selectCollege);
/** Academic years from bootstrap. Screens normally want useAcademicYear() (selected year + setter) instead. */
export const useAcademicYears = () => useBootstrapSlice(selectYears);
