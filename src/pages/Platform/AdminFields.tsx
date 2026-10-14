import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import type { AdminInput } from "../../services/platformService";
import { generatePassword } from "./platformHelpers";

interface AdminFieldsProps {
  value: AdminInput;
  onChange: (next: AdminInput) => void;
  /** Heading shown above the fields (e.g. "Admin 1"). */
  title?: string;
  onRemove?: () => void;
}

/** One college-admin form block (name, username, email, password) used by "New college" and the detail page. */
export default function AdminFields({ value, onChange, title, onRemove }: AdminFieldsProps) {
  const set = (patch: Partial<AdminInput>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      {(title || onRemove) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">{title}</h4>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-sm text-error-500 hover:text-error-600"
            >
              Remove
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="First name" maxLength={50} value={value.firstName} onChange={(e) => set({ firstName: e.target.value })} />
        <Input label="Last name" maxLength={50} value={value.lastName} onChange={(e) => set({ lastName: e.target.value })} />
        <Input label="Username" maxLength={50} value={value.username} onChange={(e) => set({ username: e.target.value })} />
        <Input
          label="Email (login)"
          type="email"
          maxLength={255}
          value={value.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <div className="flex items-start gap-3 sm:col-span-2">
          <div className="flex-1">
            <Input
              label="Password"
              value={value.password}
              onChange={(e) => set({ password: e.target.value })}
              hint="At least 8 characters. Shown so you can pass it on to the admin."
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-11 shrink-0 py-0"
            onClick={() => set({ password: generatePassword() })}
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
