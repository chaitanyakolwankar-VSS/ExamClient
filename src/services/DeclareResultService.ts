import apiClient from "../api/Client";
import { Response } from "./Response";

export interface GetDeclareExam {
  CourseId: string;
  Ayid: string;
  Semester: string;
  pattern: string;
}

export interface GetDeclareExamTable {
  CourseId: string;
  Ayid: string;
  Semester: string;
  ExamId: string;
  Pattern: string;
}

export interface DeclareExamApiResponse {
  examId: string;
  examname: string;
  isDeclare: boolean;
  declareDate?: string | null;
  pattern: string;
  /** False when no DeclareResult row exists yet (the result is "not declared"). */
  hasRecord?: boolean;
}

export interface SaveDeclareExam {
  ExamId: string;
  CourseId: string;
  Ayid: string;
  Semester: string;
  DeclareDate: string;
  IsDeclare: boolean;
}

export interface UpdateDeclareExam {
  ExamId: string;
  IsDeclare: boolean;
  DeclareDate?: string;
}

export interface ToggleDeclareResult {
  ExamId: string;
  CourseId: string;
  Ayid: string;
  Semester: string;
  Pattern: string;
  DeclareDate: string | null;
  IsDeclare: boolean;
}

export const DeclareResultService = {
  async GetExam(params: GetDeclareExam): Promise<DeclareExamApiResponse[]> {
    const response = await apiClient.get<DeclareExamApiResponse[]>(
      "/DeclareResult/get-exam",
      { params },
    );
    return response.data;
  },

  async GetTableExam(
    params: GetDeclareExamTable,
  ): Promise<DeclareExamApiResponse[]> {
    const response = await apiClient.get<DeclareExamApiResponse[]>(
      "/DeclareResult/get-table-exam",
      { params },
    );
    return response.data;
  },

  async SaveDeclareExam(payload: SaveDeclareExam): Promise<Response> {
    const response = await apiClient.post<Response>(
      "/DeclareResult/save-declare-exam",
      payload,
    );
    return response.data;
  },

  async UpdateDeclareExam(payload: UpdateDeclareExam): Promise<Response> {
    const response = await apiClient.put<Response>(
      "/DeclareResult/update-declare-exam",
      payload,
    );
    return response.data;
  },

  async ToggleDeclareResult(payload: ToggleDeclareResult): Promise<Response> {
    const response = await apiClient.put<Response>(
      "/DeclareResult/toggle-declare-result",
      payload,
    );
    return response.data;
  },
};
