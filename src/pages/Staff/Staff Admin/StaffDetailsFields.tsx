import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import { STAFF_TITLES } from "../../../services/StaffService";
import type { StaffSave } from "../../../services/StaffService";

// Names: letters, spaces, dot, apostrophe and hyphen (D'Souza, K. Patil, Rao-Shah); the database allows 50.
const NAME = /^[A-Za-z .'-]*$/;

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: StaffSave;
  onChange: (next: StaffSave) => void;
  departments: Option[];
  designations: Option[];
  /** Edit dialog only: the "Still at the college" tick (untick it for someone who has left). */
  showActive?: boolean;
}

/**
 * Title, name, email, employee ID, department, designation and external college of one member of staff;
 * used by "Add staff" and the edit dialog.
 */
export default function StaffDetailsFields({ value, onChange, departments, designations, showActive = false }: Props) {
  const set = (patch: Partial<StaffSave>) => onChange({ ...value, ...patch });
  const name = (key: "firstName" | "middleName" | "lastName") => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (NAME.test(e.target.value)) set({ [key]: e.target.value });
  };

  return (
    <div className="grid grid-cols-1 content-start gap-x-4 gap-y-5 sm:grid-cols-4">
      <Select label="Title *" placeholder="Title" options={STAFF_TITLES.map((t) => ({ value: t, label: t }))} value={value.title} onChange={(v) => set({ title: v })} />
      <Input label="First name *" value={value.firstName} maxLength={50} onChange={name("firstName")} />
      <Input label="Middle name" value={value.middleName} maxLength={50} onChange={name("middleName")} />
      <Input label="Last name" value={value.lastName} maxLength={50} onChange={name("lastName")} />

      <div className="sm:col-span-2">
        <Input
          type="email"
          label="Email *"
          placeholder="Their own email (letters are sent here)"
          value={value.email}
          maxLength={256}
          onChange={(e) => set({ email: e.target.value.replace(/\s/g, "") })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label={value.isExternal ? "Employee ID" : "Employee ID *"}
          value={value.employeeCode}
          maxLength={30}
          onChange={(e) => /^[A-Za-z0-9/-]*$/.test(e.target.value) && set({ employeeCode: e.target.value.toUpperCase() })}
        />
      </div>

      <div className="sm:col-span-2">
        <Select
          label="Department"
          placeholder="Choose department"
          options={[{ value: "", label: "None" }, ...departments]}
          value={value.departmentId ?? ""}
          onChange={(v) => set({ departmentId: v || null })}
        />
      </div>
      <div className="sm:col-span-2">
        <Select
          label="Designation"
          placeholder="Choose designation"
          options={[{ value: "", label: "None" }, ...designations]}
          value={value.designationId ?? ""}
          onChange={(v) => set({ designationId: v || null })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:col-span-4">
        <Checkbox label="External (professor of another college)" checked={value.isExternal} onChange={(checked) => set({ isExternal: checked })} />
        {showActive && <Checkbox label="Still at the college" checked={value.isActive} onChange={(checked) => set({ isActive: checked })} />}
      </div>

      {value.isExternal && (
        <>
          <div className="sm:col-span-3">
            <Input label="Their college *" value={value.externalCollege} maxLength={200} onChange={(e) => set({ externalCollege: e.target.value })} />
          </div>
          <Input label="City" value={value.externalCity} maxLength={100} onChange={(e) => set({ externalCity: e.target.value })} />
        </>
      )}
    </div>
  );
}
