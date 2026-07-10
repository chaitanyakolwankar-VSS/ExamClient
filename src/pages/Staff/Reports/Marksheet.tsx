import { useState, useEffect } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import { Download, Settings2 } from "lucide-react";
import { ReportService } from "../../../services/ReportService";
import { CourseService } from "../../../services/Course";
import { PatternService } from "../../../services/Pattern";
import { RegularExamService } from "../../../services/RegularExamService";

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
        const ayid = localStorage.getItem("AYID") || "3fa85f64-5717-4562-b3fc-2c963f66afa6";
        const exams = await RegularExamService.getExam({ Courseid: selectedCourse, Ayid: ayid });
        setExamOptions(exams.map((e: any) => ({ value: e.examId, label: e.examname })));
    } catch (error) {
        console.error("Fetch exams error:", error);
    }
  };
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [generationType, setGenerationType] = useState<"single" | "all" | "pass" | "fail">("single");
  const [studentId, setStudentId] = useState("3fa85f64-5717-4562-b3fc-2c963f66afa6"); // Guid
  const [resultDate, setResultDate] = useState("");
  
  const [includeHistory, setIncludeHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!exam || !semester || !pattern) {
      alert("Please ensure all core fields are filled.");
      return;
    }
    
    if (generationType === "single" && !studentId) {
      alert("Please enter a Student ID for single generation.");
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
          resultDate: resultDate || undefined
        });
      } else {
        await ReportService.downloadBulkMarksheet({
          examId: exam,
          semId: semester,
          pattern: pattern,
          generationType: generationType,
          includeHistory: includeHistory,
          resultDate: resultDate || undefined
        });
      }
    } catch (error: any) {
      alert("Failed to download Marksheet. " + (error?.response?.data || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <ComponentCard title="Generate Student Marksheet">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Course</label>
            <Select
              options={courseOptions}
              value={selectedCourse}
              onChange={(value) => setSelectedCourse(value)}
              placeholder="Select Course"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Semester</label>
            <Select
              options={semesterOptions}
              value={semester}
              onChange={(value) => setSemester(value)}
              placeholder="Select Semester"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Pattern</label>
            <Select
              options={patternOptions}
              value={pattern}
              onChange={(value) => setPattern(value)}
              placeholder="Select Pattern"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Exam</label>
            <Select
              options={examOptions}
              value={exam}
              onChange={(value) => setExam(value)}
              placeholder="Select Exam"
              disabled={!selectedCourse || !semester || !pattern}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-6 flex justify-end gap-3 items-center">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <Settings2 size={18} />
            Settings
          </button>
          <Button onClick={handleDownload} disabled={loading} className="flex items-center gap-2">
            <Download size={18} />
            {loading ? "Generating..." : "Generate Result"}
          </Button>
        </div>
      </ComponentCard>

      {/* Settings Panel */}
      {showSettings && (
        <ComponentCard title="Advanced Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Target Audience */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Target Selection</h3>
              
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="genType" 
                    value="single" 
                    checked={generationType === "single"}
                    onChange={(e) => setGenerationType(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Single Student</span>
                </label>
                
                {generationType === "single" && (
                  <input 
                    type="text" 
                    placeholder="Enter Student ID (Guid)" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full ml-6 max-w-[250px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  />
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="genType" 
                    value="all" 
                    checked={generationType === "all"}
                    onChange={(e) => setGenerationType(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
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
                    className="text-blue-600 focus:ring-blue-500"
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
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fail Only</span>
                </label>
              </div>
            </div>

            {/* Display / Formatting Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Formatting</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Result Date (Optional)</label>
                <input 
                  type="date" 
                  value={resultDate}
                  onChange={(e) => setResultDate(e.target.value)}
                  className="w-full max-w-[250px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Override the printed result date.</p>
              </div>
              
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include Final Semester History</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Appends previous semesters' history table at the bottom.</p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Round Numbers</span>
                </label>
              </div>
            </div>

          </div>
        </ComponentCard>
      )}
    </div>
  );
}
