import { useEffect, useMemo, useState } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import {
  useCourses,
  usePatterns,
  useSemesters,
  useExams,
  toCourseOptions,
  toPatternOptions,
  toSemesterOptions,
  toExamOptions,
} from "../../../data";

const StudentAssignReport = () => {
  const [courseId, setCourseId] = useState("");
  const courses = useCourses();
  const courseOptions = useMemo(() => toCourseOptions(courses.data), [courses.data]);

  const [pattern, setPattern] = useState("");
  const patterns = usePatterns();
  const patternOptions = useMemo(() => toPatternOptions(patterns.data), [patterns.data]);

  const [semester, setSemester] = useState("");
  const semesters = useSemesters();
  const semesterOptions = useMemo(() => toSemesterOptions(semesters.data), [semesters.data]);

  // Regular exams of the course for the selected academic year (what /RegularExam/get-exam returned).
  const [Exam, setExam] = useState("");
  const exams = useExams({ courseId, purpose: "regular" });
  const ExamOptions = useMemo(() => toExamOptions(exams.data), [exams.data]);

  useEffect(() => {
    if (!courseId) {
      setPattern("");
      setSemester("");
      setExam("");
    }
  }, [courseId]);

  useEffect(() => {
    if (semester) {
      setExam("");
    }
  }, [semester]);

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
