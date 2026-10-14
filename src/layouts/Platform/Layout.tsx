import { Suspense } from "react";
import PageFallback from "../../components/common/PageFallback";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";
import { Building2, GraduationCap, KeyRound } from "lucide-react";
import UserDropdown from "../../components/header/UserDropdown";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";
import PageTransition from "../../components/common/PageTransition";

const NAV = [
  { to: "/Platform", label: "Colleges", icon: Building2, end: true },
  { to: "/Platform/permissions", label: "Permission catalog", icon: KeyRound, end: false },
];

/**
 * Minimal layout for the platform (developer) console: header with the app name, a two-link nav, theme
 * toggle and the user menu (sign out). No academic-year selector and no staff sidebar - a platform admin
 * belongs to no college.
 */
export default function PlatformLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-99999 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/Platform" className="flex items-center gap-2">
              <GraduationCap className="size-7 text-brand-500" />
              <span className="text-lg font-semibold text-gray-800 dark:text-white/90">GradeSphere</span>
            </Link>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              Platform
            </span>
          </div>

          <nav className="order-last flex w-full gap-1 sm:order-none sm:w-auto" aria-label="Platform">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                  }`
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <UserDropdown />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
}
