import Client from "../api/Client.ts";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface SemesterOption {
    value: string;
    label: string;
}

export interface ExamOption {
    examId: string;
    examCode: string;
    examName: string;
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
    getSemesters: async (): Promise<SemesterOption[]> => {
        return [
            { value: "Sem-1", label: "Semester I" },
            { value: "Sem-2", label: "Semester II" },
            { value: "Sem-3", label: "Semester III" },
            { value: "Sem-4", label: "Semester IV" },
            { value: "Sem-5", label: "Semester V" },
            { value: "Sem-6", label: "Semester VI" },
            { value: "Sem-7", label: "Semester VII" },
            { value: "Sem-8", label: "Semester VIII" },
        ];
    },

    getExams: async (branchId: string, semId: string, pattern: string): Promise<ExamOption[]> => {
        try {
            const response = await Client.get<ApiResponse<ExamOption[]>>(`/OverallMarks/Exams`, {
                params: { branchId, semId, pattern }
            });
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error("Error fetching exams:", error);
            return [];
        }
    },

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
    }
};
