import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";
import type { Staff } from "../../../services/StaffService";

interface Props {
  label: string;
  /** Name as the letter prints it; "" = nothing chosen. */
  value: string;
  /** Called with the picked person, or null when cleared / typed by hand. */
  onChange: (name: string, person: Staff | null) => void;
  staff: Staff[];
  loading?: boolean;
  placeholder?: string;
}

const box =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:text-white";

const subtitle = (s: Staff) =>
  s.isExternal
    ? `External · ${[s.externalCollege, s.externalCity].filter(Boolean).join(", ") || "college not set"}`
    : [s.employeeCode, s.designation].filter(Boolean).join(" · ") || "Own staff";

/** Searchable picker over Staff Master (active staff), with a "type a name instead" fallback. */
export default function StaffSelect({ label, value, onChange, staff, loading, placeholder = "Search name, ID or college" }: Props) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [manual, setManual] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff
      .filter((s) => s.isActive)
      .filter(
        (s) =>
          !q ||
          [s.name, s.employeeCode, s.externalCollege, s.externalCity, s.department].some((t) => t?.toLowerCase().includes(q)),
      )
      .slice(0, 50);
  }, [staff, query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (s: Staff) => {
    setQuery("");
    setOpen(false);
    onChange(s.name, s);
  };

  const clear = () => {
    setQuery("");
    onChange("", null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && matches[active]) {
        e.preventDefault();
        pick(matches[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className="relative w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>

      {manual ? (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, null)}
          placeholder="Type a name"
          className={box}
        />
      ) : value ? (
        <div className={`${box} flex items-center justify-between gap-2`}>
          <span className="truncate">{value}</span>
          <button
            type="button"
            onClick={clear}
            aria-label={`Clear ${label}`}
            className="shrink-0 rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <>
          <input
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={open && matches[active] ? `${id}-opt-${active}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={loading ? "Loading staff..." : placeholder}
            className={box}
          />
          {open && (
            <ul
              id={`${id}-list`}
              role="listbox"
              aria-label={label}
              className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
              {matches.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">{loading ? "Loading..." : "No matching staff"}</li>
              ) : (
                matches.map((s, i) => (
                  <li
                    key={s.staffId}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(s);
                    }}
                    className={`cursor-pointer px-3 py-1.5 ${i === active ? "bg-brand-50 dark:bg-gray-800" : ""}`}
                  >
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">{s.name}</div>
                    <div className="text-xs text-gray-500">{subtitle(s)}</div>
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}

      <p className="mt-1 text-xs text-gray-500">
        {manual ? (
          <button type="button" onClick={() => {
              setManual(false);
              onChange("", null);
            }} className="text-brand-500 hover:underline">
            Pick from Staff Master instead
          </button>
        ) : (
          <>
            Not on the list?{" "}
            <Link to="/Staff/StaffMaster" target="_blank" className="text-brand-500 hover:underline">
              Add them in Staff Master
            </Link>
            {" · "}
            <button
              type="button"
              onClick={() => {
                setManual(true);
              }}
              className="text-brand-500 hover:underline"
            >
              type a name instead
            </button>
          </>
        )}
      </p>
    </div>
  );
}
