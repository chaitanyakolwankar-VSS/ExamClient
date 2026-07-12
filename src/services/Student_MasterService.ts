// services/CourseMasterService.ts
import apiClient from "../api/Client";

export interface StudentMasterDto {
  name: string;
  courseId: string;
}

export const StudentMasterService = {
  async GetData(): Promise<StudentMasterDto[]> {
    const response = await apiClient.get<StudentMasterDto[]>("/StudentMaster/GetData");
    return response.data;
  },

   SaveStudent: async (payload: any) => {
    return apiClient.post("/StudentMaster/SaveStudent", payload);
  },
   GetByCourse: async (courseId: string) => {
    const res = await apiClient.get(`/StudentMaster/Getbycourse?courseId=${courseId}`);
    return res.data;
  },
  SearchStudents(payload: any) {
  return apiClient.post("/StudentMaster/SearchStudents", payload)
    .then(res => res.data);
}
};


 

 