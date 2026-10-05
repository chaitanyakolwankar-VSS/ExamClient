import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** "/x", "x/", "x" -> "/x/" (Vite's base must start and end with a slash). */
const slashed = (p: string) => `/${p.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");

/**
 * IIS rewrite for the single-page app: every path that is not a real file goes to index.html under
 * the app's own base path, so the rule always matches the folder the build is deployed to.
 */
const iisWebConfig = (base: string): Plugin => ({
  name: "iis-web-config",
  apply: "build",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "web.config",
      source: `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Route Rewrite" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="${base}index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
`,
    });
  },
});

// https://vite.dev/config/
// Deploy paths come from the build mode's .env file: VITE_BASE_PATH (where the site is served) and
// VITE_API_BASE (where the API is). `npm run build` = the demo (/ExamSoftware, /ExamAPI);
// `npm run build:gradesphere` = .env.gradesphere.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");
  const base = slashed(env.VITE_BASE_PATH || "/ExamSoftware/");
  return {
    base,
    plugins: [react(), iisWebConfig(base)],
  };
});
