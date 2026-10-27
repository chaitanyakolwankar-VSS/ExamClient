// services/CourseMasterService.ts
import apiClient from "../api/Client";

// The academic year is passed in by the screen (useAcademicYear().ayid) instead of being read from localStorage.
export const StudentMasterService = {
   SaveStudent: async (payload: any) => {
    return apiClient.post("/StudentMaster/SaveStudent", payload);
  },
   GetByCourse: async (courseId: string, ayid: string) => {
    const res = await apiClient.get(`/StudentMaster/Getbycourse?courseId=${courseId}&ayid=${ayid}`);
    return res.data;
  },
  /** Sets a student's photo and/or signature (data: URLs); other fields are untouched. */
  UpdateImages: async (studentId: string, images: { photo?: string | null; sign?: string | null }) => {
    const res = await apiClient.put<{ photoUrl: string | null; signUrl: string | null }>("/StudentMaster/UpdateImages", {
      studentId,
      photo: images.photo ?? null,
      sign: images.sign ?? null,
    });
    return res.data;
  },
  /** One student with their enrolment in the given academic year (null when not enrolled that year). */
  GetStudentById: async (studentId: string, ayid: string): Promise<StudentDetails | null> => {
    const res = await apiClient.get<StudentDetails | null>("/StudentMaster/GetStudentById", { params: { studentId, ayid } });
    return res.data ?? null;
  },
  /** Updates details and the year's enrolment; photoUrl / signUrl only when a new data: URL is given. */
  UpdateStudent: async (payload: StudentDetails & { ayid: string }) => {
    return apiClient.put("/StudentMaster/UpdateStudent", payload);
  },
  DeleteStudent: async (studentId: string) => {
    return apiClient.delete("/StudentMaster/DeleteStudent", { params: { studentId } });
  },
  SearchStudents(payload: any, ayid: string) {
    return apiClient.post("/StudentMaster/SearchStudents", { ...payload, AYID: ayid })
      .then(res => res.data);
  },
  /** The Excel template for one branch + semester + pattern + year; returns the file and the API's file name. */
  DownloadTemplate: (p: StudentBatch) => downloadSheet("/StudentMaster/DownloadExcelTemplate", p, "Students.xlsx"),
  /** Imports the filled-in template; nothing is saved unless every row is valid. Preview only checks it. */
  ImportStudents: (p: StudentBatch, file: File, preview: boolean) => uploadSheet("/StudentMaster/ImportStudents", p, file, preview),
  /** The class's saved students, to fill in only their emails. */
  DownloadEmailSheet: (p: StudentBatch) => downloadSheet("/StudentMaster/DownloadEmailSheet", p, "Student emails.xlsx"),
  /** Sets emails from the filled-in email sheet (matched by Student ID); Preview only checks it. */
  ImportEmails: (p: StudentBatch, file: File, preview: boolean) => uploadSheet("/StudentMaster/ImportEmails", p, file, preview),
};

async function downloadSheet(url: string, p: StudentBatch, fallbackName: string): Promise<{ blob: Blob; fileName: string }> {
  const res = await apiClient.get<Blob>(url, {
    params: { CourseId: p.courseId, SemesterId: p.semesterId, Pattern: p.pattern, AYID: p.ayid },
    responseType: "blob",
  });
  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return { blob: res.data, fileName: match ? decodeURIComponent(match[1]) : fallbackName };
}

async function uploadSheet(url: string, p: StudentBatch, file: File, preview: boolean): Promise<StudentImportResult> {
  const form = new FormData();
  form.append("File", file);
  form.append("CourseId", p.courseId);
  form.append("SemesterId", p.semesterId);
  form.append("Pattern", p.pattern);
  form.append("AYID", p.ayid);
  form.append("Preview", String(preview));
  const res = await apiClient.post<StudentImportResult>(url, form);
  return res.data;
}

/** A student as GET /StudentMaster/GetStudentById returns it (and UpdateStudent takes it). */
export interface StudentDetails {
  studentId: string;
  courseId: string;
  semesterId: string;
  pattern: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  motherName: string | null;
  gender: string | null;
  studentType: string | null;
  category: string | null;
  studentPRN: string | null;
  /** ABC ID, 12 digits; null when not given. */
  abcId?: string | null;
  photoUrl: string | null;
  signUrl: string | null;
  dyslexia: boolean;
  email: string | null;
  /** Read only: "Verified", "Flagged" or null (not checked yet), and why it is flagged. */
  emailStatus?: string | null;
  emailFlagReason?: string | null;
}

/** Where a batch of students is enrolled: branch, semester, pattern and academic year. */
export interface StudentBatch {
  courseId: string;
  semesterId: string;
  pattern: string;
  ayid: string;
}

export interface StudentImportResult {
  success: boolean;
  /** False for a preview and whenever there are errors. */
  saved?: boolean;
  message: string;
  /** One line per problem row, e.g. "Row 5: gender must be Male or Female." */
  errors: string[];
  rows?: ImportRow[];
}

/** What an upload does (or would do) with one row of the sheet. */
export interface ImportRow {
  row: number;
  studentId: string | null;
  name: string;
  email: string;
  status: "OK" | "Flagged" | "Error" | "Unchanged" | "Skipped";
  note: string | null;
}


 

 



 

 