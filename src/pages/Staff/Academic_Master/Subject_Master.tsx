import PageMeta from "../../../components/common/PageMeta";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Select from "../../../components/form/Select";
import { Plus, Trash2, Pencil, Save, CheckCircle, Eye, Copy, ListOrdered, ChevronUp, ChevronDown } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import Checkbox from "../../../components/form/input/Checkbox";
import { Table, TableBody, TableRow, TableCell, } from "../../../components/ui/table";
import Swal from "sweetalert2";
import { Modal } from "../../../components/ui/modal";
import Switch from "../../../components/form/switch/Switch";
import { Subject, SubjectService, SaveCreditsPayload, GetCredits, PreviousCredits, DeleteCredits, DeleteSubject, PassingStrategy } from "../../../services/SubjectService";
import {
  useCourses, usePatterns, useSemesters, useSubjects, useAcademicYear, useAcademicYears,
  toCourseOptions, toPatternOptions, toSemesterOptions, invalidateSubjects,
} from "../../../data";
import Alert from "../../../components/ui/alert/Alert";
import Input from "../../../components/form/input/InputField";
import ComponentCard from "../../../components/common/ComponentCard";

type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}



interface Option {
  value: string;
  label: string;
}

type ExamTypeKey = "ESE" | "PR" | "OR";
type InternalTypeKey = "IA" | "TW";

interface CreditFormState {
  creditId?: string;
  creditNo?: string;
  examType: Record<ExamTypeKey, boolean>;
  internalType: Record<InternalTypeKey, boolean>;

  examOutOf: string;
  examPassing: string;

  internalOutOf: string;
  internalPassing: string;

  passingPercentage: string;
  passingStrategy: PassingStrategy;
}

export default function SubjectMaster() {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [loading, setLoading] = useState(false);


  const [isPreviousYear, setIsPreviousYear] = useState(false);
  const { ayid } = useAcademicYear();
  const { data: academicYears } = useAcademicYears();
  const [PreviousYearOptions, setPreviousYearOptions] = useState<Option[]>([]);
  const [PreviousYear, setPreviousYear] = useState("");
  const [PreviousCreditExist, setPreviousCreditExist] = useState(false);
  // 🔹 Course
  const { data: courses } = useCourses();
  const courseOptions = useMemo(() => toCourseOptions(courses), [courses]);
  const [courseId, setCourseId] = useState("");

  // 🔹 Pattern
  const { data: patterns } = usePatterns();
  // value = pattern NAME (what SubjectMaster.Pattern stores)
  const patternOptions = useMemo(() => toPatternOptions(patterns, "name"), [patterns]);
  const [pattern, setPattern] = useState("");

  // 🔹 Semester (shared list; value "Sem-N")
  const { data: semesters } = useSemesters();
  const semesterOptions = useMemo(() => toSemesterOptions(semesters), [semesters]);
  const [semester, setSemester] = useState("");

  // 🔹 Subject
  const { data: subjectList } = useSubjects({ courseId, pattern, semester });
  // Label is the subject name only (as before); toSubjectOptions would prefix the code.
  const subjectOptions = useMemo<Option[]>(
    () => (subjectList ?? []).map((s) => ({ value: s.subjectId, label: s.name })),
    [subjectList]
  );
  const [subject, setSubject] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  // Credits count
  const [credits, setCredits] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditCreditModalOpen, setIsEditCreditModalOpen] = useState(false);

  // Exam Type Checkbox
  type ExamTypeKey = "ESE" | "PR" | "OR";
  type InternalTypeKey = "IA" | "TW";

  const examLabels = ["ESE", "PR", "OR"] as const;
  const internalLabels = ["IA", "TW"] as const;

  const [creditData, setCreditData] = useState<CreditFormState[]>([]);


  const [IsCreditDefined, setIsCreditDefined] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [IsViewMode, setIsViewMode] = useState(false);


  const [password, setpassword] = useState("");

  // ---- Set subject order (pop-up) ----
  interface OrderRow { subjectId: string; code: string; name: string; order: string }
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderRows, setOrderRows] = useState<OrderRow[]>([]);
  const orderListRef = useRef<HTMLDivElement>(null);
  // Which row/control to refocus (and scroll to) after a move re-orders the list.
  const orderFocusRef = useRef<{ id: string; ctl: "input" | "up" | "down" } | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);

  const [creditInput, setCreditInput] = useState<string>("1");

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);


  useEffect(() => {
    // ❌ Edit ya View mode me auto-generate mat karo
    if (isEditMode || IsViewMode) return;

    if (credits < 1) {
      setCreditData([]);
      return;
    }

    setCreditData((prev) => {
      const updated = [...prev];

      // ➕ Add missing credits
      while (updated.length < credits) {
        updated.push({
          creditId: undefined,
          examType: { ESE: false, PR: false, OR: false },
          internalType: { IA: false, TW: false },

          examOutOf: "",
          examPassing: "",

          internalOutOf: "",
          internalPassing: "",

          passingPercentage: "",
          passingStrategy: "HeadWise",
        });
      }

      // ➖ Remove extra credits
      return updated.slice(0, credits);
    });
  }, [credits, isEditMode, IsViewMode]);


  // 🔹 Reset dependent selections when the course is cleared
  useEffect(() => {
    if (!courseId) {
      setPattern("");
      setSemester("");
      setSubject("");
    }
  }, [courseId]);

  // 🔹 Clear the subject when the semester (or its parents) is cleared
  useEffect(() => {
    if (!(courseId && pattern && semester)) {
      setSubject("");
    }
  }, [semester]);

  // ================= API CALLS =================

  const handleSave = async () => {
    if (!subjectName || !subjectCode) {
      setAlert({
        variant: "warning",
        title: "Validation Error",
        message: "Please fill all fields",
      });
      return;
    }

    try {
      setLoading(true);

      const payload: Subject = {
        subjectName,
        subjectCode,
        semId: semester,
        semName: semester,
        pattern,
        courseID: courseId,
      };

      const res = await SubjectService.saveSubject(payload);

      if (res.success) {
        Swal.fire({
          title: "Saved!",
          text: res.message,
          icon: "success",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });

        setIsModalOpen(false);
        invalidateSubjects();
      }
      else {
        await Swal.fire("Failed!", res.message, "error");
      }
      // reset
      setSubjectName("");
      setSubjectCode("");
      setIsModalOpen(false);
      resetCreditFlow();
      setCredits(1);
      setCreditInput(String(1));
      setSubject("");
    } catch {
      Swal.fire({
        title: "Failed!",
        text: "Something went wrong !!",
        icon: "error",
        showConfirmButton: false, // ❌ OK button removed
        timer: 1000,
      });

    } finally {
      setLoading(false);
    }
  };


  const handleSaveCredits = async () => {
    try {
      if (!ayid) {
        return setAlert({
          variant: "error",
          title: "Error",
          message: "Academic Year is Null",
        });
      }

      // ❌ STOP if validation fails
      const isValid = creditvalidation();
      if (!isValid) return;




      // 1️⃣ Payload banana
      const payload: SaveCreditsPayload = {
        subjectId: subject,
        ayid: ayid,
        credits: creditData.map((item) => ({
          creditId: item.creditId,
          // creditNo: String(index + 1),
          creditNo: String(item.creditNo),
          // ✔ Checkbox → array
          examType: (Object.keys(item.examType) as ExamTypeKey[])
            .filter((key) => item.examType[key]),

          internalType: (Object.keys(item.internalType) as InternalTypeKey[])
            .filter((key) => item.internalType[key]),

          // ✔ Marks
          examOutOf: item.examOutOf,
          examPassing: item.examPassing,

          internalOutOf: item.internalOutOf,
          internalPassing: item.internalPassing,

          passingPercentage: item.passingPercentage,
          passingStrategy: item.passingStrategy,
        })),
      };

      // 2️⃣ Debug (optional but recommended)

      // 3️⃣ API call
      const res = await SubjectService.saveCredits(payload);

      // 4️⃣ Response handle
      if (res.success) {
        Swal.fire({
          title: "Saved!",
          text: res.message,
          icon: "success",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });

      } else {
        return setAlert({
          variant: "error",
          title: "Error",
          message: res.message,
        });
      }
      await CheckCredits(subject);
      setIsEditMode(false);
      setCredits(0);
      setCreditData([]);
    } catch {
      Swal.fire({
        title: "Failed!",
        text: "Something went wrong while saving credits",
        icon: "error",
        showConfirmButton: false, // ❌ OK button removed
        timer: 1000,
      });
    }
  };


  const handleUpdateCredits = async () => {
    try {
      if (!ayid) {
        return setAlert({
          variant: "error",
          title: "Error",
          message: "Academic Year is Null",
        });
      }
      // ❌ STOP if validation fails
      const isValid = creditvalidation();
      if (!isValid) return;
      // 1️⃣ Payload banana
      const payload: SaveCreditsPayload = {
        subjectId: subject,
        ayid: ayid,
        credits: creditData.map((item) => ({
          creditId: item.creditId,
          creditNo: String(item.creditNo),

          // ✔ Checkbox → array
          examType: (Object.keys(item.examType) as ExamTypeKey[])
            .filter((key) => item.examType[key]),

          internalType: (Object.keys(item.internalType) as InternalTypeKey[])
            .filter((key) => item.internalType[key]),

          // ✔ Marks
          examOutOf: item.examOutOf,
          examPassing: item.examPassing,

          internalOutOf: item.internalOutOf,
          internalPassing: item.internalPassing,

          passingPercentage: item.passingPercentage,
          passingStrategy: item.passingStrategy,
        })),
      };

      // 2️⃣ Debug (optional but recommended)

      // 3️⃣ API call
      const res = await SubjectService.UpdateCredits(payload);

      // 4️⃣ Response handle
      if (res.success) {
        await Swal.fire({
          title: "Updated!",
          text: res.message,
          icon: "success",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });

      } else {
        Swal.fire({
          title: "Failed!",
          text: res.message,
          icon: "error",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });
      }
      setIsEditMode(false);
      setIsViewMode(false);
      setCredits(0);
      setCreditData([]);
    } catch {
      return Swal.fire({
        title: "Error!",
        text: "Something went wrong while saving credits",
        icon: "error",
        showConfirmButton: false, // ❌ OK button removed
        timer: 1000,
      });
    }
  };
  const creditvalidation = () => {
    if (creditInput == "") {
      setAlert({
        variant: "error",
        title: "Validation Error",
        message: `Enter Number Of Credits`,
      });
      return false;
    }
    for (let i = 0; i < creditData.length; i++) {
      const c = creditData[i];

      const isExamSelected = Object.values(c.examType || {}).some(Boolean);
      const isInternalSelected = Object.values(c.internalType || {}).some(Boolean);

      if (c.creditNo === "" || c.creditNo == null) {
        setAlert({
          variant: "error",
          title: "Validation Error",
          message: `Credits should not be blank for Credit ${i + 1}`,
        });
        return false;
      }

      if (
        isExamSelected &&
        (c.examOutOf === "" || c.examPassing === "")
      ) {
        setAlert({
          variant: "error",
          title: "Validation Error",
          message: `Exam Out Of & Passing marks required for Credit ${i + 1}`,
        });
        return false;
      }

      if (
        isInternalSelected &&
        (c.internalOutOf === "" || c.internalPassing === "")
      ) {
        setAlert({
          variant: "error",
          title: "Validation Error",
          message: `Internal Out Of & Passing marks required for Credit ${i + 1}`,
        });
        return false;
      }

      // Only a combined subject needs a subject-level threshold; head-wise uses each head's own.
      if (c.passingStrategy === "Combined" && (c.passingPercentage === "" || c.passingPercentage == null)) {
        setAlert({
          variant: "error",
          title: "Validation Error",
          message: `Combined Passing % should not be blank for Credit ${i + 1}`,
        });
        return false;
      }
    }

    return true; // ✅ ALL GOOD
  };

  const DeleteCredits = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to delete the selected Subject Credits?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2647dcff",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it",
      });

      // ❌ Cancel clicked
      if (!result.isConfirmed) return;


      if (!ayid) {
        return setAlert({
          variant: "error",
          title: "Error",
          message: "Academic Year is Null",
        });
      }
      // 1️⃣ Payload banana
      const payload: DeleteCredits = {
        subjectId: subject,
        ayid: ayid,
        credits: creditData.map((item) => ({
          creditId: item.creditId,
        })),
      };
      // 3️⃣ API call
      const res = await SubjectService.DeleteCredits(payload);

      // 4️⃣ Response handle
      if (res.success) {
        await Swal.fire({
          title: "Deleted!",
          text: res.message,
          icon: "success",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });

      } else {
        Swal.fire({
          title: "Failed!",
          text: res.message,
          icon: "error",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });
      }
      resetCreditFlow();
      setCredits(1);
      setCreditInput(String(1));
    }
    catch {
      Swal.fire({
        title: "Error!",
        text: "Something went wrong !!",
        icon: "error",
        showConfirmButton: false, // ❌ OK button removed
        timer: 1000,
      });
    }
  }


  const DeleteSubject = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: IsCreditDefined ? "Deleting this subject will also permanently delete all related credits. Do you want to continue?" : "Do you want to delete the selected subject?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2647dcff",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it",
      });

      // ❌ Cancel clicked
      if (!result.isConfirmed) return;

      if (!ayid) {
        return Swal.fire("Error", "Academic Year is missing", "error");
      }

      // 🔹 Delete payload
      const payload: DeleteSubject = {
        subjectId: subject,
      };

      // 🔥 API CALL (CONFIRM ke baad)
      const res = await SubjectService.DeleteSubject(payload);

      if (res.success) {
        await Swal.fire({
          title: "Deleted!",
          text: res.message,
          icon: "success",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,              // ⏱️ 2 sec me auto close
          timerProgressBar: true,
        });

        invalidateSubjects();
        setSubject("");
      } else {
        Swal.fire({
          title: "Failed!",
          text: "Credits delete failed",
          icon: "error",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });
      }
      resetCreditFlow();
    } catch {
      Swal.fire({
        title: "Error!",
        text: "Something went wrong !!",
        icon: "error",
        showConfirmButton: false, // ❌ OK button removed
        timer: 1000,
      });
    }
  };

  const PreviousYearToggle = async (checked: boolean) => {
    setIsPreviousYear(checked);
    setCourseId("");
    setPattern("");
    setSemester("");
    setSubject("");
    setCredits(0);
    setCreditData([]);
    if (!checked) {
      // 🔁 Toggle OFF → clear previous year
      setPreviousYearOptions([]);
      setPreviousYear("");
      return;
    }

    // 🔹 Toggle ON
    const years = academicYears ?? [];

    const currentYear = years.find(y => y.ayid === ayid);


    const previousYearsFiltered = years
      .filter(y => {
        if (!currentYear) return false;

        const currentStartYear = Number(currentYear.shortDuration.split("-")[0]);
        const yearStart = Number(y.shortDuration.split("-")[0]);

        return yearStart < currentStartYear;
      })
      .sort((a, b) => {
        const aYear = Number(a.shortDuration.split("-")[0]);
        const bYear = Number(b.shortDuration.split("-")[0]);
        return bYear - aYear; // 🔽 DESC
      });

    const options: Option[] = previousYearsFiltered.map(y => ({
      value: y.ayid,
      label: y.shortDuration,
    }));

    setPreviousYearOptions(options);

  };

  const handleCopyPreviousCredits = async () => {
    if (!subject || !PreviousYear) {
      setAlert({
        variant: "error",
        title: "Error",
        message: "Subject & Previous Year required",
      });
      return;
    }

    if (!ayid) {
      return setAlert({
        variant: "error",
        title: "Error",
        message: "Current AY not found",
      });
      return;
    }

    const payload = {
      subjectId: subject,
      preAyid: PreviousYear,
      ayid: ayid
    };

    const res = await SubjectService.copyPreviousCredits(payload);

    if (res.success) {
      if (res.success) {
        setPreviousCreditExist(false);
        await Swal.fire({
          title: "Copied!",
          text: res.message,
          icon: "success",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });

      } else {
        Swal.fire({
          title: "Failed!",
          text: res.message,
          icon: "error",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });
      }
      // reload credits if needed
    } else {

      Swal.fire({
        title: "Warning!",
        text: res.message,
        icon: "warning",
        showConfirmButton: false, // ❌ OK button removed
        timer: 1000,
      });
    }
  };
  const CheckCredits = async (subjectId: string) => {
    if (!ayid) return;

    const payload: GetCredits = {
      subjectId,
      ayid,
    };

    const res = await SubjectService.CheckCredits(payload);

    if (res.success) {
      setIsCreditDefined(true);
      setCreditInput(String(creditData.length || 1));
    }
    else {
      setIsCreditDefined(false);
      setCredits(1);
      setCreditInput(String(1));
    }
  };
  
  const loadCredits = async (subjectId: string, mode: "view" | "edit") => {
    if (!ayid) return;

    const payload: GetCredits = {
      subjectId,
      ayid,
    };

    const res = await SubjectService.getCreditsBySubject(payload);

    if (res && res.length > 0) {
      // ✅ Edit mode
      setIsCreditDefined(true);
      if (mode === "view") {
        setIsViewMode(true);
        setIsEditMode(false);
      } else {
        setIsViewMode(false);
        setIsEditMode(true);
      }
      setCredits(res.length);
      setCreditInput(String(res.length));
      setCreditData(
        res.map((c: any) => ({
          creditId: c.creditId,
          creditNo: c.creditNo,
          examType: {
            ESE: c.examType.includes("ESE"),
            PR: c.examType.includes("PR"),
            OR: c.examType.includes("OR"),
          },
          internalType: {
            IA: c.internalType.includes("IA"),
            TW: c.internalType.includes("TW"),
          },
          examOutOf: c.examOutOf ?? "",
          examPassing: c.examPassing ?? "",
          internalOutOf: c.internalOutOf ?? "",
          internalPassing: c.internalPassing ?? "",
          passingPercentage: c.passingPercentage ?? "",
          passingStrategy: c.passingStrategy ?? "HeadWise",
        }))
      );
    }
  };
  const loadPreviousCredits = async (subjectId: string) => {
    if (!ayid) return;

    const payload: PreviousCredits = {
      subjectId,
      preAyid: PreviousYear,
      ayid
    };

    const res = await SubjectService.getPreviousCredits(payload);
    if (res?.success === true) {
      setPreviousCreditExist(true);
    }
    else {
      setPreviousCreditExist(false);
      return setAlert({
        variant: "warning",
        title: "warning",
        message: res.message,
      });
    }
  };
  const verifyCreditAccess = async () => {
    try {
      const res = await SubjectService.verifyCreditAccess({
        password,
      });

      if (res.success) {
        setIsEditCreditModalOpen(false);
        await loadCredits(subject, "edit");
      } else {
        Swal.fire({
          title: "Failed!",
          text: res.message,
          icon: "error",
          showConfirmButton: false, // ❌ OK button removed
          timer: 1000,
        });
      }
    } catch {
      Swal.fire({
        title: "Failed!",
        text: "Something went wrong",
        icon: "error",
        showConfirmButton: false, // ❌ OK button removed
        timer: 1000,
      });
    }
  };
  const openOrderModal = () => {
    // The lookup already comes back in subject order. Numbers are always rewritten 1..n in that
    // order, so duplicate or missing stored values are cleaned up as soon as the pop-up opens.
    setOrderRows(
      (subjectList ?? []).map((s, i) => ({
        subjectId: s.subjectId,
        code: s.code,
        name: s.name,
        order: String(i + 1),
      }))
    );
    setIsOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    if (orderSaving) return;
    setIsOrderModalOpen(false);
  };

  // Move the row at `from` to position `to` (1-based, clamped) and renumber every row 1..n.
  const moveOrderRow = (from: number, to: number, ctl: "input" | "up" | "down" = "input") => {
    const target = Math.min(Math.max(to, 1), orderRows.length) - 1;
    const next = [...orderRows];
    const [row] = next.splice(from, 1);
    next.splice(target, 0, row);
    if (target !== from) orderFocusRef.current = { id: row.subjectId, ctl };
    setOrderRows(next.map((r, i) => ({ ...r, order: String(i + 1) })));
  };

  // Commit a typed position; empty or invalid text reverts to the row's current number.
  const commitOrderInput = (index: number, refocus = false) => {
    const n = parseInt(orderRows[index]?.order ?? "", 10);
    if (!Number.isInteger(n) || n < 1) {
      setOrderRows((prev) => prev.map((r, i) => (i === index ? { ...r, order: String(i + 1) } : r)));
      return;
    }
    if (refocus) orderFocusRef.current = { id: orderRows[index].subjectId, ctl: "input" };
    moveOrderRow(index, n, "input");
  };

  // After a move, keep the moved row in view and keep focus on the control that was used.
  useLayoutEffect(() => {
    const f = orderFocusRef.current;
    if (!f) return;
    orderFocusRef.current = null;
    const root = orderListRef.current;
    if (!root) return;
    const el =
      root.querySelector<HTMLElement>(`[data-row="${f.id}"] [data-ctl="${f.ctl}"]:not(:disabled)`) ??
      root.querySelector<HTMLElement>(`[data-row="${f.id}"] [data-ctl="input"]`);
    el?.focus();
    if (el instanceof HTMLInputElement) el.select();
    el?.closest("tr")?.scrollIntoView({ block: "nearest" });
  }, [orderRows]);

  const handleSaveOrder = async () => {
    if (orderSaving) return;
    // Rows are always unique and gapless, so the position in the list is the order.
    const subjects = orderRows.map((r, i) => ({ subjectId: r.subjectId, sortOrder: i + 1 }));

    try {
      setOrderSaving(true);
      const res = await SubjectService.setSubjectOrder({ subjects });
      if (res.success) {
        setIsOrderModalOpen(false);
        invalidateSubjects();
        await Swal.fire({
          title: "Saved!",
          text: res.message,
          icon: "success",
          showConfirmButton: false,
          timer: 1000,
        });
      } else {
        await Swal.fire("Failed!", res.message, "error");
      }
    } catch {
      Swal.fire({
        title: "Failed!",
        text: "Something went wrong !!",
        icon: "error",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setOrderSaving(false);
    }
  };

  const resetCreditFlow = () => {
    setPreviousCreditExist(false);
    setIsCreditDefined(false);
    setIsEditMode(false);
    setIsViewMode(false);
    setCredits(0);
    setCreditData([]);
  }
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

      <PageMeta title="Subject Master" description="Welcome to Subject Master" />
 
<ComponentCard title="Subject Master">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5">
            <Switch
              label="Previous Year"
              color="blue"
              onChange={PreviousYearToggle}
            />
            {isPreviousYear && (
              <Select
                options={PreviousYearOptions}
                placeholder="Select Previous Year"
                value={PreviousYear}
                onChange={(value) => {
                  setPreviousYear(value);
                  setCourseId("");
                  setPattern("");
                  setSemester("");
                  setSubject("");
                  resetCreditFlow();
                }}
              />
            )}
          </div>


          <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-4">




            {(!isPreviousYear || PreviousYear !== "") && (
              <Select
                options={courseOptions}
                placeholder="Select Course"
                value={courseId}
                onChange={(value) => {
                  setCourseId(value);
                  setPattern("");
                  setSemester("");
                  setSubject("");
                  resetCreditFlow();
                }}
              />
            )}



            {/* Pattern */}
            {courseId && (
              <Select
                options={patternOptions}
                placeholder="Select Pattern"
                value={pattern}
                onChange={(value) => {
                  setPattern(value);
                  setSemester("");
                  setSubject("");
                  resetCreditFlow();
                }}
              />
            )}

            {/* Semester */}
            {pattern && (
              <Select
                options={semesterOptions}
                placeholder="Select Semester"
                value={semester}
                onChange={(value) => { setSemester(value); setSubject(""); setCredits(0); setCreditData([]); resetCreditFlow(); }}
              />
            )}
            {semester && (
              <Select
                options={subjectOptions}
                placeholder="Select Subject"
                value={subject}
                onChange={async (value) => {
                  setSubject(value);
                  resetCreditFlow();
                  if (isPreviousYear) {
                    await loadPreviousCredits(value); // 👈 previous
                  } else {
                    await CheckCredits(value); // 👈 current
                  }
                }}
              />
            )}

          </div>

          {/* Actions — one bar under the filters: credit actions on the left, subject actions on the right */}
          {semester && (
            <div className="flex flex-wrap items-center gap-3 pt-5">
              {/* Credit actions for the selected subject */}
              <div className="flex flex-wrap items-center gap-3">
                {/* ✏️ Edit credit (password / view pop-up) */}
                {(IsCreditDefined && !isEditMode && !isPreviousYear && subject) && (
                  <Button
                    size="sm"
                    className="h-11"
                    startIcon={<Pencil size={18} />}
                    onClick={() => setIsEditCreditModalOpen(true)}
                  >
                    Edit Credit
                  </Button>
                )}

                {/* 💾 Save credits (new) / Update credits (edit mode) */}
                {(subject && !isPreviousYear && (!IsCreditDefined || (IsCreditDefined && isEditMode))) && (
                  <Button
                    size="sm"
                    className="h-11"
                    startIcon={<Save size={18} />}
                    onClick={isEditMode ? handleUpdateCredits : handleSaveCredits}
                  >
                    {isEditMode ? "Update Credits" : "Save Credits"}
                  </Button>
                )}

                {/* 🗑 Delete credit (edit mode only) */}
                {(subject && !isPreviousYear && IsCreditDefined && isEditMode) && (
                  <Button
                    size="sm"
                    variant="danger"
                    className="h-11"
                    startIcon={<Trash2 size={18} />}
                    onClick={DeleteCredits}
                  >
                    Delete credit
                  </Button>
                )}

                {/* Copy previous-year credits */}
                {(PreviousCreditExist && subject) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-11"
                    startIcon={<Copy size={18} />}
                    onClick={handleCopyPreviousCredits}
                  >
                    Copy Credit
                  </Button>
                )}
              </div>

              {/* Subject actions */}
              <div className="ml-auto flex flex-wrap items-center gap-3">
                {/* 🔢 Set order */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-11"
                  startIcon={<ListOrdered size={18} />}
                  onClick={openOrderModal}
                  disabled={!(courseId && pattern && semester) || !subjectList || subjectList.length === 0}
                  title={
                    !(courseId && pattern && semester) || !subjectList || subjectList.length === 0
                      ? "Choose course, pattern and semester first"
                      : undefined
                  }
                >
                  Set order
                </Button>

                {/* 🗑 Delete subject */}
                {subject && (
                  <Button
                    size="sm"
                    variant="danger"
                    className="h-11"
                    startIcon={<Trash2 size={18} />}
                    onClick={DeleteSubject}
                  >
                    Delete subject
                  </Button>
                )}

                {/* ➕ Add */}
                <Button
                  size="sm"
                  className="h-11"
                  startIcon={<Plus size={18} />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          <div className="">
            {(subject && !isPreviousYear && (!IsCreditDefined || (IsCreditDefined && isEditMode))) && (

              <div className="pt-5">

                {/* 🔹 Number of Credit */}
                <div className="flex justify-left">
                  <div className="w-full md:w-1/2 xl:w-1/4">
                    <Input
                      type="number"
                      maxLength={2}
                      value={creditInput}
                      disabled={isEditMode}
                      label="Number Of Credits"
                      className="w-full border p-2 rounded"
                      onChange={(e) => {
                        const value = e.target.value;

                        // ✅ Backspace allow, blank dikhe
                        if (value === "") {
                          setCreditInput("");
                          return; // ❌ credits change nahi hoga
                        }

                        // ❌ invalid values
                        if (Number(value) < 1 || value.length > 2) return;

                        // ✅ UI update
                        setCreditInput(value);

                        // ✅ actual credit change ONLY here
                        setCredits(Number(value));
                      }}
                    />

                  </div>
                </div>

              </div>
            )}

          </div>
          {(creditData.length > 0 && subject) && (
            <div className="pt-5 space-y-6">
              {creditData.map((_, index) => {

                const isExamSelected = Object.values(
                  creditData[index]?.examType || {}
                ).some(Boolean);

                const isInternalSelected = Object.values(
                  creditData[index]?.internalType || {}
                ).some(Boolean);
                return (
                  <Table key={index} className="border border-gray-200">
                    <TableBody>

                      {/* ===== Row 1 ===== */}
                      <TableRow className="border-t">
                        <TableCell className="p-3" rowSpan={2}>
                          <Input
                            type="number"
                            disabled={IsViewMode}
                            label={`H${index + 1} Credits`}
                            value={creditData[index]?.creditNo ?? ""}
                            maxLength={2}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (Number(value) < 0) return;
                              if (e.target.value.length > 15) return;
                              setCreditData(prev =>
                                prev.map((item, i) =>
                                  i === index ? { ...item, creditNo: e.target.value } : item
                                )
                              )
                            }
                            }
                            className="border p-2 rounded"
                          />

                          {/* Head-wise: every head must clear its own passing marks.
                              Combined: only the sum must clear the threshold. */}
                          <select
                            disabled={IsViewMode}
                            value={creditData[index]?.passingStrategy ?? "HeadWise"}
                            onChange={(e) => {
                              const passingStrategy = e.target.value as PassingStrategy;
                              setCreditData(prev =>
                                prev.map((item, i) =>
                                  i === index
                                    ? {
                                        ...item,
                                        passingStrategy,
                                        // A head-wise subject has no subject-level threshold.
                                        passingPercentage: passingStrategy === "Combined" ? item.passingPercentage : "",
                                      }
                                    : item
                                )
                              );
                            }}
                            className="mt-2 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                          >
                            <option value="HeadWise">Head-wise</option>
                            <option value="Combined">Combined</option>
                          </select>
                        </TableCell>

                        <TableCell className="p-3">
                          {examLabels.map((label) => (
                            <div key={label} className="p-2">
                              <Checkbox
                                label={label}
                                disabled={IsViewMode}
                                checked={creditData[index]?.examType[label]}
                                onChange={() =>
                                  setCreditData(prev =>
                                    prev.map((item, i) => {
                                      if (i !== index) return item;

                                      const updatedExamType = {
                                        ...item.examType,
                                        [label]: !item.examType[label],
                                      };

                                      const isAnyExamChecked = Object.values(updatedExamType).some(Boolean);
                                      const isAnyInternalChecked = Object.values(item.internalType || {}).some(Boolean);

                                      return {
                                        ...item,
                                        examType: updatedExamType,

                                        // ❗ Agar koi bhi exam unchecked ho gaya → clear values
                                        examOutOf: isAnyExamChecked ? item.examOutOf : "",
                                        examPassing: isAnyExamChecked ? item.examPassing : "",
                                        passingPercentage: isAnyExamChecked || isAnyInternalChecked ? item.passingPercentage : "",
                                      };
                                    })
                                  )
                                }

                              />
                            </div>
                          ))}
                        </TableCell>

                        <TableCell className="p-3">
                          <Input
                            type="number"
                            label="Out of Marks"
                            disabled={(!isExamSelected || IsViewMode)}
                            value={creditData[index]?.examOutOf ?? ""}
                            maxLength={15}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (Number(value) < 0) return;
                              if (e.target.value.length > 15) return;
                              setCreditData(prev =>
                                prev.map((item, i) =>
                                  i === index
                                    ? { ...item, examOutOf: e.target.value }
                                    : item
                                )
                              )
                            }

                            }
                            className="border p-2 rounded"
                          />
                        </TableCell>

                        <TableCell className="p-3">
                          <Input
                            type="number"
                            label="Passing Marks"
                            disabled={(!isExamSelected || IsViewMode)}
                            value={creditData[index]?.examPassing ?? ""}
                            maxLength={15}
                            onChange={(e) => {
                              const passing = Number(e.target.value);
                              if (passing < 0) return;
                              const outOf = Number(creditData[index]?.examOutOf ?? 0);
                              if (e.target.value.length > 15) return;
                              // ❌ Validation
                              if (passing > outOf && outOf > 0) {
                                setAlert({
                                  variant: "warning",
                                  title: "Validation Error",
                                  message: "Passing marks cannot be greater than Out of marks",
                                });
                                return; // 🚫 value update nahi hoga
                              }
                              setCreditData(prev =>
                                prev.map((item, i) =>
                                  i === index
                                    ? { ...item, examPassing: e.target.value }
                                    : item
                                )
                              )
                            }



                            }
                            className="border p-2 rounded"
                          />
                        </TableCell>
                        <TableCell className="p-3" rowSpan={2}>
                          {/* Only a combined subject has a subject-level threshold; a head-wise
                              subject passes on each head's own passing marks. */}
                          {creditData[index]?.passingStrategy === "Combined" ? (
                          <Input
                            type="number"
                            label="Combined Passing %"
                            disabled={
                              !(
                                Object.values(creditData[index]?.examType ?? {}).some(Boolean) ||
                                Object.values(creditData[index]?.internalType ?? {}).some(Boolean)
                              )
                              ||
                              IsViewMode
                            }
                            value={creditData[index]?.passingPercentage ?? ""}
                            maxLength={15}
                            onChange={(e) => {
                              if (e.target.value.length > 15) return;
                              const value = e.target.value;
                              if (Number(value) < 0) return;
                              setCreditData(prev =>
                                prev.map((item, i) =>
                                  i === index ? { ...item, passingPercentage: value } : item
                                )
                              );
                            }}
                            className="border p-2 rounded"
                          />
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Per head
                            </span>
                          )}
                        </TableCell>

                      </TableRow>

                      {/* ===== Row 2 ===== */}
                      <TableRow className="border-t">
                        <TableCell className="p-3">
                          {internalLabels.map((label) => (
                            <div key={label} className="p-2">
                              <Checkbox
                                label={label}
                                disabled={IsViewMode}
                                checked={creditData[index]?.internalType[label]}
                                onChange={() =>
                                  setCreditData(prev =>
                                    prev.map((item, i) => {
                                      if (i !== index) return item;

                                      const updatedInternalType = {
                                        ...item.internalType,
                                        [label]: !item.internalType[label],
                                      };
                                      const isAnyInternalChecked = Object.values(updatedInternalType).some(Boolean);
                                      const isAnyExamChecked = Object.values(item.examType || {}).some(Boolean);

                                      return {
                                        ...item,
                                        internalType: updatedInternalType,
                                        // ❗ internal unchecked → clear internal marks
                                        internalOutOf: isAnyInternalChecked ? item.internalOutOf : "",
                                        internalPassing: isAnyInternalChecked ? item.internalPassing : "",
                                        passingPercentage: isAnyExamChecked || isAnyInternalChecked ? item.passingPercentage : "",
                                      };
                                    })
                                  )
                                }

                              />
                            </div>
                          ))}
                        </TableCell>

                        <TableCell className="p-3">
                          <Input
                            type="number"
                            label="Out of Marks"
                            disabled={(!isInternalSelected || IsViewMode)}
                            value={creditData[index]?.internalOutOf ?? ""}
                            maxLength={15}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (Number(value) < 0) return;
                              if (value.length > 15) return;
                              setCreditData(prev =>
                                prev.map((item, i) =>
                                  i === index
                                    ? { ...item, internalOutOf: e.target.value }
                                    : item
                                )
                              )
                            }

                            }
                            className="border p-2 rounded"
                          />
                        </TableCell>

                        <TableCell className="p-3">
                          <Input
                            type="number"
                            label="Passing Marks"
                            disabled={(!isInternalSelected || IsViewMode)}
                            value={creditData[index]?.internalPassing ?? ""}
                            maxLength={15}
                            onChange={(e) => {

                              const passing = Number(e.target.value);
                              const outOf = Number(creditData[index]?.internalOutOf ?? 0);
                              if (passing < 0) return;
                              if (e.target.value.length > 15) return;
                              // ❌ Validation
                              if (passing > outOf && outOf > 0) {
                                setAlert({
                                  variant: "warning",
                                  title: "Validation Error",
                                  message: "Passing marks cannot be greater than Out of marks",
                                });
                                return; // 🚫 value update nahi hoga
                              }

                              setCreditData(prev =>
                                prev.map((item, i) =>
                                  i === index
                                    ? { ...item, internalPassing: e.target.value }
                                    : item
                                )
                              )
                            }

                            }
                            className="border p-2 rounded"
                          />
                        </TableCell>
                      </TableRow>

                    </TableBody>
                  </Table>
                );
              })}
            </div>

          )}
 
</ComponentCard>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Add Subject</h2>
    <br/>
        {/* Modal Body */}
        <div className="space-y-3">
          <Input
            type="text"
            label="Subject Name"
            value={subjectName}
            maxLength={80}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z0-9-_&()+\s]*$/.test(value)) {
                setSubjectName(value);
              }
            }}
            className="w-full border p-2 rounded"
          />

          <Input
            type="text"
            label="Subject Code"
            value={subjectCode}
            maxLength={15}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z0-9-_\s]*$/.test(value)) {
                setSubjectCode(value);
              }
            }}
            className="w-full border p-2 rounded"
          />
          {alert && (
            <div className="w-full mb-4">
              <Alert
                variant={alert.variant}
                title={alert.title}
                message={alert.message}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => { setIsModalOpen(false); setSubjectCode(""); setSubjectName(""); }}
          >
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </Modal>
      {/* Set subject order */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={closeOrderModal}
        className="max-w-2xl p-4 sm:p-6"
      >
        <h2 className="mb-1 pr-8 text-xl font-semibold text-gray-800 dark:text-white/90">Set subject order</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Type a position or use the arrows; the other subjects move to make room.
        </p>

        <div ref={orderListRef} className="max-h-[60vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-left text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th scope="col" className="w-36 px-3 py-2 font-medium">Order</th>
                <th scope="col" className="px-3 py-2 font-medium">Code</th>
                <th scope="col" className="px-3 py-2 font-medium">Subject name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orderRows.map((r, i) => {
                const label = `${r.code ? r.code + " " : ""}${r.name}`;
                const arrowCls =
                  "flex h-9 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-200";
                return (
                  <tr key={r.subjectId} data-row={r.subjectId}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={3}
                          data-ctl="input"
                          aria-label={`Position of ${label}`}
                          value={r.order}
                          disabled={orderSaving}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "");
                            setOrderRows((prev) => prev.map((x, j) => (j === i ? { ...x, order: v } : x)));
                          }}
                          onBlur={() => commitOrderInput(i)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitOrderInput(i, true);
                            }
                          }}
                          className="h-9 w-14 rounded-lg border border-gray-300 bg-transparent px-2 text-center text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        />
                        <button
                          type="button"
                          data-ctl="up"
                          className={arrowCls}
                          aria-label={`Move ${label} up`}
                          disabled={orderSaving || i === 0}
                          onClick={() => moveOrderRow(i, i, "up")}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          type="button"
                          data-ctl="down"
                          className={arrowCls}
                          aria-label={`Move ${label} down`}
                          disabled={orderSaving || i === orderRows.length - 1}
                          onClick={() => moveOrderRow(i, i + 2, "down")}
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-700 dark:text-gray-300">{r.code}</td>
                    <td className="px-3 py-2 text-gray-800 dark:text-white/90">{r.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={closeOrderModal} disabled={orderSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveOrder} disabled={orderSaving}>
            {orderSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isEditCreditModalOpen}
        onClose={() => { setIsEditCreditModalOpen(false); setpassword(""); }}
        className="max-w-lg p-6"
      >
        <br/>
            <br/>
        <Input  type="text" label="Enter Password" onChange={(e) => setpassword(e.target.value)} />

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            className="px-8 py-2 text-base flex items-center gap-2"
            onClick={async () => {
              verifyCreditAccess();
              setIsEditCreditModalOpen(false);
              setpassword("");
            }}
          >
            <CheckCircle size={18} />
            Confirm
          </Button>

          <Button
            className="px-8 py-2 text-base flex items-center gap-2"
            onClick={async () => {
              await loadCredits(subject, "view");
              setIsEditCreditModalOpen(false);
              setpassword("");
            }}
          >
            <Eye size={18} />
            View
          </Button>
        </div>
      </Modal>

    </>
  );
}
