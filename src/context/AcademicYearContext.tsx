import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { academicYearService } from "../services/academicYearService";
import type { AcademicYearResponse } from "../services/academicYearService";
import { useAuth } from "./AuthContext";
import { useBootstrap, useCollegeId } from "../data/useBootstrap";
import type { LookupAcademicYear } from "../data/lookupApi";
import { lookupKeys } from "../data/queryKeys";

/**
 * The one place that knows which academic year is selected.
 *
 * Years come from the lookup bootstrap (one shared request). The selection lives here (React state); only the
 * chosen year's label is remembered in localStorage "academicYear" so a reload keeps it. Screens read the
 * year through useAcademicYear(), never from localStorage.
 *
 * Every AY-dependent lookup query carries the ayid in its key (see data/queryKeys.ts), so changing the year
 * refetches them automatically.
 */
interface AcademicYearContextType {
  // --- preferred names (use these in new code) ---
  /** Selected academic year id (GUID), or null until the years have loaded. */
  ayid: string | null;
  /** Selected academic year, short text e.g. "24-25". "" until loaded. */
  academicYear: string;
  /** Select a year by its short text (e.g. "24-25"). */
  setAcademicYear: (yearString: string) => void;
  /** All academic years of the college. */
  years: LookupAcademicYear[];
  // --- original names, kept so existing screens compile unchanged ---
  currentYear: string;
  currentYearId: string | null;
  availableYears: AcademicYearResponse[];
  isLoading: boolean;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

const NO_YEARS: LookupAcademicYear[] = [];

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const collegeId = useCollegeId();
  const bootstrap = useBootstrap();

  // Safety net: if the bootstrap endpoint fails, fall back to the old /AcademicYear list so the header picker
  // and the un-migrated screens still get a year.
  const legacy = useQuery({
    queryKey: lookupKeys.legacyYears(collegeId ?? ""),
    queryFn: academicYearService.getAllYears,
    enabled: !!collegeId && bootstrap.isError,
    staleTime: Infinity,
  });

  const years = useMemo<LookupAcademicYear[]>(() => {
    if (bootstrap.data) return bootstrap.data.academicYears;
    if (legacy.data) {
      return legacy.data.map((y) => ({
        ayid: y.ayid,
        fullDuration: y.shortDuration,
        shortDuration: y.shortDuration,
        isCurrent: y.isCurrent,
      }));
    }
    return NO_YEARS;
  }, [bootstrap.data, legacy.data]);

  const [selected, setSelected] = useState<string>(() => localStorage.getItem("academicYear") || "");

  // Forget the selection when the user signs out, so the next login starts from that college's current year.
  const hadUser = useRef(false);
  useEffect(() => {
    if (hadUser.current && !user) setSelected("");
    hadUser.current = !!user;
  }, [user]);

  // Saved choice if it still exists, else the year flagged current, else the newest.
  const resolved = useMemo(
    () => years.find((y) => y.shortDuration === selected) ?? years.find((y) => y.isCurrent) ?? years[years.length - 1],
    [years, selected],
  );

  const setAcademicYear = (yearString: string) => {
    const match = years.find((y) => y.shortDuration === yearString);
    if (!match) return;
    setSelected(match.shortDuration);
    localStorage.setItem("academicYear", match.shortDuration);
  };

  const isLoading = !!collegeId && !resolved && (bootstrap.isPending || (bootstrap.isError && legacy.isPending));

  const value: AcademicYearContextType = {
    ayid: resolved?.ayid ?? null,
    academicYear: resolved?.shortDuration ?? "",
    setAcademicYear,
    years,
    currentYear: resolved?.shortDuration ?? "",
    currentYearId: resolved?.ayid ?? null,
    availableYears: years,
    isLoading,
  };

  return <AcademicYearContext.Provider value={value}>{children}</AcademicYearContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) throw new Error("useAcademicYear must be used within an AcademicYearProvider");
  return context;
};
