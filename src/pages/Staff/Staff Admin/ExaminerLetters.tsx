import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import { StaffService } from "../../../services/StaffService";
import type { Staff } from "../../../services/StaffService";
import { StaffLetterService } from "../../../services/StaffLetterService";
import type { AppointmentData, AppointmentSubject, AppointmentType, ExamGroup } from "../../../services/StaffLetterService";
import LettersView from "./LettersView";
import type { LetterRow } from "./LettersView";
import {
  ExamField,
  GroupedSelect,
  LetterActions,
  LetterDateField,
  LetterNotice,
  LetterPageHeader,
  LetterSearch,
  LetterSummary,
  MiniChoice,
  tableCell,
  tableHead,
} from "./LetterPageParts";
import type { LetterView } from "./LetterPageParts";
import { apiReason, confirmLeave, confirmUndo, countWord, escapeHtml, today } from "./letterHelpers";

/** Who is down as examiner and as moderator for one subject (staff ids). */
interface Pick {
  examiners: string[];
  moderators: string[];
}
type Picks = Record<string, Pick>;

/** What a person is for the chosen subject. */
type Role = "none" | "examiner" | "moderator";

const NONE: string[] = [];

/** A fingerprint of who is down for what; two screens with the same fingerprint would save the same letters. */
const fingerprint = (picks: Picks) =>
  Object.keys(picks)
    .filter((id) => picks[id].examiners.length > 0 || picks[id].moderators.length > 0)
    .sort()
    .map((id) => `${id}|${[...picks[id].examiners].sort().join(",")}|${[...picks[id].moderators].sort().join(",")}`)
    .join(";");

const picksFromLetters = (data: AppointmentData): Picks => {
  const picks: Picks = {};
  for (const l of data.letters) {
    const p = (picks[l.subjectId] ??= { examiners: [], moderators: [] });
    (l.type === "MODERATOR" ? p.moderators : p.examiners).push(l.staffId);
  }
  return picks;
};

/** "Semester 6" stays as it is; a bare "VI" becomes "Semester VI". */
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const semesterText = (semester: number | null) => (semester == null ? "" : `Semester ${ROMAN[semester] ?? semester}`);

const groupTitle = (s: AppointmentSubject) => [s.branch, semesterText(s.semester)].filter(Boolean).join(" · ");

const letterKey = (subjectId: string, type: AppointmentType, staffId: string) => `${subjectId}|${type}|${staffId}`;

/** One line of the table: a member of staff, or someone who left but still holds a letter for this subject. */
interface Person {
  id: string;
  name: string;
  detail: string;
  department: string;
  external: boolean;
  left: boolean;
}

const personOf = (s: Staff): Person => ({
  id: s.staffId,
  name: s.name,
  detail: s.isExternal ? ["External", s.externalCollege].filter(Boolean).join(" · ") : [s.employeeCode, s.designation].filter(Boolean).join(" · "),
  department: s.department ?? "",
  external: s.isExternal,
  left: false,
});

/** Examiner and moderator letters: pick a subject, mark who assesses it, save. Saving numbers and records one letter per person and subject. */
export default function ExaminerLetters() {
  const { ayid } = useAcademicYear();

  const [view, setView] = useState<LetterView>("assign");
  const [exams, setExams] = useState<ExamGroup[]>([]);
  const [examId, setExamId] = useState("");
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [data, setData] = useState<AppointmentData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [picks, setPicks] = useState<Picks>({});
  const [baseline, setBaseline] = useState("");
  const [letterDate, setLetterDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const [subjectId, setSubjectId] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [externalOnly, setExternalOnly] = useState(false);

  const requestId = useRef(0);
  const dirty = !!data && fingerprint(picks) !== baseline;

  // Anyone who can be appointed: our own staff and visiting professors from other colleges, while still active.
  useEffect(() => {
    StaffService.list({})
      .then((list) => setStaff([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch((err) => {
        setStaff([]);
        Swal.fire("Examiner letters", apiReason(err, "The staff list could not be loaded."), "error");
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
    setPicks({});
    setBaseline("");
    setNotice("");
    setExamId("");
    setExams([]);
    refreshExams()
      .then((list) => list.length === 1 && setExamId(list[0].examId))
      .catch((err) => Swal.fire("Examiner letters", apiReason(err, "The exams could not be loaded."), "error"));
  }, [refreshExams]);

  const loadData = useCallback(async (id: string) => {
    const mine = ++requestId.current;
    setLoadingData(true);
    try {
      const d = await StaffLetterService.appointments(id);
      if (mine !== requestId.current) return;
      const p = picksFromLetters(d);
      setData(d);
      setPicks(p);
      setBaseline(fingerprint(p));
      // The first subject is chosen for you; after a save the subject you were on stays.
      setSubjectId((current) => (d.subjects.some((s) => s.subjectId === current) ? current : (d.subjects[0]?.subjectId ?? "")));
    } catch (err) {
      if (mine !== requestId.current) return;
      setData(null);
      Swal.fire("Examiner letters", apiReason(err, "The exam's subjects could not be loaded."), "error");
    } finally {
      if (mine === requestId.current) setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    setSubjectId("");
    setSearch("");
    setDepartmentId("");
    setExternalOnly(false);
    if (!examId) {
      requestId.current++;
      setData(null);
      setPicks({});
      setBaseline("");
      return;
    }
    setData(null);
    setNotice("");
    loadData(examId);
  }, [examId, loadData]);

  // Closing the tab with unsaved choices asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const chooseExam = async (id: string) => {
    if (id === examId || (dirty && !(await confirmLeave("The examiners and moderators you chose for this exam have not been saved.")))) return;
    setExamId(id);
  };

  const undo = async () => {
    if (data && (await confirmUndo("The choices go back to what is saved."))) setPicks(picksFromLetters(data));
  };

  // ---- who is who ----
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.staffId, s])), [staff]);
  const savedLetters = useMemo(() => new Map((data?.letters ?? []).map((l) => [letterKey(l.subjectId, l.type, l.staffId), l])), [data]);
  // A person who left may still hold a letter; their name comes from the letter.
  const letterNames = useMemo(() => new Map((data?.letters ?? []).map((l) => [l.staffId, l.staffName])), [data]);
  const subjectsById = useMemo(() => new Map((data?.subjects ?? []).map((s) => [s.subjectId, s])), [data]);
  const departments = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of staff ?? []) if (s.departmentId && s.department) seen.set(s.departmentId, s.department);
    return [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [staff]);

  const roleOf = (subject: string, staffId: string): Role =>
    picks[subject]?.examiners.includes(staffId) ? "examiner" : picks[subject]?.moderators.includes(staffId) ? "moderator" : "none";

  const setRole = (subject: string, staffId: string, role: Role) =>
    setPicks((current) => {
      const row = current[subject] ?? { examiners: [], moderators: [] };
      const examiners = row.examiners.filter((x) => x !== staffId);
      const moderators = row.moderators.filter((x) => x !== staffId);
      if (role === "examiner") examiners.push(staffId);
      if (role === "moderator") moderators.push(staffId);
      return { ...current, [subject]: { examiners, moderators } };
    });

  // ---- what is shown ----
  const subject = subjectsById.get(subjectId);

  const subjectGroups = useMemo(() => {
    const groups = new Map<string, { title: string; options: { value: string; label: string }[] }>();
    for (const s of data?.subjects ?? []) {
      const title = groupTitle(s) || "Subjects";
      const group = groups.get(title) ?? { title, options: [] };
      const p = picks[s.subjectId];
      group.options.push({
        value: s.subjectId,
        label: `${s.code} ${s.name} (${countWord(p?.examiners.length ?? 0, "examiner")}, ${countWord(p?.moderators.length ?? 0, "moderator")})`,
      });
      groups.set(title, group);
    }
    return [...groups.values()];
  }, [data, picks]);

  const shown = useMemo(() => {
    if (!subject) return [];
    const q = search.trim().toLowerCase();
    const list = (staff ?? [])
      .filter((s) => {
        if (departmentId && s.departmentId !== departmentId) return false;
        if (externalOnly && !s.isExternal) return false;
        return !q || `${s.name} ${s.employeeCode ?? ""} ${s.externalCollege ?? ""} ${s.department ?? ""} ${s.designation ?? ""}`.toLowerCase().includes(q);
      })
      .map(personOf);
    // Someone who left but still holds a letter for this subject stays in view, so the letter can be cancelled.
    const p = picks[subject.subjectId] ?? { examiners: NONE, moderators: NONE };
    const left = [...p.examiners, ...p.moderators]
      .filter((id) => !staffById.has(id))
      .map<Person>((id) => ({ id, name: letterNames.get(id) ?? "Unknown", detail: "No longer in the staff list", department: "", external: false, left: true }));
    return [...left, ...list];
  }, [subject, staff, staffById, picks, letterNames, search, departmentId, externalOnly]);

  const examinerTotal = Object.values(picks).reduce((n, p) => n + p.examiners.length, 0);
  const moderatorTotal = Object.values(picks).reduce((n, p) => n + p.moderators.length, 0);
  const here = subject ? picks[subject.subjectId] : undefined;

  // ---- save ----
  const save = async () => {
    if (!data) return;
    if (!letterDate) {
      Swal.fire("Examiner letters", "Choose the date to print on the new letters.", "info");
      return;
    }
    const subjects = data.subjects
      .filter((s) => (picks[s.subjectId]?.examiners.length ?? 0) + (picks[s.subjectId]?.moderators.length ?? 0) > 0)
      .map((s) => ({ subjectId: s.subjectId, examiners: picks[s.subjectId].examiners, moderators: picks[s.subjectId].moderators }));

    const cancelled = data.letters.filter((l) => !(picks[l.subjectId]?.[l.type === "MODERATOR" ? "moderators" : "examiners"] ?? NONE).includes(l.staffId));
    if (cancelled.length > 0) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "Cancel letters?",
        html: `<p>${countWord(cancelled.length, "letter")} will be cancelled:</p><ul style="text-align:left;margin:8px 0 0 18px;list-style:disc">${cancelled
          .map((l) => `<li><b>${escapeHtml(l.staffName)}</b>, ${l.type === "MODERATOR" ? "Moderator" : "Examiner"} for ${escapeHtml(subjectsById.get(l.subjectId)?.code ?? "")} (${escapeHtml(l.letterNo)})</li>`)
          .join("")}</ul><p style="font-size:13px;color:#6b7280;margin-top:10px">A cancelled letter number is not used again.</p>`,
        showCancelButton: true,
        confirmButtonText: "Save and cancel them",
        confirmButtonColor: "#d92d20",
      });
      if (!ok.isConfirmed) return;
    }

    setSaving(true);
    try {
      const result = await StaffLetterService.saveAppointments({ examId: data.exam.examId, letterDate, subjects });
      setNotice(result.message);
      await Promise.all([loadData(data.exam.examId), refreshExams().catch(() => [])]);
    } catch (err) {
      Swal.fire("Letters not saved", apiReason(err, "The letters could not be saved. Nothing was changed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const letterRows: LetterRow[] = useMemo(
    () =>
      (data?.letters ?? []).map((l) => {
        const s = subjectsById.get(l.subjectId);
        return {
          letterId: l.letterId,
          staffId: l.staffId,
          letterNo: l.letterNo,
          name: l.staffName,
          role: l.type === "MODERATOR" ? "Moderator" : "Examiner",
          detail: s ? `${s.code} ${s.name}` : "",
        };
      }),
    [data, subjectsById],
  );

  const exam = data?.exam ?? exams.find((e) => e.examId === examId);
  const info = data
    ? `${countWord(data.subjects.length, "subject")} · ${countWord(data.exam.appointmentCount, "letter")}`
    : !ayid
      ? "Loading…"
      : exams.length === 0
        ? "No exam in this academic year has a timetable yet. Save its timetable in Generate Hall Ticket first."
        : exam
          ? "Loading the subjects…"
          : "Choose an exam, then a subject, and mark who is the examiner or moderator. Saving gives each person a numbered letter.";

  const hasSubjects = !!data && data.subjects.length > 0;

  return (
    <>
      <PageMeta title="GradeSphere | Examiner Letters" description="Appoint examiners and moderators for the subjects of an exam" />
      <div className="min-w-0 space-y-4">
        <LetterPageHeader title="Examiner Letters" info={info} view={view} onView={setView} />

        <ComponentCard title="Examiner and moderator - Filters">
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExamField exams={exams} examId={examId} onExam={chooseExam} />
            {view === "assign" && hasSubjects && (
              <>
                <div className="lg:col-span-2">
                  <GroupedSelect label="Subject" placeholder="Select Subject" groups={subjectGroups} value={subjectId} onChange={setSubjectId} />
                </div>
                <LetterDateField value={letterDate} onChange={setLetterDate} />
              </>
            )}
          </div>
          {view === "assign" && hasSubjects && (
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LetterSearch value={search} onChange={setSearch} placeholder="Name, ID, college or department" label="Search staff" />
              <Select options={[{ value: "", label: "All departments" }, ...departments]} placeholder="All departments" value={departmentId} onChange={setDepartmentId} />
              <Checkbox label="Show external only" checked={externalOnly} onChange={setExternalOnly} />
            </div>
          )}
        </ComponentCard>

        {examId && loadingData && !data && <p className="text-sm text-gray-500 dark:text-gray-400">Loading the exam's subjects and staff…</p>}

        {data && data.subjects.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">This exam has no subjects yet.</p>}

        {view === "letters" && data && <LettersView target={{ examId: data.exam.examId }} title={data.exam.title} kind="appointment" rows={letterRows} dirty={dirty} loadedKey={data} emptyText="No letters yet for this exam. Choose Assign, pick the people and save." />}

        {view === "assign" && hasSubjects && staff && (
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <LetterSummary
                text={`${countWord(here?.examiners.length ?? 0, "examiner")}, ${countWord(here?.moderators.length ?? 0, "moderator")} for this subject · ${countWord(examinerTotal + moderatorTotal, "letter")} in all`}
              />
              <LetterActions dirty={dirty} saving={saving} onUndo={undo} onSave={save} />
            </div>

            <LetterNotice message={notice} onDismiss={() => setNotice("")} />

            {shown.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">{staff.length === 0 ? "No staff yet. Add them in Staff Master first." : "No staff match your search."}</p>
            ) : (
              <div className="max-h-[70vh] overflow-auto overscroll-contain">
                <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={tableHead}>
                        Name
                      </th>
                      <th scope="col" className={tableHead}>
                        Department
                      </th>
                      <th scope="col" className={tableHead}>
                        For {subject?.code}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((p) => {
                      const role = roleOf(subject!.subjectId, p.id);
                      const letterNo =
                        role === "none" ? "" : (savedLetters.get(letterKey(subject!.subjectId, role === "moderator" ? "MODERATOR" : "EXAMINER", p.id))?.letterNo ?? "");
                      return (
                        <tr key={p.id} className={role !== "none" ? "bg-brand-25/60 dark:bg-brand-500/[0.04]" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}>
                          <td className={tableCell}>
                            <span className="block font-medium text-gray-800 dark:text-white/90">{p.name}</span>
                            <span className={`block text-xs ${p.left ? "text-warning-600 dark:text-orange-300" : "text-gray-500 dark:text-gray-400"}`}>
                              {p.detail || " "}
                              {letterNo && <span className="ml-2 font-mono text-[11px] text-gray-400 dark:text-gray-500">{letterNo}</span>}
                            </span>
                          </td>
                          <td className={`${tableCell} text-gray-700 dark:text-gray-300`}>{p.department || "—"}</td>
                          <td className={tableCell}>
                            <MiniChoice
                              label={`${p.name} for ${subject!.code}`}
                              value={role}
                              onChange={(r) => setRole(subject!.subjectId, p.id, r)}
                              options={[
                                { value: "none", label: "—" },
                                { value: "examiner", label: "Examiner" },
                                { value: "moderator", label: "Moderator" },
                              ]}
                            />
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
