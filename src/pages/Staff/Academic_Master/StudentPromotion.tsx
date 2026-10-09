
import PageMeta from "../../../components/common/PageMeta";
import { useEffect, useState, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Alert from "../../../components/ui/alert/Alert";
import { useCourses, usePatterns, useSemesters, useAcademicYear, toCourseOptions, toPatternOptions, toSemesterOptions } from "../../../data";
import { EligibilityAssignedStudent ,StudentPromotionService,UpdateEligibilityRequest,EligibilityUnAssignedStudent} from "../../../services/StudentPromotionService";
import DataTable from "../../../components/ui/table/DataTable";
import Swal from "sweetalert2";
import Switch from "../../../components/form/switch/Switch";
import { Edit, X, Save, Eye, Loader2 } from "lucide-react";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { Modal } from "../../../components/ui/modal";
import Badge from "../../../components/ui/badge/Badge";



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

export default function StudentPromotion() {

//Alert
      const [alert, setAlert] = useState<AlertState | null>(null);
  
    // 🔹 Course
    const { ayid, years } = useAcademicYear();
    const courses = useCourses();
    const courseOptions = useMemo(() => toCourseOptions(courses.data), [courses.data]);
    const [courseId, setCourseId] = useState("");
   const [PreviousYear, setPreviousYear] = useState("");
   // 🔹 Earlier academic years than the selected one, newest first (from the shared year list)
   const PreviousYearOptions = useMemo<Option[]>(() => {
     const currentYear = years.find(y => y.ayid === ayid);
     if (!currentYear) return [];
     const currentStartYear = Number(currentYear.shortDuration.split("-")[0]);
     return years
       .filter(y => Number(y.shortDuration.split("-")[0]) < currentStartYear)
       .sort((a, b) => Number(b.shortDuration.split("-")[0]) - Number(a.shortDuration.split("-")[0])) // 🔽 DESC
       .map(y => ({ value: y.ayid, label: y.shortDuration }));
   }, [years, ayid]);
   // 🔹 Semester: only the semesters a student can be promoted into (3, 5, 7) out of the shared semester list
    const semesters = useSemesters();
    const semesterOptions = useMemo<Option[]>(
        () => toSemesterOptions(semesters.data).filter(s => ["Sem-3", "Sem-5", "Sem-7"].includes(s.value)),
        [semesters.data]
    );

       // 🔹 Pattern
  const patterns = usePatterns();
  const patternOptions = useMemo(() => toPatternOptions(patterns.data), [patterns.data]);
  const [pattern, setPattern] = useState("");
    const [SemId, setSemId] = useState("");

    const [assignedStudents, setAssignedStudents] = useState<EligibilityAssignedStudent[]>([]);
const [unassignedStudents, setUnassignedStudents] = useState<EligibilityUnAssignedStudent[]>([]);

const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

const [editingRows, setEditingRows] = useState<string[]>([]);

const [isEditMode, setIsEditMode] = useState(false);

  const [loading, setLoading] = useState(false);


  const [showStudentModal, setShowStudentModal] = useState(false);
const [selectedStudent, setSelectedStudent] = useState<any>(null);

useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);



const columns = useMemo(() => [
    {
        key: "srNo",
        label: "Sr No"
    },
    {
        key: "studentId",
        label: "Student ID",
    },
    {
        key: "studentName",
        label: "Student Name",
    },
  {
  key: "promotingSemester",
  label: "Promoting Semester",
  render: () => {
    const semNumber = Number(SemId.replace("Sem-", ""));

    return (
      <span>
        {semNumber
          ? `Sem-${semNumber},Sem-${semNumber + 1}`
          : ""}
      </span>
    );
  },
},
    {
  key: "eligibility",
  label: "Eligibility",
  render: (row: any) => (
    <div className="flex items-center gap-3">
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          row.eligibility
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {row.eligibility ? "Eligible" : "Not Eligible"}
      </span>

      <button
        type="button"
        className="text-blue-600 hover:text-blue-800"
        title="View Student Details"
     onClick={() => {
          setSelectedStudent(row);
          setShowStudentModal(true);
        }}
      >
        <Eye size={18} />
      </button>
    </div>
  ),
},
    {
    key: "select",
    label: "Select",
    render: (row: any) => (
        <Switch
             checked={
        row.eligibility === true ||
        selectedStudents.includes(row.stdMstId)
      }
            onChange={(checked: boolean) => handleSwitch(row.stdMstId, checked)}
        />
    )
}
],[selectedStudents,SemId]);
const unassignedWithSrNo = unassignedStudents.map((student, index) => ({
  ...student,
  srNo: index + 1,
}));

const assignedColumns = useMemo(() => [
    {
        key: "srNo",
        label: "Sr No"
    },
    {
        key: "studentId",
        label: "Student ID",
    },
    {
        key: "studentName",
        label: "Student Name",
    },
    {
  key: "promotedSemester",
  label: "Promoted Semester",
  render: () => {
    const semNumber = Number(SemId.replace("Sem-", ""));

    return (
      <span>
        {semNumber
          ? `Sem-${semNumber},Sem-${semNumber + 1}`
          : ""}
      </span>
    );
  },
},
 {
    key: "eligibility",
    label: "Eligibility",
    render: (row: any) => {
        const isEditing = editingRows.includes(row.stdMstId);

        return isEditing ? (
            <Select
                options={[
                    { value: "false", label: "Eligible" },
                    { value: "true", label: "Not Eligible" }
                ]}
                value={String(row.eligibility)}
                onChange={(value) => {
                    setAssignedStudents(prev =>
                        prev.map(x =>
                            x.stdMstId === row.stdMstId
                                ? {
                                    ...x,
                                    eligibility: value === "true"
                                }
                                : x
                        )
                    );
                }}
            />
        ) : (
            <div className="px-3 py-2 text-gray-700">
                {row.eligibility === false
                    ? "Eligible"
                    : "Not Eligible"}
            </div>
        );
    }
},
    {
    key: "action",
    label: "Action",
    render: (row: any) => (
        <button
            className="text-blue-600 hover:underline"
          onClick={() => {
    if (!editingRows.includes(row.stdMstId)) {
        setEditingRows(prev => [...prev, row.stdMstId]);
    }
}}
        >
           <Edit size={24} />
        </button>
    )
}
], [editingRows,SemId]);

const assignedWithSrNo = assignedStudents.map((student, index) => ({
  ...student,
  srNo: index + 1,
}));
useEffect(() => {
    if (courseId && PreviousYear && SemId ) {
        LoadStudents();
    }
}, [courseId, PreviousYear, SemId]);

const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedStudents(unassignedStudents.map(x => x.stdMstId));
    } else {
        setSelectedStudents([]);
    }
};

const handleSwitch = (id: string, checked: boolean) => {

    // Selected students update
    setSelectedStudents(prev =>
        checked
            ? prev.includes(id)
                ? prev
                : [...prev, id]
            : prev.filter(x => x !== id)
    );

    // Eligibility update
    setUnassignedStudents(prev =>
        prev.map(student =>
            student.stdMstId === id
                ? {
                    ...student,
                    eligibility: checked
                }
                : student
        )
    );
};
const ExportAssignedStudentsToExcel = () => {
    const excelData = assignedWithSrNo.map((student: any) => ({
           "Sr No": student.srNo,
        "Student ID": student.studentId,
        "Student Name": student.studentName,
        "Eligibility":
            student.eligibility === false
                ? "Eligible"
                : "Not Eligible"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const headers = [
         "Sr No",
        "Student ID",
        "Student Name",
        "Eligibility"
    ];

    // Header styling
    headers.forEach((header, index) => {
        const cellAddress = XLSX.utils.encode_cell({
            r: 0,
            c: index
        });

        worksheet[cellAddress].s = {
            font: {
                bold: true,
                sz: 14
            }
        };
    });

    // Auto column width
    worksheet["!cols"] = headers.map((header) => {
        const maxLength = Math.max(
            header.length,
            ...excelData.map((row: any) =>
                String(row[header] ?? "").length
            )
        );

        return {
            wch: maxLength + 4
        };
    });

    // Header row height
    worksheet["!rows"] = [
        {
            hpt: 25
        }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Assigned Students"
    );

    XLSX.writeFile(
        workbook,
        "Assigned_Students.xlsx"
    );
};

    // ================= API CALLS =================

const LoadStudents = async () => {
    try {

        setAssignedStudents([]);
        setUnassignedStudents([]);
        if (!courseId || !PreviousYear || !SemId ) {
            return;
        }

if (!ayid) {
    return Swal.fire("Error", "Academic Year is missing", "error");
}

        const parameter = {
            CourseId: courseId,
            Semester: SemId,
            Ayid: ayid,
            PreviousAyid: PreviousYear,
Pattern:pattern
        };

        const response = await StudentPromotionService.GetStudents(parameter);

        setAssignedStudents(response.assignedStudents ?? []);


        setUnassignedStudents(response.unassignedStudents ?? []);

          // Already eligible students should be selected
        const alreadyEligible = response.unassignedStudents
            .filter((student: any) => student.eligibility === true)
            .map((student: any) => student.stdMstId);

        setSelectedStudents(alreadyEligible);

        if(response.unassignedStudents.length==0 && response.assignedStudents.length>0){
            setIsEditMode(true);
        }
        if (response.assignedStudents.length > 0 && response.unassignedStudents.length === 0) {
    setAlert({
        variant: "info",
        title: "Information",
                message: "All eligible students are already assigned. Use the Edit option to update the eligibility status if required."
    });
}
else if (response.assignedStudents.length === 0 && response.unassignedStudents.length === 0) {
    setAlert({
        variant: "warning",
        title: "No Data",
        message: "No students found for the selected criteria."
    });
}
else if (response.assignedStudents.length > 0 && response.unassignedStudents.length > 0) {
    setAlert({
        variant: "info",
        title: "Information",
        message: "Some students are already assigned. Use the Edit option to modify assigned students or assign the remaining students."
    });
}

    } catch (error) {
        console.error("Error loading students:", error);

        setAlert({
            variant: "error",
            title: "Error",
            message: "Failed to load students."
        });
    }
};

//Save Eligibility
const SaveStudents = async () => {
    setLoading(true);
    try {


        if (!ayid) {
            Swal.fire("Error", "Academic Year not found.", "error");
            return;
        }

        const request = {
            examInfo: {
                CourseId: courseId,
                Semester: SemId,
                Ayid: ayid,
                PreviousAyid: PreviousYear,
                Pattern:pattern
            },
            stduents: unassignedStudents.map(x => ({
                stdMstId: x.stdMstId,
                studentID: x.studentId,
                 isEligible: selectedStudents.includes(x.stdMstId) ===true
            }))
        };

        const response = await StudentPromotionService.SaveEligibility(request);

        Swal.fire("Success", response.message, "success");

        LoadStudents();

    } catch (error) {
        console.error(error);

        Swal.fire("Error", "Failed to save eligibility.", "error");
    }
    finally {
    setLoading(false);
    LoadStudents();
}
};

//Update Eligibility
const UpdateEligibility = async () => {
     setLoading(true);
    try {
        

        if (!ayid) {
            Swal.fire("Error", "Academic Year not found.", "error");
            return;
        }
        const request: UpdateEligibilityRequest = {
            examInfo: {
                CourseId: courseId,
                Semester: SemId,
                Ayid: ayid,
                PreviousAyid: PreviousYear,
                Pattern: pattern
            },

            stduents: assignedStudents.map(student => ({
                stdMstId: student.stdMstId,
                studentID: student.studentId,
                eligibility: student.eligibility 
            }))
        };

        const response = await StudentPromotionService.UpdateEligibility(request);

          Swal.fire("Success", response.message, "success");

        // update successful hone ke baad edit mode off
        setEditingRows([]);

    } catch (error) {
        console.error("Error updating eligibility:", error);
        Swal.fire("Error", "Failed to Update eligibility.", "error");
    }
    finally {
    setLoading(false);
    LoadStudents();
    setIsEditMode(false);
}
};
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
                title=" Student Promotion"
            >
                
    

                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-5">
                     <Select
                options={PreviousYearOptions}
                placeholder="Select Previous Year"
                value={PreviousYear}
                onChange={(value) => {
                  setPreviousYear(value);
                 setCourseId("");setPattern("");setSemId("");setAssignedStudents([]);setUnassignedStudents([]);setIsEditMode(false);
                }}
              />
              {PreviousYear&&(
<Select
                        options={courseOptions}
                        placeholder="Select Course"
                        value={courseId}
                        onChange={(value) => {
                            setCourseId(value);
setPattern("");setSemId("");setAssignedStudents([]);setUnassignedStudents([]);setIsEditMode(false);
                        }}
                    />
              )}
                 {courseId&&(
                    <Select
              options={patternOptions}
              placeholder="Select Pattern"
              value={pattern}
              onChange={(value) => {
                setPattern(value);  ;setSemId("");setAssignedStudents([]);setUnassignedStudents([]);setIsEditMode(false);
              }}
            />
                 )}
 {pattern &&(
   <Select
                        options={semesterOptions}
                        placeholder="Select Semester to Assign"
                        value={SemId}
                        onChange={(value) => {
                            setSemId(value);  setAssignedStudents([]);setUnassignedStudents([]);setIsEditMode(false);setEditingRows([]);
                        }}
                    />
 )}
                 
                       
</div>
    <div className="flex justify-center gap-4 pt-5">
   
{(unassignedStudents.length>0 || isEditMode) &&(
<button
    className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
               flex items-center justify-center gap-2 disabled:opacity-60"
    onClick={isEditMode ? UpdateEligibility : SaveStudents}
    disabled={loading}
>
    {loading ? (
        <>
            <Loader2 size={18} className="animate-spin" />
            <span>{isEditMode ? "Updating..." : "Saving..."}</span>
        </>
    ) : (
        <>
            <Save size={18} />
            <span>{isEditMode ? "Update" : "Save"}</span>
        </>
    )}
</button>
                 
)}
{(assignedStudents.length>0 && !isEditMode) && (
    <>
      <button
    className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
    onClick={() => setIsEditMode(true)}
>
      <Edit size={18} />
    <span>Edit</span>
</button>
  
</>
)}
                    
                
  
  {isEditMode&&(
    <>
    <button
            className="min-w-64 bg-green-600 text-white px-4 py-2 rounded-lg
            flex items-center justify-center gap-2"
            onClick={ExportAssignedStudentsToExcel}
        >
            <FileSpreadsheet size={18} />
            <span>Excel</span>
        </button></>
    )}
      {(isEditMode && unassignedStudents.length>0)&&(
    <>
  <button className="min-w-64 bg-red-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"  onClick={() => { setIsEditMode(false); }}> <X size={18} />
                  <span>Cancel</span></button></>
    )}
    </div>


{(unassignedStudents.length > 0 && !isEditMode) && (
  <>
    <div className="flex items-center justify-between mb-3">

      {/* Legend - Left */}
      <div className="flex flex-wrap items-center justify-start gap-4">
        <Badge variant="light" color="primary">
          Total: {unassignedStudents.length}
        </Badge>

        <Badge variant="light" color="success">
          Eligible:  {unassignedStudents.filter(x => x.eligibility === true).length}
        </Badge>

        <Badge variant="light" color="error">
          Not Eligible:  {unassignedStudents.filter(x => x.eligibility === false).length}
        </Badge>

        <Badge variant="light" color="info">
          Eligible students are already selected. Select Not Eligible students if required.
        </Badge>
      </div>

      {/* Select All - Right */}
      <label className="flex items-center gap-2 shrink-0">
        <span>Select All</span>
        <Switch
          checked={
            unassignedStudents.length > 0 &&
            selectedStudents.length === unassignedStudents.length
          }
          onChange={handleSelectAll}
        />
      </label>

    </div>

    <DataTable
      data={unassignedWithSrNo}
      columns={columns}
      searchKeys={["studentId", "studentName"]}
      filters={{}}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  </>
)}
 {(assignedStudents.length > 0 && isEditMode)  && (
  <>
  <div className="flex items-center justify-between mb-3">

      {/* Legend - Left */}
      <div className="flex flex-wrap items-center justify-start gap-4">
        <Badge variant="light" color="primary">
          Total: {assignedStudents.length}
        </Badge>

        <Badge variant="light" color="success">
          Eligible:  {assignedStudents.filter(x => x.eligibility === false).length}
        </Badge>

        <Badge variant="light" color="error">
          Not Eligible:  {assignedStudents.filter(x => x.eligibility === true).length}
        </Badge>

        <Badge variant="light" color="info">
          Click the Action button to change eligibility.
        </Badge>
      </div>

    

    </div>
   <DataTable
        data={assignedWithSrNo}
        columns={assignedColumns}
        searchKeys={["studentId","studentName"]}
        filters={{}}
         pageSizeOptions={[10,20,30,50]}
    />
    </>
   
)} 

{/* Student Details Modal */}
<Modal
  isOpen={showStudentModal}
  onClose={() => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  }}
  className="max-w-lg p-6"
>
  <h2 className="text-xl font-semibold mb-4">
    Student Details
  </h2>

  <br />

  {selectedStudent && (
    <div className="space-y-4">

      {/* Line 1 */}
  <div className="grid grid-cols-2">
    <div>
      <span className="text-sm font-medium text-gray-500">Student ID</span>
      <p className="text-sm font-semibold text-gray-800">
        {selectedStudent.studentId || "-"}
      </p>
    </div>

    <div>
      <span className="text-sm font-medium text-gray-500">Student Name</span>
      <p className="text-sm font-semibold text-gray-800">
        {selectedStudent.studentName || "-"}
      </p>
    </div>
  </div>

  {/* Line 2 */}
  <div className="grid grid-cols-2 ">
    <div>
      <span className="text-sm font-medium text-gray-500">
        Promoting Semester
      </span>
      <p className="text-sm font-semibold text-gray-800">
        {SemId
          ? (() => {
              const semNumber = Number(
                SemId.replace("Sem-", "")
              );

              return `Sem-${semNumber},Sem-${semNumber + 1}`;
            })()
          : "-"}
      </p>
    </div>

    <div>
      <span className="text-sm font-medium text-gray-500">
        Eligibility
      </span>
      <p className="text-sm font-semibold text-gray-800">
        {selectedStudent.eligibility
          ? "Eligible"
          : "Not Eligible"}
      </p>
    </div>
  </div>



{/* Semester Wise Academic Details */}
<div className="mt-6">
    <h3 className="text-lg font-semibold mb-3">
        Semester Wise Academic Details
    </h3>

    <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
            <thead className="bg-gray-100">
                <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                        Semester
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                        Credit
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                        Credit Grade Point
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                        CGPI
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                        SGPI
                    </th>
                </tr>
            </thead>

            <tbody>
                {selectedStudent?.semesterDetails?.length > 0 ? (
                    selectedStudent.semesterDetails.map(
                        (semester: any, index: number) => (
                            <tr
                                key={index}
                                className="border-t"
                            >
                                <td className="px-4 py-3 font-medium">
                                    {semester.semester}
                                </td>

                                <td className="px-4 py-3 text-center">
                                    {semester.credit ?? "-"}
                                </td>

                                <td className="px-4 py-3 text-center">
                                    {semester.creditGradePoint ?? "-"}
                                </td>

                                <td className="px-4 py-3 text-center">
                                    {semester.cgpi ?? "-"}
                                </td>

                                <td className="px-4 py-3 text-center">
                                    {semester.sgpi ?? "-"}
                                </td>
                            </tr>
                        )
                    )
                ) : (
                    <tr>
                        <td
                            colSpan={5}
                            className="px-4 py-5 text-center text-gray-500"
                        >
                            No semester details available
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
</div>


    </div>
  )}

  {/* Footer */}
  <div className="mt-6 flex justify-end">
    <button
      onClick={() => {
        setShowStudentModal(false);
        setSelectedStudent(null);
      }}
    >
      Close
    </button>
  </div>
</Modal>
            </ComponentCard>
        </>
    );
}