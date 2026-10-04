
import PageMeta from "../../../components/common/PageMeta";
import { useEffect, useState, useMemo } from "react";
import Select from "../../../components/form/Select";
import { ExamService, Saveexam, Exams, UpdateExams, DeleteExams } from "../../../services/ExamService";
import { useCourses, useExams, useAcademicYear, useAcademicYears, toCourseOptions, invalidateExams } from "../../../data";
import { Trash2, Save, RefreshCcw } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import Switch from "../../../components/form/switch/Switch";
import Swal from "sweetalert2";
import DataTable from "../../../components/ui/table/DataTable";


import Alert from "../../../components/ui/alert/Alert";


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

    // 🔹 Course (shared lookup cache)
    const { data: courses } = useCourses();
    const courseOptions = useMemo(() => toCourseOptions(courses), [courses]);
    const [courseId, setCourseId] = useState("");

    // 🔹 Academic year (header picker) and the list of years
    const { ayid } = useAcademicYear();
    const { data: academicYears } = useAcademicYears();

    // 🔹 Year
    const [YearOption, setYearOption] = useState("");
    const [Year, setYear] = useState("");

    // 🔹 Month
    const [MonthOptions, setMonthOptions] = useState<Option[]>([]);
    const [Month, setMonth] = useState("");

    // 🔹 ExamType
    const [ExamType, setExamType] = useState("");

    // Exam Exist
    const [Examexist, setExamexist] = useState(false);

    // 🔹 RevalType
    const [RevalExam, setRevalExam] = useState(false);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [editingRowId, setEditingRowId] = useState<string | null>(null);

    const [editingName, setEditingName] = useState<string>(""); // temp value

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
    // The two calendar years of the selected academic year, e.g. "24-25" -> 24 / 25.
    const YearOptions = useMemo<Option[]>(() => {
        if (!ayid) return [];
        const currentYear = academicYears?.find((y) => y.ayid === ayid);
        if (!currentYear || !currentYear.shortDuration) return [];
        const [start, end] = currentYear.shortDuration.replace(/s/g, "").split("-");
        if (!start || !end) return [];
        return [
            { value: "1", label: start },
            { value: "2", label: end },
        ];
    }, [ayid, academicYears]);

    // Exams of the chosen course in the selected academic year (all exams, for the Exam Master list)
    const { data: exams } = useExams({ courseId, purpose: "master" });
    // Local copy so the Active switch and Delete can update the list instantly; re-synced whenever the query changes.
    const [examData, setExamData] = useState<Exams[]>([]);
    useEffect(() => {
        setExamData((exams ?? []).map((e) => ({ examId: e.examId, name: e.name, examType: e.examType ?? "", isActive: e.isActive })));
    }, [exams]);

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

      useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

    useEffect(() => {
        setYear("");
        setYearOption("");
        setMonth("");
        setExamType("");
        setRevalExam(false);

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

    // ================= API CALLS =================

    const SaveExam = async () => {
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
            invalidateExams();
        }
        else {
            await Swal.fire("Failed!", res.message, "error");
        }
    }
    const SearchExam = async () => {
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
            // Put the switch back (the refetch below may return unchanged data, which would not re-sync the list).
            setExamData((prev) =>
                prev.map((exam) =>
                    exam.examId === examId ? { ...exam, isActive: !checked } : exam
                )
            );
        }
        invalidateExams();
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
            invalidateExams();
        }
        else {
            await Swal.fire("Failed!", res.message, "error");
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
                {/* Resolution is configured on the Marks Entry screen, where the staff can see
                    the marks they are condoning. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5">
                    <Select
                        options={courseOptions}
                        placeholder="Select Course"
                        value={courseId}
                        onChange={(value) => {
                            setCourseId(value);
                        }}
                    />
                    {(courseId) && (
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
                    {(Year) && (
                        <Select
                            options={MonthOptions}
                            placeholder="Select Month"
                            value={Month}
                            onChange={(value) => {
                                setMonth(value);
                            }}
                        />
                    )}
                    {(Month) && (
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

                    {(ExamType) && (
                        <Switch
                            label="Revaluation Exam"
                            disabled={Examexist}
                            color="blue"
                            onChange={RevolutionToggle}
                        />

                    )}


                </div>
                <div className="flex justify-center gap-4 pt-5">
                    {(ExamType) && (
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
                        {(examData.length>0) && (
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