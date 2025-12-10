import { useEffect, useRef, useState } from "react";

import { Link } from "react-router";
import { useSidebar } from "../../context/SidebarContext";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";
import UserDropdown from "../../components/header/UserDropdown";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { ChevronDownIcon } from "../../icons";
import { useAcademicYear } from "../../context/AcademicYearContext";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { currentYear, setAcademicYear, availableYears } = useAcademicYear();

  const handleYearChange = (year: string) => {
    setAcademicYear(year);
    setIsSelectOpen(false);
  };
  const { isExpanded, isMobileOpen, toggleSidebar, toggleMobileSidebar } =
    useSidebar();

  // const handleToggle = () => {
  //   if (window.innerWidth >= 1024) {
  //     toggleSidebar();
  //   } else {
  //     toggleMobileSidebar();
  //   }
  // };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* --- Mobile Toggle Button (Hamburger) --- */}
          <button
            className="flex items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg lg:hidden dark:border-gray-800 dark:text-gray-400"
            onClick={toggleMobileSidebar} // Directly call mobile toggle
            aria-label="Toggle Mobile Sidebar"
          >
            {isMobileOpen ? (
              /* Close Icon (Mobile) */
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              /* Hamburger Icon (Mobile) */
              <svg
                className="fill-current"
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill=""
                />
              </svg>
            )}
          </button>

          {/* --- Desktop Toggle Button (Panel Open/Close) --- */}
          <button
            className="hidden items-center text-gray-700 justify-center w-11 h-11 border border-gray-200 rounded-lg lg:flex dark:border-gray-800 dark:text-gray-300"
            onClick={toggleSidebar} // Directly call desktop toggle
            aria-label="Toggle Desktop Sidebar"
          >
            {isExpanded ? (
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 5.25H5C4.58579 5.25 4.25 5.58579 4.25 6V18C4.25 18.4142 4.58579 18.75 5 18.75H19C19.4142 18.75 19.75 18.4142 19.75 18V6C19.75 5.58579 19.4142 5.25 19 5.25ZM5.75 17.25V6.75H9.25V17.25H5.75ZM18.25 17.25H10.75V6.75H18.25V17.25Z"
                  fill=""
                />
                <path
                  d="M13.5 14L11.5 12L13.5 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 5.25H5C4.58579 5.25 4.25 5.58579 4.25 6V18C4.25 18.4142 4.58579 18.75 5 18.75H19C19.4142 18.75 19.75 18.4142 19.75 18V6C19.75 5.58579 19.4142 5.25 19 5.25ZM5.75 17.25V6.75H9.25V17.25H5.75ZM18.25 17.25H10.75V6.75H18.25V17.25Z"
                  fill=""
                />
                <path
                  d="M13.5 14L15.5 12L13.5 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <Link to="/" className="lg:hidden">
            <img
              className="dark:hidden"
              src="./images/logo/logo.svg"
              alt="Logo"
            />
            <img
              className="hidden dark:block"
              src="./images/logo/logo-dark.svg"
              alt="Logo"
            />
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <div className="hidden lg:block relative">
            <button
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <span>{currentYear}</span> {/* Display Global State */}
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform duration-200 ${
                  isSelectOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <Dropdown
              isOpen={isSelectOpen}
              onClose={() => setIsSelectOpen(false)}
              className="absolute left-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 text-gary-300"
            >
              {availableYears.map((year) => (
                <DropdownItem
                  key={year}
                  onItemClick={() => handleYearChange(year)} // Update Global State
                  className={`rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-300 ${
                    currentYear === year
                      ? "bg-gray-100 dark:bg-white/5 font-bold"
                      : ""
                  }`}
                >
                  {year}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none border-t border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 lg:border-none`}
        >
          {/* --- Mobile Academic Year Dropdown --- */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <span>{currentYear}</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform duration-200 ${
                  isSelectOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu - kept standard width */}
            <Dropdown
              isOpen={isSelectOpen}
              onClose={() => setIsSelectOpen(false)}
              className="absolute left-0 z-50 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-theme-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {availableYears.map((year) => (
                <DropdownItem
                  key={year}
                  onItemClick={() => handleYearChange(year)}
                  className={`rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 dark:text-gray-300 ${
                    currentYear === year
                      ? "bg-gray-100 dark:bg-white/5 font-bold"
                      : ""
                  }`}
                >
                  {year}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
          <div className="flex items-center gap-2 2xsm:gap-3">
            {/* <!-- Dark Mode Toggler --> */}
            <ThemeToggleButton />
            {/* <!-- Dark Mode Toggler --> */}
          </div>
          {/* <!-- User Area --> */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
