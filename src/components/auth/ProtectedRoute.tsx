import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Optional: Render a loading spinner here
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to Sign In
  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
}