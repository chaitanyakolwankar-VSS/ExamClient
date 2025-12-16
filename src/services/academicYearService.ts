import apiClient from "../api/Client";

// This matches the DTO you created in C#
export interface AcademicYearResponse {
  ayid: string;         
  shortDuration: string; // "24-25"
  isCurrent: boolean;
}

export const academicYearService = {
  async getAllYears(): Promise<AcademicYearResponse[]> {
    // Calls GET http://localhost:5059/api/AcademicYears
    const response = await apiClient.get<AcademicYearResponse[]>('/AcademicYear');
    return response.data;
  },
};