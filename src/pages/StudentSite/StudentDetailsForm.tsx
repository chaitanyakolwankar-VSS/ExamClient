import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Clock, Loader2, Lock, PenLine, RotateCcw, Save, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentAccessService, studentReason } from "../../services/StudentAccessService";
import type { StudentDetailsUpdate, StudentHome, StudentImageKind } from "../../services/StudentAccessService";
import { FIELD_GROUPS } from "../../services/StudentLinksService";
import type { StudentField } from "../../services/StudentLinksService";
import { STUDENT_CATEGORIES } from "../Staff/Students Admin/studentFields";
import { shrinkImage } from "../../utils/shrinkImage";

type TextField = Exclude<StudentField, "photo" | "signature">;
type Draft = Record<TextField, string>;

const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

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
});

const NAME = /^\p{L}[\p{L} .'-]*$/u;

/** The same checks as the API, so most mistakes show next to the field before saving. */
function check(field: TextField, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "firstName":
    case "lastName":
    case "motherName":
      if (!v) return "Required.";
      return v.length > 50 || !NAME.test(v) ? "Letters only (spaces, dots and hyphens are fine)." : null;
    case "middleName":
      return v && (v.length > 50 || !NAME.test(v)) ? "Letters only." : null;
    case "phone": {
      let d = v.replace(/\D/g, "");
      if (!d) return null;
      if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
      else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
      return d.length !== 10 || d[0] < "6" ? "A 10-digit mobile number." : null;
    }
    case "dateOfBirth":
      return v && new Date(v) > new Date() ? "This date is in the future." : null;
    case "gender":
      return v ? null : "Choose one.";
    case "category":
      return v ? null : "Choose one.";
    case "address":
      return v.length > 300 ? "At most 300 characters." : null;
    case "prn":
      return v && !/^[A-Za-z0-9/-]+$/.test(v) ? "Letters, digits, - and / only." : null;
  }
}

interface Props {
  home: StudentHome;
  onHome: (home: StudentHome) => void;
  /** The session ended while saving: the page goes back to the code step. */
  onEnded: () => void;
}

/**
 * The student's details: the fields this link lets them change are inputs, the rest are shown with a lock. Photo
 * and signature upload as soon as they are picked (shrunk in the browser first). Text changes are saved together
 * from a bar that appears once something is changed.
 */
export default function StudentDetailsForm({ home, onHome, onEnded }: Props) {
  const s = home.student;
  const editable = useMemo(() => new Set(home.editableFields), [home.editableFields]);
  const saved = useMemo(() => fromHome(s), [s]);
  const [draft, setDraft] = useState<Draft>(saved);
  const [touched, setTouched] = useState<Set<TextField>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
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

  const textFields = (Object.keys(draft) as TextField[]).filter((f) => editable.has(f));
  const changed = textFields.filter((f) => draft[f].trim() !== saved[f].trim());
  const errors = Object.fromEntries(textFields.map((f) => [f, check(f, draft[f])])) as Record<TextField, string | null>;
  const hasErrors = changed.some((f) => errors[f]);

  const set = (f: TextField, v: string) => {
    setDraft((d) => ({ ...d, [f]: v }));
    setMessage(null);
  };
  const blur = (f: TextField) => setTouched((t) => new Set(t).add(f));

  const save = async () => {
    setTouched(new Set(textFields));
    if (hasErrors) {
      setMessage({ ok: false, text: "Fix the fields marked in red first." });
      return;
    }
    const update: StudentDetailsUpdate = {};
    for (const f of textFields) {
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
      setMessage(
        result.changed.length
          ? { ok: true, text: `Saved: ${result.changed.join(", ")}. We've emailed you a note about the change.` }
          : { ok: true, text: "Nothing was different, so nothing changed." },
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 401) onEnded();
      else setMessage({ ok: false, text: studentReason(err, "Your changes could not be saved. Try again.") });
    } finally {
      setSaving(false);
    }
  };

  const name = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
  const initials = [s.firstName, s.lastName].map((x) => x?.[0] ?? "").join("").toUpperCase() || "S";
  const nothingEditable = home.editableFields.length === 0;

  return (
    <div className="space-y-4 pb-28">
      {/* Who and where they are */}
      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary ring-2 ring-background">
            {photoUrl ? <img src={photoUrl} alt="" className="size-full object-cover" /> : initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{name || "Your details"}</p>
            <p className="text-sm text-muted-foreground">Student ID {s.studentId}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {home.updatedAt ? (
                <Badge className="gap-1 bg-success-500 text-white">
                  <CheckCircle2 className="size-3" /> Updated {day(home.updatedAt)}
                </Badge>
              ) : (
                <Badge variant="secondary">Not updated yet</Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3" /> Open until {day(home.deadline)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p
          role="status"
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            message.ok ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400" : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
          {message.text}
        </p>
      )}

      {nothingEditable && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          This link is for checking only. If something is wrong, contact {home.helpEmail ?? "your college office"}.
        </p>
      )}

      {FIELD_GROUPS.map((g) => {
        if (g.title === "Photo and signature")
          return (
            <Card key={g.title}>
              <CardHeader>
                <CardTitle>Photo and signature</CardTitle>
                <CardDescription>
                  {editable.has("photo") || editable.has("signature")
                    ? "Tap a box to take or choose a picture. It uploads straight away."
                    : "Shown as the college has them."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 items-start gap-3">
                <ImageTile kind="photo" label="Photo" url={photoUrl} editable={editable.has("photo")} onHome={onHome} onEnded={onEnded} onMessage={setMessage} />
                <ImageTile kind="signature" label="Signature" url={signUrl} editable={editable.has("signature")} onHome={onHome} onEnded={onEnded} onMessage={setMessage} />
              </CardContent>
            </Card>
          );
        const fields = g.fields as { key: TextField; label: string }[];
        return (
          <Card key={g.title}>
            <CardHeader>
              <CardTitle>{g.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <FieldRow
                  key={f.key}
                  field={f.key}
                  label={f.label}
                  value={draft[f.key]}
                  editable={editable.has(f.key)}
                  error={touched.has(f.key) || changed.includes(f.key) ? errors[f.key] : null}
                  changed={changed.includes(f.key)}
                  onChange={(v) => set(f.key, v)}
                  onBlur={() => blur(f.key)}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card size="sm">
        <CardContent className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-muted-foreground">Email (codes and links go here)</span>
          <span className="flex min-w-0 items-center gap-1.5 break-all">
            <Lock className="size-3.5 shrink-0 text-muted-foreground" /> {s.email}
          </span>
        </CardContent>
      </Card>

      {home.helpEmail && (
        <p className="px-1 text-xs text-muted-foreground">
          Something wrong in a locked field? Contact{" "}
          <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${home.helpEmail}`}>
            {home.helpEmail}
          </a>
          .
        </p>
      )}

      {/* Save bar: only while something is changed */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur transition-transform duration-200 ${
          changed.length ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!changed.length}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-sm">
            <b className="font-semibold">{changed.length}</b> change{changed.length === 1 ? "" : "s"} not saved
          </p>
          <Button variant="ghost" size="lg" onClick={() => setDraft(saved)} disabled={saving}>
            <RotateCcw /> Undo
          </Button>
          <Button size="lg" className="h-10 px-5" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  label,
  value,
  editable,
  error,
  changed,
  onChange,
  onBlur,
}: {
  field: TextField;
  label: string;
  value: string;
  editable: boolean;
  error: string | null;
  changed: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const id = `f-${field}`;
  if (!editable) {
    const shown = field === "dateOfBirth" ? day(value || null) : value;
    return (
      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3" /> {label}
        </p>
        <p className="min-h-9 rounded-lg bg-muted/60 px-3 py-2 text-sm">{shown || <span className="text-muted-foreground">—</span>}</p>
      </div>
    );
  }

  const invalid = !!error;
  const common = { id, "aria-invalid": invalid || undefined, onBlur };
  let control: React.ReactNode;
  if (field === "gender")
    control = (
      <div role="radiogroup" aria-labelledby={`${id}-l`} className="grid grid-cols-2 gap-2">
        {["Male", "Female"].map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={value === g}
            onClick={() => onChange(g)}
            className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
              value === g ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-muted"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    );
  else if (field === "category")
    control = (
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} aria-invalid={invalid || undefined} className="h-10 w-full">
          <SelectValue placeholder="Choose category" />
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
    control = <Input {...common} type="date" className="h-10" value={value} max={new Date().toISOString().slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
  else
    control = (
      <Input
        {...common}
        className="h-10"
        value={value}
        maxLength={field === "phone" ? 16 : field === "prn" ? 30 : 50}
        inputMode={field === "phone" ? "tel" : undefined}
        autoComplete={field === "phone" ? "tel" : field === "firstName" ? "given-name" : field === "lastName" ? "family-name" : "off"}
        placeholder={field === "phone" ? "10-digit mobile" : field === "prn" ? "If issued" : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  return (
    <div className={`space-y-1.5 ${field === "address" ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id} id={`${id}-l`} className="flex items-center gap-1.5">
        <PenLine className="size-3 text-primary" /> {label}
        {changed && <span className="ml-auto text-xs font-normal text-primary">changed</span>}
      </Label>
      {control}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ImageTile({
  kind,
  label,
  url,
  editable,
  onHome,
  onEnded,
  onMessage,
}: {
  kind: StudentImageKind;
  label: string;
  url: string | null;
  editable: boolean;
  onHome: (home: StudentHome) => void;
  onEnded: () => void;
  onMessage: (m: { ok: boolean; text: string }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await shrinkImage(file, kind === "photo" ? 900 : 700);
      setPreview(dataUrl);
      const result = await StudentAccessService.saveImage(kind, dataUrl);
      onHome(result.home);
      onMessage({ ok: true, text: `${label} saved. We've emailed you a note about the change.` });
    } catch (err) {
      setPreview(null);
      if ((err as { response?: { status?: number } })?.response?.status === 401) onEnded();
      else onMessage({ ok: false, text: studentReason(err, (err as Error)?.message || `The ${label.toLowerCase()} could not be saved.`) });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const shown = preview ?? url;
  const box = (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40 ${
        kind === "signature" ? "aspect-[2/1]" : "aspect-[4/5]"
      } ${editable ? "border-primary/40 transition-colors group-hover:border-primary group-hover:bg-primary/5" : "border-border"}`}
    >
      {shown ? (
        <img src={shown} alt={label} className="size-full object-contain" />
      ) : (
        <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          {editable ? <Camera className="size-6 text-primary" /> : <Lock className="size-5" />}
          {editable ? `Add ${label.toLowerCase()}` : "Not uploaded"}
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/70">
          <Loader2 className="size-6 animate-spin text-primary" />
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {editable ? <PenLine className="size-3 text-primary" /> : <Lock className="size-3" />} {label}
      </p>
      {editable ? (
        <button type="button" className="group block w-full text-left" onClick={() => input.current?.click()} disabled={busy} aria-label={`Change ${label.toLowerCase()}`}>
          {box}
          <span className="mt-1.5 block text-center text-xs font-medium text-primary">{shown ? "Tap to change" : "Tap to add"}</span>
        </button>
      ) : (
        box
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
