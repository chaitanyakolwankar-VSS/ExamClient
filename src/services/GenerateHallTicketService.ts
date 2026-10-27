import apiClient from "../api/Client";
import { Response } from "./Response";

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
    CourseId:string;
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
    studentid:string;
    /** ERN and ABC ID; empty when not on record. */
    ern?: string;
    abcId?: string;
    /** Stored path of the student photo; shown via the authenticated /Files endpoint. */
    photo?: string | null;
    /** Stored path of the student signature (same /Files access); null when none. */
    sign?: string | null;
    subjects:StudentsHallTicketSubjects[];
}
export interface TimeTableAllRow {
    date: string;
    time: string;
    subjectCode: string;
    subjectName: string;
}
export interface TimeTableAllBlock {
    branchName: string;
    pattern: string;
    /** Label such as "Semester III". */
    semester: string;
    rows: TimeTableAllRow[];
}
/** Every branch's time table of one exam plus the college header data (same source as the hall ticket). */
export interface TimeTableAll {
    college: HallTicketCollege;
    examName: string;
    examType: string;
    academicYear: string;
    blocks: TimeTableAllBlock[];
}
export interface HallTicketCollege{
    logo:string;
    center:string;
    /** College name for the header when there is no logo. */
    collegeName?:string;
    /** Stored path of the Principal's signature image; empty when none. */
    principalSign?:string;
    /** Stored paths of the Controller of Examinations' signature and the office seal; empty when none. */
    controllerSign?:string;
    seal?:string;
}
 
export const GenerateHallTicketService = {
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
    async getTimeTableAll(examId: string): Promise<TimeTableAll> {
        const response = await apiClient.get<TimeTableAll>(
            "/GenerateHallTicket/get-timetable-all", { params: { examId } }
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