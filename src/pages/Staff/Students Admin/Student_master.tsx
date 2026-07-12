// import { useEffect, useState } from "react";
// import ComponentCard from "../../../components/common/ComponentCard";
// import Select from "../../../components/form/Select";
// import { StudentMasterService } from "../../../services/Student_MasterService";
// import Input from "../../../components/form/input/InputField";
// import Radio from "../../../components/form/input/Radio";
// import Switch from "../../../components/form/switch/Switch";
// import Button from "../../../components/ui/button/Button";
// import Alert from "../../../components/ui/alert/Alert";
// import Swal from "sweetalert2";

// interface SelectOption {
//   value: string;
//   label: string;
// }

// export default function StudentMaster() {
//   const [loading, setLoading] = useState(false);
//   //save card
//   const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState("");
//   const [selectedSemester, setSelectedSemester] = useState("");
//   const [firstname, setFirstName] = useState("");
//   const [middlename, setMidleName] = useState("");
//   const [lastname, setLastName] = useState("");
//   const [category, setCategory] = useState("");
//   const [prn, setPrn] = useState("");
//   const [gender, setGender] = useState<"Male" | "Female" | "">("");
//   const [Dyslexia, setDyslexia] = useState(false);
//   //search card
//   const [searchCourse, setSearchCourse] = useState("");
//   const [studentId, setStudentId] = useState("");
//   const [Fname, setfname] = useState("");
//   const [Mname, setMname] = useState("");
//   const [Lname, setLname] = useState("");
//   const [searchPrn, setSearchPrn] = useState("");
// //Refresh 
// const [refreshKey, setRefreshKey] = useState(0);

// const handleRefresh = () => {
//   setSelectedCourse("");
//   setSelectedSemester("");
//   setFirstName("");
//   setMidleName("");
//   setLastName("");
//   setCategory("");
//   setPrn("");
//   setGender("");
//   setDyslexia(false); 
//   setRefreshKey(prev => prev + 1);
// };

// // //Fetch Detail
// // const handleSearch = async () => {
// //   if (
// //     !searchCourse &&
// //     !studentId &&
// //     !searchPrn &&
// //     !Fname &&
// //     !Mname &&
// //     !Lname
// //   ) {
// //     setAlert({
// //       variant: "warning",
// //       title: "Permission Required",
// //       message: "Enter at least one search field",
// //     });
// //     return;
// //   }

// //   let payload: any = {};

// //   // If branch selected → ignore other fields
// //   if (searchCourse) {
// //     payload.branch = searchCourse;
// //   } else {
// //     if (studentId) payload.studentId = studentId;
// //     if (searchPrn) payload.prn = searchPrn;
// //     if (Fname) payload.firstname = Fname;
// //     if (Mname) payload.middlename = Mname;
// //     if (Lname) payload.lastname = Lname;
// //   }

// //   console.log("Search Payload:", payload);

// //   // Later call API here
// //   // const res = await StudentMasterService.SearchStudent(payload);
// // };


//   // toggle switch
//   const [mode, setMode] = useState<"new" | "search">("new");

//   const semesterOptions: SelectOption[] = [
//     { value: "Semester I", label: "Semester I" },
//     { value: "Semester II", label: "Semester II" },
//     { value: "Semester III", label: "Semester III" },
//     { value: "Semester IV", label: "Semester IV" },
//   ];

//   const fetchCourses = async () => {
//     setLoading(true);
//     try {
//       const data = await StudentMasterService.GetData();
//       const formatted = (data ?? []).map((c) => ({
//         value: c.courseId,
//         label: c.name,
//       }));

//       setCourseOptions(formatted);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const [alert, setAlert] = useState<{
//     variant: "warning";
//     title: string;
//     message: string;
//   } | null>(null);


//   useEffect(() => {
//     if (alert) {
//       const timer = setTimeout(() => setAlert(null), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [alert]);

//   const handleSave = async () => {
//     if (!selectedCourse || !selectedSemester || !firstname || !lastname || !category || !prn || !gender
//     ) {
//       setAlert({
//         variant: "warning",
//         title: "Permission Required",
//         message: "Fill all the Required Fields ",
//       });
//       return;
//     }
//     const payload = {
//       courseId: selectedCourse,
//       semesterId: selectedSemester,
//       firstname: firstname,
//       middlename: middlename || null,
//       lastname: lastname,
//       category: category || null,
//       studentprn: prn,
//       gender: gender,
//       dyslexia: Dyslexia,
//     };
//     try {
// const res = await StudentMasterService.SaveStudent(payload);

// const studentId = res.data.studentId; 

//       await Swal.fire({
//         icon: "success",
//         title: "Saved Successfully!",
//         text: `Student ID: ${studentId}`,

//         confirmButtonText: "OK"
//       });
//      window.location.reload();
//     } catch (err) {
//       console.error(err);

//       await Swal.fire({
//         icon: "error",
//         title: "Save Failed",
//         text: "Error saving student. Please try again.",
//         confirmButtonText: "OK"
//       });
//       window.location.reload();
//     }

//   };

//   useEffect(() => {
//     fetchCourses();
//   }, []);

//   return (
//     <>
//       <div className="relative">
//         <div className="static mb-4 flex justify-end md:absolute md:top-5 md:right-6 md:mb-0 z-10">
//           <div className="flex w-full md:w-auto rounded-lg border border-blue-600 overflow-hidden">
//             <button
//               onClick={() => setMode("new")}
//               className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium ${mode === "new"
//                 ? "bg-blue-600 text-white"
//                 : "bg-white text-blue-600"
//                 }`}
//             >
//               New Student
//             </button>
//             <button
//               onClick={() => setMode("search")}
//               className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium border-l border-blue-600 ${mode === "search"
//                 ? "bg-blue-600 text-white"
//                 : "bg-white text-blue-600"
//                 }`}
//             >
//               Search Student
//             </button>
//           </div>
//         </div>

//         <ComponentCard title="Student Master">
//           {alert && (
//             <Alert
//               variant={alert.variant}
//               title={alert.title}
//               message={alert.message}
//             />
//           )}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <Select
//               options={courseOptions}
//               placeholder="Select Branch"
//               value={selectedCourse}
//               onChange={(value) => {
//                 setSelectedCourse(value);
//               }}
//             />
//             <Select
//               options={semesterOptions}
//               placeholder="Select Semester"
//               value={selectedSemester}
//               onChange={setSelectedSemester}
//             />
//           </div>

//           <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
//             <Input
//               label="Enter FirstName"
//               value={firstname}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^[A-Za-z ]*$/.test(value) && value.length <= 10) {
//                   setFirstName(value);
//                 }
//               }}
//             />
//             <Input
//               label="Enter MiddleName"
//               value={middlename}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^[A-Za-z ]*$/.test(value) && value.length <= 15) {
//                   setMidleName(value);
//                 }
//               }}
//             />
//             <Input
//               label="Enter LastName"
//               value={lastname}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^[A-Za-z ]*$/.test(value) && value.length <= 15) {
//                   setLastName(value);
//                 }
//               }}
//             />
//             <Input
//               label="Enter Category"
//               value={category}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^[A-Za-z ]*$/.test(value) && value.length <= 20) {
//                   setCategory(value);
//                 }
//               }}
//             />
//             <Input
//               label="Enter PRN"
//               value={prn}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^\d*$/.test(value) && value.length <= 15) {
//                   setPrn(value);
//                 }
//               }}
//             />
//           </div>
//           <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
//             <div className="flex items-center gap-5">
//               <Radio
//                 id="male"
//                 name="gender"
//                 value="Male"
//                 label="Male"
//                 checked={gender === "Male"}
//                 onChange={(value) => setGender(value as "Male")}
//               />
//               <Radio
//                 id="female"
//                 name="gender"
//                 value="Female"
//                 label="Female"
//                 checked={gender === "Female"}
//                 onChange={(value) => setGender(value as "Female")}
//               />


//               <div className="flex items-center gap-2 whitespace-nowrap">
//                 {/* <Switch
//                   label="Dyslexia Student"
//                   defaultChecked={Dyslexia}
//                   onChange={(checked) => setDyslexia(checked)}
//                 /> */}
//                 <Switch
//   key={refreshKey}
//   label="Dyslexia Student"
//   defaultChecked={Dyslexia}
//   onChange={(checked) => setDyslexia(checked)}
// />
//               </div>
//             </div>
//           </div>

//           <div className="mt-4 grid grid-cols-6 gap-4">
//             <div className="col-start-3 flex gap-3">
//               <Button variant="primary" onClick={handleSave}>Save</Button>
//              <Button variant="outline" onClick={handleRefresh}>Refresh</Button>
//             </div>
//           </div>
//         </ComponentCard>
//       </div>

//       {/* ================= SEARCH CARD ================= */}
//       {mode === "search" && (
//         <ComponentCard title="" className="mt-2 dark:border-white">
//           {/* Pull content up to remove top border */}
//           <div className="-mt-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
//             <Select
//               options={courseOptions}
//               placeholder="Select Branch"
//               value={searchCourse}
//               onChange={setSearchCourse}
//               disabled={loading}
//             />

//             <Input
//               label="Enter Student ID"
//               value={studentId}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^[A-Za-z0-9]*$/.test(value) && value.length <= 8) {
//                   setStudentId(value);
//                 }
//               }}
//               disabled={!!searchCourse}  
//             />

//             <Input
//               label="Enter FirstName"
//               value={Fname}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^[A-Za-z ]*$/.test(value) && value.length <= 20) {
//                   setfname(value);
//                 }
//               }}
//               disabled={!!searchCourse}  
//             />

//             <Input
//               label="Enter MiddleName"
//               value={Mname}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^[A-Za-z ]*$/.test(value) && value.length <= 20) {
//                   setMname(value);
//                 }
//               }}
//               disabled={!!searchCourse}               
//             />

//             <Input
//               label="Enter LastName"
//               value={Lname}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^[A-Za-z ]*$/.test(value) && value.length <= 20) {
//                   setLname(value);
//                 }
//               }}
//               disabled={!!searchCourse}  
//             />

//             <Input
//               label="Enter PRN"
//               value={searchPrn}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 if (/^\d*$/.test(value) && value.length <= 15) {
//                   setSearchPrn(value);
//                 }
//               }}
//               disabled={!!searchCourse}  
//             />
//           </div>

//           <Button
//             variant="primary"
//             className="col-start-3 flex gap-3"

//           >
//             GetData
//           </Button>
//         </ComponentCard>
//       )}

//     </>
//   );
// }
//===============================================================
import { useEffect, useState, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { StudentMasterService } from "../../../services/Student_MasterService";
import Input from "../../../components/form/input/InputField";
import Radio from "../../../components/form/input/Radio";
import Switch from "../../../components/form/switch/Switch";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import Swal from "sweetalert2";
import DataTable from "../../../components/ui/table/DataTable";
import { FaFileExcel } from "react-icons/fa";

interface SelectOption {
  value: string;
  label: string;
}

interface FetchData {
  name: string;
  studentId: string;
  firstName: string;
  lastName: string;
  studentNmae: string;
  semesterId: string;
  studentPRN: string;
}


export default function StudentMaster() {
  const [loading, setLoading] = useState(false);
  //save card
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
  //search card
  const [searchCourse, setSearchCourse] = useState("");
  const [studentId, setStudentId] = useState("");
  const [Fname, setfname] = useState("");
  const [Mname, setMname] = useState("");
  const [Lname, setLname] = useState("");
  const [searchPrn, setSearchPrn] = useState("");
  //Refresh 
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setSelectedCourse("");
    setSelectedSemester("");
    setFirstName("");
    setMidleName("");
    setLastName("");
    setCategory("");
    setPrn("");
    setGender("");
    setDyslexia(false);
    setRefreshKey(prev => prev + 1);
    setSearchPrn("");
    setLname("");
    setMname("");
    setfname("");
    setStudentId("");
    setSearchCourse("");
    setDataList([]);
    setMode("new");

  };
  //clear field 
  const clearAllFields = () => {
    // New Student Fields
    setSelectedCourse("");
    setSelectedSemester("");
    setFirstName("");
    setMidleName("");
    setLastName("");
    setCategory("");
    setPrn("");
    setGender("");
    setDyslexia(false);
    setRefreshKey(prev => prev + 1);

    // Search Student Fields
    setSearchCourse("");
    setStudentId("");
    setfname("");
    setMname("");
    setLname("");
    setSearchPrn("");
    setDataList([]);
  };

  //

  // toggle switch
  const [mode, setMode] = useState<"new" | "search">("new");

  const semesterOptions: SelectOption[] = [
    { value: "Semester I", label: "Semester I" },
    { value: "Semester II", label: "Semester II" },
    { value: "Semester III", label: "Semester III" },
    { value: "Semester IV", label: "Semester IV" },
  ];

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await StudentMasterService.GetData();
      const formatted = (data ?? []).map((c) => ({
        value: c.courseId,
        label: c.name,
      }));

      setCourseOptions(formatted);
    } finally {
      setLoading(false);
    }
  };

  //fiter
  const filters = useMemo(() => ({}), []);

  const [alert, setAlert] = useState<{
    variant: "warning";
    title: string;
    message: string;
  } | null>(null);


  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSave = async () => {
    if (!selectedCourse || !selectedSemester || !firstname || !lastname || !category || !prn || !gender
    ) {
      setAlert({
        variant: "warning",
        title: "Permission Required",
        message: "Fill all the Required Fields ",
      });
      return;
    }
    const payload = {
      courseId: selectedCourse,
      semesterId: selectedSemester,
      firstname: firstname,
      middlename: middlename || null,
      lastname: lastname,
      category: category || null,
      studentprn: prn,
      gender: gender,
      dyslexia: Dyslexia,
    };
    try {
      const res = await StudentMasterService.SaveStudent(payload);

      const studentId = res.data.studentId;

      await Swal.fire({
        icon: "success",
        title: "Saved Successfully!",
        text: `Student ID: ${studentId}`,

        confirmButtonText: "OK"
      });
      window.location.reload();
    } catch (err) {
      console.error(err);

      await Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: "Error saving student. Please try again.",
        confirmButtonText: "OK"
      });
      window.location.reload();
    }

  };

  useEffect(() => {
    fetchCourses();
  }, []);

  //searchbycourse
  const [dataList, setDataList] = useState<FetchData[]>([]);

  const [alert2, setAlert2] = useState<{
    variant: "warning";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (alert2) {
      const timer = setTimeout(() => setAlert2(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert2]);

  // ✅ SEARCH FUNCTION (NOT another export)
  // const handleSearch = async () => {
  //   if (!searchCourse) {
  //     setAlert2({
  //       variant: "warning",
  //       title: "Course Required",
  //       message: "Please select or Enter atleast one field",
  //     });
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const data = await StudentMasterService.GetByCourse(searchCourse);

  //     setDataList(data ?? []);
  //   } catch (err) {

  //     setAlert2({
  //       variant: "warning",
  //       title: "Error",
  //       message: "Failed to fetch data",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  //search with both
  const handleSearch = async () => {

    if (
      !searchCourse &&
      !studentId &&
      !Fname &&
      !Mname &&
      !Lname &&
      !searchPrn
    ) {
      setAlert2({
        variant: "warning",
        title: "Input Required",
        message: "Please select branch OR enter search fields",
      });
      return;
    }

    setLoading(true);

    try {

      let data = [];

      // ✅ CASE 1: Branch selected → use existing API
      if (searchCourse) {

        data = await StudentMasterService.GetByCourse(searchCourse);

      }
      // ✅ CASE 2: Search using fields
      else {

        data = await StudentMasterService.SearchStudents({
          studentId,
          firstName: Fname,
          middleName: Mname,
          lastName: Lname,
          studentPRN: searchPrn,

        });

      }

      setDataList(data ?? []);

    } catch (err) {

      setAlert2({
        variant: "warning",
        title: "Error",
        message: "Failed to fetch data",
      });

    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "name", label: "Branch" },
    { key: "studentId", label: "Student ID" },
    { key: "studentName", label: "Student Name" },
    { key: "semesterId", label: "Semester" },
    { key: "studentPRN", label: "PRN" },
    { key: "edit", label: "Edit" },
    { key: "delete", label: "Delete" },
  ];

  //
  return (
    <>
      <div className="relative">
        <div className="static mb-4 flex justify-end md:absolute md:top-5 md:right-6 md:mb-0 z-10">
          {/* <div className="flex w-full md:w-auto rounded-lg border border-blue-600 overflow-hidden">
            <button
              onClick={() => setMode("new")}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium ${mode === "new"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
                }`}
            >
              New Student
            </button>
            <button
              onClick={() => setMode("search")}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium border-l border-blue-600 ${mode === "search"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
                }`}
            >
              Search Student
            </button>
          </div> */}
          <div className="flex w-full md:w-auto rounded-lg border border-blue-600 overflow-hidden">
            <button
              onClick={() => {
                clearAllFields(); // clear first
                setMode("new");   // then switch to new student
              }}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium ${mode === "new"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
                }`}
            >
              New Student
            </button>
            <button
              onClick={() => {
                clearAllFields(); // clear first
                setMode("search"); // then switch to search student
              }}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium border-l border-blue-600 ${mode === "search"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600"
                }`}
            >
              Search Student
            </button>
          </div>
        </div>

        <ComponentCard title="Student Master">
          {alert && (
            <Alert
              variant={alert.variant}
              title={alert.title}
              message={alert.message}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              options={courseOptions}
              placeholder="Select Branch"
              value={selectedCourse}
              onChange={(value) => {
                setSelectedCourse(value);
              }}
            />
            <Select
              options={semesterOptions}
              placeholder="Select Semester"
              value={selectedSemester}
              onChange={setSelectedSemester}
            />
           <div className="flex">
              <div className="flex rounded-lg border border-white-600 overflow-hidden"> 
                <button 
                  className="flex items-center gap-4 px-4 py-2 text-sm font-medium bg-green-600 text-white"
                >
                  <FaFileExcel className="text-lg" />
                  Excel
                </button> 
                <button 
                  className="px-4 py-2 text-md font-medium border-l border-blue-600 bg-white text-blue-600"
                >
                  Import         
                </button> 
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              label="Enter FirstName"
              value={firstname}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z ]*$/.test(value) && value.length <= 10) {
                  setFirstName(value);
                }
              }}
            />
            <Input
              label="Enter MiddleName"
              value={middlename}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z ]*$/.test(value) && value.length <= 15) {
                  setMidleName(value);
                }
              }}
            />
            <Input
              label="Enter LastName"
              value={lastname}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z ]*$/.test(value) && value.length <= 15) {
                  setLastName(value);
                }
              }}
            />
            <Input
              label="Enter Category"
              value={category}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z ]*$/.test(value) && value.length <= 20) {
                  setCategory(value);
                }
              }}
            />
            <Input
              label="Enter PRN"
              value={prn}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value) && value.length <= 15) {
                  setPrn(value);
                }
              }}
            />
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="flex items-center gap-5">
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


              <div className="flex items-center gap-2 whitespace-nowrap">
                {/* <Switch
                  label="Dyslexia Student"
                  defaultChecked={Dyslexia}
                  onChange={(checked) => setDyslexia(checked)}
                /> */}
                <Switch
                  key={refreshKey}
                  label="Dyslexia Student"
                  defaultChecked={Dyslexia}
                  onChange={(checked) => setDyslexia(checked)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-6 gap-4">
            <div className="col-start-3 flex gap-3">
              <Button variant="primary" onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={handleRefresh}>Refresh</Button>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* ================= SEARCH CARD ================= */}
      {mode === "search" && (
        <ComponentCard title="" className="mt-2 dark:border-white">
          {alert2 && (
            <Alert
              variant={alert2.variant}
              title={alert2.title}
              message={alert2.message}
            />
          )}
          {/* Pull content up to remove top border */}
          <div className="-mt-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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

          <Button
            variant="primary"
            className="col-start-3 flex gap-3"
            onClick={handleSearch}
          >
            GetData
          </Button>
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

    </>
  );
}
