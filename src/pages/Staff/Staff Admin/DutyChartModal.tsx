import { useState } from "react";
import Swal from "sweetalert2";
import { RefreshCw, X } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { Modal } from "../../../components/ui/modal";
import { DutyChartService } from "../../../services/StaffLetterService";
import type { DutyChartDetail, DutyChartSummary, DutyDay } from "../../../services/StaffLetterService";
import { fullDate, weekdayShort } from "./dutyModel";
import { LetterDateField } from "./LetterPageParts";
import { apiReason, countWord } from "./letterHelpers";

interface Props {
  /** The exam period being changed; left out for a new one. */
  chart?: DutyChartSummary;
  days?: DutyDay[];
  ayid: string;
  onClose: () => void;
  /** After a save or a refresh: the chart as it now is, and whether it is a new one. */
  onSaved: (detail: DutyChartDetail, created: boolean) => void;
  onDeleted: () => void;
}

/** One line of the days table while it is being edited. */
interface DayRow {
  date: string;
  morning: string;
  afternoon: string;
  fromTimetable: boolean;
}

const HALVES = [
  { value: "none", label: "Not a half" },
  { value: "First Half", label: "First Half" },
  { value: "Second Half", label: "Second Half" },
];

const toRows = (days: DutyDay[]): DayRow[] => days.map((d) => ({ date: d.date, morning: d.morning ?? "", afternoon: d.afternoon ?? "", fromTimetable: d.fromTimetable }));

const rowKey = (rows: DayRow[]) =>
  [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => `${r.date}|${r.morning.trim()}|${r.afternoon.trim()}`)
    .join(";");

const timeInput =
  "h-9 w-full min-w-36 rounded-lg border border-gray-300 bg-transparent px-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90";

/**
 * New exam period (name, half, dates, note; the days come from the exam timetables) or Edit (the same, plus the days:
 * their session times, adding and removing days, reading the timetables again).
 */
export default function DutyChartModal({ chart, days: savedDays = [], ayid, onClose, onSaved, onDeleted }: Props) {
  const editing = !!chart;
  const [name, setName] = useState(chart?.name ?? "");
  const [half, setHalf] = useState(chart?.half || "none");
  const [from, setFrom] = useState(chart?.fromDate ?? "");
  const [to, setTo] = useState(chart?.toDate ?? "");
  const [note, setNote] = useState(chart?.note ?? "");
  const [rows, setRows] = useState<DayRow[]>(() => toRows(savedDays));
  const [original, setOriginal] = useState(() => rowKey(toRows(savedDays)));
  const [newDay, setNewDay] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const daysChanged = rowKey(rows) !== original;
  const detailsChanged = !chart || name.trim() !== chart.name || (half === "none" ? "" : half) !== chart.half || from !== chart.fromDate || to !== chart.toDate || note.trim() !== (chart.note ?? "");
  const outside = (date: string) => !!from && !!to && (date < from || date > to);
  const outsideCount = rows.filter((r) => outside(r.date)).length;

  const edit = (date: string, patch: Partial<DayRow>) => setRows((current) => current.map((r) => (r.date === date ? { ...r, ...patch } : r)));

  const addDay = () => {
    if (!newDay) return;
    if (rows.some((r) => r.date === newDay)) {
      setError(`${fullDate(newDay)} is already in the list.`);
      return;
    }
    if (outside(newDay)) {
      setError(`${fullDate(newDay)} is outside the From and To dates. Change them first.`);
      return;
    }
    setError("");
    setRows((current) => [...current, { date: newDay, morning: "", afternoon: "", fromTimetable: false }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDay("");
  };

  const refresh = async () => {
    if (!chart) return;
    if (daysChanged) {
      const ok = await Swal.fire({ icon: "question", title: "Read the timetables again?", text: "The changes you made to the days below are dropped.", showCancelButton: true, confirmButtonText: "Read again" });
      if (!ok.isConfirmed) return;
    }
    setBusy(true);
    setError("");
    try {
      const detail = await DutyChartService.refreshDays(chart.id);
      const fresh = toRows(detail.days);
      setRows(fresh);
      setOriginal(rowKey(fresh));
      onSaved(detail, false);
    } catch (err) {
      setError(apiReason(err, "The timetables could not be read."));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return setError("Give the exam period a name, e.g. May–June 2026 End-Semester.");
    if (!from || !to) return setError("Choose the first and last date of the exam period.");
    if (from > to) return setError("The first date is after the last date.");
    setBusy(true);
    setError("");
    try {
      let detail: DutyChartDetail | null = null;
      if (!chart || detailsChanged) {
        const dto = { ayid, name: name.trim(), half: half === "none" ? "" : half, fromDate: from, toDate: to, note: note.trim() };
        detail = chart ? await DutyChartService.update(chart.id, dto) : await DutyChartService.create(dto);
      }
      if (chart && (daysChanged || outsideCount > 0)) {
        // The days outside the new dates go; days the timetables brought in for a longer range stay.
        const known = new Set(savedDays.map((d) => d.date));
        const mine = rows.filter((r) => !outside(r.date));
        const brought = (detail?.days ?? []).filter((d) => !known.has(d.date) && !mine.some((r) => r.date === d.date));
        detail = await DutyChartService.saveDays(chart.id, [
          ...mine.map((r) => ({ date: r.date, morning: r.morning.trim() || null, afternoon: r.afternoon.trim() || null })),
          ...brought.map((d) => ({ date: d.date, morning: d.morning, afternoon: d.afternoon })),
        ]);
      }
      if (detail) onSaved(detail, !chart);
      onClose();
    } catch (err) {
      setError(apiReason(err, "The exam period could not be saved."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!chart) return;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete this exam period?",
      text: `${chart.letterCount > 0 ? `${countWord(chart.letterCount, "letter")} will be cancelled and their numbers are not used again. ` : ""}This cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: "Delete exam period",
      confirmButtonColor: "#d92d20",
    });
    if (!ok.isConfirmed) return;
    setBusy(true);
    try {
      await DutyChartService.remove(chart.id);
      onDeleted();
    } catch (err) {
      setError(apiReason(err, "The exam period could not be deleted."));
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={() => !busy && onClose()} className="m-4 max-w-[760px]">
      <div role="dialog" aria-modal="true" aria-label={editing ? "Edit exam period" : "New exam period"} className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="pr-10">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{editing ? "Edit exam period" : "New exam period"}</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {editing ? "Change the name or dates, and the exam days with their session times." : "One exam period for all semesters together. The days are filled in from the exam timetables between the two dates."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-4">
          <div className="sm:col-span-3">
            <Input label="Name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} hint="For example May–June 2026 End-Semester." />
          </div>
          <Select label="Half" placeholder="Half" options={HALVES} value={half} onChange={setHalf} />
          <div className="sm:col-span-1">
            <LetterDateField label="From" value={from} onChange={setFrom} title="First date of the exam period" />
          </div>
          <div className="sm:col-span-1">
            <LetterDateField label="To" value={to} onChange={setTo} title="Last date of the exam period" />
          </div>
          <div className="sm:col-span-2">
            <Input label="Note for staff" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} hint="Shown above the duty grid, for example the hours to be in campus." />
          </div>
        </div>

        {editing && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Days <span className="font-normal text-gray-500 dark:text-gray-400">· leave a session time empty when there is no such session</span>
              </p>
              <button
                type="button"
                onClick={refresh}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-sm font-medium text-brand-500 hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-white/[0.05]"
                title="Add the exam days that are in the timetables, and fill empty session times. Days you changed by hand stay as they are."
              >
                <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh from timetables
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-xl border border-gray-200 px-4 py-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">No exam days yet. Add them below, or refresh from timetables.</p>
            ) : (
              <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th scope="col" className="sticky top-0 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
                        Date
                      </th>
                      <th scope="col" className="sticky top-0 border-b border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-800 dark:bg-gray-900">
                        Morning
                      </th>
                      <th scope="col" className="sticky top-0 border-b border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-800 dark:bg-gray-900">
                        Afternoon
                      </th>
                      <th scope="col" className="sticky top-0 border-b border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-800 dark:bg-gray-900" />
                      <th scope="col" className="sticky top-0 w-10 border-b border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-800 dark:bg-gray-900">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const saved = savedDays.find((d) => d.date === r.date);
                      const byTimetable = r.fromTimetable && !!saved && (saved.morning ?? "") === r.morning.trim() && (saved.afternoon ?? "") === r.afternoon.trim();
                      return (
                        <tr key={r.date}>
                          <td className="whitespace-nowrap border-b border-gray-100 px-3 py-1.5 text-gray-800 dark:border-gray-800 dark:text-white/90">
                            {weekdayShort(r.date)} {fullDate(r.date)}
                          </td>
                          <td className="border-b border-gray-100 px-2 py-1.5 dark:border-gray-800">
                            <input value={r.morning} maxLength={50} onChange={(e) => edit(r.date, { morning: e.target.value })} placeholder="10:30 AM - 1:30 PM" aria-label={`Morning time on ${fullDate(r.date)}`} className={timeInput} />
                          </td>
                          <td className="border-b border-gray-100 px-2 py-1.5 dark:border-gray-800">
                            <input value={r.afternoon} maxLength={50} onChange={(e) => edit(r.date, { afternoon: e.target.value })} placeholder="2:30 PM - 5:30 PM" aria-label={`Afternoon time on ${fullDate(r.date)}`} className={timeInput} />
                          </td>
                          <td className="whitespace-nowrap border-b border-gray-100 px-2 py-1.5 text-xs dark:border-gray-800">
                            {outside(r.date) ? (
                              <span className="text-error-600 dark:text-error-400">Outside the dates</span>
                            ) : byTimetable ? (
                              <span className="text-gray-500 dark:text-gray-400">From timetable</span>
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300">By hand</span>
                            )}
                          </td>
                          <td className="border-b border-gray-100 px-2 py-1.5 text-right dark:border-gray-800">
                            <button
                              type="button"
                              onClick={() => setRows((current) => current.filter((x) => x.date !== r.date))}
                              aria-label={`Remove ${fullDate(r.date)}`}
                              title="Remove this day"
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-error-600 focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden dark:hover:bg-white/[0.05]"
                            >
                              <X className="size-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {outsideCount > 0 && <p className="mt-2 text-xs text-warning-700 dark:text-orange-300">{countWord(outsideCount, "day")} outside the From and To dates will be removed when you save.</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="w-44">
                <LetterDateField label="Add a day" value={newDay} onChange={setNewDay} title="A day with no timetable, for example a valuation day" />
              </div>
              <Button size="sm" variant="outline" onClick={addDay} disabled={!newDay || busy}>
                Add day
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {editing ? (
            <button type="button" onClick={remove} disabled={busy} className="rounded-md px-1.5 py-0.5 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:text-error-400 dark:hover:bg-white/[0.05]">
              Delete this exam period
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy || (editing && !detailsChanged && !daysChanged && outsideCount === 0)}>
              {busy ? "Saving…" : editing ? "Save" : "Create exam period"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
