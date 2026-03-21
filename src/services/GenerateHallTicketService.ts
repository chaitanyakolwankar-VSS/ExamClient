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
export interface HallticketSubjects {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    examTime: string;
    examDate: string;
}
export interface HallticketSubjectsRequest {
    ayid: string;
    courseId: string;
    semester:string;
    pattern:string;
    examId:string
}
export interface SaveTimeTable {
    ExamId: string;
    CourseId: string;
    TimeTableData:HallticketSubjects[];
}
export interface StudentHallTicketDataRequest {
    Ayid: string;
    ExamId: string;
    Semester:string;
    Pattern:string;
    Mode:string;
    StudentId:string;
}
export interface StudentsHallTicketSubjects {
    code: string;
    name: string;
    date:string;
    time:string;
}
export interface StudentHallTicketData {
    name: string;
    centre: string;
    seat:string;
    subjects:StudentsHallTicketSubjects[];
}
export interface HallTicketCollege{
    logo:string;
    center:string;
}
 
export const GenerateHallTicketService = {
    // async getExam(params: ExamApiRequest): Promise<ExamApiResponse[]> {
    //     const response = await apiClient.get<ExamApiResponse[]>(
    //         "/RegularExam/get-exam", { params }
    //     );
    //     return response.data;
    // },
    async getExam(params: ExamApiRequest): Promise<ExamApiResponse[]> {
        const response = await apiClient.get<ExamApiResponse[]>(
            "/GenerateHallTicket/get-exam", { params }
        );
        return response.data;
    },
async getHallTicketSubjects(params: HallticketSubjectsRequest): Promise<HallticketSubjects[]> {
        const response = await apiClient.get<HallticketSubjects[]>(
            "/GenerateHallTicket/get-halltickectsubjects", { params }
        );
        return response.data;
    },
     async saveTimeTable(payload: SaveTimeTable): Promise<Response> {
        const response = await apiClient.post<Response>(
            "/GenerateHallTicket/save-timetable",
            payload
        );
        return response.data;
    },
    async getHallTicketStudents(params: StudentHallTicketDataRequest): Promise<StudentHallTicketData[]> {
        const response = await apiClient.get<StudentHallTicketData[]>(
            "/GenerateHallTicket/get-halltickectstudentsdata", { params }
        );
        return response.data;
    },
        async getcollegeDataExam(): Promise<HallTicketCollege> {
        const response = await apiClient.get<HallTicketCollege>(
            "/GenerateHallTicket/get-hallticketcollegedata", 
        );
        return response.data;
    },
}