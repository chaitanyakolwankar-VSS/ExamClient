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
    /** The configured head row (the key resolution limits are stored against). */
    subjectCreditId: string;
    headName: string;
    marks: string;
    outOf: number;
    passing: number;
    grace?: string;
    isAbsent: boolean;
    /** Derived server-side: whether this head clears its own passing marks. */
    isPassed: boolean;
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
    /** Used by the server for the locked-exam check. */
    examId: string;
    subjectId: string;
}

/** One configured head of a subject, as shown in the resolution dialog. */
export interface ResolutionConfigHead {
    subjectCreditId: string;
    /** Positional key, "H1"/"H2". */
    head: string;
    /** Display label, e.g. "ESE". */
    headType: string;
    outOf: number;
    passing: number;
    /** Saved limit; 0 = off. */
    limit: number;
    /** Head-wise only: the shortfall of each student failing this head on raw marks (ascending). */
    deficits: number[];
}

export interface ResolutionConfigSubject {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    passingStrategy: PassingStrategy;
    passPercentage?: number | null;
    outOfTotal: number;
    requiredToPass: number;
    heads: ResolutionConfigHead[];
    /** Combined only: the head currently carrying the limit. */
    selectedHeadSubjectCreditId?: string | null;
    studentCount: number;
    /** Students failing the subject on raw marks. */
    failingCount: number;
    /** Failing students the SAVED limits would condone. */
    withinLimitCount: number;
    /** Students holding a resolution bump after the last Process Results. */
    appliedCount: number;
    /** Combined only: subject deficit of each failing student with no absent head (ascending). */
    deficits: number[];
}

export interface ResolutionConfig {
    examId: string;
    isLocked: boolean;
    subjects: ResolutionConfigSubject[];
}

export interface ResolutionConfigRequest {
    branchId: string;
    semId: string;
    pattern: string;
    examId: string;
}

export interface SaveResolutionConfigRequest {
    examId: string;
    /** One entry per head. Combined subjects carry the limit on exactly one head, 0 on the others. */
    limits: { subjectCreditId: string; limit: number }[];
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

    getResolutionConfig: async (request: ResolutionConfigRequest): Promise<ApiResponse<ResolutionConfig>> => {
        try {
            const response = await Client.get<ApiResponse<ResolutionConfig>>("/MarksEntry/ResolutionConfig", { params: request });
            return response.data;
        } catch (error) {
            console.error("Error fetching resolution config:", error);
            throw error;
        }
    },

    saveResolutionConfig: async (request: SaveResolutionConfigRequest): Promise<ApiResponse<unknown>> => {
        try {
            const response = await Client.post<ApiResponse<unknown>>("/MarksEntry/ResolutionConfig", request);
            return response.data;
        } catch (error) {
            console.error("Error saving resolution config:", error);
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
