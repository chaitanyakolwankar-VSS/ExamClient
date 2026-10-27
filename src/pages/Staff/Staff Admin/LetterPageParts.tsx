import { useState } from "react";
import { CheckCircle2, Save, Search, Settings2, X } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import { Modal } from "../../../components/ui/modal";
import { useAuth } from "../../../context/AuthContext";
import LetterSettings from "./LetterSettings";
import { apiReason } from "./letterHelpers";

/** Title, one plain line, and (for admins) a small Letter settings button that opens the settings in a window. */
export function LetterPageHeader({ title, intro }: { title: string; intro: string }) {
  const { isAdmin } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{intro}</p>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} startIcon={<Settings2 className="size-4" />}>
            Letter settings
          </Button>
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

/** A green line with the result of the last save. */
export function LetterNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <p role="status" className="flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="rounded p-0.5 hover:bg-success-100 dark:hover:bg-white/[0.05]">
        <X className="size-4" />
      </button>
    </p>
  );
}

/** One search box with a magnifier. */
export function LetterSearch({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative w-full sm:w-80">
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

/** The bar at the bottom of the card: what is on the screen, Undo (only when changed) and the one Save button. */
export function LetterActionBar({ summary, dirty, saving, onUndo, onSave }: { summary: string; dirty: boolean; saving: boolean; onUndo: () => void; onSave: () => void }) {
  return (
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-b-2xl border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5 dark:border-gray-800 dark:bg-gray-900/95">
      <p className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
        {summary}
      </p>
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
    </div>
  );
}
