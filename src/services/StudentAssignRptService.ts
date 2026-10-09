import apiClient from "../api/Client";

export interface StudentAssignReportRequest {
  Courseid: string;
  Ayid: string;
  Pattern: string;
  Semester: string;
  ExamId: string;
}

export interface StudentAssignReportResponse {
  subjectCode: string;
  subjectName: string;
  studentID: string;
  seatNo: string;
  name: string;
}

export interface StudentCreditReportResponse {
  subjectCode: string;
  subjectName: string;
  totalCredits: number;
  head: string;
  headFormula: string;
  headType: string;
  headOutOf: number;
  headPass: number;
  studentID: string;
  seatNo: string;
  name: string;
}

export const StudentAssignRptService = {
  getReport: async (
    params: StudentAssignReportRequest,
  ): Promise<StudentAssignReportResponse[]> => {
    const response = await apiClient.post<StudentAssignReportResponse[]>(
      "/StudentAssignRpt/GetReport",
      params,
    );
    return response.data;
  },

  getCreditReport: async (
    params: StudentAssignReportRequest,
  ): Promise<StudentCreditReportResponse[]> => {
    const response = await apiClient.post<StudentCreditReportResponse[]>(
      "/StudentAssignRpt/GetCreditReport",
      params,
    );
    return response.data;
  },
};
