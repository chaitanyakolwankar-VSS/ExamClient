import apiClient from "../api/Client";

/* 🔹 Subject request model (what we send to backend) */
export interface Subject {
  subjectName: string;
  subjectCode: string;
  semId: string;
  semName: string
  pattern: string;
  courseID: string;
}
/* 🔹 API response model (what backend returns) */
export interface SaveSubjectResponse {
  success: boolean;
  message: string;
  data?: Subject;
}

export type ExamTypeKey = "ESE" | "PR" | "OR";
export type InternalTypeKey = "IA" | "TW";

export interface CreditItem {
  creditId?: string;
  creditNo: string;
  examType: ExamTypeKey[];
  internalType: InternalTypeKey[];
  examOutOf: string;
  examPassing: string;

  internalOutOf: string;
  internalPassing: string;

  passingPercentage: string;
}

export interface SaveCreditsPayload {
  subjectId: string;
  ayid: string;
  credits: CreditItem[];
}
export interface Response {
  success: boolean;
  message: string;
}

export interface GetCredits{
   subjectId: string;
  ayid: string;
}
export interface DeleteItem {
  creditId?: string;
}
export interface DeleteCredits{
   subjectId: string;
  ayid: string;
  credits: DeleteItem[];
}
export interface DeleteSubject{
  subjectId:string;
}
export interface PreviousCredits{
  subjectId: string;
  preAyid: string; // previous year
  ayid: string;    // current year
}
export interface VerifyCreditAccessPayload {
  password: string;
}

export const SubjectService = {
 verifyCreditAccess: async (
    payload: VerifyCreditAccessPayload
  ): Promise<Response> => {
    const { data } = await apiClient.post("/Subject/verify-access", payload);
    return data;
  },

  // 👇 Save the Subjects
  async saveSubject(subject: Subject): Promise<SaveSubjectResponse> {
    const response = await apiClient.post<SaveSubjectResponse>(
      "/Subject/save-subjects",
      subject
    );
    return response.data;
  },

  // 👇 Save the credits
  async saveCredits(
    payload: SaveCreditsPayload
  ): Promise<Response> {
    const response = apiClient.post<Response>(
      "/Subject/save-credits",
      payload
    );
    return (await response).data;
  },
    // 👇 Check the credits
  async CheckCredits(params:GetCredits):Promise<Response> {
    const response=await apiClient.get<Response>("/Subject/check-credits",{params});
   return response.data;
  },

  // 👇 Get the credits
  async getCreditsBySubject(params:GetCredits):Promise<CreditItem[]> {
    const response=await apiClient.get<CreditItem[]>("/Subject/get-credits",{params});
   return response.data;
  },

    // 👇 Get the Previous credits
  async getPreviousCredits(params:GetCredits):Promise<Response> {
    const response=await apiClient.get<Response>("/Subject/get-previous-credits",{params});
 return response.data;
  },

 // 👇 Update the credits
  async UpdateCredits(
    payload: SaveCreditsPayload
  ): Promise<Response> {
    const response = apiClient.put<Response>(
      "/Subject/Update-credits",
      payload
    );
    return (await response).data;
  },
   // 👇 Delete the credits
  async DeleteSubject(
    payload: DeleteSubject
  ): Promise<Response> {
    const response = apiClient.delete<Response>(
      "/Subject/Delete-subject",
     {
      data: payload, 
    }
    );
    return (await response).data;
  },

   // 👇 Delete the credits
  async DeleteCredits(
    payload: DeleteCredits
  ): Promise<Response> {
    const response = apiClient.delete<Response>(
      "/Subject/Delete-credits",
     {
      data: payload, 
    }
    );
    return (await response).data;
  },


   async copyPreviousCredits(
    payload: PreviousCredits
  ) : Promise<Response> {
    const res = await apiClient.post(
      "/Subject/copy-previous-credits",
      payload
    );
    return res.data;
  }

}