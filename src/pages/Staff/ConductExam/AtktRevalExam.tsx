import React, { useState, useEffect, useMemo, useCallback } from "react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Checkbox from "../../../components/form/input/Checkbox";
import Switch from "../../../components/form/switch/Switch";
import Button from "../../../components/ui/button/Button";
import DataTable from "../../../components/ui/table/DataTable";
import Alert from "../../../components/ui/alert/Alert";
import { CourseService, CourseApiResponse } from "../../../services/Course";
import { PatternService, PatternApiResponse } from "../../../services/Pattern";
import {
  AtktRevalExamService,
  AtktExamOption,
  AtktMatrixRequest,
  AtktMatrixResponse,
  AtktStudentRow,
  AtktCell,
  AtktSubjectColumn,
} from "../../../services/AtktRevalExamService";
import Swal from "sweetalert2";
import { Loader2, Save, Trash2, Users, Download, FileSpreadsheet } from "lucide-react";

interface Option {
  value: string;
  label: string;
}
export type RenderResult = {
  content?: React.ReactNode;
  rowSpan?: number;
  colSpan?: number;
  skip?: boolean;
};
interface Column<T = any> {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
  group?: boolean;
  render?: (row: T) => React.ReactNode | RenderResult;
}
type AlertVariant = "success" | "warning" | "error" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

/**
 * Selection state, head-aware. Keyed by StdMstId, then SubjectId. Presence of a subject key means
 * the student is appearing for it; the value lists the head keys ("H1") being re-sat. An empty
 * array means the whole subject (every head) -- used for combined subjects and for backlog subjects
 * that carry no heads (never attempted). Head-wise subjects store their specific chosen heads.
 */
type SelectionMap = Record<string, Record<string, string[]>>;

const COMBINED = "Combined";

/** The head keys the operator may re-sit for a subject cell. */
const selectableHeadKeys = (cell: { heads: { head: string; selectable: boolean }[] }): string[] =>
  (cell.heads ?? []).filter((h) => h.selectable).map((h) => h.head);

const MODE_ATKT = "ATKT";
const MODE_REVALUATION = "Revaluation";

/** Tailwind classes per cell status, so the grid reads at a glance in either theme. */
const statusClasses: Record<string, string> = {
  Passed: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  Failed: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  Absent: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  NotAttempted: "bg-gray-50 text-gray-500 dark:bg-white/[0.03] dark:text-gray-400",
};

/** Subject-scope tokens come back normalised ("NOTATTEMPTED"); make them readable. */
const scopeLabels: Record<string, string> = {
  FAILED: "failed",
  PASSED: "cleared",
  ABSENT: "absent",
  NOTATTEMPTED: "not attempted",
};

const describeScopes = (scopes: string[]): string =>
  scopes.length === 0
    ? "every subject"
    : scopes.map((s) => scopeLabels[s] ?? s.toLowerCase()).join(", ");

const PolicyChip = ({ label, value }: { label: string; value: string }) => (
  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
    {label}: {value}
  </span>
);

/** Isolated so ticking one box does not re-render every other cell of the grid. */
const SelectableCell = React.memo(function SelectableCell({
  stdMstId,
  subjectId,
  checked,
  colorClasses,
  title,
  onToggle,
}: {
  stdMstId: string;
  subjectId: string;
  checked: boolean;
  colorClasses: string;
  title: string;
  onToggle: (stdMstId: string, subjectId: string, checked: boolean) => void;
}) {
  return (
    <div className={`flex justify-center rounded-md py-1.5 ${colorClasses}`} title={title}>
      <Checkbox
        checked={checked}
        onChange={(value) => onToggle(stdMstId, subjectId, value)}
      />
    </div>
  );
});

const tileBorder: Record<string, string> = {
  Failed: "border-red-300 dark:border-red-900/40",
  Absent: "border-amber-300 dark:border-amber-900/40",
};

/** Compact subject tile for the dense per-student row: subject code, head marks, and checkboxes. */
const SubjectTile = React.memo(function SubjectTile({
  cell,
  column,
  headWise,
  isElective,
  subjectChecked,
  isHeadFresh,
  onToggleSubject,
  onToggleHead,
}: {
  stdMstId: string;
  cell: AtktCell;
  column?: AtktSubjectColumn;
  headWise: boolean;
  isElective: boolean;
  subjectChecked: boolean;
  isHeadFresh: (headKey: string) => boolean;
  onToggleSubject: (checked: boolean) => void;
  onToggleHead: (headKey: string, checked: boolean) => void;
}) {
  const border = isElective
    ? "border-dashed border-amber-300 dark:border-amber-900/40"
    : tileBorder[cell.status] || "border-gray-200 dark:border-gray-700";
  const fail = cell.status === "Failed" || cell.status === "Absent";
  return (
    <div
      title={`${column?.subjectName || ""}${isElective ? " (elective)" : ""}`}
      className={`w-[136px] flex-shrink-0 rounded-lg border ${border} bg-white dark:bg-gray-900 p-2`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[11px] font-medium text-gray-700 dark:text-gray-300">
          {column?.subjectCode || ""}
        </span>
        <span
          className={`shrink-0 rounded-sm px-1 text-[9px] font-medium ${
            headWise
              ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
              : "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300"
          }`}
        >
          {headWise ? "HW" : "C"}
        </span>
      </div>

      {headWise ? (
        <div className="mt-1 space-y-0.5">
          {cell.heads.map((h) => (
            <div key={h.head} className="flex items-center gap-1 text-[11px]">
              <span className="w-7 shrink-0 truncate text-gray-600 dark:text-gray-400">{h.headType}</span>
              <span
                className={`flex-1 text-right ${
                  h.isFailing || h.isAbsent ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {h.isAbsent ? "Ab" : `${h.obtained ?? "—"}/${h.outOf}`}
              </span>
              <Checkbox checked={isHeadFresh(h.head)} disabled={!h.selectable} onChange={(v) => onToggleHead(h.head, v)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-1 text-[11px]">
          <span className={`flex-1 ${fail ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
            {cell.isAbsent ? "Ab" : `${cell.obtainedTotal}/${cell.outOfTotal}`}
          </span>
          <Checkbox checked={subjectChecked} onChange={onToggleSubject} />
        </div>
      )}
    </div>
  );
});

export default function AtktRevalExam() {

  // 🔹 Mode
  const modeOptions: Option[] = [
    { value: MODE_ATKT, label: "ATKT" },
    { value: MODE_REVALUATION, label: "Revaluation" },
  ];
  const [mode, setMode] = useState(MODE_ATKT);

  // 🔹 New / Edit
  const [editMode, setEditMode] = useState(false);

  // 🔹 Course
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [courseId, setCourseId] = useState("");

  // 🔹 Pattern
  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");

  // 🔹 Semester (hard coded)
  const semesterOptions: Option[] = [
    { value: "Sem-1", label: "Semester I" },
    { value: "Sem-2", label: "Semester II" },
    { value: "Sem-3", label: "Semester III" },
    { value: "Sem-4", label: "Semester IV" },
    { value: "Sem-5", label: "Semester V" },
    { value: "Sem-6", label: "Semester VI" },
    { value: "Sem-7", label: "Semester VII" },
    { value: "Sem-8", label: "Semester VIII" },
  ];
  const [semester, setSemester] = useState("");

  // 🔹 Source Exam (revaluation only)
  const [sourceExamOptions, setSourceExamOptions] = useState<Option[]>([]);
  const [sourceExamId, setSourceExamId] = useState("");

  // 🔹 Target Exam
  const [targetExamOptions, setTargetExamOptions] = useState<Option[]>([]);
  const [targetExamId, setTargetExamId] = useState("");
  /** The revaluation target is derived from the source exam, not chosen by the operator. */
  const [targetLocked, setTargetLocked] = useState(false);

  //     Matrix
  const [matrix, setMatrix] = useState<AtktMatrixResponse | null>(null);
  const [selections, setSelections] = useState<SelectionMap>({});
  /** "tiles" is the per-student card view (head-aware); "grid" keeps the legacy subject matrix. */
  const [viewMode, setViewMode] = useState<"tiles" | "grid">("tiles");
  /** The filter the loaded matrix belongs to; every write replays it. */
  const [appliedFilter, setAppliedFilter] = useState<AtktMatrixRequest | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  //Alert
  const [alert, setAlert] = useState<AlertState | null>(null);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    fetchCourses();
  }, []);

  // 🔹 Load patterns when course changes
  useEffect(() => {
    if (courseId) {
      fetchPatterns();
    } else {
      setPatternOptions([]);
      setPattern("");
      setSemester("");
    }
  }, [courseId]);

  // 🔹 Exam lists depend on the whole filter head, including the mode
  useEffect(() => {
    setSourceExamOptions([]);
    setSourceExamId("");
    setTargetExamOptions([]);
    setTargetExamId("");
    setTargetLocked(false);
    resetMatrix();

    if (!courseId || !pattern || !semester) return;

    if (mode === MODE_REVALUATION) {
      fetchSourceExams();
    } else {
      fetchTargetExams("");
    }
  }, [courseId, pattern, semester, mode]);

  // 🔹 In revaluation the target exam hangs off the source attempt
  useEffect(() => {
    if (mode !== MODE_REVALUATION) return;

    setTargetExamOptions([]);
    setTargetExamId("");
    setTargetLocked(false);
    resetMatrix();

    if (courseId && pattern && semester && sourceExamId) {
      fetchTargetExams(sourceExamId);
    }
  }, [sourceExamId]);

  // 🔹 New and Edit list different students, so the grid has to be reloaded
  useEffect(() => {
    resetMatrix();
  }, [editMode]);

  const resetMatrix = () => {
    setMatrix(null);
    setSelections({});
    setAppliedFilter(null);
  };

  const buildFilter = (): AtktMatrixRequest | null => {
    const ayid = localStorage.getItem("AYID");
    if (!ayid) {
      Swal.fire("Error", "Academic Year is missing", "error");
      return null;
    }

    return {
      courseId,
      ayid,
      semester,
      pattern,
      mode,
      sourceExamId: mode === MODE_REVALUATION ? sourceExamId : null,
      targetExamId,
      editMode,
    };
  };

  /** True when a subject offers per-head choice (head-wise with heads); combined/headless don't. */
  const isHeadWise = (cell: AtktCell) =>
    cell.passingStrategy !== COMBINED && (cell.heads?.length ?? 0) > 0;

  /** What a whole-subject tick stores: specific heads for head-wise, [] (all) otherwise. */
  const wholeSubjectHeads = (cell: AtktCell) => (isHeadWise(cell) ? selectableHeadKeys(cell) : []);

  /** Seeds the tick state from what the server says is already selected, per head. */
  const seedSelections = (response: AtktMatrixResponse): SelectionMap => {
    const seeded: SelectionMap = {};
    response.students.forEach((row) => {
      const subs: Record<string, string[]> = {};
      row.cells.forEach((cell) => {
        if (isHeadWise(cell)) {
          const chosen = cell.heads.filter((h) => h.selected).map((h) => h.head);
          if (chosen.length) subs[cell.subjectId] = chosen;
        } else if (cell.selected) {
          subs[cell.subjectId] = [];
        }
      });
      seeded[row.stdMstId] = subs;
    });
    return seeded;
  };

  const isSubjectSelected = (stdMstId: string, subjectId: string) =>
    !!(selections[stdMstId] && subjectId in selections[stdMstId]);

  const isHeadFresh = (stdMstId: string, cell: AtktCell, headKey: string) => {
    const heads = selections[stdMstId]?.[cell.subjectId];
    if (!heads) return false;
    return heads.length === 0 ? true : heads.includes(headKey);
  };

  /** Select or clear a whole subject (combined checkbox, matrix cell, or every head of head-wise). */
  const toggleSubject = useCallback((stdMstId: string, cell: AtktCell, checked: boolean) => {
    setSelections((prev) => {
      const subs = { ...(prev[stdMstId] ?? {}) };
      if (checked) subs[cell.subjectId] = wholeSubjectHeads(cell);
      else delete subs[cell.subjectId];
      return { ...prev, [stdMstId]: subs };
    });
  }, []);

  /** Toggle a single head of a head-wise subject; clearing the last head clears the subject. */
  const toggleHead = useCallback((stdMstId: string, cell: AtktCell, headKey: string, checked: boolean) => {
    setSelections((prev) => {
      const subs = { ...(prev[stdMstId] ?? {}) };
      const current = subs[cell.subjectId] ? [...subs[cell.subjectId]] : [];
      const next = checked
        ? current.includes(headKey) ? current : [...current, headKey]
        : current.filter((h) => h !== headKey);
      if (next.length === 0) delete subs[cell.subjectId];
      else subs[cell.subjectId] = next;
      return { ...prev, [stdMstId]: subs };
    });
  }, []);

  const applyRow = (subs: Record<string, string[]>, row: AtktStudentRow, checked: boolean) => {
    const next = { ...subs };
    row.cells.filter((c) => c.selectable).forEach((cell) => {
      if (checked) next[cell.subjectId] = wholeSubjectHeads(cell);
      else delete next[cell.subjectId];
    });
    return next;
  };

  /** Ticks (or clears) every selectable subject of one row, leaving locked ones untouched. */
  const toggleRow = (row: AtktStudentRow, checked: boolean) => {
    setSelections((prev) => ({ ...prev, [row.stdMstId]: applyRow(prev[row.stdMstId] ?? {}, row, checked) }));
  };

  const toggleAllStudents = (checked: boolean) => {
    if (!matrix) return;
    setSelections((prev) => {
      const next: SelectionMap = { ...prev };
      matrix.students.forEach((row) => {
        next[row.stdMstId] = applyRow(next[row.stdMstId] ?? {}, row, checked);
      });
      return next;
    });
  };

  const isRowFullySelected = (row: AtktStudentRow) => {
    const selectable = row.cells.filter((c) => c.selectable);
    if (selectable.length === 0) return false;
    const subs = selections[row.stdMstId] ?? {};
    return selectable.every((c) => c.subjectId in subs);
  };

  const allStudentsSelected = useMemo(() => {
    if (!matrix || matrix.students.length === 0) return false;
    return matrix.students.every((row) => {
      const selectable = row.cells.filter((c) => c.selectable);
      if (selectable.length === 0) return true;
      const subs = selections[row.stdMstId] ?? {};
      return selectable.every((c) => c.subjectId in subs);
    });
  }, [matrix, selections]);

  /**
   * Subjects not taken by every loaded student -- i.e. electives. A student "took" a subject when
   * they hold marks for it (the cell carries heads); a subject with no heads was never attempted by
   * that student. Electives are ordered after the core subjects in the tile view.
   */
  const electiveSubjectIds = useMemo(() => {
    const elective = new Set<string>();
    if (!matrix || matrix.students.length === 0) return elective;
    const total = matrix.students.length;
    const took: Record<string, number> = {};
    matrix.students.forEach((row) =>
      row.cells.forEach((c) => {
        if ((c.heads?.length ?? 0) > 0) took[c.subjectId] = (took[c.subjectId] ?? 0) + 1;
      })
    );
    Object.entries(took).forEach(([sid, count]) => {
      if (count < total) elective.add(sid);
    });
    return elective;
  }, [matrix]);

  const orderOf = (subjectId: string) =>
    matrix?.columns.find((c) => c.subjectId === subjectId)?.order ?? 999;

  /** Tiles for one student: only subjects they actually took, core first then electives. */
  const tilesFor = (row: AtktStudentRow): AtktCell[] =>
    row.cells
      .filter(
        (c) =>
          (c.heads?.length ?? 0) > 0 &&
          (c.selectable || isSubjectSelected(row.stdMstId, c.subjectId))
      )
      .sort((a, b) => {
        const ea = electiveSubjectIds.has(a.subjectId) ? 1 : 0;
        const eb = electiveSubjectIds.has(b.subjectId) ? 1 : 0;
        return ea !== eb ? ea - eb : orderOf(a.subjectId) - orderOf(b.subjectId);
      });

  const filters = useMemo(() => ({}), []);

  const columns = useMemo(() => {
    const base: Column<AtktStudentRow>[] = [
      { key: "studentId", label: "Student ID", sortable: true },
      { key: "seatNo", label: "Seat No", sortable: true, render: (row) => row.seatNo || "—" },
      { key: "studentName", label: "Student Name", sortable: true, className: "text-left min-w-[200px]" },
      {
        key: "sourceExamName",
        label: "Source attempt",
        sortable: true,
        className: "min-w-[150px]",
        render: (row) => (
          <span title={row.sourceSelectionReason || row.sourceExamName || "No valid source attempt"}>
            {row.sourceExamName || "—"}
          </span>
        ),
      },
    ];

    if (mode === MODE_ATKT) {
      base.push({ key: "backlogCount", label: "Backlogs", sortable: true, render: (row) => row.backlogCount });
    }

    base.push({
      key: "selectAllRow",
      label: "Select all",
      sortable: false,
      render: (row) => (
        <Switch
          label=""
          color="blue"
          checked={isRowFullySelected(row)}
          onChange={(checked) => toggleRow(row, checked)}
        />
      ),
    });

    if (editMode) {
      base.push({
        key: "actions",
        label: "Actions",
        sortable: false,
        render: (row) => (
          <button
            type="button"
            title={row.canDelete ? "Remove from this exam" : row.deleteBlockedReason || "Cannot be removed"}
            disabled={!row.canDelete}
            onClick={() => handleDelete(row)}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={16} />
          </button>
        ),
      });
    }

    (matrix?.columns ?? []).forEach((col) => {
      base.push({
        key: `subject_${col.subjectId}`,
        sortable: false,
        className: "text-center min-w-[132px]",
        label: (
          <div className="leading-tight" title={col.subjectName}>
            <div className="font-semibold text-gray-800 dark:text-white/90">{`${col.subjectCode}`}</div>
            <div className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
              {`${col.requiredToPass}/${col.outOfTotal}`}
            </div>
            {col.heads.length > 0 && (
              <div className="text-[11px] font-normal text-gray-400 dark:text-gray-500">
                {col.heads.map((h) => h.headType).join(", ")}
              </div>
            )}
          </div>
        ),
        render: (row: AtktStudentRow) => {
          const cell = row.cells.find((c) => c.subjectId === col.subjectId);
          if (!cell) return "—";

          const colorClasses = statusClasses[cell.status] || statusClasses.NotAttempted;

          if (cell.selectable) {
            // Head-wise subjects offer a checkbox per head (ESE, IA) so the grid matches the tile
            // view; combined subjects stay a single subject-level checkbox.
            if (isHeadWise(cell)) {
              return (
                <div className={`rounded-md px-1.5 py-1 ${colorClasses}`}>
                  {cell.heads.map((h) => (
                    <div key={h.head} className="flex items-center gap-1.5 py-0.5 text-[11px] leading-tight">
                      <span className="w-8 shrink-0 text-left font-medium">{h.headType}</span>
                      <span
                        className={`flex-1 text-right tabular-nums ${
                          h.isFailing || h.isAbsent ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {h.isAbsent ? "Ab" : `${h.obtained ?? "—"}/${h.outOf}`}
                      </span>
                      <Checkbox
                        checked={isHeadFresh(row.stdMstId, cell, h.head)}
                        disabled={!h.selectable}
                        onChange={(v) => toggleHead(row.stdMstId, cell, h.head, v)}
                      />
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <SelectableCell
                stdMstId={row.stdMstId}
                subjectId={cell.subjectId}
                checked={isSubjectSelected(row.stdMstId, cell.subjectId)}
                colorClasses={colorClasses}
                title={cell.reason || ""}
                onToggle={(std, _sid, checked) => toggleSubject(std, cell, checked)}
              />
            );
          }

          let marker = "—";
          if (cell.status === "Passed" || cell.status === "Failed") {
            marker = `${cell.obtainedTotal}`;
          } else if (cell.status === "Absent") {
            marker = "Ab";
          }

          return (
            <div
              className={`rounded-md py-1.5 text-center text-xs font-medium opacity-70 ${colorClasses}`}
              title={cell.reason || cell.status}
            >
              {marker}
            </div>
          );
        },
      } as any);
    });

    return base;
  }, [matrix, selections, mode, editMode, toggleSubject, toggleHead]);

  // ================= API CALLS =================

  const fetchCourses = async () => {
    try {
      const data: CourseApiResponse[] = await CourseService.getCourse();

      setCourseOptions(
        data.map((c) => ({
          value: c.courseid,
          label: c.coursename,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch courses", error);
    }
  };

  const fetchPatterns = async () => {
    try {
      const data: PatternApiResponse[] = await PatternService.getpattern();

      setPatternOptions(
        data.map((p) => ({
          value: p.patternName,
          label: p.patternName,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch patterns", error);
    }
  };

  const fetchSourceExams = async () => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }

      const data: AtktExamOption[] = await AtktRevalExamService.getSourceExams({
        courseId,
        ayid,
        semester,
        pattern,
        mode,
      });

      setSourceExamOptions(
        data.map((e) => ({
          value: e.examId,
          label: e.examName,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch source exams", error);
    }
  };

  const fetchTargetExams = async (source: string) => {
    try {
      const ayid = localStorage.getItem("AYID");
      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }

      const data: AtktExamOption[] = await AtktRevalExamService.getTargetExams({
        courseId,
        ayid,
        semester,
        mode,
        sourceExamId: mode === MODE_REVALUATION ? source : undefined,
      });

      setTargetExamOptions(
        data.map((e) => ({
          value: e.examId,
          label: e.examName,
        }))
      );

      // Revaluation always lands in the exam derived from the source attempt: when the
      // server offers exactly one, choosing it is not a decision the operator should make.
      if (mode === MODE_REVALUATION && data.length === 1) {
        setTargetExamId(data[0].examId);
        setTargetLocked(true);
      } else {
        setTargetLocked(false);
      }
    } catch (error) {
      console.error("Failed to fetch target exams", error);
    }
  };

  const loadMatrix = async (filter?: AtktMatrixRequest) => {
    const request = filter ?? buildFilter();
    if (!request) return;

    setLoading(true);
    try {
      const data = await AtktRevalExamService.getMatrix(request);
      setMatrix(data);
      setSelections(seedSelections(data));
      setAppliedFilter(request);

      if (!data.success) {
        setAlert({ variant: "error", title: "Error", message: data.message });
      }
    } catch (error) {
      console.error("Failed to fetch matrix", error);
      setAlert({ variant: "error", title: "Error", message: "Failed to load students." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!appliedFilter || !matrix) return;

    const students = matrix.students.map((row) => ({
      stdMstId: row.stdMstId,
      subjectIds: [] as string[],
      subjects: Object.entries(selections[row.stdMstId] ?? {}).map(([subjectId, heads]) => ({
        subjectId,
        heads,
      })),
    }));

    // Rows that lost every tick are sent too, so the server can unassign them -- the legacy
    // screen simply skipped them and left stale registrations behind.
    const removals = matrix.students.filter(
      (row) => row.isAssigned && Object.keys(selections[row.stdMstId] ?? {}).length === 0
    ).length;

    if (removals > 0) {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `${removals} student(s) will be removed from this exam. Continue?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2647dcff",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, continue",
      });

      if (!result.isConfirmed) return;
    }

    setSaving(true);
    try {
      const res = await AtktRevalExamService.save({ filter: appliedFilter, students });

      if (res.success) {
        setAlert({ variant: "success", title: editMode ? "Updated" : "Saved", message: res.message });
        await loadMatrix(appliedFilter);
      } else {
        setAlert({ variant: "error", title: "Error", message: res.message });
      }
    } catch (error) {
      console.error("Failed to save assignment", error);
      setAlert({ variant: "error", title: "Error", message: "Failed to save data." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AtktStudentRow) => {
    if (!appliedFilter) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${row.studentName} will be removed from this exam. Do you want to proceed?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2647dcff",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      const res = await AtktRevalExamService.deleteAssignment({
        filter: appliedFilter,
        stdMstId: row.stdMstId,
      });

      if (res.success) {
        setAlert({ variant: "success", title: "Deleted", message: res.message });
        await loadMatrix(appliedFilter);
      } else {
        setAlert({ variant: "error", title: "Error", message: res.message });
      }
    } catch (error) {
      console.error("Failed to delete assignment", error);
      setAlert({ variant: "error", title: "Error", message: "Failed to delete the assignment." });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (exportType: "All" | "SeatNo") => {
    if (!appliedFilter) return;

    setSaving(true);
    try {
      await AtktRevalExamService.exportExcel({ filter: appliedFilter, exportType });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export the file.";
      setAlert({ variant: "error", title: "Error", message });
    } finally {
      setSaving(false);
    }
  };

  const policy = matrix?.policy;

  return (

    <>
      {alert && (
        <div className="w-full mb-4">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}
      <PageMeta
        title="Staff Dashboard"
        description="Welcome to the Staff Portal"
      />
      <ComponentCard title="Assign ATKT / Revaluation Exam">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-5">

          {/* Mode */}
          <Select
            options={modeOptions}
            placeholder="Select Mode"
            value={mode}
            onChange={(value) => {
              setMode(value);
            }}
          />

          {/* New / Edit */}
          <div className="inline-flex h-11 items-center rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className={`h-full rounded-md px-3 text-sm transition ${
                !editMode ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              New assignment
            </button>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className={`h-full rounded-md px-3 text-sm transition ${
                editMode ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Edit assigned
            </button>
          </div>

          {/* Course */}
          <Select
            options={courseOptions}
            placeholder="Select Course"
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setPattern("");
              setSemester("");
            }}
          />

          {/* Pattern */}
          {courseId && (
            <Select
              options={patternOptions}
              placeholder="Select Pattern"
              value={pattern}
              onChange={(value) => {
                setPattern(value);
                setSemester("");
              }}
            />
          )}

          {/* Semester */}
          {pattern && (
            <Select
              options={semesterOptions}
              placeholder="Select Semester"
              value={semester}
              onChange={(value) => { setSemester(value); }}
            />
          )}

          {/* Source Exam -- revaluation reads an already-conducted attempt */}
          {semester && mode === MODE_REVALUATION && (
            <Select
              options={sourceExamOptions}
              placeholder="Select Source Exam"
              value={sourceExamId}
              onChange={(value) => { setSourceExamId(value); }}
            />
          )}

          {/* Target Exam */}
          {semester && (mode !== MODE_REVALUATION || sourceExamId) && (
            <Select
              options={targetExamOptions}
              placeholder="Select Target Exam"
              value={targetExamId}
              disabled={targetLocked}
              onChange={(value) => {
                setTargetExamId(value);
                resetMatrix();
              }}
            />
          )}

          {/* Load */}
          {targetExamId && (
            <Button variant="primary" onClick={() => loadMatrix()} disabled={loading} className="h-11">
              {loading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Users className="size-4 mr-2" />}
              Load students
            </Button>
          )}

        </div>

        {/* Which ordinance rule set is governing this screen, made visible to the operator */}
        {policy && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {policy.ruleSetName}
              {policy.examType ? ` (${policy.examType})` : ""}
            </span>
            {!policy.isConfigured && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-amber-700 dark:border-amber-700/50 dark:bg-amber-500/10 dark:text-amber-400">
                No rule set configured — using defaults
              </span>
            )}
            <PolicyChip label="Subjects" value={describeScopes(policy.subjectScopes)} />
            <PolicyChip
              label="Heads"
              value={policy.headTypes.length > 0 ? policy.headTypes.join(", ") : "all heads re-attempted"}
            />
            {policy.maxSubjectsPerStudent != null && (
              <PolicyChip label="Max subjects" value={String(policy.maxSubjectsPerStudent)} />
            )}
            {policy.rules.length > 0 && <PolicyChip label="Rules" value={policy.rules.join(", ")} />}
          </div>
        )}

        {matrix && matrix.students.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {matrix.message || "No students found for the selected filters."}
          </div>
        )}

        {matrix && matrix.students.length > 0 && (
          <>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary" onClick={handleSave} disabled={saving} className="min-w-48 h-11">
                <Save className="size-4 mr-2" />
                {editMode ? "Update" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => handleExport("All")} disabled={saving} className="min-w-48 h-11">
                <Download className="size-4 mr-2" />
                Export ALL
              </Button>
              <Button variant="outline" onClick={() => handleExport("SeatNo")} disabled={saving} className="min-w-48 h-11">
                <FileSpreadsheet className="size-4 mr-2" />
                Export Seat No
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("tiles")}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${viewMode === "tiles" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}
                >
                  Tiles
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${viewMode === "grid" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}
                >
                  Grid
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggleAllStudents(!allStudentsSelected)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                  allStudentsSelected
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <Users className="size-4" />
                {allStudentsSelected ? "Clear all" : "Select all"}
              </button>
            </div>

            {viewMode === "grid" ? (
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-theme-md border border-gray-200 dark:border-gray-800 p-4">
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
                  <DataTable
                    data={matrix.students}
                    columns={columns}
                    searchKeys={["studentId", "studentName", "seatNo"]}
                    pageSizeOptions={[20, 50, 100]}
                    stickyHeader
                  />
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="min-w-max">
                  <div className="flex border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                    <div className="sticky left-0 z-10 w-[210px] flex-shrink-0 bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                      Student
                    </div>
                    <div className="px-3 py-2 text-[11px] text-gray-400">Backlog subjects · electives last · scroll →</div>
                  </div>

                  {matrix.students.map((row) => {
                    const tileCells = tilesFor(row);
                    return (
                      <div
                        key={row.stdMstId}
                        className="flex items-center border-b border-gray-100 last:border-0 dark:border-gray-800"
                      >
                        <div className="sticky left-0 z-10 flex w-[210px] flex-shrink-0 items-center gap-2 bg-white px-3 py-2 dark:bg-gray-900">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium text-gray-800 dark:text-white/90">
                              {row.studentName}
                            </div>
                            <div className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                              {row.seatNo || row.studentId}
                              {mode === MODE_ATKT ? ` · ${row.backlogCount}` : ""}
                            </div>
                          </div>
                          <Switch
                            label=""
                            color="blue"
                            checked={isRowFullySelected(row)}
                            onChange={(checked) => toggleRow(row, checked)}
                          />
                          {editMode && (
                            <button
                              type="button"
                              title={row.canDelete ? "Remove from this exam" : row.deleteBlockedReason || "Cannot be removed"}
                              disabled={!row.canDelete}
                              onClick={() => handleDelete(row)}
                              className="inline-flex items-center justify-center rounded-md bg-red-600 p-1.5 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {tileCells.length === 0 ? (
                          <div className="px-3 py-2 text-[11px] text-gray-400">Nothing to assign.</div>
                        ) : (
                          <div className="flex gap-2 px-2 py-2">
                            {tileCells.map((cell) => (
                              <SubjectTile
                                key={cell.subjectId}
                                stdMstId={row.stdMstId}
                                cell={cell}
                                column={matrix.columns.find((c) => c.subjectId === cell.subjectId)}
                                headWise={isHeadWise(cell)}
                                isElective={electiveSubjectIds.has(cell.subjectId)}
                                subjectChecked={isSubjectSelected(row.stdMstId, cell.subjectId)}
                                isHeadFresh={(headKey) => isHeadFresh(row.stdMstId, cell, headKey)}
                                onToggleSubject={(checked) => toggleSubject(row.stdMstId, cell, checked)}
                                onToggleHead={(headKey, checked) => toggleHead(row.stdMstId, cell, headKey, checked)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </ComponentCard>
    </>
  );
}
