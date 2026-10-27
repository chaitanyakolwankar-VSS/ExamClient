import { useState } from "react";
import Swal from "sweetalert2";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import { StaffService } from "../../../services/StaffService";
import type { StaffOption, StaffOptionKind } from "../../../services/StaffService";

interface Props {
  options: StaffOption[];
  onChanged: () => Promise<void> | void;
  reason: (err: unknown, fallback: string) => string;
}

const KINDS: { kind: StaffOptionKind; title: string; hint: string; example: string }[] = [
  { kind: "Department", title: "Departments", hint: "Where each person works.", example: "e.g. Computer Engineering" },
  { kind: "Designation", title: "Designations", hint: "Their post at the college.", example: "e.g. Assistant Professor" },
];

const inputClass =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90";

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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {KINDS.map(({ kind, title, hint, example }) => {
        const items = options.filter((o) => o.kind === kind);
        return (
          <section key={kind} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <header className="border-b border-gray-100 px-4 py-3 sm:px-5 dark:border-gray-800">
              <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{hint} The staff sheet also adds new ones.</p>
            </header>
            <div className="p-4 sm:p-5">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  add(kind);
                }}
              >
                <input
                  value={adding[kind] ?? ""}
                  onChange={(e) => setAdding((a) => ({ ...a, [kind]: e.target.value }))}
                  maxLength={100}
                  placeholder={example}
                  aria-label={`New ${kind.toLowerCase()}`}
                  className={inputClass}
                />
                <Button size="sm" disabled={busy || !(adding[kind] ?? "").trim()} startIcon={<Plus className="size-4" />}>
                  Add
                </Button>
              </form>

              {items.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">None yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((o) => (
                    <li key={o.id} className="flex items-center gap-2 py-2">
                      {renaming?.id === o.id ? (
                        <form
                          className="flex flex-1 gap-1"
                          onSubmit={(e) => {
                            e.preventDefault();
                            rename();
                          }}
                        >
                          <input autoFocus value={renaming.name} maxLength={100} onChange={(e) => setRenaming({ id: o.id, name: e.target.value })} aria-label="New name" className={inputClass} />
                          <button type="submit" disabled={busy} title="Save" aria-label="Save name" className="rounded-lg p-2 text-success-600 hover:bg-gray-100 dark:hover:bg-white/[0.05]">
                            <Check className="size-4" />
                          </button>
                          <button type="button" onClick={() => setRenaming(null)} title="Cancel" aria-label="Cancel rename" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]">
                            <X className="size-4" />
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-white/90">{o.name}</span>
                          <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">{o.staffCount} staff</span>
                          <button type="button" onClick={() => setRenaming({ id: o.id, name: o.name })} title="Rename" aria-label={`Rename ${o.name}`} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-white/[0.05]">
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(o)}
                            disabled={o.staffCount > 0}
                            title={o.staffCount > 0 ? "In use: change those staff first" : "Delete"}
                            aria-label={`Delete ${o.name}`}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.05]"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
