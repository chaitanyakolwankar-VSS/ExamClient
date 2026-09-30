import apiClient from "../api/Client";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * The ordinance rule set governing this screen, echoed by the server so the operator can see
 * what is being applied and why a cell is locked. There is no separate assignment config --
 * this is resolved from RuleSet / Rule / RuleAction.
 */
export interface AtktPolicy {
    ruleSetId: string;
    ruleSetName: string;
    examType?: string | null;
    /** "ATKT" | "Revaluation". */
    mode: string;
    /** False when no rule set governs this exam type and the built-in fallback is in force. */
    isConfigured: boolean;
    /** Subject statuses in scope. Empty means every subject. */
    subjectScopes: string[];
    /** Heads that get re-attempted. Empty means every head of a selected subject. */
    headTypes: string[];
    /** From RuleAction.MaxTargetCount. Null means no cap. */
    maxSubjectsPerStudent?: number | null;
    /** Names of the rules that grant assignment. */
    rules: string[];
}

export interface AtktExamOption {
    examId: string;
    examName: string;
    examType?: string | null;
    isRevaluation: boolean;
    revaluationForExamId?: string | null;
    isLocked: boolean;
}

/** One head of one subject column, carrying its own thresholds. */
export interface AtktHead {
    head: string;
    headType: string;
    outOf: number;
    pass: number;
}

/** A subject column of the matrix. Nothing about the subject grid is hard-coded client side. */
export interface AtktSubjectColumn {
    subjectId: string;
    creditsId: string;
    subjectCode: string;
    subjectName: string;
    passingStrategy: string;
    outOfTotal: number;
    requiredToPass: number;
    order: number;
    heads: AtktHead[];
}

/** Per-subject state for one student. */
export interface AtktCell {
    subjectId: string;
    creditsId: string;
    /** "Passed" | "Failed" | "Absent" | "NotAttempted". */
    status: string;
    obtainedTotal: number;
    outOfTotal: number;
    requiredToPass: number;
    /** Marks short of passing. 0 when cleared. */
    deficit: number;
    isAbsent: boolean;
    /** Whether the operator may tick this cell, per the governing rule. */
    selectable: boolean;
    /** Current selection -- true when the student is appearing for this subject. */
    selected: boolean;
    /** Human-readable explanation when selectable is false. */
    reason?: string | null;
}

export interface AtktStudentRow {
    stdMstId: string;
    studentId: string;
    studentName: string;
    seatNo?: string | null;
    sourceMarksId?: string | null;
    sourceExamId?: string | null;
    sourceExamName?: string | null;
    /** Non-null once the student has been assigned to the target exam. */
    targetMarksId?: string | null;
    isAssigned: boolean;
    /** Legacy "No. of ATKT" -- subjects not cleared in the source attempt. */
    backlogCount: number;
    canDelete: boolean;
    deleteBlockedReason?: string | null;
    cells: AtktCell[];
}

/** Filter block shared by every read and write on this screen. */
export interface AtktMatrixRequest {
    courseId: string;
    ayid: string;
    semester: string;
    pattern: string;
    /** "ATKT" | "Revaluation". */
    mode: string;
    /** Required for revaluation; for ATKT the student's latest attempt is used. */
    sourceExamId?: string | null;
    targetExamId: string;
    /** false = list candidates not yet assigned; true = list students already assigned. */
    editMode: boolean;
}

export interface AtktMatrixResponse {
    success: boolean;
    message: string;
    policy?: AtktPolicy | null;
    columns: AtktSubjectColumn[];
    students: AtktStudentRow[];
}

export interface AtktStudentSelection {
    stdMstId: string;
    /** Subjects the student is appearing for. Empty removes an existing assignment. */
    subjectIds: string[];
}

export interface AtktSaveRequest {
    filter: AtktMatrixRequest;
    students: AtktStudentSelection[];
}

export interface AtktSaveResult {
    studentsAssigned: number;
    studentsUpdated: number;
    studentsRemoved: number;
    subjectsRegistered: number;
    skipped: string[];
}

export const AtktRevalExamService = {
    async getSourceExams(params: {
        courseId: string;
        ayid: string;
        semester: string;
        pattern: string;
        mode: string;
    }): Promise<AtktExamOption[]> {
        const response = await apiClient.get<AtktExamOption[]>(
            "/AtktRevalExam/source-exams", { params }
        );
        return response.data;
    },

    async getTargetExams(params: {
        courseId: string;
        ayid: string;
        semester: string;
        mode: string;
        sourceExamId?: string;
    }): Promise<AtktExamOption[]> {
        const response = await apiClient.get<AtktExamOption[]>(
            "/AtktRevalExam/target-exams", { params }
        );
        return response.data;
    },

    async getMatrix(request: AtktMatrixRequest): Promise<AtktMatrixResponse> {
        const response = await apiClient.post<AtktMatrixResponse>(
            "/AtktRevalExam/matrix",
            request
        );
        return response.data;
    },

    async save(request: AtktSaveRequest): Promise<ApiResponse<AtktSaveResult>> {
        const response = await apiClient.post<ApiResponse<AtktSaveResult>>(
            "/AtktRevalExam/save",
            request
        );
        return response.data;
    },

    async assignAll(request: { filter: AtktMatrixRequest }): Promise<ApiResponse<AtktSaveResult>> {
        const response = await apiClient.post<ApiResponse<AtktSaveResult>>(
            "/AtktRevalExam/assign-all",
            request
        );
        return response.data;
    },

    async deleteAssignment(request: { filter: AtktMatrixRequest; stdMstId: string }): Promise<ApiResponse<null>> {
        const response = await apiClient.delete<ApiResponse<null>>(
            "/AtktRevalExam/assignment", { data: request }
        );
        return response.data;
    },

    async exportExcel(request: { filter: AtktMatrixRequest; exportType: "All" | "SeatNo" }): Promise<void> {
        try {
            const response = await apiClient.post("/AtktRevalExam/export", request, {
                responseType: 'blob'
            });

            // A failure comes back as JSON even though we asked for a blob: saving that
            // verbatim would hand the operator a corrupt .xlsx instead of the reason.
            const blob: Blob = response.data;
            if (blob.type === "application/json") {
                const text = await blob.text();
                let message = "Failed to export the file.";
                try {
                    const parsed = JSON.parse(text);
                    message = parsed.message || parsed.title || message;
                } catch {
                    message = text || message;
                }
                throw new Error(message);
            }

            const disposition = response.headers["content-disposition"] as string | undefined;
            const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
            const fileName = match
                ? decodeURIComponent(match[1])
                : `AtktRevalExam_${request.exportType}.xlsx`;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting excel:", error);
            throw error;
        }
    },
}
