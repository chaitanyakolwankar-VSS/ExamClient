import React, { useEffect, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import {
  DashboardService,
  SemesterStudentCountApiResponse,
} from "../../services/Dashboard";
import Alert from "../ui/alert/Alert";

interface SemesterWizardProps {
  ayid?: string | null;
  courseId: string | null;
  activeSemester: string | null;
  onSemesterChange: (semesterId: string) => void;
}

const SemesterWizard: React.FC<SemesterWizardProps> = ({
  ayid,
  courseId,
  activeSemester,
  onSemesterChange,
}) => {
  const [semesterData, setSemesterData] = useState<
    SemesterStudentCountApiResponse[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSemesterData = async () => {
    if (!courseId || !ayid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await DashboardService.GetSemesterWiseStudentCount({
        CourseId: courseId,
        Ayid: ayid,
      });
      setSemesterData(data);

      // Auto-select first semester
      if (data.length > 0) {
        onSemesterChange(data[0].semesterId);
      }
    } catch (err) {
      console.error("Error fetching semester-wise student count:", err);
      setError("Failed to load semester data.");
      setSemesterData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchSemesterData();
    } else {
      setSemesterData([]);
    }
  }, [courseId, ayid]);

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white">
      <div className="border-b-2 border-[#435CFF] px-6 py-4">
        <h2 className="text-xl font-medium text-gray-900">Semester Details</h2>
      </div>

      <div className="px-6 py-5">
        {!courseId ? (
          <p className="text-sm text-gray-500">
            Select a course above to view semester-wise details.
          </p>
        ) : loading ? (
          <p className="text-sm text-gray-500">Loading semester data...</p>
        ) : error ? (
          <Alert variant="error" title="Error" message={error} />
        ) : semesterData.length === 0 ? (
          <Alert
            variant="warning"
            title="No Data"
            message="No semester data found for this course."
          />
        ) : (
          <div className="relative">
            <div className="absolute left-[23px] top-5 bottom-5 w-px bg-gray-300" />

            {semesterData.map((semester) => {
              const isActive = activeSemester === semester.semesterId;

              return (
                <div
                  key={semester.semesterId}
                  className="relative flex min-h-[79px] cursor-pointer items-center"
                  onClick={() => onSemesterChange(semester.semesterId)}
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
                        : "border-[#435CFF] text-[#435CFF]"
                    }`}
                  >
                    <BookOpenCheck className="h-5 w-5" strokeWidth={2} />
                  </div>

                  <div className="relative z-10 ml-4 py-3">
                    <p
                      className={`text-base font-medium ${
                        isActive ? "text-gray-900" : "text-[#17213F]"
                      }`}
                    >
                      Semester: {semester.semesterId}
                    </p>

                    <p
                      className={`mt-1 text-base ${
                        isActive ? "text-[#00AFC0]" : "text-gray-700"
                      }`}
                    >
                      Total number of students: {semester.studentCount}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SemesterWizard;

// import React, { useEffect, useState } from "react";
// import { BookOpenCheck } from "lucide-react";
// import {
//   DashboardService,
//   SemesterStudentCountApiResponse,
// } from "../../services/Dashboard";
// import Alert from "../ui/alert/Alert";

// interface SemesterWizardProps {
//   courseId: string | null;
// }

// const SemesterWizard: React.FC<SemesterWizardProps> = ({ courseId }) => {
//   const [semesterData, setSemesterData] = useState<
//     SemesterStudentCountApiResponse[]
//   >([]);
//   const [activeSemester, setActiveSemester] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchSemesterData = async () => {
//     const ayid = localStorage.getItem("AYID");
//     if (!courseId || !ayid) return;

//     try {
//       setLoading(true);
//       setError(null);
//       const data = await DashboardService.GetSemesterWiseStudentCount({
//         CourseId: courseId,
//         Ayid: ayid,
//       });
//       setSemesterData(data);
//       // default select first semester (jaisa pehle activeSemester=6 tha)
//       if (data.length > 0) {
//         setActiveSemester(data[0].semesterId);
//       }
//     } catch (err) {
//       console.error("Error fetching semester-wise student count:", err);
//       setError("Failed to load semester data.");
//       setSemesterData([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (courseId) {
//       fetchSemesterData();
//     } else {
//       setSemesterData([]);
//       setActiveSemester(null);
//     }
//   }, [courseId]);

//   return (
//     <div className="w-full rounded-xl border border-gray-200 bg-white">
//       {/* Header */}
//       <div className="border-b-2 border-[#435CFF] px-6 py-4">
//         <h2 className="text-xl font-medium text-gray-900">Semester Details</h2>
//       </div>

//       {/* Body */}
//       <div className="px-6 py-5">
//         {!courseId ? (
//           <p className="text-sm text-gray-500">
//             Select a course above to view semester-wise details.
//           </p>
//         ) : loading ? (
//           <p className="text-sm text-gray-500">Loading semester data...</p>
//         ) : error ? (
//           <Alert variant="error" title="Error" message={error} />
//         ) : semesterData.length === 0 ? (
//           <Alert
//             variant="warning"
//             title="No Data"
//             message="No semester data found for this course."
//           />
//         ) : (
//           <div className="relative">
//             {/* Vertical Line */}
//             <div className="absolute left-[23px] top-5 bottom-5 w-px bg-gray-300" />

//             {semesterData.map((semester) => {
//               const isActive = activeSemester === semester.semesterId;

//               return (
//                 <div
//                   key={semester.semesterId}
//                   className="relative flex min-h-[79px] cursor-pointer items-center"
//                   onClick={() => setActiveSemester(semester.semesterId)}
//                 >
//                   {/* Active background */}
//                   <div
//                     className={`absolute inset-y-0 left-0 right-0 rounded-lg transition-colors ${
//                       isActive
//                         ? "bg-[#E5F7F9]"
//                         : "bg-transparent hover:bg-gray-50"
//                     }`}
//                   />

//                   {/* Icon */}
//                   <div
//                     className={`relative z-10 ml-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] bg-white transition-colors ${
//                       isActive
//                         ? "border-[#00AFC0] text-[#00AFC0]"
//                         : "border-[#435CFF] text-[#435CFF]"
//                     }`}
//                   >
//                     <BookOpenCheck className="h-5 w-5" strokeWidth={2} />
//                   </div>

//                   {/* Content */}
//                   <div className="relative z-10 ml-4 py-3">
//                     <p
//                       className={`text-base font-medium ${
//                         isActive ? "text-gray-900" : "text-[#17213F]"
//                       }`}
//                     >
//                       Semester: {semester.semesterId}
//                     </p>

//                     <p
//                       className={`mt-1 text-base ${
//                         isActive ? "text-[#00AFC0]" : "text-gray-700"
//                       }`}
//                     >
//                       Total number of students: {semester.studentCount}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SemesterWizard;
