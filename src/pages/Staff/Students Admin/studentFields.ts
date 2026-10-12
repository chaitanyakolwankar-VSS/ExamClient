// Shared by StudentDetailsFields and the Student Master page (kept out of the component file for fast refresh).

/** Admission categories offered on the form (owner's list, 2026-10-12; OPEN = general). */
export const STUDENT_CATEGORIES = [
  "OPEN",
  "NT-1 (NT-B)",
  "NT-2 (NT-C)",
  "NT-3 (NT-D)",
  "OBC",
  "SBC",
  "SC",
  "ST",
  "VJ/DT(A)",
  "EBC",
  "SEBC",
  "TFWS",
];

export interface StudentFields {
  firstName: string;
  middleName: string;
  lastName: string;
  category: string;
  prn: string;
  gender: "Male" | "Female" | "";
  dyslexia: boolean;
}

export const emptyStudentFields = (): StudentFields => ({
  firstName: "",
  middleName: "",
  lastName: "",
  category: "",
  prn: "",
  gender: "",
  dyslexia: false,
});

/** Null when the details can be saved, otherwise what to fix. */
export const checkStudentFields = (f: StudentFields): string | null => {
  if (!f.firstName.trim() || !f.lastName.trim()) return "Enter the first and last name.";
  if (!f.category) return "Choose the category.";
  if (!f.gender) return "Choose the gender.";
  return null;
};

