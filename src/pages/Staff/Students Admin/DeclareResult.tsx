import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCourses, usePatterns, useSemesters, useAcademicYear, toCourseOptions, toPatternOptions, toSemesterOptions } from "../../../data";
import {
  DeclareExamApiResponse,
  DeclareResultService,
} from "../../../services/DeclareResultService";
import Alert from "../../../components/ui/alert/Alert";
import DataTable from "../../../components/ui/table/DataTable";

interface Option {
  value: string;
  label: string;
}

interface ExamRow {
  examId: string;
  examname: string;
  semester: string;
  declareDate: string;
  isDeclare: boolean;
}

const DeclareResult = () => {
  const { ayid } = useAcademicYear();
  const courses = useCourses();
  const courseOptions = useMemo(() => toCourseOptions(courses.data), [courses.data]);
  const [courseId, setCourseId] = useState("");

  const patterns = usePatterns();
  const patternOptions = useMemo(() => toPatternOptions(patterns.data), [patterns.data]);
  const [pattern, setPattern] = useState("");

  const semesters = useSemesters();
  const semesterOptions = useMemo(() => toSemesterOptions(semesters.data), [semesters.data]);
  const [semester, setSemester] = useState("");

  const [examOptions, setExamOptions] = useState<Option[]>([]);
  const [loadingExamOptions, setLoadingExamOptions] = useState(false);
  const [examId, setExamId] = useState("");

  const [tableRow, setTableRow] = useState<ExamRow | null>(null);
  const [loadingTableRow, setLoadingTableRow] = useState(false);

  const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({});


  useEffect(() => {
    if (!courseId) {
      setPattern("");
      setSemester("");
      setExamOptions([]);
      setExamId("");
      setTableRow(null);
    }
  }, [courseId]);

  useEffect(() => {
    if (!pattern) {
      setSemester("");
      setExamOptions([]);
      setExamId("");
      setTableRow(null);
    }
  }, [pattern]);

  useEffect(() => {
    if (!semester) {
      setExamOptions([]);
      setExamId("");
      setTableRow(null);
    }
  }, [semester]);

  const fetchExamOptions = async () => {
    if (!courseId || !semester || !ayid) return;

    try {
      setLoadingExamOptions(true);
      const data: DeclareExamApiResponse[] = await DeclareResultService.GetExam(
        {
          CourseId: courseId,
          Ayid: ayid,
          Semester: semester,
          pattern: pattern,
        },
      );
      setExamOptions(
        data.map((exam) => ({
          value: exam.examId,
          label: exam.examname,
        })),
      );
    } catch (error) {
      console.error("Error fetching exam options:", error);
      setExamOptions([]);
    } finally {
      setLoadingExamOptions(false);
    }
  };

  useEffect(() => {
    setExamId("");
    setTableRow(null);
    if (courseId && pattern && semester) {
      fetchExamOptions();
    } else {
      setExamOptions([]);
    }
  }, [courseId, pattern, semester]);

  const fetchTableRow = async () => {
    if (!courseId || !semester || !ayid || !examId) {
      setTableRow(null);
      return;
    }

    try {
      setLoadingTableRow(true);
      const data: DeclareExamApiResponse[] =
        await DeclareResultService.GetTableExam({
          CourseId: courseId,
          Ayid: ayid,
          Semester: semester,
          ExamId: examId,
          Pattern: pattern,
        });

      if (data.length > 0) {
        const exam = data[0];
        setTableRow({
          examId: exam.examId,
          examname: exam.examname,
          semester,
          declareDate: exam.declareDate ? exam.declareDate.split("T")[0] : "",
          isDeclare: exam.isDeclare ?? false,
        });
      } else {
        setTableRow(null);
      }
    } catch (error) {
      console.error("Error fetching table row:", error);
      setTableRow(null);
    } finally {
      setLoadingTableRow(false);
    }
  };

  useEffect(() => {
    if (examId) {
      fetchTableRow();
    } else {
      setTableRow(null);
    }
  }, [examId]);

  const handleDateFieldClick = (rowExamId: string) => {
    const input = dateInputRefs.current[rowExamId];
    if (input) {
      input.showPicker();
    }
  };

  const handleDateChange = (rowExamId: string, date: string) => {
    setTableRow((prev) =>
      prev && prev.examId === rowExamId ? { ...prev, declareDate: date } : prev,
    );
  };

  const handleToggleDeclare = async (row: ExamRow) => {
    if (!ayid) return;

    const willDeclare = !row.isDeclare;

    if (willDeclare && !row.declareDate) {
      showAlert(
        "error",
        "Please select a declare date before declaring the result.",
        "Error",
      );
      return;
    }

    setTableRow((prev) =>
      prev && prev.examId === row.examId
        ? {
            ...prev,
            isDeclare: willDeclare,
            declareDate: willDeclare ? prev.declareDate : "",
          }
        : prev,
    );

    try {
      await DeclareResultService.ToggleDeclareResult({
        ExamId: row.examId,
        CourseId: courseId,
        Ayid: ayid,
        Semester: semester,
        DeclareDate: willDeclare ? row.declareDate : null,
        IsDeclare: willDeclare,
        Pattern: pattern,
      });
      showAlert(
        "success",
        "Success",
        willDeclare
          ? "Result declared successfully."
          : "Result undeclared successfully.",
      );
    } catch (error) {
      console.error("Error toggling declare status:", error);
      setTableRow((prev) =>
        prev && prev.examId === row.examId
          ? { ...prev, isDeclare: row.isDeclare, declareDate: row.declareDate }
          : prev,
      );
      showAlert(
        "error",
        "Error",
        "Failed to update declare status. Please try again.",
      );
    }
  };

  const [alertData, setAlertData] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);
  const showAlert = (
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    timeout = 3000,
  ) => {
    setAlertData({ variant, title, message });
    setTimeout(() => {
      setAlertData(null);
    }, timeout);
  };

  const columns = [
    {
      key: "examname",
      label: "Exam Name",
      sortable: true,
    },
    {
      key: "semester",
      label: "Semester",
      sortable: false,
    },
    {
      key: "declareDate",
      label: "Declare Date",
      sortable: false,
      render: (row: ExamRow) => (
        <input
          ref={(el) => {
            dateInputRefs.current[row.examId] = el;
          }}
          type="date"
          className={`border rounded px-2 py-1 w-full ${
            row.isDeclare ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          value={row.declareDate}
          disabled={row.isDeclare}
          onClick={() => !row.isDeclare && handleDateFieldClick(row.examId)}
          onChange={(e) => handleDateChange(row.examId, e.target.value)}
        />
      ),
    },
    {
      key: "isDeclare",
      label: "Status",
      sortable: false,
      render: (row: ExamRow) => (
        <span className={row.isDeclare ? "text-green-600" : "text-gray-500"}>
          {row.isDeclare ? "Declared" : "Not declared"}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: false,
      className: "text-center",
      headerClassName: "text-center",
      render: (row: ExamRow) => (
        <div className="flex justify-center items-center">
          <button
            type="button"
            onClick={() => handleToggleDeclare(row)}
            disabled={!row.isDeclare && !row.declareDate}
            title={
              row.isDeclare
                ? "Declared (click to undeclare)"
                : !row.declareDate
                  ? "Select a declare date first"
                  : "Not declared (click to declare)"
            }
          >
            {row.isDeclare ? (
              <Eye className="w-7 h-7 text-green-600" />
            ) : (
              <EyeOff
                className={`w-7 h-7 ${!row.declareDate ? "text-gray-200" : "text-gray-400"}`}
              />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <ComponentCard title="Declare Result">
        {alertData && (
          <Alert
            variant={alertData.variant}
            title={alertData.title}
            message={alertData.message}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 mt-2">
          <Select
            options={courseOptions}
            placeholder="Select Course"
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setPattern("");
              setSemester("");
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
                setExamOptions([]);
                setExamId("");
                setTableRow(null);
                setLoadingExamOptions(true);
              }}
            />
          )}

          {courseId && pattern && (
            <Select
              options={semesterOptions}
              placeholder="Select Semester"
              value={semester}
              onChange={(value) => {
                setSemester(value);
                setExamOptions([]);
                setExamId("");
                setTableRow(null);
                setLoadingExamOptions(true);
              }}
            />
          )}

          {courseId &&
            pattern &&
            semester &&
            !loadingExamOptions &&
            examOptions.length > 0 && (
              <Select
                options={examOptions}
                placeholder="Select Exam"
                value={examId}
                onChange={(value) => {
                  setExamId(value);
                  setTableRow(null);
                  setLoadingTableRow(true);
                }}
              />
            )}
        </div>

        {courseId && pattern && semester && (
          <div className="mt-6">
            {loadingExamOptions ? (
              <p className="text-sm text-gray-500">Loading exams...</p>
            ) : examOptions.length === 0 ? (
              <Alert
                variant="warning"
                title="No Exams"
                message="No exams found."
              />
            ) : !examId ? (
              <p className="text-sm text-gray-500"></p>
            ) : loadingTableRow ? (
              <p className="text-sm text-gray-500">Loading exam details...</p>
            ) : !tableRow ? (
              <Alert
                variant="warning"
                title="Not Found"
                message="No Exam Record Found for this exam."
              />
            ) : (
              <DataTable
                data={[tableRow]}
                columns={columns}
                pageSizeOptions={[5]}
              />
            )}
          </div>
        )}
      </ComponentCard>
    </div>
  );
};

export default DeclareResult;
