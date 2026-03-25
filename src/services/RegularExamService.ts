import apiClient from "../api/Client";
import { Response } from "./Response";
export interface ExamApiResponse {
    examId: string;
    examname: string;
}
export interface ExamApiRequest {
    Courseid: string;
    Ayid: string;
}
export interface RegularStudents {
    stdMstId: string;
    studentId: string;
    studentName: string;
    assigned: boolean | null;
}
export interface RegularStudentResponse {
  assignedStudents: RegularStudents[];
  unassignedStudents: RegularStudents[];
}
export interface RegularCredits{
   subjectIds: string[];
  ayid: string;
}
export interface GetStudents {
    CourseId: string;
    Pattern: string;
    Semester: string;
    SubjectId: string[];
    Ayid: string;
     examId:string;
}
export interface SaveRegularExamPayload {
    examInfo: {
        courseId: string;
        pattern: string;
        semester: string;
        subjectId: string[];
        ayid: string;
        examId:string;
    };
    students: {
        stdMstId: string;
        assigned: boolean | null;
studentId:string;
 studentName :string;
    }[];
}


export const RegularExamService = {
    async getExam(params: ExamApiRequest): Promise<ExamApiResponse[]> {
        const response = await apiClient.get<ExamApiResponse[]>(
            "/RegularExam/get-exam", { params }
        );
        return response.data;
    },
    // async CheckCredit(params: RegularCredits): Promise<Response> {
    //     const response = await apiClient.get<Response>(
    //         "/RegularExam/get-credit", { params }
    //     );
    //     return response.data;
    // },
    async CheckCredit(params: RegularCredits): Promise<Response> {
  const response = await apiClient.post<Response>(
    "/RegularExam/get-credit",
    params
  );
  return response.data;
},

       async getRegularStudents(params: GetStudents): Promise<RegularStudentResponse> {
        const response = await apiClient.post<RegularStudentResponse>(
            "/RegularExam/get-regularstudents", params 
        );
        return response.data;
    },
     async saveRegularStudents(payload: SaveRegularExamPayload): Promise<Response> {
        const response = await apiClient.post<Response>(
            "/RegularExam/save-regular-exam-students",
            payload
        );
        return response.data;
    },
     async UpdateRegularStudents(payload: SaveRegularExamPayload): Promise<Response> {
        const response = await apiClient.put<Response>(
            "/RegularExam/Update-regular-exam-students",
            payload
        );
        return response.data;
    },
}