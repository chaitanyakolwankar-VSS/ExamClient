import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { RegularExamService, RegularStudents, GetStudents, RegularCredits } from "../../../services/RegularExamService";
import {
  useAcademicYear,
  useCourses,
  usePatterns,
  useSemesters,
  useExams,
  useSubjects,
  toCourseOptions,
  toPatternOptions,
  toSemesterOptions,
  toExamOptions,
  invalidateExams,
} from "../../../data";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Edit,
  X,
  Pencil,
  Save,
  RefreshCcw,
  CheckCircle,
  Eye,
  Copy,
  Delete,
} from "lucide-react";
import DataTable from "../../../components/ui/table/DataTable";
import Switch from "../../../components/form/switch/Switch";
import Alert from "../../../components/ui/alert/Alert";

interface Option {
  value: string;
  label: string;
}
export type RenderResult = {
  content?: React.ReactNode;
  rowSpan?: number;
  colSpan?: number;
  skip?: boolean;
};
interface Column<T = any> {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
  group?: boolean;
  render?: (row: T) => React.ReactNode | RenderResult;
}
type AlertVariant = "success" | "warning" | "error" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

export default function RegularExam() {
  const { ayid } = useAcademicYear();

  // 🔹 Course
  const [courseId, setCourseId] = useState("");
  const courses = useCourses();
  const courseOptions = useMemo(() => toCourseOptions(courses.data), [courses.data]);

  // 🔹 Pattern
  const [pattern, setPattern] = useState("");
  const patterns = usePatterns();
  const patternOptions = useMemo(() => toPatternOptions(patterns.data), [patterns.data]);

  // 🔹 Semester
  const [semester, setSemester] = useState("");
  const semesters = useSemesters();
  const semesterOptions = useMemo(() => toSemesterOptions(semesters.data), [semesters.data]);

  // 🔹 Exam (regular exams of the course; the list ignores semester, as the old endpoint did)
  const [Exam, setExam] = useState("");
  const exams = useExams({ courseId, purpose: "regular" });
  const ExamOptions = useMemo(() => toExamOptions(exams.data), [exams.data]);

  // 🔹 Subject
  const [subject, setSubject] = useState("");
  const subjects = useSubjects({ courseId, pattern, semester });
  const subjectOptions: Option[] = useMemo(
    () => (subjects.data ?? []).map((s) => ({ value: s.subjectId, label: s.name })),
    [subjects.data]
  );

  //     Regular Students
  const [unassignedStudents, setUnassignedStudents] = useState<
    RegularStudents[]
  >([]);
  const [assignedStudents, setAssignedStudents] = useState<RegularStudents[]>(
    [],
  );

  //     Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);

  //  Assign   all subjects
  const [Isallsubjects, setIsallsubjects] = useState(false);

  //Alert
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [selectAll, setSelectAll] = useState(false);

  const filters = useMemo(() => ({}), []);

  const columns = useMemo<Column<RegularStudents>[]>(
    () => [
      {
        key: "studentId",
        label: "Student ID",
        sortable: true,
      },
      {
        key: "studentName",
        label: "Student Name",
        sortable: true,
      },
      {
        key: "assigned",
        label: "Assigned",
        render: (row) => ({
          content: (
            <Switch
              key={row.stdMstId + "-" + row.assigned} // 🔥 important
              label=""
              color="blue"
              defaultChecked={!!row.assigned}
              onChange={(checked) => updateStudent(row.stdMstId, checked)}
            />
          ),
        }),
      },
    ],
    [],
  );

  const updateStudent = (stdMstId: string, assigned: boolean) => {
    setAssignedStudents((prev) =>
      prev.map((s) => (s.stdMstId === stdMstId ? { ...s, assigned } : s)),
    );

    setUnassignedStudents((prev) =>
      prev.map((s) => (s.stdMstId === stdMstId ? { ...s, assigned } : s)),
    );
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // 🔹 Clear the dependent selections when the course is cleared
  useEffect(() => {
    if (!courseId) {
      setPattern("");
      setSemester("");
      setExam("");
      setSubject("");
      reset();
    }
  }, [courseId]);

  useEffect(() => {
    if (semester) {
      setExam("");
    }
    reset();
  }, [semester]);
  useEffect(() => {
    Assignallsubjects(false);
  }, [Exam]);

  useEffect(() => {
    if (Exam) {
      CheckCredits(false);
    } else {
    }
    reset();
  }, [subject]);
  const Assignallsubjects = async (checked: boolean) => {
    setSelectAll(false);
    setIsallsubjects(checked);

    if (checked) {
      setSubject("");
      await CheckCredits(true);
    } else {
      setSubject("");
      reset();
    }
  };

  const reset = () => {
    setSelectAll(false);
    setIsEditMode(false);
    setUnassignedStudents([]);
    setAssignedStudents([]);
  };
  // ================= API CALLS =================

  const CheckCredits = async (isAll: boolean = Isallsubjects) => {
    try {
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }
      // const params:RegularCredits={
      //   subjectIds:[subject],
      //   ayid:ayid,
      // }
      const params: RegularCredits = {
        subjectIds: isAll
          ? subjectOptions.map((s) => s.value) // all subjects
          : [subject], // single subject
        ayid: ayid,
      };

      const data = await RegularExamService.CheckCredit(params);
      if (data.success) {
        const parameter: GetStudents = {
          CourseId: courseId,
          Pattern: pattern,
          Semester: semester,
          SubjectId: isAll
            ? subjectOptions.map((s) => s.value) // all subjects
            : [subject], // single subject
          Ayid: ayid,
          examId: Exam,
        };
        const students = await RegularExamService.getRegularStudents(parameter);
        // setUnassignedStudents(students.unassignedStudents);
        // setAssignedStudents(students.assignedStudents)
        const assigned = students.assignedStudents ?? [];
        const unassigned = students.unassignedStudents ?? [];

        setAssignedStudents(
          students.assignedStudents.map((s) => ({ ...s, assigned: true })),
        );

        setUnassignedStudents(
          students.unassignedStudents.map((s) => ({ ...s, assigned: false })),
        );
        if (assigned.length > 0) {
          return setAlert({
            variant: "warning",
            title: "Warning",
            message:
              "Students are already assigned for this exam. Please use Edit mode to make changes.",
          });
        }
        if (unassigned.length == 0) {
          return setAlert({
            variant: "error",
            title: "Error",
            message: "Data Not Found!!.",
          });
        }
        setIsEditMode(false);
      } else {
        Swal.fire({
          title: "Failed!",
          text: data.message,
          icon: "error",
          showConfirmButton: false, // ❌ OK button removed
          timer: 2000,
        });
      }
    } catch (error) {
      console.error("Failed to fetch credits", error);
    }
  };

  const handleSave = async () => {
    try {
      if (!ayid) {
        return Swal.fire("Error", "Academic Year missing", "error");
      }

      const payload = {
        examInfo: {
          courseId,
          pattern,
          semester,
          subjectId: Isallsubjects
            ? subjectOptions.map((s) => s.value) // all subjects
            : [subject], // single subject
          ayid,
          examId: Exam,
        },
        students: unassignedStudents.map((s) => ({
          stdMstId: s.stdMstId,
          studentId: s.studentId,
          studentName: s.studentName,
          assigned: s.assigned,
        })),
      };

      const res = await RegularExamService.saveRegularStudents(payload);

      if (res.success) {
        Swal.fire({
          title: "Saved!",
          text: res.message,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        const parameter: GetStudents = {
          CourseId: courseId,
          Pattern: pattern,
          Semester: semester,
          SubjectId: Isallsubjects
            ? subjectOptions.map((s) => s.value) // all subjects
            : [subject], // single subject
          Ayid: ayid,
          examId: Exam,
        };
        const students = await RegularExamService.getRegularStudents(parameter);
        invalidateExams(); // seat-no / ATKT exam lists derive from MarksMaster rows
        setUnassignedStudents(students.unassignedStudents);
        setAssignedStudents(students.assignedStudents);
        setSelectAll(false);
      } else {
        Swal.fire({
          title: "Failed!",
          text: res.message,
          icon: "error",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save data", "error");
    }
  };

  const handleUpdate = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Unchecked students will deleted from exam. Do you want to proceed?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2647dcff",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it",
      });

      // ❌ Cancel clicked
      if (!result.isConfirmed) return;

      if (!ayid) {
        return Swal.fire("Error", "Academic Year missing", "error");
      }

      const payload = {
        examInfo: {
          courseId,
          pattern,
          semester,
          subjectId: Isallsubjects
            ? subjectOptions.map((s) => s.value) // all subjects
            : [subject], // single subject
          ayid,
          examId: Exam,
        },
        students: assignedStudents.map((s) => ({
          stdMstId: s.stdMstId,
          studentId: s.studentId,
          studentName: s.studentName,
          assigned: s.assigned,
        })),
      };

      const res = await RegularExamService.UpdateRegularStudents(payload);

      if (res.success) {
        Swal.fire({
          title: "Updated!",
          text: res.message,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        const parameter: GetStudents = {
          CourseId: courseId,
          Pattern: pattern,
          Semester: semester,
          SubjectId: Isallsubjects
            ? subjectOptions.map((s) => s.value) // all subjects
            : [subject], // single subject
          Ayid: ayid,
          examId: Exam,
        };
        const students = await RegularExamService.getRegularStudents(parameter);
        invalidateExams(); // seat-no / ATKT exam lists derive from MarksMaster rows
        setUnassignedStudents(students.unassignedStudents);
        setAssignedStudents(students.assignedStudents);
        setIsEditMode(false);
        setSelectAll(false);
      } else {
        Swal.fire({
          title: "Failed!",
          text: res.message,
          icon: "error",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to Update data", "error");
    }
  };

  return (
    <>
      {alert && (
        <div className="w-full mb-4">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}
      <PageMeta
        title="Staff Dashboard"
        description="Welcome to the Staff Portal"
      />
      <ComponentCard title="Assign Regular Exam">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-5">
          {/* Course */}
          <Select
            options={courseOptions}
            placeholder="Select Course"
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setPattern("");
              setSemester("");
              setSubject("");
              setExam("");
            }}
          />

          {/* Pattern */}
          {courseId && (
            <Select
              options={patternOptions}
              placeholder="Select Pattern"
              value={pattern}
              onChange={(value) => {
                setPattern(value);
                setSemester("");
                setSubject("");
                setExam("");
              }}
            />
          )}

          {/* Semester */}
          {pattern && (
            <Select
              options={semesterOptions}
              placeholder="Select Semester"
              value={semester}
              onChange={(value) => {
                setSemester(value);
                setSubject("");
              }}
            />
          )}

          {/* Exam */}
          {semester && (
            <Select
              options={ExamOptions}
              placeholder="Select Exam"
              value={Exam} // 👈 IMPORTANT
              onChange={(value) => {
                setExam(value);
                setSubject("");
              }}
            />
          )}

          {/* Subject */}
          {Exam && (
            <>
              <Select
                options={subjectOptions}
                placeholder="Select Subject"
                disabled={Isallsubjects}
                value={subject} // 👈 IMPORTANT
                onChange={(value) => {
                  setSubject(value);
                }}
              />
              <Switch
                key={Isallsubjects ? "on" : "off"}
                label="Assign in All Subjects"
                color="blue"
                defaultChecked={Isallsubjects}
                onChange={Assignallsubjects}
              />
            </>
          )}
        </div>
        <div className="flex justify-center gap-4 pt-5">
          {(subject || Isallsubjects) && (
            <>
              {(unassignedStudents.length > 0 || isEditMode) && (
                <>
                  <button
                    className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"
                    onClick={isEditMode ? handleUpdate : handleSave}
                  >
                    {" "}
                    <Save size={18} />
                    <span>{isEditMode ? "Update" : "Save"}</span>
                  </button>
                  {isEditMode && (
                    <button
                      className="min-w-64 bg-red-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"
                      onClick={() => {
                        setIsEditMode(false);
                      }}
                    >
                      {" "}
                      <X size={18} />
                      <span>Cancel</span>
                    </button>
                  )}
                </>
              )}

              {assignedStudents.length > 0 && !isEditMode && (
                <button
                  className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"
                  onClick={() => {
                    setIsEditMode(true);
                  }}
                >
                  {" "}
                  <Save size={18} />
                  <span>Edit</span>
                </button>
              )}
            </>
          )}
        </div>
        {unassignedStudents.length > 0 && !isEditMode && (
          <>
            <div className="flex justify-end mb-3 ml-6">
              <Switch
                key={selectAll ? "on" : "off"}
                label="Select All"
                color="blue"
                defaultChecked={selectAll}
                onChange={(checked) => {
                  setSelectAll(checked);

                  setUnassignedStudents((prev) =>
                    prev.map((s) => ({ ...s, assigned: checked })),
                  );
                }}
              />
            </div>
            <DataTable
              data={unassignedStudents}
              columns={columns}
              searchKeys={["name", "examType"]}
              filters={filters}
            />
          </>
        )}
        {assignedStudents.length > 0 && isEditMode && (
          <DataTable
            data={assignedStudents}
            columns={columns}
            searchKeys={["name", "examType"]}
            filters={filters}
          />
        )}
      </ComponentCard>
    </>
  );
}
