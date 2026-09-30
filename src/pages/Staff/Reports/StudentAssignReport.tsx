import { useEffect, useState } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { CourseApiResponse, CourseService } from "../../../services/Course";
import { PatternApiResponse, PatternService } from "../../../services/Pattern";
import {
  ExamApiRequest,
  ExamApiResponse,
} from "../../../services/GenerateHallTicketService";
import { RegularExamService } from "../../../services/RegularExamService";
import Swal from "sweetalert2";

interface Option {
  value: string;
  label: string;
}

const StudentAssignReport = () => {
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [courseId, setCourseId] = useState("");

  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");

  const [ExamOptions, setExamOptions] = useState<Option[]>([]);
  const [Exam, setExam] = useState("");
  // ===== OPTIONS =====
  const CourseOption: Option[] = [];

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
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchPatterns(courseId);
    } else {
      setPatternOptions([]);
      setPattern("");
      setSemester("");
      setExam("");
    }
  }, [courseId]);

  useEffect(() => {
    if (semester) {
      setExam("");
      fetchexam();
    }
  }, [semester]);

  const fetchCourses = async () => {
    try {
      const data: CourseApiResponse[] = await CourseService.getCourse();

      setCourseOptions(
        data.map((c) => ({
          value: c.courseid,
          label: c.coursename,
        })),
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
        })),
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
        Ayid: ayid,
      };
      const data: ExamApiResponse[] =
        await RegularExamService.getExam(parameter);
      console.log("EXAM API RAW RESPONSE 👉", data);
      const mappedData = data.map((e) => ({
        value: e.examId,
        label: e.examname,
      }));

      setExamOptions(mappedData); // ✅ update state
    } catch (error) {
      console.error("Failed to fetch exam", error);
    }
  };

  return (
    <ComponentCard title="Students Assign Report">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select
          options={courseOptions}
          placeholder="Select Course"
          value={courseId}
          onChange={(value) => {
            setCourseId(value);
            setPattern("");
            setExam("");
          }}
        />
        {courseId && (
          <Select
            options={patternOptions}
            placeholder="Select Pattern"
            value={pattern}
            onChange={(value) => {
              setPattern(value);
              setSemester("");
              // setSubject("");
              setExam("");
            }}
          />
        )}

        {pattern && (
          <Select
            options={semesterOptions}
            placeholder="Select Semester"
            value={semester}
            onChange={setSemester}
          />
        )}

        {semester && (
          <Select
            options={ExamOptions}
            placeholder="Select Exam"
            value={Exam}
            onChange={(value) => {
              setExam(value);
            }}
          />
        )}
      </div>
    </ComponentCard>
  );
};

export default StudentAssignReport;
