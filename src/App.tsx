import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import StaffLayout from "./layouts/Staff/Layout"; // Import the specific Staff Layout
import ExamDashboard from "./pages/Staff/Dashboard/Home"; // Import the moved dashboard
import SubjectMaster from "./pages/Staff/Academic_Master/Subject_Master.tsx";// Import the moved Subjectmaster
import ExamMaster from "./pages/Staff/Academic_Master/ExamMaster.tsx"; // Import the moved Exam Master
import ProtectedRoute from "./components/auth/ProtectedRoute"; // Import ProtectedRoute component
import { ScrollToTop } from "./components/common/ScrollToTop";  
import TopLoader from "./components/common/TopLoader"; 
import RoleMaster from "./pages/Staff/Admin/Role_master";



export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <TopLoader />
        <Routes>
          {/* STAFF PORTAL (Master Page 1) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/Staff" element={<StaffLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ExamDashboard />} />
                <Route path="SubjectMaster" element={<SubjectMaster />} />
                    <Route path="ExamMaster" element={<ExamMaster />} />
              <Route path="Role_master" element={<RoleMaster />} />
              {/* Add future staff pages here: /staff/exams, /staff/students */}
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
            element={<Navigate to="/staff/dashboard" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
