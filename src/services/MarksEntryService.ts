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

export type PassingStrategy = "HeadWise" | "Combined";

export interface StudentHeadMarks {
    studentMarksId: string;
    creditId: string;
    /** The configured head row; resolution limits are keyed on this. */
    subjectCreditId: string;
    headName: string;
    marks: string;
    outOf: number;
    passing: number;
    grace?: string;
    isAbsent: boolean;
    /** Derived server-side: whether this head clears its own passing marks. */
    isPassed: boolean;
    /** Condonation limit configured for this head on this exam. */
    resolution?: number | null;
    isEnabled: boolean;
    /** True when carried forward from the source attempt (ATKT/Revaluation): locked, mark fixed. */
    isCarryForward?: boolean;
}

export interface MarksEntryData {
    marksId: string;
    studentId: string;
    studentName: string;
    seatNo: string;
    rank: number;
    /** Combined subjects are judged on the sum of their heads, not per head. */
    passingStrategy: PassingStrategy;
    passPercentage?: number | null;
    heads: StudentHeadMarks[];
}

export interface SaveMarksRequest {
    updates: {
        studentMarksId: string;
        marks: string;
    }[];
    rank: number;
    /** Scopes the resolution pass, which spans a subject's heads even when no mark changed. */
    examId: string;
    subjectId: string;
    /** Resolution limits per head; the backend upserts these into ResolutionMaster. */
    resolutions: {
        subjectCreditId: string;
        resolution: number | null;
    }[];
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
    },

    exportTemplate: async (request: MarksEntryFilterRequest): Promise<Blob> => {
        try {
            const response = await Client.post("/MarksEntry/ExportTemplate", request, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error("Error exporting template:", error);
            throw error;
        }
    },

    // importExcel: async (examId: string, subjectId: string, file: File): Promise<ApiResponse<any>> => {
    //     try {
    //         const formData = new FormData();
    //         formData.append("file", file);

    //         const response = await Client.post<ApiResponse<any>>(`/MarksEntry/Import?examId=${examId}&subjectId=${subjectId}`, formData, {
    //             headers: {
    //                 'Content-Type': 'multipart/form-data'
    //             }
    //         });
    //         return response.data;
    //     } catch (error) {
    //         console.error("Error importing excel:", error);
    //         throw error;
    //     }
    // }
};
