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
  generationType: string;
  includeHistory?: boolean;
  resultDate?: string;
  noRleForFail?: boolean;
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
      link.setAttribute("download", params.fileName ? `${params.fileName}.pdf` : `Gazette_${params.examId}.pdf`);
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
      link.setAttribute("download", params.fileName ? `${params.fileName}.xlsx` : `Gazette_${params.examId}.xlsx`);
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

  async downloadBulkMarksheet(params: DownloadBulkMarksheetParams): Promise<void> {
    try {
      const response = await apiClient.get("/Report/bulk-marksheet", {
        params,
        responseType: "blob", 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BulkMarksheet_${params.generationType}_${params.examId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Bulk Marksheet", error);
      throw error;
    }
  },
};
