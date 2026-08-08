const fs = require('fs');
const file = 'D:/Projects/ReactApi/ExamClient/src/pages/Staff/MarksEntry/MarksEntry.tsx';
let lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

const replacement = `  const handleSubjectChange = (val: string) => {
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
  };`;

lines.splice(69, 6, replacement);

fs.writeFileSync(file, lines.join('\n'));
