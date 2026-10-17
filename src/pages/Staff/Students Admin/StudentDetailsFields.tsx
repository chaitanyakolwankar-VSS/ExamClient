import { useId } from "react";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import RadioSm from "../../../components/form/input/RadioSm";
import { STUDENT_CATEGORIES, STUDENT_TYPES } from "./studentFields";
import type { StudentFields } from "./studentFields";

// Names: letters, spaces, dot, apostrophe and hyphen (D'Souza, K. Patil, Rao-Shah); the database allows 50.
const NAME = /^[A-Za-z .'-]*$/;

interface Props {
  value: StudentFields;
  onChange: (next: StudentFields) => void;
  /** Starred for a new student; optional when editing one saved before email was asked. */
  emailRequired?: boolean;
  /** Shown under the email in red, e.g. why it is flagged. */
  emailNote?: string | null;
}

/**
 * Name, mother's name, category, ERN, gender, student type, dyslexia and email of one student in four rows; used by "Add student" and the edit dialog.
 * (ERN is only the label: the field is still `prn` / `studentPRN` in code and in the API.)
 */
export default function StudentDetailsFields({ value, onChange, emailRequired = true, emailNote }: Props) {
  const id = useId(); // radio ids stay unique if two forms are ever on screen
  const set = (patch: Partial<StudentFields>) => onChange({ ...value, ...patch });
  const name = (key: "firstName" | "middleName" | "lastName" | "motherName") => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (NAME.test(e.target.value)) set({ [key]: e.target.value });
  };
  // A category saved before this list existed stays selectable, so editing never loses it.
  const categories = value.category && !STUDENT_CATEGORIES.includes(value.category)
    ? [value.category, ...STUDENT_CATEGORIES]
    : STUDENT_CATEGORIES;

  return (
    <div className="grid grid-cols-1 content-start gap-x-4 gap-y-5 sm:grid-cols-3">
      <Input label="First name *" value={value.firstName} maxLength={50} onChange={name("firstName")} />
      <Input label="Middle name" value={value.middleName} maxLength={50} onChange={name("middleName")} />
      <Input label="Last name" value={value.lastName} maxLength={50} onChange={name("lastName")} />

      <Select
        label="Category *"
        placeholder="Choose category"
        options={categories.map((c) => ({ value: c, label: c }))}
        value={value.category}
        onChange={(v) => set({ category: v })}
      />
      <Input
        label="ERN (if issued)"
        placeholder="If issued"
        value={value.prn}
        maxLength={20}
        onChange={(e) => {
          if (/^[A-Za-z0-9]*$/.test(e.target.value)) set({ prn: e.target.value });
        }}
      />
      <div
        role="radiogroup"
        aria-label="Gender"
        className="relative flex h-11 items-center gap-5 rounded-lg border border-gray-300 px-4 focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/20 dark:border-gray-700 dark:focus-within:border-brand-800"
      >
        <span className="pointer-events-none absolute left-2.5 top-0 -translate-y-1/2 bg-white px-1.5 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          Gender *
        </span>
        {(["Male", "Female"] as const).map((g) => (
          <RadioSm
            key={g}
            id={`${id}-${g}`}
            name={`${id}-gender`}
            value={g}
            label={g}
            checked={value.gender === g}
            onChange={() => set({ gender: g })}
          />
        ))}
      </div>

      <Input label="Mother's name *" value={value.motherName} maxLength={50} onChange={name("motherName")} />
      <Select
        label="Student type *"
        placeholder="Choose student type"
        options={STUDENT_TYPES}
        value={value.studentType}
        onChange={(v) => set({ studentType: v })}
      />
      <div className="flex items-center sm:h-11">
        <Checkbox
          label="Dyslexia student (extra time in exams)"
          checked={value.dyslexia}
          onChange={(checked) => set({ dyslexia: checked })}
        />
      </div>

      <div className="sm:col-span-2">
        <Input
          type="email"
          label={emailRequired ? "Email *" : "Email"}
          placeholder="Student's own email (links and OTPs are sent here)"
          value={value.email}
          maxLength={255}
          error={!!emailNote}
          hint={emailNote ?? undefined}
          onChange={(e) => set({ email: e.target.value.replace(/\s/g, "") })}
        />
      </div>
    </div>
  );
}
