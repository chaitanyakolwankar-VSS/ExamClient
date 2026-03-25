//  "../../../" to go up 3 levels: Dashboard -> Staff -> pages -> src
import PageMeta from "../../../components/common/PageMeta";
import { useState, useEffect, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import { CourseApiResponse, CourseService } from "../../../services/Course";
import { PatternService, PatternApiResponse } from "../../../services/Pattern";
import { ExamApiResponse } from "../../../services/RegularExamService";
import { AssignSeatNoService, ExamApiRequest, GetStudentsRequest, GetStudentsResponse, SaveSeatNo } from "../../../services/AssignSeatNoService";
import Swal from "sweetalert2";
import DataTable from "../../../components/ui/table/DataTable";
import Input from "../../../components/form/input/InputField";
import { Save ,X} from "lucide-react";
interface Option {
  value: string;
  label: string;
}
type AlertVariant = "success" | "warning" | "error" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
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
export default function AssignSeatNo() {

    //Alert
    const [alert, setAlert] = useState<AlertState | null>(null);

  // 🔹 Course
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [courseId, setCourseId] = useState("");

  // 🔹 Pattern
  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");

  // 🔹 Exam
  const [ExamOptions, setExamOptions] = useState<Option[]>([]);
  const [Exam, setExam] = useState("");

    const [AssignSeatNoStudents, setAssignSeatNoStudents] = useState<GetStudentsResponse[]>([]);

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
      setAssignSeatNoStudents([]);
    }
  }, [courseId]);
  useEffect(() => {
    if (semester) {
      setExam("");
      fetchexam();
    }
    setAssignSeatNoStudents([]);
  }, [semester]);

  useEffect(() => {
    if (Exam) {
      fetchStudents();
    }

  }, [Exam]);


  const filters = useMemo(() => ({}), []);
  const columns = useMemo<Column<GetStudentsResponse>[]>(() => [

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
    //  {
    //   key: "quotaType",
    //   label: "Quota Type",
    //   sortable: true,
    // },
    {
      key: "quotaType",
      label: "Quota Type",
      sortable: true,
      render: (row) => (
        <Input
          type="text"
          value={row.quotaType || ""}
          maxLength={10}
          onChange={(e) => {
            const value = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
            handleQuotaTypeChange(row.marksId, value);
          }}

          className="form-control"
        />
      )
    },
    {
      key: "seatNo",
      label: "Seat No",
      sortable: true,
      render: (row) => (
        <Input
          type="text"
          value={row.seatNo || ""}
          maxLength={10}
          onChange={(e) => handleSeatNoChange(row.marksId, e.target.value)}
          className="form-control"
        />
      )
    }
  ], []);
  const handleSeatNoChange = (id: string, value: string) => {
    setAssignSeatNoStudents(prev =>
      prev.map(student =>
        student.marksId === id
          ? { ...student, seatNo: value }
          : student
      )
    );
  };
  const handleQuotaTypeChange = (id: string, value: string) => {
    setAssignSeatNoStudents(prev =>
      prev.map(student =>
        student.marksId === id
          ? { ...student, quotaType: value }
          : student
      )
    );
  };
const generateSeatNumbers = () => {
  let prefix = "";
  let number = 0;
  let numberLength = 0;

  // last filled seat no find karo
  for (const s of AssignSeatNoStudents) {
    if (s.seatNo && s.seatNo.trim() !== "") {
      const match = s.seatNo.trim().match(/^(.*?)(\d+)$/);
      if (match) {
        prefix = match[1];
        number = parseInt(match[2], 10);
        numberLength = match[2].length;
      }
    }
  }

  let next = number;

  const updated = AssignSeatNoStudents.map(s => {
    if (!s.seatNo || s.seatNo.trim() === "") {
      next++;
      const padded = next.toString().padStart(numberLength, "0");
      return {
        ...s,
        seatNo: `${prefix}${padded}`,
      };
    }
    return s;
  });

  setAssignSeatNoStudents(updated);
};

const Reset=()=>{
  setCourseId("");
  setPattern("");
  setSemester("");
  setExam("");
  setAssignSeatNoStudents([]);
}


  // ================= API CALLS =================

  //Call Course
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

  //Call Pattern
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

  //Call Exam
  const fetchexam = async () => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }


      const parameter: ExamApiRequest = {
        Courseid: courseId,
        Ayid: ayid,
        Semester: semester
      }
      const data: ExamApiResponse[] = await AssignSeatNoService.getExam(parameter);
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

  //Fectch Students
  const fetchStudents = async () => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }


      const parameter: GetStudentsRequest = {
        Courseid: courseId,
        Ayid: ayid,
        Semester: semester,
        Pattern: pattern,
        ExamId: Exam
      }
      const data: GetStudentsResponse[] = await AssignSeatNoService.getAssignSeatNoStudent(parameter);
      setAssignSeatNoStudents(
        data.map(s => ({ ...s, assigned: true }))
      );

    } catch (error) {
      console.error("Failed to fetch exam", error);
    }
  };

  const handleSave = async () => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year missing", "error");
      }
      const payload: SaveSeatNo = {
        students: AssignSeatNoStudents.map(s => ({
          marksId: s.marksId,
          studentId: s.studentId,
          studentName: s.studentName,
          quotaType: s.quotaType,
          seatNo: s.seatNo
        }))
      };



      const res = await AssignSeatNoService.UpdateSeatNo(payload);

      if (res.success) {
        Swal.fire({
          title: "Saved!",
          text: res.message,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      else {
         return setAlert({
            variant: "error",
            title: "Error",
            message: res.message,
          });
      }
    } catch (err) {
       return setAlert({
            variant: "error",
            title: "Error",
            message: "Failed to save data.",
          });
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
      <ComponentCard title="Assign Seat No">
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
                setExam("");
                setAssignSeatNoStudents([]);
              }}
            />
          )}


          {/* Semester */}
          {pattern && (
            <Select
              options={semesterOptions}
              placeholder="Select Semester"
              value={semester}
              onChange={(value) => { setSemester(value); }}
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
              }}
            />
          )}


        </div>

        {AssignSeatNoStudents.length > 0 && (<>
          <div className="flex justify-center gap-4 pt-5">
            <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"    onClick={handleSave}> <Save size={18} />
              <span>{"Save"}</span></button>
              <button className="min-w-64 bg-red-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"    onClick={Reset}> <X size={18} />
              <span>{"Cancel"}</span></button>

          </div>
  <div className="flex justify-end mb-3 ml-6">
  <button
 className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"
  onClick={generateSeatNumbers}
>
  Generate Seat Number
</button>
  </div>
          <DataTable
            data={AssignSeatNoStudents}
            columns={columns}
            searchKeys={["name", "examType"]}
            filters={filters}
          />
        </>)}

      </ComponentCard>
    </>
  )
}