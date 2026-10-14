import { keepPreviousData, useQuery } from "@tanstack/react-query";
import apiClient from "../api/Client";
import { DashboardService } from "../services/Dashboard";
import type { ExamLifecycle } from "../services/Dashboard";
import { useCollegeId } from "./useBootstrap";

/**
 * Dashboard numbers, cached per college + academic year. Coming back to the dashboard shows the last numbers
 * at once and refreshes them in the background; switching course keeps the previous course's charts on screen
 * until the new ones arrive. Logout clears the whole cache (queryClient.clear), so nothing carries over to the
 * next user.
 */
const ONE_MINUTE = 60 * 1000;

const dashboardKeys = {
  courses: (collegeId: string, ayid: string) => ["dashboard", collegeId, ayid, "courses"] as const,
  stats: (collegeId: string, ayid: string) => ["dashboard", collegeId, ayid, "stats"] as const,
  lifecycle: (collegeId: string, ayid: string) => ["dashboard", collegeId, ayid, "lifecycle"] as const,
  course: (collegeId: string, ayid: string, courseId: string) => ["dashboard", collegeId, ayid, "course", courseId] as const,
};

export const useDashboardCourses = (ayid: string) => {
  const collegeId = useCollegeId() ?? "";
  return useQuery({
    queryKey: dashboardKeys.courses(collegeId, ayid),
    queryFn: () => DashboardService.GetCourseStudentCount({ Ayid: ayid }),
    enabled: !!collegeId && !!ayid,
    staleTime: ONE_MINUTE,
  });
};

export const useDashboardStats = (ayid: string) => {
  const collegeId = useCollegeId() ?? "";
  return useQuery({
    queryKey: dashboardKeys.stats(collegeId, ayid),
    queryFn: async () => {
      const [totalStudents, passPercentage, totalExamsConducted, atktStudentCount] = await Promise.all([
        DashboardService.getTotalStudents(ayid),
        DashboardService.getPassPercentage(ayid),
        DashboardService.getTotalExamsConducted(ayid),
        DashboardService.getATKTStudentCount(ayid),
      ]);
      return { totalStudents, passPercentage, totalExamsConducted, atktStudentCount };
    },
    enabled: !!collegeId && !!ayid,
    staleTime: ONE_MINUTE,
  });
};

export const useDashboardLifecycle = (ayid: string) => {
  const collegeId = useCollegeId() ?? "";
  return useQuery({
    queryKey: dashboardKeys.lifecycle(collegeId, ayid),
    queryFn: async (): Promise<ExamLifecycle[]> => {
      const res = await apiClient.get("/Dashboard/exam-lifecycle", { params: { ayId: ayid } });
      // The API answers either { data: [...] } or the list (or one record) directly.
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : raw ? [raw] : [];
    },
    enabled: !!collegeId && !!ayid,
    staleTime: ONE_MINUTE,
  });
};

export const useDashboardCourse = (ayid: string, courseId: string | null) => {
  const collegeId = useCollegeId() ?? "";
  return useQuery({
    queryKey: dashboardKeys.course(collegeId, ayid, courseId ?? ""),
    queryFn: async () => {
      const [semesters, passFail, examTypes] = await Promise.all([
        DashboardService.getSemesterWiseStudentCount(courseId!, ayid),
        DashboardService.getPassFailChart(courseId!, ayid),
        DashboardService.getExamTypeDistribution(courseId!, ayid),
      ]);
      return { semesters, passFail, examTypes };
    },
    enabled: !!collegeId && !!ayid && !!courseId,
    staleTime: ONE_MINUTE,
    // Same year, other course: keep showing the previous course until this one arrives.
    placeholderData: (previous, previousQuery) =>
      previousQuery && previousQuery.queryKey[2] === ayid ? keepPreviousData(previous) : undefined,
  });
};
