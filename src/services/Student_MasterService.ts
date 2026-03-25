// services/CourseMasterService.ts
import apiClient from "../api/Client";

export interface StudentMasterDto {
  name: string;
  courseId: string;
   studentPRN: string;
 
}

export interface SelectOption {
  value: string;
  label: string;
}

 export interface FetchData {
  name: string;
  studentId: string;
  firstName: string;
  lastName: string;
  studentName: string;
  semesterId: string;
  studentPRN: string;
 
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
},
GetStudentById: async (studentId: string) => {
  const res = await apiClient.get(`/StudentMaster/GetStudentById?studentId=${studentId}`);
  return res.data;
},
GetStudentExams: async (studentId: string) => {
  const res = await apiClient.get(`/StudentMaster/GetStudentExams?studentId=${studentId}`);
  return res.data;
},
UpdateStudent: async (payload: any) => {
  return apiClient.put("/StudentMaster/UpdateStudent", payload);
},
DeleteStudent: async (studentId: string) => {
  return apiClient.delete(`/StudentMaster/DeleteStudent?studentId=${studentId}`);
},
DownloadExcelTemplate: async (courseId: string, semesterId: string) => {
  return apiClient.get(
    `/StudentMaster/DownloadExcelTemplate?courseId=${courseId}&semesterId=${semesterId}`,
    { 
      responseType: "blob",
      
    }
  );
},
ImportStudents: async (file: File, courseId: string, semesterId: string) => {
  const formData = new FormData();
  formData.append("File", file);
  formData.append("CourseId", courseId);
  formData.append("SemesterId", semesterId);

  return apiClient.post("/StudentMaster/ImportStudents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
},

};


 

 