import apiClient from "../api/Client";
import { ExamApiResponse, ExamApiRequest } from "./RegularExamService";

export interface AttendanceReportRequest {
Ayid: string;
CourseId: string;
Pattern: string;
Semester: string;
Exam: string;
Event: string;
}

export interface AttendanceReportResponse {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  time: string;
  studentCount: number;
}
export interface AttendanceSeatNoRequest {
Ayid: string;
CourseId: string;
Pattern: string;
Semester: string;
Exam: string;
SubjectId: string;
}

export interface AttendanceSeatNoResponse {
seatNo: string;
}

export const AttendanceReportService = {
async getExam(
params: ExamApiRequest
): Promise<ExamApiResponse[]> {
const response = await apiClient.get<ExamApiResponse[]>(
"/AttendenceReport/get-exam",
{ params }
);


return response.data;


},

async getSubjectStudentCount(
params: AttendanceReportRequest
): Promise<AttendanceReportResponse[]> {
const response = await apiClient.get<AttendanceReportResponse[]>(
"/AttendenceReport/GetSubjectStudentCount",
{ params }
);


return response.data;


},

async getSubjectSeatNo(
params: AttendanceSeatNoRequest
): Promise<AttendanceSeatNoResponse[]> {
const response = await apiClient.get<AttendanceSeatNoResponse[]>(
"/AttendenceReport/GetSubjectSeatNo",
{ params }
);


return response.data;


},
};
