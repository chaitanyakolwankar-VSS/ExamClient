import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import { Download, Settings2, Loader2 } from "lucide-react";
import { ReportService } from "../../../services/ReportService";
import { CourseService } from "../../../services/Course";
import { PatternService } from "../../../services/Pattern";
import { RegularExamService } from "../../../services/RegularExamService";
import Alert from "../../../components/ui/alert/Alert";

export default function Marksheet() {
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  
  const [patternOptions, setPatternOptions] = useState<{ value: string; label: string }[]>([]);
  const [pattern, setPattern] = useState("");
  
  const [semester, setSemester] = useState("");
  
  const [examOptions, setExamOptions] = useState<{ value: string; label: string }[]>([]);
  const [exam, setExam] = useState("");

  const semesterOptions = [
    { value: "Sem-1", label: "Semester I" },
    { value: "Sem-2", label: "Semester II" },
    { value: "Sem-3", label: "Semester III" },
    { value: "Sem-4", label: "Semester IV" },
    { value: "Sem-5", label: "Semester V" },
    { value: "Sem-6", label: "Semester VI" },
    { value: "Sem-7", label: "Semester VII" },
    { value: "Sem-8", label: "Semester VIII" },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const courses = await CourseService.getCourse();
      setCourseOptions(courses.map((c: any) => ({ value: c.courseid, label: c.coursename })));
      const patterns = await PatternService.getpattern();
      setPatternOptions(patterns.map((p: any) => ({ value: p.patternName, label: p.patternName })));
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    if (selectedCourse && semester && pattern) {
        fetchExams();
    }
  }, [selectedCourse, semester, pattern]);

  const fetchExams = async () => {
    try {
        const ayid = localStorage.getItem("AYID");
        if (!ayid) {
          setExamOptions([]);
          return;
        }
        const exams = await RegularExamService.getExam({ Courseid: selectedCourse, Ayid: ayid });
        setExamOptions(exams.map((e: any) => ({ value: e.examId, label: e.examname })));
    } catch (error) {
        console.error("Fetch exams error:", error);
    }
  };
  
  // Cascading Reset Handlers
  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSemester("");
    setPattern("");
    setExam("");
  };

  const handleSemesterChange = (value: string) => {
    setSemester(value);
    setPattern("");
    setExam("");
  };

  const handlePatternChange = (value: string) => {
    setPattern(value);
    setExam("");
  };

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [generationType, setGenerationType] = useState<"single" | "all" | "pass" | "fail">("all");
  const [studentId, setStudentId] = useState("");
  const [resultDate, setResultDate] = useState("");
  
  const [includeHistory, setIncludeHistory] = useState(false);
  const [noRleForFail, setNoRleForFail] = useState(false);
  const [loading, setLoading] = useState(false);

  // Alert State (Auto-clearing useEffect)
  const [pageAlert, setPageAlert] = useState<{ variant: "success" | "error" | "warning" | "info"; title: string; message: string } | null>(null);

  useEffect(() => {
    if (pageAlert) {
      const timer = setTimeout(() => setPageAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [pageAlert]);

  const handleDownload = async () => {
    if (!selectedCourse || !exam || !semester || !pattern) {
      setPageAlert({
        variant: "error",
        title: "Missing Filters",
        message: "Please select all required filters."
      });
      return;
    }
    
    if (generationType === "single" && !studentId) {
      setPageAlert({
        variant: "error",
        title: "Student ID Required",
        message: "Please enter a Student ID for single generation."
      });
      return;
    }

    if (generationType === "single" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId)) {
      setPageAlert({
        variant: "error",
        title: "Validation Error",
        message: "Student ID must be a valid GUID."
      });
      return;
    }

    setLoading(true);
    try {
      if (generationType === "single") {
        await ReportService.downloadMarksheet({
          studId: studentId,
          examId: exam,
          semId: semester,
          pattern: pattern,
          includeHistory: includeHistory,
          resultDate: resultDate || undefined,
          noRleForFail: noRleForFail
        });
      } else {
        await ReportService.downloadBulkMarksheet({
          examId: exam,
          semId: semester,
          pattern: pattern,
          generationType: generationType,
          includeHistory: includeHistory,
          resultDate: resultDate || undefined,
          noRleForFail: noRleForFail
        });
      }
      setPageAlert({
        variant: "success",
        title: "Success",
        message: "Marksheet generated successfully."
      });
    } catch (error: any) {
      setPageAlert({
        variant: "error",
        title: "Error",
        message: "Failed to download Marksheet. " + (error?.response?.data || error?.message || "")
      });
    } finally {
      setLoading(false);
    }
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

      {/* Primary Configuration Card */}
      <ComponentCard title="Generate Student Marksheet - Filters">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          {/* Course Dropdown (Always visible) */}
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
            {/* Semester Dropdown (Conditional on Course) */}
            {selectedCourse && (
              <motion.div
                key="semester"
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  label="Semester"
                  options={semesterOptions}
                  value={semester}
                  onChange={handleSemesterChange}
                  placeholder="Select Semester"
                />
              </motion.div>
            )}

            {/* Pattern Dropdown (Conditional on Semester) */}
            {selectedCourse && semester && (
              <motion.div
                key="pattern"
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  label="Pattern"
                  options={patternOptions}
                  value={pattern}
                  onChange={handlePatternChange}
                  placeholder="Select Pattern"
                />
              </motion.div>
            )}

            {/* Exam Dropdown (Conditional on Pattern) */}
            {selectedCourse && semester && pattern && (
              <motion.div
                key="exam"
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  label="Exam"
                  options={examOptions}
                  value={exam}
                  onChange={setExam}
                  placeholder="Select Exam"
                />
              </motion.div>
            )}

            {/* Action Bar (Aligned as the final cell in the grid) */}
            {selectedCourse && semester && pattern && exam && (
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
                  onClick={handleDownload} 
                  disabled={loading} 
                  className="flex-grow h-11 text-sm font-semibold"
                >
                  {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Download className="size-4 mr-2" />}
                  {loading ? "Generating..." : "Generate Result"}
                </Button>
                
                <Button 
                  variant="primary"
                  onClick={() => setShowSettings(!showSettings)}
                  className="px-3 h-11"
                >
                  <Settings2 className="size-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ComponentCard>

      {/* Advanced Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-theme-md border border-gray-200 dark:border-gray-800 p-4 space-y-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-2 text-base">
            Advanced Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Target Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Target Selection</h4>
              
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="genType" 
                    value="single" 
                    checked={generationType === "single"}
                    onChange={(e) => setGenerationType(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500 rounded-full"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Single Student</span>
                </label>
                
                {generationType === "single" && (
                  <div className="ml-6">
                    <Input 
                      type="text" 
                      placeholder="Enter Student ID (Guid)" 
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="genType" 
                    value="all" 
                    checked={generationType === "all"}
                    onChange={(e) => setGenerationType(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500 rounded-full"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">All Students</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="genType" 
                    value="pass" 
                    checked={generationType === "pass"}
                    onChange={(e) => setGenerationType(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500 rounded-full"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pass Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="genType" 
                    value="fail" 
                    checked={generationType === "fail"}
                    onChange={(e) => setGenerationType(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500 rounded-full"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fail Only</span>
                </label>
              </div>
            </div>

            {/* Display / Formatting Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-100 dark:border-gray-800 pb-1">Formatting & Options</h4>
              
              <div className="w-64">
                <Input 
                  label="Result Date (Optional)"
                  type="date" 
                  value={resultDate}
                  onChange={(e) => setResultDate(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Override the printed result date.</p>
              </div>
              
              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700" 
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include Final Semester History</span>
                </label>
                <p className="text-xs text-gray-500 -mt-1 ml-6">Appends previous semesters' history table at the bottom.</p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={noRleForFail}
                    onChange={(e) => setNoRleForFail(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700" 
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">No RLE For Fail</span>
                </label>
                <p className="text-xs text-gray-500 -mt-1 ml-6">If checked, failing students will have "Fail" remark instead of "RLE".</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
