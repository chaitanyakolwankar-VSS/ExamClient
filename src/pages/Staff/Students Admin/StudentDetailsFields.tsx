import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import { STUDENT_CATEGORIES } from "./studentFields";
import type { StudentFields } from "./studentFields";

// Names: letters, spaces, dot, apostrophe and hyphen (D'Souza, K. Patil, Rao-Shah); the database allows 50.
const NAME = /^[A-Za-z .'-]*$/;

interface Props {
  value: StudentFields;
  onChange: (next: StudentFields) => void;
}

/** Name, category, PRN, gender and dyslexia of one student; used by "Add student" and the edit dialog. */
export default function StudentDetailsFields({ value, onChange }: Props) {
  const set = (patch: Partial<StudentFields>) => onChange({ ...value, ...patch });
  const name = (key: "firstName" | "middleName" | "lastName") => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (NAME.test(e.target.value)) set({ [key]: e.target.value });
  };
  // A category saved before this list existed stays selectable, so editing never loses it.
  const categories = value.category && !STUDENT_CATEGORIES.includes(value.category)
    ? [value.category, ...STUDENT_CATEGORIES]
    : STUDENT_CATEGORIES;

  return (
    <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-3">
      <Input label="First name *" value={value.firstName} maxLength={50} onChange={name("firstName")} />
      <Input label="Middle name" value={value.middleName} maxLength={50} onChange={name("middleName")} />
      <Input label="Last name *" value={value.lastName} maxLength={50} onChange={name("lastName")} />

      <Select
        label="Category *"
        placeholder="Choose category"
        options={categories.map((c) => ({ value: c, label: c }))}
        value={value.category}
        onChange={(v) => set({ category: v })}
      />
      <Input
        label="PRN"
        placeholder="University PRN (if issued)"
        value={value.prn}
        maxLength={20}
        onChange={(e) => {
          if (/^[A-Za-z0-9]*$/.test(e.target.value)) set({ prn: e.target.value });
        }}
      />
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-0 z-10 -translate-y-1/2 bg-white px-1.5 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          Gender *
        </span>
        <div className="grid h-11 grid-cols-2 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
          {(["Male", "Female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => set({ gender: g })}
              className={`text-sm transition ${
                value.gender === g
                  ? "bg-brand-500 text-white"
                  : "bg-transparent text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              } ${g === "Female" ? "border-l border-gray-300 dark:border-gray-700" : ""}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-3">
        <Checkbox
          label="Dyslexia student (extra time in exams)"
          checked={value.dyslexia}
          onChange={(checked) => set({ dyslexia: checked })}
        />
      </div>
    </div>
  );
}
