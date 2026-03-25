import PageMeta from "../../../components/common/PageMeta"; 
import { useState, useEffect, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { PatternService, PatternApiResponse } from "../../../services/Pattern";
import { CourseService, CourseApiResponse } from "../../../services/Course";
import Swal from "sweetalert2";
import { ExamApiRequest ,ExamApiResponse} from "../../../services/RegularExamService";
import { GenerateHallTicketService,HallticketSubjects, HallticketSubjectsRequest,SaveTimeTable,StudentHallTicketDataRequest ,StudentHallTicketData} from "../../../services/GenerateHallTicketService";
import DataTable from "../../../components/ui/table/DataTable";
import Input from "../../../components/form/input/InputField";
import {  Save } from "lucide-react";
import Switch from "../../../components/form/switch/Switch";
import HallTicketPage from "../../../components/HallTicket/Hallticket";
//import { useNavigate } from "react-router-dom";
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
interface Subject {
  code: string;
  name: string;
  date: string;
  time: string;
}
interface College{
  logo:string;
  center:string;
  CourseNmae:string;
}

interface Student {
  name: string;
  centre: string;
  seat: string;
  subjects: Subject[];
}
interface HallTicketData {
  college: College;
  students: Student[];
}
type AlertVariant = "success" | "warning" | "error" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}
export default function GenerateHallTicket() {

  //Alert
    const [alert, setAlert] = useState<AlertState | null>(null);

  // 🔹 Course
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [courseId, setCourseId] = useState("");

  // 🔹 Pattern
  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");


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

    // 🔹 Exam
    const [ExamOptions, setExamOptions] = useState<Option[]>([]);
    const [Exam, setExam] = useState("");

     //    HallTickect Subjects
      const [Subjects, setSubjects] = useState<HallticketSubjects[]>([]);

      //Single Student HallTicket
      const [SingleStudent,setSingleStudent]=useState(false);

      //All Student HallTicket
      const [AllStudents,setAllStudents]=useState(false);
    
const [studentId, setStudentId] = useState("");

  const filters = useMemo(() => ({}), []);

  const columns = useMemo<Column<HallticketSubjects>[]>(() => [

    {
      key: "subjectCode",
      label: "Subject Code",
      sortable: true,
    },
     {
      key: "subjectName",
      label: "Subject Name",
      sortable: true,
    },
    {
  key: "examTime",
  label: "Exam Time",
  sortable: true,
  render: (row) => (
    <Input
      type="text"
      value={row.examTime || ""}
      placeholder="HH:MM AM - HH:MM PM"
      maxLength={20}
      onChange={(e) =>
      {
        const value = e.target.value;

    // Allow only valid characters while typing
    const allowed = value.replace(/[^0-9APMapm:\-\s]/g, "");

    handleTimeChange(row.subjectId, allowed);
      }
      }
    />
  ),
},
     {
  key: "examDate",
  label: "Exam Date",
  sortable: true,
  render: (row) => (
   <Input
  type="text"
  value={row.examDate || ""}
  placeholder="DD-MM-YYYY"
  maxLength={10}
  onChange={(e) => {
    const value = e.target.value;

    // Allow only numbers and dash
    const cleaned = value.replace(/[^0-9-]/g, "");

    handleDateChange(row.subjectId, cleaned);
  }}
/>
  ),
}

  ], []);

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
    } 
    
  }, [courseId]);

  
  useEffect(() => {
    if (semester) {
      setExam("");
      fetchexam();
    } 
  }, [semester]);

   useEffect(() => {
    setSubjects([]);
    setStudentId("");
    setSingleStudent(false);
    setAllStudents(false);
    if (Exam) {
      fetchsubjects();
    } 
  }, [Exam]);

const handleDateChange = (id: string, value: string) => {
  const regex = /^[0-9/-]*$/;

  if (!regex.test(value)) return;

  setSubjects((prev) =>
    prev.map((sub) =>
      sub.subjectId === id ? { ...sub, examDate: value } : sub
    )
  );
};

const handleTimeChange = (id: string, value: string) => {

  const regex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)\s-\s(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

  setSubjects((prev) =>
    prev.map((sub) =>
      sub.subjectId === id ? { ...sub, examTime: value } : sub
    )
  );

};
  const AllStudentHallTicket = async (checked: boolean) => {
      setSingleStudent(false);
    setAllStudents(checked);
  };
    const SingleStudentHallTicket = async (checked: boolean) => {
      setSingleStudent(checked);
    setAllStudents(false);

  };
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
      const data: ExamApiResponse[] = await GenerateHallTicketService.getExam(parameter);
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

    const fetchsubjects= async () => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }


      const parameter: HallticketSubjectsRequest = {
        ayid: ayid,
        courseId: courseId,
        semester:semester,
        pattern:pattern,
        examId:Exam
      }
      const data: HallticketSubjects[] = await GenerateHallTicketService.getHallTicketSubjects(parameter);
      setSubjects(data);
      if(data.length==0){
        return setAlert({
            variant: "warning",
            title: "Warning",
            message: "Data not Found!!",
          });
      } 
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
  const payload:SaveTimeTable={
    ExamId:Exam,
    CourseId:courseId,
    TimeTableData:Subjects
  }
    

    const res = await GenerateHallTicketService.saveTimeTable(payload);
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
    const HallTicket=async()=>{
      if(!SingleStudent && !AllStudents){
                return setAlert({
            variant: "error",
            title: "Error",
            message: "Please Check Single or All Students!!",
          });
      }
       const ayid = localStorage.getItem("AYID");
        if (!ayid) {
          return Swal.fire("Error", "Academic Year missing", "error");
        }
        let hallticketmode: string = "";
        if(AllStudents){
          hallticketmode="All";
        }
        else if(SingleStudent){
hallticketmode="Single";
        }
        const payload:StudentHallTicketDataRequest={
          Ayid:ayid,
          ExamId:Exam,
          Semester:semester,
          Pattern:pattern,
          Mode:hallticketmode,
          StudentId:SingleStudent?studentId:""
        }
        const data: StudentHallTicketData[] = await GenerateHallTicketService.getHallTicketStudents(payload);
    
         const collegedata = await GenerateHallTicketService.getcollegeDataExam();
      
//        const hallTicketData: HallTicketData = {
//   college: {
//     logo: "https://res.cloudinary.com/dhgbsprh4/image/upload/v1769075102/college_banners/xqdfwnxbdx0xqp3uqcky.png",
//     center: "VIVA COLLEGE",
//     CourseNmae: "MECHANICAL ENGINEERING ("+pattern+")"
//   },
//   students: data
// };
  const hallTicketData: HallTicketData = {
  college: {
    logo: collegedata.logo,
    center: collegedata.center,
    CourseNmae: "MECHANICAL ENGINEERING ("+pattern+")"
  },
  students: data
};

if(data.length==0){
return setAlert({
            variant: "warning",
            title: "Warning",
            message: "Data Not Found!!.",
          });
}
// navigate("/hallticket", { state: hallTicketData });
localStorage.setItem("hallTicketData", JSON.stringify(hallTicketData));
  window.open("/hallticket", "_blank");
    }
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
      <ComponentCard  title="Generate HallTicket">
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
{Subjects.length>0 &&(
  <div className="flex justify-center gap-4 pt-6 items-center">

  <Switch
    label="Single Student"
    color="blue"
    checked={SingleStudent}
    onChange={(checked) => { SingleStudentHallTicket(checked) }}
  />

  {SingleStudent &&(
     <Input 
  type="text" 
  placeholder="Enter Student Id"
  className="w-full"
  maxLength={9}
  value={studentId}
  onChange={(e) => {
    const value = e.target.value;

    // Allow only letters and numbers
    const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, "");

    setStudentId(cleanedValue);
  }}
/>
  )}

 
  

  <Switch
    label="All Student"
    color="blue"
    checked={AllStudents}
    onChange={(checked) => { AllStudentHallTicket(checked) }}
  />

  <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2" onClick={handleSave}>
    <Save size={18} />
    <span>Save</span>
  </button>

  <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2" onClick={() => { HallTicket() }}>
    <Save size={18} />
    <span>HallTicket</span>
  </button>

</div>
)}
{Subjects.length>0 &&(
  <DataTable
            data={Subjects}
            columns={columns}
            searchKeys={["name", "examType"]}
            filters={filters}
          />
)}
     
        
        </ComponentCard>
    </>
  );
}