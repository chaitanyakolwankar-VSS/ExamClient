import apiClient from "../api/Client";
import { ExamApiResponse,ExamApiRequest } from "./RegularExamService";
export interface HeadTypeRequest {
    Ayid: string;
    Semester:string;
        Pattern:string;
            ExamId:string;
}
export interface HeadTypeResponse {
    headType: string;
}
export interface AtktReportResponse {
    subjectName: string;
    seatNo:string;
    subjectCriteria:string;
}
export interface AtktReportRequest {
       Ayid: string;
    Semester:string;
        Pattern:string;
            ExamId:string;
            HeadType:string;
}
export const ATKTCommulativeReportService = {
    async getExam(params: ExamApiRequest): Promise<ExamApiResponse[]> {
        const response = await apiClient.get<ExamApiResponse[]>(
            "/ATKTCommulativeReport/get-exam", { params }
        );
        return response.data;
    },
    async getHeadType(params: HeadTypeRequest): Promise<HeadTypeResponse[]> {
        const response = await apiClient.get<HeadTypeResponse[]>(
            "/ATKTCommulativeReport/get-HeadType", { params }
        );
        return response.data;
    },
     async getAtktReportData(params: AtktReportRequest): Promise<AtktReportResponse[]> {
        const response = await apiClient.get<AtktReportResponse[]>(
            "/ATKTCommulativeReport/get-AtktReportData", { params }
        );
        return response.data;
    }
}