import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import Button from "../../../components/ui/button/Button";
import { CourseService } from "../../../services/Course";
import { PatternService } from "../../../services/Pattern";
import { RegularExamService } from "../../../services/RegularExamService";
import {
  StatisticalReport,
  StatisticalReportService,
} from "../../../services/StatisticalReportService";

const semesterOptions = Array.from({ length: 10 }, (_, index) => ({
  value: `Sem-${index + 1}`,
  label: `Semester ${index + 1}`,
}));

type AlertState = {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
};

export default function StatisticalReportPage() {
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);
  const [patternOptions, setPatternOptions] = useState<{ value: string; label: string }[]>([]);
  const [examOptions, setExamOptions] = useState<{ value: string; label: string }[]>([]);
  const [courseId, setCourseId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [pattern, setPattern] = useState("");
  const [examId, setExamId] = useState("");
  const [mergeExam, setMergeExam] = useState(false);
  const [mergedExamId, setMergedExamId] = useState("");
  const [report, setReport] = useState<StatisticalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const academicYearId = localStorage.getItem("AYID") || "";
  const canRequest = Boolean(courseId && semesterId && pattern && examId && academicYearId && (!mergeExam || mergedExamId));

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [courses, patterns] = await Promise.all([CourseService.getCourse(), PatternService.getpattern()]);
        setCourseOptions(courses.map(course => ({ value: course.courseid, label: course.coursename })));
        setPatternOptions(patterns.map(item => ({ value: item.patternName, label: item.patternName })));
      } catch {
        setAlert({ variant: "error", title: "Unable to load filters", message: "Course and pattern options could not be loaded." });
      }
    };
    void loadOptions();
  }, []);

  useEffect(() => {
    const loadExams = async () => {
      setExamId("");
      setMergedExamId("");
      setReport(null);
      if (!courseId || !academicYearId) {
        setExamOptions([]);
        return;
      }
      try {
        const exams = await RegularExamService.getAllExams({ Courseid: courseId, Ayid: academicYearId });
        setExamOptions(exams.map(exam => ({ value: exam.examId, label: exam.examname })));
      } catch {
        setExamOptions([]);
        setAlert({ variant: "error", title: "Unable to load exams", message: "Exam options could not be loaded." });
      }
    };
    void loadExams();
  }, [courseId, academicYearId]);

  const request = useMemo(() => ({
    courseId,
    academicYearId,
    examId,
    mergeExam,
    mergedExamId: mergeExam ? mergedExamId : undefined,
    semesterId,
    pattern,
  }), [academicYearId, courseId, examId, mergeExam, mergedExamId, pattern, semesterId]);

  const ensureReady = () => {
    if (canRequest) return true;
    setAlert({
      variant: "warning",
      title: "Required filters missing",
      message: academicYearId
        ? mergeExam
          ? "Select course, semester, pattern, primary exam and an exam to merge."
          : "Select course, semester, pattern and exam."
        : "Select an academic year before generating the report.",
    });
    return false;
  };

  const loadReport = async () => {
    if (!ensureReady()) return;
    setLoading(true);
    try {
      const response = await StatisticalReportService.getData(request);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Unable to prepare the statistical report.");
      }
      setReport(response.data);
      setAlert({ variant: "success", title: "Report ready", message: response.message });
    } catch (error) {
      setReport(null);
      setAlert({ variant: "error", title: "Report unavailable", message: error instanceof Error ? error.message : "Unable to prepare the report." });
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    if (!ensureReady()) return;
    setExporting(true);
    try {
      const course = courseOptions.find(option => option.value === courseId)?.label || "Course";
      const semester = semesterOptions.find(option => option.value === semesterId)?.label || semesterId;
      const exam = examOptions.find(option => option.value === examId)?.label || "Exam";
      const fileName = `StatisticalReport_${course}_${semester}_${exam}`.replace(/[\s/\\]+/g, "_");
      await StatisticalReportService.exportExcel(request, fileName);
      setAlert({ variant: "success", title: "Export complete", message: "The statistical report has been downloaded." });
    } catch (error) {
      setAlert({ variant: "error", title: "Export failed", message: error instanceof Error ? error.message : "Unable to export the report." });
    } finally {
      setExporting(false);
    }
  };

  const resetDownstream = (change: () => void) => {
    change();
    setReport(null);
  };

  return (
    <div className="p-6 space-y-6">
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}

      <ComponentCard title="Statistical Report">
        <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">
          Subject-wise statistics from processed results. Combined and head-wise passing use the same result-engine verdicts as Marks Entry, Result and Gazette.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            options={courseOptions}
            value={courseId}
            onChange={(value) => resetDownstream(() => { setCourseId(value); setExamId(""); })}
            placeholder="Select Course"
          />
          <Select
            options={semesterOptions}
            value={semesterId}
            onChange={(value) => resetDownstream(() => setSemesterId(value))}
            placeholder="Select Semester"
          />
          <Select
            options={patternOptions}
            value={pattern}
            onChange={(value) => resetDownstream(() => setPattern(value))}
            placeholder="Select Pattern"
          />
          <Select
            options={examOptions}
            value={examId}
            onChange={(value) => resetDownstream(() => setExamId(value))}
            placeholder="Select Exam"
          />
        </div>

        {examId && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center dark:border-gray-700 dark:bg-gray-800/50">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={mergeExam}
                onChange={(event) => resetDownstream(() => { setMergeExam(event.target.checked); if (!event.target.checked) setMergedExamId(""); })}
                className="rounded text-brand-500"
              />
              Merge another processed exam
            </label>
            {mergeExam && (
              <div className="min-w-64 flex-1">
                <Select
                  options={examOptions.filter(option => option.value !== examId)}
                  value={mergedExamId}
                  onChange={(value) => resetDownstream(() => setMergedExamId(value))}
                  placeholder="Select Exam to Merge"
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
          <Button onClick={loadReport} disabled={loading || exporting} className="flex items-center justify-center gap-2">
            <Search size={18} />
            {loading ? "Loading…" : "Preview Report"}
          </Button>
          <button
            type="button"
            onClick={exportExcel}
            disabled={exporting || loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
          >
            <FileSpreadsheet size={18} />
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </ComponentCard>

      {report && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["Students Appeared", report.totalStudentsAppeared],
              ["Students Passed", report.totalStudentsPassed],
              ["Overall Passing", `${report.overallPassingPercentage.toFixed(2)}%`],
            ].map(([label, value]) => (
              <ComponentCard key={String(label)} title={String(label)}>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
              </ComponentCard>
            ))}
          </div>

          <ComponentCard title={`${report.examName} — Subject Statistics`}>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {report.courseName} · {report.semesterName} · {report.pattern} · {report.academicYearName}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <tr>
                    {['#', 'Subject', 'Code', 'Appeared', 'Passed', 'Pass %', '40%–<60%', '≥60%', 'Grace marks'].map(header => (
                      <th key={header} className="whitespace-nowrap px-3 py-3 font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {report.rows.map(row => (
                    <tr key={`${row.subjectCode}-${row.srNo}`} className="text-gray-700 dark:text-gray-200">
                      <td className="px-3 py-3">{row.srNo}</td>
                      <td className="min-w-56 px-3 py-3 font-medium">{row.subjectName}</td>
                      <td className="px-3 py-3">{row.subjectCode}</td>
                      <td className="px-3 py-3">{row.totalAppeared}</td>
                      <td className="px-3 py-3">{row.totalPassed}</td>
                      <td className="px-3 py-3">{row.passingPercentage.toFixed(2)}%</td>
                      <td className="px-3 py-3">{row.passedBetween40And60}</td>
                      <td className="px-3 py-3">{row.passedAtOrAbove60}</td>
                      <td className="px-3 py-3">{row.graceMarksAwarded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        </>
      )}
    </div>
  );
}
