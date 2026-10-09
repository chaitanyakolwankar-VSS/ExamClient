// import { useEffect, useState } from "react";
// import PageMeta from "../../../components/common/PageMeta";
// import DeliveryStatistics from "../../../components/charts/DeliveryStatistics";
// import ConversionFunnel from "../../../components/charts/ConversionFunnel";
// import PassFailChart from "../../../components/charts/PassFailChart";
// import SemesterWizard from "../../../components/charts/SemesterWizard";
// import CourseCard from "../../../components/charts/CourseCard";
// import Alert from "../../../components/ui/alert/Alert";
// import {
//   DashboardService,
//   CourseStudentCountApiResponse,
// } from "../../../services/Dashboard";
// import SemesterExamTypeChart from "../../../components/charts/SemesterExamTypeChart";
// import { useAcademicYear } from "../../../context/AcademicYearContext";
// import ExamLifecycleChart from "../../../components/charts/ExamLifecycleChart";

// export default function ExamDashboard() {
//   const [courses, setCourses] = useState<CourseStudentCountApiResponse[]>([]);
//   const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
//   const [activeSemester, setActiveSemester] = useState<string | null>(null);
//   const [loadingCourses, setLoadingCourses] = useState(false);
//   const [alertData, setAlertData] = useState<{
//     variant: "success" | "error" | "warning" | "info";
//     title: string;
//     message: string;
//   } | null>(null);
//   const { currentYearId: ayid } = useAcademicYear();

//   const showAlert = (
//     variant: "success" | "error" | "warning" | "info",
//     title: string,
//     message: string,
//     timeout = 3000,
//   ) => {
//     setAlertData({ variant, title, message });
//     setTimeout(() => setAlertData(null), timeout);
//   };

//   const fetchCourses = async (yearId: string) => {
//     try {
//       setLoadingCourses(true);
//       const data = await DashboardService.GetCourseStudentCount({
//         Ayid: yearId,
//       });
//       setCourses(data);
//       setSelectedCourseId(null);
//       setActiveSemester(null);

//       if (data.length > 0) {
//         setSelectedCourseId(data[0].courseId);
//       }
//     } catch (error) {
//       console.error("Error fetching course student count:", error);
//       showAlert("error", "Error", "Failed to load course data.");
//     } finally {
//       setLoadingCourses(false);
//     }
//   };

//   useEffect(() => {
//     if (!ayid) return;

//     fetchCourses(ayid);
//   }, [ayid]);

//   const handleCourseSelect = (courseId: string) => {
//     setSelectedCourseId(courseId);
//     setActiveSemester(null); // naya course select hone pe purana semester reset
//   };

//   return (
//     <>
//       <PageMeta
//         title="Staff Dashboard"
//         description="Welcome to the Staff Portal"
//       />

//       {alertData && (
//         <Alert
//           variant={alertData.variant}
//           title={alertData.title}
//           message={alertData.message}
//         />
//       )}

//       <div className="w-full min-w-0 mb-6">
//         {!ayid ? (
//           <p className="text-sm text-gray-500">Loading academic year...</p>
//         ) : loadingCourses ? (
//           <p className="text-sm text-gray-500">Loading courses...</p>
//         ) : courses.length === 0 ? (
//           <Alert
//             variant="warning"
//             title="No Courses"
//             message="No course data found for this academic year."
//           />
//         ) : (
//           <div className="flex w-full gap-4 overflow-x-auto overflow-y-hidden pb-3 snap-x snap-mandatory scrollbar-thin p-2">
//             {courses.map((course) => (
//               <div
//                 key={course.courseId}
//                 onClick={() => handleCourseSelect(course.courseId)}
//                 className={`
//                   min-w-0 shrink-0 snap-start cursor-pointer
//                   w-full sm:w-[calc(50%-8px)]
//                   md:w-[calc(33.333%-11px)]
//                   lg:w-[calc(25%-12px)]
//                   xl:w-[calc(20%-13px)]
//                   ${selectedCourseId === course.courseId ? "ring-2 ring-brand-500 rounded-xl" : ""}
//                 `}
//               >
//                 <CourseCard
//                   studentCount={course.studentCount}
//                   courseName={course.courseName}
//                 />
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
//         <SemesterWizard
//           ayid={ayid}
//           courseId={selectedCourseId}
//           activeSemester={activeSemester}
//           onSemesterChange={setActiveSemester}
//         />
//         <PassFailChart
//           ayid={ayid}
//           courseId={selectedCourseId}
//           activeSemester={activeSemester}
//         />
//         {/* <DeliveryStatistics /> */}
//         <SemesterExamTypeChart ayid={ayid} courseId={selectedCourseId} />
//         {/* <ConversionFunnel /> */}
//         <ExamLifecycleChart />
//       </div>
//     </>
//   );
// }
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BookOpenCheck,
  Users,
  Award,
  Calendar,
  AlertCircle,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
} from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import Alert from "../../../components/ui/alert/Alert";
import { useAcademicYear } from "../../../data";
import {
  useDashboardCourses,
  useDashboardStats,
  useDashboardLifecycle,
  useDashboardCourse,
} from "../../../data/useDashboard";
import {
  CourseStudentCountApiResponse,
  SemesterStudentCountApiResponse,
  PassFailChartApiResponse,
  ExamTypeDistribution,
  ExamLifecycle,
} from "../../../services/Dashboard";

const PIE_COLORS = ["#435CFF", "#00AFC0", "#FF6B6B", "#FFD93D", "#6C5CE7"];

// Stable empty lists, so effects that depend on them do not re-run on every render.
const NO_COURSES: CourseStudentCountApiResponse[] = [];
const NO_SEMESTERS: SemesterStudentCountApiResponse[] = [];
const NO_PASS_FAIL: PassFailChartApiResponse[] = [];
const NO_EXAM_TYPES: ExamTypeDistribution[] = [];
const NO_LIFECYCLES: ExamLifecycle[] = [];

// Build the 6 pipeline stages from a single exam lifecycle record.
// count is a student count; null marks a yes/no stage (shown as Done / Pending).
const buildStages = (record: ExamLifecycle): { stage: string; count: number | null; completed: boolean }[] => [
  {
    stage: "Students Assigned",
    count: record.assignedStudent,
    completed: record.assignedStudent > 0,
  },
  {
    stage: "Seat No. Assigned",
    count: record.seatNo,
    completed: record.seatNo > 0,
  },
  {
    stage: "Hall Ticket Released",
    count: null,
    completed: record.releaseHallTicket,
  },
  {
    stage: "Marks Entered",
    count: record.marksEntered,
    completed: record.marksEntered > 0,
  },
  {
    stage: "Gazette Generated",
    count: null,
    completed: record.gazetteGnrt > 0,
  },
  {
    stage: "Result Declared",
    count: null,
    completed: record.isDeclare,
  },
];

const getLifecycleProgress = (record: ExamLifecycle) => {
  const stages = buildStages(record);
  return Math.round(
    (stages.filter((s) => s.completed).length / stages.length) * 100,
  );
};

export default function ExamDashboard() {
  // The API takes the college from the login token; it is never sent from here.
  const { ayid: selectedAyid } = useAcademicYear();
  const ayid = selectedAyid ?? "";

  // ---- state ----
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeSemester, setActiveSemester] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);
  const [alertData, setAlertData] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    timeout = 3000,
  ) => {
    setAlertData({ variant, title, message });
    setTimeout(() => setAlertData(null), timeout);
  };

  // ---- data (cached: the last numbers show at once and are refreshed in the background) ----
  const coursesQuery = useDashboardCourses(ayid);
  const statsQuery = useDashboardStats(ayid);
  const lifecycleQuery = useDashboardLifecycle(ayid);
  const courseQuery = useDashboardCourse(ayid, selectedCourseId);

  const courses: CourseStudentCountApiResponse[] = coursesQuery.data ?? NO_COURSES;
  const totalStudents = statsQuery.data?.totalStudents ?? 0;
  const passPercentage = statsQuery.data?.passPercentage ?? 0;
  const totalExamsConducted = statsQuery.data?.totalExamsConducted ?? 0;
  const atktStudentCount = statsQuery.data?.atktStudentCount ?? 0;
  const semesters: SemesterStudentCountApiResponse[] = courseQuery.data?.semesters ?? NO_SEMESTERS;
  const passFailData: PassFailChartApiResponse[] = courseQuery.data?.passFail ?? NO_PASS_FAIL;
  const examTypeData: ExamTypeDistribution[] = courseQuery.data?.examTypes ?? NO_EXAM_TYPES;
  const examLifecycles: ExamLifecycle[] = lifecycleQuery.data ?? NO_LIFECYCLES;

  // Spinners only when there is nothing to show yet; a background refresh keeps the old numbers visible.
  const loadingStats = statsQuery.isPending && !!ayid;
  const loadingCourses = coursesQuery.isPending && !!ayid;
  const isLoading = !!selectedCourseId && courseQuery.isPending;
  const loadingLifecycle = lifecycleQuery.isPending && !!ayid;
  const isRefreshing =
    coursesQuery.isFetching || statsQuery.isFetching || lifecycleQuery.isFetching || courseQuery.isFetching;

  // ---- effects ----
  // First course by default, and again when the year changes and the selected course is not in its list.
  useEffect(() => {
    if (courses.length === 0) return;
    if (!selectedCourseId || !courses.some((c) => c.courseId === selectedCourseId)) {
      setSelectedCourseId(courses[0].courseId);
    }
  }, [courses, selectedCourseId]);

  // First semester of the shown course when the current one is not in its list.
  useEffect(() => {
    if (courseQuery.isPlaceholderData) return;
    if (!activeSemester || !semesters.some((s) => s.semesterId === activeSemester)) {
      setActiveSemester(semesters.length > 0 ? semesters[0].semesterId : null);
    }
  }, [semesters, activeSemester, courseQuery.isPlaceholderData]);

  useEffect(() => {
    setSelectedExamIndex(0);
  }, [examLifecycles]);

  const failed = coursesQuery.isError || statsQuery.isError || lifecycleQuery.isError || courseQuery.isError;
  useEffect(() => {
    if (failed) showAlert("error", "Error", "Some dashboard data could not be loaded.");
  }, [failed]);

  // ---- derived ----
  const currentCourse = courses.find((c) => c.courseId === selectedCourseId);
  const filteredCourses = courses.filter(
    (course) =>
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedExam = examLifecycles[selectedExamIndex];
  const lifecycleData = selectedExam ? buildStages(selectedExam) : [];

  const selectedSemesterData = examTypeData.filter(
    (d) => d.semesterId === activeSemester,
  );

  const pieData = selectedSemesterData.map((d) => ({
    name: d.examType,
    value: d.passed,
    total: d.appeared,
    label: `${d.passed}/${d.appeared}`,
  }));


  const statsCards = [
    {
      title: "Total Students",
      value: totalStudents.toLocaleString(),
      icon: Users,
      color: "blue",
    },
    {
      title: "Passing Rate",
      value: `${passPercentage}%`,
      icon: Award,
      color: "green",
    },
    {
      title: "Exams Conducted",
      value: totalExamsConducted.toLocaleString(),
      icon: Calendar,
      color: "purple",
    },
    {
      title: "ATKT Students",
      value: atktStudentCount.toLocaleString(),
      icon: AlertCircle,
      color: "orange",
    },
  ];

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveSemester(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <PageMeta
        title="Staff Dashboard"
        description="Welcome to the Staff Portal"
      />

      {alertData && (
        <Alert
          variant={alertData.variant}
          title={alertData.title}
          message={alertData.message}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => {
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
                    {loadingStats ? (
                      <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      stat.value
                    )}
                  </p>
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
          <h2 className="text-lg font-semibold text-gray-900">
            Courses
            {isRefreshing && !loadingCourses && (
              <span className="ml-2 text-xs font-normal text-gray-400">Updating…</span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <Download className="w-4 h-4" />
              Download Report
            </button>
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
        </div>

        {loadingCourses ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <Alert
            variant="warning"
            title="No Courses"
            message="No course data found for this academic year."
          />
        ) : (
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
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full ${
                      selectedCourseId === course.courseId
                        ? "bg-blue-500 text-white"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <span className="text-lg font-bold">
                      {course.studentCount}
                    </span>
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <h3 className="text-xs font-semibold uppercase leading-tight text-[#17213F] truncate">
                      {course.courseName}
                    </h3>
                    {/* <p className="text-xs text-gray-500">{course.courseId}</p> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Layout - Semester Wizard on left, Charts on right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Semester Wizard */}
        <div className="lg:w-[300px] xl:w-[340px] flex-shrink-0">
          <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm sticky top-4">
            <div className="border-b-2 border-blue-500 px-6 py-4">
              <h2 className="text-xl font-medium text-gray-900">
                Semester Details
              </h2>
              <p className="text-sm text-gray-500">
                {currentCourse?.courseName}
                {/* - {currentCourse?.courseId} */}
              </p>
            </div>
            <div className="px-6 py-5 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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
                        onClick={() => setActiveSemester(semester.semesterId)}
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
                  <p className="text-xs text-gray-500">
                    {activeSemester ?? "All Semesters"}
                  </p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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
                  <p className="text-xs text-gray-500">
                    {activeSemester ?? "All Semesters"}
                  </p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : pieData.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center pt-16">
                    No data available
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ index }) => {
                          const d = pieData[index as number];
                          return d ? `${d.name} ${d.label}` : "";
                        }}
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
                        formatter={(value, name, props) => {
                          const data = props.payload;
                          return [`${data.value}/${data.total}`, data.name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-1 flex-wrap">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-gray-600">
                      {item.name} {item.value}/{item.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exam Lifecycle Pipeline with selectable exam list */}
          <div className="mt-6 w-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Exam Lifecycle Pipeline
                </h2>
                <p className="text-xs text-gray-500">
                  Select an exam to track its progress
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00AFC0]" />
                  <span className="text-xs text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600">Pending</span>
                </div>
              </div>
            </div>

            {loadingLifecycle ? (
              <div className="flex items-center justify-center h-[220px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : examLifecycles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No active exam found
              </p>
            ) : (
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Exam list (selectable) */}
                <div className="lg:w-[280px] xl:w-[320px] flex-shrink-0">
                  <div className="rounded-xl border border-gray-200 max-h-[420px] overflow-y-auto">
                    {examLifecycles.map((exam, idx) => {
                      const isActive = selectedExamIndex === idx;
                      const progress = getLifecycleProgress(exam);
                      return (
                        <div
                          key={exam.examName + idx}
                          onClick={() => setSelectedExamIndex(idx)}
                          className={`cursor-pointer px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
                            isActive ? "bg-[#E5F7F9]" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm font-medium truncate ${isActive ? "text-gray-900" : "text-[#17213F]"}`}
                            >
                              {exam.examName}
                            </p>
                            <span
                              className={`shrink-0 text-[11px] font-semibold ${progress === 100 ? "text-[#00AFC0]" : "text-gray-400"}`}
                            >
                              {progress}%
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${progress === 100 ? "bg-[#00AFC0]" : "bg-gradient-to-r from-[#435CFF] to-[#00AFC0]"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pipeline detail */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-3">
                    {selectedExam?.examName}
                  </p>

                  {/* Overall progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-500">
                        Overall Completion
                      </span>
                      <span className="text-xs font-semibold text-[#00AFC0]">
                        {getLifecycleProgress(selectedExam)}
                        {selectedExam && "%"}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#435CFF] to-[#00AFC0] transition-all duration-500"
                        style={{
                          width: `${selectedExam ? getLifecycleProgress(selectedExam) : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stage pipeline */}
                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-[760px] items-start">
                      {lifecycleData.map((stage, idx) => {
                        const isLast = idx === lifecycleData.length - 1;
                        const nextCompleted =
                          !isLast && lifecycleData[idx + 1].completed;
                        return (
                          <div
                            key={stage.stage}
                            className="flex flex-1 items-start"
                          >
                            <div className="flex flex-col items-center text-center w-[110px] shrink-0">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] transition-colors ${
                                  stage.completed
                                    ? "border-[#00AFC0] bg-[#00AFC0] text-white shadow-[0_4px_10px_rgba(0,175,192,0.35)]"
                                    : "border-gray-300 bg-white text-gray-400"
                                }`}
                              >
                                {stage.completed ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <Clock className="h-5 w-5" />
                                )}
                              </div>
                              <p
                                className={`mt-2 text-xs font-semibold leading-tight ${stage.completed ? "text-gray-900" : "text-gray-500"}`}
                              >
                                {stage.stage}
                              </p>
                              <span
                                className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  stage.completed
                                    ? "bg-[#E5F7F9] text-[#00AFC0]"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {stage.count === null
                                  ? stage.completed ? "Done" : "Pending"
                                  : `${stage.count} students`}
                              </span>
                            </div>

                            {!isLast && (
                              <div className="flex flex-1 items-center pt-5">
                                <div className="h-1 w-full rounded-full bg-gray-200 relative">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      stage.completed && nextCompleted
                                        ? "bg-gradient-to-r from-[#00AFC0] to-[#00AFC0]"
                                        : stage.completed
                                          ? "bg-gradient-to-r from-[#00AFC0] to-gray-200"
                                          : "bg-gray-200"
                                    }`}
                                    style={{
                                      width:
                                        stage.completed && nextCompleted
                                          ? "100%"
                                          : stage.completed
                                            ? "50%"
                                            : "0%",
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-400 border-t border-gray-200 pt-4">
        <p>
          © {new Date().getFullYear()} Exam Dashboard • Powered by live API data
        </p>
      </div>
    </div>
  );
}
// import { useEffect, useState } from "react";
// import PageMeta from "../../../components/common/PageMeta";
// import DeliveryStatistics from "../../../components/charts/DeliveryStatistics";
// import ConversionFunnel from "../../../components/charts/ConversionFunnel";
// import SessionsByDevice from "../../../components/charts/SessionsByDevice";
// import SemesterWizard from "../../../components/charts/SemesterWizard";
// import CourseCard from "../../../components/charts/CourseCard";
// import Alert from "../../../components/ui/alert/Alert";
// import {
//   DashboardService,
//   CourseStudentCountApiResponse,
// } from "../../../services/Dashboard";

// export default function ExamDashboard() {
//   const [courses, setCourses] = useState<CourseStudentCountApiResponse[]>([]);
//   const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
//   const [loadingCourses, setLoadingCourses] = useState(false);
//   const [alertData, setAlertData] = useState<{
//     variant: "success" | "error" | "warning" | "info";
//     title: string;
//     message: string;
//   } | null>(null);

//   const showAlert = (
//     variant: "success" | "error" | "warning" | "info",
//     title: string,
//     message: string,
//     timeout = 3000,
//   ) => {
//     setAlertData({ variant, title, message });
//     setTimeout(() => setAlertData(null), timeout);
//   };

//   // const fetchCourses = async () => {
//   //   const ayid = localStorage.getItem("AYID");
//   //   if (!ayid) {
//   //     showAlert(
//   //       "error",
//   //       "Error",
//   //       "Academic Year not found. Please login again.",
//   //     );
//   //     return;
//   //   }

//   //   try {
//   //     setLoadingCourses(true);
//   //     const data = await DashboardService.GetCourseStudentCount({
//   //       Ayid: ayid,
//   //     });
//   //     setCourses(data);
//   //   } catch (error) {
//   //     console.error("Error fetching course student count:", error);
//   //     showAlert("error", "Error", "Failed to load course data.");
//   //   } finally {
//   //     setLoadingCourses(false);
//   //   }
//   // };

//   const fetchCourses = async () => {
//     const ayid = localStorage.getItem("AYID");
//     if (!ayid) {
//       showAlert(
//         "error",
//         "Error",
//         "Academic Year not found. Please login again.",
//       );
//       return;
//     }

//     try {
//       setLoadingCourses(true);
//       const data = await DashboardService.GetCourseStudentCount({
//         Ayid: ayid,
//       });
//       setCourses(data);

//       // Auto-select first course, agar data mila to
//       if (data.length > 0) {
//         setSelectedCourseId(data[0].courseId);
//       }
//     } catch (error) {
//       console.error("Error fetching course student count:", error);
//       showAlert("error", "Error", "Failed to load course data.");
//     } finally {
//       setLoadingCourses(false);
//     }
//   };

//   useEffect(() => {
//     fetchCourses();
//   }, []);

//   return (
//     <>
//       <PageMeta
//         title="Staff Dashboard"
//         description="Welcome to the Staff Portal"
//       />

//       {alertData && (
//         <Alert
//           variant={alertData.variant}
//           title={alertData.title}
//           message={alertData.message}
//         />
//       )}

//       <div className="w-full min-w-0 mb-6">
//         {loadingCourses ? (
//           <p className="text-sm text-gray-500">Loading courses...</p>
//         ) : courses.length === 0 ? (
//           <Alert
//             variant="warning"
//             title="No Courses"
//             message="No course data found for this academic year."
//           />
//         ) : (
//           <div
//             className="
//               flex w-full gap-4
//               overflow-x-auto overflow-y-hidden
//               pb-3 snap-x snap-mandatory
//               scrollbar-thin p-2
//             "
//           >
//             {courses.map((course) => (
//               <div
//                 key={course.courseId}
//                 onClick={() => setSelectedCourseId(course.courseId)}
//                 className={`
//                   min-w-0 shrink-0 snap-start cursor-pointer
//                   w-full sm:w-[calc(50%-8px)]
//                   md:w-[calc(33.333%-11px)]
//                   lg:w-[calc(25%-12px)]
//                   xl:w-[calc(20%-13px)]
//                   ${selectedCourseId === course.courseId ? "ring-2 ring-brand-500 rounded-xl" : ""}
//                 `}
//               >
//                 <CourseCard
//                   studentCount={course.studentCount}
//                   courseName={course.courseName}
//                 />
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
//         <SemesterWizard courseId={selectedCourseId} />
//         <SessionsByDevice />
//         <DeliveryStatistics />
//         <ConversionFunnel />
//       </div>
//     </>
//   );
// }
