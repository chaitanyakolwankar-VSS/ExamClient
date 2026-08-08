import PageMeta from "../../../components/common/PageMeta"; 
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { PatternService, PatternApiResponse } from "../../../services/Pattern";
import { CourseService, CourseApiResponse } from "../../../services/Course";
import Swal from "sweetalert2";
import { ExamApiRequest ,ExamApiResponse} from "../../../services/RegularExamService";
import { GenerateHallTicketService,HallticketSubjects, HallticketSubjectsRequest,SaveTimeTable,StudentHallTicketDataRequest ,StudentHallTicketData} from "../../../services/GenerateHallTicketService";
import DataTable from "../../../components/ui/table/DataTable";
import Input from "../../../components/form/input/InputField";
import { Save, Printer, Loader2 } from "lucide-react";
import Switch from "../../../components/form/switch/Switch";
import Alert from "../../../components/ui/alert/Alert";
import Button from "../../../components/ui/button/Button";

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

interface College {
  logo: string;
  center: string;
  CourseNmae: string;
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
  // Alert (Auto-clearing)
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

  // HallTicket Subjects
  const [Subjects, setSubjects] = useState<HallticketSubjects[]>([]);

  // Single Student HallTicket
  const [SingleStudent, setSingleStudent] = useState(false);
  const [studentId, setStudentId] = useState("");

  const [loading, setLoading] = useState(false);

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
          onChange={(e) => {
            let value = e.target.value;
            value = value.replace(/[^0-9apAP]/g, "");
            let formatted = "";

            if (value.length >= 1) formatted += value[0];
            if (value.length >= 2) formatted += value[1];
            if (value.length >= 2) formatted += ":";
            if (value.length >= 3) formatted += value[2];
            if (value.length >= 4) formatted += value[3];
            if (value.length >= 4) formatted += " ";

            if (value.length >= 5) {
              if (value[4].toLowerCase() === "a") {
                formatted += "AM";
              } else if (value[4].toLowerCase() === "p") {
                formatted += "PM";
              }
            }

            if (value.length >= 5) formatted += " - ";
            if (value.length >= 6) formatted += value[5];
            if (value.length >= 7) formatted += value[6];
            if (value.length >= 7) formatted += ":";
            if (value.length >= 8) formatted += value[7];
            if (value.length >= 9) formatted += value[8];
            if (value.length >= 9) formatted += " ";

            if (value.length >= 10) {
              if (value[9].toLowerCase() === "a") {
                formatted += "AM";
              } else if (value[9].toLowerCase() === "p") {
                formatted += "PM";
              }
            }

            handleTimeChange(row.subjectId, formatted);
          }}
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
            let value = e.target.value;
            value = value.replace(/[^0-9]/g, "");

            if (value.length > 2 && value.length <= 4) {
              value = value.slice(0, 2) + "-" + value.slice(2);
            } else if (value.length > 4) {
              value =
                value.slice(0, 2) +
                "-" +
                value.slice(2, 4) +
                "-" +
                value.slice(4, 8);
            }

            handleDateChange(row.subjectId, value);
          }}
        />
      ),
    }
  ], []);

  // Auto-clearing Alert
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    fetchCourses();
  }, []);

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
    if (Exam) {
      fetchsubjects();
    } 
  }, [Exam]);

  // Cascading Reset Handlers
  const handleCourseChange = (value: string) => {
    setCourseId(value);
    setPattern("");
    setSemester("");
    setExam("");
    setSubjects([]);
  };

  const handlePatternChange = (value: string) => {
    setPattern(value);
    setSemester("");
    setExam("");
    setSubjects([]);
  };

  const handleSemesterChange = (value: string) => {
    setSemester(value);
    setExam("");
    setSubjects([]);
  };

  const handleExamChange = (value: string) => {
    setExam(value);
    setSubjects([]);
  };

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
    setSubjects((prev) =>
      prev.map((sub) =>
        sub.subjectId === id ? { ...sub, examTime: value } : sub
      )
    );
  };

  const SingleStudentHallTicket = (checked: boolean) => {
    setSingleStudent(checked);
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
      };
      const data: ExamApiResponse[] = await GenerateHallTicketService.getExam(parameter);
      const mappedData = data.map((e) => ({
        value: e.examId,
        label: e.examname
      }));
      setExamOptions(mappedData);
    } catch (error) {
      console.error("Failed to fetch exam", error);
    }
  };

  const fetchsubjects = async () => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }

      const parameter: HallticketSubjectsRequest = {
        ayid: ayid,
        courseId: courseId,
        semester: semester,
        pattern: pattern,
        examId: Exam
      };
      const data: HallticketSubjects[] = await GenerateHallTicketService.getHallTicketSubjects(parameter);
      setSubjects(data);
      if (data.length === 0) {
        return setAlert({
          variant: "warning",
          title: "No Data Found",
          message: "No subjects found for the selected exam timetable configuration.",
        });
      } 
    } catch (error) {
      console.error("Failed to fetch subjects", error);
    }
  };

  const handleSave = async () => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year missing", "error");
      }
      const payload: SaveTimeTable = {
        ExamId: Exam,
        CourseId: courseId,
        TimeTableData: Subjects
      };

      setLoading(true);
      const res = await GenerateHallTicketService.saveTimeTable(payload);
      if (res.success) {
        Swal.fire({
          title: "Saved!",
          text: res.message,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
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
    } finally {
      setLoading(false);
    }
  };

  const HallTicket = async () => {
    const ayid = localStorage.getItem("AYID");
    if (!ayid) {
      return Swal.fire("Error", "Academic Year missing", "error");
    }
    
    let hallticketmode = SingleStudent ? "Single" : "All";

    const payload: StudentHallTicketDataRequest = {
      Ayid: ayid,
      ExamId: Exam,
      Semester: semester,
      Pattern: pattern,
      Mode: hallticketmode,
      StudentId: SingleStudent ? studentId : ""
    };
    
    const data: StudentHallTicketData[] = await GenerateHallTicketService.getHallTicketStudents(payload);
    const collegedata = await GenerateHallTicketService.getcollegeDataExam();
    
    const hallTicketData: HallTicketData = {
      college: {
        logo: collegedata.logo,
        center: collegedata.center,
        CourseNmae: "MECHANICAL ENGINEERING (" + pattern + ")"
      },
      students: data 
    };

    if (data.length === 0) {
      return setAlert({
        variant: "warning",
        title: "No Data Found",
        message: "No student records found to generate hall tickets.",
      });
    }
    
    localStorage.setItem("hallTicketData", JSON.stringify(hallTicketData));
    window.open("/hallticket", "_blank");
  };

  return (
    <>
      {alert && (
        <div className="w-full mb-4">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}
      <PageMeta
        title="Staff Dashboard"
        description="Welcome to the Staff Portal"
      />
      
      <ComponentCard title="Generate HallTicket - Filters">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          {/* Course Dropdown */}
          <div className="w-full">
            <Select
              label="Course"
              options={courseOptions}
              placeholder="Select Course"
              value={courseId}
              onChange={handleCourseChange}
            />
          </div>

          <AnimatePresence mode="popLayout">
            {/* Pattern Dropdown */}
            {courseId && (
              <motion.div
                key="pattern"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Select
                  label="Pattern"
                  options={patternOptions}
                  placeholder="Select Pattern"
                  value={pattern}
                  onChange={handlePatternChange}
                />
              </motion.div>
            )}

            {/* Semester Dropdown */}
            {courseId && pattern && (
              <motion.div
                key="semester"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Select
                  label="Semester"
                  options={semesterOptions}
                  placeholder="Select Semester"
                  value={semester}
                  onChange={handleSemesterChange}
                />
              </motion.div>
            )}

            {/* Exam Dropdown */}
            {courseId && pattern && semester && (
              <motion.div
                key="exam"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Select
                  label="Exam"
                  options={ExamOptions}
                  placeholder="Select Exam"
                  value={Exam}
                  onChange={handleExamChange}
                />
              </motion.div>
            )}

            {/* Save Timetable Button (aligned as final cell in grid) */}
            {courseId && pattern && semester && Exam && Subjects.length > 0 && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex items-end gap-2 h-11"
              >
                <Button 
                  variant="primary"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-grow h-11"
                >
                  {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Save className="size-4 mr-2" />}
                  Save Timetable
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ComponentCard>

      {/* Hall Ticket Generation Configuration */}
      {Subjects.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-theme-md border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Single vs All Switch */}
              <div className="p-2 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-xl">
                <Switch
                  label="Single Student mode"
                  color="blue"
                  checked={SingleStudent}
                  onChange={SingleStudentHallTicket}
                />
              </div>

              {/* Student ID input if Single mode is selected */}
              {SingleStudent && (
                <div className="w-64">
                  <Input 
                    type="text" 
                    placeholder="Enter Student ID"
                    maxLength={9}
                    value={studentId}
                    onChange={(e) => {
                      const value = e.target.value;
                      const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, "");
                      setStudentId(cleanedValue);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Print / View HallTickets Action */}
            <Button 
              variant="primary"
              onClick={HallTicket}
              className="whitespace-nowrap h-11"
            >
              <Printer className="size-4 mr-2" />
              Generate Hall Tickets
            </Button>
          </div>
        </div>
      )}

      {/* Subjects Datatable */}
      {Subjects.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-theme-md border border-gray-200 dark:border-gray-800 p-4">
          <h4 className="font-semibold text-gray-850 dark:text-gray-200 mb-3 text-sm">Exam Timetable Schedule List</h4>
          <DataTable
            data={Subjects}
            columns={columns}
            searchKeys={["subjectName", "subjectCode"]}
            filters={filters}
            pageSizeOptions={[10]}
          />
        </div>
      )}
    </>
  );
}