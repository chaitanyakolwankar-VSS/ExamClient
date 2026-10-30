import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { saveAs } from "file-saver";
import { AlertTriangle, Pencil, Plus, Save } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import { StaffService } from "../../../services/StaffService";
import type { Staff } from "../../../services/StaffService";
import { DutyChartService } from "../../../services/StaffLetterService";
import type { DutyChartDetail, DutyChartSummary, DutyDay } from "../../../services/StaffLetterService";
import DutyChartModal from "./DutyChartModal";
import DutyImportModal from "./DutyImportModal";
import DutyMarkStep from "./DutyMarkStep";
import DutyPeopleStep from "./DutyPeopleStep";
import type { Member } from "./DutyPeopleStep";
import DutyStaffModal from "./DutyStaffModal";
import LettersView from "./LettersView";
import type { LetterRow } from "./LettersView";
import { LetterDateField, LetterNotice, LetterPageHeader, LetterSummary, TextButton } from "./LetterPageParts";
import { StepBar, StepCard, StepFooter, UnsavedStrip } from "./LetterSteps";
import type { StepState } from "./LetterSteps";
import { cellsFromEntries, dayLabel, entriesFromCells, fingerprint, fullDate, isTeaching, pruneCells, rangeLabel, sessionCount } from "./dutyModel";
import type { Cells, Ctx } from "./dutyModel";
import { apiReason, confirmLeave, confirmUndo, countWord, escapeHtml, today } from "./letterHelpers";

/** The people on the chart and their duties: what the steps change and what "Save letters" saves. */
interface Snap {
  members: string[];
  cells: Cells;
}

/** The chart being worked on, and the earlier states that Undo goes back to. */
interface Doc extends Snap {
  past: Snap[];
}

const MAX_UNDO = 100;
const EMPTY: Doc = { members: [], cells: {}, past: [] };
const NO_DAYS: DutyDay[] = [];
const NO_ROLES: string[] = [];
const NO_STAFF: Staff[] = [];

const warningStrip = "flex items-center gap-2 border-b border-warning-200 bg-warning-50 px-4 py-2 text-sm text-warning-700 sm:px-5 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300";

/** A fingerprint of the people and duties; two screens with the same fingerprint would save the same thing. */
const docKey = (members: string[], cells: Cells) => `${[...members].sort().join(",")}#${fingerprint(cells)}`;

/** The people on a saved chart, in the API's order; anyone who has duties but is missing from the list is added. */
function membersOf(d: DutyChartDetail): string[] {
  const ids = [...(d.members ?? [])].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => m.staffId);
  const seen = new Set(ids);
  for (const e of d.entries) {
    if (!seen.has(e.staffId)) {
      seen.add(e.staffId);
      ids.push(e.staffId);
    }
  }
  return ids;
}

const peopleWord = (n: number) => (n === 1 ? "1 person" : `${n} people`);
const dutyWord = (n: number) => `${n} ${n === 1 ? "duty" : "duties"}`;

const docOf = (d: DutyChartDetail): Doc => ({ members: membersOf(d), cells: cellsFromEntries(d.entries), past: [] });

/** Supervision letters in four steps: the exam period, who is on duty, their duties, then the numbered letters. Nothing is saved until "Save letters". */
export default function DutyChart() {
  const { ayid } = useAcademicYear();

  const [step, setStep] = useState(1);
  const [charts, setCharts] = useState<DutyChartSummary[]>([]);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [chartId, setChartId] = useState("");
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [detail, setDetail] = useState<DutyChartDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<Doc>(EMPTY);
  const [baseline, setBaseline] = useState("");
  const [letterDate, setLetterDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<"new" | "edit" | "import" | "staff" | null>(null);

  const requestId = useRef(0);
  /** The step to open once the chart that was just made has loaded. */
  const stepAfterLoad = useRef<number | null>(null);

  const { cells, members } = doc;
  const dirty = useMemo(() => !!detail && docKey(members, cells) !== baseline, [detail, members, cells, baseline]);

  // ---- loading ----
  // Staff who can be given duty: our own, still at the college.
  useEffect(() => {
    StaffService.list({ type: "internal" })
      .then((list) => setStaff([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch((err) => {
        setStaff([]);
        Swal.fire("Supervision letters", apiReason(err, "The staff list could not be loaded."), "error");
      });
  }, []);

  const refreshCharts = useCallback(async () => {
    if (!ayid) return [];
    const list = await DutyChartService.list(ayid);
    setCharts(list);
    return list;
  }, [ayid]);

  // A new academic year means a new list of exam periods; the newest is opened for you.
  useEffect(() => {
    requestId.current++;
    setDetail(null);
    setDoc(EMPTY);
    setBaseline("");
    setNotice("");
    setChartId("");
    setCharts([]);
    setChartsLoaded(false);
    if (!ayid) return;
    refreshCharts()
      .then((list) => setChartId(list[0]?.id ?? ""))
      .catch((err) => Swal.fire("Supervision letters", apiReason(err, "The exam periods could not be loaded."), "error"))
      .finally(() => setChartsLoaded(true));
  }, [ayid, refreshCharts]);

  const loadDetail = useCallback(async (id: string) => {
    const mine = ++requestId.current;
    setLoading(true);
    try {
      const d = await DutyChartService.get(id);
      if (mine !== requestId.current) return;
      const fresh = docOf(d);
      setDetail(d);
      setDoc(fresh);
      setBaseline(docKey(fresh.members, fresh.cells));
    } catch (err) {
      if (mine !== requestId.current) return;
      setDetail(null);
      Swal.fire("Supervision letters", apiReason(err, "The exam period could not be loaded."), "error");
    } finally {
      if (mine === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setStep(stepAfterLoad.current ?? 1);
    stepAfterLoad.current = null;
    if (!chartId) {
      requestId.current++;
      setDetail(null);
      setDoc(EMPTY);
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
  const change = useCallback(
    (fn: (s: Snap) => Snap) =>
      setDoc((d) => {
        const next = fn(d);
        return next.members === d.members && next.cells === d.cells ? d : { ...next, past: [...d.past.slice(-(MAX_UNDO - 1)), { members: d.members, cells: d.cells }] };
      }),
    [],
  );

  /** A change to the duties only (the grid and By date view). */
  const edit = useCallback(
    (fn: (cells: Cells) => Cells) =>
      change((s) => {
        const next = fn(s.cells);
        return next === s.cells ? s : { members: s.members, cells: next };
      }),
    [change],
  );

  const undo = useCallback(() => setDoc((d) => (d.past.length > 0 ? { ...d.past[d.past.length - 1], past: d.past.slice(0, -1) } : d)), []);

  const discard = async () => {
    if (detail && (await confirmUndo("The people and duties go back to what is saved."))) setDoc(docOf(detail));
  };

  const addMembers = (ids: string[]) =>
    change((s) => {
      const have = new Set(s.members);
      const add = ids.filter((id) => !have.has(id)).sort((a, b) => (staffById.get(a)?.name ?? "").localeCompare(staffById.get(b)?.name ?? ""));
      return add.length === 0 ? s : { members: [...s.members, ...add], cells: s.cells };
    });

  const removeMember = async (m: Member) => {
    if (m.days > 0) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "Remove this person?",
        text: `${m.name} has something on ${countWord(m.days, "day")}. Removing them also removes those duties.`,
        showCancelButton: true,
        confirmButtonText: "Remove",
        confirmButtonColor: "#d92d20",
      });
      if (!ok.isConfirmed) return;
    }
    change((s) => {
      let rest = s.cells;
      if (m.id in s.cells) {
        rest = { ...s.cells };
        delete rest[m.id];
      }
      return { members: s.members.filter((id) => id !== m.id), cells: rest };
    });
  };

  const chooseChart = async (id: string) => {
    if (id === chartId || (dirty && !(await confirmLeave("The people and duties you entered in this exam period have not been saved.")))) return;
    setChartId(id);
  };

  const openNew = async () => {
    if (dirty && !(await confirmLeave("The people and duties you entered in this exam period have not been saved."))) return;
    setModal("new");
  };

  const openImport = async () => {
    if (dirty && !(await confirmLeave("Importing replaces the people and duties with the file, so what you entered here is lost."))) return;
    setModal("import");
  };

  // ---- who is who ----
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.staffId, s])), [staff]);
  const days = detail?.days ?? NO_DAYS;
  const roles = detail?.roles ?? NO_ROLES;
  const ctx: Ctx = useMemo(() => ({ roles, staffById, dayByDate: new Map(days.map((d) => [d.date, d])) }), [roles, staffById, days]);

  /** Everyone on the chart in the chart's order (as imported or added), with the staff record when they are still at the college. */
  const memberRows: Member[] = useMemo(() => {
    const letterNames = new Map((detail?.letters ?? []).map((l) => [l.staffId, l.staffName]));
    return members.map((id) => {
      const person = staffById.get(id) ?? null;
      return { id, person, name: person?.name ?? letterNames.get(id) ?? "Someone no longer in the staff list", days: Object.keys(cells[id] ?? {}).length };
    });
  }, [members, staffById, cells, detail]);

  const onChart = useMemo(() => memberRows.flatMap((m) => (m.person ? [m.person] : NO_STAFF)), [memberRows]);
  const leftNames = memberRows.filter((m) => !m.person).map((m) => m.name);

  const memberSet = useMemo(() => new Set(members), [members]);
  const candidates = useMemo(() => (staff ?? NO_STAFF).filter((s) => !memberSet.has(s.staffId)), [staff, memberSet]);
  const availableTeaching = candidates.filter(isTeaching).length;
  const availableNonTeaching = candidates.length - availableTeaching;

  const addGroup = (teaching: boolean) => addMembers(candidates.filter((s) => isTeaching(s) === teaching).map((s) => s.staffId));

  // How many duties are given, and how many people have a duty (they get a letter); sessions per day and session.
  const { duties, dutyPeople, perSlot } = useMemo(() => {
    let duties = 0;
    let dutyPeople = 0;
    const perSlot = new Map<string, number>();
    for (const [id, row] of Object.entries(cells)) {
      if (!memberSet.has(id) || !staffById.has(id)) continue;
      let any = false;
      for (const [date, c] of Object.entries(row)) {
        duties += sessionCount(c);
        if (c.kind !== "duty") continue;
        any = true;
        if (c.session !== "A") perSlot.set(`${date}|M`, (perSlot.get(`${date}|M`) ?? 0) + 1);
        if (c.session !== "M") perSlot.set(`${date}|A`, (perSlot.get(`${date}|A`) ?? 0) + 1);
      }
      if (any) dutyPeople++;
    }
    return { duties, dutyPeople, perSlot };
  }, [cells, memberSet, staffById]);

  // ---- save ----
  /** Saves the people and duties and makes the letters. True when it was saved. */
  const save = async (): Promise<boolean> => {
    if (!detail) return false;
    if (!letterDate) {
      Swal.fire("Supervision letters", "Choose the date to print on the new letters.", "info");
      return false;
    }
    // The people still at the college, in the chart's order.
    const memberIds = memberRows.filter((m) => m.person).map((m) => m.id);
    const keep = new Set(memberIds);
    const entries = entriesFromCells(cells, (id) => keep.has(id)).filter((e) => ctx.dayByDate.has(e.date));
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
      if (!ok.isConfirmed) return false;
    }
    setSaving(true);
    try {
      const result = await DutyChartService.saveEntries(detail.chart.id, letterDate, entries, memberIds);
      setNotice(result.message);
      await Promise.all([loadDetail(detail.chart.id), refreshCharts().catch(() => [])]);
      return true;
    } catch (err) {
      Swal.fire("Letters not saved", apiReason(err, "The letters could not be saved. Nothing was changed."), "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** Step 3: Save and next. Goes on to the letters only when the save worked. */
  const saveAndNext = async () => {
    if (await save()) setStep(4);
  };

  const downloadExcel = async () => {
    if (!detail) return;
    if (dirty) {
      const ok = await Swal.fire({ icon: "question", title: "Download the saved sheet?", text: "The sheet has the last saved people and duties. What you changed since is not in it.", showCancelButton: true, confirmButtonText: "Download" });
      if (!ok.isConfirmed) return;
    }
    setDownloading(true);
    try {
      const { blob, fileName } = await DutyChartService.excel(detail.chart.id);
      saveAs(blob, fileName);
    } catch (err) {
      Swal.fire("Supervision letters", apiReason(err, "The Excel sheet could not be made."), "error");
    } finally {
      setDownloading(false);
    }
  };

  // ---- the exam period dialogs ----
  const onChartSaved = (d: DutyChartDetail, created: boolean) => {
    if (created) {
      stepAfterLoad.current = 2;
      setCharts((list) => [d.chart, ...list]);
      setChartId(d.chart.id);
      return;
    }
    // The people and their duties stay as they are; only the days and details changed.
    setDetail(d);
    setCharts((list) => list.map((c) => (c.id === d.chart.id ? d.chart : c)));
    const dates = new Set(d.days.map((x) => x.date));
    setDoc((cur) => {
      const kept = pruneCells(cur.cells, dates);
      return kept === cur.cells ? cur : { ...cur, cells: kept, past: [] };
    });
  };

  const onChartDeleted = async () => {
    setModal(null);
    const list = await refreshCharts().catch(() => []);
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
  const chartOptions = charts.map((c) => ({ value: c.id, label: `${c.name} (${dayLabel(c.fromDate)} - ${dayLabel(c.toDate)})` }));

  // A step opens once the one before it is done. Step 4 also opens when there are changes to save, or letters to cancel.
  const hasDays = !!detail && days.length > 0;
  const savedLetters = detail?.letters.length ?? 0;
  const reach = [true, hasDays, hasDays && onChart.length > 0, hasDays && (dirty || savedLetters > 0 || (onChart.length > 0 && duties > 0))];
  let current = step;
  while (current > 1 && !reach[current - 1]) current--;

  const steps: StepState[] = [
    { label: "Exam period", done: hasDays, reachable: reach[0], summary: chart ? `${chart.name} · ${rangeLabel(chart.fromDate, chart.toDate)} · ${countWord(days.length, "day")}` : "" },
    { label: "Who is on duty", done: onChart.length > 0, reachable: reach[1], summary: peopleWord(onChart.length) },
    { label: "Mark duties", done: duties > 0, reachable: reach[2], summary: dutyWord(duties) },
    { label: "Letters", done: savedLetters > 0 && !dirty, reachable: reach[3], summary: countWord(savedLetters, "letter") },
  ];
  const go = (n: number) => reach[n - 1] && setStep(n);
  const back = (n: number) => () => setStep(n);

  const noChart = !ayid || !chartsLoaded ? "Loading…" : charts.length === 0 ? "No exam period in this academic year yet. Press New exam period to make the first one." : "Choose an exam period to continue.";

  return (
    <>
      <PageMeta title="GradeSphere | Supervision Letters" description="Plan exam supervision duties for an exam period and send each person their letter" />
      <div className="min-w-0 space-y-4">
        <LetterPageHeader title="Supervision Letters" info="Plan supervision duties for an exam period and send each person their letter." />

        <StepBar steps={steps} current={current} onStep={go} />

        {dirty && current !== 4 && (
          <UnsavedStrip>
            <span>The people and duties you entered are not saved yet.</span>
            <span className="flex items-center gap-1">
              <TextButton onClick={save} disabled={saving} title="Save the people and duties and make the letters">
                {saving ? "Saving…" : "Save"}
              </TextButton>
              <TextButton onClick={discard} disabled={saving}>
                Discard changes
              </TextButton>
            </span>
          </UnsavedStrip>
        )}

        {current === 1 && (
          <StepCard
            number={1}
            title="Exam period"
            hint="Choose the exam period, for example the May–June end-semester exams, or make a new one. The exam days and their times are read from the exam timetables."
            footer={<StepFooter onNext={() => go(2)} nextLabel="Next: Who is on duty" nextDisabled={!reach[1]} nextTitle={reach[1] ? undefined : "Choose an exam period that has exam days"} />}
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-[28rem]">
                <Select label="Exam period" placeholder="Select Exam Period" options={chartOptions} value={chartId} onChange={chooseChart} />
              </div>
              <Button size="sm" variant="outline" onClick={openNew} startIcon={<Plus className="size-4" />} title="Make an exam period, for example another half or exam">
                New exam period
              </Button>
              <Button size="sm" variant="outline" onClick={() => setModal("edit")} disabled={!detail} startIcon={<Pencil className="size-4" />} title="Change the name and dates, the exam days and their session times">
                Edit days and times
              </Button>
            </div>
            {chartId && loading && !detail ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading the exam period…</p>
            ) : detail ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {[detail.chart.half, `${dayLabel(detail.chart.fromDate)} to ${fullDate(detail.chart.toDate)}`, countWord(days.length, "exam day")].filter(Boolean).join(" · ")}
                </p>
                {detail.chart.note && <p className="text-sm text-gray-600 dark:text-gray-400">Note for staff: {detail.chart.note}</p>}
                {days.length === 0 && (
                  <p className="flex items-center gap-2 text-sm text-warning-700 dark:text-orange-300">
                    <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                    <span>
                      This exam period has no exam days yet. Press <b className="font-medium">Edit days and times</b> to add them, or to read them from the timetables.
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">{noChart}</p>
            )}
          </StepCard>
        )}

        {current === 2 && detail && staff && (
          <DutyPeopleStep
            members={memberRows}
            availableTeaching={availableTeaching}
            availableNonTeaching={availableNonTeaching}
            onAddStaff={() => setModal("staff")}
            onAddGroup={addGroup}
            onImport={openImport}
            onRemove={removeMember}
            footer={<StepFooter onBack={back(1)} onNext={() => go(3)} nextLabel="Next: Mark duties" nextDisabled={!reach[2]} nextTitle={reach[2] ? undefined : "Add at least one person first"} />}
          />
        )}

        {current === 3 && detail && hasDays && (
          <DutyMarkStep
            chartId={detail.chart.id}
            days={days}
            members={onChart}
            cells={cells}
            ctx={ctx}
            edit={edit}
            undo={undo}
            canUndo={!saving && doc.past.length > 0}
            perSlot={perSlot}
            duties={duties}
            note={detail.chart.note}
            downloading={downloading}
            onDownload={downloadExcel}
            onDaysSaved={(d) => onChartSaved(d, false)}
            footer={
              <StepFooter
                onBack={back(2)}
                onNext={() => go(4)}
                nextLabel="Next: Letters"
                nextDisabled={!reach[3]}
                nextTitle={reach[3] ? undefined : "Give at least one duty first"}
                right={
                  dirty ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-40">
                        <LetterDateField value={letterDate} onChange={setLetterDate} title="The date printed on the new letters. Letters already made keep their own date." />
                      </div>
                      <Button size="sm" onClick={saveAndNext} disabled={saving} title="Save the people and duties, make the letters and go to the letters">
                        {saving ? "Saving…" : "Save and next →"}
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            }
          />
        )}

        {current === 4 && detail && (
          <StepCard
            number={4}
            title="Letters"
            hint={dirty ? "Save letters makes one numbered letter for each person who has a duty. The people and duties are saved at the same time." : "One numbered letter for each person who has a duty. Open the PDF or email it."}
            footer={<StepFooter onBack={back(3)} />}
            flush={
              <>
                <LetterNotice message={notice} onDismiss={() => setNotice("")} />
                {leftNames.length > 0 && (
                  <p className={warningStrip}>
                    <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {peopleWord(leftNames.length)} on the list {leftNames.length === 1 ? "is" : "are"} no longer in the staff list ({leftNames.join(", ")}). Saving takes them off and cancels their letters.
                    </span>
                  </p>
                )}
                <LettersView
                  embedded
                  target={{ dutyChartId: detail.chart.id }}
                  title={detail.chart.name}
                  kind="supervision"
                  rows={letterRows}
                  dirty={dirty}
                  loadedKey={detail}
                  emptyText={dirty ? "No letters yet. Press Save letters above." : "No letters yet. Give duties in step 3 and press Save and next."}
                />
              </>
            }
          >
            {dirty && (
              <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                <div className="w-44">
                  <LetterDateField value={letterDate} onChange={setLetterDate} title="The date printed on the new letters. Letters already made keep their own date." />
                </div>
                <Button size="sm" onClick={save} disabled={saving} startIcon={<Save className="size-4" />}>
                  {saving ? "Saving…" : "Save letters"}
                </Button>
                <TextButton onClick={discard} title="Go back to what is saved" disabled={saving}>
                  Discard changes
                </TextButton>
              </div>
            )}
            <LetterSummary
              text={
                `${peopleWord(onChart.length)} on duty · ${dutyWord(duties)} · ` +
                (dutyPeople === 0 ? "nobody has a duty yet, so no letters are made" : `${countWord(dutyPeople, "letter")} to make or update`) +
                (dirty ? " · not saved yet" : "")
              }
            />
          </StepCard>
        )}
      </div>

      {modal === "new" && ayid && <DutyChartModal ayid={ayid} onClose={() => setModal(null)} onSaved={onChartSaved} onDeleted={onChartDeleted} />}
      {modal === "edit" && ayid && detail && <DutyChartModal ayid={ayid} chart={detail.chart} days={detail.days} onClose={() => setModal(null)} onSaved={onChartSaved} onDeleted={onChartDeleted} />}
      {modal === "import" && detail && <DutyImportModal chartId={detail.chart.id} chartName={detail.chart.name} letterDate={letterDate} onClose={() => setModal(null)} onImported={onImported} />}
      {modal === "staff" && (
        <DutyStaffModal
          candidates={candidates}
          onClose={() => setModal(null)}
          onAdd={(ids) => {
            addMembers(ids);
            setModal(null);
          }}
        />
      )}
    </>
  );
}
