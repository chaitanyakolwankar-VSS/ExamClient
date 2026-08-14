import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import DeliveryStatistics from "../../../components/charts/DeliveryStatistics";
import ConversionFunnel from "../../../components/charts/ConversionFunnel";
import PassFailChart from "../../../components/charts/PassFailChart";
import SemesterWizard from "../../../components/charts/SemesterWizard";
import CourseCard from "../../../components/charts/CourseCard";
import Alert from "../../../components/ui/alert/Alert";
import {
  DashboardService,
  CourseStudentCountApiResponse,
} from "../../../services/Dashboard";
import SemesterExamTypeChart from "../../../components/charts/SemesterExamTypeChart";

export default function ExamDashboard() {
  const [courses, setCourses] = useState<CourseStudentCountApiResponse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeSemester, setActiveSemester] = useState<string | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
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

  const fetchCourses = async () => {
    const ayid = localStorage.getItem("AYID");
    if (!ayid) {
      showAlert(
        "error",
        "Error",
        "Academic Year not found. Please login again.",
      );
      return;
    }

    try {
      setLoadingCourses(true);
      const data = await DashboardService.GetCourseStudentCount({ Ayid: ayid });
      setCourses(data);

      if (data.length > 0) {
        setSelectedCourseId(data[0].courseId);
      }
    } catch (error) {
      console.error("Error fetching course student count:", error);
      showAlert("error", "Error", "Failed to load course data.");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveSemester(null); // naya course select hone pe purana semester reset
  };

  return (
    <>
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

      <div className="w-full min-w-0 mb-6">
        {loadingCourses ? (
          <p className="text-sm text-gray-500">Loading courses...</p>
        ) : courses.length === 0 ? (
          <Alert
            variant="warning"
            title="No Courses"
            message="No course data found for this academic year."
          />
        ) : (
          <div className="flex w-full gap-4 overflow-x-auto overflow-y-hidden pb-3 snap-x snap-mandatory scrollbar-thin p-2">
            {courses.map((course) => (
              <div
                key={course.courseId}
                onClick={() => handleCourseSelect(course.courseId)}
                className={`
                  min-w-0 shrink-0 snap-start cursor-pointer
                  w-full sm:w-[calc(50%-8px)]
                  md:w-[calc(33.333%-11px)]
                  lg:w-[calc(25%-12px)]
                  xl:w-[calc(20%-13px)]
                  ${selectedCourseId === course.courseId ? "ring-2 ring-brand-500 rounded-xl" : ""}
                `}
              >
                <CourseCard
                  studentCount={course.studentCount}
                  courseName={course.courseName}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SemesterWizard
          courseId={selectedCourseId}
          activeSemester={activeSemester}
          onSemesterChange={setActiveSemester}
        />
        <PassFailChart
          courseId={selectedCourseId}
          activeSemester={activeSemester}
        />
        {/* <DeliveryStatistics /> */}
        <SemesterExamTypeChart courseId={selectedCourseId} />
        <ConversionFunnel />
      </div>
    </>
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
