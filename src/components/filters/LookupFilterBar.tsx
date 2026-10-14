/**
 * LookupFilterBar - the Course -> Pattern -> Semester -> Exam -> Subject chain of drop-downs that most staff
 * screens repeat, on top of the shared lookup hooks (src/data). Not used by any screen yet.
 *
 * Usage:
 *   const [filter, setFilter] = useState<LookupFilterValue>(EMPTY_LOOKUP_FILTER); // both from ./lookupFilter
 *
 *   <LookupFilterBar
 *     fields={["course", "pattern", "semester", "exam"]}   // which drop-downs to show, always in chain order
 *     examPurpose="regular"                                // required when "exam" is in fields
 *     value={filter}
 *     onChange={setFilter}
 *   />
 *   // then read filter.courseId, filter.pattern (pattern NAME), filter.semester ("Sem-3"),
 *   //      filter.examId, filter.subjectId
 *
 * Behaviour
 *  - Controlled: it never keeps its own copy of the values.
 *  - Changing a field clears every field after it in the chain (course -> pattern, semester, exam, subject ...),
 *    and onChange gets the whole new value object in one call, so there is no half-reset state.
 *  - Default "progressive" mode shows a drop-down only once the ones before it are chosen (what the screens do
 *    today). Pass progressive={false} to show them all, disabled until the previous one is chosen.
 *  - Exams come from useExams (current academic year from useAcademicYear, so changing the year in the header
 *    reloads them); subjects from useSubjects. Everything else comes from the single cached bootstrap.
 *  - The pattern value is the pattern NAME (SubjectMaster.Pattern), because that is what the API filters on.
 *  - Extra controls (buttons, date pickers) belong next to the bar, not inside it.
 */
import Select from "../form/Select";
import { useCourses, usePatterns, useSemesters } from "../../data/useBootstrap";
import { useExams } from "../../data/useExams";
import { useSubjects } from "../../data/useSubjects";
import {
  toCourseOptions,
  toExamOptions,
  toPatternOptions,
  toSemesterOptions,
  toSubjectOptions,
} from "../../data/options";
import type { ExamPurpose } from "../../data/lookupApi";
import type { LookupFilterField, LookupFilterValue } from "./lookupFilter";

export type { LookupFilterField, LookupFilterValue } from "./lookupFilter";

interface LookupFilterBarProps {
  fields: LookupFilterField[];
  /** Which exams to list. Required when fields includes "exam". */
  examPurpose?: ExamPurpose;
  value: LookupFilterValue;
  onChange: (next: LookupFilterValue) => void;
  progressive?: boolean;
  disabled?: boolean;
  /** Wrapper classes; defaults to the responsive grid the screens use. */
  className?: string;
}

// Chain order, and for each field which value key it owns.
const CHAIN: { field: LookupFilterField; key: keyof LookupFilterValue }[] = [
  { field: "course", key: "courseId" },
  { field: "pattern", key: "pattern" },
  { field: "semester", key: "semester" },
  { field: "exam", key: "examId" },
  { field: "subject", key: "subjectId" },
];

const DEFAULT_GRID = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

const LookupFilterBar: React.FC<LookupFilterBarProps> = ({
  fields,
  examPurpose,
  value,
  onChange,
  progressive = true,
  disabled = false,
  className = DEFAULT_GRID,
}) => {
  const showExam = fields.includes("exam");
  const showSubject = fields.includes("subject");

  const courses = useCourses();
  const patterns = usePatterns();
  const semesters = useSemesters();
  // These only fetch when their field is shown and its inputs are set (the hooks are disabled otherwise).
  const exams = useExams({
    courseId: showExam ? value.courseId : undefined,
    purpose: examPurpose ?? "regular",
    semester: value.semester,
  });
  const subjects = useSubjects({
    courseId: showSubject ? value.courseId : undefined,
    pattern: value.pattern,
    semester: value.semester,
  });

  const optionsFor: Record<LookupFilterField, { options: { value: string; label: string }[]; placeholder: string }> = {
    course: { options: toCourseOptions(courses.data), placeholder: courses.isLoading ? "Loading..." : "Select Course" },
    pattern: { options: toPatternOptions(patterns.data), placeholder: patterns.isLoading ? "Loading..." : "Select Pattern" },
    semester: { options: toSemesterOptions(semesters.data), placeholder: semesters.isLoading ? "Loading..." : "Select Semester" },
    exam: { options: toExamOptions(exams.data), placeholder: exams.isFetching ? "Loading..." : "Select Exam" },
    subject: { options: toSubjectOptions(subjects.data), placeholder: subjects.isFetching ? "Loading..." : "Select Subject" },
  };

  const handleChange = (index: number, newVal: string) => {
    const next = { ...value };
    next[CHAIN[index].key] = newVal;
    // Clear everything downstream in the chain.
    for (let i = index + 1; i < CHAIN.length; i++) next[CHAIN[i].key] = "";
    onChange(next);
  };

  // A field is "open" when every shown field before it has a value.
  const shown = CHAIN.map((c, index) => ({ ...c, index })).filter((c) => fields.includes(c.field));

  return (
    <div className={className}>
      {shown.map((c, i) => {
        const open = shown.slice(0, i).every((p) => !!value[p.key]);
        if (progressive && !open) return null;
        const { options, placeholder } = optionsFor[c.field];
        return (
          <Select
            key={c.field}
            options={options}
            placeholder={placeholder}
            value={value[c.key]}
            disabled={disabled || !open}
            onChange={(v) => handleChange(c.index, v)}
          />
        );
      })}
    </div>
  );
};

export default LookupFilterBar;
