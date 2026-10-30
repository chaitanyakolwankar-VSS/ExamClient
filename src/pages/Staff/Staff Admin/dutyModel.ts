import type { DutyDay, DutyEntry, DutyKind, DutySession } from "../../../services/StaffLetterService";
import type { Staff } from "../../../services/StaffService";

/** What one person does on one day, as the grid holds it. A duty always carries its role. */
export interface Cell {
  kind: DutyKind;
  session: DutySession | null;
  role: string | null;
  note: string | null;
}

/** staffId, then date (yyyy-MM-dd). Updated without changing the other people, so one changed row is one repainted row. */
export type Cells = Record<string, Record<string, Cell>>;

/** What the edits need to know: the roles (highest first), the staff and the days of the chart. */
export interface Ctx {
  roles: string[];
  staffById: Map<string, Staff>;
  dayByDate: Map<string, DutyDay>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** "11 May" */
export const dayLabel = (iso: string) => {
  const d = parseDay(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** "11 May 2026" */
export const fullDate = (iso: string) => `${dayLabel(iso)} ${parseDay(iso).getFullYear()}`;

/** "11–22 May" within a month, "28 Apr – 5 May" across months. */
export const rangeLabel = (from: string, to: string) => {
  const a = parseDay(from);
  const b = parseDay(to);
  if (a.getFullYear() !== b.getFullYear() || a.getMonth() !== b.getMonth()) return `${dayLabel(from)} – ${dayLabel(to)}`;
  return a.getDate() === b.getDate() ? dayLabel(from) : `${a.getDate()}–${dayLabel(to)}`;
};

/** "Mon" */
export const weekdayShort = (iso: string) => WEEKDAYS[parseDay(iso).getDay()];

export const isTeaching = (s: Staff) => s.isTeaching !== false;

/** The role a person gets when none is chosen: teaching staff supervise as juniors, the rest as non-teaching staff. */
export function defaultRole(staff: Staff | undefined, roles: string[]): string {
  const wanted = staff && !isTeaching(staff) ? /non/i : /junior/i;
  return roles.find((r) => wanted.test(r)) ?? roles[roles.length - 1] ?? "";
}

/** "CC" for the first role, "SS" for the second; others have no prefix. */
export function rolePrefix(role: string | null, roles: string[]): string {
  const i = role ? roles.indexOf(role) : -1;
  return i === 0 ? "CC" : i === 1 ? "SS" : "";
}

/** The morning of the first day, as the By date view's choice ("2026-05-11|M"). */
export const firstSlot = (days: DutyDay[]): string => (days.length > 0 ? `${days[0].date}|M` : "");

const SESSION_TEXT: Record<DutySession, string> = { M: "M", A: "A", MA: "M/A" };

/** What the cell shows: M, A, M/A (with CC· or SS· before it), or O. */
export function cellCode(c: Cell, roles: string[]): string {
  if (c.kind === "other") return "O";
  const prefix = rolePrefix(c.role, roles);
  const session = SESSION_TEXT[c.session ?? "M"];
  return prefix ? `${prefix}·${session}` : session;
}

/** The cell in words, for a tooltip. */
export function cellWords(c: Cell): string {
  if (c.kind === "other") return c.note ? `Other: ${c.note}` : "Other work";
  const session = c.session === "MA" ? "Morning and afternoon" : c.session === "A" ? "Afternoon" : "Morning";
  return c.role ? `${session} · ${c.role}` : session;
}

/** How many sessions a cell counts for (other work is not a session). */
export const sessionCount = (c: Cell) => (c.kind !== "duty" ? 0 : c.session === "MA" ? 2 : 1);

/** Any session can be given on any day of the chart; the times are only labels. */
export const hasSession = (day: DutyDay | undefined) => !!day;

/** "Morning 10:30 AM - 1:30 PM", or "Morning (no time set)". */
export const sessionText = (name: "Morning" | "Afternoon", time: string | null) => (time ? `${name} ${time}` : `${name} (no time set)`);

/** Entries of any other kind (an old saved valuation) are left out; the next save drops them. */
export function cellsFromEntries(entries: DutyEntry[]): Cells {
  const cells: Cells = {};
  for (const e of entries) {
    const kind: string = e.kind;
    if (kind !== "duty" && kind !== "other") continue;
    (cells[e.staffId] ??= {})[e.date] = { kind: e.kind, session: e.kind === "duty" ? e.session : null, role: e.kind === "duty" ? e.role : null, note: e.kind === "other" ? e.note : null };
  }
  return cells;
}

/** The whole chart as entries, in staff then date order; people in `keep` only. */
export function entriesFromCells(cells: Cells, keep: (staffId: string) => boolean): DutyEntry[] {
  const out: DutyEntry[] = [];
  for (const staffId of Object.keys(cells).sort()) {
    if (!keep(staffId)) continue;
    for (const date of Object.keys(cells[staffId]).sort()) {
      const c = cells[staffId][date];
      out.push({ staffId, date, kind: c.kind, session: c.session, role: c.role, note: c.kind === "other" ? (c.note ?? "").trim() || null : null });
    }
  }
  return out;
}

/** A fingerprint of the chart; two screens with the same fingerprint would save the same thing. */
export const fingerprint = (cells: Cells) =>
  entriesFromCells(cells, () => true)
    .map((e) => `${e.staffId}|${e.date}|${e.kind}|${e.session ?? ""}|${e.role ?? ""}|${e.note ?? ""}`)
    .join(";");

/** Drops the cells of days that are no longer in the chart. */
export function pruneCells(cells: Cells, dates: Set<string>): Cells {
  let changed = false;
  const next: Cells = {};
  for (const [id, row] of Object.entries(cells)) {
    const kept = Object.fromEntries(Object.entries(row).filter(([date]) => dates.has(date)));
    if (Object.keys(kept).length !== Object.keys(row).length) changed = true;
    if (Object.keys(kept).length > 0) next[id] = kept;
  }
  return changed ? next : cells;
}

const same = (a: Cell | undefined, b: Cell | null) => (!a && !b) || (!!a && !!b && a.kind === b.kind && a.session === b.session && a.role === b.role && a.note === b.note);

/** One cell set (null = cleared); other people's rows stay the same objects. */
export function putCell(cells: Cells, staffId: string, date: string, cell: Cell | null): Cells {
  if (same(cells[staffId]?.[date], cell)) return cells;
  const row = { ...(cells[staffId] ?? {}) };
  if (cell) row[date] = cell;
  else delete row[date];
  const next = { ...cells };
  if (Object.keys(row).length > 0) next[staffId] = row;
  else delete next[staffId];
  return next;
}

/** The role a new duty takes: the person's role on the nearest earlier day with a duty, else the nearest later day, else their default. */
export function usualRole(cells: Cells, ctx: Ctx, staffId: string, date: string): string {
  const row = cells[staffId] ?? {};
  const dated = Object.keys(row)
    .filter((d) => d !== date && row[d].kind === "duty" && row[d].role)
    .sort();
  const before = dated.filter((d) => d < date).pop();
  const pick = before ?? dated.find((d) => d > date);
  return (pick && row[pick].role) || defaultRole(ctx.staffById.get(staffId), ctx.roles);
}

/** A duty on the day: morning, afternoon or both. Nothing changes when the date is not a day of the chart. */
export function setDuty(cells: Cells, ctx: Ctx, staffId: string, date: string, session: DutySession): Cells {
  if (!hasSession(ctx.dayByDate.get(date))) return cells;
  const old = cells[staffId]?.[date];
  const role = old?.kind === "duty" && old.role ? old.role : usualRole(cells, ctx, staffId, date);
  return putCell(cells, staffId, date, { kind: "duty", session, role, note: null });
}

export function setOther(cells: Cells, staffId: string, date: string, note: string): Cells {
  return putCell(cells, staffId, date, { kind: "other", session: null, role: null, note });
}

/** Changes the role of a duty. */
export function setRole(cells: Cells, staffId: string, date: string, role: string): Cells {
  const old = cells[staffId]?.[date];
  return old?.kind === "duty" ? putCell(cells, staffId, date, { ...old, role }) : cells;
}

/** Puts one session of the day (morning or afternoon) on or off a person's duty; both ticked is "both". */
export function toggleSession(cells: Cells, ctx: Ctx, staffId: string, date: string, session: "M" | "A", on: boolean): Cells {
  const old = cells[staffId]?.[date];
  if (old && old.kind !== "duty") return cells;
  const has = new Set<string>(old?.session === "MA" ? ["M", "A"] : old?.session ? [old.session] : []);
  if (on) has.add(session);
  else has.delete(session);
  if (has.size === 0) return putCell(cells, staffId, date, null);
  const next: DutySession = has.has("M") && has.has("A") ? "MA" : has.has("M") ? "M" : "A";
  return setDuty(cells, ctx, staffId, date, next);
}
