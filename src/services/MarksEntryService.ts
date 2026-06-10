import Client from "../api/Client.ts";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface MarksEntryFilterRequest {
    branchId: string;
    semId: string;
    pattern: string;
    examId: string;
    subjectId: string;
    studentId?: string;
}

export interface StudentHeadMarks {
    studentMarksId: string;
    creditId: string;
    headName: string;
    marks: string;
    outOf: number;
    passing: number;
    grace?: string;
    remark?: string;
    isEnabled: boolean;
}

export interface MarksEntryData {
    marksId: string;
    studentId: string;
    studentName: string;
    seatNo: string;
    rank: number;
    heads: StudentHeadMarks[];
}

export interface SaveMarksRequest {
    updates: {
        studentMarksId: string;
        marks: string;
    }[];
    rank: number;
}

export const MarksEntryService = {
    getMarksData: async (request: MarksEntryFilterRequest): Promise<ApiResponse<MarksEntryData[]>> => {
        try {
            const response = await Client.post<ApiResponse<MarksEntryData[]>>("/MarksEntry/Data", request);
            return response.data;
        } catch (error) {
            console.error("Error fetching marks data:", error);
            throw error;
        }
    },

    saveMarks: async (request: SaveMarksRequest): Promise<ApiResponse<any>> => {
        try {
            const response = await Client.post<ApiResponse<any>>("/MarksEntry/Save", request);
            return response.data;
        } catch (error) {
            console.error("Error saving marks:", error);
            throw error;
        }
    }
};
