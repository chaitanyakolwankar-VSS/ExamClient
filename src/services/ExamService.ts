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
export interface RevolutionExamApiResponse {
    examId: string;
    examname: string;
}

export interface GetExams {
    Courseid: string;
    Ayid: string;
}
export interface GetResolutionExams {
    Courseid: string;
    Ayid: string;
      Semester: string;
            Pattern: string;
}
export interface UpdateExams {
    ExamId: string;
    ActiveStatus: Boolean;
}
export interface DeleteExams {
    ExamId: string;
}
export interface GetCreditHeadResolutionreq {
    SubjectId: string;
    ExamId:string;
    Ayid: string;
}
export interface GetCreditHeadResolutionres {
  creditsId: string;
  h1SubjectCredit:string;
  h1OutOf: string;
  h1Pass: string ;
  h1Type: string;
  h1Res: string ;
  h2SubjectCredit?:string|null;
  h2OutOf?: string|null ;
  h2Pass?: string|null ;
  h2Type?: string|null;
  h2Res?: string |null;
};
export interface SaveResolution {
    examId:string;
ayid:string;
courseId:string;
 items:GetCreditHeadResolutionres[];
};
export const ExamService = {

    async SaveExam(Exam: Saveexam): Promise<Response> {
        const response = await apiClient.post<Response>("/ExamMaster/save-exam", Exam);
        return response.data;
    },
     async SaveResolution(Resolution: SaveResolution): Promise<Response> {
        const response = await await apiClient.post("/ExamMaster/save-creditHeadResolutionres", {
  examId: Resolution.examId,
  ayId: Resolution.ayid,
    courseId: Resolution.courseId,
  items: Resolution.items
});
        return response.data;
    },
        async UpdateResolution(Resolution: SaveResolution): Promise<Response> {
        const response = await await apiClient.put("/ExamMaster/update-creditHeadResolutionres", {
  examId: Resolution.examId,
  ayId: Resolution.ayid,
    courseId: Resolution.courseId,
  items: Resolution.items
});
        return response.data;
    },
    async SearchExam(params: Saveexam): Promise<Response> {
        const response = await apiClient.get<Response>("/ExamMaster/search-exam", {params});
        return response.data;
    },
       async SearchResolutionExam(params: GetResolutionExams): Promise<RevolutionExamApiResponse[]> {
        const response = await apiClient.get<RevolutionExamApiResponse[]>("/ExamMaster/get-resolutionexam", {params});
        return response.data;
    },
     async GetCreditHeadResolution(params: GetCreditHeadResolutionreq): Promise<GetCreditHeadResolutionres[]> {
        const response = await apiClient.get<GetCreditHeadResolutionres[]>("/ExamMaster/get-creditHeadResolution", {params});
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