import apiClient from "../api/Client";

export interface DownloadGazetteParams {
  examId: string;
  semId: string;
  pattern: string;
  groupId?: string;
  roundNumber?: boolean;
  noRleForFail?: boolean;
  cgpiForFail?: boolean;
  sgpiForFail?: boolean;
  mergeExam?: boolean;
  mergedExamId?: string;
  studentsPerPage?: number;
  subjectsPerRow?: number;
  cxgSems?: number[];
  gpaSems?: number[];
  fileName?: string;
}

export interface DownloadMarksheetParams {
  studId: string;
  examId: string;
  semId: string;
  pattern: string;
  includeHistory?: boolean;
  resultDate?: string;
  noRleForFail?: boolean;
}

export interface DownloadBulkMarksheetParams {
  examId: string;
  semId: string;
  pattern: string;
  ayid: string;
  courseId: string;
  generationType: string;
  includeHistory?: boolean;
  resultDate?: string;
  noRleForFail?: boolean;
}

/** One configured head of a subject, e.g. "ESE: 45/70" (grace is the ordinance symbol, when any). */
export interface MarksheetHead {
  head: string;
  max: number;
  marks: string;
  grace: string;
}

export interface MarksheetSubject {
  subjectCode: string;
  subjectName: string;
  sortOrder?: number | null;
  credits: number;
  heads: MarksheetHead[];
  totalMax: number;
  passingMax: number;
  /** Already formatted by the API (may carry a grace symbol). */
  totalObtained: string;
  grade: string;
  grace?: string | null;
  gradePoint: number;
  earnedGradePoints: number;
}

export interface MarksheetSemesterRecord {
  semesterName: string;
  credits: number;
  earnedGradePoints: number;
  sgpi: number;
}

/** The marksheet exactly as the PDF prints it (MarksheetReportDto on the API). */
export interface MarksheetData {
  collegeName: string;
  studentName: string;
  seatNo: string;
  prn: string;
  studentId: string;
  programName: string;
  examName: string;
  semester: string;
  /** ISO date; the sheet prints it as dd/MM/yyyy. */
  resultDate: string;
  subjects: MarksheetSubject[];
  totalObtained: number;
  totalMax: number;
  totalCredits: number;
  creditsEarned: number;
  sgpi: number;
  cgpi: number | null;
  cumulativeGrade: number | null;
  remark: string;
  pastSemesters: MarksheetSemesterRecord[];
}

/** College letterhead and signature images for the preview card; stored paths read via GET /api/Files. */
export interface MarksheetBranding {
  collegeName: string;
  banner: string | null;
  logo: string | null;
  controllerSignature: string | null;
  principalSignature: string | null;
}

export const ReportService = {
  async downloadGazette(params: DownloadGazetteParams): Promise<void> {
    try {
      const response = await apiClient.post("/Report/gazette", params, {
        responseType: "blob", // Important for downloading files
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        params.fileName
          ? `${params.fileName}.pdf`
          : `Gazette_${params.examId}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Gazette", error);
      throw error;
    }
  },

  async downloadGazetteExcel(params: DownloadGazetteParams): Promise<void> {
    try {
      const response = await apiClient.post("/Report/gazette/excel", params, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        params.fileName
          ? `${params.fileName}.xlsx`
          : `Gazette_${params.examId}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Gazette Excel", error);
      throw error;
    }
  },

  async downloadMarksheet(params: DownloadMarksheetParams): Promise<void> {
    try {
      const response = await apiClient.get("/Report/marksheet", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Marksheet_${params.studId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Marksheet", error);
      throw error;
    }
  },

  async downloadBulkMarksheet(
    params: DownloadBulkMarksheetParams,
  ): Promise<void> {
    try {
      const response = await apiClient.get("/Report/bulk-marksheet", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BulkMarksheet_${params.generationType}_${params.examId}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // With responseType "blob" the API's error body arrives as a Blob too; turn it back into JSON so the
      // caller can show the API's message.
      const response = (error as { response?: { data?: unknown } }).response;
      if (response?.data instanceof Blob) {
        try {
          response.data = JSON.parse(await response.data.text());
        } catch {
          /* not JSON: leave it as it is */
        }
      }

      throw error;
    }
  },

  /**
   * The marksheet as data for the preview card. The API builds it with the same code as the PDF,
   * so what the staff see is what the downloaded file prints.
   */
  async getMarksheetData(params: DownloadMarksheetParams): Promise<MarksheetData> {
    const response = await apiClient.get<MarksheetData>(
      "/Report/marksheet/data",
      { params },
    );
    return response.data;
  },

  /** College letterhead and signature images (stored paths) for the preview card. */
  async getMarksheetBranding(): Promise<MarksheetBranding> {
    const response = await apiClient.get<MarksheetBranding>(
      "/Report/marksheet/branding",
    );
    return response.data;
  },
};
