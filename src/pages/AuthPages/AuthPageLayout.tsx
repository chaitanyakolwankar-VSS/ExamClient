import React from "react";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

interface AuthLayoutProps {
  children: React.ReactNode;
  bannerTitle?: string;
  bannerSubtitle?: string;
}

export default function AuthLayout({
  children,
  bannerTitle = "Welcome to GradeSphere",
  bannerSubtitle = "A comprehensive platform for managing exams and student performance.",
}: // Default image if none is provided
AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-gray-900">
      {/* --- LEFT SIDE: FORM SECTION --- */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 xl:w-5/12">
        <div className="mx-auto w-full max-w-md">
          {/* Logo Header */}
          <div className="mb-10 flex items-center gap-3">
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              className="h-20 w-20"
            />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              GradeSphere
            </span>
          </div>

          {children}

          <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} VSS. All rights reserved.
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: BANNER SECTION --- */}
      <div className="relative hidden w-full items-center justify-center overflow-hidden lg:flex lg:w-1/2 xl:w-7/12 bg-gradient-to-br from-brand-600 via-brand-800 to-brand-600 bg-[length:200%_200%] animate-gradient">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-light-blue-100/20 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-light-purple-100/20 blur-3xl" />

        {/* Content Overlay */}
        <div className="relative z-10 max-w-lg px-10 text-center">
          <div className="mb-10 flex items-center gap-3 align-middle justify-center">
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              className="h-40 w-40"
            />
          </div>

          <h2 className="mb-4 text-3xl font-bold text-white">{bannerTitle}</h2>
          <p className="text-lg text-brand-100 leading-relaxed">
            {bannerSubtitle}
          </p>
        </div>

        {/* Floating Theme Toggle */}
        <div className="absolute bottom-10 right-10 z-20">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
