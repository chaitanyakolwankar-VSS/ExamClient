import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { CourseService, CourseApiResponse } from "../../../services/Course";
import { PatternService, PatternApiResponse } from "../../../services/Pattern";
import { GetSubject, SubjectApiResponse } from "../../../services/GetSubject";
import { GetCredits } from "../../../services/SubjectService";
import { ExamApiRequest, ExamApiResponse, RegularExamService, RegularStudents, GetStudents, RegularCredits } from "../../../services/RegularExamService";
import Swal from "sweetalert2";
import { Plus, Trash2, Edit, X, Pencil, Save, RefreshCcw, CheckCircle, Eye, Copy, Delete } from "lucide-react";
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

  // 🔹 Course
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [courseId, setCourseId] = useState("");

  // 🔹 Pattern
  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");

  // 🔹 Exam
  const [ExamOptions, setExamOptions] = useState<Option[]>([]);
  const [Exam, setExam] = useState("");

  // 🔹 Semester (hard coded)
  const semesterOptions: Option[] = [
    { value: "Sem-1", label: "Semester I" },
    { value: "Sem-2", label: "Semester II" },
    { value: "Sem-3", label: "Semester III" },
    { value: "Sem-4", label: "Semester IV" },
    { value: "Sem-5", label: "Semester V" },
    { value: "Sem-6", label: "Semester VI" },
    { value: "Sem-7", label: "Semester VII" },
    { value: "Sem-8", label: "Semester VIII" },
  ];
  const [semester, setSemester] = useState("");

  // 🔹 Subject
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  const [subject, setSubject] = useState("");

  //     Regular Students
  const [unassignedStudents, setUnassignedStudents] = useState<RegularStudents[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<RegularStudents[]>([]);

  //     Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);

  //  Assign   all subjects
  const [Isallsubjects, setIsallsubjects] = useState(false);

  //Alert
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [selectAll, setSelectAll] = useState(false);


  const filters = useMemo(() => ({}), []);

  const columns = useMemo<Column<RegularStudents>[]>(() => [

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

  ], []);


  const updateStudent = (stdMstId: string, assigned: boolean) => {

    setAssignedStudents(prev =>
      prev.map(s =>
        s.stdMstId === stdMstId
          ? { ...s, assigned }
          : s
      )
    );

    setUnassignedStudents(prev =>
      prev.map(s =>
        s.stdMstId === stdMstId
          ? { ...s, assigned }
          : s
      )
    );

  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    fetchCourses();
  }, []);
  // 🔹 Load patterns when course changes
  useEffect(() => {
    if (courseId) {
      fetchPatterns(courseId);
    } else {
      setPatternOptions([]);
      setPattern("");
      setSemester("");
      setExam("");
      setSubject("");
      setSubjectOptions([]);
      reset();
    }
  }, [courseId]);

  useEffect(() => {
    if (semester) {
      setExam("");
      fetchexam();
    } 
    reset();
  }, [semester]);
  useEffect(() => {
    if (Exam) {
      fetchSubjects(courseId, pattern, semester);
    }

    Assignallsubjects(false);

  }, [Exam]);

  useEffect(() => {
    if (Exam) {
      CheckCredits(false);
    } else {
    }
    reset()

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
  }
  // ================= API CALLS =================

  const fetchCourses = async () => {
    try {
      const data: CourseApiResponse[] = await CourseService.getCourse();

      setCourseOptions(
        data.map((c) => ({
          value: c.courseid,
          label: c.coursename,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch courses", error);
    }
  };
  const fetchexam = async () => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }


      const parameter: ExamApiRequest = {
        Courseid: courseId,
        Ayid: ayid
      }
      const data: ExamApiResponse[] = await RegularExamService.getExam(parameter);
      console.log("EXAM API RAW RESPONSE 👉", data);
      const mappedData = data.map((e) => ({
        value: e.examId,
        label: e.examname
      }));

      setExamOptions(mappedData); // ✅ update state
    } catch (error) {
      console.error("Failed to fetch exam", error);
    }
  };

  const fetchPatterns = async (courseId: string) => {
    try {
      const data: PatternApiResponse[] = await PatternService.getpattern();

      setPatternOptions(
        data.map((p) => ({
          value: p.patternName,
          label: p.patternName,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch patterns", error);
    }
  };
  const fetchSubjects = async (
    courseId: string,
    pattern: string,
    semester: string
  ) => {
    try {
      const data: SubjectApiResponse[] = await GetSubject.getSubject({ courseId, pattern, semester });

      setSubjectOptions(
        data.map((s) => ({
          value: s.subjectId,
          label: s.subjectName,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch subjects", error);
    }
  };
  const CheckCredits = async (isAll: boolean = Isallsubjects) => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }
      // const params:RegularCredits={
      //   subjectIds:[subject],
      //   ayid:ayid,
      // }
      const params: RegularCredits = {
        subjectIds: isAll
          ? subjectOptions.map(s => s.value) // all subjects
          : [subject],                       // single subject
        ayid: ayid,
      };

      const data = await RegularExamService.CheckCredit(params);
      if (data.success) {
        const parameter: GetStudents = {
          CourseId: courseId,
          Pattern: pattern,
          Semester: semester,
          SubjectId: isAll
            ? subjectOptions.map(s => s.value) // all subjects
            : [subject],                       // single subject
          Ayid: ayid,
          examId: Exam,
        }
        const students = await RegularExamService.getRegularStudents(parameter);
        // setUnassignedStudents(students.unassignedStudents);
        // setAssignedStudents(students.assignedStudents)
        const assigned = students.assignedStudents ?? [];
        const unassigned = students.unassignedStudents ?? [];
       
        setAssignedStudents(
          students.assignedStudents.map(s => ({ ...s, assigned: true }))
        );

        setUnassignedStudents(
          students.unassignedStudents.map(s => ({ ...s, assigned: false }))
        );
         if (assigned.length > 0) {
          return setAlert({
            variant: "warning",
            title: "Warning",
            message: "Students are already assigned for this exam. Please use Edit mode to make changes.",
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
      }
      else {
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
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year missing", "error");
      }

      const payload = {
        examInfo: {
          courseId,
          pattern,
          semester,
          subjectId: Isallsubjects
            ? subjectOptions.map(s => s.value) // all subjects
            : [subject],                       // single subject
          ayid,
          examId: Exam
        },
        students: unassignedStudents.map(s => ({
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
            ? subjectOptions.map(s => s.value) // all subjects
            : [subject],                       // single subject
          Ayid: ayid,
          examId: Exam,
        }
        const students = await RegularExamService.getRegularStudents(parameter);
        setUnassignedStudents(students.unassignedStudents);
        setAssignedStudents(students.assignedStudents)
               setSelectAll(false);
      }
      else {
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


      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year missing", "error");
      }

      const payload = {
        examInfo: {
          courseId,
          pattern,
          semester,
          subjectId: Isallsubjects
            ? subjectOptions.map(s => s.value) // all subjects
            : [subject],                       // single subject
          ayid,
          examId: Exam
        },
        students: assignedStudents.map(s => ({
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
            ? subjectOptions.map(s => s.value) // all subjects
            : [subject],                       // single subject
          Ayid: ayid,
          examId: Exam
        }
        const students = await RegularExamService.getRegularStudents(parameter);
        setUnassignedStudents(students.unassignedStudents);
        setAssignedStudents(students.assignedStudents);
        setIsEditMode(false);
        setSelectAll(false);
      }
      else {
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
              onChange={(value) => { setSemester(value); setSubject(""); }}
            />
          )}

          {/* Exam */}
          {semester && (
            <Select
              options={ExamOptions}
              placeholder="Select Exam"
              value={Exam}   // 👈 IMPORTANT
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
                value={subject}   // 👈 IMPORTANT
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
                 <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"    onClick={isEditMode ? handleUpdate : handleSave}> <Save size={18} />
                  <span>{isEditMode ? "Update" : "Save"}</span></button>
                  {isEditMode&&(<button className="min-w-64 bg-red-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"  onClick={() => { setIsEditMode(false); }}> <X size={18} />
                  <span>Cancel</span></button>)}
                      
                </>
               
              )
              }


              {(assignedStudents.length > 0 && !isEditMode) && (
                <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"  onClick={() => { setIsEditMode(true); }}> <Save size={18} />
                  <span>Edit</span></button>
              )}
            </>

          )}
        </div>
        {(unassignedStudents.length > 0 && !isEditMode) && (
          <>
            <div className="flex justify-end mb-3 ml-6">
    <Switch
      key={selectAll ? "on" : "off"}
      label="Select All"
      color="blue"
      defaultChecked={selectAll}
      onChange={(checked) => {
        setSelectAll(checked);

        setUnassignedStudents(prev =>
          prev.map(s => ({ ...s, assigned: checked }))
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
        {(assignedStudents.length > 0 && isEditMode) && (
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