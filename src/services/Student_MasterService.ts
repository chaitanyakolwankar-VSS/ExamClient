// services/CourseMasterService.ts
import apiClient from "../api/Client";

export interface StudentMasterDto {
  name: string;
  courseId: string;
}

export const StudentMasterService = {
  async GetData(): Promise<StudentMasterDto[]> {
    const ayid = localStorage.getItem("AYID") ?? "";
    const response = await apiClient.get<StudentMasterDto[]>(`/StudentMaster/GetData?ayid=${ayid}`);
    return response.data;
  },

   SaveStudent: async (payload: any) => {
    return apiClient.post("/StudentMaster/SaveStudent", payload);
  },
   GetByCourse: async (courseId: string) => {
    const ayid = localStorage.getItem("AYID") ?? "";
    const res = await apiClient.get(`/StudentMaster/Getbycourse?courseId=${courseId}&ayid=${ayid}`);
    return res.data;
  },
  SearchStudents(payload: any) {
    const ayid = localStorage.getItem("AYID") ?? "";
    return apiClient.post("/StudentMaster/SearchStudents", { ...payload, AYID: ayid })
      .then(res => res.data);
  }
};


 

 



 

 