import React, { useEffect, useState, useMemo } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import {
  useAcademicYear,
  useCourses,
  usePatterns,
  useSemesters,
  useExams,
  toCourseOptions,
  toPatternOptions,
  toSemesterOptions,
  toExamOptions,
} from "../../../data";
import Swal from "sweetalert2";
import Button from "../../../components/ui/button/Button";
import { Search } from "lucide-react";
import {
  StudentAssignReportRequest,
  StudentAssignReportResponse,
  StudentAssignRptService,
  StudentCreditReportResponse,
} from "../../../services/StudentAssignRptService";
import DataTable from "../../../components/ui/table/DataTable";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type ReportType = "assign" | "credit";

interface ReportColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

const assignColumns: ReportColumn[] = [
  { key: "seatNo", label: "Seat No.", sortable: true },
  { key: "studentID", label: "Student ID", sortable: true },
  { key: "name", label: "Student Name", sortable: true },
  { key: "subjectCode", label: "Subject Code", sortable: true },
  { key: "subjectName", label: "Subject Name", sortable: true },
];

interface CreditHead {
  key: string;
  subjectCode: string;
  subject: string;
  headType: string;
  head: string;
}

interface PivotedCreditRow {
  studentID: string;
  seatNo: string;
  name: string;
  credits: Record<string, { out: string | number; pass: string | number }>;
}

const StudentAssignReport = () => {
  const { ayid } = useAcademicYear();

  const [courseId, setCourseId] = useState("");
  const courses = useCourses();
  const courseOptions = useMemo(() => toCourseOptions(courses.data), [courses.data]);

  const [pattern, setPattern] = useState("");
  const patterns = usePatterns();
  const patternOptions = useMemo(() => toPatternOptions(patterns.data), [patterns.data]);

  const [semester, setSemester] = useState("");
  const semesters = useSemesters();
  const semesterOptions = useMemo(() => toSemesterOptions(semesters.data), [semesters.data]);

  // Regular exams of the course for the selected academic year.
  const [Exam, setExam] = useState("");
  const exams = useExams({ courseId, purpose: "regular" });
  const ExamOptions = useMemo(() => toExamOptions(exams.data), [exams.data]);

  // Report Data
  const [assignData, setAssignData] = useState<StudentAssignReportResponse[]>([]);
  const [creditRawData, setCreditRawData] = useState<StudentCreditReportResponse[]>([]);
  const [activeReport, setActiveReport] = useState<ReportType>("assign");
  const [creditSearchQuery, setCreditSearchQuery] = useState("");
  const [tableKey, setTableKey] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setPattern("");
      setSemester("");
      setExam("");
    }
  }, [courseId]);

  useEffect(() => {
    if (semester) {
      setExam("");
    }
  }, [semester]);

  useEffect(() => {
    setAssignData([]);
    setCreditRawData([]);
    setCreditSearchQuery("");
  }, [courseId, pattern, semester, Exam]);

  const loadReport = async (type: ReportType) => {
    if (!courseId || !pattern || !semester || !Exam) {
      return Swal.fire("Error", "Please select all fields", "error");
    }

    const payload: StudentAssignReportRequest = {
      Courseid: courseId,
      Pattern: pattern,
      Semester: semester,
      ExamId: Exam,
      Ayid: ayid ?? "",
    };

    try {
      setLoading(true);

      if (type === "assign") {
        const data = await StudentAssignRptService.getReport(payload);
        console.log("ASSIGN REPORT RESPONSE", data);
        setAssignData(data || []);
        setActiveReport("assign");
        setTableKey((k) => k + 1);

        if (!data || data.length === 0) {
          Swal.fire("No Data", "No records found for the selected filters", "info");
        }
      } else {
        const data = await StudentAssignRptService.getCreditReport(payload);
        console.log("CREDIT REPORT RESPONSE", data);
        const rows = Array.isArray(data) ? data : [];
        setCreditRawData(rows);
        setActiveReport("credit");
        setCreditSearchQuery("");
        setTableKey((k) => k + 1);

        if (rows.length === 0) {
          Swal.fire("No Data", "No records found for the selected filters", "info");
        }
      }
    } catch (error) {
      console.error("Failed to get data", error);
      Swal.fire("Error", "Failed to get data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Distinct Subject-Head combinations sorted by Subject Name, Head Type, Head
  const creditHeads: CreditHead[] = useMemo(() => {
    const map = new Map<string, CreditHead>();

    creditRawData.forEach((item) => {
      const subjCode = item.subjectCode || "";
      const subjName = item.subjectName || "";
      const hType = item.headType || "";
      const h = item.head || "";
      const key = `${subjCode}_${hType}_${h}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          subjectCode: subjCode,
          subject: subjName,
          headType: hType,
          head: h,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.subject !== b.subject) {
        return a.subject.localeCompare(b.subject);
      }
      if (a.headType !== b.headType) {
        return a.headType.localeCompare(b.headType);
      }
      return a.head.localeCompare(b.head);
    });
  }, [creditRawData]);

  // Grouped by Subject for multi-column header
  const subjectsGrouped = useMemo(() => {
    const groups: { subject: string; heads: CreditHead[] }[] = [];

    creditHeads.forEach((ch) => {
      let group = groups.find((g) => g.subject === ch.subject);
      if (!group) {
        group = { subject: ch.subject, heads: [] };
        groups.push(group);
      }
      group.heads.push(ch);
    });

    return groups;
  }, [creditHeads]);

  // Pivot credit records by Student
  const pivotedCreditRows: PivotedCreditRow[] = useMemo(() => {
    const studentMap = new Map<string, PivotedCreditRow>();

    creditRawData.forEach((item) => {
      const sId = item.studentID || "";
      if (!studentMap.has(sId)) {
        studentMap.set(sId, {
          studentID: item.studentID || "",
          seatNo: item.seatNo || "",
          name: item.name || "",
          credits: {},
        });
      }

      const row = studentMap.get(sId)!;
      const key = `${item.subjectCode || ""}_${item.headType || ""}_${item.head || ""}`;
      const passVal = item.headFormula || item.headPass || "-";

      row.credits[key] = {
        out: item.headOutOf ?? "-",
        pass: passVal,
      };
    });

    return Array.from(studentMap.values());
  }, [creditRawData]);

  // Filtered rows for live search
  const filteredCreditRows = useMemo(() => {
    if (!creditSearchQuery.trim()) return pivotedCreditRows;
    const q = creditSearchQuery.toLowerCase().trim();
    return pivotedCreditRows.filter(
      (r) =>
        (r.studentID || "").toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.seatNo || "").toLowerCase().includes(q)
    );
  }, [pivotedCreditRows, creditSearchQuery]);

  const handleDownloadExcel = async () => {
    const courseName =
      courseOptions.find((c) => c.value === courseId)?.label ?? "Course";

    if (activeReport === "assign") {
      if (assignData.length === 0) {
        return Swal.fire("No Data", "There is no data to download", "info");
      }

      const rows = assignData.map((r) => ({
        "Seat No.": r.seatNo,
        "Student ID": r.studentID,
        "Student Name": r.name,
        "Subject Code": r.subjectCode,
        "Subject Name": r.subjectName,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 14 },
        { wch: 16 },
        { wch: 30 },
        { wch: 16 },
        { wch: 45 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Student Assign Report");

      const fileName = `StudentAssignReport_${courseName}_${pattern}_${semester}.xlsx`
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "_");

      XLSX.writeFile(workbook, fileName);
    } else {
      const dataToExport =
        filteredCreditRows.length > 0 ? filteredCreditRows : pivotedCreditRows;

      if (dataToExport.length === 0) {
        return Swal.fire("No Data", "There is no credit data to download", "info");
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Credit Report");

      const totalCols = 3 + creditHeads.length * 2;
      const row1: any[] = new Array(totalCols).fill("");
      const row2: any[] = new Array(totalCols).fill("");
      const row3: any[] = new Array(totalCols).fill("");

      // Fixed Column Headers (Row 1)
      row1[0] = "Seat No";
      row1[1] = "Student ID";
      row1[2] = "Student Name";

      // Track merges for ExcelJS (1-based: [startRow, startCol, endRow, endCol])
      const cellMerges: [number, number, number, number][] = [
        [1, 1, 3, 1], // Seat No
        [1, 2, 3, 2], // Student ID
        [1, 3, 3, 3], // Student Name
      ];

      // Populate Level 1 (Subject Names) and Level 2 (Heads) & Level 3 (Out / Pass)
      let currentCol = 3; // 0-based for array indexing
      subjectsGrouped.forEach((group) => {
        const subjColSpan = group.heads.length * 2;
        row1[currentCol] = group.subject;

        if (subjColSpan > 1) {
          // 1-based indexing for ExcelJS
          cellMerges.push([1, currentCol + 1, 1, currentCol + subjColSpan]);
        }

        let headCol = currentCol;
        group.heads.forEach((h) => {
          const headTitle = h.headType ? `${h.headType} - ${h.head}` : h.head;
          row2[headCol] = headTitle;
          cellMerges.push([2, headCol + 1, 2, headCol + 2]);

          row3[headCol] = "Out";
          row3[headCol + 1] = "Pass";

          headCol += 2;
        });

        currentCol += subjColSpan;
      });

      // Add Header Rows to worksheet
      worksheet.addRow(row1);
      worksheet.addRow(row2);
      worksheet.addRow(row3);

      // Perform Merges
      cellMerges.forEach(([sRow, sCol, eRow, eCol]) => {
        worksheet.mergeCells(sRow, sCol, eRow, eCol);
      });

      // Add Data Rows
      dataToExport.forEach((row) => {
        const studentRow: any[] = [
          row.seatNo || "-",
          row.studentID || "-",
          row.name || "-",
        ];

        creditHeads.forEach((ch) => {
          const cell = row.credits[ch.key] || { out: "-", pass: "-" };
          studentRow.push(cell.out);
          studentRow.push(cell.pass);
        });

        worksheet.addRow(studentRow);
      });

      // Set Column Widths
      worksheet.columns = [
        { width: 14 },
        { width: 16 },
        { width: 30 },
        ...creditHeads.flatMap(() => [{ width: 12 }, { width: 12 }]),
      ];

      // Format Header Rows (Rows 1, 2, 3): BOLD & CENTERED
      [1, 2, 3].forEach((rowIdx) => {
        const r = worksheet.getRow(rowIdx);
        r.height = 24;
        r.eachCell({ includeEmpty: true }, (cell) => {
          cell.font = { bold: true, name: "Calibri", size: 11, color: { argb: "FF1F2937" } };
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF3F4F6" },
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      });

      // Format Data Rows: Centered data with borders
      for (let rIdx = 4; rIdx <= 3 + dataToExport.length; rIdx++) {
        const r = worksheet.getRow(rIdx);
        r.height = 20;
        r.eachCell({ includeEmpty: true }, (cell, colNum) => {
          cell.font = { name: "Calibri", size: 10 };
          cell.alignment = {
            vertical: "middle",
            horizontal: colNum === 3 ? "left" : "center",
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `StudentCreditReport_${courseName}_${pattern}_${semester}.xlsx`
          .replace(/[\\/:*?"<>|]/g, "")
          .replace(/\s+/g, "_")
      );
    }
  };

  const hasData =
    (activeReport === "assign" && assignData.length > 0) ||
    (activeReport === "credit" && pivotedCreditRows.length > 0);

  return (
    <ComponentCard title="Students Assign Report">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select
          options={courseOptions}
          placeholder="Select Course"
          value={courseId}
          onChange={(value) => {
            setCourseId(value);
            setPattern("");
            setExam("");
          }}
        />
        {courseId && (
          <Select
            options={patternOptions}
            placeholder="Select Pattern"
            value={pattern}
            onChange={(value) => {
              setPattern(value);
              setSemester("");
              setExam("");
            }}
          />
        )}

        {pattern && (
          <Select
            options={semesterOptions}
            placeholder="Select Semester"
            value={semester}
            onChange={(value) => {
              setSemester(value);
            }}
          />
        )}

        {semester && (
          <Select
            options={ExamOptions}
            placeholder="Select Exam"
            value={Exam}
            onChange={setExam}
          />
        )}
      </div>

      {Exam && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            size="sm"
            onClick={() => loadReport("assign")}
            disabled={loading}
          >
            {loading && activeReport === "assign" ? "Loading..." : "Get Data"}
          </Button>

          <Button
            size="sm"
            onClick={() => loadReport("credit")}
            disabled={loading}
          >
            {loading && activeReport === "credit" ? "Loading..." : "Get Credit Data"}
          </Button>

          {hasData && (
            <Button size="sm" variant="outline" onClick={handleDownloadExcel}>
              Download Excel
            </Button>
          )}
        </div>
      )}

      {/* Assign Report Table */}
      {activeReport === "assign" && assignData.length > 0 && (
        <div className="mt-6">
          <DataTable
            key={`assign-${tableKey}`}
            data={assignData}
            columns={assignColumns}
            searchKeys={["seatNo", "studentID", "name", "subjectCode", "subjectName"]}
            pageSizeOptions={[10, 25, 50, 100]}
            stickyHeader
          />
        </div>
      )}

      {/* Credit Report Grid - Formatted like OverallMarksEntry */}
      {activeReport === "credit" && pivotedCreditRows.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow-theme-md border border-gray-200 dark:border-gray-800 p-4">
          {/* Search Box and Counter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search student ID, name, seat..."
                value={creditSearchQuery}
                onChange={(e) => setCreditSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-150 transition-all duration-200"
              />
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400 dark:text-gray-500" />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Showing {filteredCreditRows.length} of {pivotedCreditRows.length} students
            </span>
          </div>

          {/* Custom Styled HTML Table with RowSpan / ColSpan */}
          <div className="w-full max-h-[70vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full border-collapse border border-gray-200 dark:border-gray-800 text-center text-sm">
              <thead className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider text-[11px] border-b border-gray-200 dark:border-gray-800">
                {/* Level 1: Fixed Columns & Subject Names */}
                <tr>
                  <th
                    rowSpan={3}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-center"
                  >
                    Seat No
                  </th>
                  <th
                    rowSpan={3}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-center"
                  >
                    Student ID
                  </th>
                  <th
                    rowSpan={3}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-center"
                  >
                    Student Name
                  </th>
                  {subjectsGrouped.map((group) => (
                    <th
                      key={group.subject}
                      colSpan={group.heads.length * 2}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-800 font-bold whitespace-nowrap bg-gray-100/50 dark:bg-gray-800/60 text-primary-600 dark:text-primary-400 text-center"
                    >
                      {group.subject}
                    </th>
                  ))}
                </tr>

                {/* Level 2: Heads under each Subject */}
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  {subjectsGrouped.flatMap((group) =>
                    group.heads.map((h, idx) => (
                      <th
                        key={`${group.subject}-${h.head}-${idx}`}
                        colSpan={2}
                        className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 font-bold text-[11px] whitespace-nowrap text-gray-700 dark:text-gray-300 text-center"
                      >
                        {h.headType ? `${h.headType} - ${h.head}` : h.head}
                      </th>
                    ))
                  )}
                </tr>

                {/* Level 3: Out & Pass columns */}
                <tr className="bg-gray-100/70 dark:bg-gray-850">
                  {subjectsGrouped.flatMap((group) =>
                    group.heads.flatMap((h) => [
                      <th
                        key={`${h.key}-out`}
                        className="px-2 py-1 border border-gray-200 dark:border-gray-800 font-bold text-[10px] whitespace-nowrap text-gray-700 dark:text-gray-300 text-center"
                      >
                        Out
                      </th>,
                      <th
                        key={`${h.key}-pass`}
                        className="px-2 py-1 border border-gray-200 dark:border-gray-800 font-bold text-[10px] whitespace-nowrap text-gray-700 dark:text-gray-300 text-center"
                      >
                        Pass
                      </th>,
                    ])
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-150">
                {filteredCreditRows.map((row, rIdx) => (
                  <tr
                    key={row.studentID ? `${row.studentID}-${rIdx}` : rIdx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 font-medium whitespace-nowrap">
                      {row.seatNo || "-"}
                    </td>
                    <td className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 font-medium whitespace-nowrap">
                      {row.studentID || "-"}
                    </td>
                    <td className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 text-left whitespace-nowrap font-medium">
                      {row.name || "-"}
                    </td>
                    {creditHeads.map((ch) => {
                      const cell = row.credits[ch.key] || { out: "-", pass: "-" };
                      return (
                        <React.Fragment key={ch.key}>
                          <td className="px-3 py-2 border border-gray-200 dark:border-gray-800 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded font-semibold text-xs text-gray-700 dark:text-gray-300">
                              {cell.out}
                            </span>
                          </td>
                          <td className="px-3 py-2 border border-gray-200 dark:border-gray-800 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded font-semibold text-xs text-gray-700 dark:text-gray-300">
                              {cell.pass}
                            </span>
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ComponentCard>
  );
};

export default StudentAssignReport;
