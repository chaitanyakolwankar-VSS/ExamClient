import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Download, Plus } from "lucide-react";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import Button from "../../../components/ui/button/Button";
import type { DutyChartDetail, DutyDay } from "../../../services/StaffLetterService";
import type { Staff } from "../../../services/StaffService";
import DutyByDate from "./DutyByDate";
import DutyDayModal from "./DutyDayModal";
import DutyGrid from "./DutyGrid";
import { dayLabel, firstSlot, sessionText, weekdayShort } from "./dutyModel";
import type { Cells, Ctx } from "./dutyModel";
import { LetterSearch, LetterSummary, MiniChoice } from "./LetterPageParts";
import { StepCard } from "./LetterSteps";

type Sub = "grid" | "date";

interface Props {
  chartId: string;
  days: DutyDay[];
  /** The people on the chart who are still in the staff list. */
  members: Staff[];
  cells: Cells;
  ctx: Ctx;
  edit: (fn: (cells: Cells) => Cells) => void;
  undo: () => void;
  canUndo: boolean;
  /** Sessions given per "date|M" or "date|A". */
  perSlot: Map<string, number>;
  duties: number;
  /** The chart's note for staff. */
  note: string | null;
  downloading: boolean;
  onDownload: () => void;
  /** After a day was added or its times changed: the chart as it now is. */
  onDaysSaved: (detail: DutyChartDetail) => void;
  footer: ReactNode;
}

/** One chip of the legend, coloured like the cells of the grid. */
const LEGEND = [
  { code: "M", text: "Morning", tone: "duty" },
  { code: "A", text: "Afternoon", tone: "duty" },
  { code: "M/A", text: "Both", tone: "duty" },
  { code: "CC", text: "Chief Conductor", tone: "lead" },
  { code: "SS", text: "Senior Supervisor", tone: "lead" },
  { code: "O", text: "Other work", tone: "other" },
] as const;

const CHIP = {
  duty: { box: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300", dot: "bg-brand-500" },
  lead: { box: "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/15 dark:text-orange-300", dot: "bg-warning-500" },
  other: { box: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-white/[0.08] dark:text-gray-300", dot: "bg-gray-400" },
};

/** Step 3: give the duties. Only the people from step 2 are listed, as a grid (people by days) or one day and session at a time. */
export default function DutyMarkStep({ chartId, days, members, cells, ctx, edit, undo, canUndo, perSlot, duties, note, downloading, onDownload, onDaysSaved, footer }: Props) {
  const [sub, setSub] = useState<Sub>("grid");
  const [search, setSearch] = useState("");
  const [onlyDuty, setOnlyDuty] = useState(false);
  const [slotChoice, setSlotChoice] = useState("");
  const [hint, setHint] = useState("");
  /** The day box: open for a new day (empty date) or for the day whose heading was clicked. */
  const [dayBox, setDayBox] = useState<{ date: string } | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showHint = useCallback((text: string) => {
    setHint(text);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(""), 4000);
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? members.filter((s) => `${s.name} ${s.employeeCode ?? ""} ${s.department ?? ""} ${s.designation ?? ""}`.toLowerCase().includes(q)) : members;
  }, [members, search]);

  // The day and session of the By date view: the first one until another is chosen.
  const slot = slotChoice && days.some((d) => slotChoice.startsWith(d.date)) ? slotChoice : firstSlot(days);
  const slotOptions = days.flatMap((d) =>
    (["M", "A"] as const).map((s) => ({
      value: `${d.date}|${s}`,
      label: `${weekdayShort(d.date)} ${dayLabel(d.date)} · ${s === "M" ? sessionText("Morning", d.morning) : sessionText("Afternoon", d.afternoon)} (${perSlot.get(`${d.date}|${s}`) ?? 0} on duty)`,
    })),
  );
  const [slotDate, slotSession] = slot.split("|");
  const slotDay = ctx.dayByDate.get(slotDate);

  return (
    <StepCard number={3} title="Mark duties" hint={`Click a cell to give a duty. Only the ${members.length} ${members.length === 1 ? "person" : "people"} from step 2 are listed.`} footer={footer}
      flush={
        <div className="border-t border-gray-100 dark:border-gray-800">
          {sub === "grid" ? (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2 sm:px-5 dark:border-gray-800">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Legend:</span>
                {LEGEND.map((l) => (
                  <span key={l.code} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium ${CHIP[l.tone].box}`}>
                    <span className={`size-1.5 rounded-full ${CHIP[l.tone].dot}`} aria-hidden="true" />
                    <b className="font-semibold">{l.code}</b> {l.text}
                  </span>
                ))}
              </div>
              <p className="border-b border-gray-100 px-4 py-2 text-sm text-gray-600 sm:px-5 dark:border-gray-800 dark:text-gray-400" aria-live="polite">
                {hint ? (
                  <span className="font-medium text-warning-700 dark:text-orange-300">{hint}</span>
                ) : (
                  "Click a cell, or use the arrow keys: M, A, B (both), C or S (role), Delete. Enter opens more."
                )}
              </p>
              {note && <p className="border-b border-gray-100 px-4 py-2 text-sm text-gray-600 sm:px-5 dark:border-gray-800 dark:text-gray-400">Note for staff: {note}</p>}
              {shown.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No one matches your search.</p>
              ) : (
                <DutyGrid days={days} staff={shown} cells={cells} ctx={ctx} onlyDuty={onlyDuty} edit={edit} undo={undo} onDay={(date) => setDayBox({ date })} onHint={showHint} />
              )}
            </>
          ) : slotDay && (slotSession === "M" || slotSession === "A") ? (
            <DutyByDate day={slotDay} session={slotSession} staff={shown} cells={cells} ctx={ctx} edit={edit} />
          ) : (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Choose a day and session.</p>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <MiniChoice
          label="How to mark duties"
          value={sub}
          onChange={setSub}
          options={[
            { value: "grid", label: "Grid" },
            { value: "date", label: "By date" },
          ]}
        />
        <div className="w-full sm:w-64">
          <LetterSearch value={search} onChange={setSearch} placeholder="Name, ID or designation" label="Search the people on duty" />
        </div>
        {sub === "grid" ? (
          <Checkbox label="Only people with duties" checked={onlyDuty} onChange={setOnlyDuty} />
        ) : (
          <div className="w-full sm:w-96">
            <Select label="Day and session" placeholder="Select Day and session" options={slotOptions} value={slot} onChange={setSlotChoice} />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <LetterSummary text={`${members.length} ${members.length === 1 ? "person" : "people"} · ${duties} ${duties === 1 ? "duty" : "duties"}`} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={undo} disabled={!canUndo} title="Undo the last change (Ctrl+Z)">
            Undo
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDayBox({ date: "" })} startIcon={<Plus className="size-4" />} title="Add a day to the exam period. To change the times of a day, click its heading in the grid.">
            Add day
          </Button>
          <Button size="sm" variant="outline" onClick={onDownload} disabled={downloading} startIcon={<Download className="size-4" />} title="The saved chart as an Excel sheet. Fill it in and use Import Excel in step 2 to read it back.">
            {downloading ? "Preparing…" : "Download Excel"}
          </Button>
        </div>
      </div>
      {dayBox && <DutyDayModal key={dayBox.date} chartId={chartId} days={days} date={dayBox.date || undefined} onClose={() => setDayBox(null)} onSaved={onDaysSaved} />}
    </StepCard>
  );
}
