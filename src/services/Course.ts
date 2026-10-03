import apiClient from "../api/Client";


export interface CourseApiResponse {
  courseid: string;
  coursename: string;
}

/** @deprecated Use useCourses() from src/data. Kept with its API endpoint for team branches (T-19 D). */
export const CourseService = {
  async getCourse(): Promise<CourseApiResponse[]> {
    const response = await apiClient.get<CourseApiResponse[]>(
      "/CourseService"
    );
    return response.data;
  },
};