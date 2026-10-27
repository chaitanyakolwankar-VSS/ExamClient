import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { AlertTriangle } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import Checkbox from "../../../components/form/input/Checkbox";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import { StaffService } from "../../../services/StaffService";
import type { Staff } from "../../../services/StaffService";
import { StaffLetterService } from "../../../services/StaffLetterService";
import type { ExamGroup, SupervisionData } from "../../../services/StaffLetterService";
import SupervisionGrid from "./SupervisionGrid";
import type { DutyRow, GridPerson } from "./SupervisionGrid";
import { LetterActions, LetterNotice, LetterPageHeader, LetterSearch, LetterSummary } from "./LetterPageParts";
import { apiReason, confirmLeave, confirmUndo, countWord, escapeHtml, today } from "./letterHelpers";

/** Ticking a duty for someone with no role gives them this one (the most common). */
const DEFAULT_ROLE = "Junior Supervisor";

/** A fingerprint of who is down for what; two grids with the same fingerprint would save the same letters. */
const fingerprint = (rows: Record<string, DutyRow>) =>
  Object.keys(rows)
    .filter((id) => rows[id].role && rows[id].slots.size > 0)
    .sort()
    .map((id) => `${id}|${rows[id].role}|${[...rows[id].slots].sort((a, b) => a - b).join(",")}`)
    .join(";");

/** The saved letters as grid rows; also how many of their duties are no longer a date and time of the exam. */
function rowsFromLetters(data: SupervisionData) {
  const index = new Map(data.slots.map((s, i) => [`${s.date}\u0001${s.time}`, i]));
  const rows: Record<string, DutyRow> = {};
  let dropped = 0;
  for (const l of data.letters) {
    const slots = new Set<number>();
    for (const d of l.duties) {
      const i = index.get(`${d.date}\u0001${d.time}`);
      if (i === undefined) dropped++;
      else slots.add(i);
    }
    if (l.role) rows[l.staffId] = { role: l.role, slots };
  }
  return { rows, dropped };
}

/** Supervision letters: assign staff to the dates and times of one exam; saving numbers and records one letter each. */
export default function SupervisionLetters() {
  const { ayid } = useAcademicYear();

  const [exams, setExams] = useState<ExamGroup[]>([]);
  const [examId, setExamId] = useState("");
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [data, setData] = useState<SupervisionData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [rows, setRows] = useState<Record<string, DutyRow>>({});
  const [baseline, setBaseline] = useState("");
  const [letterDate, setLetterDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [onlyAssigned, setOnlyAssigned] = useState(false);

  const requestId = useRef(0);
  const [dropped, setDropped] = useState(0);
  // Saved duties that are no longer a date and time of the exam also need a save (it drops them).
  const dirty = !!data && (fingerprint(rows) !== baseline || dropped > 0);

  // Staff who can be given duty: our own, still at the college.
  useEffect(() => {
    StaffService.list({ type: "internal" })
      .then(setStaff)
      .catch((err) => {
        setStaff([]);
        Swal.fire("Supervision letters", apiReason(err, "The staff list could not be loaded."), "error");
      });
  }, []);

  const refreshExams = useCallback(async () => {
    if (!ayid) return [];
    const list = await StaffLetterService.exams(ayid);
    setExams(list);
    return list;
  }, [ayid]);

  // A new academic year means a new list of exams; one exam on its own is chosen for you.
  useEffect(() => {
    requestId.current++;
    setData(null);
    setRows({});
    setBaseline("");
    setNotice("");
    setExamId("");
    setExams([]);
    refreshExams()
      .then((list) => list.length === 1 && setExamId(list[0].examId))
      .catch((err) => Swal.fire("Supervision letters", apiReason(err, "The exams could not be loaded."), "error"));
  }, [refreshExams]);

  const loadData = useCallback(async (id: string) => {
    const mine = ++requestId.current;
    setLoadingData(true);
    try {
      const d = await StaffLetterService.supervision(id);
      if (mine !== requestId.current) return;
      const { rows: r, dropped: lost } = rowsFromLetters(d);
      setData(d);
      setRows(r);
      setBaseline(fingerprint(r));
      setDropped(lost);
    } catch (err) {
      if (mine !== requestId.current) return;
      setData(null);
      Swal.fire("Supervision letters", apiReason(err, "The exam's dates could not be loaded."), "error");
    } finally {
      if (mine === requestId.current) setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!examId) {
      requestId.current++;
      setData(null);
      setRows({});
      setBaseline("");
      return;
    }
    setData(null);
    setNotice("");
    loadData(examId);
  }, [examId, loadData]);

  // Closing the tab with unsaved ticks asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const chooseExam = async (id: string) => {
    if (id === examId || (dirty && !(await confirmLeave("The duties you ticked for this exam have not been saved.")))) return;
    setExamId(id);
  };

  const undo = async () => {
    if (data && (await confirmUndo("The grid goes back to what is saved."))) setRows(rowsFromLetters(data).rows);
  };

  // ---- who is shown ----
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.staffId, s])), [staff]);
  const letterByStaff = useMemo(() => new Map((data?.letters ?? []).map((l) => [l.staffId, l])), [data]);

  const people: GridPerson[] = useMemo(() => {
    if (!data || !staff) return [];
    const list: GridPerson[] = staff.map((s) => ({
      id: s.staffId,
      name: s.name,
      designation: s.designation ?? "",
      letterNo: letterByStaff.get(s.staffId)?.letterNo ?? "",
      orphan: false,
    }));
    for (const l of data.letters) {
      if (!staffById.has(l.staffId)) list.push({ id: l.staffId, name: l.staffName, designation: "", letterNo: l.letterNo, orphan: true });
    }
    return list;
  }, [data, staff, letterByStaff, staffById]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      const s = staffById.get(p.id);
      if (q && !`${p.name} ${s?.employeeCode ?? ""} ${s?.department ?? ""} ${p.designation}`.toLowerCase().includes(q)) return false;
      if (onlyAssigned && !(rows[p.id]?.role && rows[p.id].slots.size > 0)) return false;
      return true;
    });
  }, [people, staffById, search, onlyAssigned, rows]);

  // ---- counts over everyone who would get a letter (people who left are not counted) ----
  const slotCounts = useMemo(() => {
    const counts = new Array<number>(data?.slots.length ?? 0).fill(0);
    for (const [id, r] of Object.entries(rows)) {
      if (!r.role || !staffById.has(id)) continue;
      r.slots.forEach((i) => (counts[i] = (counts[i] ?? 0) + 1));
    }
    return counts;
  }, [rows, data, staffById]);
  const assignedCount = useMemo(() => Object.entries(rows).filter(([id, r]) => r.role && r.slots.size > 0 && staffById.has(id)).length, [rows, staffById]);
  const dutyCount = slotCounts.reduce((a, b) => a + b, 0);

  // ---- edits ----
  const roles = data?.roles ?? [];
  const defaultRole = roles.includes(DEFAULT_ROLE) ? DEFAULT_ROLE : (roles[0] ?? "");

  const edit = (fn: (draft: Record<string, DutyRow>) => void) =>
    setRows((current) => {
      const draft: Record<string, DutyRow> = {};
      for (const [id, r] of Object.entries(current)) draft[id] = { role: r.role, slots: new Set(r.slots) };
      fn(draft);
      return draft;
    });

  const setRole = (id: string, role: string) =>
    edit((d) => {
      // No role (or cancelling a letter) clears the whole line, so nothing is left half-set.
      if (!role) delete d[id];
      else d[id] = { role, slots: d[id]?.slots ?? new Set() };
    });

  const toggle = (id: string, slot: number, on: boolean) =>
    edit((d) => {
      const row = (d[id] ??= { role: defaultRole, slots: new Set() });
      if (!row.role) row.role = defaultRole;
      if (on) row.slots.add(slot);
      else row.slots.delete(slot);
    });

  // ---- save ----
  const save = async () => {
    if (!data) return;
    if (!letterDate) {
      Swal.fire("Supervision letters", "Choose the date to print on the new letters.", "info");
      return;
    }
    const assignments = (staff ?? [])
      .filter((s) => rows[s.staffId]?.role && rows[s.staffId].slots.size > 0)
      .map((s) => {
        const r = rows[s.staffId];
        return { staffId: s.staffId, role: r.role, duties: [...r.slots].sort((a, b) => a - b).map((i) => ({ date: data.slots[i].date, time: data.slots[i].time })) };
      });
    const keeping = new Set(assignments.map((a) => a.staffId));
    const cancelled = data.letters.filter((l) => !keeping.has(l.staffId));
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
      const result = await StaffLetterService.saveSupervision({ examId: data.exam.examId, letterDate, assignments });
      setNotice(result.message);
      await Promise.all([loadData(data.exam.examId), refreshExams().catch(() => [])]);
    } catch (err) {
      Swal.fire("Letters not saved", apiReason(err, "The letters could not be saved. Nothing was changed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const exam = data?.exam ?? exams.find((e) => e.examId === examId);
  const info = exam
    ? [exam.half, countWord(exam.slotCount, "date"), countWord(exam.letterCount, "letter")].filter(Boolean).join(" · ")
    : !ayid
      ? "Loading…"
      : exams.length === 0
        ? "No exam in this academic year has a timetable yet. Save its timetable in Generate Hall Ticket first."
        : "Choose an exam to see its dates. Saving gives each person a numbered letter.";

  return (
    <>
      <PageMeta title="GradeSphere | Supervision Letters" description="Assign staff to exam supervision duties" />
      <div className="min-w-0 space-y-4">
        <LetterPageHeader title="Supervision Letters" info={info} exams={exams} examId={examId} onExam={chooseExam} letterDate={letterDate} onLetterDate={setLetterDate} />

        {examId && loadingData && !data && <p className="text-sm text-gray-500 dark:text-gray-400">Loading the exam's dates and staff…</p>}

        {data && staff && data.slots.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">This exam has no dates yet.</p>}

        {data && staff && data.slots.length > 0 && (
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <LetterSearch value={search} onChange={setSearch} placeholder="Name, ID, department or designation" label="Search staff" />
              <Checkbox label="Show assigned only" checked={onlyAssigned} onChange={setOnlyAssigned} />
              <LetterSummary text={`${assignedCount} staff · ${dutyCount} ${dutyCount === 1 ? "duty" : "duties"}`} />
              <LetterActions dirty={dirty} saving={saving} onUndo={undo} onSave={save} />
            </div>

            <LetterNotice message={notice} onDismiss={() => setNotice("")} />

            {dropped > 0 && (
              <p className="flex items-center gap-2 border-b border-warning-200 bg-warning-50 px-4 py-1.5 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {countWord(dropped, "duty")} on saved letters {dropped === 1 ? "is" : "are"} no longer a date of this exam. Saving drops {dropped === 1 ? "it" : "them"} from the letters.
                </span>
              </p>
            )}

            {shown.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{people.length === 0 ? "No staff yet. Add them in Staff Master first." : "No staff match your search."}</p>
            ) : (
              <SupervisionGrid people={shown} rows={rows} slots={data.slots} roles={roles} slotCounts={slotCounts} onRole={setRole} onToggle={toggle} />
            )}
          </div>
        )}
      </div>
    </>
  );
}
