import type { SupervisionSlot } from "../../../services/StaffLetterService";

/** What one staff member is down for: a role and the slots (by position in the exam's slot list). */
export interface DutyRow {
  role: string;
  slots: Set<number>;
}

/** One line of the grid. A person who left (or is external) but still has a letter is shown so it can be cancelled. */
export interface GridPerson {
  id: string;
  name: string;
  designation: string;
  letterNo: string;
  orphan: boolean;
}

interface Props {
  people: GridPerson[];
  rows: Record<string, DutyRow>;
  slots: SupervisionSlot[];
  roles: string[];
  /** Assigned staff in each slot, over everyone (not only the rows shown). */
  slotCounts: number[];
  onRole: (id: string, role: string) => void;
  onToggle: (id: string, slot: number, on: boolean) => void;
}

const selectClass =
  "h-8 w-full rounded-md border border-gray-300 bg-white px-1.5 text-xs text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const head = "sticky top-0 border-b border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400";

/**
 * Staff down the side, one column per date and time of the exam. The name column and the header row stay in
 * view while the grid scrolls inside its card.
 */
export default function SupervisionGrid({ people, rows, slots, roles, slotCounts, onRole, onToggle }: Props) {
  return (
    <div className="max-h-[70vh] min-w-0 overflow-auto overscroll-contain">
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${head} sticky left-0 top-0 z-30 w-56 min-w-56 max-w-56 border-r px-3 text-left`}>
              Name
            </th>
            <th scope="col" className={`${head} z-20 min-w-[9.5rem] text-left`}>
              Role
            </th>
            {slots.map((s, i) => (
              <th key={i} scope="col" className={`${head} z-20 min-w-[4.5rem] text-center normal-case tracking-normal`} title={`${s.papers} paper${s.papers === 1 ? "" : "s"}${s.branches.length ? ` (${s.branches.join(", ")})` : ""}`}>
                <span className="block whitespace-nowrap text-xs font-semibold leading-tight text-gray-800 dark:text-white/90">{s.date}</span>
                <span className="block whitespace-nowrap text-[11px] font-normal leading-tight">{s.time}</span>
                <span className="block whitespace-nowrap text-[10px] font-normal leading-tight text-gray-400 dark:text-gray-500">{slotCounts[i]} assigned</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((p) => {
            const row = rows[p.id];
            const assigned = !!row?.role && row.slots.size > 0;
            const tint = assigned ? "bg-brand-25/60 dark:bg-brand-500/[0.04]" : "";
            const cell = "border-b border-gray-100 dark:border-gray-800";
            const keeps = assigned || p.orphan;
            return (
              <tr key={p.id}>
                <th scope="row" className={`${cell} sticky left-0 z-10 w-56 min-w-56 max-w-56 border-r border-r-gray-200 px-3 py-1 text-left font-normal dark:border-r-gray-800 ${assigned ? "bg-brand-25 dark:bg-gray-900" : "bg-white dark:bg-gray-900"}`}>
                  <span className={`block truncate text-sm leading-4 ${assigned ? "font-semibold" : "font-medium"} text-gray-800 dark:text-white/90`} title={p.name}>
                    {p.name}
                  </span>
                  <span className="flex items-baseline gap-1.5 overflow-hidden whitespace-nowrap text-xs leading-4 text-gray-500 dark:text-gray-400">
                    {p.designation && (
                      <span className="min-w-0 truncate" title={p.designation}>
                        {p.designation}
                      </span>
                    )}
                    {p.letterNo && (
                      <span className={`shrink-0 font-mono text-[10px] ${keeps ? "text-gray-400 dark:text-gray-500" : "text-gray-300 line-through dark:text-gray-600"}`} title={keeps ? p.letterNo : "This letter is cancelled when you save"}>
                        {p.letterNo}
                      </span>
                    )}
                    {p.orphan && <span className="shrink-0 text-warning-600 dark:text-orange-300">Cancelled on save</span>}
                    {!p.designation && !p.letterNo && !p.orphan && <span aria-hidden="true">&nbsp;</span>}
                  </span>
                </th>
                <td className={`${cell} ${tint} px-2 py-1`}>
                  <select value={row?.role ?? ""} onChange={(e) => onRole(p.id, e.target.value)} aria-label={`Role for ${p.name}`} className={selectClass}>
                    {p.orphan ? (
                      <>
                        {row?.role && <option value={row.role}>{row.role}</option>}
                        <option value="">Cancel this letter</option>
                      </>
                    ) : (
                      <>
                        <option value="">No role</option>
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </td>
                {slots.map((s, i) => (
                  <td key={i} className={`${cell} ${tint} p-0`}>
                    <label className={`flex h-full min-h-9 w-full items-center justify-center ${p.orphan ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]"}`}>
                      <input
                        type="checkbox"
                        checked={!!row?.slots.has(i)}
                        disabled={p.orphan}
                        onChange={(e) => onToggle(p.id, i, e.target.checked)}
                        aria-label={`${p.name}, ${s.date} ${s.time}`}
                        className="size-4 cursor-pointer accent-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </label>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
