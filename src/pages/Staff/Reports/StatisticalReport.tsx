import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FileSpreadsheet, Loader2, RefreshCcw, Search } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import Button from "../../../components/ui/button/Button";
import {
  useAcademicYear,
  useCourses,
  usePatterns,
  useSemesters,
  useExams,
  toCourseOptions,
  toPatternOptions,
  toSemesterOptions,
  toExamOptions,
} from "../../../data";
import { StatisticalReport, StatisticalReportService } from "../../../services/StatisticalReportService";

type AlertState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function StatisticalReportPage() {
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

  const { ayid } = useAcademicYear();
  const academicYearId = ayid ?? "";

  // Lookup data comes from the shared cached hooks (src/data); useExams reads the academic year from context.
  const courses = useCourses();
  const patterns = usePatterns();
  const semesters = useSemesters();
  const exams = useExams({ courseId, purpose: "all" });
  const loadingExams = exams.isLoading;
  const courseOptions = useMemo(() => toCourseOptions(courses.data), [courses.data]);
  const patternOptions = useMemo(() => toPatternOptions(patterns.data), [patterns.data]);
  const semesterOptions = useMemo(() => toSemesterOptions(semesters.data), [semesters.data]);
  const examOptions = useMemo(() => toExamOptions(exams.data), [exams.data]);
  const busy = loading || exporting;
  const canRequest = Boolean(courseId && semesterId && pattern && examId && academicYearId
    && (!mergeExam || (mergedExamId && mergedExamId !== examId)));

  const filtersFailed = courses.isError || patterns.isError || semesters.isError;
  useEffect(() => {
    if (filtersFailed) setAlert({ variant: "error", title: "Filters unavailable", message: "Reload the page to try again." });
  }, [filtersFailed]);

  // A new branch or academic year starts the exam choice (and any report) over.
  useEffect(() => {
    setExamId("");
    setMergedExamId("");
    setReport(null);
  }, [courseId, academicYearId]);

  useEffect(() => {
    if (exams.isError) setAlert({ variant: "error", title: "Exams unavailable", message: "Select the branch again to retry." });
  }, [exams.isError]);

  // Keep actionable errors visible; only the download confirmation disappears automatically.
  useEffect(() => {
    if (alert?.variant !== "success") return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  const request = useMemo(() => ({
    courseId, academicYearId, examId, mergeExam,
    mergedExamId: mergeExam ? mergedExamId : undefined,
    semesterId, pattern,
  }), [academicYearId, courseId, examId, mergeExam, mergedExamId, pattern, semesterId]);

  const loadReport = async () => {
    if (!canRequest || busy) return;
    setAlert(null);
    setLoading(true);
    try {
      const response = await StatisticalReportService.getData(request);
      if (!response.success || !response.data) throw new Error(response.message || "Unable to load the report.");
      setReport(response.data);
    } catch (error) {
      setReport(null);
      setAlert({ variant: "error", title: "Report unavailable", message: errorMessage(error, "Unable to load the report.") });
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    if (!canRequest || busy) return;
    setAlert(null);
    setExporting(true);
    try {
      const course = courseOptions.find(option => option.value === courseId)?.label || "Course";
      const semester = semesterOptions.find(option => option.value === semesterId)?.label || semesterId;
      const exam = examOptions.find(option => option.value === examId)?.label || "Exam";
      const merged = mergeExam ? `_${examOptions.find(option => option.value === mergedExamId)?.label || "Merged"}` : "";
      const fileName = `StatisticalReport_${course}_${semester}_${exam}${merged}`.replace(/[\s/\\:*?"<>|]+/g, "_");
      await StatisticalReportService.exportExcel(request, fileName);
      setAlert({ variant: "success", title: "Export ready", message: "Excel download started." });
    } catch (error) {
      setAlert({ variant: "error", title: "Export failed", message: errorMessage(error, "Unable to export the report.") });
    } finally {
      setExporting(false);
    }
  };

  const changeFilter = (change: () => void) => {
    change();
    setReport(null);
    setAlert(null);
  };

  const resetFilters = () => changeFilter(() => {
    setCourseId(""); setSemesterId(""); setPattern(""); setExamId("");
    setMergeExam(false); setMergedExamId("");
  });

  return (
    <div className="space-y-6">
      <ComponentCard title="Statistical Report - Filters">
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Select options={courseOptions} value={courseId} label="Branch" placeholder="Select Branch"
              onChange={value => changeFilter(() => {
                setCourseId(value); setSemesterId(""); setPattern(""); setExamId(""); setMergeExam(false); setMergedExamId("");
              })} />
            <Select options={semesterOptions} value={semesterId} label="Semester" placeholder="Select Semester" disabled={!courseId}
              onChange={value => changeFilter(() => { setSemesterId(value); setPattern(""); setExamId(""); setMergedExamId(""); })} />
            <Select options={patternOptions} value={pattern} label="Pattern" placeholder="Select Pattern" disabled={!semesterId}
              onChange={value => changeFilter(() => { setPattern(value); setExamId(""); setMergedExamId(""); })} />
            <Select options={examOptions} value={examId} label="Exam"
              placeholder={loadingExams ? "Loading exams…" : "Select Exam"} disabled={!pattern || loadingExams}
              onChange={value => changeFilter(() => { setExamId(value); setMergedExamId(""); })} />
            {examId && (
              <>
                <label className="flex h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-300 px-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
                  Merge exam
                  <input type="checkbox" role="switch" checked={mergeExam}
                    onChange={event => changeFilter(() => { setMergeExam(event.target.checked); setMergedExamId(""); })}
                    className="h-4 w-4 accent-brand-500" />
                </label>
                {mergeExam && (
                  <Select options={examOptions.filter(option => option.value !== examId)} value={mergedExamId}
                    label="Exam to merge" placeholder="Select Exam to Merge"
                    onChange={value => changeFilter(() => setMergedExamId(value))} />
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={loadReport} disabled={!canRequest || busy} size="sm" className="h-11">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? "Loading…" : "View Report"}
            </Button>
            <Button onClick={exportExcel} disabled={!canRequest || busy} variant="outline" size="sm" className="h-11">
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              {exporting ? "Exporting…" : "Export Excel"}
            </Button>
            <Button onClick={resetFilters} disabled={busy || !courseId} variant="outline" size="sm" className="h-11">
              <RefreshCcw size={16} /> Reset
            </Button>
          </div>
          {!academicYearId && <p className="text-sm text-amber-700 dark:text-amber-400">Select an academic year in the header to continue.</p>}
        </fieldset>
      </ComponentCard>

      {alert && <div aria-live="polite" aria-atomic="true"><Alert {...alert} onClose={() => setAlert(null)} /></div>}

      {report && (
        <section aria-label="Statistical report results" aria-busy={busy}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{report.examName}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {report.courseName} · {report.semesterName} · {report.pattern} · {report.academicYearName}
            </p>
          </div>
          <dl className="grid grid-cols-1 divide-y divide-gray-200 border-b border-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-gray-800 dark:border-gray-800">
            {[
              ["Students appeared", report.totalStudentsAppeared],
              ["Students passed", report.totalStudentsPassed],
              ["Overall passing", `${report.overallPassingPercentage.toFixed(2)}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between gap-3 px-4 py-4 sm:block sm:px-6">
                <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="text-xl font-semibold tabular-nums text-gray-800 sm:mt-1 dark:text-white/90">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Subject statistics table">
            <table className="w-full text-sm">
              <caption className="sr-only">Subject-wise statistics for {report.examName}. Grace marks include ordinance grace and resolution marks.</caption>
              <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  {['#', 'Subject', 'Code', 'Appeared', 'Passed', 'Pass %'].map((header, index) => (
                    <th key={header} scope="col" rowSpan={2}
                      className={`whitespace-nowrap px-4 py-3 font-medium ${index < 3 ? "text-left" : "text-right"}`}>{header}</th>
                  ))}
                  <th scope="colgroup" colSpan={2} className="border-b border-gray-200 px-4 py-2 text-center font-medium dark:border-gray-700">Passed students</th>
                  <th scope="col" rowSpan={2} className="whitespace-nowrap px-4 py-3 text-right font-medium" title="Ordinance grace and resolution marks">Grace marks</th>
                </tr>
                <tr>
                  <th scope="col" className="whitespace-nowrap px-4 py-2 text-right font-medium">40%–&lt;60%</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-2 text-right font-medium">≥60%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 dark:divide-gray-800 dark:text-gray-300">
                {report.rows.map(row => (
                  <tr key={`${row.subjectCode}-${row.srNo}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 tabular-nums text-gray-500">{row.srNo}</td>
                    <th scope="row" className="min-w-56 px-4 py-3 text-left font-medium text-gray-800 dark:text-white/90">{row.subjectName}</th>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">{row.subjectCode}</td>
                    {[row.totalAppeared, row.totalPassed, `${row.passingPercentage.toFixed(2)}%`, row.passedBetween40And60, row.passedAtOrAbove60, row.graceMarksAwarded].map((value, index) => (
                      <td key={index} className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{value}</td>
                    ))}
                  </tr>
                ))}
                {report.rows.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No subject statistics available.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
