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

/** Student types the API accepts (E, D or M); staff must choose one, there is no default. */
export const STUDENT_TYPES = [
  { value: "E", label: "Engineering" },
  { value: "D", label: "Diploma" },
  { value: "M", label: "MCA" },
];

export interface StudentFields {
  firstName: string;
  middleName: string;
  lastName: string;
  motherName: string;
  category: string;
  prn: string;
  gender: "Male" | "Female" | "";
  studentType: string;
  dyslexia: boolean;
}

export const emptyStudentFields = (): StudentFields => ({
  firstName: "",
  middleName: "",
  lastName: "",
  motherName: "",
  category: "",
  prn: "",
  gender: "",
  studentType: "",
  dyslexia: false,
});

/** Null when the details can be saved, otherwise what to fix. */
export const checkStudentFields = (f: StudentFields): string | null => {
  if (!f.firstName.trim()) return "Enter the first name.";
  if (!f.motherName.trim()) return "Enter the mother's name.";
  if (!f.category) return "Choose the category.";
  if (!f.gender) return "Choose the gender.";
  if (!f.studentType) return "Choose the student type.";
  return null;
};

