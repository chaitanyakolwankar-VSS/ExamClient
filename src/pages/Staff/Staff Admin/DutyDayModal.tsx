import { useState } from "react";
import Button from "../../../components/ui/button/Button";
import { Modal } from "../../../components/ui/modal";
import { DutyChartService } from "../../../services/StaffLetterService";
import type { DutyChartDetail, DutyDay } from "../../../services/StaffLetterService";
import { fullDate, weekdayShort } from "./dutyModel";
import { LetterDateField } from "./LetterPageParts";
import { apiReason } from "./letterHelpers";

interface Props {
  chartId: string;
  /** Every day of the chart now; the save sends all of them. */
  days: DutyDay[];
  /** The day to change; left out to add a new one. */
  date?: string;
  onClose: () => void;
  /** After the save: the chart as it now is. */
  onSaved: (detail: DutyChartDetail) => void;
}

const timeInput =
  "mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90";

/** Add a day to the exam period, or change the session times of one. Any date is fine, and the times are optional. */
export default function DutyDayModal({ chartId, days, date: initial = "", onClose, onSaved }: Props) {
  const first = days.find((d) => d.date === initial);
  const [date, setDate] = useState(initial);
  const [morning, setMorning] = useState(first?.morning ?? "");
  const [afternoon, setAfternoon] = useState(first?.afternoon ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const existing = days.find((d) => d.date === date);
  const unchanged = !!existing && (existing.morning ?? "") === morning.trim() && (existing.afternoon ?? "") === afternoon.trim();

  // Picking a day that is already in the chart shows its times.
  const pick = (value: string) => {
    setDate(value);
    setError("");
    const day = days.find((d) => d.date === value);
    if (day) {
      setMorning(day.morning ?? "");
      setAfternoon(day.afternoon ?? "");
    }
  };

  const save = async () => {
    if (busy) return;
    if (!date) return setError("Choose the date.");
    setBusy(true);
    setError("");
    try {
      const mine = { date, morning: morning.trim() || null, afternoon: afternoon.trim() || null };
      const all = days.map((d) => (d.date === date ? mine : { date: d.date, morning: d.morning, afternoon: d.afternoon }));
      if (!existing) all.push(mine);
      onSaved(await DutyChartService.saveDays(chartId, all));
      onClose();
    } catch (err) {
      setError(apiReason(err, "The day could not be saved."));
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={() => !busy && onClose()} className="m-4 max-w-[460px]">
      <div role="dialog" aria-modal="true" aria-label={initial ? "Change the times of a day" : "Add a day"} className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="pr-10">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{initial ? `Times of ${weekdayShort(initial)} ${fullDate(initial)}` : "Add a day"}</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Any date, even outside the timetable. Times are optional.</p>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-2 sm:max-w-52">
            <LetterDateField label="Date" value={date} onChange={pick} title="The day of the duty" />
          </div>
          <label className="block text-xs text-gray-500 dark:text-gray-400">
            Morning time
            <input value={morning} maxLength={50} onChange={(e) => setMorning(e.target.value)} placeholder="10:30 AM - 1:30 PM" className={timeInput} />
          </label>
          <label className="block text-xs text-gray-500 dark:text-gray-400">
            Afternoon time
            <input value={afternoon} maxLength={50} onChange={(e) => setAfternoon(e.target.value)} placeholder="2:30 PM - 5:30 PM" className={timeInput} />
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !date || unchanged}>
            {busy ? "Saving…" : existing ? "Save times" : "Add day"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
