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

//new
export interface DashboardStats {
  totalStudents: number;
  passPercentage: number;
  totalExamsConducted: number;
  atktStudentCount: number;
  courseStudentCounts: CourseStudentCount[];
  examLifecycle: ExamLifecycle;
}

export interface CourseStudentCount {
  courseId: string;
  courseName: string;
  studentCount: number;
}

export interface SemesterStudentCount {
  semesterId: string;
  studentCount: number;
}

export interface PassFailChart {
  semesterId: string;
  passCount: number;
  failCount: number;
}

export interface SemesterExamTypeCount {
  semesterId: string;
  examType: string;
  studentCount: number;
}

export interface ExamTypeDistribution {
  semesterId: string;
  examType: string;
  appeared: number;
  passed: number;
}

export interface ExamLifecycle {
  examName: string;
  assignedStudent: number;
  seatNo: number;
  releaseHallTicket: number;
  marksEntered: number;
  gazetteGnrt: number;
  isDeclare: number;
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

  //New
  async getDashboardStats(
    collegeId: string,
    ayId: string,
  ): Promise<DashboardStats> {
    const response = await apiClient.get("/Dashboard/stats", {
      params: { collegeId, ayId },
    });
    return response.data.data;
  },

  // Individual endpoints
  async getTotalStudents(collegeId: string, ayId: string): Promise<number> {
    const response = await apiClient.get("/Dashboard/total-students", {
      params: { collegeId, ayId },
    });
    return response.data.data;
  },

  async getPassPercentage(collegeId: string, ayId: string): Promise<number> {
    const response = await apiClient.get("/Dashboard/pass-percentage", {
      params: { collegeId, ayId },
    });
    return response.data.data;
  },

  // async getTotalExamsConducted(
  //   collegeId: string,
  //   ayId: string,
  // ): Promise<number> {
  //   const response = await apiClient.get("/Dashboard/total-exams", {
  //     params: { collegeId, ayId },
  //   });
  //   return response.data.data;
  // },
  async getTotalExamsConducted(
    collegeId: string,
    ayId: string,
  ): Promise<number> {
    const response = await apiClient.get("/Dashboard/total-exam", {
      params: { collegeId, ayId },
    });
    return response.data.data;
  },

  async getATKTStudentCount(collegeId: string, ayId: string): Promise<number> {
    const response = await apiClient.get("/Dashboard/atkt-count", {
      params: { collegeId, ayId },
    });
    return response.data.data;
  },

  async getCourseStudentCount(ayId: string): Promise<CourseStudentCount[]> {
    const response = await apiClient.get("/Dashboard/course-student-count", {
      params: { ayId },
    });
    return response.data.data;
  },

  // async getSemesterWiseStudentCount(
  //   courseId: string,
  //   ayId: string,
  // ): Promise<SemesterStudentCount[]> {
  //   const response = await apiClient.get("/Dashboard/semester-student-count", {
  //     params: { courseId, ayId },
  //   });
  //   return response.data.data;
  // },

  async getSemesterWiseStudentCount(
    courseId: string,
    ayId: string,
  ): Promise<SemesterStudentCount[]> {
    const response = await apiClient.get(
      "/Dashboard/semester-wise-student-count",
      {
        params: { courseId, ayId },
      },
    );
    return response.data; // backend returns RAW array
  },

  // async getPassFailChart(
  //   courseId: string,
  //   ayId: string,
  // ): Promise<PassFailChart[]> {
  //   const response = await apiClient.get("/Dashboard/pass-fail-chart", {
  //     params: { courseId, ayId },
  //   });
  //   return response.data.data;
  // },

  async getPassFailChart(
    courseId: string,
    ayId: string,
  ): Promise<PassFailChart[]> {
    const response = await apiClient.get("/Dashboard/pass-fail-chart", {
      params: { courseId, ayId },
    });
    return response.data; // backend returns RAW array
  },

  // async getSemesterWiseExamTypeCount(
  //   courseId: string,
  //   ayId: string,
  // ): Promise<SemesterExamTypeCount[]> {
  //   const response = await apiClient.get(
  //     "/Dashboard/semester-exam-type-count",
  //     {
  //       params: { courseId, ayId },
  //     },
  //   );
  //   return response.data.data;
  // },
  async getSemesterWiseExamTypeCount(
    courseId: string,
    ayId: string,
  ): Promise<SemesterExamTypeCount[]> {
    const response = await apiClient.get(
      "/Dashboard/semester-exam-type-count",
      {
        params: { courseId, ayId },
      },
    );
    return response.data; // backend returns RAW array
  },

  async getExamLifecycle(
    collegeId: string,
    ayId: string,
  ): Promise<ExamLifecycle> {
    const response = await apiClient.get("/Dashboard/exam-lifecycle", {
      params: { collegeId, ayId },
    });
    return response.data.data;
  },

  async getExamTypeDistribution(
    courseId: string,
    ayId: string,
  ): Promise<ExamTypeDistribution[]> {
    const response = await apiClient.get("/Dashboard/exam-type-distribution", {
      params: { courseId, ayId },
    });
    return response.data.data;
  },
};
