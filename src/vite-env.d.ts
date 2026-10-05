/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** IIS path of the API for production builds, e.g. "/gradesphere-api" (see vite.config.ts). */
  readonly VITE_API_BASE?: string;
  /** IIS path the site is served from, e.g. "/gradesphere/" (read by vite.config.ts). */
  readonly VITE_BASE_PATH?: string;
}
