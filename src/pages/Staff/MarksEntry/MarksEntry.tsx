import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import DataTable from "../../../components/ui/table/DataTable";
import Alert from "../../../components/ui/alert/Alert";
import { CourseService } from "../../../services/Course";
import { PatternService } from "../../../services/Pattern";
import { GetSubject } from "../../../services/GetSubject";
import { RegularExamService } from "../../../services/RegularExamService";
import { MarksEntryService, MarksEntryData } from "../../../services/MarksEntryService";
import { Loader2, Save, Search, Download, Upload, RefreshCcw, X } from "lucide-react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function MarksEntry() {
  const [courseOptions, setCourseOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [patternOptions, setPatternOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedPattern, setSelectedPattern] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [examOptions, setExamOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [studentId, setStudentId] = useState("");
  const [showStudentIdSearch, setShowStudentIdSearch] = useState(false);
  const [rank, setRank] = useState("");

  const [loading, setLoading] = useState(false);
  const [marksData, setMarksData] = useState<MarksEntryData[]>([]);
  const [pageAlert, setPageAlert] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalMarksMapRef = useRef<Record<string, string>>({});
  const originalRankRef = useRef<string>("0");

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
    setSelectedSubject("");
    setMarksData([]);
  };

  const handleSemesterChange = (val: string) => {
    setSelectedSemester(val);
    setSelectedPattern("");
    setSelectedExam("");
    setSelectedSubject("");
    setMarksData([]);
  };

  const handlePatternChange = (val: string) => {
    setSelectedPattern(val);
    setSelectedExam("");
    setSelectedSubject("");
    setMarksData([]);
  };

  const handleExamChange = (val: string) => {
    setSelectedExam(val);
    setSelectedSubject("");
    setMarksData([]);
  };

  const handleSubjectChange = (val: string) => {
    setSelectedSubject(val);
    setMarksData([]);
  };

  const handleResetForm = () => {
    setSelectedCourse("");
    setSelectedSemester("");
    setSelectedPattern("");
    setSelectedExam("");
    setSelectedSubject("");
    setMarksData([]);
    setPageAlert(null);
  };

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
      setCourseOptions(courses.map(c => ({ value: c.courseid, label: c.coursename })));
      const patterns = await PatternService.getpattern();
      setPatternOptions(patterns.map(p => ({ value: p.patternName, label: p.patternName })));
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    if (selectedCourse && selectedSemester && selectedPattern) {
        fetchExams();
    }
  }, [selectedCourse, selectedSemester, selectedPattern]);

  const fetchExams = async () => {
    try {
        const ayid = localStorage.getItem("AYID");
        const exams = await RegularExamService.getExam({ Courseid: selectedCourse, Ayid: ayid || "" });
        setExamOptions(exams.map(e => ({ value: e.examId, label: e.examname })));
    } catch (error) {
        console.error("Fetch exams error:", error);
    }
  };
  useEffect(() => {
    if (selectedCourse && selectedSemester && selectedPattern) {
        fetchSubjects();
    }
  }, [selectedCourse, selectedSemester, selectedPattern]);

  const fetchSubjects = async () => {
    try {
        const subjects = await GetSubject.getSubject({ courseId: selectedCourse, pattern: selectedPattern, semester: selectedSemester });
        setSubjectOptions(subjects.map(s => ({ value: s.subjectId, label: s.subjectName })));
    } catch (error) {
        console.error("Fetch subjects error:", error);
    }
  };

  const handleFetchData = async () => {
    if (!selectedCourse || !selectedSemester || !selectedPattern || !selectedExam || !selectedSubject) {
      setPageAlert({ variant: "error", title: "Missing Filters", message: "Please select all required filters." });
      return;
    }

    setLoading(true);
    try {
      const res = await MarksEntryService.getMarksData({
        branchId: selectedCourse,
        semId: selectedSemester,
        pattern: selectedPattern,
        examId: selectedExam,
        subjectId: selectedSubject,
        studentId: studentId || undefined
      });

      if (res.success && res.data) {
        // Safe string normalization for marks to prevent null/undefined/number issues
        const normalizedData = res.data.map(student => ({
          ...student,
          heads: student.heads.map(head => ({
            ...head,
            marks: head.marks !== null && head.marks !== undefined ? head.marks.toString().trim() : ""
          }))
        }));

        setMarksData(normalizedData);
        if (normalizedData.length > 0) {
          const fetchedRank = normalizedData[0].rank?.toString() || "0";
          setRank(fetchedRank);
          originalRankRef.current = fetchedRank;
        } else {
          setRank("0");
          originalRankRef.current = "0";
        }
        
        // Build a high-speed O(1) lookup map of original marks
        const marksMap: Record<string, string> = {};
        normalizedData.forEach(student => {
          student.heads.forEach(head => {
            marksMap[head.studentMarksId] = head.marks.trim();
          });
        });
        originalMarksMapRef.current = marksMap;
      } else {
        setPageAlert({ variant: "error", title: "Error", message: res.message });
      }
    } catch (error) {
      setPageAlert({ variant: "error", title: "Error", message: "Failed to fetch marks data." });
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (marksId: string, headMarksId: string, value: string) => {
    setMarksData(prev => prev.map(m => {
        if (m.marksId === marksId) {
            return {
                ...m,
                heads: m.heads.map(h => h.studentMarksId === headMarksId ? { ...h, marks: value } : h)
            };
        }
        return m;
    }));
  };

  const handleSave = async () => {
    // Log all student heads to console for debugging
    console.log("Saving marksData:", marksData);

    let errorReason = "";
    let invalidEntry: { student: MarksEntryData; head: any } | null = null;

    for (const student of marksData) {
      for (const head of student.heads) {
        if (!head.isEnabled) continue;

        const value = (head.marks ?? "").toString().trim();
        if (value === "") {
          invalidEntry = { student, head };
          errorReason = "empty";
          break;
        }
        
        if (value.toLowerCase() === "ab") continue;

        if (!/^\d+$/.test(value)) {
          invalidEntry = { student, head };
          errorReason = "format";
          break;
        }

        const numericValue = Number(value);
        if (numericValue < 0) {
          invalidEntry = { student, head };
          errorReason = "negative";
          break;
        }
        if (numericValue > head.outOf) {
          invalidEntry = { student, head };
          errorReason = "exceeded";
          break;
        }
      }
      if (invalidEntry) break;
    }

    if (invalidEntry && errorReason) {
      const { student, head } = invalidEntry;
      console.error("Validation failed on entry:", { student, head, reason: errorReason });
      
      let alertMessage = "";
      switch (errorReason) {
        case "empty":
          alertMessage = `${student.studentName} - ${head.headName} is empty. All marks must be entered (enter 'Ab' if the student was absent).`;
          break;
        case "format":
          alertMessage = `${student.studentName} - ${head.headName} contains invalid characters ("${head.marks}"). Please enter a whole number from 0 to ${head.outOf}, or 'Ab'.`;
          break;
        case "negative":
          alertMessage = `${student.studentName} - ${head.headName} has a negative mark ("${head.marks}"). Marks must be 0 or greater.`;
          break;
        case "exceeded":
          alertMessage = `${student.studentName} - ${head.headName} has a mark of ${head.marks}, which exceeds the maximum allowed marks of ${head.outOf}.`;
          break;
        default:
          alertMessage = `${student.studentName} - ${head.headName} has an invalid mark.`;
      }

      setPageAlert({
        variant: "error",
        title: "Validation Error",
        message: alertMessage,
      });
      return;
    }

    const parsedRank = Number(rank);
    if (!Number.isInteger(parsedRank) || parsedRank < 0) {
      setPageAlert({ variant: "error", title: "Invalid rank", message: "Subject rank must be a non-negative whole number." });
      return;
    }

    const updates: { studentMarksId: string; marks: string }[] = [];
    
    // Check for dirty marks using the O(1) lookup map
    marksData.forEach(student => {
      student.heads.forEach(head => {
        const currentMarks = (head.marks ?? "").toString().trim();
        const originalMarks = originalMarksMapRef.current[head.studentMarksId] ?? "";
        
        if (currentMarks !== originalMarks) {
          updates.push({
            studentMarksId: head.studentMarksId,
            marks: currentMarks
          });
        }
      });
    });

    const hasRankChanged = rank !== originalRankRef.current;

    if (updates.length === 0 && !hasRankChanged) {
      Swal.fire("Info", "No changes detected to save.", "info");
      return;
    }

    setLoading(true);
    try {
        const res = await MarksEntryService.saveMarks({ updates, rank: parsedRank });
        if (res.success) {
            Swal.fire("Saved!", "Marks updated successfully.", "success");
            handleFetchData();
        } else {
            Swal.fire("Error", res.message, "error");
        }
    } catch (error) {
        Swal.fire("Error", "Failed to save marks.", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedCourse || !selectedSemester || !selectedPattern || !selectedExam || !selectedSubject) {
      setPageAlert({ variant: "error", title: "Missing filters", message: "Select branch, semester, pattern, exam, and subject before downloading a template." });
      return;
    }

    try {
      const blob = await MarksEntryService.exportTemplate({
        branchId: selectedCourse,
        semId: selectedSemester,
        pattern: selectedPattern,
        examId: selectedExam,
        subjectId: selectedSubject,
        studentId: studentId
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const branchLabel = courseOptions.find(c => c.value === selectedCourse)?.label || "Branch";
      const semLabel = semesterOptions.find(s => s.value === selectedSemester)?.label || "Semester";
      const examLabel = examOptions.find(e => e.value === selectedExam)?.label || "Exam";
      const subjectLabel = subjectOptions.find(s => s.value === selectedSubject)?.label || "Subject";
      const cleanName = `${branchLabel}_${semLabel}_${examLabel}_${subjectLabel}`.replace(/[\/\\:*?"<>|]/g, "_");
      
      a.download = `${cleanName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire("Error", "Failed to download template.", "error");
    }
  };

  const handleImportExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (marksData.length === 0) {
      Swal.fire("Error", "Please fetch the student list first by clicking Search before importing marks.", "error");
      e.target.value = "";
      return;
    }

    if (!/\.xlsx?$/i.test(file.name)) {
      setPageAlert({ variant: "error", title: "Invalid file", message: "Only .xlsx and .xls files can be imported." });
      e.target.value = "";
      return;
    }

    setLoading(true);
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
            Swal.fire("Error", "The imported Excel file is empty or missing data.", "error");
            return;
        }

        // Find the header row dynamically
        let headerRowIndex = -1;
        let studentIdIndex = -1;

        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            const row = jsonData[i];
            if (!row) continue;
            
            const idx = row.findIndex((h: any) => h && h.toString().toLowerCase().replace(/[^a-z0-9]/g, '').includes('studentid'));
            if (idx !== -1) {
                headerRowIndex = i;
                studentIdIndex = idx;
                break;
            }
        }
        
        if (headerRowIndex === -1 || studentIdIndex === -1) {
            Swal.fire("Error", "Could not find 'StudentId' column in the Excel file. Please use the downloaded template.", "error");
            return;
        }

        const headers = jsonData[headerRowIndex];
        const dataRows = jsonData.slice(headerRowIndex + 1);

        const headMappings: { colIndex: number; headName: string }[] = [];
        headers.forEach((h: any, index: number) => {
            if (h) {
                const hStr = h.toString().trim();
                const cleanH = hStr.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (cleanH.includes('seatno') || cleanH.includes('studentid') || cleanH.includes('studentname')) return;
                
                const match = hStr.match(/^(.*?)(?:\s*\()/);
                const pureHeadName = match ? match[1].trim() : hStr;
                headMappings.push({ colIndex: index, headName: pureHeadName });
            }
        });

        let updatedCount = 0;
        const newMarksData = marksData.map(student => {
            const excelRow = dataRows.find(row => 
                row[studentIdIndex] !== undefined && row[studentIdIndex] !== null &&
                row[studentIdIndex].toString().trim().toLowerCase() === student.studentId.toString().trim().toLowerCase()
            );
            if (!excelRow) return student;

            let isModified = false;
            const updatedHeads = student.heads.map(head => {
                if (!head.isEnabled) return head;
                
                const mapping = headMappings.find(hm => {
                    const cleanHm = hm.headName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanHead = head.headName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return cleanHm === cleanHead;
                });
                
                if (mapping && excelRow[mapping.colIndex] !== undefined && excelRow[mapping.colIndex] !== null) {
                    let rawMarks = excelRow[mapping.colIndex].toString().trim().toUpperCase();
                    // Auto-fix decimals if excel formatted them weirdly
                    if (!isNaN(Number(rawMarks)) && rawMarks !== "") {
                        rawMarks = Math.round(Number(rawMarks)).toString();
                    }
                    if (/^[0-9AB]*$/.test(rawMarks) || rawMarks === "") {
                        isModified = true;
                        return { ...head, marks: rawMarks };
                    }
                }
                return head;
            });

            if (isModified) updatedCount++;
            return isModified ? { ...student, heads: updatedHeads } : student;
        });

        if (updatedCount === 0) {
            const excelSampleIds = dataRows.map(row => row[studentIdIndex]).filter(id => id !== undefined && id !== null && id.toString().trim() !== "").slice(0, 5);
            const tableSampleIds = marksData.map(s => s.studentId).slice(0, 5);

            Swal.fire({
                title: "No Match Found",
                html: `<div class="text-left space-y-2 text-sm">
                        <p>No student marks were updated from the Excel sheet.</p>
                        <p><b>Excel Student IDs checked:</b> ${excelSampleIds.join(', ') || 'None'}${dataRows.length > 5 ? '...' : ''}</p>
                        <p><b>Table Student IDs:</b> ${tableSampleIds.join(', ')}${marksData.length > 5 ? '...' : ''}</p>
                        <p><b>Mapped Columns:</b> ${headMappings.map(hm => hm.headName).join(', ') || 'None'}</p>
                       </div>`,
                icon: "warning"
            });
            return;
        }

        setMarksData(newMarksData);
        Swal.fire("Imported!", `Successfully matched and loaded marks for ${updatedCount} student(s) into the table. Click 'Save Marks' when you are ready to save.`, "success");
    } catch (error) {
        console.error("Import error", error);
        Swal.fire("Error", "Failed to parse excel file.", "error");
    } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const columns = useMemo(() => {
    const base = [
        { key: "seatNo", label: "Seat No", sortable: true },
        { key: "studentId", label: "Student ID", sortable: true },
        { key: "studentName", label: "Student Name", sortable: true, className: "text-left min-w-[200px]" },
    ];

    if (marksData.length > 0) {
        marksData[0].heads.forEach(h => {
            base.push({
                key: `head_${h.studentMarksId}`,
                label: `${h.headName} (${h.passing}/${h.outOf})`,
                render: (row: MarksEntryData) => {
                    const head = row.heads.find(x => x.headName === h.headName);
                    if (!head) return "-";
                    
                    const isAb = (head.marks ?? "").toString().toLowerCase() === 'ab';
                    const isFail = !isAb && (head.marks ?? "").toString() !== "" && !isNaN(Number(head.marks)) && parseInt(head.marks.toString()) < head.passing;
                    
                    const graceVal = head.grace ?? "";
                    const isResolution = graceVal === "^";
                    const isGraceStar = graceVal === "*";
                    const isGraceAt = graceVal === "@";
                    const isQuota = graceVal === "#";
                    
                    let inputColorClasses = "text-gray-900 dark:text-gray-100";
                    if (isAb) {
                        inputColorClasses = "text-red-500 border-red-300 bg-red-50 dark:bg-red-900/20";
                    } else if (isResolution) {
                        inputColorClasses = "text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
                    } else if (isGraceStar) {
                        inputColorClasses = "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
                    } else if (isGraceAt) {
                        inputColorClasses = "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
                    } else if (isQuota) {
                        inputColorClasses = "text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400";
                    } else if (isFail) {
                        inputColorClasses = "text-red-600 border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:text-red-400";
                    }
                    
                    return (
                        <div className="w-full min-w-[70px]">
                          <Input
                              type="text"
                              className={`text-center font-medium px-2 w-full ${inputColorClasses}`}
                              value={head.marks ?? ""}
                              maxLength={4}
                              onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  if (/^[0-9AB]*$/.test(val)) {
                                      handleMarksChange(row.marksId, head.studentMarksId, val);
                                  }
                              }}
                              disabled={!head.isEnabled}
                          />
                        </div>
                    );
                }
            } as any);
        });

    }

    return base;
  }, [marksData]);

  return (
    <div className="space-y-6">
      {/* Fallback Alert (when no marks data is loaded) */}
      {marksData.length === 0 && pageAlert && (
        <Alert
          variant={pageAlert.variant}
          title={pageAlert.title}
          message={pageAlert.message}
          onClose={() => setPageAlert(null)}
        />
      )}

      <ComponentCard title="Marks Entry - Filters">
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
                  onChange={handleExamChange}
                  placeholder="Select Exam"
                />
              </motion.div>
            )}

            {/* Subject: Visible only when Exam is selected */}
            {selectedCourse && selectedSemester && selectedPattern && selectedExam && (
              <motion.div
                key="subject"
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  label="Subject"
                  options={subjectOptions}
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  placeholder="Select Subject"
                />
              </motion.div>
            )}

            {/* Actions: Search & Refresh */ }
            {selectedCourse && selectedSemester && selectedPattern && selectedExam && selectedSubject && (
              <motion.div
                key="actions"
                className="w-full flex items-end gap-2 h-11"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="primary" onClick={handleFetchData} disabled={loading} className="flex-grow h-11">
                  {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Search className="size-4 mr-2" />}
                  Search
                </Button>
                {marksData.length > 0 && (
                   <Button variant="primary" onClick={handleResetForm} disabled={loading} className="px-3 h-11">
                     <RefreshCcw className="size-4" />
                   </Button>
                )}
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

      {marksData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-theme-md border border-gray-200 dark:border-gray-800 p-4">
           {/* Top Toolbar */}
           <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              
              {/* Left Side: Rank & Save */}
              <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                 <div className="w-32">
                   <Input
                     label="Subject Rank"
                     placeholder="0"
                     value={rank}
                     onChange={(e) => setRank(e.target.value)}
                   />
                 </div>
                 <Button variant="primary" onClick={handleSave} disabled={loading} className="h-11 px-8 text-base shadow-theme-xs">
                    <Save className="size-5 mr-2" /> Save Marks
                 </Button>
              </div>

              {/* Right Side: Excel Tools */}
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:border-l border-gray-300 dark:border-gray-700 sm:pl-4 justify-end">
                  <Button variant="primary" onClick={handleDownloadTemplate} className="whitespace-nowrap h-11">
                      <Download className="size-4 mr-2" /> Download
                  </Button>
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: "none" }} 
                      accept=".xlsx, .xls"
                      onChange={handleImportExcel}
                  />
                  <Button variant="primary" onClick={() => fileInputRef.current?.click()} className="whitespace-nowrap h-11">
                      <Upload className="size-4 mr-2" /> Import
                  </Button>
              </div>
           </div>
            
            {/* Color Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
              <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[10px]">Legend:</span>
              <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/30">
                <span className="size-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>Absent (Ab)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-900/20">
                <span className="size-1.5 rounded-full bg-red-400"></span>
                <span>Below Passing</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/30">
                <span className="size-1.5 rounded-full bg-green-500"></span>
                <span>Resolution (^)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/30">
                <span className="size-1.5 rounded-full bg-blue-500"></span>
                <span>Grace (*)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/30">
                <span className="size-1.5 rounded-full bg-amber-500"></span>
                <span>Grace (@)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-900/30">
                <span className="size-1.5 rounded-full bg-purple-500"></span>
                <span>Quota (#)</span>
              </div>
            </div>
            
            {/* Data Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                <DataTable
                    data={marksData}
                    columns={columns}
                    searchKeys={["studentId", "studentName", "seatNo"]}
                    pageSizeOptions={[20, 50, 100]}
                />
           </div>
        </div>
      )}
    </div>
  );
}
