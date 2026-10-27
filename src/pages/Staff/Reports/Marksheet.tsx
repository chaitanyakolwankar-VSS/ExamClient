// import { useState, useEffect, useMemo } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import ComponentCard from "../../../components/common/ComponentCard";
// import Select from "../../../components/form/Select";
// import Button from "../../../components/ui/button/Button";
// import Input from "../../../components/form/input/InputField";
// import { Download, Settings2, Loader2 } from "lucide-react";
// import { ReportService } from "../../../services/ReportService";
// import {
//   useAcademicYear,
//   useCourses,
//   usePatterns,
//   useSemesters,
//   useExams,
//   toCourseOptions,
//   toPatternOptions,
//   toSemesterOptions,
//   toExamOptions,
// } from "../../../data";
// import Alert from "../../../components/ui/alert/Alert";

// export default function Marksheet() {
//   const [selectedCourse, setSelectedCourse] = useState("");

//   const [pattern, setPattern] = useState("");

//   const [semester, setSemester] = useState("");

//   const [exam, setExam] = useState("");

//   // Lookup data comes from the shared cached hooks (src/data); useExams reads the academic year from context.
//   const courses = useCourses();
//   const patterns = usePatterns();
//   const semesters = useSemesters();
//   const exams = useExams({ courseId: selectedCourse, purpose: "all" });
//   const { ayid } = useAcademicYear();

//   const courseOptions = useMemo(
//     () => toCourseOptions(courses.data),
//     [courses.data],
//   );
//   const patternOptions = useMemo(
//     () => toPatternOptions(patterns.data),
//     [patterns.data],
//   );
//   const semesterOptions = useMemo(
//     () => toSemesterOptions(semesters.data),
//     [semesters.data],
//   );
//   const examOptions = useMemo(() => toExamOptions(exams.data), [exams.data]);

//   // Cascading Reset Handlers
//   const handleCourseChange = (value: string) => {
//     setSelectedCourse(value);
//     setSemester("");
//     setPattern("");
//     setExam("");
//   };

//   const handleSemesterChange = (value: string) => {
//     setSemester(value);
//     setPattern("");
//     setExam("");
//   };

//   const handlePatternChange = (value: string) => {
//     setPattern(value);
//     setExam("");
//   };

//   // Settings
//   const [showSettings, setShowSettings] = useState(false);
//   const [generationType, setGenerationType] = useState<
//     "single" | "all" | "pass" | "fail"
//   >("all");
//   const [studentId, setStudentId] = useState("");
//   const [resultDate, setResultDate] = useState("");

//   const [includeHistory, setIncludeHistory] = useState(false);
//   const [noRleForFail, setNoRleForFail] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Alert State (Auto-clearing useEffect)
//   const [pageAlert, setPageAlert] = useState<{
//     variant: "success" | "error" | "warning" | "info";
//     title: string;
//     message: string;
//   } | null>(null);

//   useEffect(() => {
//     if (pageAlert) {
//       const timer = setTimeout(() => setPageAlert(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [pageAlert]);

//   const handleDownload = async () => {
//     if (!selectedCourse || !exam || !semester || !pattern) {
//       setPageAlert({
//         variant: "error",
//         title: "Missing Filters",
//         message: "Please select all required filters.",
//       });
//       return;
//     }

//     if (generationType === "single" && !studentId) {
//       setPageAlert({
//         variant: "error",
//         title: "Student ID Required",
//         message: "Please enter a Student ID for single generation.",
//       });
//       return;
//     }

//     if (
//       generationType === "single" &&
//       !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
//         studentId,
//       )
//     ) {
//       setPageAlert({
//         variant: "error",
//         title: "Validation Error",
//         message: "Student ID must be a valid GUID.",
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       if (generationType === "single") {
//         await ReportService.downloadMarksheet({
//           studId: studentId,
//           examId: exam,
//           semId: semester,
//           pattern: pattern,
//           includeHistory: includeHistory,
//           resultDate: resultDate || undefined,
//           noRleForFail: noRleForFail,
//         });
//       } else {
//         await ReportService.downloadBulkMarksheet({
//           examId: exam,
//           semId: semester,
//           pattern: pattern,
//           courseId: selectedCourse,
//           ayid: ayid || "",
//           generationType: generationType,
//           includeHistory: includeHistory,
//           resultDate: resultDate || undefined,
//           noRleForFail: noRleForFail,
//         });
//       }
//       setPageAlert({
//         variant: "success",
//         title: "Success",
//         message: "Marksheet generated successfully.",
//       });
//     } catch (error: any) {
//       setPageAlert({
//         variant: "error",
//         title: "Error",
//         message:
//           "Failed to download Marksheet. " +
//           (error?.response?.data || error?.message || ""),
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {pageAlert && (
//         <div className="mb-4">
//           <Alert
//             variant={pageAlert.variant}
//             title={pageAlert.title}
//             message={pageAlert.message}
//             onClose={() => setPageAlert(null)}
//           />
//         </div>
//       )}

//       {/* Primary Configuration Card */}
//       <ComponentCard title="Generate Student Marksheet - Filters">
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
//           {/* Course Dropdown (Always visible) */}
//           <div className="w-full">
//             <Select
//               label="Course"
//               options={courseOptions}
//               value={selectedCourse}
//               onChange={handleCourseChange}
//               placeholder="Select Course"
//             />
//           </div>

//           <AnimatePresence mode="popLayout">
//             {/* Semester Dropdown (Conditional on Course) */}
//             {selectedCourse && (
//               <motion.div
//                 key="semester"
//                 className="w-full"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <Select
//                   label="Semester"
//                   options={semesterOptions}
//                   value={semester}
//                   onChange={handleSemesterChange}
//                   placeholder="Select Semester"
//                 />
//               </motion.div>
//             )}

//             {/* Pattern Dropdown (Conditional on Semester) */}
//             {selectedCourse && semester && (
//               <motion.div
//                 key="pattern"
//                 className="w-full"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <Select
//                   label="Pattern"
//                   options={patternOptions}
//                   value={pattern}
//                   onChange={handlePatternChange}
//                   placeholder="Select Pattern"
//                 />
//               </motion.div>
//             )}

//             {/* Exam Dropdown (Conditional on Pattern) */}
//             {selectedCourse && semester && pattern && (
//               <motion.div
//                 key="exam"
//                 className="w-full"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <Select
//                   label="Exam"
//                   options={examOptions}
//                   value={exam}
//                   onChange={setExam}
//                   placeholder="Select Exam"
//                 />
//               </motion.div>
//             )}

//             {/* Action Bar (Aligned as the final cell in the grid) */}
//             {selectedCourse && semester && pattern && exam && (
//               <motion.div
//                 key="actions"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.2 }}
//                 className="w-full flex items-end gap-2 h-11"
//               >
//                 <Button
//                   variant="primary"
//                   onClick={handleDownload}
//                   disabled={loading}
//                   className="flex-grow h-11 text-sm font-semibold"
//                 >
//                   {loading ? (
//                     <Loader2 className="animate-spin size-4 mr-2" />
//                   ) : (
//                     <Download className="size-4 mr-2" />
//                   )}
//                   {loading ? "Generating..." : "Generate Result"}
//                 </Button>

//                 <Button
//                   variant="primary"
//                   onClick={() => setShowSettings(!showSettings)}
//                   className="px-3 h-11"
//                 >
//                   <Settings2 className="size-4" />
//                 </Button>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </ComponentCard>

//       {/* Advanced Settings Panel */}
//       {showSettings && (
//         <div className="bg-white dark:bg-gray-900 rounded-lg shadow-theme-md border border-gray-200 dark:border-gray-800 p-4 space-y-6">
//           <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-2 text-base">
//             Advanced Settings
//           </h3>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Target Selection */}
//             <div className="space-y-4">
//               <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
//                 Target Selection
//               </h4>

//               <div className="flex flex-col gap-3">
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="genType"
//                     value="single"
//                     checked={generationType === "single"}
//                     onChange={(e) => setGenerationType(e.target.value as any)}
//                     className="text-blue-600 focus:ring-blue-500 rounded-full"
//                   />
//                   <span className="text-sm text-gray-700 dark:text-gray-300">
//                     Single Student
//                   </span>
//                 </label>

//                 {generationType === "single" && (
//                   <div className="ml-6">
//                     <Input
//                       type="text"
//                       placeholder="Enter Student ID (Guid)"
//                       value={studentId}
//                       onChange={(e) => setStudentId(e.target.value)}
//                     />
//                   </div>
//                 )}

//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="genType"
//                     value="all"
//                     checked={generationType === "all"}
//                     onChange={(e) => setGenerationType(e.target.value as any)}
//                     className="text-blue-600 focus:ring-blue-500 rounded-full"
//                   />
//                   <span className="text-sm text-gray-700 dark:text-gray-300">
//                     All Students
//                   </span>
//                 </label>

//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="genType"
//                     value="pass"
//                     checked={generationType === "pass"}
//                     onChange={(e) => setGenerationType(e.target.value as any)}
//                     className="text-blue-600 focus:ring-blue-500 rounded-full"
//                   />
//                   <span className="text-sm text-gray-700 dark:text-gray-300">
//                     Pass Only
//                   </span>
//                 </label>

//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="genType"
//                     value="fail"
//                     checked={generationType === "fail"}
//                     onChange={(e) => setGenerationType(e.target.value as any)}
//                     className="text-blue-600 focus:ring-blue-500 rounded-full"
//                   />
//                   <span className="text-sm text-gray-700 dark:text-gray-300">
//                     Fail Only
//                   </span>
//                 </label>
//               </div>
//             </div>

//             {/* Display / Formatting Options */}
//             <div className="space-y-4">
//               <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-100 dark:border-gray-800 pb-1">
//                 Formatting & Options
//               </h4>

//               <div className="w-64">
//                 <Input
//                   label="Result Date (Optional)"
//                   type="date"
//                   value={resultDate}
//                   onChange={(e) => setResultDate(e.target.value)}
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   Override the printed result date.
//                 </p>
//               </div>

//               <div className="pt-2 space-y-3">
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={includeHistory}
//                     onChange={(e) => setIncludeHistory(e.target.checked)}
//                     className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
//                   />
//                   <span className="text-sm text-gray-700 dark:text-gray-300">
//                     Include Final Semester History
//                   </span>
//                 </label>
//                 <p className="text-xs text-gray-500 -mt-1 ml-6">
//                   Appends previous semesters' history table at the bottom.
//                 </p>

//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={noRleForFail}
//                     onChange={(e) => setNoRleForFail(e.target.checked)}
//                     className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
//                   />
//                   <span className="text-sm text-gray-700 dark:text-gray-300">
//                     No RLE For Fail
//                   </span>
//                 </label>
//                 <p className="text-xs text-gray-500 -mt-1 ml-6">
//                   If checked, failing students will have "Fail" remark instead
//                   of "RLE".
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import { Download, Eye, EyeOff, Loader2, Settings2 } from "lucide-react";
import { ReportService } from "../../../services/ReportService";
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
import Alert from "../../../components/ui/alert/Alert";
import EmailMarksheet from "./EmailMarksheet";
import MarksheetPreview from "../../../components/Marksheet/MarksheetPreview";

type GenerationType = "single" | "all" | "pass" | "fail";

/** The API takes the student's StdMstId (a GUID), not the printed student ID. */
const GUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GENERATION_OPTIONS: { value: GenerationType; label: string }[] = [
  { value: "all", label: "All Students" },
  { value: "pass", label: "Pass Only" },
  { value: "fail", label: "Fail Only" },
  { value: "single", label: "Single Student" },
];

export default function Marksheet() {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [pattern, setPattern] = useState("");
  const [semester, setSemester] = useState("");
  const [exam, setExam] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  // The on-screen preview of a single student's marksheet (the bulk modes download only).
  const [previewOpen, setPreviewOpen] = useState(false);
  const courses = useCourses();
  const patterns = usePatterns();
  const semesters = useSemesters();
  const exams = useExams({ courseId: selectedCourse, purpose: "all" });
  const { ayid } = useAcademicYear();

  const courseOptions = useMemo(
    () => toCourseOptions(courses.data),
    [courses.data],
  );
  const patternOptions = useMemo(
    () => toPatternOptions(patterns.data),
    [patterns.data],
  );
  const semesterOptions = useMemo(
    () => toSemesterOptions(semesters.data),
    [semesters.data],
  );
  const examOptions = useMemo(() => toExamOptions(exams.data), [exams.data]);

  // Cascading Reset Handlers
  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSemester("");
    setPattern("");
    setExam("");
    setPreviewOpen(false);
  };

  const handleSemesterChange = (value: string) => {
    setSemester(value);
    setPattern("");
    setExam("");
    setPreviewOpen(false);
  };

  const handlePatternChange = (value: string) => {
    setPattern(value);
    setExam("");
    setPreviewOpen(false);
  };

  // Options (now always shown once filters are complete)
  const [generationType, setGenerationType] = useState<GenerationType>("all");
  const [studentId, setStudentId] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [noRleForFail, setNoRleForFail] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtersComplete = !!(selectedCourse && semester && pattern && exam);

  // Alert State
  const [pageAlert, setPageAlert] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (pageAlert) {
      const timer = setTimeout(() => setPageAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [pageAlert]);

  /** Why a single-student run cannot start, or null when it can. */
  const singleStudentProblem = (): { title: string; message: string } | null => {
    if (!filtersComplete)
      return {
        title: "Missing Filters",
        message: "Please select all required filters.",
      };
    if (!studentId.trim())
      return {
        title: "Student ID Required",
        message: "Please enter a Student ID for single generation.",
      };
    if (!GUID.test(studentId.trim()))
      return {
        title: "Invalid Student ID",
        message:
          "Enter the student's GUID, e.g. 3f2504e0-4f89-41d3-9a0c-0305e82c3301. It is shown on the student's record in Student Master.",
      };
    return null;
  };

  const handleDownload = async () => {
    const problem =
      generationType === "single"
        ? singleStudentProblem()
        : filtersComplete
          ? null
          : {
              title: "Missing Filters",
              message: "Please select all required filters.",
            };

    if (problem) {
      setPageAlert({ variant: "error", ...problem });
      return;
    }

    setLoading(true);
    try {
      if (generationType === "single") {
        await ReportService.downloadMarksheet({
          studId: studentId.trim(),
          examId: exam,
          semId: semester,
          pattern: pattern,
          includeHistory: includeHistory,
          resultDate: resultDate || undefined,
          noRleForFail: noRleForFail,
        });
      } else {
        await ReportService.downloadBulkMarksheet({
          examId: exam,
          semId: semester,
          pattern: pattern,
          courseId: selectedCourse,
          ayid: ayid || "",
          generationType: generationType,
          includeHistory: includeHistory,
          resultDate: resultDate || undefined,
          noRleForFail: noRleForFail,
        });
      }
      setPageAlert({
        variant: "success",
        title: "Success",
        message: "Marksheet generated successfully.",
      });
    } catch (error) {
      const err = error as {
        message?: string;
        response?: { data?: unknown };
      };
      const data = err.response?.data as
        | { detail?: string; message?: string; title?: string }
        | string
        | undefined;
      const detail =
        typeof data === "string"
          ? data
          : data?.detail || data?.message || data?.title || "";
      setPageAlert({
        variant: "error",
        title: "Error",
        message:
          "Failed to download Marksheet. " + (detail || err.message || ""),
      });
    } finally {
      setLoading(false);
    }
  };

  /** Draws the single student's marksheet on the page, like the hall ticket preview. */
  const handlePreview = () => {
    const problem = singleStudentProblem();
    if (problem) {
      setPageAlert({ variant: "error", ...problem });
      return;
    }
    setPreviewOpen(true);
  };

  const fieldMotion = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2 },
  };

  return (
    <div className="space-y-6">
      {pageAlert && (
        <div className="mb-4">
          <Alert
            variant={pageAlert.variant}
            title={pageAlert.title}
            message={pageAlert.message}
            onClose={() => setPageAlert(null)}
          />
        </div>
      )}

      <ComponentCard title="Generate Student Marksheet - Filters">
        {/* Filters + action buttons: one row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="w-full">
            <Select
              label="Course"
              options={courseOptions}
              value={selectedCourse}
              onChange={handleCourseChange}
              placeholder="Select Course"
            />
          </div>

          <AnimatePresence mode="popLayout">
            {selectedCourse && (
              <motion.div key="semester" className="w-full" {...fieldMotion}>
                <Select
                  label="Semester"
                  options={semesterOptions}
                  value={semester}
                  onChange={handleSemesterChange}
                  placeholder="Select Semester"
                />
              </motion.div>
            )}

            {selectedCourse && semester && (
              <motion.div key="pattern" className="w-full" {...fieldMotion}>
                <Select
                  label="Pattern"
                  options={patternOptions}
                  value={pattern}
                  onChange={handlePatternChange}
                  placeholder="Select Pattern"
                />
              </motion.div>
            )}

            {selectedCourse && semester && pattern && (
              <motion.div key="exam" className="w-full" {...fieldMotion}>
                <Select
                  label="Exam"
                  options={examOptions}
                  value={exam}
                  onChange={(value) => {
                    setExam(value);
                    setPreviewOpen(false);
                  }}
                  placeholder="Select Exam"
                />
              </motion.div>
            )}

            {/* Generate + Settings buttons */}
            {filtersComplete && (
              <motion.div
                key="actions"
                className="w-full flex items-end gap-2 h-11"
                {...fieldMotion}
              >
                <Button
                  variant="primary"
                  onClick={handleDownload}
                  disabled={loading}
                  className="flex-grow h-11 text-sm font-semibold"
                >
                  {loading ? (
                    <Loader2 className="animate-spin size-4 mr-2" />
                  ) : (
                    <Download className="size-4 mr-2" />
                  )}
                  {loading ? "Generating..." : "Generate Result"}
                </Button>

                <Button
                  variant="primary"
                  onClick={() => setShowSettings((s) => !s)}
                  className="px-3 h-11"
                  aria-label="Toggle settings"
                  aria-expanded={showSettings}
                  title="Settings"
                >
                  <Settings2 className="size-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview: one student's marksheet drawn on the page before anything is downloaded.
            The bulk modes have no single sheet to show, so the button only appears for "Single Student". */}
        {filtersComplete && generationType === "single" && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() =>
                previewOpen ? setPreviewOpen(false) : handlePreview()
              }
              className="h-11 text-sm font-medium"
              aria-pressed={previewOpen}
              title={
                previewOpen
                  ? "Hide the marksheet preview"
                  : "Show this student's marksheet before downloading"
              }
            >
              {previewOpen ? (
                <EyeOff className="size-4 mr-2" />
              ) : (
                <Eye className="size-4 mr-2" />
              )}
              {previewOpen ? "Hide preview" : "Preview marksheet"}
            </Button>
          </div>
        )}

        {/* Expandable settings panel */}
        <AnimatePresence initial={false}>
          {filtersComplete && showSettings && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-col xl:flex-row xl:items-start gap-6 xl:gap-8">
                  {/* Target Selection */}
                  {/* <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-1">
                      Target Selection
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 min-h-11">
                      {GENERATION_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="genType"
                            value={opt.value}
                            checked={generationType === opt.value}
                            onChange={() => setGenerationType(opt.value)}
                            className="text-blue-600 focus:ring-blue-500 rounded-full"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {opt.label}
                          </span>
                        </label>
                      ))}

                      {generationType === "single" && (
                        <div className="w-full sm:w-56">
                          <Input
                            type="text"
                            placeholder="Enter Student ID"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div> */}
                  {/* Target Selection */}
                  <div className="space-y-3 xl:shrink-0">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-1">
                      Target Selection
                    </h4>

                    <div className="flex flex-wrap xl:flex-nowrap items-center gap-x-5 gap-y-2 min-h-11">
                      {GENERATION_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="genType"
                            value={opt.value}
                            checked={generationType === opt.value}
                            onChange={() => {
                              setGenerationType(opt.value);
                              setPreviewOpen(false);
                            }}
                            className="text-blue-600 focus:ring-blue-500 rounded-full"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {opt.label}
                          </span>
                        </label>
                      ))}

                      {/* Always rendered on xl so the space is reserved; only visibility changes */}
                      <div
                        className={`w-full sm:w-56 xl:shrink-0 ${
                          generationType === "single"
                            ? "block"
                            : "hidden xl:block xl:invisible"
                        }`}
                      >
                        <Input
                          type="text"
                          placeholder="Enter Student ID"
                          value={studentId}
                          onChange={(e) => {
                            setStudentId(e.target.value);
                            setPreviewOpen(false);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden xl:block self-stretch w-px bg-gray-100 dark:bg-gray-800" />

                  {/* Formatting & Options */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-1">
                      Formatting & Options
                    </h4>

                    <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                      {/* Result Date */}
                      <div className="w-48">
                        <Input
                          label="Result Date (Optional)"
                          type="date"
                          value={resultDate}
                          onChange={(e) => setResultDate(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Override the printed result date.
                        </p>
                      </div>

                      {/* Include History */}
                      <div className="w-56">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeHistory}
                            onChange={(e) =>
                              setIncludeHistory(e.target.checked)
                            }
                            className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Include Final Semester History
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Appends previous semesters' history table at the
                          bottom.
                        </p>
                      </div>

                      {/* No RLE For Fail */}
                      <div className="w-56">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={noRleForFail}
                            onChange={(e) => setNoRleForFail(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            No RLE For Fail
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          If checked, failing students will have "Fail" remark
                          instead of "RLE".
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ComponentCard>

      {/* The marksheet itself, drawn on the page before anything is downloaded. */}
      {filtersComplete && generationType === "single" && previewOpen && (
        <MarksheetPreview
          params={{
            studId: studentId.trim(),
            examId: exam,
            semId: semester,
            pattern,
            includeHistory,
            resultDate: resultDate || undefined,
            noRleForFail,
          }}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {filtersComplete && (
        <EmailMarksheet
          selection={{
            ayid: ayid || "",
            courseId: selectedCourse,
            semester,
            pattern,
            examId: exam,
          }}
          examName={examOptions.find((o) => o.value === exam)?.label ?? ""}
          resultDate={resultDate}
          includeHistory={includeHistory}
          noRleForFail={noRleForFail}
        />
      )}
    </div>
  );
}
