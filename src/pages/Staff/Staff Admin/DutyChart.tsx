import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { saveAs } from "file-saver";
import { AlertTriangle, CalendarDays, Download, FileSpreadsheet, FileText, Pencil, Plus, Save, Table2 } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import Button from "../../../components/ui/button/Button";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import { StaffService } from "../../../services/StaffService";
import type { Staff } from "../../../services/StaffService";
import { DutyChartService } from "../../../services/StaffLetterService";
import type { DutyChartDetail, DutyChartSummary, DutyDay } from "../../../services/StaffLetterService";
import DutyByDate from "./DutyByDate";
import DutyChartModal from "./DutyChartModal";
import DutyGrid from "./DutyGrid";
import DutyImportModal from "./DutyImportModal";
import LettersView from "./LettersView";
import type { LetterRow } from "./LettersView";
import { LetterDateField, LetterNotice, LetterPageHeader, LetterSearch, LetterSummary, TextButton } from "./LetterPageParts";
import type { ViewOption } from "./LetterPageParts";
import { cellsFromEntries, dayLabel, entriesFromCells, fingerprint, fullDate, pruneCells, sessionCount, weekdayShort } from "./dutyModel";
import type { Cells, Ctx } from "./dutyModel";
import { apiReason, confirmLeave, confirmUndo, countWord, escapeHtml, today } from "./letterHelpers";

type DutyView = "chart" | "date" | "letters";

const VIEWS: ViewOption<DutyView>[] = [
  { value: "chart", label: "Chart", icon: <Table2 className="size-4" aria-hidden="true" /> },
  { value: "date", label: "By date", icon: <CalendarDays className="size-4" aria-hidden="true" /> },
  { value: "letters", label: "Letters", icon: <FileText className="size-4" aria-hidden="true" /> },
];

/** The chart being worked on: the cells, and the earlier cells that Undo goes back to. */
interface Doc {
  cells: Cells;
  past: Cells[];
}

const MAX_UNDO = 100;
const NO_STAFF: Staff[] = [];
const NO_DAYS: DutyDay[] = [];
const NO_ROLES: string[] = [];

const warningStrip = "flex items-center gap-2 border-b border-warning-200 bg-warning-50 px-4 py-1.5 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300";

/** Duty chart: plan supervision for an exam period on one sheet (staff down the side, exam days across), save to make one numbered letter per person. */
export default function DutyChart() {
  const { ayid } = useAcademicYear();

  const [view, setView] = useState<DutyView>("chart");
  const [charts, setCharts] = useState<DutyChartSummary[]>([]);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [chartId, setChartId] = useState("");
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [detail, setDetail] = useState<DutyChartDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<Doc>({ cells: {}, past: [] });
  const [baseline, setBaseline] = useState("");
  const [letterDate, setLetterDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState("");
  const [hint, setHint] = useState("");
  const [modal, setModal] = useState<"new" | "edit" | "import" | null>(null);

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [onlyDuty, setOnlyDuty] = useState(false);
  const [slot, setSlot] = useState("");

  const requestId = useRef(0);
  const pendingNotice = useRef("");
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { cells } = doc;
  const dirty = useMemo(() => !!detail && fingerprint(cells) !== baseline, [detail, cells, baseline]);

  // ---- loading ----
  // Staff who can be given duty: our own, still at the college.
  useEffect(() => {
    StaffService.list({ type: "internal" })
      .then((list) => setStaff([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch((err) => {
        setStaff([]);
        Swal.fire("Duty chart", apiReason(err, "The staff list could not be loaded."), "error");
      });
  }, []);

  const refreshCharts = useCallback(async () => {
    if (!ayid) return [];
    const list = await DutyChartService.list(ayid);
    setCharts(list);
    return list;
  }, [ayid]);

  // A new academic year means a new list of charts; the newest is opened for you.
  useEffect(() => {
    requestId.current++;
    setDetail(null);
    setDoc({ cells: {}, past: [] });
    setBaseline("");
    setNotice("");
    setChartId("");
    setCharts([]);
    setChartsLoaded(false);
    if (!ayid) return;
    refreshCharts()
      .then((list) => setChartId(list[0]?.id ?? ""))
      .catch((err) => Swal.fire("Duty chart", apiReason(err, "The duty charts could not be loaded."), "error"))
      .finally(() => setChartsLoaded(true));
  }, [ayid, refreshCharts]);

  const loadDetail = useCallback(async (id: string) => {
    const mine = ++requestId.current;
    setLoading(true);
    try {
      const d = await DutyChartService.get(id);
      if (mine !== requestId.current) return;
      const c = cellsFromEntries(d.entries);
      setDetail(d);
      setDoc({ cells: c, past: [] });
      setBaseline(fingerprint(c));
      // The first day is chosen for you; after a save the day you were on stays.
      setSlot((current) => (current && d.days.some((x) => current.startsWith(x.date)) ? current : firstSlot(d)));
      if (pendingNotice.current) {
        setNotice(pendingNotice.current);
        pendingNotice.current = "";
      }
    } catch (err) {
      if (mine !== requestId.current) return;
      setDetail(null);
      Swal.fire("Duty chart", apiReason(err, "The chart could not be loaded."), "error");
    } finally {
      if (mine === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearch("");
    setDepartmentId("");
    setOnlyDuty(false);
    setHint("");
    if (!chartId) {
      requestId.current++;
      setDetail(null);
      setDoc({ cells: {}, past: [] });
      setBaseline("");
      return;
    }
    setDetail(null);
    setNotice("");
    loadDetail(chartId);
  }, [chartId, loadDetail]);

  // Closing the tab with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // ---- editing ----
  const edit = useCallback(
    (fn: (cells: Cells) => Cells) =>
      setDoc((d) => {
        const next = fn(d.cells);
        return next === d.cells ? d : { cells: next, past: [...d.past.slice(-(MAX_UNDO - 1)), d.cells] };
      }),
    [],
  );

  const undo = useCallback(() => setDoc((d) => (d.past.length > 0 ? { cells: d.past[d.past.length - 1], past: d.past.slice(0, -1) } : d)), []);

  const discard = async () => {
    if (detail && (await confirmUndo("The chart goes back to what is saved."))) setDoc({ cells: cellsFromEntries(detail.entries), past: [] });
  };

  const showHint = useCallback((text: string) => {
    setHint(text);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(""), 4000);
  }, []);

  const chooseChart = async (id: string) => {
    if (id === chartId || (dirty && !(await confirmLeave("The duties you entered in this chart have not been saved.")))) return;
    setChartId(id);
  };

  const openNew = async () => {
    if (dirty && !(await confirmLeave("The duties you entered in this chart have not been saved."))) return;
    setModal("new");
  };

  const openImport = async () => {
    if (dirty && !(await confirmLeave("Importing replaces the chart with the file, so the duties you entered here are lost."))) return;
    setModal("import");
  };

  // ---- who is who ----
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.staffId, s])), [staff]);
  const days = detail?.days ?? NO_DAYS;
  const roles = detail?.roles ?? NO_ROLES;
  const ctx: Ctx = useMemo(() => ({ roles, staffById, dayByDate: new Map(days.map((d) => [d.date, d])) }), [roles, staffById, days]);

  const departments = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of staff ?? []) if (s.departmentId && s.department) seen.set(s.departmentId, s.department);
    return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [staff]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (staff ?? NO_STAFF).filter((s) => {
      if (departmentId && s.departmentId !== departmentId) return false;
      return !q || `${s.name} ${s.employeeCode ?? ""} ${s.department ?? ""} ${s.designation ?? ""}`.toLowerCase().includes(q);
    });
  }, [staff, search, departmentId]);

  // Everyone with something on the chart who is still at the college: how many people, how many duties.
  const { people, duties, perSlot } = useMemo(() => {
    let people = 0;
    let duties = 0;
    const perSlot = new Map<string, number>();
    for (const [id, row] of Object.entries(cells)) {
      if (!staffById.has(id)) continue;
      people++;
      for (const [date, c] of Object.entries(row)) {
        duties += sessionCount(c);
        if (c.kind !== "duty") continue;
        if (c.session !== "A") perSlot.set(`${date}|M`, (perSlot.get(`${date}|M`) ?? 0) + 1);
        if (c.session !== "M") perSlot.set(`${date}|A`, (perSlot.get(`${date}|A`) ?? 0) + 1);
      }
    }
    return { people, duties, perSlot };
  }, [cells, staffById]);

  // People with duties who are no longer in the staff list: saving removes them (and cancels their letters).
  const leftNames = useMemo(() => {
    const names = new Map((detail?.letters ?? []).map((l) => [l.staffId, l.staffName]));
    return Object.keys(cells)
      .filter((id) => !staffById.has(id))
      .map((id) => names.get(id) ?? "someone no longer in the staff list");
  }, [cells, staffById, detail]);

  // ---- save ----
  const save = async () => {
    if (!detail) return;
    if (!letterDate) {
      Swal.fire("Duty chart", "Choose the date to print on the new letters.", "info");
      return;
    }
    const entries = entriesFromCells(cells, (id) => staffById.has(id)).filter((e) => ctx.dayByDate.has(e.date));
    const keeping = new Set(entries.filter((e) => e.kind === "duty").map((e) => e.staffId));
    const cancelled = detail.letters.filter((l) => !keeping.has(l.staffId));
    if (cancelled.length > 0) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "Cancel letters?",
        html: `<p>${countWord(cancelled.length, "letter")} will be cancelled: ${cancelled.map((l) => `<b>${escapeHtml(l.staffName)}</b> (${escapeHtml(l.letterNo)})`).join(", ")}.</p><p style="font-size:13px;color:#6b7280">A cancelled letter number is not used again.</p>`,
        showCancelButton: true,
        confirmButtonText: "Save and cancel them",
        confirmButtonColor: "#d92d20",
      });
      if (!ok.isConfirmed) return;
    }
    setSaving(true);
    try {
      const result = await DutyChartService.saveEntries(detail.chart.id, letterDate, entries);
      setNotice(result.message);
      await Promise.all([loadDetail(detail.chart.id), refreshCharts().catch(() => [])]);
    } catch (err) {
      Swal.fire("Letters not saved", apiReason(err, "The letters could not be saved. Nothing was changed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const downloadExcel = async () => {
    if (!detail) return;
    setDownloading(true);
    try {
      const { blob, fileName } = await DutyChartService.excel(detail.chart.id);
      saveAs(blob, fileName);
    } catch (err) {
      Swal.fire("Duty chart", apiReason(err, "The Excel sheet could not be made."), "error");
    } finally {
      setDownloading(false);
    }
  };

  // ---- the chart dialogs ----
  const onChartSaved = (d: DutyChartDetail, created: boolean) => {
    if (created) {
      if (d.days.length === 0) pendingNotice.current = "No exam timetable falls between these dates yet. Use Edit to add the days.";
      setCharts((list) => [d.chart, ...list]);
      setChartId(d.chart.id);
      return;
    }
    // The people's duties stay as they are; only the days and details changed.
    setDetail(d);
    setCharts((list) => list.map((c) => (c.id === d.chart.id ? d.chart : c)));
    const dates = new Set(d.days.map((x) => x.date));
    setDoc((cur) => {
      const kept = pruneCells(cur.cells, dates);
      return kept === cur.cells ? cur : { cells: kept, past: [] };
    });
    setSlot((current) => (current && d.days.some((x) => current.startsWith(x.date)) ? current : firstSlot(d)));
  };

  const onChartDeleted = async () => {
    setModal(null);
    const list = await refreshCharts().catch(() => []);
    pendingNotice.current = "";
    setChartId(list[0]?.id ?? "");
    setNotice("");
  };

  const onImported = () => {
    if (!detail) return;
    loadDetail(detail.chart.id);
    refreshCharts().catch(() => []);
  };

  // ---- what is shown ----
  const letterRows: LetterRow[] = useMemo(
    () =>
      (detail?.letters ?? []).map((l) => ({
        letterId: l.letterId,
        staffId: l.staffId,
        letterNo: l.letterNo,
        name: l.staffName,
        role: l.role ?? "",
        duties: l.lines.map((x) => ({ date: x.date, time: x.time, role: x.role })),
      })),
    [detail],
  );

  const chart = detail?.chart ?? charts.find((c) => c.id === chartId);
  const info = chart
    ? [chart.half, `${dayLabel(chart.fromDate)} to ${fullDate(chart.toDate)}`, countWord(chart.dayCount, "day"), countWord(chart.letterCount, "letter")].filter(Boolean).join(" · ")
    : !ayid || !chartsLoaded
      ? "Loading…"
      : charts.length === 0
        ? "No duty chart in this academic year yet. Press New chart to make the first one."
        : "Choose a chart, then click a cell to give a duty. Saving gives each person a numbered letter.";

  const chartOptions = charts.map((c) => ({ value: c.id, label: `${c.name} (${dayLabel(c.fromDate)} - ${dayLabel(c.toDate)})` }));

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

  const hasDays = !!detail && days.length > 0;
  const workView = view === "chart" || view === "date";

  return (
    <>
      <PageMeta title="GradeSphere | Duty Chart" description="Plan exam supervision duties for an exam period and make the duty letters" />
      <div className="min-w-0 space-y-4">
        <LetterPageHeader title="Duty Chart" info={info} view={view} onView={setView} views={VIEWS} />

        <ComponentCard title="Duty Chart - Filters">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-[28rem]">
              <Select label="Chart" placeholder="Select Chart" options={chartOptions} value={chartId} onChange={chooseChart} />
            </div>
            <Button size="sm" variant="outline" onClick={openNew} startIcon={<Plus className="size-4" />} title="Make a chart for another exam period">
              New chart
            </Button>
            <Button size="sm" variant="outline" onClick={() => setModal("edit")} disabled={!detail} startIcon={<Pencil className="size-4" />} title="Change the name, dates and exam days of this chart">
              Edit
            </Button>
            {detail && (
              <>
                <div className="w-44">
                  <LetterDateField value={letterDate} onChange={setLetterDate} />
                </div>
                <div className="ml-auto flex flex-wrap gap-3">
                  <Button size="sm" variant="outline" onClick={downloadExcel} disabled={downloading} startIcon={<Download className="size-4" />} title="The saved chart as an Excel sheet. It lists every staff member, so it is also the blank sheet to fill in.">
                    {downloading ? "Preparing…" : "Download Excel"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={openImport} startIcon={<FileSpreadsheet className="size-4" />} title="Fill in the Excel sheet and upload it to replace the chart">
                    Import Excel
                  </Button>
                </div>
              </>
            )}
          </div>
          {workView && hasDays && (
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LetterSearch value={search} onChange={setSearch} placeholder="Name, ID, department or designation" label="Search staff" />
              <Select options={[{ value: "", label: "All departments" }, ...departments]} placeholder="All departments" value={departmentId} onChange={setDepartmentId} />
              {view === "chart" ? (
                <Checkbox label="Only people with duties" checked={onlyDuty} onChange={setOnlyDuty} />
              ) : (
                <div className="sm:col-span-2">
                  <Select label="Day and session" placeholder="Select Day and session" options={slotOptions} value={slot} onChange={setSlot} />
                </div>
              )}
            </div>
          )}
        </ComponentCard>

        {chartId && loading && !detail && <p className="text-sm text-gray-500 dark:text-gray-400">Loading the chart…</p>}

        {detail && days.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This chart has no exam days yet. Use <b className="font-medium text-gray-700 dark:text-gray-300">Edit</b> to add them, or to read them from the timetables.
          </p>
        )}

        {view === "letters" && detail && (
          <LettersView
            target={{ dutyChartId: detail.chart.id }}
            title={detail.chart.name}
            kind="supervision"
            rows={letterRows}
            dirty={dirty}
            loadedKey={detail}
            emptyText="No letters yet. Fill in the chart and press Save letters."
          />
        )}

        {workView && hasDays && staff && (
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <LetterSummary text={`${people} staff · ${duties} ${duties === 1 ? "duty" : "duties"}`} />
              <div className="ml-auto flex items-center gap-2">
                {dirty && (
                  <TextButton onClick={discard} title="Go back to the saved chart">
                    Discard changes
                  </TextButton>
                )}
                <Button size="sm" variant="outline" onClick={undo} disabled={saving || doc.past.length === 0} title="Undo the last change (Ctrl+Z)">
                  Undo
                </Button>
                <Button size="sm" onClick={save} disabled={!dirty || saving} startIcon={<Save className="size-4" />}>
                  {saving ? "Saving…" : "Save letters"}
                </Button>
              </div>
            </div>

            <LetterNotice message={notice} onDismiss={() => setNotice("")} />

            {leftNames.length > 0 && (
              <p className={warningStrip}>
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {leftNames.length} {leftNames.length === 1 ? "person" : "people"} with duties {leftNames.length === 1 ? "is" : "are"} no longer in the staff list ({leftNames.join(", ")}). Saving removes their duties and cancels their letters.
                </span>
              </p>
            )}

            {view === "chart" ? (
              <>
                <p className="border-b border-gray-100 px-4 py-1.5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400" aria-live="polite">
                  {hint ? (
                    <span className="font-medium text-warning-700 dark:text-orange-300">{hint}</span>
                  ) : (
                    <>
                      <b className="font-medium text-gray-700 dark:text-gray-300">M</b> morning · <b className="font-medium text-gray-700 dark:text-gray-300">A</b> afternoon · <b className="font-medium text-gray-700 dark:text-gray-300">M/A</b> both ·{" "}
                      <b className="font-medium text-gray-700 dark:text-gray-300">CC</b> chief conductor · <b className="font-medium text-gray-700 dark:text-gray-300">SS</b> senior supervisor · <b className="font-medium text-gray-700 dark:text-gray-300">V</b> valuation ·{" "}
                      <b className="font-medium text-gray-700 dark:text-gray-300">O</b> other work. Click a cell, or use the arrow keys and press M, A, B (both), V, C or S (role), Delete; Enter opens more.
                    </>
                  )}
                </p>
                {detail.chart.note && <p className="border-b border-gray-100 px-4 py-1.5 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">Note for staff: {detail.chart.note}</p>}
                {shown.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{staff.length === 0 ? "No staff yet. Add them in Staff Master first." : "No staff match your search."}</p>
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
        )}
      </div>

      {modal === "new" && ayid && <DutyChartModal ayid={ayid} onClose={() => setModal(null)} onSaved={onChartSaved} onDeleted={onChartDeleted} />}
      {modal === "edit" && ayid && detail && <DutyChartModal ayid={ayid} chart={detail.chart} days={detail.days} onClose={() => setModal(null)} onSaved={onChartSaved} onDeleted={onChartDeleted} />}
      {modal === "import" && detail && <DutyImportModal chartId={detail.chart.id} chartName={detail.chart.name} letterDate={letterDate} onClose={() => setModal(null)} onImported={onImported} />}
    </>
  );
}

/** The first session of the first day, as the By date view's choice ("2026-05-11|M"). */
function firstSlot(d: DutyChartDetail): string {
  const day = d.days.find((x) => x.morning || x.afternoon);
  return day ? `${day.date}|${day.morning ? "M" : "A"}` : "";
}
