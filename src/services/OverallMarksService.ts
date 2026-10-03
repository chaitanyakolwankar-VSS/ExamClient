import Client from "../api/Client.ts";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface ProcessResultRequest {
    branchId: string;
    semId: string;
    pattern: string;
    examId: string;
    studentId?: string;
    isSingleStudent: boolean;
}

export interface ResultData {
    studentId: string;
    studentName: string;
    seatNo: string;
    totalMarks: number;
    outOf: number;
    percentage: number;
    sgpi: number;
    cgpi: number;
    resultStatus: string; // Pass, Fail, etc.
    remarks: string;
    subjectMarks: Record<string, string>; // subjectId -> "marks/outOf (grace)"
}

export const OverallMarksService = {
    processResults: async (request: ProcessResultRequest): Promise<ApiResponse<object>> => {
        try {
            const response = await Client.post<ApiResponse<object>>("/OverallMarks/Process", request);
            return response.data;
        } catch (error) {
            console.error("Error processing results:", error);
            throw error;
        }
    },

    getResults: async (request: ProcessResultRequest): Promise<ApiResponse<ResultData[]>> => {
        try {
            const response = await Client.post<ApiResponse<ResultData[]>>("/OverallMarks/Results", request);
            return response.data;
        } catch (error) {
            console.error("Error fetching results:", error);
            throw error;
        }
    },

    exportExcel: async (request: ProcessResultRequest): Promise<void> => {
        try {
            const response = await Client.post("/OverallMarks/ExportExcel", request, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Results_${request.examId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting excel:", error);
            throw error;
        }
    },

    exportPdf: async (request: ProcessResultRequest): Promise<void> => {
        try {
            const response = await Client.post("/OverallMarks/ExportPdf", request, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Results_${request.examId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting pdf:", error);
            throw error;
        }
    }
};
