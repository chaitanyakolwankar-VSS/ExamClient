import type { DutyDay } from "../../../services/StaffLetterService";
import type { Staff } from "../../../services/StaffService";
import { cellWords, dayLabel, defaultRole, setRole, toggleSession, usualRole } from "./dutyModel";
import type { Cells, Ctx } from "./dutyModel";
import { LetterSummary, TextButton, rowSelectClass, tableCell, tableHead } from "./LetterPageParts";

interface Props {
  day: DutyDay;
  session: "M" | "A";
  staff: Staff[];
  cells: Cells;
  ctx: Ctx;
  edit: (fn: (cells: Cells) => Cells) => void;
}

/** One day and session at a time: tick who is on duty and in what role. Edits the same chart as the Chart view. */
export default function DutyByDate({ day, session, staff, cells, ctx, edit }: Props) {
  const { roles } = ctx;
  const sessionText = session === "M" ? "morning" : "afternoon";

  /** Whether the person is on duty in this session, and the cell if they have other work that day instead. */
  const stateOf = (id: string) => {
    const c = cells[id]?.[day.date];
    if (!c) return { on: false, blocked: false, cell: undefined };
    if (c.kind !== "duty") return { on: false, blocked: true, cell: c };
    return { on: c.session === "MA" || c.session === session, blocked: false, cell: c };
  };

  const toggle = (id: string, on: boolean) => edit((c) => toggleSession(c, ctx, id, day.date, session, on));
  const tickShown = (on: boolean) =>
    edit((c) => {
      let next = c;
      for (const s of staff) next = toggleSession(next, ctx, s.staffId, day.date, session, on);
      return next;
    });

  const onCount = staff.reduce((n, s) => n + (stateOf(s.staffId).on ? 1 : 0), 0);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
        <LetterSummary text={`${onCount} of ${staff.length} shown on duty in the ${sessionText} of ${dayLabel(day.date)}`} />
        <div className="flex items-center gap-1">
          <TextButton onClick={() => tickShown(true)} title="Put everyone in the list below on duty in this session">
            Tick all shown
          </TextButton>
          <TextButton onClick={() => tickShown(false)} title="Take everyone in the list below off duty in this session">
            Clear
          </TextButton>
        </div>
      </div>

      {staff.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No staff match your search.</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th scope="col" className={`${tableHead} w-24`}>
                  On duty
                </th>
                <th scope="col" className={tableHead}>
                  Name
                </th>
                <th scope="col" className={tableHead}>
                  Department
                </th>
                <th scope="col" className={tableHead}>
                  Role
                </th>
                <th scope="col" className={`${tableHead} w-40`}>
                  This day
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const { on, blocked, cell } = stateOf(s.staffId);
                const other = session === "M" ? "A" : "M";
                const days = Object.keys(cells[s.staffId] ?? {}).filter((d) => d !== day.date).length;
                return (
                  <tr key={s.staffId} className={on ? "bg-brand-25/60 dark:bg-brand-500/[0.04]" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}>
                    <td className={tableCell}>
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={blocked}
                        onChange={(e) => toggle(s.staffId, e.target.checked)}
                        aria-label={`${s.name} on duty`}
                        title={blocked ? `${cellWords(cell!)} that day. Clear it in the Chart view to give a duty.` : undefined}
                        className="size-5 cursor-pointer accent-brand-500 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className={tableCell}>
                      <span className="block font-medium text-gray-800 dark:text-white/90">{s.name}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{[s.employeeCode, s.designation].filter(Boolean).join(" · ") || " "}</span>
                    </td>
                    <td className={`${tableCell} text-gray-700 dark:text-gray-300`}>{s.department || "—"}</td>
                    <td className={tableCell}>
                      <select
                        value={on && cell?.role ? cell.role : usualRole(cells, ctx, s.staffId, day.date) || defaultRole(s, roles)}
                        onChange={(e) => edit((c) => setRole(c, s.staffId, day.date, e.target.value))}
                        disabled={!on}
                        aria-label={`Role of ${s.name}`}
                        className={rowSelectClass}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`${tableCell} text-xs text-gray-600 dark:text-gray-400`}>
                      {blocked ? (
                        <span className="text-warning-700 dark:text-orange-300">{cellWords(cell!)}</span>
                      ) : cell?.session === "MA" ? (
                        "Both sessions"
                      ) : cell?.session === other ? (
                        `${other === "M" ? "Morning" : "Afternoon"} duty`
                      ) : days > 0 ? (
                        `${days} other ${days === 1 ? "day" : "days"}`
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
