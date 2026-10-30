import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Ban, FileText, Mail, Printer } from "lucide-react";
import Swal from "sweetalert2";
import Button from "../../../components/ui/button/Button";
import { DutyChartService, StaffLetterService } from "../../../services/StaffLetterService";
import type { LetterEmailPreview, LetterEmailStatus, LetterKind, LetterTarget } from "../../../services/StaffLetterService";
import { LetterNotice, LetterSearch, LetterSummary, tableCell, tableHead } from "./LetterPageParts";
import { dayLabel } from "./dutyModel";
import { apiReason, countWord, emailProgress, escapeText, hasActiveLink, isQueued, needsNewLink, openPdf } from "./letterHelpers";
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
  queued: { dot: "animate-pulse bg-brand-500", text: "text-brand-600 dark:text-brand-400" },
  sent: { dot: "bg-brand-500", text: "text-gray-700 dark:text-gray-300" },
  opened: { dot: "bg-warning-500", text: "text-gray-700 dark:text-gray-300" },
  done: { dot: "bg-success-500", text: "text-gray-700 dark:text-gray-300" },
  stopped: { dot: "bg-gray-400 dark:bg-gray-500", text: "text-gray-500 dark:text-gray-400" },
  error: { dot: "bg-error-500", text: "text-error-600 dark:text-error-500" },
};

/** How often the email status is read again while an email waits in the queue, and for how long at most. */
const POLL_EVERY_MS = 5000;
const POLL_FOR_MS = 2 * 60 * 1000;

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

const ROW_ACTION = {
  primary: "border-brand-500 text-brand-600 hover:bg-brand-50 dark:border-brand-500/60 dark:text-brand-400 dark:hover:bg-brand-500/10",
  neutral: "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.05]",
  danger: "border-gray-300 text-gray-700 hover:border-error-300 hover:bg-error-50 hover:text-error-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-error-500/40 dark:hover:bg-error-500/10 dark:hover:text-error-500",
};

/** A small outlined button (icon and word) in the Actions column. */
function RowAction({
  children,
  icon,
  label,
  title,
  busy,
  look,
  onClick,
  disabled,
}: {
  children: string;
  icon: ReactNode;
  label: string;
  title: string;
  busy?: boolean;
  look: keyof typeof ROW_ACTION;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border bg-transparent px-2.5 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 ${ROW_ACTION[look]}`}
    >
      {icon}
      {busy ? "Sending…" : children}
    </button>
  );
}

/** The saved letters of an exam, one row each: open the PDF, see who has been emailed, print them all or email them. */
export default function LettersView({ target, kind, rows, dirty, loadedKey, emptyText, embedded }: Props) {
  const { examId, dutyChartId } = target;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Map<string, LetterEmailStatus>>(new Map());
  // Who is being emailed now: a person's id, or "all" for the top bar button.
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  // True once Email was pressed in the question (before that the row is only being checked).
  const [sendingNow, setSendingNow] = useState(false);
  // Set at once on the first click, before React re-renders, so a quick second click cannot send again.
  const sendLock = useRef(false);
  const [printing, setPrinting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [notice, setNotice] = useState("");

  // Goes up after every send, so the wait for the queue is timed again from then.
  const [sendRound, setSendRound] = useState(0);

  // quiet: a read by the timer; if it fails the list stays as it was.
  const loadStatus = useCallback(
    (quiet = false) => {
      StaffLetterService.emailStatus({ examId, dutyChartId })
        .then((list) => setStatus(new Map(list.map((s) => [s.staffId, s]))))
        .catch(() => {
          if (!quiet) setStatus(new Map());
        });
    },
    [examId, dutyChartId],
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus, loadedKey]);

  // An email leaves the queue some seconds after the click: read the status again until nothing waits (2 minutes at most).
  const anyQueued = useMemo(() => [...status.values()].some((s) => isQueued(s)), [status]);
  useEffect(() => {
    if (!anyQueued) return;
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started >= POLL_FOR_MS) clearInterval(timer);
      else loadStatus(true);
    }, POLL_EVERY_MS);
    return () => clearInterval(timer);
  }, [anyQueued, sendRound, loadStatus]);

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

  // People with a letter whose link was never emailed, was stopped or ran out: the ones "Email … not sent yet" is for.
  const notSentCount = useMemo(() => new Set(rows.map((r) => r.staffId).filter((id) => !hasActiveLink(status.get(id)))).size, [rows, status]);

  /**
   * Checks who would get the email, asks once, then sends. A problem found by the check (no email address, no sending
   * account) is shown instead of the question. staffIds left out means everyone with a letter.
   */
  const emailLetters = async (opts: { sendingKey: string; staffIds?: string[]; onlyNotSent: boolean; question: (n: number) => string; replaces?: boolean }) => {
    if (sendLock.current) return;
    sendLock.current = true;
    setSendingTo(opts.sendingKey);
    try {
      const request = { examId, dutyChartId, kind, staffIds: opts.staffIds, onlyNotSent: opts.onlyNotSent };
      let preview: LetterEmailPreview;
      try {
        preview = await StaffLetterService.emailPreview(request);
      } catch (err) {
        Swal.fire("Email letters", apiReason(err, "Could not check who the letters would go to."), "error");
        return;
      }
      if (!preview.senderReady) {
        Swal.fire("Email letters", "Email is not set up for this college yet, so nothing can be sent. Ask the platform admin to set up the sending account.", "warning");
        return;
      }
      const noEmail = preview.noEmail.map(escapeText).join(", ");
      if (preview.withEmail === 0) {
        const why = preview.noEmail.length > 0 ? `No email address: ${noEmail}. Add it in Staff Master first.` : "There is nobody to email.";
        Swal.fire({ icon: "warning", title: "Nothing to send", html: `<p>${why}</p>` });
        return;
      }
      const skipped = preview.noEmail.length > 0 ? `<p style="font-size:13px;color:#b54708;margin-top:8px">Skipped, no email address: ${noEmail}. Add it in Staff Master first.</p>` : "";
      const replaces = opts.replaces ? `<p style="font-size:13px;color:#6b7280;margin-top:8px">Their earlier link stops working.</p>` : "";
      const signed =
        `<div style="margin-top:12px;text-align:left;border-radius:8px;background:#f3f4f6;color:#4b5563;padding:8px 12px;font-size:13px"><span style="color:#6b7280">Signed:</span><div style="white-space:pre-line">${escapeText(preview.signature ?? "")}</div></div>` +
        `<p style="font-size:13px;color:#6b7280;margin-top:6px">Change it in Letter settings.</p>`;
      const ok = await Swal.fire({
        icon: "question",
        title: opts.question(preview.withEmail),
        html: `${replaces}${skipped}${signed}`,
        showCancelButton: true,
        confirmButtonText: "Email",
      });
      if (!ok.isConfirmed) return;
      setSendingNow(true);
      const r = await StaffLetterService.emailSend(request);
      Swal.fire({ icon: "success", title: r.message || "The letters were emailed.", timer: 2500, showConfirmButton: false });
      setSendRound((n) => n + 1);
      loadStatus();
    } catch (err) {
      Swal.fire("Not sent", apiReason(err, "The letters could not be emailed. Try again."), "error");
    } finally {
      sendLock.current = false;
      setSendingTo(null);
      setSendingNow(false);
    }
  };

  const emailOne = (r: LetterRow, resend: boolean) =>
    emailLetters({ sendingKey: r.staffId, staffIds: [r.staffId], onlyNotSent: false, question: () => `Email ${escapeText(r.name)} their letters?`, replaces: resend });

  const emailNotSent = () => emailLetters({ sendingKey: "all", onlyNotSent: true, question: (n) => `Email ${n === 1 ? "1 person" : `${n} people`} their letters?` });

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
            <Button size="sm" variant="outline" onClick={stopAll} disabled={dirty || stopping || sendingTo !== null} startIcon={<Ban className="size-4" />} title="Nobody can open their emailed link until you email again">
              Stop all links
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={printAll} disabled={none || dirty || printing} startIcon={<Printer className="size-4" />} title="One PDF with every letter, to print">
            {printing ? "Preparing…" : "Print all"}
          </Button>
          <Button
            size="sm"
            onClick={emailNotSent}
            disabled={notSentCount === 0 || dirty || sendingTo !== null}
            startIcon={<Mail className="size-4" />}
            title="Email the people who were not emailed yet, or whose link was stopped or ran out"
          >
            {sendingTo === "all" && sendingNow ? "Sending…" : `Email ${notSentCount} not sent yet`}
          </Button>
        </div>
      </div>

      <LetterNotice message={notice} onDismiss={() => setNotice("")} />

      {none ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
      ) : shown.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No letter matches your search.</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
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
                      <div className="flex items-center justify-end gap-2">
                        {hasActiveLink(st) ? (
                          <>
                            <RowAction
                              look="neutral"
                              onClick={() => emailOne(r, true)}
                              disabled={dirty || sendingTo !== null}
                              busy={sendingTo === r.staffId && sendingNow}
                              title="Email a new link; the old one stops working"
                              label={`Email the letters to ${r.name} again`}
                              icon={<Mail className="size-4" aria-hidden="true" />}
                            >
                              Resend
                            </RowAction>
                            <RowAction
                              look="danger"
                              onClick={() => stopOne(r)}
                              disabled={stopping || sendingTo !== null}
                              title="Stop this emailed link"
                              label={`Stop the emailed link of ${r.name}`}
                              icon={<Ban className="size-4" aria-hidden="true" />}
                            >
                              Stop
                            </RowAction>
                          </>
                        ) : (
                          <RowAction
                            look="primary"
                            onClick={() => emailOne(r, false)}
                            disabled={dirty || sendingTo !== null}
                            busy={sendingTo === r.staffId && sendingNow}
                            title="Email this person their letters"
                            label={`Email the letters to ${r.name}`}
                            icon={<Mail className="size-4" aria-hidden="true" />}
                          >
                            {needsNewLink(st) ? "Send new" : "Send"}
                          </RowAction>
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
    </div>
  );
}
