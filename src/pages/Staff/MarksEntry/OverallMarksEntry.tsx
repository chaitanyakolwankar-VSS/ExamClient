import { useState, useEffect, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import { Search, Play, FileText, Loader2, RefreshCcw } from "lucide-react";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  OverallMarksService,
  ResultData,
} from "../../../services/OverallMarksService";
import { CourseService } from "../../../services/Course";
import { OrdinanceService } from "../../../services/OrdinanceService";

interface Option {
  value: string;
  label: string;
}

type AlertInfo = {
  variant: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
};

export default function OverallMarksEntry() {
  // Filter States
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  const [semesterOptions, setSemesterOptions] = useState<Option[]>([]);
  const [selectedSemester, setSelectedSemester] = useState("");

  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [selectedPattern, setSelectedPattern] = useState("");

  const [examOptions, setExamOptions] = useState<Option[]>([]);
  const [selectedExam, setSelectedExam] = useState("");

  const [isSingleStudent, setIsSingleStudent] = useState(false);
  const [studentId, setStudentId] = useState("");

  // Data States
  const [results, setResults] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageAlert, setPageAlert] = useState<AlertInfo | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [courseData, patternData, semData] = await Promise.all([
          CourseService.getCourse(),
          OrdinanceService.getPatterns(),
          OverallMarksService.getSemesters(),
        ]);
        setCourseOptions(courseData.map(c => ({ value: c.courseid, label: c.coursename })));
        setPatternOptions(patternData.map(p => ({ value: p.patternName, label: p.patternName })));
        setSemesterOptions(semData.map(s => ({ value: s.value, label: s.label })));
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setPageAlert({ variant: "error", title: "Error", message: "Failed to load initial data." });
      }
    };
    fetchInitialData();
  }, []);

  // Auto-clear alert timer
  useEffect(() => {
    if (pageAlert) {
      const timer = setTimeout(() => setPageAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [pageAlert]);

  // Cascading reset handlers
  const handleCourseChange = (val: string) => {
    setSelectedCourse(val);
    setSelectedSemester("");
    setSelectedPattern("");
    setSelectedExam("");
    setResults([]);
    setSearchQuery("");
  };

  const handleSemesterChange = (val: string) => {
    setSelectedSemester(val);
    setSelectedPattern("");
    setSelectedExam("");
    setResults([]);
    setSearchQuery("");
  };

  const handlePatternChange = (val: string) => {
    setSelectedPattern(val);
    setSelectedExam("");
    setResults([]);
    setSearchQuery("");
  };

  const handleResetForm = () => {
    setSelectedCourse("");
    setSelectedSemester("");
    setSelectedPattern("");
    setSelectedExam("");
    setIsSingleStudent(false);
    setStudentId("");
    setResults([]);
    setSearchQuery("");
    setPageAlert(null);
  };

  // Cascading Filters
  useEffect(() => {
    if (selectedCourse && selectedSemester && selectedPattern) {
      const fetchExams = async () => {
        try {
          const ayid = localStorage.getItem("AYID");
          const examData = await OverallMarksService.getExams(selectedCourse, selectedSemester, selectedPattern, ayid || undefined);
          setExamOptions(examData.map(e => ({ value: e.examId, label: e.examName })));
        } catch (error) {
          console.error("Error fetching exams:", error);
        }
      };
      fetchExams();
    } else {
      setExamOptions([]);
    }
  }, [selectedCourse, selectedSemester, selectedPattern]);

  // Handlers
  const handleInsert = async () => {
    if (!selectedCourse || !selectedSemester || !selectedPattern || !selectedExam) {
      setPageAlert({ variant: "warning", title: "Validation", message: "Please select all required filters." });
      return;
    }
    if (isSingleStudent && !studentId) {
      setPageAlert({ variant: "warning", title: "Validation", message: "Please enter Student ID." });
      return;
    }

    setLoading(true);
    setPageAlert(null);
    try {
      const response = await OverallMarksService.processResults({
        branchId: selectedCourse,
        semId: selectedSemester,
        pattern: selectedPattern,
        examId: selectedExam,
        studentId: isSingleStudent ? studentId : undefined,
        isSingleStudent,
      });
      if (response.success) {
        setPageAlert({ variant: "success", title: "Success", message: response.message || "Results processed successfully." });
        handleView(); // Auto-load grid after process
      } else {
        setPageAlert({ variant: "error", title: "Error", message: response.message });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred during processing.";
      setPageAlert({ variant: "error", title: "Error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    if (!selectedCourse || !selectedSemester || !selectedPattern || !selectedExam) {
        setPageAlert({ variant: "warning", title: "Validation", message: "Please select all required filters." });
        return;
      }

    setLoading(true);
    setPageAlert(null);
    try {
      const response = await OverallMarksService.getResults({
        branchId: selectedCourse,
        semId: selectedSemester,
        pattern: selectedPattern,
        examId: selectedExam,
        studentId: isSingleStudent ? studentId : undefined,
        isSingleStudent,
      });
      if (response.success && response.data) {
        setResults(response.data);
        if (response.data.length === 0) {
            setPageAlert({ variant: "info", title: "No Data", message: "No processed results found for the selected filters." });
        }
      } else {
        setPageAlert({ variant: "error", title: "Error", message: response.message });
        setResults([]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while fetching results.";
      setPageAlert({ variant: "error", title: "Error", message: errorMessage });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedCourse || !selectedSemester || !selectedPattern || !selectedExam) return;
    setReportLoading(true);
    try {
        await OverallMarksService.exportExcel({
            branchId: selectedCourse,
            semId: selectedSemester,
            pattern: selectedPattern,
            examId: selectedExam,
            studentId: isSingleStudent ? studentId : undefined,
            isSingleStudent,
        });
        setIsReportModalOpen(false);
    } catch (error: any) {
        setPageAlert({ variant: "error", title: "Export Error", message: "Failed to export Excel report." });
    } finally {
        setReportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedCourse || !selectedSemester || !selectedPattern || !selectedExam) return;
    setReportLoading(true);
    try {
        await OverallMarksService.exportPdf({
            branchId: selectedCourse,
            semId: selectedSemester,
            pattern: selectedPattern,
            examId: selectedExam,
            studentId: isSingleStudent ? studentId : undefined,
            isSingleStudent,
        });
        setIsReportModalOpen(false);
    } catch (error: any) {
        setPageAlert({ variant: "error", title: "Export Error", message: "Failed to export PDF report." });
    } finally {
        setReportLoading(false);
    }
  };

  // Dynamic Table structures for subjects and heads
  interface SubjectHead {
    key: string;
    subject: string;
    head: string;
  }

  const subjectHeads: SubjectHead[] = useMemo(() => {
    const keys = new Set<string>();
    results.forEach(r => {
      Object.keys(r.subjectMarks).forEach(k => keys.add(k));
    });

    return Array.from(keys).map(k => {
      const match = k.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        return { key: k, subject: match[1], head: match[2] };
      }
      return { key: k, subject: k, head: "" };
    }).sort((a, b) => {
      if (a.subject !== b.subject) {
        return a.subject.localeCompare(b.subject);
      }
      return a.head.localeCompare(b.head);
    });
  }, [results]);

  const subjectsGrouped = useMemo(() => {
    const groups: { subject: string; heads: SubjectHead[] }[] = [];
    subjectHeads.forEach(sh => {
      let group = groups.find(g => g.subject === sh.subject);
      if (!group) {
        group = { subject: sh.subject, heads: [] };
        groups.push(group);
      }
      group.heads.push(sh);
    });
    return groups;
  }, [subjectHeads]);

  const filteredResults = useMemo(() => {
    if (!searchQuery) return results;
    const q = searchQuery.toLowerCase();
    return results.filter(r => 
      r.studentId.toLowerCase().includes(q) ||
      r.studentName.toLowerCase().includes(q) ||
      r.seatNo.toLowerCase().includes(q)
    );
  }, [results, searchQuery]);

  return (
    <div className="space-y-6">
      <ComponentCard title="Overall Marks Entry - Filters">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          {/* Branch: Always visible */}
          <div className="w-full">
            <Select
              label="Branch"
              options={courseOptions}
              value={selectedCourse}
              onChange={handleCourseChange}
              placeholder="Select Branch"
            />
          </div>

          <AnimatePresence mode="popLayout">
            {/* Semester: Visible only when Branch is selected */}
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
                  value={selectedSemester}
                  onChange={handleSemesterChange}
                  placeholder="Select Semester"
                />
              </motion.div>
            )}

            {/* Pattern: Visible only when Semester is selected */}
            {selectedCourse && selectedSemester && (
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
                  value={selectedPattern}
                  onChange={handlePatternChange}
                  placeholder="Select Pattern"
                />
              </motion.div>
            )}

            {/* Exam Master: Visible only when Pattern is selected */}
            {selectedCourse && selectedSemester && selectedPattern && (
              <motion.div
                key="exam"
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  label="Exam Master"
                  options={examOptions}
                  value={selectedExam}
                  onChange={setSelectedExam}
                  placeholder="Select Exam"
                />
              </motion.div>
            )}

            {/* Single Student Toggle: Visible only when Exam is selected */}
            {selectedCourse && selectedSemester && selectedPattern && selectedExam && (
              <motion.div
                key="singleStudent"
                className="w-full flex items-center justify-between gap-4 h-11 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Single Student</span>
                <Switch checked={isSingleStudent} onChange={setIsSingleStudent} />
              </motion.div>
            )}

            {/* Student ID: Visible only when Single Student is toggled */}
            {selectedCourse && selectedSemester && selectedPattern && selectedExam && isSingleStudent && (
              <motion.div
                key="studentId"
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  label="Student ID"
                  placeholder="Enter Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                />
              </motion.div>
            )}

            {/* Actions: Process, View, Reset */}
            {selectedCourse && selectedSemester && selectedPattern && selectedExam && (!isSingleStudent || studentId) && (
              <motion.div
                key="actions"
                className="w-full flex items-end gap-2 h-11"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="primary" onClick={handleInsert} disabled={loading} className="flex-grow h-11">
                  {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Play className="size-4 mr-2" />}
                  Process
                </Button>
                <Button variant="outline" onClick={handleView} disabled={loading} className="flex-grow h-11">
                  {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Search className="size-4 mr-2" />}
                  View
                </Button>
                {results.length > 0 && (
                  <Button variant="outline" onClick={() => setIsReportModalOpen(true)} disabled={loading} className="px-3 h-11">
                    {loading ? <Loader2 className="animate-spin size-4" /> : <FileText className="size-4" />}
                  </Button>
                )}
                <Button variant="outline" onClick={handleResetForm} disabled={loading} className="px-3 h-11">
                  {loading ? <Loader2 className="animate-spin size-4" /> : <RefreshCcw className="size-4" />}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ComponentCard>

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

      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-theme-md border border-gray-200 dark:border-gray-800 p-4">
           {/* Color Legend */}
           <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
             <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[10px]">Legend:</span>
             <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/30">
               <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <span>Resolution (^)</span>
             </div>
             <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/30">
               <span className="size-1.5 rounded-full bg-blue-500"></span>
               <span>Grace Marks (*)</span>
             </div>
             <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/30">
               <span className="size-1.5 rounded-full bg-amber-500"></span>
               <span>Grace Marks (@)</span>
             </div>
             <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-900/30">
               <span className="size-1.5 rounded-full bg-purple-500"></span>
               <span>Quota (#)</span>
             </div>
             <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-750">
               <span className="size-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
               <span>No Head for Credit</span>
             </div>
           </div>

           {/* Search Input */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
             <div className="relative w-full sm:w-72">
               <input
                 type="text"
                 placeholder="Search student ID, name, seat..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-150 transition-all duration-200"
               />
               <Search className="absolute left-3 top-2.5 size-4 text-gray-400 dark:text-gray-500" />
             </div>
             <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
               Showing {filteredResults.length} of {results.length} students
             </span>
           </div>

           {/* Custom Styled HTML Table with RowSpan / ColSpan */}
           <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
             <table className="w-full border-collapse border border-gray-200 dark:border-gray-800 text-center text-sm">
               <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200 dark:border-gray-800">
                 <tr>
                   <th rowSpan={2} className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap">Seat No</th>
                   <th rowSpan={2} className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap">Student ID</th>
                   <th rowSpan={2} className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold text-left whitespace-nowrap">Student Name</th>
                   {subjectsGrouped.map(group => (
                     <th key={group.subject} colSpan={group.heads.length} className="px-4 py-2 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap bg-gray-100/50 dark:bg-gray-800/60 text-primary-600 dark:text-primary-400">
                       {group.subject}
                     </th>
                   ))}
                   <th rowSpan={2} className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap">Total</th>
                   <th rowSpan={2} className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap">%</th>
                   <th rowSpan={2} className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap">SGPI</th>
                   <th rowSpan={2} className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap">CGPI</th>
                   <th rowSpan={2} className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap">Result</th>
                 </tr>
                 <tr className="bg-gray-50 dark:bg-gray-800/50">
                   {subjectsGrouped.flatMap(group =>
                     group.heads.map(sh => (
                       <th key={sh.key} className="px-3 py-2 border border-gray-200 dark:border-gray-800 font-bold text-[10px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                         {sh.head || "-"}
                       </th>
                     ))
                   )}
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-150">
                 {filteredResults.map(row => (
                   <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors">
                     <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-medium whitespace-nowrap">{row.seatNo}</td>
                     <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-medium whitespace-nowrap">{row.studentId}</td>
                     <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 text-left whitespace-nowrap">{row.studentName}</td>
                     {subjectHeads.map(sh => {
                       const val = row.subjectMarks[sh.key] || "-";
                       let badgeColor = "text-gray-700 dark:text-gray-300";
                       if (val.includes("^")) badgeColor = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30";
                       else if (val.includes("*")) badgeColor = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30";
                       else if (val.includes("@")) badgeColor = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/30";
                       else if (val.includes("#")) badgeColor = "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30";
                       
                       return (
                         <td key={sh.key} className="px-3 py-2 border border-gray-200 dark:border-gray-800 whitespace-nowrap">
                           <span className={`px-2.5 py-1 rounded font-semibold text-xs inline-block ${badgeColor}`}>
                             {val}
                           </span>
                         </td>
                       );
                     })}
                     <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-semibold whitespace-nowrap">{row.totalMarks}</td>
                     <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-semibold whitespace-nowrap">{row.percentage}%</td>
                     <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-semibold whitespace-nowrap">{row.sgpi}</td>
                     <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-semibold whitespace-nowrap">{row.cgpi}</td>
                     <td className="px-4 py-3 border border-gray-200 dark:border-gray-800 whitespace-nowrap">
                       <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                         row.resultStatus.toLowerCase() === 'pass' 
                           ? 'bg-green-500 text-white dark:bg-green-600' 
                           : 'bg-red-500 text-white dark:bg-red-600'
                       }`}>
                         {row.resultStatus}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => !reportLoading && setIsReportModalOpen(false)}
        title="Generate Reports"
        className="max-w-sm mx-4"
      >
        <div className="p-4 grid grid-cols-1 gap-4">
           <Button 
             variant="primary" 
             className="w-full justify-start" 
             onClick={handleExportExcel}
             disabled={reportLoading}
           >
             {reportLoading ? <Loader2 className="animate-spin size-4 mr-2" /> : <FileText className="size-4 mr-2" />}
             Grid Report (Excel)
           </Button>
           <Button 
             variant="primary" 
             className="w-full justify-start" 
             onClick={handleExportPdf} 
             disabled={!selectedCourse || !selectedSemester || !selectedPattern || !selectedExam || reportLoading}
           >
             {reportLoading ? <Loader2 className="animate-spin size-4 mr-2" /> : <FileText className="size-4 mr-2" />}
             Overall Result Report (PDF)
           </Button>
        </div>
      </Modal>
    </div>
  );
}
