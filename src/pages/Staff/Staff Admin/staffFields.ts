import type { StaffSave } from "../../../services/StaffService";

export const emptyStaff = (): StaffSave => ({
  employeeCode: "",
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  departmentId: null,
  designationId: null,
  isExternal: false,
  externalCollege: "",
  externalCity: "",
  isActive: true,
});

/** What is missing from a staff form, as a sentence for the warning, or null when it can be saved. */
export const checkStaff = (f: StaffSave): string | null => {
  const missing = [
    !f.title && "title",
    !f.firstName.trim() && "first name",
    !f.email.trim() && "email",
    !f.isExternal && !f.employeeCode.trim() && "employee ID",
    f.isExternal && !f.externalCollege.trim() && "their college",
  ].filter(Boolean);
  return missing.length > 0 ? `Fill in ${missing.join(", ")}.` : null;
};
