import { useState, useEffect, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import { Search, Play, FileText, Loader2 } from "lucide-react";
import Input from "../../../components/form/input/InputField";
import DataTable from "../../../components/ui/table/DataTable";
import Switch from "../../../components/form/switch/Switch";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";
import {
  OverallMarksService,
  SemesterOption,
  ExamOption,
  GroupOption,
  ResultData,
} from "../../../services/OverallMarksService";
import { CourseService, CourseApiResponse } from "../../../services/Course";
import { academicYearService, AcademicYearResponse } from "../../../services/academicYearService";
import { OrdinanceService, PatternData } from "../../../services/OrdinanceService";

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
  const [courses, setCourses] = useState<CourseApiResponse[]>([]);
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<Option[]>([]);
  const [selectedSemester, setSelectedSemester] = useState("");

  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [selectedPattern, setSelectedPattern] = useState("");

  const [exams, setExams] = useState<ExamOption[]>([]);
  const [examOptions, setExamOptions] = useState<Option[]>([]);
  const [selectedExam, setSelectedExam] = useState("");

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<Option[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const [isSingleStudent, setIsSingleStudent] = useState(false);
  const [studentId, setStudentId] = useState("");

  // Data States
  const [results, setResults] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageAlert, setPageAlert] = useState<AlertInfo | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [courseData, patternData, semData] = await Promise.all([
          CourseService.getCourse(),
          OrdinanceService.getPatterns(),
          OverallMarksService.getSemesters(),
        ]);
        setCourses(courseData);
        setCourseOptions(courseData.map(c => ({ value: c.courseid, label: c.coursename })));
        setPatterns(patternData);
        setPatternOptions(patternData.map(p => ({ value: p.patternName, label: p.patternName })));
        setSemesters(semData);
        setSemesterOptions(semData.map(s => ({ value: s.value, label: s.label })));
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setPageAlert({ variant: "error", title: "Error", message: "Failed to load initial data." });
      }
    };
    fetchInitialData();
  }, []);

  // Cascading Filters
  useEffect(() => {
    if (selectedCourse && selectedSemester && selectedPattern) {
      const fetchExamsAndGroups = async () => {
        try {
          const [examData, groupData] = await Promise.all([
            OverallMarksService.getExams(selectedCourse, selectedSemester, selectedPattern),
            OverallMarksService.getGroups(selectedCourse, selectedSemester, selectedPattern),
          ]);
          setExams(examData);
          setExamOptions(examData.map(e => ({ value: e.examCode, label: e.examName })));
          setGroups(groupData);
          setGroupOptions(groupData.map(g => ({ value: g.groupId, label: g.groupName })));
        } catch (error) {
          console.error("Error fetching exams/groups:", error);
        }
      };
      fetchExamsAndGroups();
    } else {
      setExams([]);
      setExamOptions([]);
      setGroups([]);
      setGroupOptions([]);
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
        examCode: selectedExam,
        groupId: selectedGroup || undefined,
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
      setPageAlert({ variant: "error", title: "Error", message: error.message || "An error occurred during processing." });
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
        examCode: selectedExam,
        groupId: selectedGroup || undefined,
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
      setPageAlert({ variant: "error", title: "Error", message: error.message || "An error occurred while fetching results." });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Table Columns
  const columns = useMemo(() => {
    const baseColumns = [
      { key: "seatNo", label: "Seat No", sortable: true },
      { key: "studentId", label: "Student ID", sortable: true },
      { key: "studentName", label: "Student Name", sortable: true, className: "text-left" },
    ];

    // Collect all unique subject IDs from results
    const subjectIds = new Set<string>();
    results.forEach(r => {
      Object.keys(r.subjectMarks).forEach(id => subjectIds.add(id));
    });

    const subjectColumns = Array.from(subjectIds).sort().map(id => ({
      key: `sub_${id}`,
      label: id,
      render: (row: ResultData) => {
        const val = row.subjectMarks[id] || "-";
        let bgColor = "";
        if (val.includes("^")) bgColor = "bg-green-100 dark:bg-green-900/30 text-green-700";
        else if (val.includes("*")) bgColor = "bg-blue-100 dark:bg-blue-900/30 text-blue-700";
        else if (val.includes("@")) bgColor = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700";
        else if (val.includes("#")) bgColor = "bg-purple-100 dark:bg-purple-900/30 text-purple-700";
        
        return (
          <div className={`px-2 py-1 rounded font-medium ${bgColor}`}>
            {val}
          </div>
        );
      }
    }));

    const footerColumns = [
      { key: "totalMarks", label: "Total", sortable: true },
      { key: "percentage", label: "%", sortable: true, render: (row: ResultData) => `${row.percentage}%` },
      { key: "sgpi", label: "SGPI", sortable: true },
      { key: "cgpi", label: "CGPI", sortable: true },
      { 
        key: "resultStatus", 
        label: "Result", 
        sortable: true,
        render: (row: ResultData) => (
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
            row.resultStatus.toLowerCase() === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {row.resultStatus}
          </span>
        )
      },
    ];

    return [...baseColumns, ...subjectColumns, ...footerColumns];
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Alert Section */}
      {pageAlert && (
        <Alert
          variant={pageAlert.variant}
          title={pageAlert.title}
          message={pageAlert.message}
        />
      )}

      {/* Filter Section */}
      <ComponentCard title="Overall Marks Entry - Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Branch"
            options={courseOptions}
            value={selectedCourse}
            onChange={setSelectedCourse}
            placeholder="Select Branch"
          />
          <Select
            label="Semester"
            options={semesterOptions}
            value={selectedSemester}
            onChange={setSelectedSemester}
            placeholder="Select Semester"
          />
          <Select
            label="Pattern"
            options={patternOptions}
            value={selectedPattern}
            onChange={setSelectedPattern}
            placeholder="Select Pattern"
          />
          <Select
            label="Exam Master"
            options={examOptions}
            value={selectedExam}
            onChange={setSelectedExam}
            placeholder="Select Exam"
            disabled={!selectedCourse || !selectedSemester || !selectedPattern}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 items-end">
          {groupOptions.length > 0 && (
            <Select
              label="Group"
              options={groupOptions}
              value={selectedGroup}
              onChange={setSelectedGroup}
              placeholder="Select Group"
            />
          )}

          <div className="flex items-center gap-4 h-11">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Single Student</span>
            <Switch checked={isSingleStudent} onChange={setIsSingleStudent} />
          </div>

          {isSingleStudent && (
            <Input
              label="Student ID"
              placeholder="Enter Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
            />
          )}

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleInsert}
              disabled={loading}
              className="flex-1"
            >
              {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Play className="size-4 mr-2" />}
              Process
            </Button>
            <Button
              variant="outline"
              onClick={handleView}
              disabled={loading}
              className="flex-1"
            >
              <Search className="size-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsReportModalOpen(true)}
              disabled={loading || results.length === 0}
            >
              <FileText className="size-4" />
            </Button>
          </div>
        </div>
      </ComponentCard>

      {/* Legend Section */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="size-3 bg-green-500 rounded-sm"></span>
          <span>RESOLUTION (^)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 bg-blue-500 rounded-sm"></span>
          <span>GRACE MARKS (*)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 bg-yellow-500 rounded-sm"></span>
          <span>GRACE MARKS (@)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 bg-purple-500 rounded-sm"></span>
          <span>QUOTA (#)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 bg-gray-200 dark:bg-gray-700 rounded-sm"></span>
          <span>NO HEAD FOR CREDIT</span>
        </div>
      </div>

      {/* Results Section */}
      <ComponentCard title="Processed Results">
        <DataTable
          data={results}
          columns={columns}
          searchKeys={["studentId", "studentName", "seatNo"]}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </ComponentCard>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Generate Reports"
      >
        <div className="p-4 grid grid-cols-1 gap-4">
           <Button variant="primary" className="w-full justify-start">
             <FileText className="size-4 mr-2" /> Grid Report (Excel)
           </Button>
           <Button variant="primary" className="w-full justify-start">
             <FileText className="size-4 mr-2" /> Overall Result Report (PDF)
           </Button>
        </div>
      </Modal>
    </div>
  );
}
