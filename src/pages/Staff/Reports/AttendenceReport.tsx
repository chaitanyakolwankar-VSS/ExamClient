import { useState, useMemo, useEffect, useCallback } from "react";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import { Modal } from "../../../components/ui/modal";
import {
  useCourses,
  usePatterns,
  useSemesters,
  useAcademicYear,
  toCourseOptions,
  toPatternOptions,
  toSemesterOptions,
} from "../../../data";
import Swal from "sweetalert2";
import {
  ExamApiRequest,
  ExamApiResponse,
} from "../../../services/RegularExamService";
import {
  AttendanceReportService,
  AttendanceReportRequest,
  AttendanceReportResponse,
  AttendanceSeatNoRequest,
} from "../../../services/AttendanceReportService";
import { Blocks, Loader2, Printer } from "lucide-react";
import apiClient from "../../../api/Client";
import collegedetailService from "../../../services/collegedetailService";
import {
  MAX_STUDENTS_PER_BLOCK,
  HEADER_CSS,
  buildAttendanceSheetDocument,
  buildHeaderHtml,
  escapeHtml,
  semesterText,
} from "./attendanceSheetHtml";

interface Option {
  value: string;
  label: string;
}

interface BlockDetails {
  srNo: number;
  blockNumber: string;
  allocatedStudentCount: string;
  presentStudentCount: string;
  coding: string;
}

// ============================================================
// WRITE REPORT AND AUTOMATICALLY OPEN PRINT DIALOG
// ============================================================

async function writePrintDocument(
  printWindow: Window,
  html: string
): Promise<void> {
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for report images to load.
  const images = Array.from(printWindow.document.images);

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );

  // Wait until the report has rendered before printing.
  await new Promise<void>((resolve) => {
    printWindow.requestAnimationFrame(() => {
      printWindow.requestAnimationFrame(() => {
        resolve();
      });
    });
  });

  if (printWindow.closed) return;

  printWindow.focus();

  // Automatically open the browser print dialog.
  printWindow.print();
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-white";

export default function AttendenceReport() {
  const { ayid } = useAcademicYear();

  // ============================================================
  // COLLEGE (banner, name and centre for the print header)
  // ============================================================

  const [bannerDataUrl, setBannerDataUrl] =
    useState<string | null>(null);
  const [collegeName, setCollegeName] = useState("");
  const [collegeCenter, setCollegeCenter] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCollegeBanner = async () => {
      try {
        const college = await collegedetailService.getCollege();
        if (!cancelled) {
          setCollegeName(college?.name ?? "");
          setCollegeCenter(college?.collegeCenter ?? "");
        }
        const path = college?.bannerUrl?.trim();

        if (!path) {
          if (!cancelled) setBannerDataUrl(null);
          return;
        }

        // Absolute URLs, data URLs and blob URLs.
        if (/^(data:|blob:|https?:\/\/)/i.test(path)) {
          if (!cancelled) setBannerDataUrl(path);
          return;
        }

        // Retrieve a private banner through the API.
        const response = await apiClient.get<Blob>("/Files", {
          params: { path },
          responseType: "blob",
        });

        const dataUrl = await new Promise<string>(
          (resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(
                  new Error("Failed to convert college banner.")
                );
              }
            };

            reader.onerror = () => {
              reject(
                reader.error ??
                  new Error("Failed to read banner image.")
              );
            };

            reader.readAsDataURL(response.data);
          }
        );

        if (!cancelled) {
          setBannerDataUrl(dataUrl);
        }
      } catch (error) {
        console.error("Failed to load college banner:", error);

        if (!cancelled) {
          setBannerDataUrl(null);
        }
      }
    };

    void loadCollegeBanner();

    return () => {
      cancelled = true;
    };
  }, []);

  // Banner (or college name) and the "Center Name" line, printed at the top of every sheet.
  const headerHtml = useMemo(
    () =>
      buildHeaderHtml({
        bannerDataUrl,
        collegeName,
        collegeCenter,
      }),
    [bannerDataUrl, collegeName, collegeCenter]
  );

  // ============================================================
  // FILTERS
  // ============================================================

  const courses = useCourses();
  const courseOptions = useMemo(
    () => toCourseOptions(courses.data),
    [courses.data]
  );
  const [courseId, setCourseId] = useState("");

  const patterns = usePatterns();
  const patternOptions = useMemo(
    () => toPatternOptions(patterns.data),
    [patterns.data]
  );
  const [pattern, setPattern] = useState("");

  const semesters = useSemesters();
  const semesterOptions = useMemo(
    () => toSemesterOptions(semesters.data),
    [semesters.data]
  );
  const [semester, setSemester] = useState("");

  const [ExamOptions, setExamOptions] = useState<Option[]>([]);
  const [Exam, setExam] = useState("");
  const [examsLoading, setExamsLoading] = useState(false);

  const courseName =
    courseOptions.find((item) => item.value === courseId)?.label ?? "";
  const examName =
    ExamOptions.find((item) => item.value === Exam)?.label ?? Exam;
  const semesterLabel = semesterText(
    semesterOptions.find((item) => item.value === semester)?.label,
    semester
  );

  // ============================================================
  // PAPERS OF THE EXAM (null = not loaded yet)
  // ============================================================

  const [reportData, setReportData] = useState<
    AttendanceReportResponse[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Exams of the chosen course.
  useEffect(() => {
    setExamOptions([]);

    if (!courseId || !ayid) return;

    let cancelled = false;

    const run = async () => {
      setExamsLoading(true);
      try {
        const parameter: ExamApiRequest = {
          Courseid: courseId,
          Ayid: ayid,
        };

        const data: ExamApiResponse[] =
          await AttendanceReportService.getExam(parameter);

        if (cancelled) return;

        setExamOptions(
          (data ?? []).map((exam) => ({
            value: exam.examId,
            label: exam.examname,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch exams:", error);
        if (!cancelled) {
          Swal.fire("Error", "Failed to fetch exams.", "error");
        }
      } finally {
        if (!cancelled) setExamsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [courseId, ayid]);

  // Papers load by themselves once Course, Pattern, Semester and Exam are all chosen.
  useEffect(() => {
    setReportData(null);
    setLoadError("");

    if (!ayid || !courseId || !pattern || !semester || !Exam) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const params: AttendanceReportRequest = {
          Ayid: ayid,
          CourseId: courseId,
          Pattern: pattern,
          Semester: semester,
          Exam,
        };

        const data =
          await AttendanceReportService.getSubjectStudentCount(params);

        if (!cancelled) setReportData(data ?? []);
      } catch (error) {
        console.error("Failed to fetch attendance report:", error);
        if (!cancelled) {
          setLoadError("Could not load the papers. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [ayid, courseId, pattern, semester, Exam, reloadKey]);

  // ============================================================
  // BLOCK DETAILS MODAL
  // ============================================================

  const [showBlockPopup, setShowBlockPopup] = useState(false);

  const [selectedRow, setSelectedRow] =
    useState<AttendanceReportResponse | null>(null);

  const [numberOfBlocks, setNumberOfBlocks] = useState("");

  const [blockDetails, setBlockDetails] = useState<BlockDetails[]>([]);

  const handleOpenBlockPopup = (
    row: AttendanceReportResponse
  ) => {
    setSelectedRow(row);
    setNumberOfBlocks("");
    setBlockDetails([]);
    setShowBlockPopup(true);
  };

  const handleCloseBlockPopup = () => {
    setShowBlockPopup(false);
    setSelectedRow(null);
    setNumberOfBlocks("");
    setBlockDetails([]);
  };

  // ============================================================
  // COMMON VALIDATION
  // ============================================================

  const validateBlockDetails = (): boolean => {
    if (!ayid || !courseId || !pattern || !semester || !Exam) {
      Swal.fire(
        "Warning",
        "Please select Course, Pattern, Semester and Exam.",
        "warning"
      );
      return false;
    }

    if (!selectedRow?.subjectId) {
      Swal.fire(
        "Error",
        "Subject ID is missing. Please ensure the API returns SubjectId.",
        "error"
      );
      return false;
    }

    if (blockDetails.length === 0) {
      Swal.fire(
        "Warning",
        "Please enter the number of blocks and block details.",
        "warning"
      );
      return false;
    }

    const invalidBlock = blockDetails.find(
      (block) =>
        !block.blockNumber.trim() ||
        block.allocatedStudentCount.trim() === "" ||
        !Number.isInteger(Number(block.allocatedStudentCount)) ||
        Number(block.allocatedStudentCount) <= 0
    );

    if (invalidBlock) {
      Swal.fire(
        "Warning",
        "Please enter a block number and a valid allocated student count for every block.",
        "warning"
      );
      return false;
    }

    // A block over 40 is allowed (rare): its attendance sheet carries on to a second page.
    return true;
  };

  // ============================================================
  // FETCH AND VALIDATE SEAT NUMBERS
  // ============================================================

  const fetchAndValidateSeatNumbers = async () => {
    if (!selectedRow?.subjectId) {
      throw new Error("Subject ID is missing.");
    }

    if (!ayid) {
      Swal.fire(
        "Warning",
        "Please select Academic Year.",
        "warning"
      );
      return null;
    }

    const params: AttendanceSeatNoRequest = {
      Ayid: ayid,
      CourseId: courseId,
      Pattern: pattern,
      Semester: semester,
      Exam,
      SubjectId: selectedRow.subjectId,
    };

    const seatNumbers =
      await AttendanceReportService.getSubjectSeatNo(params);

    if (!seatNumbers || seatNumbers.length === 0) {
      Swal.fire(
        "Information",
        "No seat numbers found for this subject.",
        "info"
      );
      return null;
    }

    const totalAllocated = blockDetails.reduce(
      (total, block) =>
        total + Number(block.allocatedStudentCount),
      0
    );

    if (totalAllocated !== seatNumbers.length) {
      Swal.fire(
        "Allocation Mismatch",
        `Total seat numbers received: ${seatNumbers.length}. Total students allocated across blocks: ${totalAllocated}. Please make both counts equal.`,
        "warning"
      );
      return null;
    }

    return seatNumbers;
  };

  // ============================================================
  // SEATING ARRANGEMENT
  // ============================================================

  const handleSeatingArrangement = async () => {
    if (!validateBlockDetails()) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      Swal.fire(
        "Warning",
        "Please allow pop-ups for this website.",
        "warning"
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Seating Arrangement</title>
        </head>
        <body style="font-family:Arial;text-align:center;padding:25px">
          Loading seating arrangement...
        </body>
      </html>
    `);

    try {
      const seatNumbers = await fetchAndValidateSeatNumbers();

      if (!seatNumbers) {
        if (!printWindow.closed) printWindow.close();
        return;
      }

      const examTitle =
        `${pattern} - ${examName} - ${selectedRow!.subjectName} - ${semesterLabel}`;

      let seatIndex = 0;

      const blockHtml = blockDetails
        .map((block) => {
          const allocatedCount = Number(
            block.allocatedStudentCount
          );

          const blockSeats = seatNumbers.slice(
            seatIndex,
            seatIndex + allocatedCount
          );

          seatIndex += allocatedCount;

          const rows: string[] = [];

          // Number of rows needed for 5 columns.
          const neededRows = Math.ceil(blockSeats.length / 5);

          // At least 8 rows; more if the block is bigger than 40.
          const totalRowsCount = Math.max(8, neededRows);

          for (let i = 0; i < totalRowsCount; i++) {
            const col1Seat = blockSeats[i];
            const col2Seat = blockSeats[i + totalRowsCount];
            const col3Seat = blockSeats[i + totalRowsCount * 2];
            const col4Seat = blockSeats[i + totalRowsCount * 3];
            const col5Seat = blockSeats[i + totalRowsCount * 4];

            // Sr. numbers continue sequentially across the 5 columns.
            const col1SrNo = col1Seat ? i + 1 : "";
            const col2SrNo = col2Seat ? i + totalRowsCount + 1 : "";
            const col3SrNo = col3Seat ? i + totalRowsCount * 2 + 1 : "";
            const col4SrNo = col4Seat ? i + totalRowsCount * 3 + 1 : "";
            const col5SrNo = col5Seat ? i + totalRowsCount * 4 + 1 : "";

            rows.push(`
              <tr>
                <td class="sr">${col1SrNo}</td>
                <td class="seat">
                  ${col1Seat ? escapeHtml(col1Seat.seatNo) : "&nbsp;"}
                </td>
                <td class="sr">${col2SrNo}</td>
                <td class="seat">
                  ${col2Seat ? escapeHtml(col2Seat.seatNo) : "&nbsp;"}
                </td>
                <td class="sr">${col3SrNo}</td>
                <td class="seat">
                  ${col3Seat ? escapeHtml(col3Seat.seatNo) : "&nbsp;"}
                </td>
                <td class="sr">${col4SrNo}</td>
                <td class="seat">
                  ${col4Seat ? escapeHtml(col4Seat.seatNo) : "&nbsp;"}
                </td>
                <td class="sr">${col5SrNo}</td>
                <td class="seat">
                  ${col5Seat ? escapeHtml(col5Seat.seatNo) : "&nbsp;"}
                </td>
              </tr>
            `);
          }

          return `
            <section class="block-card">
              ${headerHtml}

              <div class="report-title">
                <strong>Seating Arrangement For</strong>
                <div>${escapeHtml(examTitle)}</div>
              </div>

              <div class="paper-row">
                <div>
                  <strong>Paper:</strong>
                  ${escapeHtml(selectedRow!.subjectName)}
                  (${escapeHtml(selectedRow!.subjectCode)})
                </div>

                <div>
                  <strong>Total Student Count:</strong>
                  ${allocatedCount}
                </div>
              </div>

              <div class="block-heading">
                <strong>Block Name:</strong>
                ${escapeHtml(block.blockNumber)}
                &nbsp;&nbsp;
                <strong>Date &amp; Time:</strong>
                ${escapeHtml(selectedRow!.date)}
                ${escapeHtml(selectedRow!.time)}
              </div>

              <table class="fixed-table">
                <thead>
                  <tr>
                    <th class="sr">Sr.</th>
                    <th class="seat">Seat Number</th>
                    <th class="sr">Sr.</th>
                    <th class="seat">Seat Number</th>
                    <th class="sr">Sr.</th>
                    <th class="seat">Seat Number</th>
                    <th class="sr">Sr.</th>
                    <th class="seat">Seat Number</th>
                    <th class="sr">Sr.</th>
                    <th class="seat">Seat Number</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.join("")}
                </tbody>
              </table>
            </section>
          `;
        })
        .join("");

      await writePrintDocument(
        printWindow,
        `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Seating Arrangement</title>

              <style>
                @page {
                  size: A4 portrait;
                  margin: 5mm;
                }

                * {
                  box-sizing: border-box;
                }

                html, body {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                  color: #000;
                  background: #fff;
                  font-family: "Times New Roman", serif;
                  font-size: 8px;
                }

                .block-card {
                  width: 100%;
                  min-height: 138mm;
                  border: 1px solid #333;
                  margin-bottom: 4mm;
                  page-break-inside: avoid;
                  break-inside: avoid;
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                }

                ${HEADER_CSS}

                .block-card .print-header {
                  border-bottom: 1px solid #555;
                }

                .block-card .centre-line {
                  font-size: 12px;
                }

                .block-card .college-name {
                  font-size: 18px;
                }

                .report-title {
                  text-align: center;
                  padding: 2px;
                  line-height: 1.1;
                  border-bottom: 1px solid #555;
                  font-size: 18px;
                }

                .paper-row {
                  display: grid;
                  grid-template-columns: 1fr auto;
                  gap: 4px;
                  padding: 2px 4px;
                  border-bottom: 1px solid #555;
                  font-size: 15px;
                }

                .block-heading {
                  padding: 2px 4px;
                  border-bottom: 1px solid #555;
                  font-size: 15px;
                }

                table.fixed-table {
                  width: 100%;
                  border-collapse: collapse;
                  table-layout: fixed;
                }

                table.fixed-table th,
                table.fixed-table td {
                  border: 1px solid #9b9b9b;
                  height: 20px;
                  padding: 1px 2px;
                  font-size: 15px;
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                }

                table.fixed-table th {
                  text-align: center;
                  font-weight: bold;
                  background-color: #f2f2f2;
                }

                /* 5 columns layout (10 sub-columns in total) */
                table.fixed-table th.sr,
                table.fixed-table td.sr {
                  width: 4.5%;
                  text-align: center;
                }

                table.fixed-table th.seat,
                table.fixed-table td.seat {
                  width: 15.5%;
                  text-align: center;
                }

                table.fixed-table td.seat {
                  font-size: 12px;
                  font-weight: bold;
                }

                @media print {
                  body {
                    padding: 0;
                  }

                  /* A page break after every 2 blocks */
                  .block-card:nth-child(2n) {
                    page-break-after: always;
                    break-after: page;
                    margin-bottom: 0;
                  }

                  .block-card:last-child {
                    page-break-after: auto;
                    break-after: auto;
                  }
                }
              </style>
            </head>

            <body>
              ${blockHtml}
            </body>
          </html>
        `
      );
    } catch (error) {
      console.error(
        "Failed to generate seating arrangement:",
        error
      );

      if (!printWindow.closed) {
        printWindow.close();
      }

      Swal.fire(
        "Error",
        "Failed to fetch seat numbers or generate the seating arrangement.",
        "error"
      );
    }
  };

  // ============================================================
  // PAPER WISE ATTENDANCE SHEET & SUPERVISOR REPORT
  // ============================================================

  const handleGenerateReport = async () => {
    if (!validateBlockDetails()) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      Swal.fire(
        "Warning",
        "Please allow pop-ups for this website.",
        "warning"
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance Sheet & Supervisor Report</title>
        </head>
        <body style="font-family:Arial;text-align:center;padding:25px">
          Loading report...
        </body>
      </html>
    `);

    try {
      const seatNumbers = await fetchAndValidateSeatNumbers();

      if (!seatNumbers) {
        if (!printWindow.closed) printWindow.close();
        return;
      }

      let seatIndex = 0;

      const blocks = blockDetails.map((block) => {
        const allocatedCount = Number(block.allocatedStudentCount);

        const blockSeats = seatNumbers.slice(
          seatIndex,
          seatIndex + allocatedCount
        );

        seatIndex += allocatedCount;

        return {
          blockName: block.blockNumber.trim(),
          seatNos: blockSeats.map((seat) => seat.seatNo),
        };
      });

      const html = buildAttendanceSheetDocument({
        headerHtml,
        title: `${pattern}-${examName}-${courseName}-${semesterLabel}[${selectedRow!.subjectCode}]`,
        subjectName: selectedRow!.subjectName,
        subjectCode: selectedRow!.subjectCode,
        date: selectedRow!.date,
        time: selectedRow!.time,
        blocks,
      });

      await writePrintDocument(printWindow, html);
    } catch (error) {
      console.error("Failed to generate attendance report:", error);

      if (!printWindow.closed) printWindow.close();

      Swal.fire(
        "Error",
        "Failed to fetch seat numbers or generate attendance report.",
        "error"
      );
    }
  };

  // ============================================================
  // PACKING SLIP
  // ============================================================

  const handlePackingSlip = async () => {
    if (!selectedRow) {
      Swal.fire("Warning", "Please select a row.", "warning");
      return;
    }

    if (blockDetails.length === 0) {
      Swal.fire(
        "Warning",
        "Please enter block details before generating packing slips.",
        "warning"
      );
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      Swal.fire(
        "Warning",
        "Please allow pop-ups for this website.",
        "warning"
      );
      return;
    }

    const programName =
      `${selectedRow.subjectCode} - ${examName}`;

    const slipsHtml = blockDetails
      .map((block) => {
        const numberOfScripts =
          block.presentStudentCount.trim() !== ""
            ? block.presentStudentCount
            : block.allocatedStudentCount;

        const qpCode = block.coding || "--";

        return `
          <div class="packing-card">
            ${headerHtml}

            <div class="packing-title">PACKING SLIP</div>

            <table class="packing-table">
              <tbody>
                <tr>
                  <td class="lbl-col">Name of College</td>
                  <td class="val-col">
                    ${escapeHtml(collegeName)}
                  </td>
                </tr>

                <tr>
                  <td class="lbl-col">Program Name</td>
                  <td class="val-col">${escapeHtml(programName)}</td>
                </tr>

                <tr>
                  <td class="lbl-col">SEM (Course Part)</td>
                  <td class="val-col">${escapeHtml(semesterLabel)}</td>
                </tr>

                <tr>
                  <td class="lbl-col">Exam Date</td>
                  <td class="val-col">${escapeHtml(selectedRow.date)}</td>
                </tr>

                <tr>
                  <td class="lbl-col">Exam Time</td>
                  <td class="val-col">${escapeHtml(selectedRow.time)}</td>
                </tr>

                <tr>
                  <td class="lbl-col">Subject Name</td>
                  <td class="val-col">${escapeHtml(selectedRow.subjectName)}</td>
                </tr>

                <tr>
                  <td class="lbl-col">No. of Scripts</td>
                  <td class="val-col">${escapeHtml(numberOfScripts)}</td>
                </tr>

                <tr>
                  <td class="lbl-col">QPCode</td>
                  <td class="val-col">${escapeHtml(qpCode)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      })
      .join("");

    try {
      await writePrintDocument(
        printWindow,
        `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Packing Slip</title>

              <style>
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }

                * {
                  box-sizing: border-box;
                }

                body {
                  margin: 0;
                  padding: 15px;
                  color: #000;
                  background: #fff;
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 11px;
                }

                .packing-card {
                  width: 100%;
                  max-width: 650px;
                  margin: 0 auto 35px;
                  border: 1.5px solid #000;
                  page-break-inside: avoid;
                  break-inside: avoid;
                }

                ${HEADER_CSS}

                .packing-card .print-header {
                  border-bottom: 1.5px solid #000;
                }

                .packing-card .college-name {
                  font-size: 14px;
                }

                .packing-card .centre-line {
                  font-size: 11px;
                }

                .packing-title {
                  text-align: center;
                  font-weight: bold;
                  font-size: 12px;
                  padding: 6px;
                  border-bottom: 1.5px solid #000;
                  letter-spacing: 0.5px;
                }

                .packing-table {
                  width: 100%;
                  border-collapse: collapse;
                }

                .packing-table td {
                  border-bottom: 1px solid #000;
                  padding: 5px 8px;
                  font-size: 11px;
                  vertical-align: middle;
                }

                .packing-table tr:last-child td {
                  border-bottom: none;
                }

                .lbl-col {
                  width: 28%;
                  font-weight: bold;
                  border-right: 1.5px solid #000;
                }

                .val-col {
                  width: 72%;
                  font-weight: bold;
                }

                @media print {
                  body {
                    padding: 0;
                  }

                  .packing-card {
                    margin-bottom: 20px;
                  }
                }
              </style>
            </head>

            <body>
              ${slipsHtml}
            </body>
          </html>
        `
      );
    } catch (error) {
      console.error("Failed to generate packing slips:", error);

      if (!printWindow.closed) printWindow.close();

      Swal.fire(
        "Error",
        "Failed to generate packing slips.",
        "error"
      );
    }
  };

  // ============================================================
  // NUMBER OF BLOCKS / SPLIT INTO BLOCKS OF 40
  // ============================================================

  const handleNumberOfBlocksChange = (value: string) => {
    setNumberOfBlocks(value);

    if (value.trim() === "") {
      setBlockDetails([]);
      return;
    }

    const count = Number(value);

    if (!Number.isInteger(count) || count < 1 || count > 500) {
      setBlockDetails([]);
      return;
    }

    setBlockDetails((previousRows) =>
      Array.from({ length: count }, (_, index) => ({
        srNo: index + 1,
        blockNumber: previousRows[index]?.blockNumber ?? "",
        allocatedStudentCount:
          previousRows[index]?.allocatedStudentCount ?? "",
        presentStudentCount:
          previousRows[index]?.presentStudentCount ?? "",
        coding: previousRows[index]?.coding ?? "",
      }))
    );
  };

  // 73 students -> block 1 = 40, block 2 = 33 (the remainder goes to the last block).
  const handleSplitIntoBlocks = () => {
    const total = Number(selectedRow?.studentCount ?? 0);

    if (!Number.isInteger(total) || total <= 0) {
      Swal.fire(
        "Information",
        "This paper has no students to split into blocks.",
        "info"
      );
      return;
    }

    const count = Math.ceil(total / MAX_STUDENTS_PER_BLOCK);

    setNumberOfBlocks(String(count));

    setBlockDetails((previousRows) =>
      Array.from({ length: count }, (_, index) => ({
        srNo: index + 1,
        blockNumber: String(index + 1),
        allocatedStudentCount: String(
          index < count - 1
            ? MAX_STUDENTS_PER_BLOCK
            : total - MAX_STUDENTS_PER_BLOCK * (count - 1)
        ),
        presentStudentCount:
          previousRows[index]?.presentStudentCount ?? "",
        coding: previousRows[index]?.coding ?? "",
      }))
    );
  };

  const handleBlockInputChange = (
    index: number,
    field: keyof Omit<BlockDetails, "srNo">,
    value: string
  ) => {
    setBlockDetails((previousRows) =>
      previousRows.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  const totalAllocated = blockDetails.reduce(
    (total, block) =>
      total + (Number(block.allocatedStudentCount) || 0),
    0
  );

  const retryLoad = useCallback(() => setReloadKey((n) => n + 1), []);

  const filtersChosen = !!(courseId && pattern && semester && Exam);

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <PageMeta
        title="Attendance Report"
        description="Attendance Report"
      />

      <ComponentCard title="Attendance Report - Filters">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="w-full">
            <Select
              label="Course"
              options={courseOptions}
              placeholder="Select Course"
              value={courseId}
              onChange={(value) => {
                setCourseId(value);
                setPattern("");
                setSemester("");
                setExam("");
              }}
            />
          </div>

          <div className="w-full">
            <Select
              label="Pattern"
              options={patternOptions}
              placeholder="Select Pattern"
              value={pattern}
              disabled={!courseId}
              onChange={(value) => {
                setPattern(value);
                setSemester("");
                setExam("");
              }}
            />
          </div>

          <div className="w-full">
            <Select
              label="Semester"
              options={semesterOptions}
              placeholder="Select Semester"
              value={semester}
              disabled={!pattern}
              onChange={(value) => {
                setSemester(value);
                setExam("");
              }}
            />
          </div>

          <div className="w-full">
            <Select
              label="Exam"
              options={ExamOptions}
              placeholder={
                examsLoading ? "Loading exams..." : "Select Exam"
              }
              value={Exam}
              disabled={!semester || examsLoading}
              onChange={(value) => setExam(value)}
            />
          </div>
        </div>
      </ComponentCard>

      {/* PAPERS OF THE EXAM */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-md dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Exam papers
            {reportData && reportData.length > 0 && (
              <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                ({reportData.length})
              </span>
            )}
          </h4>
        </div>

        {!filtersChosen && (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Choose the course, pattern, semester and exam to see its papers.
          </p>
        )}

        {filtersChosen && loading && (
          <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="size-4 animate-spin" />
            Loading papers...
          </div>
        )}

        {filtersChosen && !loading && loadError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={retryLoad}
              className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium hover:bg-red-100 dark:border-red-500/40 dark:hover:bg-red-500/20"
            >
              Try again
            </button>
          </div>
        )}

        {filtersChosen &&
          !loading &&
          !loadError &&
          reportData &&
          reportData.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No papers found for this exam. A paper shows here once it has a
              date and time in the time table and its students have seat
              numbers.
            </p>
          )}

        {filtersChosen &&
          !loading &&
          !loadError &&
          reportData &&
          reportData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-800 dark:bg-white/[0.04] dark:text-gray-300">
                    <th className="px-3 py-2 text-center">Sr</th>
                    <th className="px-3 py-2">Subject code</th>
                    <th className="px-3 py-2">Subject name</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2 text-center">Students</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr
                      key={row.subjectId}
                      className="border-b border-gray-100 text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium">
                        {row.subjectCode}
                      </td>
                      <td className="px-3 py-2">{row.subjectName}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {row.date}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {row.time}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.studentCount}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenBlockPopup(row)}
                          disabled={row.studentCount <= 0}
                          title={
                            row.studentCount <= 0
                              ? "No students with seat numbers for this paper"
                              : "Set up blocks and print"
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25"
                        >
                          <Blocks size={14} />
                          Blocks
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* BLOCK DETAILS MODAL */}
      <Modal
        isOpen={showBlockPopup}
        onClose={handleCloseBlockPopup}
        className="max-w-4xl p-6"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Block / Laboratory Details
          </h3>
        </div>

        {selectedRow && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            <p>
              <strong>Subject Code:</strong> {selectedRow.subjectCode}
            </p>

            <p>
              <strong>Subject Name:</strong> {selectedRow.subjectName}
            </p>

            <p>
              <strong>Student Count:</strong> {selectedRow.studentCount}
            </p>
          </div>
        )}

        {/* NUMBER OF BLOCKS */}
        <div className="mb-2 flex flex-wrap items-end gap-3">
          <div className="w-full max-w-xs">
            <Input
              type="number"
              label="Number of Blocks"
              value={numberOfBlocks}
              onChange={(e) =>
                handleNumberOfBlocksChange(e.target.value)
              }
              placeholder="Enter number of blocks"
            />
          </div>

          <button
            type="button"
            onClick={handleSplitIntoBlocks}
            className="h-11 whitespace-nowrap rounded-lg border border-blue-600 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500/10"
          >
            Split into blocks of {MAX_STUDENTS_PER_BLOCK}
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          One attendance sheet holds {MAX_STUDENTS_PER_BLOCK} students; a bigger
          block carries on to a second page. The seat numbers are given to the
          blocks in order.
        </p>

        {/* DYNAMIC BLOCK TABLE */}
        {blockDetails.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse border border-gray-300 text-sm dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  <th className="border border-gray-300 px-3 py-2 text-center dark:border-gray-700">
                    Sr No.
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center dark:border-gray-700">
                    Block / Laboratory Number
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center dark:border-gray-700">
                    Students in Block
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center dark:border-gray-700">
                    Present Students
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center dark:border-gray-700">
                    Coding
                  </th>
                </tr>
              </thead>

              <tbody>
                {blockDetails.map((block, index) => {
                  const overfull =
                    Number(block.allocatedStudentCount) >
                    MAX_STUDENTS_PER_BLOCK;

                  return (
                    <tr key={block.srNo}>
                      <td className="border border-gray-300 px-3 py-1.5 text-center text-gray-800 dark:border-gray-700 dark:text-gray-200">
                        {block.srNo}
                      </td>

                      <td className="border border-gray-300 px-3 py-1.5 dark:border-gray-700">
                        <input
                          type="text"
                          value={block.blockNumber}
                          onChange={(e) =>
                            handleBlockInputChange(
                              index,
                              "blockNumber",
                              e.target.value
                            )
                          }
                          placeholder="Block / lab number"
                          className={inputClass}
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-1.5 dark:border-gray-700">
                        <input
                          type="number"
                          min="0"
                          value={block.allocatedStudentCount}
                          onChange={(e) =>
                            handleBlockInputChange(
                              index,
                              "allocatedStudentCount",
                              e.target.value
                            )
                          }
                          placeholder="Students"
                          className={`${inputClass} ${
                            overfull
                              ? "!border-amber-500 dark:!border-amber-500"
                              : ""
                          }`}
                        />
                        {overfull && (
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                            Prints on{" "}
                            {Math.ceil(
                              Number(block.allocatedStudentCount) /
                                MAX_STUDENTS_PER_BLOCK
                            )}{" "}
                            pages.
                          </p>
                        )}
                      </td>

                      <td className="border border-gray-300 px-3 py-1.5 dark:border-gray-700">
                        <input
                          type="number"
                          min="0"
                          value={block.presentStudentCount}
                          onChange={(e) =>
                            handleBlockInputChange(
                              index,
                              "presentStudentCount",
                              e.target.value
                            )
                          }
                          placeholder="Present"
                          className={inputClass}
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-1.5 dark:border-gray-700">
                        <input
                          type="text"
                          value={block.coding}
                          onChange={(e) =>
                            handleBlockInputChange(
                              index,
                              "coding",
                              e.target.value
                            )
                          }
                          placeholder="Coding"
                          className={inputClass}
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL ROW */}
                <tr className="bg-gray-100 font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  <td
                    colSpan={2}
                    className="border border-gray-300 px-3 py-2 text-right dark:border-gray-700"
                  >
                    Total
                  </td>

                  <td
                    className={`border border-gray-300 px-3 py-2 text-center dark:border-gray-700 ${
                      selectedRow &&
                      totalAllocated === Number(selectedRow.studentCount)
                        ? "text-green-700 dark:text-green-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {totalAllocated}
                    {selectedRow && (
                      <span className="font-normal">
                        {" "}
                        of {selectedRow.studentCount}
                      </span>
                    )}
                  </td>

                  <td className="border border-gray-300 px-3 py-2 dark:border-gray-700" />

                  <td className="border border-gray-300 px-3 py-2 dark:border-gray-700" />
                </tr>
              </tbody>
            </table>

            {/* PRINT BUTTONS */}
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleSeatingArrangement}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Printer size={16} />
                Seating Arrangement
              </button>

              <button
                type="button"
                onClick={handleGenerateReport}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Printer size={16} />
                Attendance Sheet
              </button>

              <button
                type="button"
                onClick={handlePackingSlip}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                <Printer size={16} />
                Packing Slip
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
