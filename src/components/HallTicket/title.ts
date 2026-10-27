/**
 * The hall ticket's first line, e.g. "EXAMINATION OF : CIVIL ENGINEERING (NEP - R-24) REGULAR DEC 2026".
 * The exam type is left out when the exam's name already says it ("Regular Dec 2026").
 */
export function hallTicketTitle(p: { branch: string; pattern: string; examType?: string | null; examName?: string | null }): string {
  const name = (p.examName ?? "").trim();
  const type = (p.examType ?? "").trim();
  const exam = type && !name.toLowerCase().includes(type.toLowerCase()) ? `${type} ${name}` : name;
  const pattern = p.pattern.trim() ? ` (${p.pattern.trim()})` : "";
  return `EXAMINATION OF : ${p.branch.trim()}${pattern} ${exam}`.trim().toUpperCase();
}
