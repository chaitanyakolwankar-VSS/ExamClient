import apiClient from "../api/Client";
import { Response } from "./Response";

export interface Saveexam {
    Courseid: string;
    Name: string;
    ExamType: string;
    RevalExam: boolean;
    Ayid: string;
}
export interface Exams {
    examId: string;
    name: string;
    examType: string;
    isActive: boolean | null;
}

export interface GetExams {
    Courseid: string;
    Ayid: string;
}

export interface UpdateExams {
    ExamId: string;
    ActiveStatus: Boolean;
}
export interface DeleteExams {
    ExamId: string;
}
export const ExamService = {

    async SaveExam(Exam: Saveexam): Promise<Response> {
        const response = await apiClient.post<Response>("/ExamMaster/save-exam", Exam);
        return response.data;
    },
    async SearchExam(params: Saveexam): Promise<Response> {
        const response = await apiClient.get<Response>("/ExamMaster/search-exam", {params});
        return response.data;
    },
    async GetExam(params: GetExams): Promise<Exams[]> {
        const response = await apiClient.get<Exams[]>("/ExamMaster/get-exam", { params });
        return response.data;
    },
    async UpdateExam(Exam: UpdateExams): Promise<Response> {
        const response = await apiClient.put<Response>("/ExamMaster/update-exam", Exam);
        return response.data;
    },
    async DeleteExam(Exam: DeleteExams): Promise<Response> {
        const response = await apiClient.delete<Response>("/ExamMaster/delete-exam", { data: Exam });
        return response.data;
    },


}