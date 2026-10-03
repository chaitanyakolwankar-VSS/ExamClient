import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta"; 
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import { CourseApiResponse,CourseService } from "../../../services/Course";
import { PatternApiResponse,PatternService } from "../../../services/Pattern";
import Swal from "sweetalert2";
import { ExamApiRequest ,ExamApiResponse} from "../../../services/RegularExamService";
import { ATKTCommulativeReportService,HeadTypeRequest,HeadTypeResponse ,AtktReportRequest,AtktReportResponse} from "../../../services/ATKTCommulativeReportService";
import { Save, StretchVertical } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import DataTable from "../../../components/ui/table/DataTable";

interface Option {
  value: string;
  label: string;
}

export default function ATKTCommulativeReport() {
  // 🔹 Course
  const [courseOptions, setCourseOptions] = useState<Option[]>([]);
  const [courseId, setCourseId] = useState("");

  // 🔹 Pattern
  const [patternOptions, setPatternOptions] = useState<Option[]>([]);
  const [pattern, setPattern] = useState("");

  // 🔹 Exam
  const [ExamOptions, setExamOptions] = useState<Option[]>([]);
  const [Exam, setExam] = useState("");

  // 🔹 Head Type
  const [HeadTypeOptions, setHeadTypeOptions] = useState<Option[]>([]);
  const [HeadType, setHeadType] = useState("");

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
  useEffect(() => {
    fetchCourses();
  }, []);
  
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
     const fetchexam = async () => {
        try {
          const ayid = localStorage.getItem("AYID");
          if (!ayid) {
            return Swal.fire("Error", "Academic Year is missing", "error");
          }
    
    
          const parameter: ExamApiRequest = {
            Courseid: courseId,
            Ayid: ayid
          }
          const data: ExamApiResponse[] = await ATKTCommulativeReportService.getExam(parameter);
          console.log("EXAM API RAW RESPONSE 👉", data);
          const mappedData = data.map((e) => ({
            value: e.examId,
            label: e.examname
          }));
    
          setExamOptions(mappedData); // ✅ update state
        } catch (error) {
          console.error("Failed to fetch exam", error);
        }
      };
       const fetchheadtype = async (examId: string) => {
    try {
        const ayid = localStorage.getItem("AYID");

        if (!ayid) {
            return Swal.fire("Error", "Academic Year is missing", "error");
        }

        const parameter: HeadTypeRequest = {
            Ayid: ayid,
            Pattern: pattern,
            Semester: semester,
            ExamId: examId
        };

        const data: HeadTypeResponse[] =
            await ATKTCommulativeReportService.getHeadType(parameter);


        const mappedData = data.map((e) => ({
            value: e.headType,
            label: e.headType
        }));

        setHeadTypeOptions(mappedData);
    } catch (error) {
        console.error("Failed to fetch head type", error);
    }
};
const exportToExcel = async () => {
    const ayid = localStorage.getItem("AYID");

    if (!ayid) {
        return Swal.fire(
            "Error",
            "Academic Year is missing",
            "error"
        );
    }

    const parameter: AtktReportRequest = {
        Ayid: ayid,
        Pattern: pattern,
        Semester: semester,
        ExamId: Exam,
        HeadType: HeadType
    };

    const data: AtktReportResponse[] =
        await ATKTCommulativeReportService.getAtktReportData(parameter);

    if (!data || data.length === 0) {
        return Swal.fire(
            "No Data",
            "No report data found",
            "info"
        );
    }

    const course = courseOptions.find(
        x => x.value === courseId
    );

    const courseName = course?.label || "";

    const exam = ExamOptions.find(
        x => x.value === Exam
    );

    const examName = exam?.label || "";

    const semesterName =
        semesterOptions.find(
            x => x.value === semester
        )?.label || semester;

    // Get distinct subject names
    const subjects = [
        ...new Set(
            data.map(x => x.subjectName)
        )
    ];

    // Get distinct seat numbers
    const seatNos = [
        ...new Set(
            data.map(x => x.seatNo)
        )
    ];

    const excelData: any[][] = [];

    // Total columns = Seat No + Subjects
    const totalColumns = subjects.length + 1;

    // Row 1 - Report Title
    excelData.push([
        `ATKT CUMMULATIVE REPORT OF ${courseName}`,
        ...Array(totalColumns - 1).fill("")
    ]);

    // Row 2 - Pattern and Semester
    excelData.push([
        `Pattern : ${pattern}    Semester : ${semesterName}`,
        ...Array(totalColumns - 1).fill("")
    ]);

    // Row 3 - Exam
    excelData.push([
        `Exam : ${examName}`,
        ...Array(totalColumns - 1).fill("")
    ]);

    // Row 4 - Seat No + Subject Names
    excelData.push([
        "Seat No",
        ...subjects
    ]);

    // Row 5 - Subject Criteria
    const criteriaRow: string[] = [""];

    subjects.forEach(subject => {

        const subjectData = data.find(
            x => x.subjectName === subject
        );

        criteriaRow.push(
            subjectData?.subjectCriteria || ""
        );
    });

    excelData.push(
        criteriaRow
    );

    // Student rows
    seatNos.forEach(seatNo => {

        const row: string[] = [];

        // First column - Seat No
        row.push(seatNo);

        subjects.forEach(subject => {

            const exists = data.some(
                x =>
                    x.seatNo === seatNo &&
                    x.subjectName === subject
            );

            row.push(
                exists ? seatNo : ""
            );
        });

        excelData.push(
            row
        );
    });

    // Total row
    const totalRow: string[] = ["Total"];

    subjects.forEach(subject => {

        const total = new Set(
            data
                .filter(
                    x => x.subjectName === subject
                )
                .map(
                    x => x.seatNo
                )
        ).size;

        totalRow.push(
            `Total : ${total}`
        );
    });

    excelData.push(
        totalRow
    );

    // Create worksheet
    const worksheet =
        XLSX.utils.aoa_to_sheet(
            excelData
        );

    const range =
        XLSX.utils.decode_range(
            worksheet["!ref"]!
        );

    // Common style for data area
    const commonStyle = {
        border: {
            top: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            bottom: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            left: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            },
            right: {
                style: "thin",
                color: {
                    rgb: "000000"
                }
            }
        },
        alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true
        }
    };

    // Apply border ONLY from Subject Name row
    // Row index 3 = Excel Row 4
    for (
        let row = 3;
        row <= range.e.r;
        row++
    ) {
        for (
            let col = 0;
            col < totalColumns;
            col++
        ) {

            const cellAddress =
                XLSX.utils.encode_cell({
                    r: row,
                    c: col
                });

            if (worksheet[cellAddress]) {
                worksheet[cellAddress].s = {
                    ...commonStyle
                };
            }
        }
    }

    // Title cell
    const titleCell =
        XLSX.utils.encode_cell({
            r: 0,
            c: 0
        });

    if (worksheet[titleCell]) {

        worksheet[titleCell].s = {
            font: {
                bold: true,
                sz: 16
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            }
        };
    }

    // Details cell
    const detailsCell =
        XLSX.utils.encode_cell({
            r: 1,
            c: 0
        });

    if (worksheet[detailsCell]) {

        worksheet[detailsCell].s = {
            font: {
                bold: true,
                sz: 12
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            }
        };
    }

    // Exam cell
    const examCell =
        XLSX.utils.encode_cell({
            r: 2,
            c: 0
        });

    if (worksheet[examCell]) {

        worksheet[examCell].s = {
            font: {
                bold: true,
                sz: 12
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            }
        };
    }

    // Seat No + Subject Name row
    for (
        let col = 0;
        col < totalColumns;
        col++
    ) {

        const cellAddress =
            XLSX.utils.encode_cell({
                r: 3,
                c: col
            });

        if (worksheet[cellAddress]) {

            worksheet[cellAddress].s = {
                ...commonStyle,
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true
                }
            };
        }
    }

    // Subject Criteria row
    for (
        let col = 0;
        col < totalColumns;
        col++
    ) {

        const cellAddress =
            XLSX.utils.encode_cell({
                r: 4,
                c: col
            });

        if (worksheet[cellAddress]) {

            worksheet[cellAddress].s = {
                ...commonStyle,
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true
                }
            };
        }
    }

    // Total row
    const totalRowIndex =
        excelData.length - 1;

    for (
        let col = 0;
        col < totalColumns;
        col++
    ) {

        const cellAddress =
            XLSX.utils.encode_cell({
                r: totalRowIndex,
                c: col
            });

        if (worksheet[cellAddress]) {

            worksheet[cellAddress].s = {
                ...commonStyle,
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true
                }
            };
        }
    }

    // Column width
    worksheet["!cols"] = [
        {
            wch: 15
        },
        ...subjects.map(
            subject => ({
                wch: Math.max(
                    subject.length + 5,
                    25
                )
            })
        )
    ];

    // Row heights
    worksheet["!rows"] = [
        { hpt: 35 }, // Title
        { hpt: 25 }, // Pattern + Semester
        { hpt: 25 }, // Exam
        { hpt: 45 }, // Seat No + Subject Name
        { hpt: 30 }  // Subject Criteria
    ];

    // Merge Title row
    worksheet["!merges"] = [
        {
            s: {
                r: 0,
                c: 0
            },
            e: {
                r: 0,
                c: totalColumns - 1
            }
        },
        {
            s: {
                r: 1,
                c: 0
            },
            e: {
                r: 1,
                c: totalColumns - 1
            }
        },
        {
            s: {
                r: 2,
                c: 0
            },
            e: {
                r: 2,
                c: totalColumns - 1
            }
        }
    ];

    // Create workbook
    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "ATKT Report"
    );

    // Download Excel
    XLSX.writeFile(
        workbook,
        "ATKT_Cumulative_Report.xlsx"
    );
};
const [atktReportData, setAtktReportData] =
    useState<AtktReportResponse[]>([]);


// ===============================
// GET ATKT REPORT DATA
// ===============================

const getAtktReportData = async (selectedHeadType: string) => {

  const ayid = localStorage.getItem("AYID");

  if (!ayid) {
    Swal.fire(
      "Error",
      "Academic Year is missing",
      "error"
    );
    return;
  }

  const parameter: AtktReportRequest = {
    Ayid: ayid,
    Pattern: pattern,
    Semester: semester,
    ExamId: Exam,
    HeadType: selectedHeadType
  };

  try {

    const data =
      await ATKTCommulativeReportService
        .getAtktReportData(parameter);

    if (!data || data.length === 0) {
      setAtktReportData([]);

      Swal.fire(
        "No Data",
        "No report data found",
        "info"
      );

      return;
    }

    setAtktReportData(data);

  } catch (error) {

    console.error(error);

    Swal.fire(
      "Error",
      "Failed to fetch ATKT report data",
      "error"
    );
  }
};

// ===============================
// SUBJECTS
// ===============================

const subjects = [
    ...new Set(
        atktReportData.map(
            x => x.subjectName
        )
    )
];


// ===============================
// SEAT NUMBERS
// ===============================

const seatNos = [
    ...new Set(
        atktReportData.map(
            x => x.seatNo
        )
    )
];


// ===============================
// TABLE DATA
// ===============================

const tableData = seatNos.map(seatNo => {

    const row: any = {

        seatNo: seatNo

    };

    subjects.forEach(subject => {

        const exists =
            atktReportData.some(
                x =>
                    x.seatNo === seatNo &&
                    x.subjectName === subject
            );

        row[subject] =
            exists ? seatNo : "";

    });

    return row;
});

// ===============================
// SUBJECT CRITERIA
// ===============================

const subjectCriteriaMap: Record<string, string> = {};

atktReportData.forEach((x) => {
    if (!subjectCriteriaMap[x.subjectName]) {
        subjectCriteriaMap[x.subjectName] =
            x.subjectCriteria || "";
    }
});
// ===============================
// TABLE COLUMNS
// ===============================

// ===============================
// TABLE COLUMNS
// ===============================

const columns = [

    {
        key: "seatNo",
        label: "Seat No"
    },

    ...subjects.map(subject => ({

        key: subject,

        label: `${subject} (${subjectCriteriaMap[subject] || ""})`

    }))

];
  return (
    <>
      <PageMeta
        title="Staff Dashboard"
        description="Welcome to the Staff Portal"
      />
      <ComponentCard title="ATKT Commulative Report">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 pt-5">
          {/* Course */}
          <Select
            options={courseOptions}
            placeholder="Select Course"
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setPattern("");
               setSemester("");
                setExam("");
                fetchPatterns(value);
                setAtktReportData([]);
                setHeadType("");
            }}
          />

          {/* Pattern */}
          {courseId && (
            <Select
              options={patternOptions}
              placeholder="Select Pattern"
              value={pattern}
              onChange={(value) => {
                setPattern(value);
                setSemester("");
                setExam("");
                setAtktReportData([]);
                setHeadType("");
                
              }}
            />
          )}


          {/* Semester */}
          {pattern && (
            <Select
              options={semesterOptions}
              placeholder="Select Semester"
              value={semester}
              onChange={(value) => { setSemester(value);setExam("");setHeadType("");setAtktReportData([]);fetchexam();  }}
            />
          )}

          {/* Exam */}
          {semester && (
            <Select
              options={ExamOptions}
              placeholder="Select Exam"
              value={Exam}   // 👈 IMPORTANT
              onChange={(value) => {
                setExam(value);setHeadType("");fetchheadtype(value);setAtktReportData([]);
              }}
            />
          )}
          {/* Head Type */}
         {Exam && (
  <Select
    options={HeadTypeOptions}
    placeholder="Select Head Type"
    value={HeadType}
    onChange={(value) => {
      setHeadType(value);
      setAtktReportData([]);

      // Head Type select hone ke baad hi report API call hogi
      getAtktReportData(value);
    }}
  />
)}
          {(HeadType && atktReportData.length > 0) && (
           <button className="min-w-64 bg-blue-600 text-white px-4 py-2 rounded-lg
             flex items-center justify-center gap-2"   onClick={() => exportToExcel()}>
                <Save size={18} />
                <span>Get Data</span></button>
          )}
       


        

</div>
{atktReportData.length > 0 && (

            
                <DataTable
                    data={tableData}
                    columns={columns}
                    searchKeys={["seatNo"]}
                />


        )}
</ComponentCard>
    </>
  );
}