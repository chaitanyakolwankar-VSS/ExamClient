import { useState } from "react";
import Swal from "sweetalert2";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { StaffService } from "../../../services/StaffService";
import type { StaffOption, StaffOptionKind } from "../../../services/StaffService";
import { controlClass, focusRing } from "./StaffParts";

interface Props {
  options: StaffOption[];
  onChanged: () => Promise<void> | void;
  reason: (err: unknown, fallback: string) => string;
}

const KINDS: { kind: StaffOptionKind; title: string; example: string }[] = [
  { kind: "Department", title: "Departments", example: "New department, e.g. Computer Engineering" },
  { kind: "Designation", title: "Designations", example: "New designation, e.g. Assistant Professor" },
];

const iconButton = `rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05] ${focusRing}`;

/** The college's department and designation lists: the drop-downs on Staff Master and in the staff sheet. */
export default function StaffOptionLists({ options, onChanged, reason }: Props) {
  const [adding, setAdding] = useState<Record<string, string>>({});
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    try {
      await action();
      await onChanged();
      return true;
    } catch (err) {
      Swal.fire("Lists", reason(err, fallback), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (kind: StaffOptionKind) => {
    const name = (adding[kind] ?? "").trim();
    if (!name) return;
    if (await run(() => StaffService.addOption(kind, name), "Could not add.")) setAdding((a) => ({ ...a, [kind]: "" }));
  };

  const rename = async () => {
    if (!renaming || !renaming.name.trim()) return;
    if (await run(() => StaffService.renameOption(renaming.id, renaming.name.trim()), "Could not rename.")) setRenaming(null);
  };

  const remove = async (o: StaffOption) => {
    const ok = await Swal.fire({ title: `Delete ${o.name}?`, icon: "warning", showCancelButton: true, confirmButtonText: "Delete", confirmButtonColor: "#d92d20" });
    if (ok.isConfirmed) await run(() => StaffService.removeOption(o.id), "Could not delete.");
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {KINDS.map(({ kind, title, example }) => {
        const items = options.filter((o) => o.kind === kind);
        const value = adding[kind] ?? "";
        return (
          <section key={kind} aria-label={title} className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h4>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                add(kind);
              }}
            >
              <input
                value={value}
                onChange={(e) => setAdding((a) => ({ ...a, [kind]: e.target.value }))}
                maxLength={100}
                placeholder={example}
                aria-label={`New ${kind.toLowerCase()}`}
                className={`${controlClass} min-w-0`}
              />
              <button
                type="submit"
                disabled={busy || !value.trim()}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300 ${focusRing}`}
              >
                <Plus className="size-4" aria-hidden="true" /> Add
              </button>
            </form>

            {items.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">None yet. Add the first one above.</p>
            ) : (
              <ul className="mt-3 max-h-[45vh] divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 px-3 dark:divide-gray-800 dark:border-gray-800">
                {items.map((o) => (
                  <li key={o.id} className="flex items-center gap-1 py-1.5">
                    {renaming?.id === o.id ? (
                      <form
                        className="flex min-w-0 flex-1 items-center gap-1"
                        onSubmit={(e) => {
                          e.preventDefault();
                          rename();
                        }}
                      >
                        <input autoFocus value={renaming.name} maxLength={100} onChange={(e) => setRenaming({ id: o.id, name: e.target.value })} aria-label={`New name for ${o.name}`} className={`${controlClass} h-9 min-w-0`} />
                        <button type="submit" disabled={busy} title="Save name" aria-label="Save name" className={`${iconButton} text-success-600 dark:text-success-400`}>
                          <Check className="size-4" />
                        </button>
                        <button type="button" onClick={() => setRenaming(null)} title="Cancel" aria-label="Cancel rename" className={iconButton}>
                          <X className="size-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-white/90" title={o.name}>
                          {o.name}
                        </span>
                        <span className="shrink-0 pr-1 text-xs tabular-nums text-gray-500 dark:text-gray-400">{o.staffCount > 0 ? `${o.staffCount} staff` : ""}</span>
                        <button type="button" onClick={() => setRenaming({ id: o.id, name: o.name })} title="Rename" aria-label={`Rename ${o.name}`} className={`${iconButton} hover:text-brand-500`}>
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(o)}
                          disabled={o.staffCount > 0}
                          title={o.staffCount > 0 ? "In use: change those staff first" : "Delete"}
                          aria-label={`Delete ${o.name}`}
                          className={`${iconButton} hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

