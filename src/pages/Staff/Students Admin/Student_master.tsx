import { useEffect, useState, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { FetchData, SelectOption, StudentMasterService } from "../../../services/Student_MasterService";
import Input from "../../../components/form/input/InputField";
import Radio from "../../../components/form/input/Radio";
import Switch from "../../../components/form/switch/Switch";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import Swal from "sweetalert2";
import DataTable from "../../../components/ui/table/DataTable";
import {FaFileExcel,    
  FaFileImport,  
  FaSyncAlt,      
  FaSave,         
  FaSync,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,        
} from "react-icons/fa";
import { useRef } from "react";



export default function StudentMaster() {

  const [loading, setLoading] = useState(false);
  // ================= SAVE CARD =================
  const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const [firstname, setFirstName] = useState("");
  const [middlename, setMidleName] = useState("");
  const [lastname, setLastName] = useState("");

  const [category, setCategory] = useState("");
  const [prn, setPrn] = useState("");

  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [Dyslexia, setDyslexia] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
    // ================= View Exam =================
const [showExamModal, setShowExamModal] = useState(false);
const [examData, setExamData] = useState<any[]>([]);
const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // ================= PHOTO + SIGNATURE =================

  const API_BASE = "https://localhost:7225";
  const [isFlipped, setIsFlipped] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
const [photoUrl, setPhotoUrl] = useState<string | null>(null);
const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  // ================= SEARCH CARD =================
  const [searchCourse, setSearchCourse] = useState("");
  const [studentId, setStudentId] = useState("");
  const [Fname, setfname] = useState("");
  const [Mname, setMname] = useState("");
  const [Lname, setLname] = useState("");
  const [searchPrn, setSearchPrn] = useState("");
 // ================= Edit Update delete =================

 const [isEditMode, setIsEditMode] = useState(false);
const [editStudentId, setEditStudentId] = useState<string | null>(null);
const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  // ================= REFRESH =================
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeCard, setActiveCard] = useState<"save" | "search" | null>(null);

  // ================= ALERT =================
  type AlertVariant = "success" | "warning" | "error" | "info";

  interface AlertState {
    variant: AlertVariant;
    title: string;
    message: string;
  }

  const [alert, setAlert] = useState<AlertState | null>(null);

  // ================= BASE64 CONVERTER =================
  const toBase64 = (file: File) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

  // ================= REFRESH FUNCTION =================
  const handleRefresh = () => {
    setIsEditMode(false);
  setEditStudentId(null);

  setSelectedCourse("");
  setSelectedSemester("");
  setFirstName("");
  setMidleName("");
  setLastName("");
  setCategory("");
  setPrn("");
  setGender("");
  setDyslexia(false);

  setPhoto(null);
  setSignature(null);
  setPhotoUrl(null);
  setSignatureUrl(null);
   setActiveCard(null);

  setIsFlipped(false);
    setRefreshKey(prev => prev + 1);
  };
  const handleRefreshData = () => {
   setSearchPrn("");
    setLname("");
    setMname("");
    setfname("");
    setStudentId("");
    setSearchCourse("");
     setActiveCard(null);

    setDataList([]);
      setRefreshKey(prev => prev + 1);

    
  };

  // ================= PHOTO + SIGNATURE HANDLERS =================
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSignature(file);
  };

  // ================= MODE SWITCH =================
  const [mode, setMode] = useState<"search">("search");

  // ================= SEMESTER OPTIONS =================
  const semesterOptions: SelectOption[] = [
   { value: "1", label: "Semester I" },
  { value: "2", label: "Semester II" },
  { value: "3", label: "Semester III" },
  { value: "4", label: "Semester IV" },
  { value: "5", label: "Semester V" },
  { value: "6", label: "Semester VI" },
  { value: "7", label: "Semester VII" },
  { value: "8", label: "Semester VIII" },
  ];

  // ================= FETCH COURSES =================
  const fetchCourses = async () => {

    setLoading(true);

    try {

      const data = await StudentMasterService.GetData();

      const formatted = (data ?? []).map(c => ({
        value: c.courseId,
        label: c.name,
      }));

      setCourseOptions(formatted);

    } finally {
      setLoading(false);
    }
  };

  const filters = useMemo(() => ({}), []);

  // ================= ALERT AUTO DISMISS =================
  useEffect(() => {

    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }

  }, [alert]);

  // ================= SAVE STUDENT =================
  const handleSave = async () => {

    if (!selectedCourse || !selectedSemester || !firstname || !lastname || !category || !prn || !gender) {
      setAlert({
        variant: "warning",
        title: "Permission Required",
        message: "Fill all the Required Fields"
      });
      return;
    }

  const photoBase64 = photo ? await toBase64(photo) : "";
const signBase64 = signature ? await toBase64(signature) : "";

const payload = {
  courseId: selectedCourse,
  semesterId: selectedSemester,
  firstname: firstname,
  middlename: middlename || null,
  lastname: lastname,
  category: category || null,
 PhotoUrl: photoBase64 ?? photoUrl ?? null,
  SignUrl: signBase64 ?? signatureUrl ?? null,
  studentprn: prn,
  gender: gender,
  dyslexia: Dyslexia
};

    try {

      const res = await StudentMasterService.SaveStudent(payload);

      const studentId = res.data.studentId;

      await Swal.fire({
        icon: "success",
        title: "Saved Successfully!",
        text: `Student ID: ${studentId}`,
      
      });

      handleRefresh();

    } catch (error: any) {

  console.error(error);

  const message =
    
    "Error saving student.";

  await Swal.fire({
    icon: "error",
    title: "Save Failed",
    text: message,
  
  });
}
  };

  useEffect(() => {
    fetchCourses();
  }, []);
// ================= Edit  =================

const handleEdit = async (studentId: string) => {
  try {
    const data = await StudentMasterService.GetStudentById(studentId);

    if (!data) return;

   setEditStudentId(data.studentId);
    setIsEditMode(true);
    setAlert({     
       variant: "success",      
       title: "Edit Mode",      
       message: "Now you are in Edit Mode"
      });
    setSelectedCourse(data.courseId);
    setSelectedSemester(data.semesterId);
    setFirstName(data.firstName);
    setMidleName(data.middleName);
    setLastName(data.lastName);
    setCategory(data.category);
    setPrn(data.studentPRN);
    setGender(
    data.gender?.toLowerCase() === "male" ? "Male" :
    data.gender?.toLowerCase() === "female" ? "Female" : ""
  );
    setDyslexia(data.dyslexia);
    setPhoto(null);
    setSignature(null);

if(data.photoUrl && data.photoUrl.trim()) {
  setPhotoUrl(`${API_BASE}${data.photoUrl}`);
}
if(data.signUrl && data.signUrl.trim()) {
  setSignatureUrl(`${API_BASE}${data.signUrl}`);
}
  } catch (err) {
    console.error(err);
  }
};
const handleUpdate = async () => {
  try {
const photoBase64 = photo ? await toBase64(photo) : null;
const signBase64 = signature ? await toBase64(signature) : null;

   
const payload = {
  studentId: editStudentId,
  courseId: selectedCourse,
  semesterId: selectedSemester,
  firstName: firstname,
  middleName: middlename,
  lastName: lastname,
  category: category,
  studentPRN: prn,
  gender: gender,
  dyslexia: Dyslexia,
   PhotoUrl: photoBase64 ?? photoUrl ?? null,
  SignUrl: signBase64 ?? signatureUrl ?? null
};

    await StudentMasterService.UpdateStudent(payload);

    await Swal.fire({
      icon: "success",
      title: "Updated Successfully",
    });

    // ✅ RESET FORM AFTER UPDATE
    handleRefresh();

  }catch (error: any) {

  Swal.fire({
    icon: "error",
    title: "Error",
    text: "Update Failed"
  });
}
};
const handleViewExam = async (studentId: string) => {
  try {
    setSelectedStudentId(studentId);

    const data = await StudentMasterService.GetStudentExams(studentId); 

    if (!data || data.length === 0) {
      setExamData([]);
    } else {
      setExamData(data);
    }

    setShowExamModal(true);

  } catch (err) {
    console.error(err);
    setExamData([]);
    setShowExamModal(true);
  }
};
const handleDeleteExam = async (studentId:string) => {
  const confirm = await Swal.fire({
    icon: "warning",
    title: "Confirm Deletion",
    text: "Are you sure you want to delete this student?",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!"
  });

  if (confirm.isConfirmed) {
    try {
      await StudentMasterService.DeleteStudent(studentId);
      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Student has been deleted.",
      
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: "Error deleting student. Please try again.",
        confirmButtonText: "OK"
      });
    }
  }
};
// ================= SEARCH =================
  const [dataList, setDataList] = useState<FetchData[]>([]);

  const handleSearch = async () => {

    if (!searchCourse && !studentId && !Fname && !Mname && !Lname && !searchPrn) {

      setAlert({
        variant: "warning",
        title: "Input Required",
        message: "Please select branch OR enter search fields",
      });

      return;
    }

    setLoading(true);

    try {

      let data = [];

      if (searchCourse) {
        data = await StudentMasterService.GetByCourse(searchCourse);
      } else {
        data = await StudentMasterService.SearchStudents({
          studentId,
          firstName: Fname,
          middleName: Mname,
          lastName: Lname,
          studentPRN: searchPrn
        });
      }

      setDataList(data ?? []);

    } catch (err) {

      setAlert({
        variant: "warning",
        title: "Error",
        message: "Failed to fetch data",
      });

    } finally {
      setLoading(false);
    }
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    { key: "name", label: "Branch" },
    { key: "studentId", label: "Student ID" },
    { key: "studentName", label: "Student Name" },
    { key: "semesterId", label: "Semester" },
    { key: "studentPRN", label: "PRN" },
    {
    key: "edit",
    label: "Edit",
    render: (row:any) => (
      <button onClick={() => handleEdit(row.studentId)}>
        <FaEdit className="text-blue-600 hover:text-blue-800" />
      </button>
    )
  },

  {
    key: "viewExam",
    label: "View Exam",
    render: (row:any) => (
      <button onClick={() => handleViewExam(row.studentId)}>
        <FaEye className="text-green-600 hover:text-green-800" />
      </button>
    )
  },
   {
    key: "deleteExam",
    label: "Delete Exam",
    render: (row:any) => (
      <button onClick={() => handleDeleteExam(row.studentId)}>
        <FaTrash className="text-red-600 hover:text-red-800" />
      </button>
    )
  }
  ];

  // ================= DOWNLOAD EXCEL =================
const handleExcelDownload = async () => {
  try {
    if (!selectedCourse || !selectedSemester) {
      setAlert({
        variant: "warning",
        title: "Required",
        message: "Please select Branch and Semester",
      });
      return;
    }

    const response = await StudentMasterService.DownloadExcelTemplate(
      selectedCourse,
      selectedSemester,
     
    );

    const selectedCourseName =
      courseOptions.find(c => c.value === selectedCourse)?.label || "Course";

    const fileName = `${selectedCourseName}_Sem${selectedSemester}.xlsx`;

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed", error);
  }
};

  // ================= IMPORT CLICK VALIDATION =================
const handleImportClick = () => {
  const errors: string[] = [];

  if (!selectedCourse) errors.push("Please select Branch before importing");
  if (!selectedSemester) errors.push("Please select Semester before importing");
  if (gender !== "") errors.push("Gender must be unchecked for Excel Import");
  if (Dyslexia) errors.push("Dyslexia must be OFF for Excel Import");

  if (errors.length > 0) {
    setAlert({
      variant: "warning",
      title: "Validation Error",
      message: errors.join("\n"),
    });
    return;
  }

  // Open the file dialog
  fileInputRef.current?.click();
};
  // ================= IMPORT FILE =================
const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const errors: string[] = [];

  // Check if file name matches selected branch/semester
  const fileName = file.name.toLowerCase();
  if (!fileName.includes(selectedCourse.toLowerCase()) || !fileName.includes(selectedSemester.toLowerCase())) {
    errors.push("File name must match selected Branch and Semester");
  }

  if (errors.length > 0) {
    await Swal.fire({
      icon: "error",
      title: "Validation Error",
      html: `<pre style="text-align:left">${errors.join("\n")}</pre>`,
    });
    return;
  }

    // 2️⃣ Read Excel Data
    const data = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // 3️⃣ Validate Headers (Row 2 check)
    const headerRow = jsonData[1];
    const requiredHeaders = ["FirstName", "MiddleName", "LastName", "Category", "PRN", "Gender"];

    if (!headerRow || headerRow.length < requiredHeaders.length) {
      throw new Error("Invalid Excel format. Please download latest template.");
    }

    const isHeaderValid = requiredHeaders.every(
      (h, i) => headerRow[i]?.toString().trim().toLowerCase() === h.toLowerCase()
    );

    if (!isHeaderValid) {
      throw new Error("Invalid Excel format. Column headers do not match.");
    }

    // 4️⃣ Data Row Validation
    const dataRows = jsonData.slice(2);
    const validRows = dataRows.filter(row => 
      row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== "")
    );

    if (validRows.length === 0) {
      throw new Error("Excel must contain at least 1 data row.");
    }

    // 5️⃣ Frontend Duplicate Check (Optional but good for UX)
    const students = await StudentMasterService.GetData();
    const existingPRNs = new Set(
      students.map((s: any) => s.studentPRN?.toString().trim().toUpperCase())
    );
    const seenInExcel = new Set<string>();

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const rowNum = i + 3;
      const firstName = row[0]?.toString().trim();
      const lastName = row[2]?.toString().trim();
      const prnRaw = row[4]?.toString().trim();
      const prn = prnRaw?.toUpperCase();
      const gender = row[5]?.toString().trim().toLowerCase();

      if (!firstName) errors.push(`Row ${rowNum}: FirstName missing`);
      if (!lastName) errors.push(`Row ${rowNum}: LastName missing`);
      
      if (prn) {
        if (existingPRNs.has(prn)) errors.push(`Row ${rowNum}: PRN '${prnRaw}' already exists in database`);
        if (seenInExcel.has(prn)) errors.push(`Row ${rowNum}: PRN '${prnRaw}' is duplicated in Excel`);
        seenInExcel.add(prn);
      }

      if (gender && gender !== "male" && gender !== "female") {
        errors.push(`Row ${rowNum}: Gender must be Male or Female`);
      }
    }

    // Client-side errors dikhane ke liye
    if (errors.length > 0) {
      await Swal.fire({
        icon: "error",
        title: "Validation Errors",
        html: `<div style="text-align:left; max-height:300px; overflow-y:auto;"><pre>${errors.join("\n")}</pre></div>`,
      });
      return;
    }

    // 6️⃣ API Call & Server Error Handling
    const response = await StudentMasterService.ImportStudents(
      file,
      selectedCourse,
      selectedSemester
    );

    // API structure: { "message": { "success": false, "errors": [...] } }
    const result = response?.data?.message || response?.data;

    if (result?.success === true) {
      await Swal.fire({
        icon: "success",
        title: "Import Successful",
        text: "All students have been imported.",
      });
      handleRefresh();
    } else {
      // Backend PRN errors yahan catch honge
      const serverErrors = result?.errors || result?.Errors || ["Unknown error occurred"];
      await Swal.fire({
        icon: "error",
        title: "Import Failed",
        html: `<div style="text-align:left; max-height:300px; overflow-y:auto;"><pre>${serverErrors.join("\n")}</pre></div>`,
      });
    }

  } catch (err: any) {
    // Agar API 400/500 throw kare toh yahan handle hoga
    const apiErrorMsg = err.response?.data?.message?.errors || [err.message || "Import Failed"];
    await Swal.fire({
      icon: "error",
      title: "Server Error",
      html: `<div style="text-align:left;"><pre>${apiErrorMsg.join("\n")}</pre></div>`,
    });
  } finally {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};
return (
    <>
      {/* Top right toggle */}
      {/* <div className="flex justify-end mb-4 space-x-1 md:space-x-2">
        <button
          onClick={() => { clearAllFields(); setMode("search"); }}
          className={`px-4 py-2 text-sm font-medium rounded-l-md border border-blue-600 ${
            mode === "new" ? "bg-blue-600 text-white" : "bg-white text-blue-600"
          }`}
        >
          New Student
        </button>
        <button
          onClick={() => { clearAllFields(); setMode("search"); }}
          className={`px-4 py-2 text-sm font-medium rounded-r-md border border-blue-600 ${
            mode === "search" ? "bg-blue-600 text-white" : "bg-white text-blue-600"
          }`}
        >
          Search Student
        </button>
      </div> */}

<ComponentCard title="Student Master">

  {alert && (
    <Alert variant={alert.variant} title={alert.title} message={alert.message} />
  )}

  {/* MAIN GRID with vertical centering */}
  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-Start">

    {/* LEFT FORM */}
    <div className="space-y-5 xl:col-span-3">

<div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">

  {/* Branch */}
  <Select
    options={courseOptions}
    placeholder="Branch"
    value={selectedCourse}
    onChange={setSelectedCourse}
  />

  {/* Semester */}
  <Select
    options={semesterOptions}
    placeholder="Semester"
    value={selectedSemester}
    onChange={setSelectedSemester}
  />

  {/* Buttons */}
 <div className="flex w-full rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm">
  <button
    disabled={isEditMode|| firstname.trim() !== ""}
    onClick={handleExcelDownload}
    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 text-sm"
    type="button"
  >
    <FaFileExcel />
    Export
  </button>

  <button
  disabled={isEditMode || firstname.trim() !== ""}
  onClick={handleImportClick}
    className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 border-l border-gray-300 px-3 py-2 text-sm"
    type="button"
  >
    <FaFileImport />
    Import
  </button>
</div>
  {/* Hidden File Input */}
<input
  ref={fileInputRef}
  type="file"
  accept=".xlsx"
  className="hidden"
  onChange={handleImportFile}   // ✅ correct
/>

</div>

      {/* ROW 2: Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Input
          label="First Name"
          className="h-9 text-sm max-w-xs"
          value={firstname}
          onChange={(e) => {
            const v = e.target.value;
            if (/^[A-Za-z ]*$/.test(v) && v.length <= 15) setFirstName(v);
          }}
        />

        <Input
          label="Middle Name"
          className="h-9 text-sm max-w-xs"
          value={middlename}
          onChange={(e) => {
            const v = e.target.value;
            if (/^[A-Za-z ]*$/.test(v) && v.length <= 15) setMidleName(v);
          }}
        />

        <Input
          label="Last Name"
          className="h-9 text-sm max-w-xs"
          value={lastname}
          onChange={(e) => {
            const v = e.target.value;
            if (/^[A-Za-z ]*$/.test(v) && v.length <= 15) setLastName(v);
          }}
        />

      </div>

      {/* ROW 3: Category PRN Gender Dyslexia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-center">

        <Input
          label="Category"
          className="h-9 text-sm max-w-xs"
          value={category}
          onChange={(e) => {
            const v = e.target.value;
            if (/^[A-Za-z ]*$/.test(v) && v.length <= 20) setCategory(v);
          }}
        />

        <Input
          label="PRN"
          className="h-9 text-sm max-w-xs"
          value={prn}
          onChange={(e) => {
            const v = e.target.value;
            if (/^\d*$/.test(v) && v.length <= 15) setPrn(v);
          }}
        />

        {/* Gender */}
        <div className="flex items-center gap-4 mt-2 xl:mt-5 ">

          <Radio
            id="male"
            name="gender"
            value="Male"
            label="Male"
            checked={gender === "Male"}
            onChange={(value) => setGender(value as "Male")}
          />

          <Radio
            id="female"
            name="gender"
            value="Female"
            label="Female"
            checked={gender === "Female"}
            onChange={(value) => setGender(value as "Female")}
          />

        </div>

        {/* Dyslexia */}
        <div className="mt-2 xl:mt-5">
          <Switch
            key={refreshKey}
            label="Dyslexia Student"
            defaultChecked={Dyslexia}
            onChange={setDyslexia}
          />
        </div>

      </div>
    </div>
      {/* Photos*/}
<div className="w-full flex justify-center">
<div
  className="relative w-24 h-24 md:w-28 md:h-28 lg:w-36 lg:h-36 border-4 border-dashed border-blue-500 rounded-full p-1 "
  style={{ perspective: "1000px" }}
>
  <div
    className="relative w-full h-full rounded-full transition-transform duration-500"
    style={{
      transformStyle: "preserve-3d",
      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
    }}
  >
    {/* PHOTO (Front) */}
    <label
      className="absolute w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer"
      style={{ backfaceVisibility: "hidden" }}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />
      {photo ? (
  <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" />
) : photoUrl ? (
  <img src={photoUrl} className="w-full h-full object-cover" />
) : (
  <span className="text-gray-400 text-sm select-none">Upload Photo</span>
)}
    </label>

    {/* SIGNATURE (Back) */}
    <label
      className="absolute w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer"
      style={{
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSignatureUpload}
      />
     {/* ... similarly for signature */}
{signature ? (
  <img src={URL.createObjectURL(signature)} className="w-full h-full object-cover" />
) : signatureUrl ? (
  <img src={signatureUrl} className="w-full h-full object-cover" />
) : (
  <span className="text-gray-400 text-sm select-none">Upload Signature</span>
)}
    </label>
  </div>

  {/* FLIP BUTTON */}
 <div className="w-full flex justify-center mt-3">
  <button
    onClick={() => setIsFlipped(!isFlipped)}
    className="w-80 px-4 py-1 text-sm rounded-md flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 select-none"
    aria-label="Flip photo and signature"
  >
    <FaSync className={`text-xs ${isFlipped ? "rotate-270" : "rotate-90"}`} />
    {isFlipped ? "Flip for Photo" : "Flip for Signature"}
  </button>
</div>
</div>
</div>
</div>
  {/* Main Buttons */}
  <div className="flex flex-wrap justify-center gap-3 mt-6">

<Button
  onClick={isEditMode ? handleUpdate : handleSave}
  className={`w-44 flex items-center gap-2 px-3 py-1 text-sm rounded-md ${
    isEditMode
      ? "bg-purple-800 text-white hover:bg-purple-900"
      : "bg-blue-600 text-white hover:bg-blue-700"
  }`}
>
  {isEditMode ? <FaEdit className="text-sm" /> : <FaSave className="text-sm" />}
  {isEditMode ? "Update" : "Save"}
</Button>

    <Button
      variant="outline"
      onClick={handleRefresh}
      className="w-44 flex items-center gap-2 px-3 py-1 text-sm rounded-md"
    >
      <FaSyncAlt className="text-sm" />
      Refresh
    </Button>

 
  </div>

</ComponentCard>
      {/* SEARCH CARD */}
      {(
        <ComponentCard title="Search Student" className="mt-2 dark:border-white">

          <div className="-mt grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <Select
              options={courseOptions}
              placeholder="Select Branch"
              value={searchCourse}
              onChange={setSearchCourse}
              disabled={loading}
            />

            <Input
              label="Enter Student ID"
              value={studentId}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z0-9]*$/.test(value) && value.length <= 8) {
                  setStudentId(value);
                }
              }}
              disabled={!!searchCourse}
            />

            <Input
              label="Enter FirstName"
              value={Fname}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z ]*$/.test(value) && value.length <= 20) {
                  setfname(value);
                }
              }}
              disabled={!!searchCourse}
            />

            <Input
              label="Enter MiddleName"
              value={Mname}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z ]*$/.test(value) && value.length <= 20) {
                  setMname(value);
                }
              }}
              disabled={!!searchCourse}
            />

            <Input
              label="Enter LastName"
              value={Lname}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z ]*$/.test(value) && value.length <= 20) {
                  setLname(value);
                }
              }}
              disabled={!!searchCourse}
            />

            <Input
              label="Enter PRN"
              value={searchPrn}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value) && value.length <= 15) {
                  setSearchPrn(value);
                }
              }}
              disabled={!!searchCourse}
            />
          </div>

          <div className="flex gap-3 mt-4 items-center">

            <Button
              variant="primary"
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 px-3 py-1.5 min-h-[36px] w-40"
            >
              <FaSearch className="text-sm" />
              GetData
            </Button>

            <Button
              variant="outline"
              onClick={handleRefreshData}
              className="flex items-center justify-center gap-2 px-3 py-1.5 min-h-[36px] w-40"
            >
              <FaSyncAlt className="text-sm" />
              Refresh
            </Button>
          </div>

          {!loading && dataList.length > 0 && (
            <DataTable
              key={`${dataList.length}-${searchCourse}`}
              data={dataList}
              columns={columns}
              searchKeys={["studentId", "studentName", "studentPRN"]}
              filters={filters}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          )}
        </ComponentCard>
      )}

{showExamModal && (
  <div className="fixed inset-0 flex justify-center items-start pt-10 z-50">
    <div className="bg-white rounded-lg shadow-lg w-[800px] p-4 border">

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-lg font-semibold">Exam Details</h2>
        <button onClick={() => setShowExamModal(false)}>✖</button>
      </div>

      {/* Content */}
      {examData.length > 0 ? (
        <table className="w-full mt-4 border">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2">Student ID</th>
              <th className="p-2">Exam</th>
              <th className="p-2">Remark</th>
              <th className="p-2">Exam Date</th>
              <th className="p-2">Semester</th>
              <th className="p-2">Pattern</th>
              <th className="p-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {examData.map((item, index) => (
              <tr key={index} className="text-center border-t">
                <td className="p-2">{item.studentId}</td>
                <td className="p-2">{item.exam}</td>
                <td className="p-2">{item.remark}</td>
                <td className="p-2">{item.examDate}</td>
                <td className="p-2">{item.semester}</td>
                <td className="p-2">{item.pattern}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDeleteExam(item.examId)}
                    className="text-red-600"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center mt-6 text-red-600">
          No Exam Assigned to this Student
        </p>
      )}

      {/* Footer */}
      {examData.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => handleDeleteExam(selectedStudentId!)}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Delete
          </button>
        </div>
      )}

    </div>
  </div>
)}
    </>
  );
}

          



