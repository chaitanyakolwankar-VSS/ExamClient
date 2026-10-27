import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { AlertTriangle, CheckCircle2, ClipboardList, RotateCcw, Save, Search, Settings2, X } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import Button from "../../../components/ui/button/Button";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import { useAuth } from "../../../context/AuthContext";
import { StaffService } from "../../../services/StaffService";
import type { Staff } from "../../../services/StaffService";
import { StaffLetterService } from "../../../services/StaffLetterService";
import type { ExamGroup, SupervisionData } from "../../../services/StaffLetterService";
import SupervisionGrid from "./SupervisionGrid";
import type { DutyRow, GridPerson } from "./SupervisionGrid";
import LetterSettings from "./LetterSettings";

/** The API's reason from an axios error ({ message } or a plain string), else the fallback. */
const apiReason = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (data as { message?: string } | undefined)?.message || fallback;
};

const tabClass = (active: boolean) =>
  `flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:outline-hidden focus-visible:ring-inset ${
    active ? "bg-brand-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
  }`;

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90";

/** Ticking a duty for someone with no role gives them this one (the most common). */
const DEFAULT_ROLE = "Junior Supervisor";

const escape = (s: string) => s.replace(/[<>&]/g, "");

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const countWord = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

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
  const { isAdmin } = useAuth();

  const [tab, setTab] = useState<"assign" | "settings">("assign");
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
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
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

  const confirmLeave = async () => {
    if (!dirty) return true;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Leave without saving?",
      text: "The duties you ticked for this exam have not been saved.",
      showCancelButton: true,
      confirmButtonText: "Leave",
      confirmButtonColor: "#d92d20",
    });
    return ok.isConfirmed;
  };

  const chooseExam = async (id: string) => {
    if (id === examId || !(await confirmLeave())) return;
    setExamId(id);
  };

  const discard = async () => {
    const ok = await Swal.fire({ icon: "question", title: "Undo your changes?", text: "The grid goes back to what is saved.", showCancelButton: true, confirmButtonText: "Undo changes" });
    if (ok.isConfirmed && data) setRows(rowsFromLetters(data).rows);
  };

  // ---- who is shown ----
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.staffId, s])), [staff]);
  const letterByStaff = useMemo(() => new Map((data?.letters ?? []).map((l) => [l.staffId, l])), [data]);

  const departments = useMemo(() => distinct(staff ?? [], (s) => s.departmentId, (s) => s.department), [staff]);
  const designations = useMemo(() => distinct(staff ?? [], (s) => s.designationId, (s) => s.designation), [staff]);

  const people: GridPerson[] = useMemo(() => {
    if (!data || !staff) return [];
    const list: GridPerson[] = staff.map((s) => ({
      id: s.staffId,
      name: s.name,
      detail: [s.employeeCode, s.designation].filter(Boolean).join(" · "),
      letterNo: letterByStaff.get(s.staffId)?.letterNo ?? "",
      orphan: false,
    }));
    for (const l of data.letters) {
      if (!staffById.has(l.staffId)) list.push({ id: l.staffId, name: l.staffName, detail: "", letterNo: l.letterNo, orphan: true });
    }
    return list;
  }, [data, staff, letterByStaff, staffById]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      const s = staffById.get(p.id);
      if (q && !`${p.name} ${p.detail} ${s?.email ?? ""}`.toLowerCase().includes(q)) return false;
      if (departmentId && s?.departmentId !== departmentId) return false;
      if (designationId && s?.designationId !== designationId) return false;
      if (onlyAssigned && !(rows[p.id]?.role && rows[p.id].slots.size > 0)) return false;
      return true;
    });
  }, [people, staffById, search, departmentId, designationId, onlyAssigned, rows]);

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

  const toggleColumn = (slot: number) =>
    edit((d) => {
      const withRole = shown.filter((p) => !p.orphan && d[p.id]?.role);
      const turnOn = !withRole.every((p) => d[p.id].slots.has(slot));
      for (const p of withRole) {
        if (turnOn) d[p.id].slots.add(slot);
        else d[p.id].slots.delete(slot);
      }
    });

  const bulkRole = (role: string) => {
    if (!role) return;
    edit((d) => {
      for (const p of shown) if (!p.orphan && !d[p.id]?.role) d[p.id] = { role, slots: d[p.id]?.slots ?? new Set() };
    });
  };

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
        html: `<p>${countWord(cancelled.length, "letter")} will be cancelled: ${cancelled.map((l) => `<b>${escape(l.staffName)}</b> (${escape(l.letterNo)})`).join(", ")}.</p><p style="font-size:13px;color:#6b7280">A cancelled letter number is not used again.</p>`,
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
  const filtering = !!(search || departmentId || designationId || onlyAssigned);

  return (
    <>
      <PageMeta title="GradeSphere | Supervision Letters" description="Assign staff to exam supervision duties" />
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Supervision Letters</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Choose a role and the dates and times each person supervises. Saving gives each person a numbered letter.</p>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <button type="button" className={tabClass(tab === "assign")} onClick={() => setTab("assign")}>
              <ClipboardList className="size-4" /> Assign duties
            </button>
            <button type="button" className={`${tabClass(tab === "settings")} border-l border-gray-300 dark:border-gray-700`} onClick={() => setTab("settings")}>
              <Settings2 className="size-4" /> Letter settings
            </button>
          </div>
        </div>

        {tab === "settings" && <LetterSettings canEdit={isAdmin} reason={apiReason} />}

        {tab === "assign" && (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
                <Select
                  label="Exam *"
                  placeholder="Choose exam"
                  options={exams.map((e) => ({ value: e.examId, label: e.title }))}
                  value={examId}
                  onChange={chooseExam}
                />
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Date on new letters</span>
                  <input type="date" value={letterDate} onChange={(e) => setLetterDate(e.target.value)} className={inputClass} />
                </label>
              </div>
              {exam ? (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {[exam.half, `${exam.branchCount} ${exam.branchCount === 1 ? "branch" : "branches"}`, `${exam.slotCount} ${exam.slotCount === 1 ? "date and time" : "dates and times"}`, countWord(exam.letterCount, "letter") + " so far"].filter(Boolean).join(" · ")}
                  <span className="text-gray-400 dark:text-gray-500"> · Letters already made keep their own date.</span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {!ayid ? "Loading…" : exams.length === 0 ? "No exam in this academic year has a timetable yet. Save its timetable in Generate Hall Ticket first." : "Choose an exam to see its dates and times."}
                </p>
              )}
            </div>

            {notice && (
              <p role="status" className="flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{notice}</span>
                <button type="button" onClick={() => setNotice("")} aria-label="Dismiss" className="rounded p-0.5 hover:bg-success-100 dark:hover:bg-white/[0.05]">
                  <X className="size-4" />
                </button>
              </p>
            )}

            {examId && loadingData && !data && <p className="text-sm text-gray-500 dark:text-gray-400">Loading the exam's dates and staff…</p>}

            {data && staff && data.slots.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">This exam has no dates and times yet.</p>}

            {data && staff && data.slots.length > 0 && (
              <div className="min-w-0 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="space-y-3 border-b border-gray-100 px-4 py-3 sm:px-5 dark:border-gray-800">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative lg:w-72">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Name, email or employee ID"
                        aria-label="Search staff"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
                      />
                    </div>
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <Select options={[{ value: "", label: "All departments" }, ...departments]} placeholder="All departments" value={departmentId} onChange={setDepartmentId} />
                      <Select options={[{ value: "", label: "All designations" }, ...designations]} placeholder="All designations" value={designationId} onChange={setDesignationId} />
                    </div>
                    <Checkbox label="Only assigned" checked={onlyAssigned} onChange={setOnlyAssigned} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300" aria-live="polite">
                      <b className="font-semibold text-gray-800 dark:text-white/90">{assignedCount}</b> staff assigned, <b className="font-semibold text-gray-800 dark:text-white/90">{dutyCount}</b> {dutyCount === 1 ? "duty" : "duties"}
                      {filtering && <span className="text-gray-500 dark:text-gray-400"> · showing {shown.length} of {people.length}</span>}
                    </p>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      {dirty && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700 dark:bg-warning-500/15 dark:text-orange-300">
                          <span className="size-1.5 rounded-full bg-warning-500" aria-hidden="true" /> Unsaved changes
                        </span>
                      )}
                      <Button size="sm" variant="outline" onClick={discard} disabled={!dirty || saving} startIcon={<RotateCcw className="size-4" />}>
                        Undo changes
                      </Button>
                      <Button size="sm" onClick={save} disabled={!dirty || saving} startIcon={<Save className="size-4" />}>
                        {saving ? "Saving…" : "Save letters"}
                      </Button>
                    </div>
                  </div>

                  {dropped > 0 && (
                    <p className="flex items-start gap-2 text-sm text-warning-700 dark:text-orange-300">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>{countWord(dropped, "duty")} on saved letters {dropped === 1 ? "is" : "are"} no longer a date and time of this exam. Saving drops {dropped === 1 ? "it" : "them"} from the letters.</span>
                    </p>
                  )}
                </div>

                {shown.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500 sm:px-5 dark:text-gray-400">{people.length === 0 ? "No staff yet. Add them in Staff Master first." : "No staff match these filters."}</p>
                ) : (
                  <SupervisionGrid people={shown} rows={rows} slots={data.slots} roles={roles} slotCounts={slotCounts} onRole={setRole} onToggle={toggle} onToggleColumn={toggleColumn} onBulkRole={bulkRole} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** The distinct (id, name) pairs of one staff field as sorted drop-down options. */
function distinct(list: Staff[], id: (s: Staff) => string | null, name: (s: Staff) => string | null) {
  const seen = new Map<string, string>();
  for (const s of list) {
    const key = id(s);
    const label = name(s);
    if (key && label) seen.set(key, label);
  }
  return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}
