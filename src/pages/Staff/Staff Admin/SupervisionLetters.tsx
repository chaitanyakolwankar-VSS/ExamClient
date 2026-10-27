import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { AlertTriangle } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import { StaffService } from "../../../services/StaffService";
import type { Staff } from "../../../services/StaffService";
import { StaffLetterService } from "../../../services/StaffLetterService";
import type { ExamGroup, SupervisionData } from "../../../services/StaffLetterService";
import LettersView from "./LettersView";
import type { LetterRow } from "./LettersView";
import {
  ExamField,
  LetterActions,
  LetterDateField,
  LetterNotice,
  LetterPageHeader,
  LetterSearch,
  LetterSummary,
  TextButton,
  rowSelectClass,
  tableCell,
  tableHead,
} from "./LetterPageParts";
import type { LetterView } from "./LetterPageParts";
import { apiReason, confirmLeave, confirmUndo, countWord, escapeHtml, today } from "./letterHelpers";

/** Ticking a duty for someone with no role gives them this one (the most common). */
const DEFAULT_ROLE = "Junior Supervisor";

/** What one staff member is down for: a role (the same on every date) and the slots, by position in the exam's slot list. */
interface DutyRow {
  role: string;
  slots: Set<number>;
}

/** A fingerprint of who is down for what; two screens with the same fingerprint would save the same letters. */
const fingerprint = (rows: Record<string, DutyRow>) =>
  Object.keys(rows)
    .filter((id) => rows[id].role && rows[id].slots.size > 0)
    .sort()
    .map((id) => `${id}|${rows[id].role}|${[...rows[id].slots].sort((a, b) => a - b).join(",")}`)
    .join(";");

/** The saved letters as duty rows; also how many of their duties are no longer a date and time of the exam. */
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

/** Supervision letters: choose a date and time of the exam, tick who is on duty, save. Saving numbers and records one letter per person. */
export default function SupervisionLetters() {
  const { ayid } = useAcademicYear();

  const [view, setView] = useState<LetterView>("assign");
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

  const [slotIdx, setSlotIdx] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const requestId = useRef(0);
  const [dropped, setDropped] = useState(0);
  // Saved duties that are no longer a date and time of the exam also need a save (it drops them).
  const dirty = !!data && (fingerprint(rows) !== baseline || dropped > 0);

  // Staff who can be given duty: our own, still at the college.
  useEffect(() => {
    StaffService.list({ type: "internal" })
      .then((list) => setStaff([...list].sort((a, b) => a.name.localeCompare(b.name))))
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
      // The first date is chosen for you; after a save the date you were on stays.
      setSlotIdx((current) => (current !== "" && Number(current) < d.slots.length ? current : d.slots.length > 0 ? "0" : ""));
    } catch (err) {
      if (mine !== requestId.current) return;
      setData(null);
      Swal.fire("Supervision letters", apiReason(err, "The exam's dates could not be loaded."), "error");
    } finally {
      if (mine === requestId.current) setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    setSlotIdx("");
    setSearch("");
    setDepartmentId("");
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
    if (data && (await confirmUndo("The duties go back to what is saved."))) setRows(rowsFromLetters(data).rows);
  };

  // ---- who is shown ----
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.staffId, s])), [staff]);
  const departments = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of staff ?? []) if (s.departmentId && s.department) seen.set(s.departmentId, s.department);
    return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [staff]);

  const slots = data?.slots ?? [];
  const slot = slotIdx === "" ? -1 : Number(slotIdx);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (staff ?? []).filter((s) => {
      if (departmentId && s.departmentId !== departmentId) return false;
      return !q || `${s.name} ${s.employeeCode ?? ""} ${s.department ?? ""} ${s.designation ?? ""}`.toLowerCase().includes(q);
    });
  }, [staff, search, departmentId]);

  // ---- counts over everyone who would get a letter (people who left are not counted) ----
  const slotCounts = useMemo(() => {
    const counts = new Array<number>(slots.length).fill(0);
    for (const [id, r] of Object.entries(rows)) {
      if (!r.role || !staffById.has(id)) continue;
      r.slots.forEach((i) => (counts[i] = (counts[i] ?? 0) + 1));
    }
    return counts;
  }, [rows, slots.length, staffById]);
  const assignedCount = useMemo(() => Object.entries(rows).filter(([id, r]) => r.role && r.slots.size > 0 && staffById.has(id)).length, [rows, staffById]);
  const dutyCount = slotCounts.reduce((a, b) => a + b, 0);
  // Letters of people who are no longer in the staff list: saving cancels them.
  const leftCount = (data?.letters ?? []).filter((l) => !staffById.has(l.staffId)).length;

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
      d[id] = { role, slots: d[id]?.slots ?? new Set() };
    });

  const toggle = (id: string, on: boolean) =>
    edit((d) => {
      const row = (d[id] ??= { role: defaultRole, slots: new Set() });
      if (!row.role) row.role = defaultRole;
      if (on) row.slots.add(slot);
      else row.slots.delete(slot);
    });

  const tickShown = (on: boolean) =>
    edit((d) => {
      for (const s of shown) {
        const row = (d[s.staffId] ??= { role: defaultRole, slots: new Set() });
        if (!row.role) row.role = defaultRole;
        if (on) row.slots.add(slot);
        else row.slots.delete(slot);
      }
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

  const letterRows: LetterRow[] = useMemo(
    () => (data?.letters ?? []).map((l) => ({ letterId: l.letterId, staffId: l.staffId, letterNo: l.letterNo, name: l.staffName, role: l.role ?? "", duties: l.duties })),
    [data],
  );

  const exam = data?.exam ?? exams.find((e) => e.examId === examId);
  const info = exam
    ? [exam.half, countWord(exam.slotCount, "date"), countWord(exam.letterCount, "letter")].filter(Boolean).join(" · ")
    : !ayid
      ? "Loading…"
      : exams.length === 0
        ? "No exam in this academic year has a timetable yet. Save its timetable in Generate Hall Ticket first."
        : "Choose an exam, then a date and time, and tick who is on duty. Saving gives each person a numbered letter.";

  const slotOptions = slots.map((s, i) => ({ value: String(i), label: `${s.date} · ${s.time} (${slotCounts[i] ?? 0} on duty)` }));
  const hasSlots = !!data && slots.length > 0;
  const onThisDate = slot >= 0 ? slotCounts[slot] : 0;

  return (
    <>
      <PageMeta title="GradeSphere | Supervision Letters" description="Assign staff to exam supervision duties" />
      <div className="min-w-0 space-y-4">
        <LetterPageHeader title="Supervision Letters" info={info} view={view} onView={setView} />

        <ComponentCard title="Supervision duty - Filters">
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExamField exams={exams} examId={examId} onExam={chooseExam} />
            {view === "assign" && hasSlots && (
              <>
                <div className="lg:col-span-2">
                  <Select label="Date and time" placeholder="Select Date and time" options={slotOptions} value={slotIdx} onChange={setSlotIdx} />
                </div>
                <LetterDateField value={letterDate} onChange={setLetterDate} />
              </>
            )}
          </div>
          {view === "assign" && hasSlots && (
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <LetterSearch value={search} onChange={setSearch} placeholder="Name, ID, department or designation" label="Search staff" />
              </div>
              <Select options={[{ value: "", label: "All departments" }, ...departments]} placeholder="All departments" value={departmentId} onChange={setDepartmentId} />
            </div>
          )}
        </ComponentCard>

        {examId && loadingData && !data && <p className="text-sm text-gray-500 dark:text-gray-400">Loading the exam's dates and staff…</p>}

        {data && slots.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">This exam has no dates yet.</p>}

        {view === "letters" && data && <LettersView examId={data.exam.examId} examTitle={data.exam.title} kind="supervision" rows={letterRows} dirty={dirty} loadedKey={data} />}

        {view === "assign" && hasSlots && staff && (
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <LetterSummary text={`${onThisDate} on duty on this date · ${assignedCount} ${assignedCount === 1 ? "person" : "people"}, ${dutyCount} ${dutyCount === 1 ? "duty" : "duties"} in all`} />
              <div className="flex items-center gap-1">
                <TextButton onClick={() => tickShown(true)} title="Put everyone in the list below on duty on this date">
                  Tick all shown
                </TextButton>
                <TextButton onClick={() => tickShown(false)} title="Take everyone in the list below off duty on this date">
                  Clear
                </TextButton>
              </div>
              <LetterActions dirty={dirty} saving={saving} onUndo={undo} onSave={save} />
            </div>

            <LetterNotice message={notice} onDismiss={() => setNotice("")} />

            <p className="border-b border-gray-100 px-4 py-1.5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              A person's role is the same on every date: changing it here changes it for all their dates.
            </p>

            {dropped > 0 && (
              <p className="flex items-center gap-2 border-b border-warning-200 bg-warning-50 px-4 py-1.5 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {dropped} {dropped === 1 ? "duty" : "duties"} on saved letters {dropped === 1 ? "is" : "are"} no longer a date of this exam. Saving drops {dropped === 1 ? "it" : "them"} from the letters.
                </span>
              </p>
            )}

            {leftCount > 0 && (
              <p className="flex items-center gap-2 border-b border-warning-200 bg-warning-50 px-4 py-1.5 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {countWord(leftCount, "letter")} {leftCount === 1 ? "belongs" : "belong"} to people no longer in the staff list. Saving cancels {leftCount === 1 ? "it" : "them"}.
                </span>
              </p>
            )}

            {shown.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{staff.length === 0 ? "No staff yet. Add them in Staff Master first." : "No staff match your search."}</p>
            ) : (
              <div className="max-h-[70vh] overflow-auto overscroll-contain">
                <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={`${tableHead} w-24`}>
                        On duty
                      </th>
                      <th scope="col" className={tableHead}>
                        Name
                      </th>
                      <th scope="col" className={tableHead}>
                        Department
                      </th>
                      <th scope="col" className={tableHead}>
                        Role
                      </th>
                      <th scope="col" className={`${tableHead} w-28`}>
                        Other dates
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((s) => {
                      const row = rows[s.staffId];
                      const on = !!row?.slots.has(slot);
                      const other = row ? [...row.slots].filter((i) => i !== slot).sort((a, b) => a - b) : [];
                      return (
                        <tr key={s.staffId} className={on ? "bg-brand-25/60 dark:bg-brand-500/[0.04]" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}>
                          <td className={tableCell}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={(e) => toggle(s.staffId, e.target.checked)}
                              aria-label={`${s.name} on duty`}
                              className="size-5 cursor-pointer accent-brand-500"
                            />
                          </td>
                          <td className={tableCell}>
                            <span className="block font-medium text-gray-800 dark:text-white/90">{s.name}</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">{[s.employeeCode, s.designation].filter(Boolean).join(" · ") || " "}</span>
                          </td>
                          <td className={`${tableCell} text-gray-700 dark:text-gray-300`}>{s.department || "—"}</td>
                          <td className={tableCell}>
                            <select
                              value={row?.role || defaultRole}
                              onChange={(e) => setRole(s.staffId, e.target.value)}
                              disabled={!on}
                              aria-label={`Role of ${s.name}`}
                              className={rowSelectClass}
                            >
                              {roles.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className={`${tableCell} text-gray-700 dark:text-gray-300`}>
                            {other.length > 0 ? (
                              <span className="cursor-help underline decoration-dotted underline-offset-2" title={other.map((i) => `${slots[i].date} · ${slots[i].time}`).join("\n")}>
                                {other.length}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
