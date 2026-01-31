import React, { createContext, useContext, useState, useEffect } from "react";
import {
  academicYearService,
  AcademicYearResponse,
} from "../services/academicYearService";
import { useAuth } from "./AuthContext";

interface AcademicYearContextType {
  currentYear: string; // Display text (e.g. "2024-2025")
  currentYearId: string | null; // Database ID (GUID)
  setAcademicYear: (yearString: string) => void;
  availableYears: AcademicYearResponse[]; // Full objects
  isLoading: boolean;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(
  undefined
);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 1. Initialize State
  const [currentYear, setCurrentYear] = useState<string>(
    () => localStorage.getItem("academicYear") || ""
  );
  const [currentYearId, setCurrentYearId] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<AcademicYearResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchYears = async () => {
        try {
          const data = await academicYearService.getAllYears();
          setAvailableYears(data);

          // 2. Smart Default Logic
          const savedYearString = localStorage.getItem("academicYear");

          // Find the saved year object in the fresh API data
          const foundYear = data.find(
            (y) => y.shortDuration === savedYearString
          );

          if (foundYear) {
            // If saved year is valid, use it
            setCurrentYear(foundYear.shortDuration);
            setCurrentYearId(foundYear.ayid);
          } else {
            // If not found, look for the "Current" one from DB, or fallback to the last one
            const defaultYear =
              data.find((y) => y.isCurrent) || data[data.length - 1];

            if (defaultYear) {
              setCurrentYear(defaultYear.shortDuration);
              setCurrentYearId(defaultYear.ayid);
              localStorage.setItem("academicYear", defaultYear.shortDuration);
              localStorage.setItem("AYID", defaultYear.ayid);
            }
          }
        } catch (error) {
          // console.error("Failed to fetch academic years:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchYears();
    }
  }, [user]);

  const setAcademicYear = (yearString: string) => {
    // When user selects "2025-2026", we find the ID and set both
    const selected = availableYears.find((y) => y.shortDuration === yearString);
    if (selected) {
      setCurrentYear(selected.shortDuration);
      setCurrentYearId(selected.ayid);
      localStorage.setItem("academicYear", selected.shortDuration);
      localStorage.setItem("AYID", selected.ayid);
    }
  };

  return (
    <AcademicYearContext.Provider
      value={{
        currentYear,
        currentYearId,
        setAcademicYear,
        availableYears,
        isLoading,
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context)
    throw new Error(
      "useAcademicYear must be used within an AcademicYearProvider"
    );
  return context;
};
