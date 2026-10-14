import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { DASHBOARD_PATH, screenForPath } from "../../config/screens";

/**
 * Route guard for permission-gated screens (T-05). Looks the current URL up in config/screens.ts and
 * lets the user through only if they may open that screen (admin / platform admin: all; others: the forms
 * ticked for their role or user). Anything else - including a URL typed directly - goes to the dashboard.
 * Paths that are not a configured screen (dashboard, 404) pass through. This is UX only; per-form
 * enforcement on the API is a later step. Nest it inside <ProtectedRoute /> (and around <AdminRoute />).
 */
export default function ScreenRoute() {
  const { pathname } = useLocation();
  const { isLoading, permissionsLoading, canAccess } = useAuth();

  if (isLoading || permissionsLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const screen = screenForPath(pathname);
  if (screen && !canAccess(screen)) {
    return <Navigate to={DASHBOARD_PATH} replace />;
  }
  return <Outlet />;
}
