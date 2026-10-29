import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { StaffLetterService } from "../../../services/StaffLetterService";
import type { LetterSettings as Settings } from "../../../services/StaffLetterService";

interface Props {
  /** Only a college or platform admin can change the settings; everyone else sees them. */
  canEdit: boolean;
  reason: (err: unknown, fallback: string) => string;
  /** Inside a window: no card border of its own, room by the title for the window's close button. */
  embedded?: boolean;
}

// What a letter number may be made of: letters, digits, slash, dash and dot.
const PREFIX = /^[A-Za-z0-9/.-]*$/;

const MAX_GUIDELINES = 10;
const MAX_GUIDELINE_LENGTH = 300;

/** The saved guidelines as text, one per line (the API may send them as one text or as a list). */
const guidelineText = (g: string | string[] | null | undefined) => (Array.isArray(g) ? g.join("\n") : (g ?? ""));

/** The lines that are not empty, tidied. */
const guidelineLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/** The college's letter number prefix, the CAP contact numbers, the reporting place and the guidelines printed on staff letters. */
export default function LetterSettings({ canEdit, reason, embedded = false }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [prefix, setPrefix] = useState("");
  const [cap, setCap] = useState("");
  const [place, setPlace] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await StaffLetterService.settings();
      setSettings(s);
      setPrefix(s.letterPrefix ?? "");
      setCap(s.capContact ?? "");
      setPlace(s.reportingPlace ?? "");
      setGuidelines(guidelineText(s.dutyGuidelines));
      setError("");
    } catch (err) {
      setError(reason(err, "The letter settings could not be loaded."));
    }
  }, [reason]);

  useEffect(() => {
    load();
  }, [load]);

  const lines = guidelineLines(guidelines);
  const tooMany = lines.length > MAX_GUIDELINES;
  const tooLong = lines.some((l) => l.length > MAX_GUIDELINE_LENGTH);
  const changed =
    !!settings &&
    (prefix.trim() !== (settings.letterPrefix ?? "") ||
      cap.trim() !== (settings.capContact ?? "") ||
      place.trim() !== (settings.reportingPlace ?? "") ||
      lines.join("\n") !== guidelineLines(guidelineText(settings.dutyGuidelines)).join("\n"));
  const shownPrefix = (settings?.letterPrefix || settings?.defaultPrefix || "").trim();

  const edit = (set: (v: string) => void, value: string) => {
    set(value);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await StaffLetterService.saveSettings({ letterPrefix: prefix.trim(), capContact: cap.trim(), reportingPlace: place.trim(), dutyGuidelines: lines.join("\n") });
      await load();
      setSaved(true);
    } catch (err) {
      Swal.fire("Letter settings", reason(err, "The settings could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={embedded ? "p-5 sm:p-6" : "rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.03]"}>
      <h3 className={`text-base font-semibold text-gray-800 dark:text-white/90 ${embedded ? "pr-10" : ""}`}>Letter settings</h3>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">How letter numbers start, and what is printed on the letters.</p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      {settings && canEdit && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            <Input
              label="Letter number prefix"
              value={prefix}
              maxLength={40}
              onChange={(e) => PREFIX.test(e.target.value) && edit(setPrefix, e.target.value.toUpperCase())}
              hint={`Leave empty to use ${settings.defaultPrefix}. Letters, digits, / - . only.`}
            />
            <Input label="CAP contact numbers" value={cap} maxLength={100} onChange={(e) => edit(setCap, e.target.value)} hint="Printed at the end of each letter." />
            <div className="sm:col-span-2">
              <Input
                label="Reporting place"
                value={place}
                maxLength={200}
                onChange={(e) => edit(setPlace, e.target.value)}
                hint={`Where staff report before a session. Leave empty to print "${settings.defaultReportingPlace}".`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="duty-guidelines" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Duty guidelines
              </label>
              <textarea
                id="duty-guidelines"
                value={guidelines}
                rows={6}
                onChange={(e) => edit(setGuidelines, e.target.value)}
                placeholder={settings.defaultGuidelines.join("\n")}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
              <p className={`mt-1.5 text-xs ${tooMany || tooLong ? "text-error-600 dark:text-error-400" : "text-gray-500 dark:text-gray-400"}`}>
                {tooMany
                  ? `Up to ${MAX_GUIDELINES} guidelines; you have ${lines.length}.`
                  : tooLong
                    ? `Each guideline can have up to ${MAX_GUIDELINE_LENGTH} letters.`
                    : "One guideline per line, printed as bullets on the duty letter. Leave empty to print the lines shown in grey."}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            A duty letter number looks like <span className="font-mono text-gray-800 dark:text-white/90">{(prefix.trim() || settings.defaultPrefix) + "/2026-27/DUTY-001"}</span>. Numbers are never reused.
          </p>
          <div className="mt-5 flex items-center justify-end gap-3">
            {saved && !changed && (
              <span role="status" className="text-sm text-success-600 dark:text-success-400">
                Saved.
              </span>
            )}
            <Button size="sm" onClick={save} disabled={saving || !changed || tooMany || tooLong}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </>
      )}

      {settings && !canEdit && (
        <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Letter number prefix</dt>
            <dd className="mt-0.5 font-mono text-gray-800 dark:text-white/90">{shownPrefix}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">CAP contact numbers</dt>
            <dd className="mt-0.5 text-gray-800 dark:text-white/90">{settings.capContact || "Not set"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500 dark:text-gray-400">Reporting place</dt>
            <dd className="mt-0.5 text-gray-800 dark:text-white/90">{settings.reportingPlace || settings.defaultReportingPlace}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500 dark:text-gray-400">Duty guidelines</dt>
            <dd className="mt-0.5 text-gray-800 dark:text-white/90">
              <ul className="list-disc space-y-0.5 pl-5">
                {(guidelineLines(guidelineText(settings.dutyGuidelines)).length > 0 ? guidelineLines(guidelineText(settings.dutyGuidelines)) : settings.defaultGuidelines).map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </dd>
          </div>
          <p className="text-gray-500 sm:col-span-2 dark:text-gray-400">Only a college admin can change these.</p>
        </dl>
      )}
    </div>
  );
}
