import React, { createContext, useContext, useState, useEffect } from "react";

interface AcademicYearContextType {
  currentYear: string;
  setAcademicYear: (year: string) => void;
  availableYears: string[];
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. State for the selected year
  const [currentYear, setCurrentYear] = useState<string>("2024-2025");
  
  // 2. State for the list of years (Mock Database)
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchYears = async () => {
      // In real app: const response = await fetch('/api/academic-years');
      const mockData = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];
      setAvailableYears(mockData);
      
      // Optional: Set default to the latest or active one
      setCurrentYear(mockData[1]); // Defaulting to "2024-2025"
    };

    fetchYears();
  }, []);

  const setAcademicYear = (year: string) => {
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