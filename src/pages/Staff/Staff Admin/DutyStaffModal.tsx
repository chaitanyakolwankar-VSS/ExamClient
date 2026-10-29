import { useMemo, useState } from "react";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import { Modal } from "../../../components/ui/modal";
import type { Staff } from "../../../services/StaffService";
import { isTeaching } from "./dutyModel";
import { LetterSearch, MiniChoice } from "./LetterPageParts";

interface Props {
  /** Active internal staff who are not on the chart yet. */
  candidates: Staff[];
  onAdd: (staffIds: string[]) => void;
  onClose: () => void;
}

type Kind = "all" | "teaching" | "non-teaching";

const KINDS: { value: Kind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "teaching", label: "Teaching" },
  { value: "non-teaching", label: "Non-teaching" },
];

/** Add staff: search and filter the people who are not on the chart yet, tick them, add them all at once. */
export default function DutyStaffModal({ candidates, onAdd, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  const departments = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of candidates) if (s.departmentId && s.department) seen.set(s.departmentId, s.department);
    return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [candidates]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((s) => {
      if (departmentId && s.departmentId !== departmentId) return false;
      if (kind !== "all" && isTeaching(s) !== (kind === "teaching")) return false;
      return !q || `${s.name} ${s.employeeCode ?? ""} ${s.department ?? ""} ${s.designation ?? ""}`.toLowerCase().includes(q);
    });
  }, [candidates, search, departmentId, kind]);

  const allShown = shown.length > 0 && shown.every((s) => picked.has(s.staffId));

  const toggle = (id: string, on: boolean) =>
    setPicked((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleShown = (on: boolean) =>
    setPicked((current) => {
      const next = new Set(current);
      for (const s of shown) {
        if (on) next.add(s.staffId);
        else next.delete(s.staffId);
      }
      return next;
    });

  return (
    <Modal isOpen onClose={onClose} className="m-4 max-w-[640px]">
      <div role="dialog" aria-modal="true" aria-label="Add staff" className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="pr-10">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add staff</h4>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Tick the people who will be on this exam period, then press Add selected. Staff already added are not listed.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LetterSearch value={search} onChange={setSearch} placeholder="Name, ID, department or designation" label="Search staff" />
          <Select options={[{ value: "", label: "All departments" }, ...departments]} placeholder="All departments" value={departmentId} onChange={setDepartmentId} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <MiniChoice label="Teaching or non-teaching" value={kind} options={KINDS} onChange={setKind} />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={allShown} disabled={shown.length === 0} onChange={(e) => toggleShown(e.target.checked)} className="size-4 cursor-pointer accent-brand-500" />
            Select all shown ({shown.length})
          </label>
        </div>

        <div className="max-h-[50vh] overflow-auto overscroll-contain rounded-xl border border-gray-200 dark:border-gray-800">
          {shown.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{candidates.length === 0 ? "Everyone in Staff Master is already on this exam period." : "No staff match your search."}</p>
          ) : (
            <ul>
              {shown.map((s) => (
                <li key={s.staffId} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
                  <label className={`flex cursor-pointer items-center gap-3 px-3 py-1.5 ${picked.has(s.staffId) ? "bg-brand-25/60 dark:bg-brand-500/[0.04]" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}`}>
                    <input type="checkbox" checked={picked.has(s.staffId)} onChange={(e) => toggle(s.staffId, e.target.checked)} className="size-4 shrink-0 cursor-pointer accent-brand-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{s.name}</span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{[s.employeeCode, s.designation, s.department].filter(Boolean).join(" · ") || " "}</span>
                    </span>
                    {!isTeaching(s) && <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">Non-teaching</span>}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
            {picked.size} selected
          </p>
          <div className="flex gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onAdd([...picked])} disabled={picked.size === 0}>
              Add selected
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
