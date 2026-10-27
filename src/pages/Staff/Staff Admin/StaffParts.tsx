import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import Checkbox from "../../../components/form/input/Checkbox";
import { STAFF_TITLES } from "../../../services/StaffService";
import type { StaffSave } from "../../../services/StaffService";

/** Shared look of the plain text boxes and drop-downs on the Staff Master screen. */
export const controlClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

/** Keyboard focus ring for buttons that are not the shared Button. */
export const focusRing = "focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden";

/** The inside of a modal: heading, one plain line, a close button, then the content. Esc closes (the Modal handles it). */
export function ModalShell({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={titleId} className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white ${focusRing}`}
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: (props: { id: string; "aria-describedby"?: string }) => ReactNode;
}

/** A visible label above its control. */
function Field({ label, required, hint, className = "", children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-error-500">
            *
          </span>
        )}
      </label>
      {children({ id, "aria-describedby": hint ? hintId : undefined })}
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

// Names: letters, spaces, dot, apostrophe and hyphen (D'Souza, K. Patil, Rao-Shah).
const NAME = /^[A-Za-z .'-]*$/;

interface ChoiceList {
  value: string;
  label: string;
}

interface StaffFormProps {
  initial: StaffSave;
  isEdit: boolean;
  departments: ChoiceList[];
  designations: ChoiceList[];
  /** Saves; resolves to null when done, or the reason it failed. */
  onSave: (form: StaffSave) => Promise<string | null>;
  onCancel: () => void;
}

/** The add / edit form of one person: Name, Contact, Work, and an optional "external professor" block. */
export function StaffForm({ initial, isEdit, departments, designations, onSave, onCancel }: StaffFormProps) {
  const [f, setF] = useState<StaffSave>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<StaffSave>) => setF((x) => ({ ...x, ...patch }));

  const submit = async () => {
    if (saving) return;
    const missing = [
      !f.title && "title",
      !f.firstName.trim() && "first name",
      !f.email.trim() && "email",
      !f.isExternal && !f.employeeCode.trim() && "employee ID",
      f.isExternal && !f.externalCollege.trim() && "their college",
    ].filter(Boolean);
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(", ")}.`);
      return;
    }
    setSaving(true);
    setError("");
    const reason = await onSave(f.isExternal ? f : { ...f, externalCollege: "", externalCity: "" });
    setSaving(false);
    if (reason) setError(reason);
  };

  // Enter in a text box saves, like pressing Save.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT" && (e.target as HTMLInputElement).type !== "checkbox") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div onKeyDown={onKeyDown} className="space-y-6">
      <Section title="Name">
        <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-4">
          <Field label="Title" required>
            {(p) => (
              <div className="relative">
                <select autoFocus {...p} aria-required="true" value={f.title} onChange={(e) => set({ title: e.target.value })} className={`${controlClass} appearance-none pr-10`}>
                  <option value="" disabled>
                    Choose
                  </option>
                  {STAFF_TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              </div>
            )}
          </Field>
          <Field label="First name" required>
            {(p) => <input {...p} aria-required="true" value={f.firstName} maxLength={50} onChange={(e) => NAME.test(e.target.value) && set({ firstName: e.target.value })} className={controlClass} />}
          </Field>
          <Field label="Middle name">
            {(p) => <input {...p} value={f.middleName} maxLength={50} onChange={(e) => NAME.test(e.target.value) && set({ middleName: e.target.value })} className={controlClass} />}
          </Field>
          <Field label="Last name">
            {(p) => <input {...p} value={f.lastName} maxLength={50} onChange={(e) => NAME.test(e.target.value) && set({ lastName: e.target.value })} className={controlClass} />}
          </Field>
        </div>
      </Section>

      <Section title="Contact">
        <Field label="Email" required hint="Their own address: letters are sent here.">
          {(p) => <input {...p} type="email" aria-required="true" value={f.email} maxLength={256} onChange={(e) => set({ email: e.target.value })} className={controlClass} />}
        </Field>
        <Field label="Employee ID" required={!f.isExternal} hint={f.isExternal ? "Optional for a professor of another college." : undefined}>
          {(p) => (
            <input
              {...p}
              aria-required={!f.isExternal}
              value={f.employeeCode}
              maxLength={30}
              onChange={(e) => /^[A-Za-z0-9/-]*$/.test(e.target.value) && set({ employeeCode: e.target.value.toUpperCase() })}
              className={controlClass}
            />
          )}
        </Field>
      </Section>

      <Section title="Work">
        <Field label="Department">
          {(p) => (
            <div className="relative">
              <select {...p} value={f.departmentId ?? ""} onChange={(e) => set({ departmentId: e.target.value || null })} className={`${controlClass} appearance-none pr-10`}>
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            </div>
          )}
        </Field>
        <Field label="Designation">
          {(p) => (
            <div className="relative">
              <select {...p} value={f.designationId ?? ""} onChange={(e) => set({ designationId: e.target.value || null })} className={`${controlClass} appearance-none pr-10`}>
                <option value="">None</option>
                {designations.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            </div>
          )}
        </Field>
      </Section>

      <div className="space-y-4">
        <Checkbox label="External professor (another college)" checked={f.isExternal} onChange={(v) => set({ isExternal: v })} className="focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden" />
        {f.isExternal && (
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 dark:bg-white/[0.03]">
            <Field label="College" required>
              {(p) => <input {...p} aria-required="true" value={f.externalCollege} maxLength={200} onChange={(e) => set({ externalCollege: e.target.value })} className={controlClass} />}
            </Field>
            <Field label="City">
              {(p) => <input {...p} value={f.externalCity} maxLength={100} onChange={(e) => set({ externalCity: e.target.value })} className={controlClass} />}
            </Field>
          </div>
        )}
        {isEdit && (
          <div>
            <Checkbox label="Still at the college" checked={f.isActive} onChange={(v) => set({ isActive: v })} className="focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden" />
            {!f.isActive && <p className="mt-1.5 pl-8 text-xs text-gray-500 dark:text-gray-400">They stay in the list as “Left”, and their old letters are kept.</p>}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel} disabled={saving} className={focusRing}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving} className={focusRing}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
