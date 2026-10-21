import { useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { FileSpreadsheet, Mail, MailCheck, Pencil, Search, Send, Trash2, User, UserPlus } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import AuthImage from "../../../components/common/AuthImage";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import DataTable from "../../../components/ui/table/DataTable";
import { Modal } from "../../../components/ui/modal";
import {
  useAcademicYear,
  useCourses,
  usePatterns,
  useSemesters,
  toCourseOptions,
  toPatternOptions,
  toSemesterOptions,
} from "../../../data";
import { StudentMasterService } from "../../../services/Student_MasterService";
import type { StudentBatch } from "../../../services/Student_MasterService";
import StudentForm from "./StudentForm";
import SheetImportPanel from "./SheetImportPanel";
import StudentEmailReview from "./StudentEmailReview";
import StudentLinks from "./StudentLinks";
import { useAuth } from "../../../context/AuthContext";
import { checkStudentFields, emptyStudentFields } from "./studentFields";
import type { StudentFields } from "./studentFields";

/** A row of the "Find students" list (GET Getbycourse / POST SearchStudents). */
interface StudentRow {
  name: string; // branch name
  studentId: string;
  studentName?: string;
  semesterId: string;
  studentPRN: string;
  photoUrl?: string | null;
  signUrl?: string | null;
}

/** The API's reason from an axios error ({ message } or a plain string), else the fallback. */
const apiReason = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (data as { message?: string } | undefined)?.message || fallback;
};

/** Segmented-toggle button: the page tabs (py-2) and the "Single student / Excel import" switch (py-2.5, as tall as the selects). */
const tabClass = (active: boolean, tall = false) =>
  `flex items-center justify-center gap-2 px-4 ${tall ? "py-2.5" : "py-2"} text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden focus-visible:ring-inset ${
    active ? "bg-brand-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
  }`;

export default function StudentMaster() {
  const { ayid: selectedAyid, academicYear } = useAcademicYear();
  const ayid = selectedAyid ?? "";

  const { data: courses } = useCourses();
  const courseOptions = useMemo(() => toCourseOptions(courses), [courses]);
  const { data: semesters } = useSemesters();
  const semesterOptions = useMemo(() => toSemesterOptions(semesters), [semesters]);
  const { data: patterns } = usePatterns();
  const patternOptions = useMemo(() => toPatternOptions(patterns), [patterns]);
  const onlyPattern = patternOptions.length === 1 ? patternOptions[0].value : "";

  const [tab, setTab] = useState<"add" | "find" | "emails" | "links">("add");
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState<"single" | "excel" | "emails">("single");

  // ---- Enrol into: shared by "Single student", "Excel import" and "Emails" (the class whose emails are filled in) ----
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [pattern, setPattern] = useState("");
  useEffect(() => {
    if (!pattern && onlyPattern) setPattern(onlyPattern);
  }, [pattern, onlyPattern]);

  const courseName = courseOptions.find((c) => c.value === course)?.label ?? "";
  const semesterName = semesterOptions.find((s) => s.value === semester)?.label ?? semester;

  /** Branch + semester + pattern + year, or null (with a message) when something is missing. */
  const batch = (): StudentBatch | null => {
    if (!course || !semester || !pattern) {
      Swal.fire("Enrol into", "Choose the branch, semester and pattern first.", "warning");
      return null;
    }
    if (!ayid) {
      Swal.fire("Academic year", "Choose the academic year in the header first.", "warning");
      return null;
    }
    return { courseId: course, semesterId: semester, pattern, ayid };
  };

  const imageError = (message: string) => Swal.fire("Image", message, "warning");

  // ---- One student ----
  const [fields, setFields] = useState<StudentFields>(emptyStudentFields);
  const [photo, setPhoto] = useState<string | null>(null);
  const [sign, setSign] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clearStudent = () => {
    setFields(emptyStudentFields());
    setPhoto(null);
    setSign(null);
  };

  const saveStudent = async () => {
    const b = batch();
    if (!b) return;
    const problem = checkStudentFields(fields);
    if (problem) {
      Swal.fire("Student details", problem, "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await StudentMasterService.SaveStudent({
        courseId: b.courseId,
        semesterId: b.semesterId,
        pattern: b.pattern,
        ayid: b.ayid,
        firstName: fields.firstName.trim(),
        middleName: fields.middleName.trim() || null,
        lastName: fields.lastName.trim(),
        motherName: fields.motherName.trim(),
        category: fields.category,
        studentPRN: fields.prn.trim() || null,
        abcId: fields.abcId.trim() || null,
        gender: fields.gender,
        studentType: fields.studentType,
        dyslexia: fields.dyslexia,
        email: fields.email.trim(),
        photoUrl: photo,
        signUrl: sign,
      });
      const studentId = typeof res.data === "string" ? res.data : res.data?.studentId;
      clearStudent(); // branch, semester and pattern stay for the next student
      Swal.fire({ icon: "success", title: "Student saved", text: `Student ID: ${studentId}`, timer: 2500 });
    } catch (err) {
      Swal.fire("Not saved", apiReason(err, "The student could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  // ---- Excel import and email sheet (use the branch, semester and pattern chosen above) ----
  const downloadSheet = async (get: (b: StudentBatch) => Promise<{ blob: Blob; fileName: string }>) => {
    const b = batch();
    if (!b) return;
    try {
      const { blob, fileName } = await get(b);
      saveAs(blob, fileName);
    } catch (err) {
      // responseType "blob": the API's error body is a Blob too.
      let message = "The sheet could not be downloaded.";
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      if (data instanceof Blob) {
        try {
          message = JSON.parse(await data.text()).message || message;
        } catch {
          /* keep the generic message */
        }
      }
      Swal.fire("Download failed", message, "error");
    }
  };
  /** Only called after ready() (batch() is not null then). */
  const forBatch = (send: (b: StudentBatch, file: File, preview: boolean) => ReturnType<typeof StudentMasterService.ImportStudents>) =>
    (file: File, preview: boolean) => send(batch()!, file, preview);
  const classLabel = [courseName, semesterName, pattern, academicYear].filter(Boolean).join(", ");

  // ---- Find students ----
  const [findCourse, setFindCourse] = useState("");
  const [findId, setFindId] = useState("");
  const [findFirst, setFindFirst] = useState("");
  const [findLast, setFindLast] = useState("");
  const [findPrn, setFindPrn] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!findCourse && !findId && !findFirst && !findLast && !findPrn) {
      Swal.fire("Find students", "Choose a branch, or enter a student ID, name or ERN.", "warning");
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const data = findCourse
        ? await StudentMasterService.GetByCourse(findCourse, ayid)
        : await StudentMasterService.SearchStudents(
            { studentId: findId, firstName: findFirst, middleName: "", lastName: findLast, studentPRN: findPrn },
            ayid,
          );
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire("Search failed", apiReason(err, "The students could not be loaded."), "error");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setFindCourse("");
    setFindId("");
    setFindFirst("");
    setFindLast("");
    setFindPrn("");
    setRows([]);
    setSearched(false);
  };

  const deleteStudent = async (row: StudentRow) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete student?",
      text: `${row.studentId} · ${row.studentName ?? ""}`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d92d20",
    });
    if (!ok.isConfirmed) return;
    try {
      await StudentMasterService.DeleteStudent(row.studentId);
      setRows((list) => list.filter((r) => r.studentId !== row.studentId));
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      Swal.fire(
        "Not deleted",
        status === 403 ? "Only a college admin can delete students." : apiReason(err, "The student could not be deleted."),
        "error",
      );
    }
  };

  // ---- Edit dialog ----
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFields, setEditFields] = useState<StudentFields>(emptyStudentFields);
  const [editCourse, setEditCourse] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editPattern, setEditPattern] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editSign, setEditSign] = useState<string | null>(null);
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null);
  const [savedSign, setSavedSign] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editEmailNote, setEditEmailNote] = useState<string | null>(null);

  const openEdit = async (row: StudentRow) => {
    setEditing(row);
    setEditLoading(true);
    setEditPhoto(null);
    setEditSign(null);
    try {
      const s = await StudentMasterService.GetStudentById(row.studentId, ayid);
      if (!s) throw new Error("not enrolled");
      setEditFields({
        firstName: s.firstName ?? "",
        middleName: s.middleName ?? "",
        lastName: s.lastName ?? "",
        motherName: s.motherName ?? "",
        category: s.category ?? "",
        prn: s.studentPRN ?? "",
        abcId: s.abcId ?? "",
        gender: s.gender === "Male" || s.gender === "Female" ? s.gender : "",
        studentType: s.studentType ?? "",
        dyslexia: !!s.dyslexia,
        email: s.email ?? "",
      });
      setEditEmailNote(s.emailStatus === "Flagged" ? `Flagged: ${s.emailFlagReason ?? "check this email"}` : null);
      setEditCourse(s.courseId ?? "");
      setEditSemester(s.semesterId ?? "");
      setEditPattern(s.pattern || onlyPattern);
      setSavedPhoto(s.photoUrl);
      setSavedSign(s.signUrl);
    } catch {
      setEditing(null);
      Swal.fire("Edit", `${row.studentId} has no enrolment in ${academicYear}. Choose that student's academic year in the header.`, "warning");
    } finally {
      setEditLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    const problem = checkStudentFields(editFields, { emailRequired: false }) ?? (!editCourse || !editSemester || !editPattern ? "Choose the branch, semester and pattern." : null);
    if (problem) {
      Swal.fire("Student details", problem, "warning");
      return;
    }
    setEditSaving(true);
    try {
      await StudentMasterService.UpdateStudent({
        studentId: editing.studentId,
        courseId: editCourse,
        semesterId: editSemester,
        pattern: editPattern,
        ayid,
        firstName: editFields.firstName.trim(),
        middleName: editFields.middleName.trim() || null,
        lastName: editFields.lastName.trim(),
        motherName: editFields.motherName.trim(),
        category: editFields.category,
        studentPRN: editFields.prn.trim() || null,
        abcId: editFields.abcId.trim() || null,
        gender: editFields.gender,
        studentType: editFields.studentType,
        dyslexia: editFields.dyslexia,
        email: editFields.email.trim() || null,
        photoUrl: editPhoto, // only a new picture (data: URL) replaces the saved one
        signUrl: editSign,
      });
      setEditing(null);
      await search();
      Swal.fire({ icon: "success", title: "Student updated", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Not saved", apiReason(err, "The changes could not be saved."), "error");
    } finally {
      setEditSaving(false);
    }
  };

  const columns = [
    {
      key: "photo",
      label: "",
      render: (row: StudentRow) => (
        <div className="flex h-10 w-8 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
          {row.photoUrl ? (
            <AuthImage src={row.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-gray-400">—</span>
          )}
        </div>
      ),
    },
    { key: "studentId", label: "Student ID", sortable: true },
    { key: "studentName", label: "Name", sortable: true },
    { key: "name", label: "Branch", sortable: true },
    { key: "semesterId", label: "Semester", sortable: true },
    { key: "studentPRN", label: "ERN" },
    {
      key: "actions",
      label: "",
      render: (row: StudentRow) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(row)}
            title="Edit details, photo and signature"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/[0.05]"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => deleteStudent(row)}
            title="Delete student"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-white/[0.05]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="GradeSphere | Student Master" description="Add and find students" />
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Student Master</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Academic year {academicYear || "not chosen (choose it in the header)"}
            </p>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <button type="button" className={tabClass(tab === "add")} onClick={() => setTab("add")}>
              <UserPlus className="size-4" /> Add student
            </button>
            <button type="button" className={`${tabClass(tab === "find")} border-l border-gray-300 dark:border-gray-700`} onClick={() => setTab("find")}>
              <Search className="size-4" /> Find students
            </button>
            <button type="button" className={`${tabClass(tab === "emails")} border-l border-gray-300 dark:border-gray-700`} onClick={() => setTab("emails")}>
              <MailCheck className="size-4" /> Check emails
            </button>
            <button type="button" className={`${tabClass(tab === "links")} border-l border-gray-300 dark:border-gray-700`} onClick={() => setTab("links")}>
              <Send className="size-4" /> Student links
            </button>
          </div>
        </div>

        {tab === "emails" && (
          <StudentEmailReview
            ayid={ayid}
            academicYear={academicYear}
            courseOptions={courseOptions}
            semesterOptions={semesterOptions}
            isAdmin={isAdmin}
            reason={apiReason}
          />
        )}

        {tab === "links" && (
          <StudentLinks ayid={ayid} academicYear={academicYear} courseOptions={courseOptions} semesterOptions={semesterOptions} reason={apiReason} />
        )}

        {tab === "add" && (
          <div className="@container rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Toolbar: where every new student goes (single or imported), and how they are added. */}
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 @min-[860px]:flex-row @min-[860px]:items-center @min-[860px]:gap-4 dark:border-gray-800">
              <span className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">Enrol into</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 @min-[860px]:flex-1">
                <Select options={courseOptions} placeholder="Select Branch" value={course} onChange={setCourse} />
                <Select options={semesterOptions} placeholder="Select Semester" value={semester} onChange={setSemester} />
                <Select options={patternOptions} placeholder="Select Pattern" value={pattern} onChange={setPattern} />
              </div>
              <div
                role="group"
                aria-label="How to add students"
                className="grid shrink-0 grid-cols-3 overflow-hidden rounded-lg border border-gray-300 @min-[860px]:flex dark:border-gray-700"
              >
                <button type="button" aria-pressed={mode === "single"} className={tabClass(mode === "single", true)} onClick={() => setMode("single")}>
                  <User className="size-4" aria-hidden="true" /> Single student
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "excel"}
                  className={`${tabClass(mode === "excel", true)} border-l border-gray-300 dark:border-gray-700`}
                  onClick={() => setMode("excel")}
                >
                  <FileSpreadsheet className="size-4" aria-hidden="true" /> Excel import
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "emails"}
                  title="Add emails to students already saved"
                  className={`${tabClass(mode === "emails", true)} border-l border-gray-300 dark:border-gray-700`}
                  onClick={() => setMode("emails")}
                >
                  <Mail className="size-4" aria-hidden="true" /> Emails
                </button>
              </div>
            </div>

            {mode === "single" ? (
              <StudentForm
                fields={fields}
                onFieldsChange={setFields}
                photo={photo}
                sign={sign}
                onPhotoChange={setPhoto}
                onSignChange={setSign}
                onImageError={imageError}
                actions={
                  <>
                    <Button variant="outline" onClick={clearStudent} disabled={saving}>
                      Clear
                    </Button>
                    <Button onClick={saveStudent} disabled={saving}>
                      {saving ? "Saving…" : "Save student"}
                    </Button>
                  </>
                }
              />
            ) : mode === "excel" ? (
              <SheetImportPanel
                key="excel"
                ready={() => !!batch()}
                reason={apiReason}
                downloadLabel="Download template"
                onDownload={() => downloadSheet(StudentMasterService.DownloadTemplate)}
                upload={forBatch(StudentMasterService.ImportStudents)}
                saveLabel="Save students"
                steps={[
                  { title: "Download the template", text: "Made for the branch, semester and pattern above." },
                  {
                    title: "Fill one row per student",
                    text: "First name, mother's name, gender, student type (E, D or M) and email are required; middle name, last name, category and ERN are optional. Photos are added later per student.",
                  },
                  {
                    title: "Upload, check, save",
                    text: `Every row is checked first and shown below; Save adds them to ${classLabel || "the class above"}. Nothing is saved while a row has an error. Students get their IDs in the order of the rows.`,
                  },
                ]}
              />
            ) : (
              <SheetImportPanel
                key="emails"
                ready={() => !!batch()}
                reason={apiReason}
                downloadLabel="Download email sheet"
                onDownload={() => downloadSheet(StudentMasterService.DownloadEmailSheet)}
                upload={forBatch(StudentMasterService.ImportEmails)}
                saveLabel="Save emails"
                steps={[
                  { title: "Download the email sheet", text: "Lists the students already saved in the branch, semester and pattern above." },
                  { title: "Type each student's email", text: "Only the Email column can be changed. Leave it blank to keep a student as is." },
                  {
                    title: "Upload, check, save",
                    text: "Rows are matched by Student ID and shown below before anything changes. Nothing is saved while a row has an error.",
                  },
                ]}
              />
            )}
          </div>
        )}

        {tab === "find" && (
          <ComponentCard title="Find students" desc={`Students enrolled in ${academicYear || "the academic year in the header"}. A branch lists all of its students; otherwise search by ID, name or ERN.`}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <Select options={courseOptions} placeholder="Select Branch" value={findCourse} onChange={setFindCourse} />
              <Input label="Student ID" value={findId} disabled={!!findCourse} onChange={(e) => setFindId(e.target.value.replace(/[^A-Za-z0-9]/g, ""))} />
              <Input label="First name" value={findFirst} disabled={!!findCourse} onChange={(e) => setFindFirst(e.target.value)} />
              <Input label="Last name" value={findLast} disabled={!!findCourse} onChange={(e) => setFindLast(e.target.value)} />
              <Input label="ERN" value={findPrn} disabled={!!findCourse} onChange={(e) => setFindPrn(e.target.value.replace(/[^A-Za-z0-9]/g, ""))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={clearSearch} disabled={searching}>
                Clear
              </Button>
              <Button onClick={search} disabled={searching} startIcon={<Search className="size-4" />}>
                {searching ? "Searching…" : "Search"}
              </Button>
            </div>

            {rows.length > 0 && (
              <DataTable
                key={`${rows.length}-${findCourse}`}
                data={rows}
                columns={columns}
                searchKeys={["studentId", "studentName", "studentPRN"]}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            )}
            {!searching && searched && rows.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No students found for {academicYear}. Check the academic year in the header.
              </p>
            )}
          </ComponentCard>
        )}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} className="max-w-[960px] p-6">
        {editing && (
          <div className="flex flex-col gap-4">
            <div className="pr-10">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit student</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editing.studentId} · {academicYear}
              </p>
            </div>
            {editLoading ? (
              <p className="py-10 text-center text-sm text-gray-500">Loading…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Select options={courseOptions} placeholder="Select Branch" value={editCourse} onChange={setEditCourse} />
                  <Select options={semesterOptions} placeholder="Select Semester" value={editSemester} onChange={setEditSemester} />
                  <Select options={patternOptions} placeholder="Select Pattern" value={editPattern} onChange={setEditPattern} />
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  <StudentForm
                    fields={editFields}
                    onFieldsChange={setEditFields}
                    photo={editPhoto}
                    sign={editSign}
                    savedPhoto={savedPhoto}
                    savedSign={savedSign}
                    onPhotoChange={setEditPhoto}
                    onSignChange={setEditSign}
                    onImageError={imageError}
                    emailRequired={false}
                    emailNote={editEmailNote}
                    actions={
                      <>
                        <Button variant="outline" onClick={() => setEditing(null)} disabled={editSaving}>
                          Cancel
                        </Button>
                        <Button onClick={saveEdit} disabled={editSaving}>
                          {editSaving ? "Saving…" : "Save changes"}
                        </Button>
                      </>
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
