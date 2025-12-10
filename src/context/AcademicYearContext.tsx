import React, { createContext, useContext, useState, useEffect } from "react";

interface AcademicYearContextType {
  currentYear: string;
  setAcademicYear: (year: string) => void;
  availableYears: string[];
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize State: Try to get from LocalStorage immediately
  const [currentYear, setCurrentYear] = useState<string>(() => {
    return localStorage.getItem("academicYear") || "";
  });
  
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchYears = async () => {
      // Mock Data (In real app, this comes from API)
      const mockData = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];
      setAvailableYears(mockData);
      
      // 2. Smart Default Logic
      const savedYear = localStorage.getItem("academicYear");

      // If we have NO saved year, OR the saved year is invalid (not in our new list)...
      if (!savedYear || !mockData.includes(savedYear)) {
        // ...Select the LATEST year (Last item in array)
        const latest = mockData[mockData.length - 1];
        setCurrentYear(latest);
        localStorage.setItem("academicYear", latest);
      }
      // (Otherwise, do nothing. We already loaded the valid savedYear in useState)
    };

    fetchYears();
  }, []);

  const setAcademicYear = (year: string) => {
    console.log("Context Updating Year to:", year); // Debug log
    setCurrentYear(year);
    localStorage.setItem("academicYear", year);
  };

  return (
    <AcademicYearContext.Provider value={{ currentYear, setAcademicYear, availableYears }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) {
    throw new Error("useAcademicYear must be used within an AcademicYearProvider");
  }
  return context;
};