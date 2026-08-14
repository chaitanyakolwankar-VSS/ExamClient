import ComponentCard from "../../../components/common/ComponentCard.tsx";
import Select from "../../../components/form/Select.tsx";
import DataTable from "../../../components/ui/table/DataTable";
import { useState, useEffect, useRef } from "react";
import {
  PatternApiResponse,
  PatternService,
} from "../../../services/Pattern.ts";
import { CourseApiResponse, CourseService } from "../../../services/Course.ts";
import {
  DeclareExamApiResponse,
  DeclareResultService,
} from "../../../services/DeclareResultService.ts";
import {
  DeclareHallTicketApiResponse,
  ReleaseHallticketService,
} from "../../../services/ReleaseHallticketService.ts";
import { Eye, EyeOff } from "lucide-react";
import Alert from "../../../components/ui/alert/Alert";

interface Option {
  value: string;
  label: string;
}

const ReleaseHallTicket = () => {
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [courseId, setCourseId] = useState("");

  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");

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

  const [examOptions, setExamOptions] = useState<Option[]>([]);
  const [loadingExamOptions, setLoadingExamOptions] = useState(false);
  const [examId, setExamId] = useState("");

  const [tableData, setTableData] = useState<DeclareHallTicketApiResponse[]>(
    [],
  );
  const [loadingTableRow, setLoadingTableRow] = useState(false);

  const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
    setTimeout(() => setAlertData(null), timeout);
  };

  const fetchCourse = async () => {
    try {
      const data: CourseApiResponse[] = await CourseService.getCourse();
      setCourseOptions(
        data.map((c) => ({ value: c.courseid, label: c.coursename })),
      );
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchPatterns = async (courseId: string) => {
    try {
      const data: PatternApiResponse[] = await PatternService.getpattern();
      setPatternOptions(
        data.map((p) => ({ value: p.patternName, label: p.patternName })),
      );
    } catch (error) {
      console.error("Failed to fetch patterns", error);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchPatterns(courseId);
    } else {
      setPatternOptions([]);
      setPattern("");
      setSemester("");
      setExamOptions([]);
      setExamId("");
      setTableData([]);
    }
  }, [courseId]);

  useEffect(() => {
    if (!pattern) {
      setSemester("");
      setExamOptions([]);
      setExamId("");
      setTableData([]);
    }
  }, [pattern]);

  useEffect(() => {
    if (!semester) {
      setExamOptions([]);
      setExamId("");
      setTableData([]);
    }
  }, [semester]);

  const fetchExamOptions = async () => {
    const ayid = localStorage.getItem("AYID");
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
        data.map((exam) => ({ value: exam.examId, label: exam.examname })),
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
    setTableData([]);
    if (courseId && pattern && semester) {
      fetchExamOptions();
    } else {
      setExamOptions([]);
    }
  }, [courseId, pattern, semester]);

  const fetchTableRow = async () => {
    const ayid = localStorage.getItem("AYID");
    if (!courseId || !semester || !ayid || !examId) {
      setTableData([]);
      return;
    }

    try {
      setLoadingTableRow(true);
      const data = await ReleaseHallticketService.GetTableExam({
        CourseId: courseId,
        Ayid: ayid,
        Semester: semester,
        ExamId: examId,
        Pattern: pattern,
      });
      setTableData(data);
    } catch (error) {
      console.error("Error fetching table row:", error);
      setTableData([]);
    } finally {
      setLoadingTableRow(false);
    }
  };

  useEffect(() => {
    if (examId) {
      fetchTableRow();
    } else {
      setTableData([]);
    }
  }, [examId]);

  const handleDateFieldClick = (rowExamId: string) => {
    dateInputRefs.current[rowExamId]?.showPicker();
  };

  const handleDateChange = (rowExamId: string, date: string) => {
    setTableData((prev) =>
      prev.map((r) =>
        r.examId === rowExamId ? { ...r, hallTicketDeclareDate: date } : r,
      ),
    );
  };

  const handleToggleRelease = async (row: DeclareHallTicketApiResponse) => {
    const ayid = localStorage.getItem("AYID");
    if (!ayid) return;

    const willRelease = !row.releaseHallTicket;

    if (willRelease && !row.hallTicketDeclareDate) {
      showAlert(
        "error",
        "Error",
        "Please select a date before releasing the hall ticket.",
      );
      return;
    }

    setTableData((prev) =>
      prev.map((r) =>
        r.examId === row.examId
          ? {
              ...r,
              releaseHallTicket: willRelease,
              hallTicketDeclareDate: willRelease ? r.hallTicketDeclareDate : "",
            }
          : r,
      ),
    );

    try {
      const success = await ReleaseHallticketService.ToggleReleaseHallTicket({
        ExamId: row.examId,
        CourseId: courseId,
        Ayid: ayid,
        Semester: semester,
        Pattern: pattern,
        ReleaseHallTicket: willRelease,
        HallTicketDeclareDate: willRelease ? row.hallTicketDeclareDate : null,
      });

      if (!success) {
        throw new Error("No matching DeclareResult record found to update.");
      }

      showAlert(
        "success",
        "Success",
        willRelease
          ? "Hall ticket released successfully."
          : "Hall ticket release revoked.",
      );
    } catch (error) {
      console.error("Error toggling release status:", error);
      setTableData((prev) =>
        prev.map((r) =>
          r.examId === row.examId
            ? {
                ...r,
                releaseHallTicket: row.releaseHallTicket,
                hallTicketDeclareDate: row.hallTicketDeclareDate,
              }
            : r,
        ),
      );
      showAlert(
        "error",
        "Error",
        "Failed to update release status. Please try again.",
      );
    }
  };

  const columns = [
    { key: "examname", label: "Exam Name", sortable: true },
    { key: "semester", label: "Semester", sortable: false },
    {
      key: "hallTicketDeclareDate",
      label: "Release Date",
      sortable: false,
      render: (row: DeclareHallTicketApiResponse) => (
        <input
          ref={(el) => {
            dateInputRefs.current[row.examId] = el;
          }}
          type="date"
          value={
            row.hallTicketDeclareDate
              ? row.hallTicketDeclareDate.split("T")[0]
              : ""
          }
          onChange={(e) => handleDateChange(row.examId, e.target.value)}
          onClick={() => handleDateFieldClick(row.examId)}
          disabled={row.releaseHallTicket}
          className="border rounded px-2 py-1 text-sm w-full"
        />
      ),
    },
    {
      key: "releaseHallTicket",
      label: "Status",
      headerClassName: "text-center",
      sortable: false,
      render: (row: DeclareHallTicketApiResponse) => (
        <div className="flex justify-center items-center cursor-pointer">
          <button
            onClick={() => handleToggleRelease(row)}
            className="flex items-center justify-center"
            title={
              row.releaseHallTicket
                ? "Declared (Click to Undeclare)"
                : "Undeclared (Click to Declare)"
            }
          >
            {row.releaseHallTicket ? (
              <Eye className="w-7 h-7 text-green-600" />
            ) : (
              <EyeOff className="w-7 h-7 text-gray-400" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <ComponentCard title="Release Hall Ticket">
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
              setTableData([]);
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
              setTableData([]);
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
              onChange={setExamId}
            />
          )}
      </div>

      {courseId &&
        pattern &&
        semester &&
        !loadingExamOptions &&
        examOptions.length === 0 && (
          <div className="mt-4">
            <Alert
              variant="warning"
              title="No Exams"
              message="No exams found."
            />
          </div>
        )}

      {examId && !loadingTableRow && (
        <div className="mt-4">
          <DataTable
            data={tableData}
            columns={columns}
            searchKeys={["examname"]}
          />
        </div>
      )}
    </ComponentCard>
  );
};

export default ReleaseHallTicket;
