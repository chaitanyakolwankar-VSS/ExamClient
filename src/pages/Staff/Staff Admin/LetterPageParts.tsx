import { useState } from "react";
import { CheckCircle2, Save, Search, Settings2, X } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import { Modal } from "../../../components/ui/modal";
import { useAuth } from "../../../context/AuthContext";
import type { ExamGroup } from "../../../services/StaffLetterService";
import LetterSettings from "./LetterSettings";
import { apiReason, letterInputClass } from "./letterHelpers";

interface HeaderProps {
  title: string;
  /** One short grey line under the title (what is on the screen, or what to do next). */
  info: string;
  exams: ExamGroup[];
  examId: string;
  onExam: (id: string) => void;
  letterDate: string;
  onLetterDate: (date: string) => void;
}

/**
 * Title and one grey line on the left; the Exam, the Letter date and (for admins) a Letter settings button on the right.
 * Under a small screen the controls wrap below the title.
 */
export function LetterPageHeader({ title, info, exams, examId, onExam, letterDate, onLetterDate }: HeaderProps) {
  const { isAdmin } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{info}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 pt-2 sm:w-auto">
          {/* The floating labels sit on the page, not on a card, so they get the page colour. */}
          <div className="w-full sm:w-72 [&_label]:bg-gray-50 dark:[&_label]:bg-gray-900">
            <Select label="Exam" placeholder="Choose exam" options={exams.map((e) => ({ value: e.examId, label: e.title }))} value={examId} onChange={onExam} />
          </div>
          <div className="relative w-40" title="Letters already made keep their own date.">
            <input type="date" value={letterDate} onChange={(e) => onLetterDate(e.target.value)} aria-label="Letter date" className={letterInputClass} />
            <span className="pointer-events-none absolute left-2.5 top-0 -translate-y-1/2 bg-gray-50 px-1.5 text-xs text-brand-500 dark:bg-gray-900 dark:text-gray-400">Letter date</span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title="Letter settings"
              aria-label="Letter settings"
              className="flex size-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:border-gray-700 dark:bg-transparent dark:hover:bg-white/[0.05]"
            >
              <Settings2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} className="m-4 max-w-[640px]">
        <div role="dialog" aria-modal="true" aria-label="Letter settings">
          <LetterSettings canEdit={isAdmin} reason={apiReason} embedded />
        </div>
      </Modal>
    </>
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

/** One search box with a magnifier. */
export function LetterSearch({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-8 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
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
