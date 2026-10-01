import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

/**
 * Guards the Admin screens (College Details, Create User, Role Master, Add Permission).
 * Only a college admin (or the platform admin) may open them (DEC-17); anyone else who types the URL
 * is sent back to the staff dashboard. The API enforces the same rule, so this is UX, not security.
 * Nest it inside <ProtectedRoute /> so an unauthenticated user is still sent to sign-in first.
 */
export default function AdminRoute() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/Staff/dashboard" replace />;
}
