import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import StaffLayout from "./layouts/Staff/Layout"; // Import the specific Staff Layout
import ProtectedRoute from "./components/auth/ProtectedRoute"; // Import ProtectedRoute component
import AdminRoute from "./components/auth/AdminRoute"; // Admin-only screens (DEC-17)
import ScreenRoute from "./components/auth/ScreenRoute"; // Per-role screen permissions (T-05)
import PlatformRoute from "./components/auth/PlatformRoute"; // Platform (developer) console only
import PlatformLayout from "./layouts/Platform/Layout";
import { ScrollToTop } from "./components/common/ScrollToTop";  
import TopLoader from "./components/common/TopLoader"; 
import PageFallback from "./components/common/PageFallback";

// Pages load on first visit (their own chunks), so the sign-in page does not wait for the whole app.
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const ExamDashboard = lazy(() => import("./pages/Staff/Dashboard/Home"));
const SubjectMaster = lazy(() => import("./pages/Staff/Academic_Master/Subject_Master.tsx"));
const ExamMaster = lazy(() => import("./pages/Staff/Academic_Master/ExamMaster.tsx"));
const RegularExam = lazy(() => import("./pages/Staff/ConductExam/RegularExam.tsx"));
const AssignSeatNo = lazy(() => import("./pages/Staff/ConductExam/AssignSeatNo.tsx"));
const AtktRevalExam = lazy(() => import("./pages/Staff/ConductExam/AtktRevalExam.tsx"));
const PlatformColleges = lazy(() => import("./pages/Platform/Colleges"));
const PlatformNewCollege = lazy(() => import("./pages/Platform/NewCollege"));
const PlatformCollegeDetail = lazy(() => import("./pages/Platform/CollegeDetail"));
const EnterEligibility = lazy(() => import("./pages/Staff/MarksEntry/EnterEligibility.tsx"));
const GenerateHallTicket = lazy(() => import("./pages/Staff/Reports/GenerateHallTicket.tsx"));
const AddPermission = lazy(() => import("./pages/Staff/Dashboard/AddPermission"));
const CreateUser = lazy(() => import("./pages/Staff/Dashboard/CreateUser.tsx"));
const CollegeDetail = lazy(() => import("./pages/Staff/Dashboard/CollegeDetail"));
const RoleMaster = lazy(() => import("./pages/Staff/Admin/Role_master"));
const Ordinance = lazy(() => import("./pages/Staff/Academic_Master/Ordinance.tsx"));
const OverallMarksEntry = lazy(() => import("./pages/Staff/MarksEntry/OverallMarksEntry.tsx"));
const MarksEntry = lazy(() => import("./pages/Staff/MarksEntry/MarksEntry.tsx"));
const Gazette = lazy(() => import("./pages/Staff/Reports/Gazette.tsx"));
const Marksheet = lazy(() => import("./pages/Staff/Reports/Marksheet.tsx"));
const StatisticalReportPage = lazy(() => import("./pages/Staff/Reports/StatisticalReport.tsx"));
const StudentMaster = lazy(() => import("./pages/Staff/Students Admin/Student_master"));
const HallTicketPage = lazy(() => import("./components/HallTicket/Hallticket.tsx"));
const StudentPromotion = lazy(() => import("./pages/Staff/Academic_Master/StudentPromotion.tsx"));
const DeclareResult = lazy(() => import("./pages/Staff/Students Admin/DeclareResult.tsx"));
const ReleaseHallTicket = lazy(() => import("./pages/Staff/Students Admin/ReleaseHallTicket.tsx"));
const StudentAssignReport = lazy(() => import("./pages/Staff/Reports/StudentAssignReport.tsx"));
const DummyDashboard = lazy(() => import("./pages/Staff/Dashboard/DummyDashboard.tsx"));
const ATKTCommulativeReport = lazy(() => import("./pages/Staff/Reports/ATKTCommulativeReport.tsx"));


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
        <Suspense fallback={<PageFallback />}>
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
                 <Route path="StudentPromotion" element={<StudentPromotion />} />
                 <Route path="DeclareResult" element={<DeclareResult />} />
                 <Route path="ReleaseHallTicket" element={<ReleaseHallTicket />} />
                 <Route path="StudentAssignReport" element={<StudentAssignReport />} />
                 <Route path="dummydashboard" element={<DummyDashboard />} />
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
        </Suspense>
      </Router>
    </>
  );
}
