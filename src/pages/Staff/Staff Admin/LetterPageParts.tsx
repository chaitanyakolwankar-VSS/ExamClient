import { useState } from "react";
import { CheckCircle2, ChevronDown, Save, Search, Settings2, X } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import { Modal } from "../../../components/ui/modal";
import { useAuth } from "../../../context/AuthContext";
import type { ExamGroup } from "../../../services/StaffLetterService";
import LetterSettings from "./LetterSettings";
import { apiReason, letterInputClass } from "./letterHelpers";

/** Title and one grey line on the left; for admins a small Letter settings button on the right. */
export function LetterPageHeader({ title, info }: { title: string; info: string }) {
  const { isAdmin } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{info}</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="Letter settings"
            aria-label="Letter settings"
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            <Settings2 className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Letter settings</span>
          </button>
        )}
      </div>
      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} className="m-4 max-w-[640px]">
        <div role="dialog" aria-modal="true" aria-label="Letter settings">
          <LetterSettings canEdit={isAdmin} reason={apiReason} embedded />
        </div>
      </Modal>
    </>
  );
}

/** The Exam drop-down of the filter card. */
export function ExamField({ exams, examId, onExam }: { exams: ExamGroup[]; examId: string; onExam: (id: string) => void }) {
  return <Select label="Exam" placeholder="Select Exam" options={exams.map((e) => ({ value: e.examId, label: e.title }))} value={examId} onChange={onExam} />;
}

/** A date box with its label on the border, like the drop-downs. The default is the date printed on letters made by the next save. */
export function LetterDateField({ value, onChange, label = "Letter date", title = "Letters already made keep their own date." }: { value: string; onChange: (date: string) => void; label?: string; title?: string }) {
  return (
    <div className="relative w-full" title={title}>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={letterInputClass} />
      <span className="pointer-events-none absolute left-2.5 top-0 -translate-y-1/2 bg-white px-1.5 text-xs text-brand-500 dark:bg-gray-900 dark:text-gray-400">{label}</span>
    </div>
  );
}

export interface GroupedOption {
  value: string;
  label: string;
}

/** A drop-down like Select, with the options in titled groups. */
export function GroupedSelect({ label, placeholder, groups, value, onChange }: { label: string; placeholder: string; groups: { title: string; options: GroupedOption[] }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative h-fit w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {groups.map((g) => (
          <optgroup key={g.title} label={g.title}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {value && (
        <span className="pointer-events-none absolute left-2.5 top-0 -translate-y-1/2 bg-white px-1.5 text-xs text-brand-500 dark:bg-gray-900 dark:text-gray-400">{label}</span>
      )}
      <ChevronDown size={22} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
    </div>
  );
}

/** A thin green strip with the result of the last save, under the toolbar. */
export function LetterNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <p role="status" className="flex items-center gap-2 border-b border-success-200 bg-success-50 px-4 py-1.5 text-xs text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded p-0.5 hover:bg-success-100 dark:hover:bg-white/[0.05]">
        <X className="size-3.5" />
      </button>
    </p>
  );
}

/** One search box with a magnifier, the same as Find staff. */
export function LetterSearch({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
      />
    </div>
  );
}

/** What is on the screen, in the toolbar (read out politely when it changes). */
export function LetterSummary({ text }: { text: string }) {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
      {text}
    </p>
  );
}

/** A small text button of the table toolbar ("Tick all shown"). */
export function TextButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-md px-1.5 py-0.5 text-sm font-medium text-brand-500 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:text-brand-400 dark:hover:bg-white/[0.05]"
    >
      {children}
    </button>
  );
}

/** Undo (only when changed) and the one Save button, at the right end of the toolbar. */
export function LetterActions({ dirty, saving, onUndo, onSave }: { dirty: boolean; saving: boolean; onUndo: () => void; onSave: () => void }) {
  return (
    <div className="ml-auto flex items-center gap-2">
      {dirty && (
        <Button size="sm" variant="outline" onClick={onUndo} disabled={saving}>
          Undo
        </Button>
      )}
      <Button size="sm" onClick={onSave} disabled={!dirty || saving} startIcon={<Save className="size-4" />}>
        {saving ? "Saving…" : "Save letters"}
      </Button>
    </div>
  );
}

/** Small pick-one buttons for a table row ("—", "Examiner", "Moderator"), looking like the Choice switch of the email screens. */
export function MiniChoice<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.05]" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden ${
            value === o.value ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Table classes shared by the staff tables, so both screens look alike. */
export const tableHead = "sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400";
export const tableCell = "border-b border-gray-100 px-4 py-2 align-middle dark:border-gray-800";
export const rowSelectClass =
  "h-9 w-full min-w-40 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-white/[0.02]";
