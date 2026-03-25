

import apiClient from "../api/Client";
import { Response } from "./Response";


export type SemesterData = {
  cg: string;
  credit: string;
  kT_Theory: string;
  kT_Others: string;
};

export interface EligibilityStudents {
  serialNo: string;
  studentId: string;
  studentName: string;
  semesters: Record<number, SemesterData>; // 👈 key = sem number
}
export interface GetEligibilityStudents
 {
     Ayid:string;
 CourseId :string;
    Semester :string;
 }
export const EligibilityService={

async getstudents(params:GetEligibilityStudents):Promise<EligibilityStudents[]>{
  const response=await apiClient.get<EligibilityStudents[]>("/Eligibility/get-Students",{params}); 
  return response.data;
},
async SaveEligibility(data:EligibilityStudents[]):Promise<Response>{
  const response = await apiClient.post<Response>("/Eligibility/save-Eligibility", data);
        return response.data;
}

}