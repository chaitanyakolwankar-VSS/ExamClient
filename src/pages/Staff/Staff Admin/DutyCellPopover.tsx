import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DutyDay, DutySession } from "../../../services/StaffLetterService";
import { weekdayShort, dayLabel } from "./dutyModel";
import type { Cell } from "./dutyModel";
import { rowSelectClass } from "./LetterPageParts";

interface Props {
  name: string;
  day: DutyDay;
  cell: Cell | undefined;
  roles: string[];
  /** Where the clicked cell is on the screen. */
  rect: DOMRect;
  /** The role a new duty would get. */
  defaultRole: string;
  onSession: (session: DutySession) => void;
  onOther: (note: string) => void;
  onRole: (role: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const WIDTH = 288;
const HEIGHT = 264;

const choice = (active: boolean) =>
  `rounded-md px-2 py-1.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-40 ${
    active ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]"
  }`;

/** The small panel of one chart cell: morning / afternoon / both, other work, the role. Every click changes the chart at once. */
export default function DutyCellPopover({ name, day, cell, roles, rect, defaultRole, onSession, onOther, onRole, onClear, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState(cell?.note ?? "");
  const kind = cell?.kind;

  // A click anywhere else closes it (and still reaches what was clicked); Escape closes it too.
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [onClose]);

  useEffect(() => {
    box.current?.querySelector<HTMLElement>("button:not(:disabled)")?.focus({ preventScroll: true });
  }, []);

  // The page's visible width, without the scroll bar, so the panel of the last day stays on screen.
  const left = Math.min(Math.max(8, rect.left), document.documentElement.clientWidth - WIDTH - 8);
  const below = rect.bottom + 6;
  const top = below + HEIGHT > window.innerHeight ? Math.max(8, rect.top - HEIGHT - 6) : below;

  const commitNote = () => {
    if (kind === "other" && note !== (cell?.note ?? "")) onOther(note);
  };

  const session = (s: DutySession, label: string, time?: string | null) => (
    <button key={s} type="button" aria-pressed={kind === "duty" && cell?.session === s} onClick={() => onSession(s)} className={choice(kind === "duty" && cell?.session === s)} title={time === undefined ? undefined : (time ?? "No time set")}>
      {label}
    </button>
  );

  // On the page itself: a parent of the grid may move fixed elements, and the panel is placed by screen position.
  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-label={`Duty of ${name} on ${dayLabel(day.date)}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          commitNote();
          onClose();
        }
      }}
      style={{ left, top, width: WIDTH }}
      className="fixed z-[100] rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{name}</p>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        {weekdayShort(day.date)} {dayLabel(day.date)}
        {day.morning && <> · morning {day.morning}</>}
        {day.afternoon && <> · afternoon {day.afternoon}</>}
      </p>

      <div className="grid grid-cols-3 gap-1">
        {session("M", "Morning", day.morning)}
        {session("A", "Afternoon", day.afternoon)}
        {session("MA", "Both")}
      </div>
      <div className="mt-1">
        <button type="button" aria-pressed={kind === "other"} onClick={() => onOther(note)} className={`w-full ${choice(kind === "other")}`} title="Other work that day, written on the letter">
          Other work
        </button>
      </div>

      {kind === "other" && (
        <input
          autoFocus
          value={note}
          maxLength={100}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commitNote}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitNote();
              onClose();
            }
          }}
          placeholder="What work? e.g. Exam cell"
          aria-label="Other work"
          className="mt-2 h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
        />
      )}

      <label className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
        Role
        <select
          value={kind === "duty" ? (cell?.role ?? defaultRole) : defaultRole}
          disabled={kind !== "duty"}
          onChange={(e) => onRole(e.target.value)}
          className={`${rowSelectClass} mt-0.5 min-w-0`}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            onClear();
            onClose();
          }}
          disabled={!cell}
          className="rounded-md px-1.5 py-0.5 text-sm font-medium text-error-600 hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-error-400 dark:hover:bg-white/[0.05]"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            commitNote();
            onClose();
          }}
          className="rounded-md px-1.5 py-0.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-white/[0.05]"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}
