import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffAccessService, staffReason } from "../../services/StaffAccessService";
import type { StaffDetails, StaffHome } from "../../services/StaffAccessService";

const NAME = /^\p{L}[\p{L} .'-]*$/u;
/** A Select cannot hold an empty value, so "not given" is this word. */
const NONE = "none";

type Draft = Record<"title" | "firstName" | "middleName" | "lastName" | "departmentId" | "designationId" | "externalCollege" | "externalCity", string>;

const fromDetails = (d: StaffDetails): Draft => ({
  title: d.title ?? "",
  firstName: d.firstName ?? "",
  middleName: d.middleName ?? "",
  lastName: d.lastName ?? "",
  departmentId: d.departmentId ?? "",
  designationId: d.designationId ?? "",
  externalCollege: d.externalCollege ?? "",
  externalCity: d.externalCity ?? "",
});

interface Props {
  home: StaffHome;
  /** True the first time (the details have not been checked yet): no way back to the letters until saved. */
  first: boolean;
  onSaved: (home: StaffHome) => void;
  onCancel: () => void;
  /** The session ended while saving: the page goes back to the code step. */
  onEnded: () => void;
}

/** "Check your details": the name and post printed on the letters. Saved in one go. */
export default function StaffDetailsForm({ home, first, onSaved, onCancel, onEnded }: Props) {
  const { details, options } = home;
  const [draft, setDraft] = useState<Draft>(() => fromDetails(details));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const set = (field: keyof Draft, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setProblem(null);
  };

  const errors: Partial<Record<keyof Draft, string>> = {};
  const first1 = draft.firstName.trim();
  if (!draft.title) errors.title = "Choose one";
  if (!first1) errors.firstName = "Required";
  else if (first1.length > 50 || !NAME.test(first1)) errors.firstName = "Letters only";
  for (const f of ["middleName", "lastName"] as const) {
    const v = draft[f].trim();
    if (v && (v.length > 50 || !NAME.test(v))) errors[f] = "Letters only";
  }
  if (details.isExternal) {
    if (!draft.externalCollege.trim()) errors.externalCollege = "Required";
    else if (draft.externalCollege.trim().length > 150) errors.externalCollege = "At most 150 characters";
    if (draft.externalCity.trim().length > 80) errors.externalCity = "At most 80 characters";
  }
  const shown = (f: keyof Draft) => (touched ? errors[f] : undefined);

  const save = async () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) {
      setProblem("Fix the fields in red");
      setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(), 0);
      return;
    }
    const update: StaffDetails = {
      title: draft.title,
      firstName: draft.firstName.trim(),
      middleName: draft.middleName.trim() || null,
      lastName: draft.lastName.trim() || null,
      departmentId: draft.departmentId || null,
      designationId: draft.designationId || null,
      isExternal: details.isExternal,
      externalCollege: details.isExternal ? draft.externalCollege.trim() : details.externalCollege,
      externalCity: details.isExternal ? draft.externalCity.trim() || null : details.externalCity,
    };
    setSaving(true);
    setProblem(null);
    try {
      onSaved(await StaffAccessService.saveDetails(update));
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 401) onEnded();
      else setProblem(staffReason(err, "Your details could not be saved. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const err = (f: keyof Draft) =>
    shown(f) ? (
      <p id={`sf-${f}-e`} className="text-xs text-destructive">
        {shown(f)}
      </p>
    ) : null;
  const common = (f: keyof Draft) => ({
    id: `sf-${f}`,
    "aria-invalid": shown(f) ? (true as const) : undefined,
    "aria-describedby": shown(f) ? `sf-${f}-e` : undefined,
    value: draft[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(f, e.target.value),
  });

  return (
    <form
      className="pb-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="mb-5 px-1">
        <h1 className="text-xl font-semibold">Check your details</h1>
        <p className="mt-1 text-sm text-muted-foreground">These are printed on your letters. Correct anything that is wrong.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        <div className="col-span-2 space-y-1.5 sm:col-span-1">
          <Label htmlFor="sf-title">Title</Label>
          <Select value={draft.title || undefined} onValueChange={(v) => set("title", v)}>
            <SelectTrigger id="sf-title" aria-invalid={shown("title") ? true : undefined} className="h-11! w-full">
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              {options.titles.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err("title")}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="sf-firstName">First name</Label>
          <Input {...common("firstName")} className="h-11" maxLength={50} autoComplete="given-name" />
          {err("firstName")}
        </div>
        <div className="col-span-1 min-w-0 space-y-1.5">
          <Label htmlFor="sf-middleName" className="gap-1.5">
            Middle name <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input {...common("middleName")} className="h-11" maxLength={50} autoComplete="additional-name" />
          {err("middleName")}
        </div>
        <div className="col-span-1 min-w-0 space-y-1.5">
          <Label htmlFor="sf-lastName" className="gap-1.5">
            Last name <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input {...common("lastName")} className="h-11" maxLength={50} autoComplete="family-name" />
          {err("lastName")}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="sf-departmentId">Department</Label>
          <Select value={draft.departmentId || NONE} onValueChange={(v) => set("departmentId", v === NONE ? "" : v)}>
            <SelectTrigger id="sf-departmentId" className="h-11! w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Not given</SelectItem>
              {options.departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="sf-designationId">Designation</Label>
          <Select value={draft.designationId || NONE} onValueChange={(v) => set("designationId", v === NONE ? "" : v)}>
            <SelectTrigger id="sf-designationId" className="h-11! w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Not given</SelectItem>
              {options.designations.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {details.isExternal && (
          <>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="sf-externalCollege">College</Label>
              <Input {...common("externalCollege")} className="h-11" maxLength={150} autoComplete="organization" />
              {err("externalCollege")}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="sf-externalCity" className="gap-1.5">
                City <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input {...common("externalCity")} className="h-11" maxLength={80} autoComplete="address-level2" />
              {err("externalCity")}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 px-1 text-sm text-muted-foreground">Your email, {home.maskedEmail}, is kept by the college office.</p>

      {problem && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {problem}
        </p>
      )}

      <Button size="lg" className="mt-6 h-12 w-full text-base" disabled={saving}>
        {saving && <Loader2 className="animate-spin" />}
        {saving ? "Saving…" : first ? "Save and see my letters" : "Save"}
      </Button>
      {!first && (
        <Button type="button" variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={onCancel} disabled={saving}>
          Back to my letters
        </Button>
      )}
    </form>
  );
}
