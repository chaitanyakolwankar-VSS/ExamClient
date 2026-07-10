import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
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
import { Loader2, Save, Search, Download, Upload, FileText } from "lucide-react";
import Swal from "sweetalert2";

export default function MarksEntry() {
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [patternOptions, setPatternOptions] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [examOptions, setExamOptions] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [studentId, setStudentId] = useState("");
  const [rank, setRank] = useState("");

  const [loading, setLoading] = useState(false);
  const [marksData, setMarksData] = useState<MarksEntryData[]>([]);
  const [pageAlert, setPageAlert] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setMarksData(res.data);
        if (res.data.length > 0) setRank(res.data[0].rank?.toString() || "0");
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
    const updates = marksData.flatMap(m => m.heads.map(h => ({
        studentMarksId: h.studentMarksId,
        marks: h.marks
    })));

    setLoading(true);
    try {
        const res = await MarksEntryService.saveMarks({ updates, rank: parseInt(rank) || 0 });
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
      a.download = "MarksTemplate.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire("Error", "Failed to download template.", "error");
    }
  };

  const handleImportExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setLoading(true);
    try {
        const res = await MarksEntryService.importExcel(selectedExam, selectedSubject, file);
        if (res.success) {
            Swal.fire("Imported!", res.message, "success");
            handleFetchData();
        } else {
            Swal.fire("Error", res.message, "error");
        }
    } catch (error) {
        Swal.fire("Error", "Failed to import excel.", "error");
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
                key: `head_${h.creditId}`,
                label: `${h.headName} (${h.passing}/${h.outOf})`,
                render: (row: MarksEntryData) => {
                    const head = row.heads.find(x => x.creditId === h.creditId);
                    if (!head) return "-";
                    return (
                        <input
                            type="text"
                            className={`w-20 px-2 py-1 border rounded text-center font-medium ${
                                head.marks.toLowerCase() === 'ab' ? 'text-red-500 border-red-300 bg-red-50' : 
                                (parseInt(head.marks) < head.passing ? 'text-red-500' : 'text-gray-900')
                            }`}
                            value={head.marks}
                            onChange={(e) => handleMarksChange(row.marksId, head.studentMarksId, e.target.value.toUpperCase())}
                            disabled={!head.isEnabled}
                        />
                    );
                }
            } as any);
        });
    }

    return base;
  }, [marksData]);

  return (
    <div className="space-y-6">
      {pageAlert && (
        <Alert
          variant={pageAlert.variant}
          title={pageAlert.title}
          message={pageAlert.message}
          onClose={() => setPageAlert(null)}
        />
      )}

      <ComponentCard title="Marks Entry - Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select label="Branch" options={courseOptions} value={selectedCourse} onChange={setSelectedCourse} placeholder="Select Branch" />
          <Select label="Semester" options={semesterOptions} value={selectedSemester} onChange={setSelectedSemester} placeholder="Select Semester" />
          <Select label="Pattern" options={patternOptions} value={selectedPattern} onChange={setSelectedPattern} placeholder="Select Pattern" />
          <Select label="Exam Master" options={examOptions} value={selectedExam} onChange={setSelectedExam} placeholder="Select Exam" disabled={!selectedCourse || !selectedSemester || !selectedPattern} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 items-end">
          <Select label="Subject" options={subjectOptions} value={selectedSubject} onChange={setSelectedSubject} placeholder="Select Subject" disabled={!selectedExam} />
          <Input label="Student ID (Search)" placeholder="Optional" value={studentId} onChange={(e) => setStudentId(e.target.value.toUpperCase())} />
          <Input label="Subject Rank" placeholder="0" value={rank} onChange={(e) => setRank(e.target.value)} />
          
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleFetchData} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Search className="size-4 mr-2" />}
              Search
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={loading || marksData.length === 0} className="flex-1">
              <Save className="size-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </ComponentCard>

      {marksData.length > 0 && (
        <ComponentCard title="Marks Entry Sheet">
           <div className="flex gap-2 mb-4 justify-end">
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                    <Download className="size-4 mr-2" /> Download Template
                </Button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: "none" }} 
                    accept=".xlsx, .xls"
                    onChange={handleImportExcel}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-4 mr-2" /> Import Excel
                </Button>
           </div>
           <div className="overflow-x-auto">
                <DataTable
                    data={marksData}
                    columns={columns}
                    searchKeys={["studentId", "studentName", "seatNo"]}
                    pageSizeOptions={[20, 50, 100]}
                />
           </div>
        </ComponentCard>
      )}
    </div>
  );
}
