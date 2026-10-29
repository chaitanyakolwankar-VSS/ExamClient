import type { ReactNode } from "react";
import { FileSpreadsheet, UserPlus, X } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import type { Staff } from "../../../services/StaffService";
import { isTeaching } from "./dutyModel";
import { StepCard } from "./LetterSteps";

/** One person on the chart: a member of staff, or someone who left the college but is still on the chart. */
export interface Member {
  id: string;
  person: Staff | null;
  name: string;
  /** How many days they have something on. */
  days: number;
}

interface Props {
  members: Member[];
  /** People not on the chart yet, by kind (for the quick buttons). */
  availableTeaching: number;
  availableNonTeaching: number;
  onAddStaff: () => void;
  onAddGroup: (teaching: boolean) => void;
  onImport: () => void;
  onRemove: (member: Member) => void;
  footer: ReactNode;
}

/** One group of people with its title; two columns when there is room. */
function Group({ title, people, tone, onRemove }: { title: string; people: Member[]; tone?: "warning"; onRemove: (m: Member) => void }) {
  if (people.length === 0) return null;
  return (
    <div>
      <p className={`mb-0.5 text-xs font-medium uppercase tracking-wide ${tone === "warning" ? "text-warning-700 dark:text-orange-300" : "text-gray-500 dark:text-gray-400"}`}>
        {title} ({people.length})
      </p>
      <ul className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
        {people.map((m) => (
          <li key={m.id} className="flex items-center gap-2 border-b border-gray-100 py-1 dark:border-gray-800">
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90" title={m.name}>
                {m.name}
              </span>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                {m.person ? [m.person.employeeCode, m.person.designation].filter(Boolean).join(" · ") || " " : "No longer in the staff list. Saving removes them."}
              </span>
            </div>
            {m.days > 0 && (
              <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                {m.days} {m.days === 1 ? "day" : "days"}
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(m)}
              title="Take off the list"
              aria-label={`Remove ${m.name}`}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-error-600 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:hover:bg-white/[0.05]"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Step 2: the people who are on duty in this exam period. Starts empty; add them one by one, by group, or from an Excel sheet. */
export default function DutyPeopleStep({ members, availableTeaching, availableNonTeaching, onAddStaff, onAddGroup, onImport, onRemove, footer }: Props) {
  const teaching = members.filter((m) => m.person && isTeaching(m.person));
  const nonTeaching = members.filter((m) => m.person && !isTeaching(m.person));
  const left = members.filter((m) => !m.person);

  return (
    <StepCard number={2} title="Who is on duty" hint="Add only the people who may be given duties in this exam period. You mark their duties in the next step; only people with a duty get a letter." footer={footer}>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAddStaff} startIcon={<UserPlus className="size-4" />} title="Search the staff list and tick the people to add">
          Add staff
        </Button>
        <Button size="sm" variant="outline" onClick={() => onAddGroup(true)} disabled={availableTeaching === 0} title="Add every teaching member of staff who is not on the list yet">
          Add all teaching staff
        </Button>
        <Button size="sm" variant="outline" onClick={() => onAddGroup(false)} disabled={availableNonTeaching === 0} title="Add every non-teaching member of staff who is not on the list yet">
          Add all non-teaching staff
        </Button>
        <span className="text-sm text-gray-400 dark:text-gray-500">or</span>
        <Button size="sm" variant="outline" onClick={onImport} startIcon={<FileSpreadsheet className="size-4" />} title="Upload an Excel sheet; its rows become the people and their duties">
          Import Excel
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Nobody is on this exam period yet. Use Add staff, add a whole group, or import an Excel sheet.</p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto overscroll-contain pr-1">
          <Group title="Teaching staff" people={teaching} onRemove={onRemove} />
          <Group title="Non-teaching staff" people={nonTeaching} onRemove={onRemove} />
          <Group title="Not in the staff list any more" people={left} tone="warning" onRemove={onRemove} />
        </div>
      )}
    </StepCard>
  );
}
