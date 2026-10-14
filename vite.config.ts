import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** "/x", "x/", "x" -> "/x/" (Vite's base must start and end with a slash). */
const slashed = (p: string) => `/${p.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");

/**
 * IIS rewrite for the single-page app: every path that is not a real file goes to index.html under
 * the app's own base path, so the rule always matches the folder the build is deployed to.
 * Caching: files in assets/ carry a content hash in their name, so browsers may keep them for a year;
 * everything else (index.html above all) is revalidated on every visit so a new build shows at once.
 * Static compression is switched on for the folder (used when the IIS feature is installed).
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
  <location path="assets">
    <system.webServer>
      <staticContent>
        <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" cacheControlCustom="immutable" />
      </staticContent>
    </system.webServer>
  </location>
  <system.webServer>
    <urlCompression doStaticCompression="true" doDynamicCompression="false" />
    <staticContent>
      <clientCache cacheControlMode="DisableCache" />
    </staticContent>
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
