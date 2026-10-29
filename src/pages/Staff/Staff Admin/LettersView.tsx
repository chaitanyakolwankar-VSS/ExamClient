import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Mail, Printer } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import { DutyChartService, StaffLetterService } from "../../../services/StaffLetterService";
import type { LetterEmailStatus, LetterKind, LetterTarget } from "../../../services/StaffLetterService";
import EmailLettersModal from "./EmailLettersModal";
import { LetterSearch, LetterSummary, tableCell, tableHead } from "./LetterPageParts";
import { dayLabel } from "./dutyModel";
import { countWord, emailProgress, openPdf } from "./letterHelpers";

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
}

const TONE = {
  none: "text-gray-500 dark:text-gray-400",
  sent: "text-gray-700 dark:text-gray-300",
  opened: "text-brand-600 dark:text-brand-400",
  done: "text-success-600 dark:text-success-400",
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
export default function LettersView({ target, title, kind, rows, dirty, loadedKey, emptyText }: Props) {
  const { examId, dutyChartId } = target;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Map<string, LetterEmailStatus>>(new Map());
  const [emailing, setEmailing] = useState(false);
  const [printing, setPrinting] = useState(false);

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

  const supervision = kind === "supervision";
  const none = rows.length === 0;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="w-full sm:w-72">
          <LetterSearch value={search} onChange={setSearch} placeholder="Letter no, name or role" label="Search letters" />
        </div>
        <LetterSummary text={countWord(rows.length, "letter")} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {dirty && <span className="text-sm text-warning-600 dark:text-orange-300">Save your changes first.</span>}
          <Button size="sm" variant="outline" onClick={printAll} disabled={none || dirty || printing} startIcon={<Printer className="size-4" />} title="One PDF with every letter, to print">
            {printing ? "Preparing…" : "Print all"}
          </Button>
          <Button size="sm" onClick={() => setEmailing(true)} disabled={none || dirty} startIcon={<Mail className="size-4" />}>
            Email letters
          </Button>
        </div>
      </div>

      {none ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
      ) : shown.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No letter matches your search.</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto overscroll-contain">
          <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-sm">
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
                <th scope="col" className={`${tableHead} w-14`}>
                  <span className="sr-only">PDF</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const progress = emailProgress(status.get(r.staffId));
                return (
                  <tr key={r.letterId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className={`${tableCell} whitespace-nowrap font-mono text-xs text-gray-600 dark:text-gray-400`}>{r.letterNo}</td>
                    <td className={`${tableCell} font-medium text-gray-800 dark:text-white/90`}>{r.name}</td>
                    <td className={`${tableCell} text-gray-700 dark:text-gray-300`}>
                      {r.role}
                      {r.detail && <span className="block text-xs text-gray-500 dark:text-gray-400">{r.detail}</span>}
                    </td>
                    {supervision && <td className={`${tableCell} text-gray-700 dark:text-gray-300`}>{r.duties && r.duties.length > 0 ? <DutyDates duties={r.duties} /> : "—"}</td>}
                    <td className={`${tableCell} whitespace-nowrap ${TONE[progress.tone]}`}>{progress.text}</td>
                    <td className={`${tableCell} text-right`}>
                      <button
                        type="button"
                        onClick={() => openPdf("Letter PDF", () => StaffLetterService.pdf(r.letterId))}
                        title="Open the letter as PDF"
                        aria-label={`Open the letter of ${r.name} as PDF`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:hover:bg-white/[0.05]"
                      >
                        <FileText className="size-4" />
                      </button>
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
