// DummyDashboard.tsx

import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BookOpenCheck,
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  Search,
} from "lucide-react";

// ============================================================
// MOCK DATA
// ============================================================

// Course Data
const MOCK_COURSES = [
  { courseId: "BPHARM", courseName: "B.Pharm", studentCount: 420 },
  { courseId: "DPHARM", courseName: "D.Pharm", studentCount: 180 },
  { courseId: "PHARMD", courseName: "Pharm.D", studentCount: 120 },
  {
    courseId: "MPHARM-P",
    courseName: "M.Pharm Pharmaceutics",
    studentCount: 60,
  },
  {
    courseId: "MPHARM-C",
    courseName: "M.Pharm Pharmacology",
    studentCount: 45,
  },
  {
    courseId: "MPHARM-QA",
    courseName: "M.Pharm Quality Assurance",
    studentCount: 40,
  },
];

// Semester Data per course
const MOCK_SEMESTERS: Record<
  string,
  { semesterId: string; studentCount: number }[]
> = {
  CSE101: [
    { semesterId: "Semester 1", studentCount: 120 },
    { semesterId: "Semester 2", studentCount: 115 },
    { semesterId: "Semester 3", studentCount: 110 },
    { semesterId: "Semester 4", studentCount: 105 },
    { semesterId: "Semester 5", studentCount: 98 },
    { semesterId: "Semester 6", studentCount: 92 },
  ],
  ECE201: [
    { semesterId: "Semester 1", studentCount: 85 },
    { semesterId: "Semester 2", studentCount: 82 },
    { semesterId: "Semester 3", studentCount: 78 },
    { semesterId: "Semester 4", studentCount: 75 },
    { semesterId: "Semester 5", studentCount: 70 },
    { semesterId: "Semester 6", studentCount: 65 },
  ],
  MECH301: [
    { semesterId: "Semester 1", studentCount: 75 },
    { semesterId: "Semester 2", studentCount: 72 },
    { semesterId: "Semester 3", studentCount: 68 },
    { semesterId: "Semester 4", studentCount: 65 },
    { semesterId: "Semester 5", studentCount: 60 },
    { semesterId: "Semester 6", studentCount: 55 },
  ],
  CIVIL401: [
    { semesterId: "Semester 1", studentCount: 55 },
    { semesterId: "Semester 2", studentCount: 52 },
    { semesterId: "Semester 3", studentCount: 48 },
    { semesterId: "Semester 4", studentCount: 45 },
    { semesterId: "Semester 5", studentCount: 40 },
    { semesterId: "Semester 6", studentCount: 38 },
  ],
  MBA501: [
    { semesterId: "Semester 1", studentCount: 50 },
    { semesterId: "Semester 2", studentCount: 48 },
    { semesterId: "Semester 3", studentCount: 45 },
    { semesterId: "Semester 4", studentCount: 42 },
    { semesterId: "Semester 5", studentCount: 38 },
    { semesterId: "Semester 6", studentCount: 35 },
  ],
  BBA601: [
    { semesterId: "Semester 1", studentCount: 42 },
    { semesterId: "Semester 2", studentCount: 40 },
    { semesterId: "Semester 3", studentCount: 38 },
    { semesterId: "Semester 4", studentCount: 35 },
    { semesterId: "Semester 5", studentCount: 32 },
    { semesterId: "Semester 6", studentCount: 30 },
  ],
};

// Pass/Fail Data per semester
const MOCK_PASS_FAIL: Record<
  string,
  { semesterId: string; passCount: number; failCount: number }[]
> = {
  CSE101: [
    { semesterId: "Semester 1", passCount: 108, failCount: 12 },
    { semesterId: "Semester 2", passCount: 102, failCount: 13 },
    { semesterId: "Semester 3", passCount: 95, failCount: 15 },
    { semesterId: "Semester 4", passCount: 88, failCount: 17 },
    { semesterId: "Semester 5", passCount: 80, failCount: 18 },
    { semesterId: "Semester 6", passCount: 75, failCount: 17 },
  ],
  ECE201: [
    { semesterId: "Semester 1", passCount: 72, failCount: 13 },
    { semesterId: "Semester 2", passCount: 68, failCount: 14 },
    { semesterId: "Semester 3", passCount: 63, failCount: 15 },
    { semesterId: "Semester 4", passCount: 58, failCount: 17 },
    { semesterId: "Semester 5", passCount: 52, failCount: 18 },
    { semesterId: "Semester 6", passCount: 47, failCount: 18 },
  ],
  MECH301: [
    { semesterId: "Semester 1", passCount: 62, failCount: 13 },
    { semesterId: "Semester 2", passCount: 58, failCount: 14 },
    { semesterId: "Semester 3", passCount: 53, failCount: 15 },
    { semesterId: "Semester 4", passCount: 48, failCount: 17 },
    { semesterId: "Semester 5", passCount: 42, failCount: 18 },
    { semesterId: "Semester 6", passCount: 38, failCount: 17 },
  ],
  CIVIL401: [
    { semesterId: "Semester 1", passCount: 45, failCount: 10 },
    { semesterId: "Semester 2", passCount: 42, failCount: 10 },
    { semesterId: "Semester 3", passCount: 38, failCount: 10 },
    { semesterId: "Semester 4", passCount: 35, failCount: 10 },
    { semesterId: "Semester 5", passCount: 30, failCount: 10 },
    { semesterId: "Semester 6", passCount: 28, failCount: 10 },
  ],
  MBA501: [
    { semesterId: "Semester 1", passCount: 42, failCount: 8 },
    { semesterId: "Semester 2", passCount: 40, failCount: 8 },
    { semesterId: "Semester 3", passCount: 37, failCount: 8 },
    { semesterId: "Semester 4", passCount: 35, failCount: 7 },
    { semesterId: "Semester 5", passCount: 30, failCount: 8 },
    { semesterId: "Semester 6", passCount: 27, failCount: 8 },
  ],
  BBA601: [
    { semesterId: "Semester 1", passCount: 35, failCount: 7 },
    { semesterId: "Semester 2", passCount: 33, failCount: 7 },
    { semesterId: "Semester 3", passCount: 30, failCount: 8 },
    { semesterId: "Semester 4", passCount: 28, failCount: 7 },
    { semesterId: "Semester 5", passCount: 25, failCount: 7 },
    { semesterId: "Semester 6", passCount: 23, failCount: 7 },
  ],
};

// Exam Type Data per semester
const MOCK_EXAM_TYPES: Record<
  string,
  { semesterId: string; examType: string; studentCount: number }[]
> = {
  CSE101: [
    { semesterId: "Semester 1", examType: "Regular", studentCount: 95 },
    { semesterId: "Semester 1", examType: "Reval", studentCount: 15 },
    { semesterId: "Semester 1", examType: "ATKT", studentCount: 10 },
    { semesterId: "Semester 2", examType: "Regular", studentCount: 88 },
    { semesterId: "Semester 2", examType: "Reval", studentCount: 14 },
    { semesterId: "Semester 2", examType: "ATKT", studentCount: 13 },
    { semesterId: "Semester 3", examType: "Regular", studentCount: 80 },
    { semesterId: "Semester 3", examType: "Reval", studentCount: 12 },
    { semesterId: "Semester 3", examType: "ATKT", studentCount: 18 },
    { semesterId: "Semester 4", examType: "Regular", studentCount: 75 },
    { semesterId: "Semester 4", examType: "Reval", studentCount: 10 },
    { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
    { semesterId: "Semester 5", examType: "Regular", studentCount: 68 },
    { semesterId: "Semester 5", examType: "Reval", studentCount: 8 },
    { semesterId: "Semester 5", examType: "ATKT", studentCount: 22 },
    { semesterId: "Semester 6", examType: "Regular", studentCount: 62 },
    { semesterId: "Semester 6", examType: "Reval", studentCount: 6 },
    { semesterId: "Semester 6", examType: "ATKT", studentCount: 24 },
  ],
  ECE201: [
    { semesterId: "Semester 1", examType: "Regular", studentCount: 60 },
    { semesterId: "Semester 1", examType: "Reval", studentCount: 12 },
    { semesterId: "Semester 1", examType: "ATKT", studentCount: 13 },
    { semesterId: "Semester 2", examType: "Regular", studentCount: 55 },
    { semesterId: "Semester 2", examType: "Reval", studentCount: 13 },
    { semesterId: "Semester 2", examType: "ATKT", studentCount: 14 },
    { semesterId: "Semester 3", examType: "Regular", studentCount: 50 },
    { semesterId: "Semester 3", examType: "Reval", studentCount: 12 },
    { semesterId: "Semester 3", examType: "ATKT", studentCount: 16 },
    { semesterId: "Semester 4", examType: "Regular", studentCount: 45 },
    { semesterId: "Semester 4", examType: "Reval", studentCount: 10 },
    { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
    { semesterId: "Semester 5", examType: "Regular", studentCount: 38 },
    { semesterId: "Semester 5", examType: "Reval", studentCount: 8 },
    { semesterId: "Semester 5", examType: "ATKT", studentCount: 24 },
    { semesterId: "Semester 6", examType: "Regular", studentCount: 32 },
    { semesterId: "Semester 6", examType: "Reval", studentCount: 6 },
    { semesterId: "Semester 6", examType: "ATKT", studentCount: 27 },
  ],
  MECH301: [
    { semesterId: "Semester 1", examType: "Regular", studentCount: 52 },
    { semesterId: "Semester 1", examType: "Reval", studentCount: 10 },
    { semesterId: "Semester 1", examType: "ATKT", studentCount: 13 },
    { semesterId: "Semester 2", examType: "Regular", studentCount: 48 },
    { semesterId: "Semester 2", examType: "Reval", studentCount: 10 },
    { semesterId: "Semester 2", examType: "ATKT", studentCount: 14 },
    { semesterId: "Semester 3", examType: "Regular", studentCount: 42 },
    { semesterId: "Semester 3", examType: "Reval", studentCount: 8 },
    { semesterId: "Semester 3", examType: "ATKT", studentCount: 18 },
    { semesterId: "Semester 4", examType: "Regular", studentCount: 38 },
    { semesterId: "Semester 4", examType: "Reval", studentCount: 7 },
    { semesterId: "Semester 4", examType: "ATKT", studentCount: 20 },
    { semesterId: "Semester 5", examType: "Regular", studentCount: 32 },
    { semesterId: "Semester 5", examType: "Reval", studentCount: 6 },
    { semesterId: "Semester 5", examType: "ATKT", studentCount: 22 },
    { semesterId: "Semester 6", examType: "Regular", studentCount: 28 },
    { semesterId: "Semester 6", examType: "Reval", studentCount: 5 },
    { semesterId: "Semester 6", examType: "ATKT", studentCount: 22 },
  ],
  CIVIL401: [
    { semesterId: "Semester 1", examType: "Regular", studentCount: 40 },
    { semesterId: "Semester 1", examType: "Reval", studentCount: 8 },
    { semesterId: "Semester 1", examType: "ATKT", studentCount: 7 },
    { semesterId: "Semester 2", examType: "Regular", studentCount: 37 },
    { semesterId: "Semester 2", examType: "Reval", studentCount: 7 },
    { semesterId: "Semester 2", examType: "ATKT", studentCount: 8 },
    { semesterId: "Semester 3", examType: "Regular", studentCount: 33 },
    { semesterId: "Semester 3", examType: "Reval", studentCount: 6 },
    { semesterId: "Semester 3", examType: "ATKT", studentCount: 9 },
    { semesterId: "Semester 4", examType: "Regular", studentCount: 30 },
    { semesterId: "Semester 4", examType: "Reval", studentCount: 5 },
    { semesterId: "Semester 4", examType: "ATKT", studentCount: 10 },
    { semesterId: "Semester 5", examType: "Regular", studentCount: 26 },
    { semesterId: "Semester 5", examType: "Reval", studentCount: 4 },
    { semesterId: "Semester 5", examType: "ATKT", studentCount: 10 },
    { semesterId: "Semester 6", examType: "Regular", studentCount: 23 },
    { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
    { semesterId: "Semester 6", examType: "ATKT", studentCount: 12 },
  ],
  MBA501: [
    { semesterId: "Semester 1", examType: "Regular", studentCount: 35 },
    { semesterId: "Semester 1", examType: "Reval", studentCount: 8 },
    { semesterId: "Semester 1", examType: "ATKT", studentCount: 7 },
    { semesterId: "Semester 2", examType: "Regular", studentCount: 33 },
    { semesterId: "Semester 2", examType: "Reval", studentCount: 7 },
    { semesterId: "Semester 2", examType: "ATKT", studentCount: 8 },
    { semesterId: "Semester 3", examType: "Regular", studentCount: 30 },
    { semesterId: "Semester 3", examType: "Reval", studentCount: 6 },
    { semesterId: "Semester 3", examType: "ATKT", studentCount: 9 },
    { semesterId: "Semester 4", examType: "Regular", studentCount: 28 },
    { semesterId: "Semester 4", examType: "Reval", studentCount: 5 },
    { semesterId: "Semester 4", examType: "ATKT", studentCount: 9 },
    { semesterId: "Semester 5", examType: "Regular", studentCount: 24 },
    { semesterId: "Semester 5", examType: "Reval", studentCount: 4 },
    { semesterId: "Semester 5", examType: "ATKT", studentCount: 10 },
    { semesterId: "Semester 6", examType: "Regular", studentCount: 22 },
    { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
    { semesterId: "Semester 6", examType: "ATKT", studentCount: 10 },
  ],
  BBA601: [
    { semesterId: "Semester 1", examType: "Regular", studentCount: 30 },
    { semesterId: "Semester 1", examType: "Reval", studentCount: 6 },
    { semesterId: "Semester 1", examType: "ATKT", studentCount: 6 },
    { semesterId: "Semester 2", examType: "Regular", studentCount: 28 },
    { semesterId: "Semester 2", examType: "Reval", studentCount: 6 },
    { semesterId: "Semester 2", examType: "ATKT", studentCount: 6 },
    { semesterId: "Semester 3", examType: "Regular", studentCount: 25 },
    { semesterId: "Semester 3", examType: "Reval", studentCount: 5 },
    { semesterId: "Semester 3", examType: "ATKT", studentCount: 8 },
    { semesterId: "Semester 4", examType: "Regular", studentCount: 22 },
    { semesterId: "Semester 4", examType: "Reval", studentCount: 4 },
    { semesterId: "Semester 4", examType: "ATKT", studentCount: 9 },
    { semesterId: "Semester 5", examType: "Regular", studentCount: 20 },
    { semesterId: "Semester 5", examType: "Reval", studentCount: 3 },
    { semesterId: "Semester 5", examType: "ATKT", studentCount: 9 },
    { semesterId: "Semester 6", examType: "Regular", studentCount: 18 },
    { semesterId: "Semester 6", examType: "Reval", studentCount: 3 },
    { semesterId: "Semester 6", examType: "ATKT", studentCount: 9 },
  ],
};

// Exam Lifecycle Data
const LIFECYCLE_DATA = [
  { stage: "Exam Created", students: 450 },
  { stage: "Students Assigned", students: 435 },
  { stage: "Seat No. Assigned", students: 425 },
  { stage: "Hall Ticket Released", students: 410 },
  { stage: "Marks Entry Done", students: 385 },
  { stage: "Gazette Generated", students: 355 },
  { stage: "Result Declared", students: 325 },
];

// Stats Cards
const STATS_CARDS = [
  {
    title: "Total Students",
    value: "1,580",
    // change: "+12%",
    // trend: "up",
    icon: Users,
    color: "blue",
  },
  {
    title: "Passing Rate",
    value: "82.4%",
    // change: "+5.2%",
    // trend: "up",
    icon: Award,
    color: "green",
  },
  {
    title: "Exams Conducted",
    value: "48",
    // change: "+8",
    // trend: "up",
    icon: Calendar,
    color: "purple",
  },
  {
    title: "ATKT Students",
    value: "124",
    // change: "-3%",
    // trend: "down",
    icon: AlertCircle,
    color: "orange",
  },
];

// Pie Chart Colors
const PIE_COLORS = ["#435CFF", "#00AFC0", "#FF6B6B", "#FFD93D", "#6C5CE7"];

// ============================================================
// COMPONENT
// ============================================================

const DummyDashboard: React.FC = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("CSE101");
  const [activeSemester, setActiveSemester] = useState<string>("Semester 1");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: string;
    message: string;
  } | null>(null);

  // Get current course data
  const currentCourse = MOCK_COURSES.find(
    (c) => c.courseId === selectedCourseId,
  );
  const semesters = MOCK_SEMESTERS[selectedCourseId] || [];
  const passFailData = MOCK_PASS_FAIL[selectedCourseId] || [];
  const examTypeData = MOCK_EXAM_TYPES[selectedCourseId] || [];

  // Get data for selected semester
  const selectedSemesterData = examTypeData.filter(
    (d) => d.semesterId === activeSemester,
  );

  // Pie chart data for selected semester
  const pieData = selectedSemesterData.map((d) => ({
    name: d.examType,
    value: d.studentCount,
  }));

  // Pivot exam type data for bar chart
  const pivotedExamTypeData = React.useMemo(() => {
    const map = new Map<
      string,
      { semesterId: string; Regular: number; Reval: number; ATKT: number }
    >();
    examTypeData.forEach((row) => {
      if (!map.has(row.semesterId)) {
        map.set(row.semesterId, {
          semesterId: row.semesterId,
          Regular: 0,
          Reval: 0,
          ATKT: 0,
        });
      }
      const entry = map.get(row.semesterId)!;
      if (row.examType === "Regular") entry.Regular = row.studentCount;
      else if (row.examType === "Reval") entry.Reval = row.studentCount;
      else if (row.examType === "ATKT") entry.ATKT = row.studentCount;
    });
    return Array.from(map.values());
  }, [examTypeData]);

  // Notification helper
  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle course selection
  const handleCourseSelect = (courseId: string) => {
    setIsLoading(true);
    setSelectedCourseId(courseId);
    const semesters = MOCK_SEMESTERS[courseId] || [];
    if (semesters.length > 0) {
      setActiveSemester(semesters[0].semesterId);
    }
    setTimeout(() => {
      setIsLoading(false);
      const course = MOCK_COURSES.find((c) => c.courseId === courseId);
    }, 300);
  };

  // Handle semester selection
  const handleSemesterSelect = (semesterId: string) => {
    setActiveSemester(semesterId);
    showNotification("info", `Selected ${semesterId}`);
  };

  // Filter courses
  const filteredCourses = MOCK_COURSES.filter(
    (course) =>
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalStudents = pieData.reduce((total, item) => total + item.value, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === "info"
              ? "bg-blue-500"
              : notification.type === "success"
                ? "bg-green-500"
                : notification.type === "error"
                  ? "bg-red-500"
                  : "bg-yellow-500"
          } text-white max-w-md`}
        >
          {notification.message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS_CARDS.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  {/* <p
                    className={`text-xs flex items-center gap-1 mt-1 ${isUp ? "text-green-600" : "text-red-600"}`}
                  >
                    {isUp ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {stat.change}
                  </p> */}
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-500"
                      : stat.color === "green"
                        ? "bg-green-50 text-green-500"
                        : stat.color === "purple"
                          ? "bg-purple-50 text-purple-500"
                          : "bg-orange-50 text-orange-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Cards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Courses</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 md:w-64"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredCourses.map((course) => (
            <div
              key={course.courseId}
              onClick={() => handleCourseSelect(course.courseId)}
              className={`cursor-pointer transition-all ${
                selectedCourseId === course.courseId
                  ? "ring-2 ring-blue-500 rounded-xl shadow-md scale-[1.02]"
                  : "hover:scale-[1.02]"
              }`}
            >
              <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <span className="text-lg font-bold text-blue-600">
                    {course.studentCount}
                  </span>
                </div>
                <div className="text-center min-w-0 w-full">
                  <h3 className="text-xs font-semibold uppercase leading-tight text-[#17213F] truncate">
                    {course.courseName}
                  </h3>
                  <p className="text-xs text-gray-500">{course.courseId}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout - Semester Wizard on left, Charts on right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Semester Wizard - Fixed on left */}
        <div className="lg:w-[300px] xl:w-[340px] flex-shrink-0">
          <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm sticky top-4">
            <div className="border-b-2 border-blue-500 px-6 py-4">
              <h2 className="text-xl font-medium text-gray-900">
                Semester Details
              </h2>
              <p className="text-sm text-gray-500">
                {currentCourse?.courseName} - {currentCourse?.courseId}
              </p>
            </div>
            <div className="px-6 py-5 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : semesters.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No semester data available
                </p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[23px] top-5 bottom-5 w-px bg-gray-300" />
                  {semesters.map((semester) => {
                    const isActive = activeSemester === semester.semesterId;
                    return (
                      <div
                        key={semester.semesterId}
                        className="relative flex min-h-[79px] cursor-pointer items-center"
                        onClick={() =>
                          handleSemesterSelect(semester.semesterId)
                        }
                      >
                        <div
                          className={`absolute inset-y-0 left-0 right-0 rounded-lg transition-colors ${
                            isActive
                              ? "bg-[#E5F7F9]"
                              : "bg-transparent hover:bg-gray-50"
                          }`}
                        />
                        <div
                          className={`relative z-10 ml-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] bg-white transition-colors ${
                            isActive
                              ? "border-[#00AFC0] text-[#00AFC0]"
                              : "border-blue-500 text-blue-500"
                          }`}
                        >
                          <BookOpenCheck className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="relative z-10 ml-4 py-3">
                          <p
                            className={`text-base font-medium ${isActive ? "text-gray-900" : "text-[#17213F]"}`}
                          >
                            {semester.semesterId}
                          </p>
                          <p
                            className={`mt-1 text-sm ${isActive ? "text-[#00AFC0]" : "text-gray-700"}`}
                          >
                            Students: {semester.studentCount}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Charts Grid */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pass/Fail Chart */}
            <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Pass / Fail
                  </h2>
                  <p className="text-xs text-gray-500">{activeSemester}</p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : passFailData.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center pt-16">
                    No data available
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={passFailData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      barGap={3}
                    >
                      <CartesianGrid vertical={false} stroke="#EEF1F5" />
                      <XAxis
                        dataKey="semesterId"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "#263238" }}
                        dy={5}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "#263238" }}
                        width={30}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(67, 92, 255, 0.04)" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                      />
                      <Bar
                        dataKey="passCount"
                        name="Pass"
                        fill="#00AFC0"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={20}
                      />
                      <Bar
                        dataKey="failCount"
                        name="Fail"
                        fill="#FF6B6B"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie Chart - Semester Exam Type Distribution */}
            <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Exam Type Distribution
                  </h2>
                  <p className="text-xs text-gray-500">{activeSemester}</p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : pieData.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center pt-16">
                    No data available
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {/* <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        // label={({ name, percent }) =>
                        //   `${name} ${(percent * 100).toFixed(0)}%`
                        // }
                        label={({ name, value }) => `${name} ${value}`}
                        labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart> */}
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}`}
                        labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>

                      {/* Total in center */}
                      <text
                        x="50%"
                        y="48%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-gray-900 text-xl font-bold"
                      >
                        {totalStudents}
                      </text>

                      <text
                        x="50%"
                        y="60%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-gray-500 text-[10px]"
                      >
                        Students
                      </text>

                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Legend for Pie Chart */}
              <div className="flex justify-center gap-4 mt-1">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Semester-wise Exam Type Bar Chart - Full Width */}
            {/* <div className="md:col-span-2 w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {/* <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Exam Type Distribution (All Semesters)
                  </h2>
                  <p className="text-xs text-gray-500">
                    {currentCourse?.courseName}
                  </p>
                </div>
              </div> 
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : pivotedExamTypeData.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center pt-16">
                    No data available
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pivotedExamTypeData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      barGap={3}
                    >
                      <CartesianGrid vertical={false} stroke="#EEF1F5" />
                      <XAxis
                        dataKey="semesterId"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "#263238" }}
                        dy={5}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "#263238" }}
                        width={30}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(67, 92, 255, 0.04)" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: "11px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar
                        dataKey="Regular"
                        fill="#BFD4FF"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={16}
                      />
                      <Bar
                        dataKey="Reval"
                        fill="#435CFF"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={16}
                      />
                      <Bar
                        dataKey="ATKT"
                        fill="#00AFC0"
                        radius={[3, 3, 0, 0]}
                        maxBarSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div> */}
          </div>

          {/* Exam Lifecycle Chart - Full Width below all charts */}
          <div className="mt-6 w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Exam Lifecycle Progress
                </h2>
                <p className="text-xs text-gray-500">
                  Students moving through each exam stage
                </p>
              </div>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={LIFECYCLE_DATA}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} stroke="#EEF1F5" />
                  <XAxis
                    dataKey="stage"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#263238" }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                    dy={5}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#263238" }}
                    width={35}
                    domain={[0, 500]}
                  />
                  <Tooltip
                    cursor={{ stroke: "#435CFF", strokeDasharray: "4 4" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "11px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Students"
                    stroke="#435CFF"
                    strokeWidth={2.5}
                    fill="url(#colorGradient)"
                  />
                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#435CFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#435CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-200 pt-4">
        <p>
          © {new Date().getFullYear()} Exam Dashboard • All data shown is for
          demonstration purposes only
        </p>
      </div>
    </div>
  );
};

export default DummyDashboard;
