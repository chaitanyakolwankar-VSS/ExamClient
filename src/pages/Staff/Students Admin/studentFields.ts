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
  /** Date of birth as yyyy-MM-dd (the date input's value), or empty. Optional. */
  dateOfBirth: string;
  /** Mobile number, 10 digits, or empty. Optional. */
  phone: string;
  /** At most 300 characters, or empty. Optional. */
  address: string;
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
  dateOfBirth: "",
  phone: "",
  address: "",
  gender: "",
  studentType: "",
  dyslexia: false,
  email: "",
});

/** The same shape check as the API (one @, no spaces, a dot in the domain). */
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.trim());

/** Longest address the API takes. */
export const MAX_ADDRESS_LENGTH = 300;

/** Digits of a typed or pasted phone number: "+91", a leading 0, spaces and dashes are dropped; at most 10 digits. */
export const cleanPhone = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
};

/** A phone is fine when empty or a 10-digit mobile number starting 6-9 (the API's rule). */
export const isValidPhone = (phone: string) => phone === "" || /^[6-9]\d{9}$/.test(phone);

/** yyyy-MM-dd of a local date (what a date input takes and gives). */
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Null when the date of birth is empty or a real date not in the future; otherwise what is wrong. (The API also checks the age is 14 to 80 years.) */
export const dateOfBirthProblem = (dateOfBirth: string): string | null => {
  if (!dateOfBirth) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || Number.isNaN(new Date(dateOfBirth).getTime())) return "Date of birth: enter a valid date.";
  const today = new Date();
  if (dateOfBirth > isoDay(today)) return "Date of birth cannot be in the future.";
  return null;
};

/**
 * Null when the details can be saved, otherwise what to fix. Email is required for a new student; a student
 * saved before it was asked may be edited without one. ABC ID, date of birth, phone and address are never
 * required; when filled in they only have to be in the right form.
 */
export const checkStudentFields = (f: StudentFields, { emailRequired = true } = {}): string | null => {
  if (!f.firstName.trim()) return "Enter the first name.";
  if (!f.motherName.trim()) return "Enter the mother's name.";
  if (!f.category) return "Choose the category.";
  if (!f.gender) return "Choose the gender.";
  if (!f.studentType) return "Choose the student type.";
  if (!f.email.trim()) {
    if (emailRequired) return "Enter the student's email.";
  } else if (!isValidEmail(f.email)) return "Enter a valid email address.";
  if (f.abcId && f.abcId.length !== 12) return "ABC ID: enter the 12 digits.";
  const dobProblem = dateOfBirthProblem(f.dateOfBirth);
  if (dobProblem) return dobProblem;
  if (!isValidPhone(f.phone.trim())) return "Phone: enter a 10-digit mobile number.";
  if (f.address.trim().length > MAX_ADDRESS_LENGTH) return `Address: at most ${MAX_ADDRESS_LENGTH} characters.`;
  return null;
};

