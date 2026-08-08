import apiClient from "../api/Client";

 export interface Options {
   value: string;
   label: string;
 }
export interface FeeItem {
  srNo: string;
  amount: number;
}

export interface SaveFeesPayload {
  ayid: string;
  examId: string;
  examType: string;
  semId: string;
  courseID: string;
  category?: string;
  subCount: string;
  amount: FeeItem[];
}

export interface FeesResponse {
  success: boolean;
  message: string;
}

export interface GetFeesParams {
  fessdedefineid: string;
  examId?: string;
  semId?: string;
  examType?: string;
  branch?: string;
  category?: string;
  subcount: number;
  amount: number;
}


export interface DeleteFeesPayload {
examId: string;
  category: string;
  courseId: string;
}



export const FeesService = {

  async saveFees(payload: SaveFeesPayload): Promise<FeesResponse> {
    const response = await apiClient.post<FeesResponse>("/Fees/save-fees", payload);
    return response.data;
  },

  
async getFees(examId: string, category: string, courseId: string, semId: string, examType: string): Promise<any[]> {
  const response = await apiClient.get("/Fees/get-fees", {
    params: { examId, category, courseId, semId, examType }
  });
  return response.data;
},

async deleteFees(payload: DeleteFeesPayload): Promise<FeesResponse> {
  const response = await apiClient.delete<FeesResponse>("/Fees/delete-fees", { 
    params: payload 
  });
  return response.data;
},
 
  async getBranchOptions(): Promise<Options[]> {
    const response = await apiClient.get<Options[]>("/Fees/get-branch");
    return response.data;
  },

async getExamOptions(ayid: string,courseId?: string): Promise<Options[]> {
  const response = await apiClient.get<Options[]>("/Fees/get-exams", {
    params: { ayid, courseId }
  });
  return response.data;
},


  async getCategoryOptions(): Promise<Options[]> {
    const response = await apiClient.get<Options[]>("/Fees/get-categories");
    return response.data;
  },
};
 
