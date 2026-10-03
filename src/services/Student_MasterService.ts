// services/CourseMasterService.ts
import apiClient from "../api/Client";

// The academic year is passed in by the screen (useAcademicYear().ayid) instead of being read from localStorage.
export const StudentMasterService = {
   SaveStudent: async (payload: any) => {
    return apiClient.post("/StudentMaster/SaveStudent", payload);
  },
   GetByCourse: async (courseId: string, ayid: string) => {
    const res = await apiClient.get(`/StudentMaster/Getbycourse?courseId=${courseId}&ayid=${ayid}`);
    return res.data;
  },
  SearchStudents(payload: any, ayid: string) {
    return apiClient.post("/StudentMaster/SearchStudents", { ...payload, AYID: ayid })
      .then(res => res.data);
  }
};


 

 



 

 