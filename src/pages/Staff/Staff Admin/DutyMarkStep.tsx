import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Download } from "lucide-react";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import Button from "../../../components/ui/button/Button";
import type { DutyDay } from "../../../services/StaffLetterService";
import type { Staff } from "../../../services/StaffService";
import DutyByDate from "./DutyByDate";
import DutyGrid from "./DutyGrid";
import { dayLabel, firstSlot, weekdayShort } from "./dutyModel";
import type { Cells, Ctx } from "./dutyModel";
import { LetterSearch, LetterSummary, MiniChoice } from "./LetterPageParts";
import { StepCard } from "./LetterSteps";

type Sub = "grid" | "date";

interface Props {
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
  footer: ReactNode;
}

const strong = "font-medium text-gray-700 dark:text-gray-300";

/** Step 3: give the duties. Only the people from step 2 are listed, as a grid (people by days) or one day and session at a time. */
export default function DutyMarkStep({ days, members, cells, ctx, edit, undo, canUndo, perSlot, duties, note, downloading, onDownload, footer }: Props) {
  const [sub, setSub] = useState<Sub>("grid");
  const [search, setSearch] = useState("");
  const [onlyDuty, setOnlyDuty] = useState(false);
  const [slotChoice, setSlotChoice] = useState("");
  const [hint, setHint] = useState("");
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
    (["M", "A"] as const)
      .filter((s) => (s === "M" ? d.morning : d.afternoon))
      .map((s) => ({
        value: `${d.date}|${s}`,
        label: `${weekdayShort(d.date)} ${dayLabel(d.date)} · ${s === "M" ? "Morning" : "Afternoon"} ${s === "M" ? d.morning : d.afternoon} (${perSlot.get(`${d.date}|${s}`) ?? 0} on duty)`,
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
              <p className="border-b border-gray-100 px-4 py-1.5 text-xs text-gray-500 sm:px-5 dark:border-gray-800 dark:text-gray-400" aria-live="polite">
                {hint ? (
                  <span className="font-medium text-warning-700 dark:text-orange-300">{hint}</span>
                ) : (
                  <>
                    <b className={strong}>M</b> morning · <b className={strong}>A</b> afternoon · <b className={strong}>M/A</b> both · <b className={strong}>CC</b> chief conductor · <b className={strong}>SS</b> senior supervisor · <b className={strong}>V</b> valuation ·{" "}
                    <b className={strong}>O</b> other work. Click a cell, or use the arrow keys and press M, A, B (both), V, C or S (role), Delete; Enter opens more.
                  </>
                )}
              </p>
              {note && <p className="border-b border-gray-100 px-4 py-1.5 text-xs text-gray-600 sm:px-5 dark:border-gray-800 dark:text-gray-400">Note for staff: {note}</p>}
              {shown.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No one matches your search.</p>
              ) : (
                <DutyGrid days={days} staff={shown} cells={cells} ctx={ctx} onlyDuty={onlyDuty} edit={edit} undo={undo} onHint={showHint} />
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
          <Button size="sm" variant="outline" onClick={onDownload} disabled={downloading} startIcon={<Download className="size-4" />} title="The saved chart as an Excel sheet. Fill it in and use Import Excel in step 2 to read it back.">
            {downloading ? "Preparing…" : "Download Excel"}
          </Button>
        </div>
      </div>
    </StepCard>
  );
}
