
import PageMeta from "../../../components/common/PageMeta";
import { useEffect, useState, useMemo } from "react";
import Select from "../../../components/form/Select";
import { CourseService, CourseApiResponse } from "../../../services/Course";
import { academicYearService } from "../../../services/academicYearService";
import { ExamService, Saveexam, Exams, GetExams, UpdateExams, DeleteExams, RevolutionExamApiResponse, GetResolutionExams, GetCreditHeadResolutionreq, SaveResolution } from "../../../services/ExamService";
import { GetSubject, SubjectApiResponse } from "../../../services/GetSubject";
import { PatternService, PatternApiResponse } from "../../../services/Pattern";
import { Plus, Trash2, Edit, X, Pencil, Save, RefreshCcw, CheckCircle, Eye, Copy, Delete } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import Switch from "../../../components/form/switch/Switch";
import Swal from "sweetalert2";
import DataTable from "../../../components/ui/table/DataTable";
import { Table, TableBody, TableRow, TableCell, } from "../../../components/ui/table";
import Input from "../../../components/form/input/InputField";
import Alert from "../../../components/ui/alert/Alert";


type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

type CreditRow = {
    creditsId: string;
    h1SubjectCredit: string;
    h1OutOf: string;
    h1Pass: string;
    h1Type: string;
    h1Res: string;
    h2SubjectCredit?: string | null;
    h2OutOf?: string | null;
    h2Pass?: string | null;
    h2Type?: string | null;
    h2Res?: string | null;
};

const columnConfig = [
    { key: "h1OutOf", label: "H1 Out" },
    { key: "h1Pass", label: "H1 Pass" },
    { key: "h1Type", label: "H1 Type" },
    { key: "h1Res", label: "H1 Res" },
    { key: "h2OutOf", label: "H2 Out" },
    { key: "h2Pass", label: "H2 Pass" },
    { key: "h2Type", label: "H2 Type" },
    { key: "h2Res", label: "H2 Res" }
] as const;
interface Option {
    value: string;
    label: string;
}
interface Column<T = any> {
    key: string;
    label: string;
    className?: string;
    sortable?: boolean;
    group?: boolean;
    render?: (row: T) => React.ReactNode | RenderResult;
}
export type RenderResult = {
    content?: React.ReactNode;
    rowSpan?: number;
    colSpan?: number;
    skip?: boolean;
};

export default function ExamDashboard() {

    //Alert
      const [alert, setAlert] = useState<AlertState | null>(null);

    // 🔹 Course
    const [courseOptions, setCourseOptions] = useState<Option[]>([]);
    const [courseId, setCourseId] = useState("");

    // 🔹 Year
    const [YearOptions, setYearOptions] = useState<Option[]>([]);
    const [YearOption, setYearOption] = useState("");
    const [Year, setYear] = useState("");

    // 🔹 Month
    const [MonthOptions, setMonthOptions] = useState<Option[]>([]);
    const [Month, setMonth] = useState("");

    // 🔹 ExamType
    const [ExamType, setExamType] = useState("");

    // Exam Exist
    const [Examexist, setExamexist] = useState(false);

    // Resulution
    const [Resolution, setResolution] = useState(false);

    // 🔹 RevalType
    const [RevalExam, setRevalExam] = useState(false);

    //     ExamData
    const [examData, setExamData] = useState<Exams[]>([]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [editingRowId, setEditingRowId] = useState<string | null>(null);

    const [editingName, setEditingName] = useState<string>(""); // temp value

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

    // 🔹Resolution Exam
    const [ResoExamOptions, setResoExamOptions] = useState<Option[]>([]);
    const [ResoExam, setResoExam] = useState("");

    const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
    const [subject, setSubject] = useState("");

    //Resolution Update Mode

    const [ResoUpdateMode, setResoUpdateMode] = useState(false);

    const toggleRow = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(examData.map((x) => x.examId));
        } else {
            setSelectedIds([]);
        }
    };
    // 🔹 Load courses on page load

    const filters = useMemo(() => ({}), []);

    const columns = useMemo<Column<Exams>[]>(() => [
        {
            key: "name",
            label: "Exam Name",
            sortable: true,
        },
        {
            key: "examType",
            label: "Exam Type",
            sortable: true,
        },
        {
            key: "isActive",
            label: "Active Status",
            render: (row) => ({
                content: (
                    <Switch
                        key={row.examId + "-" + row.isActive} // 🔥 important
                        label=""
                        color="blue"
                        defaultChecked={!!row.isActive}
                        onChange={(checked) => UpdateExam(row.examId, checked)}
                    />
                ),
            }),
        },
        {
            key: "delete",
            label: "Delete",
            render: (row) => ({
                content: (
                    <button
                        onClick={() => DeleteExam(row.examId)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <Trash2 size={25} />
                    </button>
                ),
            }),
        },
    ], []);

    const [ResolutionData, setResolutionData] = useState<CreditRow[]>([]);

    const editableFields: (keyof CreditRow)[] = [
        "h1Res",
        "h2Res"
    ];

      useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (courseId) {
            GetExams();
        }
        setYear("");
        setYearOption("");
        setMonth("");
        setExamType("");
        setResolution(false);
        setRevalExam(false);
        setPattern("");
        setSemester("");
        setResoExam("");
        setSubject("");
        setResolutionData([]);

    }, [courseId]);

    useEffect(() => {
        setMonth("");
        setExamType("");
        setRevalExam(false);
    }, [YearOption]);

    useEffect(() => {
        setExamType("");
        setRevalExam(false);
    }, [Month]);

    useEffect(() => {
        setRevalExam(false);
        if (ExamType) {
            SearchExam();
        }
    }, [ExamType]);

    useEffect(() => {
        setRevalExam(false);
        if (semester) {
            SearchResolutionExam();
        }
        if (courseId && pattern && semester) {
            fetchSubjects(courseId, pattern, semester);
        }
        setSubjectOptions([]);
        setSubject("");
        setResoExam("");
        setSubject("");
        setResolutionData([]);

    }, [semester]);
    // 🔹 Load subjects when semester changes
    useEffect(() => {
        if (subject) {
            fetchCreditHeadResolution();
        }
        setResolutionData([]);
    }, [subject]);
    // 🔹 Load Year when course changes
    useEffect(() => {
        const loadYears = async () => {
            const ayid = localStorage.getItem("AYID");
            if (!ayid) return;

            const years = await academicYearService.loadPreviousAcademicYears();

            const currentYear = years.find(y => y.ayid === ayid);
            if (!currentYear || !currentYear.shortDuration) return;

            // example: "2025-2026"
            const [start, end] = currentYear.shortDuration
                .replace(/\s/g, "")
                .split("-");

            if (!start || !end) return;

            const options = [
                { value: "1", label: start },
                { value: "2", label: end },
            ];

            setYearOptions(options);
        };

        loadYears();
    }, [courseId]);

    // 🔹 Load Months when Year changes
    useEffect(() => {
        if (YearOption == "2") {
            setMonthOptions([
                { value: "January", label: "January" },
                { value: "February", label: "February" },
                { value: "March", label: "March" },
                { value: "April", label: "April" },
                { value: "May", label: "May" },
                { value: "June", label: "June" },
            ]);
        }
        else {
            setMonthOptions([
                { value: "July", label: "July" },
                { value: "August", label: "August" },
                { value: "September", label: "September" },
                { value: "October", label: "October" },
                { value: "November", label: "November" },
                { value: "December", label: "December" },
            ]);
        }
    }, [Year]);

    const RevolutionToggle = async (checked: boolean) => {
        setRevalExam(checked);
    };

    const handleChange = (
        index: number,
        field: keyof CreditRow,
        value: string
    ) => {
        setResolutionData(prev =>
            prev.map((row, i) =>
                i === index ? { ...row, [field]: value } : row
            )
        );
    };
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
    const fetchPatterns = async (courseId: string) => {
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
    const SaveExam = async () => {
        const ayid = localStorage.getItem("AYID");
        if (!ayid) return;
        const payload: Saveexam = {
            Courseid: courseId,
            Name: Month + " " + Year,
            ExamType: ExamType,
            RevalExam: RevalExam,
            Ayid: ayid,
        };

        const res = await ExamService.SaveExam(payload);
        if (res.success) {
            Swal.fire({
                title: "Saved!",
                text: res.message,
                icon: "success",
                showConfirmButton: false, // ❌ OK button removed
                timer: 1000,
            });
            GetExams();
        }
        else {
            await Swal.fire("Failed!", res.message, "error");
        }
    }
    const SaveResolution = async () => {
        const ayid = localStorage.getItem("AYID");
        if (!ayid) return;
        const payload: SaveResolution = {
            examId: ResoExam,
            ayid: ayid,
            courseId: courseId,
            items: ResolutionData.map(row => ({
                creditsId: row.creditsId,

                h1SubjectCredit: row.h1SubjectCredit,
                h1OutOf: row.h1OutOf,
                h1Pass: row.h1Pass,
                h1Type: row.h1Type,
                h1Res: row.h1Res,

                h2SubjectCredit: row.h2SubjectCredit || null,
                h2Res: row.h2Res || "",
                h2OutOf: row.h2OutOf || "",
                h2Pass: row.h2Pass || "",
                h2Type: row.h2Type || "",
            }))
        };
        console.log(payload);
        const res = await ExamService.SaveResolution(payload);
        if (res.success) {
            Swal.fire({
                title: "Saved!",
                text: res.message,
                icon: "success",
                showConfirmButton: false, // ❌ OK button removed
                timer: 1000,
            });
            GetExams();
            setResolutionData([]);
            setSubject("");
        }
        else {
            await Swal.fire("Failed!", res.message, "error");
        }
    }
    const UpdateResolution = async () => {
        const ayid = localStorage.getItem("AYID");
        if (!ayid) return;
        const payload: SaveResolution = {
            examId: ResoExam,
            ayid: ayid,
            courseId: courseId,
            items: ResolutionData.map(row => ({
                creditsId: row.creditsId,

                h1SubjectCredit: row.h1SubjectCredit,
                h1OutOf: row.h1OutOf,
                h1Pass: row.h1Pass,
                h1Type: row.h1Type,
                h1Res: row.h1Res,

                h2SubjectCredit: row.h2SubjectCredit || null,
                h2Res: row.h2Res || "",
                h2OutOf: row.h2OutOf || "",
                h2Pass: row.h2Pass || "",
                h2Type: row.h2Type || "",
            }))
        };
        console.log(payload);
        const res = await ExamService.UpdateResolution(payload);
        if (res.success) {
            Swal.fire({
                title: "Updated!",
                text: res.message,
                icon: "success",
                showConfirmButton: false, // ❌ OK button removed
                timer: 1000,
            });
            GetExams();
            setResolutionData([]);
            setSubject("");
        }
        else {
            await Swal.fire("Failed!", res.message, "error");
        }
    }
    const SearchExam = async () => {
        const ayid = localStorage.getItem("AYID");
        if (!ayid) return;
        const payload: Saveexam = {
            Courseid: courseId,
            Name: Month + " " + Year,
            ExamType: ExamType,
            RevalExam: RevalExam,
            Ayid: ayid,
        };

        const res = await ExamService.SearchExam(payload);
        if (res.success) {
            setExamexist(true);
        }
        else {
            setExamexist(false);
        }
    }
    const SearchResolutionExam = async () => {
        const ayid = localStorage.getItem("AYID");
        if (!ayid) return;
        const parameter: GetResolutionExams = {
            Courseid: courseId,
            Ayid: ayid,
            Semester: semester,
            Pattern: pattern,
        };

        const data: RevolutionExamApiResponse[] = await ExamService.SearchResolutionExam(parameter);
        console.log("EXAM API RAW RESPONSE 👉", data);
        const mappedData = data.map((e) => ({
            value: e.examId,
            label: e.examname
        }));

        setResoExamOptions(mappedData); // ✅ update state

    }
    const GetExams = async () => {
        try {
            const ayid = localStorage.getItem("AYID");
            if (!ayid) return;
            const payload: GetExams = {
                Courseid: courseId,
                Ayid: ayid,
            };

            const res = await ExamService.GetExam(payload);
            setExamData(res);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        }
    };
    const UpdateExam = async (examId: string, checked: boolean) => {
        setExamData((prev) =>
            prev.map((exam) =>
                exam.examId === examId ? { ...exam, isActive: checked } : exam
            )
        );


        const payload: UpdateExams = {
            ExamId: examId,
            ActiveStatus: checked
        }
        const res = await ExamService.UpdateExam(payload);
        if (res.success) {
            Swal.fire({
                title: "Activated!",
                text: res.message,
                icon: "success",
                showConfirmButton: false, // ❌ OK button removed
                timer: 1000,
            });
        }
        else {
            await Swal.fire("Deactivated!", res.message, "error");
        }
        GetExams();
    };
    const DeleteExam = async (examId: string) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Do you want to delete the selected Exam?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2647dcff",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it",
        });

        // ❌ Cancel clicked
        if (!result.isConfirmed) return;

        const payload: DeleteExams = {
            ExamId: examId
        }
        const res = await ExamService.DeleteExam(payload);
        if (res.success) {
            setExamData(prev => prev.filter(x => x.examId !== examId));
        }
        else {
            await Swal.fire("Failed!", res.message, "error");
        }
    }
    const fetchSubjects = async (
        courseId: string,
        pattern: string,
        semester: string
    ) => {
        try {
            const data: SubjectApiResponse[] = await GetSubject.getSubject({ courseId, pattern, semester });

            setSubjectOptions(
                data.map((s) => ({
                    value: s.subjectId,
                    label: s.subjectName,
                }))
            );
        } catch (error) {
            console.error("Failed to fetch subjects", error);
        }
    };


    const fetchCreditHeadResolution = async () => {
        const ayid = localStorage.getItem("AYID");
        if (!ayid) return;
        const parameter: GetCreditHeadResolutionreq = {
            SubjectId: subject,
            ExamId: ResoExam,
            Ayid: ayid,
        };

        const res = await ExamService.GetCreditHeadResolution(parameter);
        const rows: CreditRow[] = res;

        // check if any row has H1Res
        const hasH1Res = rows.some(r => (r.h1Res && r.h1Res.trim() !== "") || (r.h2Res && r.h2Res.trim() !== ""));

        setResoUpdateMode(hasH1Res);

        setResolutionData(rows);
        if(rows.length==0){
setAlert({
          variant: "error",
          title: "Error",
          message: `Credits Not Found!!`,
        });
        }
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
            <ComponentCard
                title=" Exam Master"
            >
                {examData.length > 0 && (
                    <button
                        className={`min-w-64  text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${Resolution ? "bg-red-600" : "bg-blue-600"
                            }`}
                        onClick={() => { setResolution(!Resolution); fetchPatterns(courseId); setRevalExam(false); setPattern(""); setSemester(""); setResoExam(""); setSubject(""); setResolutionData([]); }}
                    >
                        {Resolution ? <X size={18} /> : <Plus size={18} />}
                        <span>{Resolution ? "Cancel Resolution" : "Add Resolution"}</span>
                    </button>

                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5">
                    <Select
                        options={courseOptions}
                        placeholder="Select Course"
                        value={courseId}
                        onChange={(value) => {
                            setCourseId(value);
                        }}
                    />
                    {(courseId && !Resolution) && (
                        <Select
                            options={YearOptions}
                            placeholder="Select Year"
                            value={YearOption}
                            onChange={(value: string) => {
                                setYearOption(value);
                                const selectedOption = YearOptions.find(
                                    (opt) => opt.value === value
                                );

                                if (selectedOption) {
                                    setYear(selectedOption.label); // ✅ label set
                                }
                            }}
                        />

                    )}
                    {(Year && !Resolution) && (
                        <Select
                            options={MonthOptions}
                            placeholder="Select Month"
                            value={Month}
                            onChange={(value) => {
                                setMonth(value);
                            }}
                        />
                    )}
                    {(Month && !Resolution) && (
                        <Select
                            options={[{ value: "Regular", label: "Regular" },
                            { value: "A.T.K.T", label: "A.T.K.T" },
                            { value: "Re-Exam", label: "Re-Exam" }
                            ]}
                            placeholder="Select Exam Type"
                            value={ExamType}
                            onChange={(value) => {
                                setExamType(value);
                            }}
                        />
                    )}

                    {(ExamType && !Resolution) && (
                        <Switch
                            label="Revolution Exam"
                            disabled={Examexist}
                            color="blue"
                            onChange={RevolutionToggle}
                        />

                    )}


                    {/*    ----------------------------  Resolution -------------------*/}


                    {/* Pattern */}
                    {(courseId && Resolution) && (
                        <Select
                            options={patternOptions}
                            placeholder="Select Pattern"
                            value={pattern}
                            onChange={(value) => {
                                setPattern(value);
                                setSemester("");
                                setResoExam("");
                                setSubject("");
                                setResolutionData([]);
                            }}
                        />
                    )}
                    {/* Semester */}
                    {(pattern && Resolution) && (
                        <Select
                            options={semesterOptions}
                            placeholder="Select Semester"
                            value={semester}
                            onChange={(value) => { setSemester(value); }}
                        />
                    )}
                    {/* Resolution Exam */}
                    {(semester && Resolution) && (
                        <Select
                            options={ResoExamOptions}
                            placeholder="Select Resolution Exam"
                            value={ResoExam}
                            onChange={(value) => {
                                setResoExam(value);
                                setSubject("");
                                setResolutionData([]);
                            }}
                        />
                    )}

                    {/* Subjects */}
                    {(ResoExam && Resolution) && (
                        <Select
                            options={subjectOptions}
                            placeholder="Select Subjects"
                            value={subject}
                            onChange={(value) => { setSubject(value); }}
                        />
                    )}
                </div>
                {(ResolutionData.length > 0 && Resolution) && (
                    <>
                        <div className="flex justify-center gap-4 pt-5">
                            <button
                                className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                onClick={ResoUpdateMode ? UpdateResolution : SaveResolution}
                            >
                                <Save size={18} />
                                <span>{ResoUpdateMode ? "Update Resolution" : "Save Resolution"}</span>
                            </button>
                            <button
                                className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                onClick={()=>{setCourseId("");setExamData([]);}}
                            >
                                <RefreshCcw size={18} />
                                <span>Refresh</span>
                            </button>
                        </div>
                        <Table className="border border-gray-300 mt-4 w-full border-collapse">
                            <TableBody>

                                {/* Header row */}
                                <TableRow className="bg-gray-100 font-semibold text-center">
                                    {columnConfig.map(col => (
                                        <TableCell key={col.key} className="px-4 py-3 border">
                                            {col.label}
                                        </TableCell>
                                    ))}
                                </TableRow>

                                {/* Data rows */}
                                {/* {ResolutionData.map((row, index) => (
      <TableRow key={index} className="hover:bg-gray-50">
       {(Object.keys(row) as (keyof CreditRow)[]).map(field => (
  <TableCell key={field} className="px-3 py-2 border">
    <Input
      className="w-full border rounded-md px-2 py-1"
      value={row[field]??""}
      disabled={!editableFields.includes(field)}
      onChange={e =>
        handleChange(index, field, e.target.value)
      }
    />
  </TableCell>
))}
      </TableRow>
    ))} */}

                               {ResolutionData.map((row, index) => (
  <TableRow key={index} className="hover:bg-gray-50">
    {columnConfig.map(col => {
      const isResField = col.key === "h1Res" || col.key === "h2Res";

      return (
        <TableCell key={col.key} className="px-3 py-2 border">
          <Input
            type={isResField ? "numeric" : "text"}
            maxLength={isResField ? 2 : undefined}
            value={row[col.key as keyof CreditRow] ?? ""}
            disabled={
              !editableFields.includes(col.key) ||
              (col.key.startsWith("h1") && !row.h1Type) ||
              (col.key.startsWith("h2") && !row.h2Type)
            }
            onChange={e => {
              let val = e.target.value;

              if (isResField) {
                val = val.replace(/\D/g, "").slice(0, 2);
              }

              handleChange(index, col.key as keyof CreditRow, val);
            }}
          />
        </TableCell>
      );
    })}
  </TableRow>
))}

                            </TableBody>
                        </Table>
                    </>

                )}
                <div className="flex justify-center gap-4 pt-5">
                    {(ExamType && !Resolution) && (
                        <>
                        <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2" onClick={SaveExam}> <Save size={18} />
                            <span>Save Exam</span></button>
                            <button
                                className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                                onClick={()=>{setCourseId("");setExamData([]);}}
                            >
                                <RefreshCcw size={18} />
                                <span>Refresh</span>
                            </button>
                            </>
                    )}
                </div>
                <br />



                {examData.length > 0 && (
                    <>
                        {/* <button
  className="min-w-64 ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
  onClick={() => setResolution(true)}
>
  <Plus size={18} />
  <span>Add Resolution</span>
</button>
<button
  className="min-w-64 ml-auto bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
  onClick={() => setResolution(false)}
>
  <X size={18} />
  <span>Cancel Resolution</span>
</button> */}


                        {(!Resolution && examData.length>0) && (
                            <DataTable
                                data={examData}
                                columns={columns}
                                searchKeys={["name", "examType"]}
                                filters={filters}
                            />
                        )}

                    </>

                )
                }

            </ComponentCard>
        </>
    );
}