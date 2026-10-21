import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, PenLine, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentAccessService, studentReason } from "../../services/StudentAccessService";
import type { StudentDetailsUpdate, StudentHome, StudentImageKind } from "../../services/StudentAccessService";
import { FIELD_LABEL } from "../../services/StudentLinksService";
import type { StudentField } from "../../services/StudentLinksService";
import { STUDENT_CATEGORIES } from "../Staff/Students Admin/studentFields";
import { shrinkImage } from "../../utils/shrinkImage";
import { day } from "./format";

type TextField = Exclude<StudentField, "photo" | "signature">;
type Draft = Record<TextField, string>;

/** Form order: pairs that read naturally side by side on a phone. */
const ORDER: TextField[] = ["firstName", "middleName", "lastName", "motherName", "dateOfBirth", "gender", "category", "phone", "address", "prn", "abcId"];
const WIDE = new Set<string>(["address", "email"]);

/** Two columns; a field left alone in its row takes the whole row, so the grid stays even whatever the link allows. */
function rows<T extends string>(keys: T[]): { key: T; wide: boolean }[] {
  const out: { key: T; wide: boolean }[] = [];
  let col = 0;
  keys.forEach((key, i) => {
    const next = keys[i + 1];
    const wide = WIDE.has(key) || (col === 0 && (!next || WIDE.has(next)));
    out.push({ key, wide });
    col = wide ? 0 : 1 - col;
  });
  return out;
}

const fromHome = (s: StudentHome["student"]): Draft => ({
  firstName: s.firstName ?? "",
  middleName: s.middleName ?? "",
  lastName: s.lastName ?? "",
  motherName: s.motherName ?? "",
  dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : "",
  gender: s.gender ?? "",
  category: s.category ?? "",
  phone: s.phone ?? "",
  address: s.address ?? "",
  prn: s.prn ?? "",
  abcId: s.abcId ?? "",
});

const NAME = /^\p{L}[\p{L} .'-]*$/u;

/** The same checks as the API, so most mistakes show next to the field before saving. */
function check(field: TextField, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "firstName":
    case "lastName":
    case "motherName":
      if (!v) return "Required";
      return v.length > 50 || !NAME.test(v) ? "Letters only" : null;
    case "middleName":
      return v && (v.length > 50 || !NAME.test(v)) ? "Letters only" : null;
    case "phone": {
      let d = v.replace(/\D/g, "");
      if (!d) return null;
      if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
      else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
      return d.length !== 10 || d[0] < "6" ? "10-digit mobile number" : null;
    }
    case "dateOfBirth":
      return v && new Date(v) > new Date() ? "Date is in the future" : null;
    case "gender":
    case "category":
      return v ? null : "Choose one";
    case "address":
      return v.length > 300 ? "At most 300 characters" : null;
    case "prn":
      return v && !/^[A-Za-z0-9/-]+$/.test(v) ? "Letters, digits, - and / only" : null;
    case "abcId":
      if (!v) return null;
      return !/^[\d\s-]+$/.test(v) ? "Digits only" : v.replace(/[\s-]/g, "").length !== 12 ? "12 digits" : null;
  }
}

type Flash = { ok: boolean; text: string };

interface Props {
  home: StudentHome;
  onHome: (home: StudentHome) => void;
  /** The session ended while saving: the page goes back to the code step. */
  onEnded: () => void;
}

/**
 * The student's details. The top is their ID card (photo and signature change by tapping them; they upload at
 * once, shrunk in the browser first). Below are the fields this link lets them change, then what the college holds
 * that they can't. Text changes are saved together from a bar that appears once something is changed.
 */
export default function StudentDetailsForm({ home, onHome, onEnded }: Props) {
  const s = home.student;
  const editable = useMemo(() => new Set(home.editableFields), [home.editableFields]);
  const saved = useMemo(() => fromHome(s), [s]);
  const [draft, setDraft] = useState<Draft>(saved);
  const [touched, setTouched] = useState<Set<TextField>>(new Set());
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [signUrl, setSignUrl] = useState<string | null>(null);

  // New saved values (after a save or an upload) replace the fields the student has not touched since.
  const lastSaved = useRef(saved);
  useEffect(() => {
    const before = lastSaved.current;
    lastSaved.current = saved;
    setDraft((d) => {
      const next = { ...d };
      for (const f of Object.keys(saved) as TextField[]) if (d[f] === before[f]) next[f] = saved[f];
      return next;
    });
  }, [saved]);

  // Pictures come through the API with the session header, so they are loaded as object URLs.
  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    (async () => {
      const [p, g] = await Promise.all([
        s.hasPhoto ? StudentAccessService.imageUrl("photo") : Promise.resolve(null),
        s.hasSignature ? StudentAccessService.imageUrl("signature") : Promise.resolve(null),
      ]);
      if (p) urls.push(p);
      if (g) urls.push(g);
      if (alive) {
        setPhotoUrl(p);
        setSignUrl(g);
      }
    })();
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [s.hasPhoto, s.hasSignature, home]);

  // A good-news message clears itself; a problem stays until the next action.
  useEffect(() => {
    if (!flash?.ok) return;
    const t = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(t);
  }, [flash]);

  const fields = ORDER.filter((f) => editable.has(f));
  const locked: (TextField | "email")[] = [...ORDER.filter((f) => !editable.has(f)), "email"];
  const changed = fields.filter((f) => draft[f].trim() !== saved[f].trim());
  const errors = Object.fromEntries(fields.map((f) => [f, check(f, draft[f])])) as Record<TextField, string | null>;
  const hasErrors = changed.some((f) => errors[f]);

  const set = (f: TextField, v: string) => {
    setDraft((d) => ({ ...d, [f]: v }));
    setFlash(null);
  };

  const failed = (err: unknown, fallback: string) => {
    if ((err as { response?: { status?: number } })?.response?.status === 401) onEnded();
    else setFlash({ ok: false, text: studentReason(err, fallback) });
  };

  const save = async () => {
    setTouched(new Set(fields));
    if (hasErrors) {
      setFlash({ ok: false, text: "Fix the fields in red" });
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    const update: StudentDetailsUpdate = {};
    for (const f of fields) {
      if (f === "dateOfBirth") update.dateOfBirth = draft.dateOfBirth || null;
      else update[f] = draft[f].trim();
    }
    setSaving(true);
    try {
      const result = await StudentAccessService.saveDetails(update);
      // The form takes what was stored (the API tidies values, e.g. "98765 43210" -> "9876543210").
      setDraft(fromHome(result.home.student));
      onHome(result.home);
      setTouched(new Set());
      setFlash({ ok: true, text: result.changed.length ? "Saved. We've emailed you a note." : "Nothing was different" });
    } catch (err) {
      failed(err, "Your changes could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (kind: StudentImageKind, file: File) => {
    const label = kind === "photo" ? "Photo" : "Signature";
    try {
      const dataUrl = await shrinkImage(file, kind === "photo" ? 900 : 700);
      const result = await StudentAccessService.saveImage(kind, dataUrl);
      onHome(result.home);
      setFlash({ ok: true, text: `${label} saved. We've emailed you a note.` });
      return dataUrl;
    } catch (err) {
      failed(err, (err as Error)?.message || `The ${label.toLowerCase()} could not be saved.`);
      return null;
    }
  };

  const name = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
  const initials = [s.firstName, s.lastName].map((x) => x?.[0] ?? "").join("").toUpperCase() || "S";
  const recordValue = (f: TextField | "email") =>
    f === "email" ? s.email : f === "dateOfBirth" ? day(saved.dateOfBirth || null) : saved[f];

  // What this link is for, in the student's words.
  const pictures = (["photo", "signature"] as const).filter((k) => editable.has(k));
  const heading =
    fields.length > 0
      ? "Check and correct your details"
      : pictures.length === 2
        ? "Update your photo and signature"
        : pictures.length === 1
          ? `Update your ${pictures[0]}`
          : "Check your details";

  return (
    <div className="pb-32">
      <div className="mb-4 px-1">
        <h1 className="text-xl font-semibold">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fields.length === 0 && pictures.length > 0 && `Tap ${pictures.length === 2 ? "them" : "it"} on your card below. `}
          Open until {day(home.deadline)}.
        </p>
        {home.updatedAt && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-success-600 dark:text-success-400">
            <CheckCircle2 className="size-4" /> Saved {day(home.updatedAt)}
          </p>
        )}
      </div>

      {/* The student's ID card: college band on top, photo, name and signature below */}
      <section aria-label="ID card" className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="truncate bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{home.college}</div>
        <div className="flex gap-4 p-4">
          <Picture kind="photo" url={photoUrl} editable={editable.has("photo")} fallback={initials} onPick={upload} />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-lg font-semibold leading-snug break-words">{name || "Your name"}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Student ID {s.studentId}</p>
            <div className="mt-auto pt-3">
              <Picture kind="signature" url={signUrl} editable={editable.has("signature")} onPick={upload} />
            </div>
          </div>
        </div>
      </section>

      {fields.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-semibold">Your details</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5">
            {rows(fields).map(({ key, wide }) => (
              <FieldControl
                key={key}
                field={key}
                wide={wide}
                value={draft[key]}
                error={touched.has(key) || changed.includes(key) ? errors[key] : null}
                changed={changed.includes(key)}
                onChange={(v) => set(key, v)}
                onBlur={() => setTouched((t) => new Set(t).add(key))}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="px-1 text-base font-semibold">On college record</h2>
        <dl className="mt-3 divide-y rounded-2xl border bg-card px-4">
          {locked.map((key) => (
            <div key={key} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="shrink-0 text-sm text-muted-foreground">{key === "email" ? "Email" : FIELD_LABEL[key]}</dt>
              <dd className="min-w-0 text-right text-sm font-medium break-words">{recordValue(key) || <span className="font-normal text-muted-foreground">Not given</span>}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 px-1 text-sm text-muted-foreground">
          Something wrong here? {home.helpEmail ? "Write to " : "Ask your college office."}
          {home.helpEmail && (
            <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${home.helpEmail}`}>
              {home.helpEmail}
            </a>
          )}
        </p>
      </section>

      <SaveBar
        count={changed.length}
        saving={saving}
        flash={flash}
        onUndo={() => {
          setDraft(saved);
          setFlash(null);
        }}
        onSave={save}
      />
    </div>
  );
}

function FieldControl({
  field,
  wide,
  value,
  error,
  changed,
  onChange,
  onBlur,
}: {
  field: TextField;
  wide: boolean;
  value: string;
  error: string | null;
  changed: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = `f-${field}`;
  const invalid = error ? true : undefined;
  const common = { id, "aria-invalid": invalid, "aria-describedby": error ? `${id}-e` : undefined, onBlur };
  let control: React.ReactNode;
  if (field === "gender")
    control = (
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={value}
        onValueChange={(v) => v && onChange(v)}
        aria-labelledby={`${id}-l`}
        className="w-full"
      >
        {["Male", "Female"].map((g) => (
          <ToggleGroupItem key={g} value={g} className="h-11 flex-1 data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
            {g}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  else if (field === "category")
    control = (
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} aria-invalid={invalid} className="h-11! w-full">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          {STUDENT_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  else if (field === "address")
    control = <Textarea {...common} value={value} rows={3} maxLength={300} placeholder="House, street, area, city, PIN" onChange={(e) => onChange(e.target.value)} />;
  else if (field === "dateOfBirth")
    control = <Input {...common} type="date" className="h-11" value={value} max={new Date().toISOString().slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
  else
    control = (
      <Input
        {...common}
        className="h-11"
        value={value}
        maxLength={field === "phone" ? 16 : field === "prn" ? 30 : field === "abcId" ? 14 : 50}
        inputMode={field === "phone" ? "tel" : field === "abcId" ? "numeric" : undefined}
        autoComplete={field === "phone" ? "tel" : field === "firstName" ? "given-name" : field === "lastName" ? "family-name" : "off"}
        placeholder={field === "phone" ? "10-digit mobile" : field === "prn" ? "If issued" : field === "abcId" ? "12 digits" : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  return (
    <div className={`min-w-0 space-y-1.5 ${wide ? "col-span-2" : ""}`}>
      <Label htmlFor={id} id={`${id}-l`} className="gap-1.5">
        {FIELD_LABEL[field]}
        {changed && <span className="size-1.5 rounded-full bg-primary" aria-label="changed" />}
      </Label>
      {control}
      {error && (
        <p id={`${id}-e`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Photo or signature on the ID card. Tapping it picks a picture, which is shrunk and uploaded at once. */
export function Picture({
  kind,
  url,
  editable,
  fallback,
  onPick,
}: {
  kind: StudentImageKind;
  url: string | null;
  editable: boolean;
  fallback?: string;
  onPick: (kind: StudentImageKind, file: File) => Promise<string | null>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const label = kind === "photo" ? "photo" : "signature";
  const shown = preview ?? url;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const saved = await onPick(kind, file);
    if (saved) setPreview(saved);
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const photo = kind === "photo";
  const box = (
    <span
      className={`relative flex items-center justify-center overflow-hidden ${
        photo ? `h-32 w-26 rounded-xl bg-primary/10 ${shown || !editable ? "" : "border-2 border-dashed border-primary/30"}` : `h-12 w-full max-w-44 rounded-lg bg-white ${shown || !editable ? "border" : "border-2 border-dashed border-primary/30"}`
      }`}
    >
      {shown ? (
        <img src={shown} alt={`Your ${label}`} className={`size-full ${photo ? "object-cover" : "object-contain p-1"}`} />
      ) : photo && editable ? (
        <span className="flex flex-col items-center gap-1 text-xs font-medium text-primary">
          <Camera className="size-7" /> Add photo
        </span>
      ) : photo ? (
        <span className="text-2xl font-semibold text-primary">{fallback}</span>
      ) : (
        <span className={`text-xs font-medium ${editable ? "text-primary" : "text-gray-500"}`}>{editable ? "Add signature" : "No signature"}</span>
      )}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="size-6 animate-spin text-white" />
        </span>
      )}
      {editable && shown && !busy && (
        <span className={`absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow ${photo ? "right-1.5 bottom-1.5 size-7" : "top-1 right-1 size-5"}`}>
          {photo ? <Camera className="size-4" /> : <PenLine className="size-3" />}
        </span>
      )}
    </span>
  );

  if (!editable) return <span className={photo ? "shrink-0" : "block"}>{box}</span>;
  return (
    <>
      <button
        type="button"
        className={`${photo ? "shrink-0" : "block w-full"} rounded-xl text-left transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]`}
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={shown ? `Change ${label}` : `Add ${label}`}
      >
        {box}
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </>
  );
}

/** Bottom bar: while something is changed it offers Undo and Save; after an action it says how it went. */
function SaveBar({ count, saving, flash, onUndo, onSave }: { count: number; saving: boolean; flash: Flash | null; onUndo: () => void; onSave: () => void }) {
  const open = count > 0 || !!flash;
  // While sliding away it keeps showing what it said last, not "0 changes".
  const last = useRef({ count, flash });
  if (open) last.current = { count, flash };
  ({ count, flash } = last.current);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 px-4 pb-4 transition-all duration-200 ${open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}`}
      aria-hidden={!open}
    >
      <div className="mx-auto flex min-h-14 max-w-lg items-center gap-2 rounded-2xl border bg-background py-2 pr-2 pl-4 shadow-xl" role="status">
        {flash && !(count > 0 && flash.ok) ? (
          <p className={`flex min-w-0 flex-1 items-center gap-2 text-sm ${flash.ok ? "text-success-600 dark:text-success-400" : "text-destructive"}`}>
            {flash.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
            <span className="min-w-0">{flash.text}</span>
          </p>
        ) : (
          <p className="min-w-0 flex-1 text-sm">
            {count} change{count === 1 ? "" : "s"}
          </p>
        )}
        {count > 0 && (
          <>
            <Button variant="ghost" size="lg" onClick={onUndo} disabled={saving}>
              Undo
            </Button>
            <Button size="lg" className="h-10 px-5" onClick={onSave} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} {saving ? "Saving" : "Save"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
