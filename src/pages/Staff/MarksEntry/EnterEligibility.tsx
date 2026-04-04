import PageMeta from "../../../components/common/PageMeta";
import { useState, useEffect, useMemo, useRef } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { CourseService, CourseApiResponse } from "../../../services/Course";
import Switch from "../../../components/form/switch/Switch";
import { Plus, Trash2, Edit, X, Pencil, Save, RefreshCcw, CheckCircle, Eye, Copy, Delete } from "lucide-react";
import Checkbox from "../../../components/form/input/Checkbox";
import DataTable from "../../../components/ui/table/DataTable";
import { SemesterData, EligibilityStudents, EligibilityService, GetEligibilityStudents } from "../../../services/EligibilityService";
import Swal from "sweetalert2";
//import * as XLSX from "xlsx";
import Alert from "../../../components/ui/alert/Alert";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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
export default function EnterEligibility() {

  //Alert
  const [alert, setAlert] = useState<AlertState | null>(null);


  // 🔹 Course
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");

  //Eligibility Students
  const [EligibilityStudents, setEligibilityStudents] = useState<EligibilityStudents[]>([]);

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
  const [semesterName,setsemesterName]=useState("");

  const [FirstYear_checked, setFirstYear_checked] = useState(false);

  const [SecondYear_checked, setSecondYear_checked] = useState(false);

  const [ThirdYear_checked, setThirdYear_checked] = useState(false);

  const [FourthYear_checked, setFourthYear_checked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = useMemo(() => ({}), []);
  const selectedSems = useMemo(() => {
    let sems: number[] = [];

    if (FirstYear_checked) {
      sems.push(1, 2);
    }

    if (SecondYear_checked) {
      sems.push(3, 4);
    }
    if (ThirdYear_checked) {
      sems.push(5, 6);
    }
    if (FourthYear_checked) {
      sems.push(7, 8)
    }
setEligibilityStudents([]);
    return sems;
  }, [FirstYear_checked, SecondYear_checked, ThirdYear_checked, FourthYear_checked]);

  const columns = useMemo(() => [
    { key: "studentId", label: "Student ID" },
    { key: "studentName", label: "Student Name" },

    ...selectedSems.flatMap((sem) => [
      {
        key: `sem${sem}_CG`,
        label: `Sem ${sem} CG`,
        render: (row: EligibilityStudents) => (
          <input
            type="text"
              maxLength={5}
            value={row.semesters[sem]?.cg || ""}
            onChange={(e) =>
            {
               let value = e.target.value;

  // ✅ allow only numbers + dot
  value = value.replace(/[^0-9.]/g, "");

  // ✅ only ONE dot allowed
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts[1];
  }

  // ✅ limit to 2 decimal places
  if (value.includes(".")) {
    const [intPart, decPart] = value.split(".");
    value = intPart + "." + decPart.slice(0, 2);
  }

  handleChange(row.studentId, sem, "cg", value);
            }
            }
            className="border px-2 py-1 w-20"
          />
        )
      },
      {
        key: `sem${sem}_Credit`,
        label: `Sem ${sem} Credit`,
        render: (row: EligibilityStudents) => (
          <input
            type="text"
              maxLength={5}
            value={row.semesters[sem]?.credit || ""}
            onChange={(e) =>
             {
               let value = e.target.value;

  // ✅ allow only numbers + dot
  value = value.replace(/[^0-9.]/g, "");

  // ✅ only ONE dot allowed
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts[1];
  }

  // ✅ limit to 2 decimal places
  if (value.includes(".")) {
    const [intPart, decPart] = value.split(".");
    value = intPart + "." + decPart.slice(0, 2);
  }

  handleChange(row.studentId, sem, "credit", value);
             }
            }
            className="border px-2 py-1 w-20"
          />
        )
      },
      {
        key: `sem${sem}_KtTheory`,
        label: `Sem ${sem} KT Theory`,
        render: (row: EligibilityStudents) => (
          <input
            type="text"
              maxLength={5}
            value={row.semesters[sem]?.kT_Theory || ""}
            onChange={(e) =>
             {
               let value = e.target.value;

  // ✅ allow only numbers + dot
  value = value.replace(/[^0-9.]/g, "");

  // ✅ only ONE dot allowed
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts[1];
  }

  // ✅ limit to 2 decimal places
  if (value.includes(".")) {
    const [intPart, decPart] = value.split(".");
    value = intPart + "." + decPart.slice(0, 2);
  }

  handleChange(row.studentId, sem, "kT_Theory", value);
             }
            }
            className="border px-2 py-1 w-20"
          />
        )
      },
      {
        key: `sem${sem}_KtOthers`,
        label: `Sem ${sem} KT Others`,
        render: (row: EligibilityStudents) => (
          <input
            type="text"
            maxLength={5}
            value={row.semesters[sem]?.kT_Others || ""}
            onChange={(e) => {
  let value = e.target.value;

  // ✅ allow only numbers + dot
  value = value.replace(/[^0-9.]/g, "");

  // ✅ only ONE dot allowed
  const parts = value.split(".");
  if (parts.length > 2) {
    value = parts[0] + "." + parts[1];
  }

  // ✅ limit to 2 decimal places
  if (value.includes(".")) {
    const [intPart, decPart] = value.split(".");
    value = intPart + "." + decPart.slice(0, 2);
  }

  handleChange(row.studentId, sem, "kT_Others", value);
}}
            className="border px-2 py-1 w-20"
          />
        )
      }
    ])
  ], [selectedSems]);
  const handleChange = (
    studentId: string,
    sem: number,
    field: string,
    value: string
  ) => {
    setEligibilityStudents((prev) =>
      prev.map((student) => {
        if (student.studentId !== studentId) return student;

        return {
          ...student,
          semesters: {
            ...student.semesters,
            [sem]: {
              ...student.semesters[sem],
              [field]: value
            }
          }
        };
      })
    );
  };


  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

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
    setEligibilityStudents([]);
    setSemester("");
  }, [courseId]);
  useEffect(() => {
    setFirstYear_checked(false);
    setSecondYear_checked(false);
    setThirdYear_checked(false);
    setFourthYear_checked(false);
    setEligibilityStudents([]);
  }, [semester]);


const exportToCSV = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");

  // 🔥 Prepare Headers
  const headers: string[] = ["StudentId", "StudentName"];

  selectedSems.forEach((sem) => {
    headers.push(
      `Sem${sem}_CG`,
      `Sem${sem}_Credit`,
      `Sem${sem}_KT_Theory`,
      `Sem${sem}_KT_Others`
    );
  });

  worksheet.addRow(headers);

  // 🔥 Add Data
  EligibilityStudents.forEach((student) => {
    const row: any[] = [student.studentId, student.studentName];

    selectedSems.forEach((sem) => {
      const s = student.semesters[sem];
      row.push(
        s?.cg ?? "",
        s?.credit ?? "",
        s?.kT_Theory ?? "",
        s?.kT_Others ?? ""
      );
    });

    worksheet.addRow(row);
  });

  // 🔥 Column Width
  worksheet.columns.forEach((col, index) => {
    if (index === 1) col.width = 15;
    else if (index === 2) col.width = 25;
    else col.width = 15;
  });

  // 🔥 Apply Border + Header Bold
 worksheet.eachRow((row, rowNumber) => {
  row.eachCell((cell, colNumber) => {  // ✅ colNumber yaha define hota hai

    // Border
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Align
    cell.alignment = { vertical: "middle", horizontal: "center" };
    

    // Header bold
    if (rowNumber === 1) {
      cell.font = { bold: true };
      return;
    }

    // 🔥 Apply validation only after first 2 columns
    if (colNumber > 2) {
      cell.dataValidation = {
        type: "decimal",
        operator: "between",
        formulae: [0, 999999],
        allowBlank: true,
        showErrorMessage: true,
        showInputMessage: true,
        promptTitle: "Number Only",
        prompt: "Enter only numeric value",
        errorTitle: "Invalid Input",
        error: "Only numbers allowed",
      };
    }

    
  });
});

  // 🔥 Download
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `${courseName} ${semesterName}.xlsx`
  );
};
  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

  // ✅ expected file name
  const expectedName = `${courseName} ${semesterName}.xlsx`;

  // 🔥 check file name
  if (file.name !== expectedName) {
    Swal.fire(
      "Error ❌",
      `Invalid file !\nExpected: ${expectedName}`,
      "error"
    );
    return;
  }
    const reader = new FileReader();

    reader.onload = (evt: any) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

      console.log("Excel Data 👉", jsonData);

      convertToEligibility(jsonData);
    };

    reader.readAsArrayBuffer(file);
  };
  const convertToEligibility = (rows: any[]) => {
    const result: EligibilityStudents[] = [];

    rows.forEach((row) => {
      const student: EligibilityStudents = {
        serialNo: "",
        studentId: String(row.StudentId ?? ""),
        studentName: row.StudentName,
        semesters: {}
      };
      const fieldMap: Record<string, keyof SemesterData> = {
        CG: "cg",
        Credit: "credit",
        KT_Theory: "kT_Theory",
        KT_Others: "kT_Others"
      };
      // 👉 dynamic sem detect
      Object.keys(row).forEach((key) => {
        if (key.startsWith("Sem")) {
          const match = key.match(/Sem(\d+)_([A-Za-z_]+)/);

          if (match) {
            const sem = match[1]; // "1"
            const field = match[2]; // CG, Credit etc.
            const semNo = Number(sem);
            const mappedField = fieldMap[field];

            if (!student.semesters[semNo]) {
              student.semesters[semNo] = {} as SemesterData;
            }

            if (mappedField) {
              // student.semesters[semNo][mappedField] = row[key];
              student.semesters[semNo][mappedField] = String(row[key] ?? "");
            }
          }
        }
      });

      result.push(student);
    });
    // 🔥 VALIDATION START

    const existingIds = new Set(
      EligibilityStudents.map((s) => String(s.studentId))
    );

    const excelIds = new Set(result.map((s) => String(s.studentId)));

    // ❌ find mismatch
    const notFound = [...excelIds].filter((id) => !existingIds.has(id));
    const missing = [...existingIds].filter((id) => !excelIds.has(id));

    if (notFound.length > 0 || missing.length > 0) {
      console.log("Mismatch ❌", { notFound, missing });

      Swal.fire(
        "Error",
        "Excel students and existing students do not match",
        "error"
      );

      return; // ❌ stop here
    }
    console.log("Converted 👉", result);

    setEligibilityStudents(result);
   if (fileInputRef.current) {
  fileInputRef.current.value = "";
}
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
  const GeStudentData = async () => {
    const ayid = localStorage.getItem("AYID");
    if (!ayid) {
      return Swal.fire("Error", "Academic Year is missing", "error");
    }
    const parameter: GetEligibilityStudents = {
      Ayid: ayid,
      CourseId: courseId,
      Semester: semester
    }
    const data: EligibilityStudents[] = await EligibilityService.getstudents(parameter);
    if (data.length > 0) {
      setEligibilityStudents(data);
    }
    else {
      setEligibilityStudents([]);
      return setAlert({
        variant: "error",
        title: "Error",
        message: "Data Not Found!!",
      });
    }

  }
  const SaveEligibility = async () => {
    try {
      const payload = EligibilityStudents; // ✔️ state use kar

      const response = await EligibilityService.SaveEligibility(payload);

      if (response.success) {
        Swal.fire({
          title: "Saved!",
          text: response.message,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      else {
        Swal.fire({
          title: "Failed!",
          text: response.message,
          icon: "error",
          timer: 2000,
          showConfirmButton: false,
        });
      }

    } catch (error) {
      console.error("Error saving data ❌", error);
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
      <PageMeta
        title="Staff Dashboard"
        description="Welcome to the Staff Portal"
      />
      <ComponentCard title="Enter Eligibility">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-5">
          {/* Course */}
          <Select
            options={courseOptions}
            placeholder="Select Course"
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
                const selected = courseOptions.find(c => c.value === value);
    setCourseName(selected?.label || "");
            }}
          />

          {/* Semester */}
          {courseId && (
            <Select
              options={semesterOptions}
              placeholder="Select Semester"
              value={semester}
              onChange={(value) => { setSemester(value); 
                const selected = semesterOptions.find(c => c.value === value);
    setsemesterName(selected?.label || "");
              }}
            />
          )}
          {semester && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2 gap-2 pt-1">
                <Checkbox
                  label="First Year"
                  checked={FirstYear_checked}
                  onChange={(val) => setFirstYear_checked(val)}
                />
                <Checkbox label="Second Year" checked={SecondYear_checked} onChange={(val) => setSecondYear_checked(val)} />

              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2 gap-2 pt-1">

                <Checkbox label="Third Year" checked={ThirdYear_checked} onChange={(val) => setThirdYear_checked(val)} />
                <Checkbox label="Fourth Year" checked={FourthYear_checked} onChange={(val) => setFourthYear_checked(val)} />

              </div>
            </>
          )}


        </div>
        <div className="flex justify-center gap-4 pt-5">
          {(FirstYear_checked || SecondYear_checked || ThirdYear_checked || FourthYear_checked) && (
            <>
              <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"  onClick={() => { GeStudentData(); }}>
                <Save size={18} />
                <span>Get Data</span></button>
              {EligibilityStudents.length > 0 && (
                <>
                  <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2" onClick={() => { SaveEligibility(); }} > <Save size={18} />
                    <span>Save</span></button>
                  <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"   onClick={() => { exportToCSV(); }}> <Save size={18} />
                    <span>Excel</span></button>
                  <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2" onClick={handleButtonClick} > <Save size={18} />
                    <span>Upload</span></button>
                </>
              )}
            </>
          )}
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>
        {(EligibilityStudents.length > 0 )&& (

      <DataTable
        data={EligibilityStudents}
        columns={columns}
        searchKeys={["studentName", "studentId"]}
        filters={filters}
      />
  
)}

      </ComponentCard>
    </>
  );
}