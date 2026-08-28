import apiClient from "../api/Client";
import axios from "axios";

export interface StatisticalReportRequest {
  courseId: string;
  academicYearId: string;
  examId: string;
  semesterId: string;
  pattern: string;
}

export interface StatisticalReportRow {
  srNo: number;
  subjectCode: string;
  subjectName: string;
  totalAppeared: number;
  totalPassed: number;
  passingPercentage: number;
  passedBetween40And60: number;
  passedAtOrAbove60: number;
  graceMarksAwarded: number;
}

export interface StatisticalReport {
  collegeName: string;
  collegeAddress?: string;
  courseName: string;
  academicYearName: string;
  semesterName: string;
  pattern: string;
  examName: string;
  generatedAt: string;
  rows: StatisticalReportRow[];
  totalStudentsAppeared: number;
  totalStudentsPassed: number;
  overallPassingPercentage: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

async function readBlobError(blob: Blob): Promise<string> {
  try {
    const body = JSON.parse(await blob.text()) as Partial<ApiResponse<unknown>>;
    return body.message || "Unable to export the statistical report.";
  } catch {
    return "Unable to export the statistical report.";
  }
}

export const StatisticalReportService = {
  async getData(request: StatisticalReportRequest): Promise<ApiResponse<StatisticalReport>> {
    const response = await apiClient.post<ApiResponse<StatisticalReport>>("/StatisticalReport/data", request);
    return response.data;
  },

  async exportExcel(request: StatisticalReportRequest, fileName: string): Promise<void> {
    try {
      const response = await apiClient.post("/StatisticalReport/export", request, { responseType: "blob" });
      const contentType = String(response.headers["content-type"] || "");
      if (contentType.includes("application/json")) {
        throw new Error(await readBlobError(response.data as Blob));
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        throw new Error(await readBlobError(error.response.data));
      }
      throw error;
    }
  },
};
