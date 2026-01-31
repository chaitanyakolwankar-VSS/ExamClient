
import PageMeta from "../../../components/common/PageMeta";
import { useEffect, useState, useMemo } from "react";
import Select from "../../../components/form/Select";
import { CourseService, CourseApiResponse } from "../../../services/Course";
import { academicYearService } from "../../../services/academicYearService";
import { ExamService, Saveexam, Exams, GetExams, UpdateExams, DeleteExams } from "../../../services/ExamService";
import { Plus, Trash2, Edit, X, Pencil, Save, RefreshCcw, CheckCircle, Eye, Copy, Delete } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import Switch from "../../../components/form/switch/Switch";
import Swal from "sweetalert2";
import DataTable from "../../../components/ui/table/DataTable";


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

    // 🔹 RevalType
    const [RevalExam, setRevalExam] = useState(false);

    //     ExamData
    const [examData, setExamData] = useState<Exams[]>([]);

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
        if(ExamType){
             SearchExam();
        }
    }, [ExamType]);


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
    return (
        <>
            <PageMeta title="Subject Master" description="Welcome to Subject Master" />
            <ComponentCard
                title=" Exam Master"
            >

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5">
                    <Select
                        options={courseOptions}
                        placeholder="Select Course"
                        value={courseId}
                        onChange={(value) => {
                            setCourseId(value);
                        }}
                    />
                    {courseId && (
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
                    {Year && (
                        <Select
                            options={MonthOptions}
                            placeholder="Select Month"
                            value={Month}
                            onChange={(value) => {
                                setMonth(value);
                            }}
                        />
                    )}
                    {Month && (
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

                    {ExamType && (
                        <Switch
                            label="Revolution Exam"
                            disabled={Examexist}
                            color="blue"
                             onChange={RevolutionToggle}
                        />

                    )}


                </div>
                <div className="flex justify-center gap-4 pt-5">
                    {ExamType && (
                        <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2" onClick={SaveExam}> <Save size={18} />
                            <span>Save Exam</span></button>
                    )}
                </div>
                <br />
                {examData.length > 0 && (
                    <DataTable
                        data={examData}
                        columns={columns}
                        searchKeys={["name", "examType"]}
                        filters={filters}
                    />
                )
                }

            </ComponentCard>
        </>
    );
}