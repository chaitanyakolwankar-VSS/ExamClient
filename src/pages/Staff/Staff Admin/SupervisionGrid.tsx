import { useEffect, useRef } from "react";
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
  detail: string;
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
  onToggleColumn: (slot: number) => void;
  onBulkRole: (role: string) => void;
}

const selectClass =
  "h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const head = "sticky top-0 border-b border-gray-200 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400";

/** A header checkbox that shows "some ticked" as a dash. */
function ColumnCheck({ checked, some, disabled, label, onChange }: { checked: boolean; some: boolean; disabled: boolean; label: string; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = some && !checked;
  }, [some, checked]);
  return <input ref={ref} type="checkbox" checked={checked} disabled={disabled} onChange={onChange} aria-label={label} title={disabled ? "Choose a role for someone first" : label} className="size-4 cursor-pointer accent-brand-500 disabled:cursor-not-allowed disabled:opacity-40" />;
}

/**
 * Staff down the side, one column per date and time of the exam. The name column and the header row stay in
 * view while the grid scrolls inside its card.
 */
export default function SupervisionGrid({ people, rows, slots, roles, slotCounts, onRole, onToggle, onToggleColumn, onBulkRole }: Props) {
  // A column's header box acts on the rows shown that already have a role.
  const eligible = people.filter((p) => !p.orphan && rows[p.id]?.role);

  return (
    <div className="max-h-[70vh] min-w-0 overflow-auto rounded-b-2xl overscroll-contain">
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th scope="col" className={`${head} sticky left-0 top-0 z-30 min-w-[11.5rem] border-r px-3 text-left`}>
              Staff
            </th>
            <th scope="col" className={`${head} z-20 min-w-[9.5rem] text-left`}>
              <span className="block pb-1">Role</span>
              <select
                value=""
                onChange={(e) => onBulkRole(e.target.value)}
                aria-label="Give every person shown with no role this role"
                title="Give everyone shown with no role this role"
                className={selectClass}
              >
                <option value="">Set all empty…</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </th>
            {slots.map((s, i) => {
              const ticked = eligible.filter((p) => rows[p.id].slots.has(i)).length;
              const label = `Tick ${s.date} ${s.time} for everyone shown with a role`;
              return (
                <th key={i} scope="col" className={`${head} z-20 min-w-[5.75rem] max-w-[7rem] text-center`} title={`${s.date} ${s.time}: ${s.papers} paper${s.papers === 1 ? "" : "s"}${s.branches.length ? ` (${s.branches.join(", ")})` : ""}`}>
                  <div className="flex flex-col items-center gap-1">
                    <ColumnCheck checked={eligible.length > 0 && ticked === eligible.length} some={ticked > 0} disabled={eligible.length === 0} label={label} onChange={() => onToggleColumn(i)} />
                    <span className="block font-semibold leading-tight text-gray-800 dark:text-white/90">{s.date}</span>
                    <span className="block text-[11px] font-normal leading-tight">{s.time}</span>
                    <span className={`mt-0.5 rounded-full px-2 py-px text-[11px] font-semibold ${slotCounts[i] > 0 ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-500"}`} aria-label={`${slotCounts[i]} assigned`}>
                      {slotCounts[i]}
                    </span>
                  </div>
                </th>
              );
            })}
            <th scope="col" className={`${head} z-20 min-w-[4rem] text-center`}>
              Duties
            </th>
            <th scope="col" className={`${head} z-20 min-w-[11rem] text-left`}>
              Letter no.
            </th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => {
            const row = rows[p.id];
            const assigned = !!row?.role && row.slots.size > 0;
            const tint = assigned ? "bg-brand-25 dark:bg-brand-500/[0.07]" : "";
            const cell = "border-b border-gray-100 dark:border-gray-800";
            return (
              <tr key={p.id} className="group">
                <th scope="row" className={`${cell} sticky left-0 z-10 min-w-[11.5rem] max-w-[14rem] border-r border-r-gray-200 px-3 py-1.5 text-left font-normal dark:border-r-gray-800 ${assigned ? "bg-brand-25 dark:bg-gray-900" : "bg-white dark:bg-gray-900"}`}>
                  <span className={`block truncate text-sm ${assigned ? "font-semibold" : "font-medium"} text-gray-800 dark:text-white/90`} title={p.name}>
                    {p.name}
                  </span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400" title={p.detail}>
                    {p.detail || " "}
                  </span>
                </th>
                <td className={`${cell} ${tint} px-2 py-1.5`}>
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
                    <label className={`flex h-full min-h-11 w-full items-center justify-center ${p.orphan ? "cursor-not-allowed" : "cursor-pointer hover:bg-brand-50/70 dark:hover:bg-white/[0.04]"}`}>
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
                <td className={`${cell} ${tint} px-2 text-center tabular-nums text-gray-700 dark:text-gray-300`}>{row?.slots.size || ""}</td>
                <td className={`${cell} ${tint} px-3 py-1.5 text-xs`}>
                  {p.letterNo && (
                    <span className={`font-mono ${assigned || p.orphan ? "text-gray-600 dark:text-gray-400" : "text-gray-400 line-through dark:text-gray-600"}`} title={assigned || p.orphan ? undefined : "This letter is cancelled when you save"}>
                      {p.letterNo}
                    </span>
                  )}
                  {p.orphan && <span className="mt-0.5 block text-warning-600 dark:text-orange-300">No longer on the staff list. Cancelled on save.</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
