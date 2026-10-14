import apiClient from "../api/Client";

export interface GetDeclareExamTable {
  CourseId: string;
  Ayid: string;
  Semester: string;
  ExamId: string;
  Pattern: string;
}

export interface ToggleReleaseHallTicketDTO {
  ExamId: string;
  CourseId: string;
  Ayid: string;
  Semester: string;
  Pattern: string;
  ReleaseHallTicket: boolean;
  HallTicketDeclareDate?: string | null;
}

export interface DeclareHallTicketApiResponse {
  examId: string;
  examname: string;
  courseId: string;
  ayid: string;
  semester: string;
  releaseHallTicket: boolean;
  pattern: string;
  hallTicketDeclareDate?: string | null;
  hallTicketUpdatedAt?: string | null;
  /** False when no DeclareResult row exists yet (the hall ticket is "not released"). */
  hasRecord?: boolean;
}

export interface GetReleaseHallTicketExam {
  CourseId: string;
  Ayid: string;
  Semester: string;
  pattern: string;
}

export const ReleaseHallticketService = {
  async GetExam(
    params: GetReleaseHallTicketExam,
  ): Promise<DeclareHallTicketApiResponse[]> {
    const response = await apiClient.get<DeclareHallTicketApiResponse[]>(
      "/ReleaseHallTicket/get-exam",
      { params },
    );
    return response.data;
  },

  async GetTableExam(
    params: GetDeclareExamTable,
  ): Promise<DeclareHallTicketApiResponse[]> {
    const response = await apiClient.get<DeclareHallTicketApiResponse[]>(
      "/ReleaseHallTicket/get-table-exam",
      { params },
    );
    return response.data;
  },

  async ToggleReleaseHallTicket(
    payload: ToggleReleaseHallTicketDTO,
  ): Promise<boolean> {
    const response = await apiClient.post<boolean>(
      "/ReleaseHallTicket/toggle-release",
      payload,
    );
    return response.data;
  },
};

// export interface GetDeclareExamTable {
//   CourseId: string;
//   Ayid: string;
//   Semester: string;
//   ExamId: string;
//   Pattern: string;
// }
// export interface DeclareExamApiResponse {
//   examId: string;
//   examname: string;
//   isDeclare: boolean;
//   declareDate?: string | null;
//   pattern: string;
// }

// export const ReleaseHallticketService = {
//   async GetTableExam(
//     params: GetDeclareExamTable,
//   ): Promise<DeclareExamApiResponse[]> {
//     const response = await apiClient.get<DeclareExamApiResponse[]>(
//       "/ReleaseHallTicket/get-table-exam",
//       { params },
//     );
//     return response.data;
//   },
// };
