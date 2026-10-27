import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import type { ImportRow, StudentImportResult } from "../../../services/Student_MasterService";

interface Step {
  title: string;
  text: ReactNode;
}

interface Props {
  /** Download, fill in, upload: the three numbered cards. */
  steps: [Step, Step, Step];
  downloadLabel: string;
  onDownload: () => Promise<void>;
  /** Sends the file; preview = only check it. */
  upload: (file: File, preview: boolean) => Promise<StudentImportResult>;
  /** E.g. "Save students". */
  saveLabel: string;
  /** False when the branch / semester / pattern are not chosen yet (the page says so). */
  ready: () => boolean;
  /** The API's reason for a failed request. */
  reason: (err: unknown, fallback: string) => string;
}

const STATUS_STYLE: Record<ImportRow["status"], string> = {
  OK: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  Flagged: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400",
  Error: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  Unchanged: "bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-400",
  Skipped: "bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-400",
};

/**
 * Download a sheet, fill it in, upload it: the upload is first only CHECKED and every row's result shown
 * (OK / Flagged / Error / ...); Save then sends the same file again for real. Nothing is saved while any row
 * has an error. Used by the Excel import of new students and the email sheet of saved students.
 */
export default function SheetImportPanel({ steps, downloadLabel, onDownload, upload, saveLabel, ready, reason }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<StudentImportResult | null>(null);

  const download = async () => {
    if (!ready()) return;
    setBusy(true);
    try {
      await onDownload();
    } finally {
      setBusy(false);
    }
  };

  const send = async (chosen: File, preview: boolean) => {
    setBusy(true);
    if (preview) setResult(null);
    try {
      setResult(await upload(chosen, preview));
    } catch (err) {
      setResult({ success: false, message: reason(err, "The file could not be read."), errors: [] });
    } finally {
      setBusy(false);
    }
  };

  const pick = (chosen: File | undefined) => {
    if (!chosen || !ready()) return;
    if (!/\.xlsx$/i.test(chosen.name)) {
      setFile(null);
      setResult({ success: false, message: "Choose the filled-in .xlsx sheet.", errors: [] });
      return;
    }
    setFile(chosen);
    send(chosen, true);
  };

  const canSave = !!file && !!result?.success && !result.saved && (result.rows ?? []).some((r) => r.status === "OK" || r.status === "Flagged");
  const rows = result?.rows ?? [];
  const showIds = rows.some((r) => r.studentId);
  const tone = !result
    ? ""
    : !result.success
      ? "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
      : result.saved
        ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
        : "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300";

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      <ol className="grid grid-cols-1 gap-4 @min-[860px]:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{step.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{step.text}</p>
              </div>
            </div>
            {i === 0 && (
              <Button size="sm" variant="outline" className="mt-auto self-start" onClick={download} disabled={busy} startIcon={<Download className="size-4" />}>
                {downloadLabel}
              </Button>
            )}
            {i === 2 && (
              <>
                <Button size="sm" className="mt-auto self-start" onClick={() => ready() && input.current?.click()} disabled={busy} startIcon={<Upload className="size-4" />}>
                  {busy ? "Working…" : "Upload and check"}
                </Button>
                <input
                  ref={input}
                  type="file"
                  accept=".xlsx"
                  aria-label="Filled-in sheet (.xlsx)"
                  className="hidden"
                  onChange={(e) => {
                    pick(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </li>
        ))}
      </ol>

      {result && (
        <div role="status" className={`rounded-xl border p-4 text-sm ${tone}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="flex min-w-0 items-start gap-2 font-medium">
              <FileSpreadsheet className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">
                {file ? `${file.name}: ` : ""}
                {result.message}
              </span>
            </p>
            {canSave && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => { setFile(null); setResult(null); }} disabled={busy}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => file && send(file, false)} disabled={busy}>
                  {busy ? "Saving…" : saveLabel}
                </Button>
              </div>
            )}
          </div>

          {rows.length > 0 ? (
            <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Row</th>
                    {showIds && <th className="px-3 py-2 font-medium">Student ID</th>}
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((r) => (
                    <tr key={r.row}>
                      <td className="px-3 py-1.5 tabular-nums">{r.row}</td>
                      {showIds && <td className="px-3 py-1.5 tabular-nums">{r.studentId}</td>}
                      <td className="px-3 py-1.5">{r.name}</td>
                      <td className="px-3 py-1.5 break-all">{r.email}</td>
                      <td className="px-3 py-1.5">
                        <span className={`inline-block rounded px-1.5 py-0.5 font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                        {r.note && <span className="ml-2">{r.note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            result.errors.length > 0 && (
              <ul className="mt-2 max-h-60 list-disc space-y-0.5 overflow-y-auto pl-5">
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )
          )}
        </div>
      )}
    </div>
  );
}
