import apiClient from "../api/Client";

export interface SubjectApiResponse{
    subjectId:string;
    subjectName:string;
}
// 🔹 Request parameters type
export interface GetSubjectParams {
  courseId: string;
  pattern: string; 
  semester:string;
}
/** @deprecated Use useSubjects() from src/data. Kept with its API endpoint for team branches (T-19 D). */
export const GetSubject={
// async getSubject(  params: GetSubjectParams):Promise<SubjectApiResponse[]>{
// const response=apiClient.get<SubjectApiResponse[]>("/SubjectService",{params});
// return (await response).data;
// }
async getSubject(  params: GetSubjectParams):Promise<SubjectApiResponse[]>{
const response=apiClient.get<SubjectApiResponse[]>("/Subject/get-subjects",{params});
return (await response).data;
}
}