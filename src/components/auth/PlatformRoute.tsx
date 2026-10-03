import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

/**
 * Guards the /Platform console. Only the platform (developer) login may open it; anyone else who types
 * the URL is sent to the staff dashboard. The API enforces the same rule (policy PlatformAdmin), so this
 * is UX, not security. Nest it inside <ProtectedRoute /> so an unauthenticated user goes to sign-in first.
 */
export default function PlatformRoute() {
  const { isPlatformAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isPlatformAdmin ? <Outlet /> : <Navigate to="/Staff/dashboard" replace />;
}
