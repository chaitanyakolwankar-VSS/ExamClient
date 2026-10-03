import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  /**
   * The staff portal needs a college and an academic year, which the platform (developer) login does
   * not have, so it is sent to the platform console instead. Leave off for routes both may open.
   */
  redirectPlatformAdmin?: boolean;
}

export default function ProtectedRoute({ redirectPlatformAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isPlatformAdmin } = useAuth();

  if (isLoading) {
    // Optional: Render a loading spinner here
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not authenticated, redirect to Sign In
  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  // Platform admin has no college: /Staff/* -> /Platform
  if (redirectPlatformAdmin && isPlatformAdmin) return <Navigate to="/Platform" replace />;

  return <Outlet />;
}
