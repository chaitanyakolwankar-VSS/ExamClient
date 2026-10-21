/** "4 Nov 2026" in the reader's locale, or "" when there is no date. */
export const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
