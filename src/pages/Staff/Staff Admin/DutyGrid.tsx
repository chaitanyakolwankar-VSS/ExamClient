import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DutyDay, DutySession } from "../../../services/StaffLetterService";
import type { Staff } from "../../../services/StaffService";
import DutyCellPopover from "./DutyCellPopover";
import {
  cellCode,
  cellWords,
  dayLabel,
  defaultRole,
  fullDate,
  isTeaching,
  putCell,
  sessionCount,
  setDuty,
  setOther,
  setRole,
  weekdayShort,
  rolePrefix,
} from "./dutyModel";
import type { Cell, Cells, Ctx } from "./dutyModel";

interface Props {
  days: DutyDay[];
  /** The people to show (already narrowed by the search and department). */
  staff: Staff[];
  cells: Cells;
  ctx: Ctx;
  onlyDuty: boolean;
  edit: (fn: (cells: Cells) => Cells) => void;
  undo: () => void;
  /** Opens the day's times (a click on its column heading). */
  onDay: (date: string) => void;
  /** A short word for the toolbar ("Copied. Press Ctrl+V on another day to paste."). */
  onHint: (text: string) => void;
}

const PILL = {
  duty: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  lead: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-200 dark:bg-warning-500/15 dark:text-orange-300 dark:ring-warning-500/30",
  other: "bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-gray-300",
};

const pillClass = (c: Cell, roles: string[]) => (c.kind === "other" ? PILL.other : rolePrefix(c.role, roles) ? PILL.lead : PILL.duty);

const NAME_COL = "w-60 min-w-60 max-w-60";
const DAY_COL = "w-[3.25rem] min-w-[3.25rem]";
const DUTIES_COL = "w-14 min-w-14";

interface RowProps {
  person: Staff;
  row: Record<string, Cell> | undefined;
  days: DutyDay[];
  roles: string[];
  /** The date of this row's active cell, when the active cell is in this row. */
  activeDate: string | null;
  /** True for the row that holds the tab stop when no cell is active yet. */
  entry: boolean;
}

/** One person's line: only repainted when their own cells or the active cell change. */
const GridRow = memo(function GridRow({ person, row, days, roles, activeDate, entry }: RowProps) {
  let sessions = 0;
  for (const c of Object.values(row ?? {})) sessions += sessionCount(c);
  return (
    <tr>
      <th scope="row" className={`sticky left-0 z-10 ${NAME_COL} border-b border-r border-gray-100 bg-white px-3 py-1 text-left font-normal dark:border-gray-800 dark:bg-gray-900`}>
        <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90" title={person.name}>
          {person.name}
        </span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400" title={[person.department, person.designation].filter(Boolean).join(" · ")}>
          {[person.employeeCode, person.designation].filter(Boolean).join(" · ") || " "}
        </span>
      </th>
      {days.map((d, i) => {
        const c = row?.[d.date];
        const active = d.date === activeDate;
        return (
          <td
            key={d.date}
            data-staff={person.staffId}
            data-date={d.date}
            tabIndex={active || (entry && activeDate === null && i === 0) ? 0 : -1}
            title={c ? `${person.name}: ${cellWords(c)}` : undefined}
            aria-label={`${person.name}, ${dayLabel(d.date)}: ${c ? cellWords(c) : "no duty"}`}
            className={`${DAY_COL} cursor-pointer border-b border-gray-100 p-0 text-center align-middle focus:outline-hidden dark:border-gray-800 ${
              active ? "bg-brand-50/70 ring-2 ring-inset ring-brand-500 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            }`}
          >
            {c && <span className={`inline-block max-w-full whitespace-nowrap rounded px-1 py-0.5 text-[11px] font-semibold leading-none ${pillClass(c, roles)}`}>{cellCode(c, roles)}</span>}
          </td>
        );
      })}
      <td className={`${DUTIES_COL} border-b border-gray-100 px-2 text-center text-sm tabular-nums text-gray-700 dark:border-gray-800 dark:text-gray-300`}>{sessions || ""}</td>
    </tr>
  );
});

/** The chart as a sheet: people down the side, exam days across, a small code in each cell. Arrow keys move, M A B set a cell, Enter opens it. */
export default function DutyGrid({ days, staff, cells, ctx, onlyDuty, edit, undo, onDay, onHint }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const clipboard = useRef<Cell | null>(null);
  // True after an arrow-key move: only then does the grid scroll to the active cell. A click or closing the panel never scrolls.
  const scrollToActive = useRef(false);
  const [active, setActive] = useState<{ staffId: string; date: string } | null>(null);
  const [pop, setPop] = useState<{ staffId: string; date: string; rect: DOMRect } | null>(null);

  const { roles } = ctx;

  // The people shown, in two groups. Someone whose last duty was just cleared stays while their cell is active.
  const groups = useMemo(() => {
    const shown = staff.filter((s) => !onlyDuty || !!cells[s.staffId] || s.staffId === active?.staffId);
    return [
      { title: "Teaching staff", people: shown.filter(isTeaching) },
      { title: "Non-teaching staff", people: shown.filter((s) => !isTeaching(s)) },
    ].filter((g) => g.people.length > 0);
  }, [staff, cells, onlyDuty, active?.staffId]);
  const rowIds = useMemo(() => groups.flatMap((g) => g.people.map((p) => p.staffId)), [groups]);

  // Sessions given on each day, over everyone (not only the people shown).
  const perDay = useMemo(() => {
    const m: Record<string, { morning: number; afternoon: number }> = {};
    for (const [id, row] of Object.entries(cells)) {
      if (!ctx.staffById.has(id)) continue;
      for (const [date, c] of Object.entries(row)) {
        if (c.kind !== "duty") continue;
        const t = (m[date] ??= { morning: 0, afternoon: 0 });
        if (c.session !== "A") t.morning++;
        if (c.session !== "M") t.afternoon++;
      }
    }
    return m;
  }, [cells, ctx.staffById]);
  const total = days.reduce((n, d) => n + (perDay[d.date]?.morning ?? 0) + (perDay[d.date]?.afternoon ?? 0), 0);

  // The active cell keeps the keyboard focus, unless its panel is open. Focus itself never scrolls (it would jump the grid or the page).
  useEffect(() => {
    const scroll = scrollToActive.current;
    scrollToActive.current = false;
    if (!active || pop) return;
    const td = scroller.current?.querySelector<HTMLElement>(`td[data-staff="${active.staffId}"][data-date="${active.date}"]`);
    td?.focus({ preventScroll: true });
    if (scroll) td?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active, pop]);

  const closePop = useCallback(() => setPop(null), []);

  const move = (staffId: string, date: string, dRow: number, dCol: number) => {
    const r = Math.min(Math.max(rowIds.indexOf(staffId) + dRow, 0), rowIds.length - 1);
    const c = Math.min(Math.max(days.findIndex((d) => d.date === date) + dCol, 0), days.length - 1);
    if (!rowIds[r] || !days[c]) return;
    scrollToActive.current = true;
    setActive({ staffId: rowIds[r], date: days[c].date });
  };

  const open = (td: HTMLElement) => {
    const { staff: staffId, date } = td.dataset;
    if (!staffId || !date) return;
    setActive({ staffId, date });
    setPop({ staffId, date, rect: td.getBoundingClientRect() });
  };

  const apply = (staffId: string, date: string, session: DutySession) => {
    edit((c) => setDuty(c, ctx, staffId, date, session));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const td = (e.target as HTMLElement).closest<HTMLElement>("td[data-date]");
    if (!td) return;
    const staffId = td.dataset.staff!;
    const date = td.dataset.date!;
    const handled = () => e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === "z") {
        handled();
        undo();
      } else if (k === "c") {
        handled();
        clipboard.current = cells[staffId]?.[date] ?? null;
        onHint(clipboard.current ? "Copied. Press Ctrl+V on another day to paste." : "Nothing to copy in this cell.");
      } else if (k === "v") {
        handled();
        const c = clipboard.current;
        if (!c) return onHint("Copy a cell first (Ctrl+C).");
        edit((cs) => putCell(cs, staffId, date, c));
      }
      return;
    }
    if (e.altKey) return;

    switch (e.key) {
      case "ArrowUp":
        handled();
        return move(staffId, date, -1, 0);
      case "ArrowDown":
        handled();
        return move(staffId, date, 1, 0);
      case "ArrowLeft":
        handled();
        return move(staffId, date, 0, -1);
      case "ArrowRight":
        handled();
        return move(staffId, date, 0, 1);
      case "PageUp":
        handled();
        return move(staffId, date, -10, 0);
      case "PageDown":
        handled();
        return move(staffId, date, 10, 0);
      case "Home":
        handled();
        return move(staffId, date, 0, -days.length);
      case "End":
        handled();
        return move(staffId, date, 0, days.length);
      case "Enter":
      case "F2":
        handled();
        return open(td);
      case "Delete":
      case "Backspace":
        handled();
        return edit((c) => putCell(c, staffId, date, null));
      default:
    }

    const key = e.key.toLowerCase();
    if (key === "m" || key === "a" || key === "b") {
      handled();
      apply(staffId, date, key === "m" ? "M" : key === "a" ? "A" : "MA");
    } else if (key === "o") {
      handled();
      edit((c) => setOther(c, staffId, date, cells[staffId]?.[date]?.note ?? ""));
      open(td);
    } else if (key === "c" || key === "s" || key === "j") {
      const role = roles[key === "c" ? 0 : key === "s" ? 1 : 2];
      if (role && cells[staffId]?.[date]?.kind === "duty") {
        handled();
        edit((c) => setRole(c, staffId, date, role));
      }
    }
  };

  const popCell = pop ? cells[pop.staffId]?.[pop.date] : undefined;
  const popDay = pop ? ctx.dayByDate.get(pop.date) : undefined;
  const popPerson = pop ? ctx.staffById.get(pop.staffId) : undefined;

  return (
    <>
      <div
        ref={scroller}
        onKeyDown={onKeyDown}
        onClick={(e) => {
          const td = (e.target as HTMLElement).closest<HTMLElement>("td[data-date]");
          if (td) open(td);
        }}
        onScroll={() => pop && setPop(null)}
        style={{ scrollPaddingLeft: "15.5rem", scrollPaddingTop: "4.5rem", scrollPaddingBottom: "2.5rem", scrollPaddingRight: "4rem" }}
        className="max-h-[70vh] overflow-auto"
      >
        <table className="w-max border-separate border-spacing-0 text-sm" aria-label="Duty chart">
          <thead>
            <tr>
              <th scope="col" className={`sticky left-0 top-0 z-30 ${NAME_COL} border-b border-r border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400`}>
                Staff
              </th>
              {days.map((d) => (
                <th
                  key={d.date}
                  scope="col"
                  title={`${d.weekday} ${fullDate(d.date)}\nMorning: ${d.morning ?? "no time set"}\nAfternoon: ${d.afternoon ?? "no time set"}${d.papers ? `\n${d.papers} ${d.papers === 1 ? "paper" : "papers"}` : ""}`}
                  className={`sticky top-0 z-20 ${DAY_COL} border-b border-gray-200 bg-gray-50 px-0 py-0 text-center font-normal dark:border-gray-800 dark:bg-gray-900`}
                >
                  <button
                    type="button"
                    onClick={() => onDay(d.date)}
                    aria-label={`Times of ${dayLabel(d.date)}`}
                    className="block w-full cursor-pointer py-1.5 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:hover:bg-white/[0.05]"
                  >
                    <span className="block text-xs font-medium leading-tight text-gray-700 dark:text-gray-300">{dayLabel(d.date)}</span>
                    <span className="block text-[11px] leading-tight text-gray-500 dark:text-gray-400">{weekdayShort(d.date)}</span>
                    <span className="block text-[10px] leading-tight tracking-wider text-gray-400 dark:text-gray-500">M A</span>
                  </button>
                </th>
              ))}
              <th scope="col" className={`sticky top-0 z-20 ${DUTIES_COL} border-b border-gray-200 bg-gray-50 px-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400`} title="Sessions of duty (morning and afternoon each count one)">
                Duties
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.title} title={g.title} people={g.people} days={days} cells={cells} roles={roles} active={active} firstId={rowIds[0]} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className={`sticky bottom-0 left-0 z-30 ${NAME_COL} border-r border-t border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-xs font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400`}>
                Sessions each day
              </th>
              {days.map((d) => {
                const t = perDay[d.date];
                return (
                  <td
                    key={d.date}
                    title={`${dayLabel(d.date)}: ${t?.morning ?? 0} in the morning, ${t?.afternoon ?? 0} in the afternoon`}
                    className={`sticky bottom-0 z-20 ${DAY_COL} border-t border-gray-200 bg-gray-50 py-1.5 text-center text-xs tabular-nums text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400`}
                  >
                    {t ? t.morning + t.afternoon : ""}
                  </td>
                );
              })}
              <td className={`sticky bottom-0 z-20 ${DUTIES_COL} border-t border-gray-200 bg-gray-50 py-1.5 text-center text-xs font-medium tabular-nums text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300`}>{total}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {pop && popDay && popPerson && (
        <DutyCellPopover
          key={`${pop.staffId}|${pop.date}`}
          name={popPerson.name}
          day={popDay}
          cell={popCell}
          roles={roles}
          rect={pop.rect}
          defaultRole={defaultRole(popPerson, roles)}
          onSession={(s) => edit((c) => setDuty(c, ctx, pop.staffId, pop.date, s))}
          onOther={(note) => edit((c) => setOther(c, pop.staffId, pop.date, note))}
          onRole={(r) => edit((c) => setRole(c, pop.staffId, pop.date, r))}
          onClear={() => edit((c) => putCell(c, pop.staffId, pop.date, null))}
          onClose={closePop}
        />
      )}
    </>
  );
}

interface GroupProps {
  title: string;
  people: Staff[];
  days: DutyDay[];
  cells: Cells;
  roles: string[];
  active: { staffId: string; date: string } | null;
  firstId: string | undefined;
}

/** A group title line and the people under it. */
function GroupRows({ title, people, days, cells, roles, active, firstId }: GroupProps) {
  return (
    <>
      <tr>
        <td colSpan={days.length + 2} className="sticky left-0 border-b border-gray-100 bg-gray-50/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          {title} ({people.length})
        </td>
      </tr>
      {people.map((p) => (
        <GridRow key={p.staffId} person={p} row={cells[p.staffId]} days={days} roles={roles} activeDate={active?.staffId === p.staffId ? active.date : null} entry={!active && p.staffId === firstId} />
      ))}
    </>
  );
}
