import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import type { Staff } from "../../../services/StaffService";

/** Someone already chosen, shown as a chip. */
export interface PickedPerson {
  id: string;
  name: string;
  external: boolean;
  /** Their saved letter's number, when they have one. */
  letterNo: string;
}

interface Props {
  /** Says what the list is for, e.g. "Examiner for CE601", so screen readers can tell the pickers apart. */
  label: string;
  staff: Staff[];
  chosen: PickedPerson[];
  /** People who must not be offered (already chosen somewhere else in the row). */
  blocked: string[];
  onAdd: (staffId: string) => void;
  onRemove: (staffId: string) => void;
}

const PANEL_WIDTH = 256;
const PANEL_HEIGHT = 280;
const MAX_SHOWN = 100;

/** The line of small grey text under a name in the list. */
const detailOf = (s: Staff) =>
  s.isExternal ? ["External", s.externalCollege].filter(Boolean).join(" · ") : [s.employeeCode, s.designation].filter(Boolean).join(" · ");

/**
 * The people chosen for one job, as removable chips, and an Add button that opens a small searchable list.
 * In the list: type to narrow, arrow keys to move, Enter to pick, Esc (or a click outside) to close.
 */
export default function StaffPicker({ label, staff, chosen, blocked, onAdd, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const options = useMemo(() => {
    if (!open) return [];
    const taken = new Set([...chosen.map((c) => c.id), ...blocked]);
    const q = query.trim().toLowerCase();
    return staff.filter((s) => !taken.has(s.staffId) && (!q || `${s.name} ${s.employeeCode ?? ""} ${s.externalCollege ?? ""} ${s.department ?? ""}`.toLowerCase().includes(q)));
  }, [open, staff, chosen, blocked, query]);
  const shown = options.slice(0, MAX_SHOWN);

  const openList = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8));
      // Opens upward only when there is no room below and more room above.
      setPlace(below < PANEL_HEIGHT && rect.top > below ? { left, bottom: window.innerHeight - rect.top + 4 } : { left, top: rect.bottom + 4 });
    }
    setQuery("");
    setActive(0);
    setOpen(true);
  };

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  const pick = (s: Staff | undefined) => {
    if (!s) return;
    onAdd(s.staffId);
    close(true);
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // A click outside closes the list; so does scrolling or resizing the page (the list would drift away from its button).
  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    const scrolled = (e: Event) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const closeNow = () => setOpen(false);
    document.addEventListener("mousedown", outside);
    window.addEventListener("scroll", scrolled, true);
    window.addEventListener("resize", closeNow);
    return () => {
      document.removeEventListener("mousedown", outside);
      window.removeEventListener("scroll", scrolled, true);
      window.removeEventListener("resize", closeNow);
    };
  }, [open]);

  // Keep the highlighted person in view while arrowing through a long list.
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(shown[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === "Tab") {
      e.preventDefault();
      close(true);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {chosen.map((c) => (
        <span
          key={c.id}
          title={c.letterNo ? `${c.name} · ${c.letterNo}` : c.name}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-2 pr-0.5 text-xs text-gray-800 dark:bg-white/[0.06] dark:text-white/90"
        >
          <span>
            {c.name}
            {c.external && <span className="text-gray-500 dark:text-gray-400"> · External</span>}
          </span>
          {c.letterNo && <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{c.letterNo}</span>}
          <button
            type="button"
            onClick={() => onRemove(c.id)}
            aria-label={`Remove ${c.name} (${label})`}
            title="Remove"
            className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Add ${label}`}
        className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-brand-500 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:text-brand-400 dark:hover:bg-white/[0.05]"
      >
        <Plus className="size-3.5" aria-hidden="true" /> Add
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", left: place.left, top: place.top, bottom: place.bottom, width: PANEL_WIDTH }}
            className="z-50 rounded-lg border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
          >
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={shown.length > 0 ? `${listId}-${active}` : undefined}
              aria-label={`Find ${label}`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Name, ID or college"
              autoComplete="off"
              className="h-8 w-full rounded-md border border-gray-300 bg-transparent px-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
            />
            <ul id={listId} role="listbox" aria-label={label} style={{ maxHeight: PANEL_HEIGHT - 56 }} className="mt-1.5 overflow-y-auto overscroll-contain">
              {shown.map((s, i) => (
                <li
                  key={s.staffId}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                  onMouseMove={() => i !== active && setActive(i)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 ${i === active ? "bg-brand-50 dark:bg-white/[0.06]" : ""}`}
                >
                  <span className="block truncate text-sm leading-tight text-gray-800 dark:text-white/90">{s.name}</span>
                  {detailOf(s) && <span className="block truncate text-[11px] leading-tight text-gray-500 dark:text-gray-400">{detailOf(s)}</span>}
                </li>
              ))}
            </ul>
            {shown.length === 0 && <p className="px-2.5 py-2 text-sm text-gray-500 dark:text-gray-400">{query.trim() ? "No one matches." : "No one left to add."}</p>}
            {options.length > shown.length && <p className="px-2.5 pt-1.5 text-xs text-gray-500 dark:text-gray-400">Keep typing to narrow the list.</p>}
          </div>,
          document.body,
        )}
    </div>
  );
}
