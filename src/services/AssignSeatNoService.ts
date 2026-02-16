import apiClient from "../api/Client";
import { Response } from "./Response";
import { ExamApiResponse } from "./RegularExamService";
export interface ExamApiRequest {
    Courseid: string;
    Ayid: string;
    Semester:string;
}
export interface GetStudentsRequest {
    Courseid: string;
    Ayid: string;
    Semester:string;
        Pattern:string;
            ExamId:string;
}
export interface GetStudentsResponse {
    marksId: string;
    studentId: string;
    studentName:string;
        quotaType:string;
            seatNo:string;
}
export interface SaveSeatNoStudent {
  marksId: string;
  studentId: string;
  studentName: string;
  quotaType: string;
  seatNo: string;
}

export interface SaveSeatNo {
  students: SaveSeatNoStudent[];
}

export const AssignSeatNoService = {
    async getExam(params: ExamApiRequest): Promise<ExamApiResponse[]> {
        const response = await apiClient.get<ExamApiResponse[]>(
            "/AssignSeatNo/get-exam", { params }
        );
        return response.data;
    },
    async getAssignSeatNoStudent(params: GetStudentsRequest): Promise<GetStudentsResponse[]> {
        const response = await apiClient.get<GetStudentsResponse[]>(
            "/AssignSeatNo/get-assignseatnostudents", { params }
        );
        return response.data;
    },
      async UpdateSeatNo(payload: SaveSeatNo): Promise<Response> {
        const response = await apiClient.put<Response>(
            "/AssignSeatNo/update-seatno",
            payload
        );
        return response.data;
    },
}