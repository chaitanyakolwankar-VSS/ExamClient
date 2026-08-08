import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { Download, Settings2, FileSpreadsheet } from "lucide-react";
import { ReportService } from "../../../services/ReportService";
import { CourseService } from "../../../services/Course";
import { PatternService } from "../../../services/Pattern";
import { RegularExamService } from "../../../services/RegularExamService";

export default function Gazette() {
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  
  const [patternOptions, setPatternOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedPattern, setSelectedPattern] = useState("");
  
  const [selectedSemester, setSelectedSemester] = useState("");
  
  const [examOptions, setExamOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedExam, setSelectedExam] = useState("");

  const [loading, setLoading] = useState(false);

  // Advanced Settings State
  const [showSettings, setShowSettings] = useState(false);
  
  // Toggles
  const [roundNumber, setRoundNumber] = useState(false);
  const [noRleForFail, setNoRleForFail] = useState(false);
  const [cgpiForFail, setCgpiForFail] = useState(false);
  const [sgpiForFail, setSgpiForFail] = useState(false);
  const [mergeExam, setMergeExam] = useState(false);
  const [mergedExamId, setMergedExamId] = useState("");

  // Layout
  const [studentsPerPage, setStudentsPerPage] = useState("4");
  const [subjectsPerRow, setSubjectsPerRow] = useState("6");

  // Calculations (Sem 1 to 8)
  const [cxgSems, setCxgSems] = useState<number[]>([]);
  const [gpaSems, setGpaSems] = useState<number[]>([]);

  // Page level alert state
  const [pageAlert, setPageAlert] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

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

  // Auto-clearing alert banner effect
  useEffect(() => {
    if (pageAlert) {
      const timer = setTimeout(() => setPageAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [pageAlert]);

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
    if (selectedCourse && selectedSemester && selectedPattern) {
        fetchExams();
    } else {
        setExamOptions([]);
        setSelectedExam("");
        setMergedExamId("");
    }
  }, [selectedCourse, selectedSemester, selectedPattern]);

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

  // Cascading reset handlers to wipe downstream values
  const handleCourseChange = (val: string) => {
    setSelectedCourse(val);
    setSelectedSemester("");
    setSelectedPattern("");
    setSelectedExam("");
    setMergedExamId("");
  };

  const handleSemesterChange = (val: string) => {
    setSelectedSemester(val);
    setSelectedPattern("");
    setSelectedExam("");
    setMergedExamId("");
  };

  const handlePatternChange = (val: string) => {
    setSelectedPattern(val);
    setSelectedExam("");
    setMergedExamId("");
  };

  const handleToggleCxg = (sem: number) => {
    setCxgSems(prev => prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]);
  };

  const handleToggleGpa = (sem: number) => {
    setGpaSems(prev => prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]);
  };

  const getDownloadFileName = () => {
    const course = courseOptions.find(c => String(c.value) === String(selectedCourse))?.label || "";
    const semester = semesterOptions.find(s => String(s.value) === String(selectedSemester))?.label || "";
    const exam = examOptions.find(e => String(e.value) === String(selectedExam))?.label || "";
    return `Gazette_${course}_${semester}_${exam}`.replace(/[\s\/\\]+/g, '_');
  };

  const handleDownloadPdf = async () => {
    if (!selectedCourse || !selectedExam || !selectedSemester || !selectedPattern) {
      setPageAlert({
        variant: "warning",
        title: "Required Fields Missing",
        message: "Please ensure course, exam, semester, and pattern are filled."
      });
      return;
    }
    if (mergeExam && !mergedExamId) {
      setPageAlert({
        variant: "warning",
        title: "Merge Exam Required",
        message: "Select the exam to merge before generating the Gazette."
      });
      return;
    }
    setLoading(true);
    try {
      await ReportService.downloadGazette({
        examId: selectedExam,
        semId: selectedSemester,
        pattern: selectedPattern,
        roundNumber,
        noRleForFail,
        cgpiForFail,
        sgpiForFail,
        mergeExam,
        mergedExamId: mergeExam && mergedExamId ? mergedExamId : undefined,
        studentsPerPage: parseInt(studentsPerPage),
        subjectsPerRow: parseInt(subjectsPerRow),
        cxgSems,
        gpaSems,
        fileName: getDownloadFileName()
      });
    } catch (error) {
      setPageAlert({
        variant: "error",
        title: "Download Failed",
        message: "Failed to download Gazette PDF."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedCourse || !selectedExam || !selectedSemester || !selectedPattern) {
      setPageAlert({
        variant: "warning",
        title: "Required Fields Missing",
        message: "Please ensure course, exam, semester, and pattern are filled."
      });
      return;
    }
    if (mergeExam && !mergedExamId) {
      setPageAlert({
        variant: "warning",
        title: "Merge Exam Required",
        message: "Select the exam to merge before exporting the Gazette."
      });
      return;
    }
    setLoading(true);
    try {
      await ReportService.downloadGazetteExcel({
        examId: selectedExam,
        semId: selectedSemester,
        pattern: selectedPattern,
        roundNumber,
        noRleForFail,
        cgpiForFail,
        sgpiForFail,
        mergeExam,
        mergedExamId: mergeExam && mergedExamId ? mergedExamId : undefined,
        studentsPerPage: parseInt(studentsPerPage),
        subjectsPerRow: parseInt(subjectsPerRow),
        cxgSems,
        gpaSems,
        fileName: getDownloadFileName()
      });
    } catch (error) {
      setPageAlert({
        variant: "error",
        title: "Download Failed",
        message: "Failed to download Gazette Excel."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 relative">
      {/* Floating Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {pageAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto shadow-2xl"
            >
              <Alert
                variant={pageAlert.variant}
                title={pageAlert.title}
                message={pageAlert.message}
                onClose={() => setPageAlert(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ComponentCard title="Generate Gazette Report">
        {/* Core Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Select
              options={courseOptions}
              value={selectedCourse}
              onChange={handleCourseChange}
              placeholder="Select Course"
            />
          </div>

          <AnimatePresence mode="popLayout">
            {selectedCourse && (
              <motion.div
                key="semester-select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Select
                  options={semesterOptions}
                  value={selectedSemester}
                  onChange={handleSemesterChange}
                  placeholder="Select Semester"
                />
              </motion.div>
            )}

            {selectedSemester && (
              <motion.div
                key="pattern-select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Select
                  options={patternOptions}
                  value={selectedPattern}
                  onChange={handlePatternChange}
                  placeholder="Select Pattern"
                />
              </motion.div>
            )}

            {selectedPattern && (
              <motion.div
                key="exam-select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Select
                  options={examOptions}
                  value={selectedExam}
                  onChange={(value) => setSelectedExam(value)}
                  placeholder="Select Exam"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Row - Center-aligned below inputs */}
        <AnimatePresence mode="popLayout">
          {selectedExam && (
            <motion.div
              key="action-row"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/60 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 h-11 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/55 transition-colors cursor-pointer ${
                  showSettings ? "ring-2 ring-brand-500" : ""
                }`}
              >
                <Settings2 size={18} />
                {showSettings ? "Hide Settings" : "Advanced Settings"}
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={loading}
                  className={`flex-1 sm:w-44 flex items-center justify-center gap-2 h-11 text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg shadow-theme-xs transition-colors cursor-pointer text-sm font-medium ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <FileSpreadsheet size={18} />
                  {loading ? "Exporting..." : "Export Excel"}
                </button>

                <Button
                  onClick={handleDownloadPdf}
                  disabled={loading}
                  className="flex-grow flex-1 sm:w-44 flex items-center justify-center gap-2 h-11 text-sm font-medium"
                >
                  <Download size={18} />
                  {loading ? "Generating..." : "Gazette PDF"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ComponentCard>

      {/* Advanced Settings Panel */}
      <AnimatePresence>
        {showSettings && selectedExam && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ComponentCard title="Advanced Settings">
              <div className="space-y-8">
                
                {/* Toggles & Overrides */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={roundNumber} onChange={(e) => setRoundNumber(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Round Number</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={noRleForFail} onChange={(e) => setNoRleForFail(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">No RLE For Fail</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={cgpiForFail} onChange={(e) => setCgpiForFail(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">CGPI For Fail</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sgpiForFail} onChange={(e) => setSgpiForFail(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">SGPI For Fail</span>
                  </label>
                  
                  <div className="col-span-2 md:col-span-4 flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={mergeExam} onChange={(e) => { setMergeExam(e.target.checked); if (!e.target.checked) setMergedExamId(""); }} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Merge Exam</span>
                    </label>
                    {mergeExam && (
                      <div className="w-full max-w-sm">
                        <Select
                          options={examOptions.filter((exam) => exam.value !== selectedExam)}
                          value={mergedExamId}
                          onChange={setMergedExamId}
                          placeholder="Select exam to merge"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Layout Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Students Per Page</label>
                    <select 
                      value={studentsPerPage} 
                      onChange={(e) => setStudentsPerPage(e.target.value)}
                      className="w-full max-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subjects Per Row</label>
                    <select 
                      value={subjectsPerRow} 
                      onChange={(e) => setSubjectsPerRow(e.target.value)}
                      className="w-full max-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                    </select>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* CXG / GPA Calculation Semesters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">CXG Calculation</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <label key={`cxg-${sem}`} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={cxgSems.includes(sem)} 
                            onChange={() => handleToggleCxg(sem)} 
                            className="rounded text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Sem-{sem}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">GPA Calculation</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <label key={`gpa-${sem}`} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={gpaSems.includes(sem)} 
                            onChange={() => handleToggleGpa(sem)} 
                            className="rounded text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Sem-{sem}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </ComponentCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
