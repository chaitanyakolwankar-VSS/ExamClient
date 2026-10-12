import { useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { Download, FileSpreadsheet, Pencil, Search, Trash2, Upload, UserPlus } from "lucide-react";
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
import type { StudentBatch, StudentImportResult } from "../../../services/Student_MasterService";
import StudentForm from "./StudentForm";
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

const tabClass = (active: boolean) =>
  `flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
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

  const [tab, setTab] = useState<"add" | "find">("add");

  // ---- Enrol into: shared by "Add student" and "Import from Excel" ----
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
        category: fields.category,
        studentPRN: fields.prn.trim() || null,
        gender: fields.gender,
        dyslexia: fields.dyslexia,
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

  // ---- Import from Excel (dialog; uses the branch, semester and pattern chosen above) ----
  const importInput = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const [importResult, setImportResult] = useState<(StudentImportResult & { fileName: string }) | null>(null);

  const openImport = () => {
    if (!batch()) return;
    setImportResult(null);
    setImportOpen(true);
  };

  const downloadTemplate = async () => {
    const b = batch();
    if (!b) return;
    setExcelBusy(true);
    try {
      const { blob, fileName } = await StudentMasterService.DownloadTemplate(b);
      saveAs(blob, fileName);
    } catch (err) {
      // responseType "blob": the API's error body is a Blob too.
      let message = "The template could not be downloaded.";
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      if (data instanceof Blob) {
        try {
          message = JSON.parse(await data.text()).message || message;
        } catch {
          /* keep the generic message */
        }
      }
      Swal.fire("Download failed", message, "error");
    } finally {
      setExcelBusy(false);
    }
  };

  const importFile = async (file: File | undefined) => {
    const b = batch();
    if (!file || !b) return;
    if (!/\.xlsx$/i.test(file.name)) {
      Swal.fire("Wrong file", "Choose the filled-in template (.xlsx).", "warning");
      return;
    }
    const ok = await Swal.fire({
      icon: "question",
      title: "Import students?",
      text: `${file.name} → ${courseName}, ${semesterName}, ${pattern}, ${academicYear}`,
      showCancelButton: true,
      confirmButtonText: "Import",
    });
    if (!ok.isConfirmed) return;

    setExcelBusy(true);
    setImportResult(null);
    try {
      const result = await StudentMasterService.ImportStudents(b, file);
      setImportResult({ ...result, fileName: file.name });
    } catch (err) {
      setImportResult({ success: false, message: apiReason(err, "The file could not be imported."), errors: [], fileName: file.name });
    } finally {
      setExcelBusy(false);
    }
  };

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
        category: s.category ?? "",
        prn: s.studentPRN ?? "",
        gender: s.gender === "Male" || s.gender === "Female" ? s.gender : "",
        dyslexia: !!s.dyslexia,
      });
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
    const problem = checkStudentFields(editFields) ?? (!editCourse || !editSemester || !editPattern ? "Choose the branch, semester and pattern." : null);
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
        category: editFields.category,
        studentPRN: editFields.prn.trim() || null,
        gender: editFields.gender,
        dyslexia: editFields.dyslexia,
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
      <div className="space-y-5">
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
          </div>
        </div>

        {tab === "add" && (
          <div className="@container rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Toolbar: where every new student goes, whether added here or imported from Excel. */}
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:px-6 @min-[860px]:flex-row @min-[860px]:items-center @min-[860px]:gap-4 dark:border-gray-800">
              <span className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">Enrol into</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 @min-[860px]:flex-1">
                <Select options={courseOptions} placeholder="Select Branch" value={course} onChange={setCourse} />
                <Select options={semesterOptions} placeholder="Select Semester" value={semester} onChange={setSemester} />
                <Select options={patternOptions} placeholder="Select Pattern" value={pattern} onChange={setPattern} />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={openImport}
                className="shrink-0 self-end @min-[860px]:self-auto"
                startIcon={<FileSpreadsheet className="size-4" />}
              >
                Import from Excel
              </Button>
            </div>

            <div className="p-4 sm:p-6">
              <StudentForm
                fields={fields}
                onFieldsChange={setFields}
                photo={photo}
                sign={sign}
                onPhotoChange={setPhoto}
                onSignChange={setSign}
                onImageError={imageError}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-4 py-4 sm:px-6 dark:border-gray-800">
              <Button variant="outline" onClick={clearStudent} disabled={saving}>
                Clear
              </Button>
              <Button onClick={saveStudent} disabled={saving}>
                {saving ? "Saving…" : "Save student"}
              </Button>
            </div>
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
          <div className="flex flex-col gap-5">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Edit student</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editing.studentId} · {academicYear}
              </p>
            </div>
            {editLoading ? (
              <p className="py-10 text-center text-sm text-gray-500">Loading…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Select options={courseOptions} placeholder="Select Branch" value={editCourse} onChange={setEditCourse} />
                  <Select options={semesterOptions} placeholder="Select Semester" value={editSemester} onChange={setEditSemester} />
                  <Select options={patternOptions} placeholder="Select Pattern" value={editPattern} onChange={setEditPattern} />
                </div>
                <div className="border-t border-gray-100 pt-5 dark:border-gray-800">
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
                  />
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <Button variant="outline" onClick={() => setEditing(null)} disabled={editSaving}>
                    Cancel
                  </Button>
                  <Button onClick={saveEdit} disabled={editSaving}>
                    {editSaving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} className="max-w-[640px] p-6">
        <div className="flex flex-col gap-5">
          <div className="pr-10">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Import students from Excel</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Students go to{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {courseName} · {semesterName} · {pattern} · {academicYear}
              </span>
            </p>
          </div>

          <ol className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                1
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Download the template</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Made for the branch, semester and pattern above.</p>
              </div>
              <Button size="sm" variant="outline" onClick={downloadTemplate} disabled={excelBusy} startIcon={<Download className="size-4" />}>
                Download template
              </Button>
            </li>
            <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                2
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Fill one row per student</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  First name, last name and gender are required; middle name, category and ERN are optional. Photos are added later per student.
                </p>
              </div>
            </li>
            <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                3
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Import the file</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Every row is checked first; nothing is saved unless all rows are right. Students get their IDs in the order of the rows.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => batch() && importInput.current?.click()}
                disabled={excelBusy}
                startIcon={<Upload className="size-4" />}
              >
                {excelBusy ? "Working…" : "Import file"}
              </Button>
              <input
                ref={importInput}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </li>
          </ol>

          {importResult && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                importResult.success
                  ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
                  : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
              }`}
            >
              <p className="flex items-start gap-2 font-medium">
                <FileSpreadsheet className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 break-words">
                  {importResult.fileName}: {importResult.message}
                </span>
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 max-h-60 list-disc space-y-0.5 overflow-y-auto pl-5">
                  {importResult.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
