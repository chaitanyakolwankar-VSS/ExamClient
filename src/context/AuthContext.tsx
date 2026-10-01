import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";

// Define the shape of your User object (adjust based on your API response)
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** College admin (role "Admin", case-insensitive) or platform admin. Mirrors the API's CollegeAdmin policy. */
  isAdmin: boolean;
  /** Platform (developer) login: creates colleges and college admins. */
  isPlatformAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_ROLE_NAME = "admin";
const ROLE_CLAIMS = ["role", "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

// The role / IsPlatformAdmin claims live in the JWT. Reading them here only drives what the UI shows;
// the API enforces the same rules server-side (policies CollegeAdmin / PlatformAdmin), so a tampered
// token or localStorage gains nothing.
const readClaims = (token: string | null): Record<string, unknown> => {
  if (!token) return {};
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const hasAdminRole = (claims: Record<string, unknown>, fallbackRole?: string): boolean => {
  const values: unknown[] = ROLE_CLAIMS.flatMap<unknown>((k) => {
    const v = claims[k];
    return Array.isArray(v) ? v : [v];
  });
  if (!values.some((v) => v !== undefined)) values.push(fallbackRole);
  return values.some((v) => typeof v === "string" && v.trim().toLowerCase() === ADMIN_ROLE_NAME);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state from localStorage on app load
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data", error);
        localStorage.removeItem("authUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("authUser", JSON.stringify(newUser));
  };

  const isPlatformAdmin = useMemo(
    () => String(readClaims(token)["IsPlatformAdmin"]).toLowerCase() === "true",
    [token],
  );
  const isAdmin = useMemo(
    () => isPlatformAdmin || hasAdminRole(readClaims(token), user?.role),
    [token, user?.role, isPlatformAdmin],
  );

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("academicYear");
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, isAdmin, isPlatformAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};