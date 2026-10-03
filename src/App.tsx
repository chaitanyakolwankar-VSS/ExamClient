import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import StaffLayout from "./layouts/Staff/Layout"; // Import the specific Staff Layout
import ExamDashboard from "./pages/Staff/Dashboard/Home"; // Import the moved dashboard
import SubjectMaster  from "./pages/Staff/Academic_Master/Subject_Master.tsx"; // Import the moved Subject Master
import ExamMaster from "./pages/Staff/Academic_Master/ExamMaster.tsx"; // Import the moved Exam Master
import RegularExam from "./pages/Staff/ConductExam/RegularExam.tsx";  // Import the moved Regular Exam 
import AssignSeatNo from "./pages/Staff/ConductExam/AssignSeatNo.tsx"; // Import the moved Assign Exam
import AtktRevalExam from "./pages/Staff/ConductExam/AtktRevalExam.tsx"; // ATKT / Revaluation assignment
import ProtectedRoute from "./components/auth/ProtectedRoute"; // Import ProtectedRoute component
import AdminRoute from "./components/auth/AdminRoute"; // Admin-only screens (DEC-17)
import ScreenRoute from "./components/auth/ScreenRoute"; // Per-role screen permissions (T-05)
import PlatformRoute from "./components/auth/PlatformRoute"; // Platform (developer) console only
import PlatformLayout from "./layouts/Platform/Layout";
import PlatformColleges from "./pages/Platform/Colleges";
import PlatformNewCollege from "./pages/Platform/NewCollege";
import PlatformCollegeDetail from "./pages/Platform/CollegeDetail";
import EnterEligibility from "./pages/Staff/MarksEntry/EnterEligibility.tsx";
import GenerateHallTicket  from "./pages/Staff/Reports/GenerateHallTicket.tsx"; // Import GenerateHallTicket component
import { ScrollToTop } from "./components/common/ScrollToTop";  
import TopLoader from "./components/common/TopLoader"; 
import AddPermission from "./pages/Staff/Dashboard/AddPermission";
import CreateUser from "./pages/Staff/Dashboard/CreateUser.tsx";
import CollegeDetail from "./pages/Staff/Dashboard/CollegeDetail";
import RoleMaster from "./pages/Staff/Admin/Role_master";
import Ordinance from "./pages/Staff/Academic_Master/Ordinance.tsx";
import OverallMarksEntry from "./pages/Staff/MarksEntry/OverallMarksEntry.tsx";
import MarksEntry from "./pages/Staff/MarksEntry/MarksEntry.tsx";
import Gazette from "./pages/Staff/Reports/Gazette.tsx";
import Marksheet from "./pages/Staff/Reports/Marksheet.tsx";
import StatisticalReportPage from "./pages/Staff/Reports/StatisticalReport.tsx";
import StudentMaster from "./pages/Staff/Students Admin/Student_master";
import HallTicketPage from "./components/HallTicket/Hallticket.tsx";
import ATKTCommulativeReport from "./pages/Staff/Reports/ATKTCommulativeReport.tsx";


export default function App() {
  // Derive the router basename from Vite's own base path so the two can never disagree.
  // vite.config.ts sets base:'/ExamSoftware/' for BOTH dev and build, so hardcoding ""
  // in dev made every URL (/ExamSoftware/signin) fail to match every route (/signin),
  // and the app rendered its 404 page on every navigation.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <>
      <Router basename={basename}>
        <ScrollToTop />
        <TopLoader />
        <Routes>
          {/* PLATFORM CONSOLE: the developer login has no college or academic year, so it gets its own layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<PlatformRoute />}>
              <Route path="/Platform" element={<PlatformLayout />}>
                <Route index element={<PlatformColleges />} />
                <Route path="colleges/new" element={<PlatformNewCollege />} />
                <Route path="colleges/:id" element={<PlatformCollegeDetail />} />
                {/* Shared permission catalog: only the platform admin edits it */}
                <Route path="permissions" element={<AddPermission />} />
              </Route>
            </Route>
          </Route>

          {/* STAFF PORTAL (Master Page 1): a platform admin is sent to /Platform */}
          <Route element={<ProtectedRoute redirectPlatformAdmin />}>
            {/* Permission guard (T-05): a screen not ticked for the user's role is redirected to the dashboard */}
            <Route element={<ScreenRoute />}>
            <Route path="/Staff" element={<StaffLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ExamDashboard />} />
              {/* Admin screens: college admin / platform admin only (DEC-17); others are redirected to the dashboard */}
              <Route element={<AdminRoute />}>
                <Route path="AddPermission" element={<AddPermission />} />
                <Route path="CreateUser" element={<CreateUser />} />
                <Route path="CollegeDetail" element={<CollegeDetail />} />
                <Route path="Role_master" element={<RoleMaster />} />
              </Route>
                <Route path="SubjectMaster" element={<SubjectMaster />} />
                    <Route path="ExamMaster" element={<ExamMaster />} />
              <Route path="Ordinance" element={<Ordinance />} />
              <Route path="OverallMarksEntry" element={<OverallMarksEntry />} />
              <Route path="Student_master" element={<StudentMaster />} />
                <Route path="RegularExam" element={<RegularExam />} />
                <Route path="AtktRevalExam" element={<AtktRevalExam />} />
                  <Route path="EnterEligibility" element={<EnterEligibility />} />
                 <Route path="GenerateHallTicket" element={<GenerateHallTicket />} />
                <Route path="MarksEntry" element={<MarksEntry />} />
                 <Route path="AssignSeatNo" element={<AssignSeatNo />} />
                 <Route path="Gazette" element={<Gazette />} />
                 <Route path="Marksheet" element={<Marksheet />} />
                 <Route path="StatisticalReport" element={<StatisticalReportPage />} />
                      <Route path="ATKTCommulativeReport" element={<ATKTCommulativeReport />} />
              {/* Add future staff pages here: /staff/exams, /staff/students */}
            </Route>
             <Route path="/hallticket" element={<HallTicketPage />} />
            </Route>
          </Route>

          {/* FUTURE: STUDENT PORTAL (Master Page 2) */}
          {/* <Route path="/student" element={<StudentLayout />}> ... </Route> */}

          {/* AUTHENTICATION (Shared) */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* DEFAULT REDIRECT */}
          <Route
            path="/"
            element={<Navigate to="/Staff/dashboard" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
