import apiClient from "../api/Client";
import type { StudentImportResult } from "./Student_MasterService";

/** One member of staff (Staff Master). Name is as the letters print it: "Prof. Asha R. Patil". */
export interface Staff {
  staffId: string;
  employeeCode: string | null;
  title: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  name: string;
  email: string;
  departmentId: string | null;
  department: string | null;
  designationId: string | null;
  designation: string | null;
  isTeaching: boolean;
  isExternal: boolean;
  externalCollege: string | null;
  externalCity: string | null;
  isActive: boolean;
}

export interface StaffSave {
  employeeCode: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  departmentId: string | null;
  designationId: string | null;
  isTeaching: boolean;
  isExternal: boolean;
  externalCollege: string;
  externalCity: string;
  isActive: boolean;
}

export interface StaffFilter {
  search?: string;
  departmentId?: string;
  designationId?: string;
  /** "internal", "external" or empty for both. */
  type?: string;
  /** "teaching", "non-teaching" or empty for both. */
  teaching?: string;
  includeInactive?: boolean;
}

export type StaffOptionKind = "Department" | "Designation";

export interface StaffOption {
  id: string;
  kind: StaffOptionKind;
  name: string;
  /** Staff using it; an entry in use cannot be deleted. */
  staffCount: number;
}

interface StaffImportRow {
  row: number;
  name: string;
  email: string;
  action: "New" | "Update" | "Unchanged" | "";
  hasErrors: boolean;
  note: string | null;
}

interface StaffImportResult {
  success: boolean;
  saved: boolean;
  message: string;
  errors: string[];
  rows: StaffImportRow[];
  newOptions: string[];
}

export const STAFF_TITLES = ["Prof.", "Dr.", "Mr.", "Mrs.", "Ms.", "Miss"];

const ACTION_TEXT: Record<string, string> = { New: "New.", Update: "Details change." };

/** The staff import result in the shape the shared sheet panel shows (New / Update = OK, with what changes). */
const asSheetResult = (r: StaffImportResult): StudentImportResult => ({
  success: r.success,
  saved: r.saved,
  message: r.message,
  errors: r.errors,
  rows: r.rows.map((x) => ({
    row: x.row,
    studentId: null,
    name: x.name,
    email: x.email,
    status: x.hasErrors ? "Error" : x.action === "Unchanged" ? "Unchanged" : "OK",
    note: [x.hasErrors ? "" : (ACTION_TEXT[x.action] ?? ""), x.note ?? ""].filter(Boolean).join(" ") || null,
  })),
});

export const StaffService = {
  async list(filter: StaffFilter): Promise<Staff[]> {
    const res = await apiClient.get<Staff[]>("/Staff", { params: filter });
    return res.data;
  },

  async save(staffId: string | null, dto: StaffSave): Promise<Staff> {
    const res = staffId ? await apiClient.put<Staff>(`/Staff/${staffId}`, dto) : await apiClient.post<Staff>("/Staff", dto);
    return res.data;
  },

  async remove(staffId: string): Promise<void> {
    await apiClient.delete(`/Staff/${staffId}`);
  },

  async options(): Promise<StaffOption[]> {
    const res = await apiClient.get<StaffOption[]>("/Staff/options");
    return res.data;
  },

  async addOption(kind: StaffOptionKind, name: string): Promise<StaffOption> {
    const res = await apiClient.post<StaffOption>("/Staff/options", { kind, name });
    return res.data;
  },

  async renameOption(id: string, name: string): Promise<StaffOption> {
    const res = await apiClient.put<StaffOption>(`/Staff/options/${id}`, { name });
    return res.data;
  },

  async removeOption(id: string): Promise<void> {
    await apiClient.delete(`/Staff/options/${id}`);
  },

  /** The staff sheet with the current staff filled in. */
  async downloadSheet(): Promise<{ blob: Blob; fileName: string }> {
    const res = await apiClient.get<Blob>("/Staff/template", { responseType: "blob" });
    const disposition = String(res.headers["content-disposition"] ?? "");
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { blob: res.data, fileName: match ? decodeURIComponent(match[1]) : "Staff.xlsx" };
  },

  async importSheet(file: File, preview: boolean): Promise<StudentImportResult> {
    const form = new FormData();
    form.append("File", file);
    form.append("Preview", String(preview));
    const res = await apiClient.post<StaffImportResult>("/Staff/import", form);
    return asSheetResult(res.data);
  },
};
