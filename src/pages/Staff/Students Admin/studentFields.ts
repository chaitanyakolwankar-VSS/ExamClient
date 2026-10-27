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
  /** ABC ID: 12 digits, or empty. */
  abcId: string;
  gender: "Male" | "Female" | "";
  studentType: string;
  dyslexia: boolean;
  /** Task links and OTPs go here; the API stores it trimmed and lower-case. */
  email: string;
}

export const emptyStudentFields = (): StudentFields => ({
  firstName: "",
  middleName: "",
  lastName: "",
  motherName: "",
  category: "",
  prn: "",
  abcId: "",
  gender: "",
  studentType: "",
  dyslexia: false,
  email: "",
});

/** The same shape check as the API (one @, no spaces, a dot in the domain). */
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.trim());

/**
 * Null when the details can be saved, otherwise what to fix. Email is required for a new student; a student
 * saved before it was asked may be edited without one.
 */
export const checkStudentFields = (f: StudentFields, { emailRequired = true } = {}): string | null => {
  if (!f.firstName.trim()) return "Enter the first name.";
  if (!f.motherName.trim()) return "Enter the mother's name.";
  if (!f.category) return "Choose the category.";
  if (!f.gender) return "Choose the gender.";
  if (!f.studentType) return "Choose the student type.";
  if (!f.email.trim()) return emailRequired ? "Enter the student's email." : null;
  if (!isValidEmail(f.email)) return "Enter a valid email address.";
  return null;
};

