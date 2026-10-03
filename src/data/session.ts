// Who is signed in, as far as the lookup layer cares. Pure functions (no React, no AuthContext import) so
// AuthContext, the hooks and the axios client can all use them without an import cycle.

const COLLEGE_CLAIMS = ["CollegeId", "collegeId", "collegeid"];

const readJwtPayload = (token: string | null): Record<string, unknown> => {
  if (!token) return {};
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return {};
  }
};

/**
 * The signed-in user's college id: the JWT "CollegeId" claim (what the API itself trusts), falling back to the
 * CollegeId stored on the user at login. null for the platform admin, who belongs to no college.
 */
export const readCollegeId = (token: string | null, user?: { CollegeId?: string } | null): string | null => {
  const claims = readJwtPayload(token);
  for (const k of COLLEGE_CLAIMS) {
    const v = claims[k];
    if (typeof v === "string" && v) return v;
  }
  return user?.CollegeId || null;
};

export const readIsPlatformAdmin = (token: string | null): boolean =>
  String(readJwtPayload(token)["IsPlatformAdmin"]).toLowerCase() === "true";
