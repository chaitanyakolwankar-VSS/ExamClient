import PageMeta from "../../../components/common/PageMeta";
import { useEffect, useMemo, useState } from "react";
import Select from "../../../components/form/Select";
import { Plus, Trash2, Pencil, Save, CheckCircle, Eye, Copy } from "lucide-react";
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
    } catch (error) {
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
        credits: creditData.map((item, index) => ({
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
    } catch (error) {
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
        credits: creditData.map((item, index) => ({
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
    } catch (error) {
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
        credits: creditData.map((item, index) => ({
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
    catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      Swal.fire({
        title: "Failed!",
        text: "Something went wrong",
        icon: "error",
        showConfirmButton: false, // ❌ OK button removed
        timer: 1000,
      });
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


          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5">




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


            <div className="grid grid-cols-2 gap-3 w-full">
              {/* ➕ Add */}
              {semester && (
                <button
                  type="button"
                  className="w-full flex items-center justify-center rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={20} /><span>Add</span>
                </button>
              )}

              {/* 🗑 Delete */}
              {subject && (
                <button
                  type="button"
                  className="w-full flex items-center justify-center rounded-md bg-red-600 py-2 text-white hover:bg-red-700"
                  onClick={DeleteSubject}
                >
                  <Trash2 size={18} /><span>Delete</span>
                </button>
              )}
            </div>



            {(PreviousCreditExist && subject) && (
              <button
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                onClick={handleCopyPreviousCredits}
              >
                <Copy size={18} />
                Copy Credit
              </button>
            )}
          </div>
          {(IsCreditDefined && !isEditMode && !isPreviousYear && subject) && (
            <div className="flex justify-center pt-4">
           
              <button
                className="min-w-64 bg-blue-600 text-white px-6 py-2 rounded-lg
             flex items-center justify-center gap-2"
                onClick={() => setIsEditCreditModalOpen(true)}
              >
                <Pencil size={20} />
                <span>Edit Credit</span>
              </button>

            </div>
          )}

          <div className="">
            {(subject && !isPreviousYear && (!IsCreditDefined || (IsCreditDefined && isEditMode))) && (

              <div className="pt-5">

                {/* 🔹 Buttons – CENTER */}
                <div className="flex justify-center gap-4">
                  <button
                    className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"
                    onClick={isEditMode ? handleUpdateCredits : handleSaveCredits}
                  >
                    {isEditMode ? (
                      <>
                        <Save size={18} />
                        <span>Update Credits</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Credits</span>
                      </>
                    )}
                  </button>

                  {isEditMode && (
                    <button
                      className="min-w-64 bg-red-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"
                      onClick={DeleteCredits}
                    >
                      <Trash2 size={18} />
                      <span>Delete Credit</span>
                    </button>
                  )}
                </div>

                {/* 🔹 Number of Credit – NEXT LINE & CENTERED */}
                <div className="flex justify-left mt-4">
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
                const isAnyTypeSelected = isExamSelected || isInternalSelected;
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
              if (/^[a-zA-Z0-9-_\s]*$/.test(value)) {
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
