import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, FileText, Mail, Printer } from "lucide-react";
import Swal from "sweetalert2";
import Button from "../../../components/ui/button/Button";
import { DutyChartService, StaffLetterService } from "../../../services/StaffLetterService";
import type { LetterEmailStatus, LetterKind, LetterTarget } from "../../../services/StaffLetterService";
import EmailLettersModal from "./EmailLettersModal";
import { LetterNotice, LetterSearch, LetterSummary, tableCell, tableHead } from "./LetterPageParts";
import { dayLabel } from "./dutyModel";
import { apiReason, countWord, emailProgress, hasActiveLink, openPdf } from "./letterHelpers";
import type { EmailTone } from "./letterHelpers";

/** One line of a supervision letter: a date and what is done on it. */
export interface LetterLine {
  date: string;
  time: string;
  role?: string;
}

/** One saved letter as the Letters table shows it. */
export interface LetterRow {
  letterId: string;
  staffId: string;
  letterNo: string;
  name: string;
  /** "Junior Supervisor", "Examiner", "Moderator". */
  role: string;
  /** A second line under the role (the subject of an appointment). */
  detail?: string;
  /** Supervision duties, in order. */
  duties?: LetterLine[];
}

interface Props {
  /** The exam (examiner and moderator letters) or the duty chart (supervision letters) the letters belong to. */
  target: LetterTarget;
  /** What the email says the letters are for: the exam's or the chart's name. */
  title: string;
  kind: LetterKind;
  rows: LetterRow[];
  /** Unsaved changes on the other view: the letters below are not up to date, so printing and emailing wait. */
  dirty: boolean;
  /** Changes whenever the letters were loaded again, so the email status is read again. */
  loadedKey: unknown;
  /** Shown when there are no letters yet. */
  emptyText: string;
  /** Inside a step card: no border or corners of its own, only a line above. */
  embedded?: boolean;
}

/** The dot and the text colour of each step of the emailed link. */
const TONE: Record<EmailTone, { dot: string; text: string }> = {
  none: { dot: "bg-gray-300 dark:bg-gray-600", text: "text-gray-500 dark:text-gray-400" },
  sent: { dot: "bg-brand-500", text: "text-gray-700 dark:text-gray-300" },
  opened: { dot: "bg-warning-500", text: "text-gray-700 dark:text-gray-300" },
  done: { dot: "bg-success-500", text: "text-gray-700 dark:text-gray-300" },
  stopped: { dot: "bg-gray-400 dark:bg-gray-500", text: "text-gray-500 dark:text-gray-400" },
};

/** The dates of a supervision letter as a short line: the first few, all of them (with times) in the tooltip. */
function DutyDates({ duties }: { duties: LetterLine[] }) {
  const dates = [...new Set(duties.map((d) => d.date))];
  const more = dates.length - 3;
  return (
    <span title={duties.map((d) => [dayLabel(d.date), d.time, d.role].filter(Boolean).join(" · ")).join("\n")}>
      {dates.slice(0, 3).map(dayLabel).join(", ")}
      {more > 0 && <span className="text-gray-500 dark:text-gray-400"> +{more} more</span>}
    </span>
  );
}

/** The saved letters of an exam, one row each: open the PDF, see who has been emailed, print them all or email them. */
export default function LettersView({ target, title, kind, rows, dirty, loadedKey, emptyText, embedded }: Props) {
  const { examId, dutyChartId } = target;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Map<string, LetterEmailStatus>>(new Map());
  const [emailing, setEmailing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [notice, setNotice] = useState("");

  const loadStatus = useCallback(() => {
    StaffLetterService.emailStatus({ examId, dutyChartId })
      .then((list) => setStatus(new Map(list.map((s) => [s.staffId, s]))))
      .catch(() => setStatus(new Map()));
  }, [examId, dutyChartId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus, loadedKey]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => `${r.letterNo} ${r.name} ${r.role} ${r.detail ?? ""}`.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const printAll = async () => {
    setPrinting(true);
    await openPdf("Print all letters", () => (dutyChartId ? DutyChartService.pdf(dutyChartId) : StaffLetterService.pdfAll(examId ?? "", kind)));
    setPrinting(false);
  };

  // People of these letters whose emailed link still works.
  const activeIds = useMemo(() => rows.map((r) => r.staffId).filter((id) => hasActiveLink(status.get(id))), [rows, status]);

  const stopLinks = async (staffIds: string[] | undefined, confirmTitle: string, confirmText: string, confirmButton: string) => {
    const ok = await Swal.fire({ icon: "warning", title: confirmTitle, text: confirmText, showCancelButton: true, confirmButtonText: confirmButton, confirmButtonColor: "#d92d20" });
    if (!ok.isConfirmed) return;
    setStopping(true);
    try {
      const r = await StaffLetterService.emailStop({ examId, dutyChartId, staffIds });
      setNotice(r.message);
      loadStatus();
    } catch (err) {
      Swal.fire("Stop links", apiReason(err, "The links could not be stopped. Try again."), "error");
    } finally {
      setStopping(false);
    }
  };

  const stopOne = (r: LetterRow) =>
    stopLinks([r.staffId], `Stop ${r.name}’s link?`, "They can’t open their letters until you email them again.", "Stop link");

  const stopAll = () =>
    stopLinks(
      undefined,
      "Stop all links?",
      `${activeIds.length === 1 ? "1 person" : `${activeIds.length} people`} will not be able to open their letters until you email them again.`,
      "Stop all links",
    );

  const supervision = kind === "supervision";
  const none = rows.length === 0;

  return (
    <div className={`min-w-0 overflow-hidden ${embedded ? "border-t border-gray-100 dark:border-gray-800" : "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="w-full sm:w-72">
          <LetterSearch value={search} onChange={setSearch} placeholder="Letter no, name or role" label="Search letters" />
        </div>
        <LetterSummary text={countWord(rows.length, "letter")} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {dirty && <span className="text-sm text-warning-600 dark:text-orange-300">Save your changes first.</span>}
          {activeIds.length > 0 && (
            <Button size="sm" variant="outline" onClick={stopAll} disabled={dirty || stopping} startIcon={<Ban className="size-4" />} title="Nobody can open their emailed link until you email again">
              Stop all links
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={printAll} disabled={none || dirty || printing} startIcon={<Printer className="size-4" />} title="One PDF with every letter, to print">
            {printing ? "Preparing…" : "Print all"}
          </Button>
          <Button size="sm" onClick={() => setEmailing(true)} disabled={none || dirty} startIcon={<Mail className="size-4" />}>
            Email letters
          </Button>
        </div>
      </div>

      <LetterNotice message={notice} onDismiss={() => setNotice("")} />

      {none ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
      ) : shown.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No letter matches your search.</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto overscroll-contain">
          <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th scope="col" className={tableHead}>
                  Letter no
                </th>
                <th scope="col" className={tableHead}>
                  Name
                </th>
                <th scope="col" className={tableHead}>
                  {supervision ? "Role" : "Appointed as"}
                </th>
                {supervision && (
                  <th scope="col" className={tableHead}>
                    Dates
                  </th>
                )}
                <th scope="col" className={tableHead}>
                  Email
                </th>
                <th scope="col" className={`${tableHead} w-px`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const st = status.get(r.staffId);
                const progress = emailProgress(st);
                const tone = TONE[progress.tone];
                return (
                  <tr key={r.letterId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className={`${tableCell} whitespace-nowrap font-mono text-xs text-gray-600 dark:text-gray-400`}>{r.letterNo}</td>
                    <td className={`${tableCell} font-medium text-gray-800 dark:text-white/90`}>{r.name}</td>
                    <td className={`${tableCell} text-gray-700 dark:text-gray-300`}>
                      {r.role}
                      {r.detail && <span className="block text-xs text-gray-500 dark:text-gray-400">{r.detail}</span>}
                    </td>
                    {supervision && <td className={`${tableCell} text-gray-700 dark:text-gray-300`}>{r.duties && r.duties.length > 0 ? <DutyDates duties={r.duties} /> : "—"}</td>}
                    <td className={`${tableCell} whitespace-nowrap ${tone.text}`}>
                      <span className="inline-flex items-center gap-2">
                        <span className={`size-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                        {progress.text}
                      </span>
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        {hasActiveLink(st) && (
                          <button
                            type="button"
                            onClick={() => stopOne(r)}
                            disabled={stopping}
                            title="Stop this emailed link"
                            aria-label={`Stop the emailed link of ${r.name}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-error-50 hover:text-error-600 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden disabled:opacity-50 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-500"
                          >
                            <Ban className="size-3.5" aria-hidden="true" />
                            Stop link
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openPdf("Letter PDF", () => StaffLetterService.pdf(r.letterId))}
                          title="Open the letter as PDF"
                          aria-label={`Open the letter of ${r.name} as PDF`}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:hover:bg-white/[0.05]"
                        >
                          <FileText className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EmailLettersModal isOpen={emailing} onClose={() => setEmailing(false)} target={target} title={title} kind={kind} onSent={loadStatus} />
    </div>
  );
}
