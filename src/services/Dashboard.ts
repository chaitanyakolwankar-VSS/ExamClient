import apiClient from "../api/Client";

export interface CourseStudentCountApiResponse {
  courseId: string;
  courseName: string;
  studentCount: number;
}

export interface SemesterStudentCountApiResponse {
  semesterId: string;
  studentCount: number;
}

export interface PassFailChartApiResponse {
  semesterId: string;
  passCount: number;
  failCount: number;
}

export interface GetCourseStudentCount {
  Ayid: string;
}

export interface GetSemesterWiseStudentCount {
  CourseId: string;
  Ayid: string;
}

export interface GetPassFailChart {
  CourseId: string;
  Ayid: string;
}

export interface SemesterExamTypeCountApiResponse {
  semesterId: string;
  examType: string;
  studentCount: number;
}

export interface GetSemesterWiseExamTypeCount {
  CourseId: string;
  Ayid: string;
}

export const DashboardService = {
  async GetCourseStudentCount(
    params: GetCourseStudentCount,
  ): Promise<CourseStudentCountApiResponse[]> {
    const response = await apiClient.get<CourseStudentCountApiResponse[]>(
      "/Dashboard/course-student-count",
      { params },
    );
    return response.data;
  },

  async GetSemesterWiseStudentCount(
    params: GetSemesterWiseStudentCount,
  ): Promise<SemesterStudentCountApiResponse[]> {
    const response = await apiClient.get<SemesterStudentCountApiResponse[]>(
      "/Dashboard/semester-wise-student-count",
      { params },
    );
    return response.data;
  },

  async GetPassFailChart(
    params: GetPassFailChart,
  ): Promise<PassFailChartApiResponse[]> {
    const response = await apiClient.get<PassFailChartApiResponse[]>(
      "/Dashboard/pass-fail-chart",
      { params },
    );
    return response.data;
  },

  async GetSemesterWiseExamTypeCount(
    params: GetSemesterWiseExamTypeCount,
  ): Promise<SemesterExamTypeCountApiResponse[]> {
    const response = await apiClient.get<SemesterExamTypeCountApiResponse[]>(
      "/Dashboard/semester-exam-type-count",
      { params },
    );
    return response.data;
  },
};
