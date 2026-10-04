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
  /** Sets a student's photo and/or signature (data: URLs); other fields are untouched. */
  UpdateImages: async (studentId: string, images: { photo?: string | null; sign?: string | null }) => {
    const res = await apiClient.put<{ photoUrl: string | null; signUrl: string | null }>("/StudentMaster/UpdateImages", {
      studentId,
      photo: images.photo ?? null,
      sign: images.sign ?? null,
    });
    return res.data;
  },
  SearchStudents(payload: any, ayid: string) {
    return apiClient.post("/StudentMaster/SearchStudents", { ...payload, AYID: ayid })
      .then(res => res.data);
  }
};


 

 



 

 