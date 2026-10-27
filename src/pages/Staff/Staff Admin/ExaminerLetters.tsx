import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../../components/common/PageMeta";
import Select from "../../../components/form/Select";
import { useAcademicYear } from "../../../context/AcademicYearContext";
import { StaffService } from "../../../services/StaffService";
import type { Staff } from "../../../services/StaffService";
import { StaffLetterService } from "../../../services/StaffLetterService";
import type { AppointmentData, AppointmentSubject, AppointmentType, ExamGroup } from "../../../services/StaffLetterService";
import StaffPicker from "./StaffPicker";
import type { PickedPerson } from "./StaffPicker";
import { LetterActionBar, LetterNotice, LetterPageHeader, LetterSearch } from "./LetterPageParts";
import { apiReason, confirmLeave, confirmUndo, countWord, escapeHtml, letterInputClass, today } from "./letterHelpers";

/** Who is down as examiner and as moderator for one subject (staff ids). */
interface Pick {
  examiners: string[];
  moderators: string[];
}
type Picks = Record<string, Pick>;
type Column = keyof Pick;

const COLUMNS: { key: Column; type: AppointmentType; title: string }[] = [
  { key: "examiners", type: "EXAMINER", title: "Examiner" },
  { key: "moderators", type: "MODERATOR", title: "Moderator" },
];

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

/** Examiner and moderator letters: choose who assesses each subject of an exam; saving numbers and records one letter each. */
export default function ExaminerLetters() {
  const { ayid } = useAcademicYear();

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
  const [search, setSearch] = useState("");

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
    } catch (err) {
      if (mine !== requestId.current) return;
      setData(null);
      Swal.fire("Examiner letters", apiReason(err, "The exam's subjects could not be loaded."), "error");
    } finally {
      if (mine === requestId.current) setLoadingData(false);
    }
  }, []);

  useEffect(() => {
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
    if (data && (await confirmUndo("The screen goes back to what is saved."))) setPicks(picksFromLetters(data));
  };

  // ---- who is who ----
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.staffId, s])), [staff]);
  const savedLetters = useMemo(() => new Map((data?.letters ?? []).map((l) => [letterKey(l.subjectId, l.type, l.staffId), l])), [data]);
  // A person who left may still hold a letter; their name comes from the letter.
  const letterNames = useMemo(() => new Map((data?.letters ?? []).map((l) => [l.staffId, l.staffName])), [data]);

  const chosenFor = (subjectId: string, column: (typeof COLUMNS)[number]): PickedPerson[] =>
    (picks[subjectId]?.[column.key] ?? NONE).map((id) => ({
      id,
      name: staffById.get(id)?.name ?? letterNames.get(id) ?? "Unknown",
      external: !!staffById.get(id)?.isExternal,
      letterNo: savedLetters.get(letterKey(subjectId, column.type, id))?.letterNo ?? "",
    }));

  const change = (subjectId: string, column: Column, fn: (ids: string[]) => string[]) =>
    setPicks((current) => {
      const row = current[subjectId] ?? { examiners: [], moderators: [] };
      return { ...current, [subjectId]: { ...row, [column]: fn(row[column]) } };
    });

  // ---- what is shown ----
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list: ({ group: string } | { subject: AppointmentSubject })[] = [];
    let last = "";
    for (const s of data?.subjects ?? []) {
      if (q && !`${s.code} ${s.name} ${s.branch}`.toLowerCase().includes(q)) continue;
      const title = groupTitle(s);
      if (title !== last) {
        list.push({ group: title });
        last = title;
      }
      list.push({ subject: s });
    }
    return list;
  }, [data, search]);

  const examinerCount = Object.values(picks).reduce((n, p) => n + p.examiners.length, 0);
  const moderatorCount = Object.values(picks).reduce((n, p) => n + p.moderators.length, 0);

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
      const codes = new Map(data.subjects.map((s) => [s.subjectId, s.code]));
      const ok = await Swal.fire({
        icon: "warning",
        title: "Cancel letters?",
        html: `<p>${countWord(cancelled.length, "letter")} will be cancelled:</p><ul style="text-align:left;margin:8px 0 0 18px;list-style:disc">${cancelled
          .map((l) => `<li><b>${escapeHtml(l.staffName)}</b>, ${l.type === "MODERATOR" ? "Moderator" : "Examiner"} for ${escapeHtml(codes.get(l.subjectId) ?? "")} (${escapeHtml(l.letterNo)})</li>`)
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

  const exam = data?.exam ?? exams.find((e) => e.examId === examId);

  return (
    <>
      <PageMeta title="GradeSphere | Examiner Letters" description="Appoint examiners and moderators for the subjects of an exam" />
      <div className="min-w-0 space-y-5">
        <LetterPageHeader title="Examiner Letters" intro="Choose the examiner and moderator for each subject. Saving gives each person a numbered letter." />

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-start">
            <Select label="Exam" placeholder="Choose exam" options={exams.map((e) => ({ value: e.examId, label: e.title }))} value={examId} onChange={chooseExam} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Letter date</span>
              <input type="date" value={letterDate} onChange={(e) => setLetterDate(e.target.value)} className={letterInputClass} />
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Letters already made keep their own date.</span>
            </label>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {data
              ? `${countWord(data.subjects.length, "subject")} · ${countWord(data.exam.appointmentCount, "letter")}`
              : !ayid
                ? "Loading…"
                : exams.length === 0
                  ? "No exam in this academic year has a timetable yet. Save its timetable in Generate Hall Ticket first."
                  : exam
                    ? "Loading the subjects…"
                    : "Choose an exam to see its subjects."}
          </p>
        </div>

        <LetterNotice message={notice} onDismiss={() => setNotice("")} />

        {examId && loadingData && !data && <p className="text-sm text-gray-500 dark:text-gray-400">Loading the exam's subjects and staff…</p>}

        {data && staff && data.subjects.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">This exam has no subjects yet.</p>}

        {data && staff && data.subjects.length > 0 && (
          <div className="min-w-0 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-5 dark:border-gray-800">
              <LetterSearch value={search} onChange={setSearch} placeholder="Subject code, name or branch" label="Search subjects" />
            </div>

            {rows.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500 sm:px-5 dark:text-gray-400">No subject matches your search.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-600 dark:border-gray-800 dark:text-gray-400">
                      <th scope="col" className="w-[30%] px-4 py-3 sm:pl-5">
                        Subject
                      </th>
                      {COLUMNS.map((c) => (
                        <th key={c.key} scope="col" className="px-3 py-3">
                          {c.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) =>
                      "group" in r ? (
                        <tr key={`g${i}`} className="bg-gray-50 dark:bg-white/[0.03]">
                          <th scope="colgroup" colSpan={3} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 sm:pl-5 dark:text-gray-400">
                            {r.group}
                          </th>
                        </tr>
                      ) : (
                        <tr key={r.subject.subjectId} className="border-b border-gray-100 align-top dark:border-gray-800">
                          <th scope="row" className="px-4 py-3 text-left font-normal sm:pl-5">
                            <span className="block font-semibold text-gray-800 dark:text-white/90">{r.subject.code}</span>
                            <span className="block text-gray-600 dark:text-gray-400">{r.subject.name}</span>
                          </th>
                          {COLUMNS.map((c, k) => (
                            <td key={c.key} className="px-3 py-2.5">
                              <StaffPicker
                                label={`${c.title} for ${r.subject.code}`}
                                staff={staff}
                                chosen={chosenFor(r.subject.subjectId, c)}
                                blocked={picks[r.subject.subjectId]?.[COLUMNS[1 - k].key] ?? NONE}
                                onAdd={(id) => change(r.subject.subjectId, c.key, (ids) => [...ids, id])}
                                onRemove={(id) => change(r.subject.subjectId, c.key, (ids) => ids.filter((x) => x !== id))}
                              />
                            </td>
                          ))}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <LetterActionBar summary={`${countWord(examinerCount, "examiner")} · ${countWord(moderatorCount, "moderator")}`} dirty={dirty} saving={saving} onUndo={undo} onSave={save} />
          </div>
        )}
      </div>
    </>
  );
}
