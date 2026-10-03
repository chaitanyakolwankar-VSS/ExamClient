/**
 * The ONE place that knows which screens exist, where they live, and how a stored Permission row
 * (PermissionModuleName + PermissionFormName, free text typed on the Add Permission screen) maps to
 * a screen. Used by the sidebar, the route guard (ScreenRoute) and the Add Permission screen.
 *
 * Matching rule: a Permission grants a screen when the NORMALISED form name equals the normalised
 * screen label, key, or one of its aliases (case, spaces and punctuation ignored: "Exam Masters",
 * "exam master" and "ExamMaster" all match). The module name is not used for matching, so a form filed
 * under the wrong module still works. Add Permission offers the exact labels so owners need not guess.
 *
 * Screens that are NOT built yet (so not listed here and not in the menu) - add them back when they exist:
 *   Academic Master: Fees Master, Active Exam, Student Promotion
 *   Students Admin : Declare Result, Release Hallticket, Student Password Reset
 *   Reports        : Student Assign Report, Fees Report
 */

export type ScreenModule =
  | "Admin"
  | "Academic Master"
  | "Students Admin"
  | "Conduct Exam"
  | "Marks Entry"
  | "Reports";

export interface Screen {
  /** Stable id; never shown. Routes and code refer to this, not to the (editable) label. */
  key: string;
  /** Menu text and the form name written to a Permission row. */
  label: string;
  /** Sidebar group and PermissionModuleName. */
  module: ScreenModule;
  path: string;
  /** Other paths that belong to the same screen (guarded identically). */
  extraPaths?: string[];
  /** Other spellings of the form name that already exist in the Permission table. */
  aliases?: string[];
  /** College admin / platform admin only (AdminRoute). Permissions are never consulted for these. */
  adminOnly?: boolean;
}

export const DASHBOARD_PATH = "/Staff/dashboard";

/** Menu order. Dashboard is always allowed and is not in this list. */
export const SCREENS: Screen[] = [
  { key: "addPermission", label: "Add Permission", module: "Admin", path: "/Staff/AddPermission", adminOnly: true },
  { key: "collegeDetail", label: "College Details", module: "Admin", path: "/Staff/CollegeDetail", adminOnly: true, aliases: ["College Detail"] },
  { key: "createUser", label: "Create User", module: "Admin", path: "/Staff/CreateUser", adminOnly: true },
  { key: "roleMaster", label: "Role Master", module: "Admin", path: "/Staff/Role_master", adminOnly: true },

  { key: "ordinance", label: "Ordinances", module: "Academic Master", path: "/Staff/Ordinance", aliases: ["Ordineances", "Ordinance"] },
  { key: "subjectMaster", label: "Subject Master", module: "Academic Master", path: "/Staff/SubjectMaster", aliases: ["Subject Masters", "Subjects"] },
  { key: "examMaster", label: "Exam Master", module: "Academic Master", path: "/Staff/ExamMaster", aliases: ["Exam Masters"] },

  { key: "studentMaster", label: "Student Master", module: "Students Admin", path: "/Staff/Student_Master", aliases: ["Student Masters", "Students"] },

  { key: "regularExam", label: "Regular Exam", module: "Conduct Exam", path: "/Staff/RegularExam", aliases: ["Regular Exams"] },
  { key: "atktRevalExam", label: "ATKT/Reval Exam", module: "Conduct Exam", path: "/Staff/AtktRevalExam", aliases: ["ATKT Reval Exam", "ATKT Exam", "Reval Exam"] },
  { key: "assignSeatNo", label: "Assign Seat No", module: "Conduct Exam", path: "/Staff/AssignSeatNo", aliases: ["Assign Seat Number", "Seat No"] },

  { key: "marksEntry", label: "Enter Marks", module: "Marks Entry", path: "/Staff/MarksEntry", aliases: ["Marks Entry"] },
  { key: "graceMarks", label: "Apply Grace Marks", module: "Marks Entry", path: "/Staff/OverallMarksEntry", aliases: ["Grace Marks", "Overall Marks Entry"] },
  { key: "eligibility", label: "Enter Eligibility", module: "Marks Entry", path: "/Staff/EnterEligibility", aliases: ["Eligibility"] },

  { key: "hallTicket", label: "Generate Hallticket", module: "Reports", path: "/Staff/GenerateHallTicket", extraPaths: ["/hallticket"], aliases: ["Generate Hall Ticket", "Hall Ticket", "Hallticket"] },
  { key: "gazette", label: "Generate Gazette", module: "Reports", path: "/Staff/Gazette", aliases: ["Gazette"] },
  { key: "marksheet", label: "Generate Result", module: "Reports", path: "/Staff/Marksheet", aliases: ["Marksheet", "Result"] },
  { key: "atktCumulativeReport", label: "ATKT Cummulative Report", module: "Reports", path: "/Staff/ATKTCommulativeReport", aliases: ["ATKT Cumulative Report", "ATKT Cummulative"] },
  { key: "statisticalReport", label: "Statistic Report", module: "Reports", path: "/Staff/StatisticalReport", aliases: ["Statistical Report"] },
];

/** The module order shown in the menu. */
export const MODULE_ORDER: ScreenModule[] = [
  "Admin",
  "Academic Master",
  "Students Admin",
  "Conduct Exam",
  "Marks Entry",
  "Reports",
];

export const normalizeName = (s: string | null | undefined): string =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const SCREEN_BY_NAME = new Map<string, Screen>();
for (const s of SCREENS) {
  for (const n of [s.label, s.key, ...(s.aliases ?? [])]) SCREEN_BY_NAME.set(normalizeName(n), s);
}

const normalizePath = (p: string): string => p.replace(/\/+$/, "").toLowerCase();

const SCREEN_BY_PATH = new Map<string, Screen>();
for (const s of SCREENS) {
  for (const p of [s.path, ...(s.extraPaths ?? [])]) SCREEN_BY_PATH.set(normalizePath(p), s);
}

/** The screen a stored form name stands for, or undefined for forms that are not a built screen. */
export const screenForFormName = (formName: string | null | undefined): Screen | undefined =>
  SCREEN_BY_NAME.get(normalizeName(formName));

/** The screen a URL path belongs to (case-insensitive), or undefined for non-screen paths (dashboard, 404...). */
export const screenForPath = (pathname: string): Screen | undefined => SCREEN_BY_PATH.get(normalizePath(pathname));

export interface AllowedForm {
  permissionFormName: string;
  permissionModuleName?: string;
}

/** Screen keys granted by the user's allowed forms (GET /api/Permission/me). Admin screens are never granted this way. */
export const screenKeysFromForms = (forms: AllowedForm[]): Set<string> => {
  const keys = new Set<string>();
  for (const f of forms) {
    const screen = screenForFormName(f.permissionFormName);
    if (screen && !screen.adminOnly) keys.add(screen.key);
  }
  return keys;
};

/**
 * The single access rule used by the sidebar and the route guard:
 * admin / platform admin see everything; anyone else sees exactly the screens ticked for their role or user.
 * A non-admin whose role has NO permissions configured therefore sees only the Dashboard.
 */
export const canAccessScreen = (screen: Screen, isAdmin: boolean, allowed: ReadonlySet<string>): boolean =>
  screen.adminOnly ? isAdmin : isAdmin || allowed.has(screen.key);
