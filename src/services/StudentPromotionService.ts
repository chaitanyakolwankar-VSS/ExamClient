import apiClient from "../api/Client";
export interface PromotionRequest {
    CourseId: string;
    Semester: string;
    Ayid: string;
    PreviousAyid: string;
    Pattern: string;
}
export interface StudentData {
  studentId: string;
  studentName: string;
  semester: string;
  branch: string;
  academicYear: string;
}
export interface EligibilityAssignedStudent {
    stdMstId: string;
    studentId: string;
    studentName: string;
    eligibility: boolean;
}
export interface EligibilityUnAssignedStudent {
    stdMstId: string;
    studentId: string;
    studentName: string;
    eligibility: boolean;
    credits:string;
    creditGradePoint:string;
}

export interface PromotionResponse {
    assignedStudents: EligibilityAssignedStudent[];
    unassignedStudents: EligibilityUnAssignedStudent[];
}

export interface EligibleStudent {
    stdMstId: string;
    studentID: string;
    isEligible: boolean;
}

export interface UpdateEligibleStudent {
    stdMstId: string;
    studentID: string;
    eligibility: boolean;
}
export interface SaveEligibilityRequest {
    examInfo: PromotionRequest;
    stduents: EligibleStudent[];
}
export interface UpdateEligibilityRequest {
    examInfo: PromotionRequest;
    stduents: UpdateEligibleStudent[];
}
export const StudentPromotionService = {
    GetStudentData: async (
  studentId: string,
  ayid: string
): Promise<StudentData[]> => {
  const response = await apiClient.get<StudentData[]>(
    "/StudentPromotion/GetStudentData",
    {
      params: {
        StudentId: studentId,
        Ayid: ayid,
      },
    }
  );

  return response.data;
},
   GetStudents: async (request: PromotionRequest): Promise<PromotionResponse> => {
        const response = await apiClient.get<PromotionResponse>(
            "/StudentPromotion/GetAssignedStudent",
            {
                params: request,
            }
        );

        return response.data;
    },
     SaveEligibility: async (request: SaveEligibilityRequest) => {
        const response = await apiClient.post("/StudentPromotion/SaveEligibility", request);
        return response.data;
    },
      UpdateEligibility: async (request: UpdateEligibilityRequest) => {
        const response = await apiClient.put(
            "/StudentPromotion/UpdateEligibility",
            request
        );

        return response.data;
    }
};