import apiClient from "../api/Client";


export interface CourseApiResponse {
  courseid: string;
  coursename: string;
}

export const CourseService = {
  async getCourse(): Promise<CourseApiResponse[]> {
    const response = await apiClient.get<CourseApiResponse[]>(
      "/CourseService"
    );
    return response.data;
  },
};