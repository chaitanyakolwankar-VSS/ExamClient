
import { useState, useMemo, useEffect } from "react";
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
import { Save, Blocks } from "lucide-react";
import DataTable from "../../../components/ui/table/DataTable";
import apiClient from "../../../api/Client";
import collegedetailService from "../../../services/collegedetailService";

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
// ESCAPE HTML
// ============================================================

const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

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

export default function AttendenceReport() {
  const { ayid } = useAcademicYear();

  // ============================================================
  // COLLEGE BANNER
  // ============================================================

  const [bannerDataUrl, setBannerDataUrl] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCollegeBanner = async () => {
      try {
        const college = await collegedetailService.getCollege();
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

  const bannerHtml = bannerDataUrl
    ? `
      <div class="college-banner">
        <img
          src="${escapeHtml(bannerDataUrl)}"
          alt="College Banner"
        />
      </div>
    `
    : "";

  // ============================================================
  // COURSE
  // ============================================================

  const courses = useCourses();

  const courseOptions = useMemo(
    () => toCourseOptions(courses.data),
    [courses.data]
  );

  const [courseId, setCourseId] = useState("");

  // ============================================================
  // PATTERN
  // ============================================================

  const patterns = usePatterns();

  const patternOptions = useMemo(
    () => toPatternOptions(patterns.data),
    [patterns.data]
  );

  const [pattern, setPattern] = useState("");

  // ============================================================
  // EXAM
  // ============================================================

  const [ExamOptions, setExamOptions] = useState<Option[]>([]);
  const [Exam, setExam] = useState("");

  // ============================================================
  // SEMESTER
  // ============================================================

  const semesters = useSemesters();

  const semesterOptions = useMemo(
    () => toSemesterOptions(semesters.data),
    [semesters.data]
  );

  const [semester, setSemester] = useState("");

 
  // ============================================================
  // REPORT DATA
  // ============================================================

  const [reportData, setReportData] = useState<
    AttendanceReportResponse[]
  >([]);

  const [loading, setLoading] = useState(false);

  // ============================================================
  // BLOCK DETAILS MODAL
  // ============================================================

  const [showBlockPopup, setShowBlockPopup] = useState(false);

  const [selectedRow, setSelectedRow] =
    useState<AttendanceReportResponse | null>(null);

  const [numberOfBlocks, setNumberOfBlocks] = useState("");

  const [blockDetails, setBlockDetails] = useState<BlockDetails[]>([]);

  // ============================================================
  // FETCH EXAMS
  // ============================================================

  const fetchexam = async (selectedCourseId: string) => {
    try {
      if (!ayid) {
        Swal.fire("Error", "Academic Year is missing.", "error");
        return;
      }

      if (!selectedCourseId) return;

      const parameter: ExamApiRequest = {
        Courseid: selectedCourseId,
        Ayid: ayid,
      };

      const data: ExamApiResponse[] =
        await AttendanceReportService.getExam(parameter);

      setExamOptions(
        (data ?? []).map((exam) => ({
          value: exam.examId,
          label: exam.examname,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      Swal.fire("Error", "Failed to fetch exams.", "error");
    }
  };

  // ============================================================
  // FETCH ATTENDANCE REPORT
  // ============================================================

  const getData = async () => {
    try {
      if (!ayid) {
        Swal.fire("Error", "Academic Year is missing.", "error");
        return;
      }

      if (!courseId || !pattern || !semester || !Exam || !Event) {
        Swal.fire(
          "Warning",
          "Please select Course, Pattern, Semester, Exam and Event.",
          "warning"
        );
        return;
      }

      setLoading(true);
      setReportData([]);

      const params: AttendanceReportRequest = {
        Ayid: ayid,
        CourseId: courseId,
        Pattern: pattern,
        Semester: semester,
        Exam,
      };

      const data =
        await AttendanceReportService.getSubjectStudentCount(params);

      setReportData(data ?? []);

      if (!data || data.length === 0) {
        Swal.fire(
          "Information",
          "No attendance report data found.",
          "info"
        );
      }
    } catch (error) {
      console.error("Failed to fetch attendance report:", error);

      Swal.fire(
        "Error",
        "Failed to fetch attendance report.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OPEN / CLOSE BLOCK MODAL
  // ============================================================

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
    if (!ayid || !courseId || !pattern || !semester || !Exam || !Event) {
      Swal.fire(
        "Warning",
        "Please select Course, Pattern, Semester, Exam and Event.",
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
  // COMMON PRINT CSS
  // ============================================================

  const commonBannerCss = `
    .college-banner {
      width: 100%;
      padding: 5px 8px;
      text-align: center;
      border-bottom: 1px solid #555;
    }

    .college-banner img {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      max-height: 105px;
      object-fit: contain;
      margin: 0 auto;
    }
  `;

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

    const examName =
      ExamOptions.find((item) => item.value === Exam)?.label ?? Exam;

    const examTitle =
      `${pattern} - ${examName} - ${selectedRow!.subjectName} - Semester ${semester}`;

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

        // 5 columns ke hisab se kitni rows ki zaroorat hai
        const neededRows = Math.ceil(blockSeats.length / 5);

        // Minimum 8 rows rahengi; agar 40 se zyada students (8*5=40) hue toh rows automatically badhengi
        const totalRowsCount = Math.max(8, neededRows);

        for (let i = 0; i < totalRowsCount; i++) {
          const col1Seat = blockSeats[i];
          const col2Seat = blockSeats[i + totalRowsCount];
          const col3Seat = blockSeats[i + totalRowsCount * 2];
          const col4Seat = blockSeats[i + totalRowsCount * 3];
          const col5Seat = blockSeats[i + totalRowsCount * 4];

          // Sr. Numbers continuation sequentially across 5 columns
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
            ${bannerHtml}

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

              ${commonBannerCss}

              .university-header {
                height: 30px;
                display: grid;
                grid-template-columns: 30px 1fr 30px;
                align-items: center;
                border-bottom: 1px solid #555;
                padding: 2px 4px;
              }

              .logo-box {
                width: 20px;
                height: 20px;
                border: 1px solid #777;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                font-weight: bold;
              }

              .university-title {
                text-align: center;
                line-height: 1.1;
                font-size: 8px;
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

              /* 5 Columns Layout (10 Sub-columns Total) */
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

              .print-button {
                display: block;
                margin: 12px auto;
                padding: 8px 20px;
                border: 0;
                border-radius: 4px;
                background: #2563eb;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
              }

              @media print {
                body {
                  padding: 0;
                }

                .print-button {
                  display: none;
                }

                /* Har 2 blocks ke baad automatic portrait page break */
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
        printWindow.close();
        return;
      }

      const examName =
        ExamOptions.find((item) => item.value === Exam)?.label ?? Exam;

      const examHeaderTitle =
        `${examName} - Semester ${semester} [${selectedRow!.subjectCode}]`;

      let seatIndex = 0;

      const reportHtml = blockDetails
        .map((block) => {
          const allocatedCount = Number(
            block.allocatedStudentCount
          );

          const blockSeats = seatNumbers.slice(
            seatIndex,
            seatIndex + allocatedCount
          );

          seatIndex += allocatedCount;

          const startSeat = blockSeats[0]?.seatNo ?? "--";
          const endSeat =
            blockSeats[blockSeats.length - 1]?.seatNo ?? "--";

          const tableRows = blockSeats
            .map(
              (seat, idx) => `
                <tr>
                  <td class="sr">${idx + 1}</td>
                  <td class="seat-no">${escapeHtml(seat.seatNo)}</td>
                  <td></td>
                  <td></td>
                </tr>
              `
            )
            .join("");

          return `
            <section class="report-card">
              ${bannerHtml}

              <div class="report-header-title">
                <strong>
                  Paper Wise Attendance Sheet and Supervisor Report For
                </strong>
                <div><strong>${escapeHtml(examHeaderTitle)}</strong></div>
              </div>

              <div class="info-row">
                <div class="info-cell flex-1">
                  <strong>Paper:</strong>
                  ${escapeHtml(selectedRow!.subjectName)}
                  (${escapeHtml(selectedRow!.subjectCode)})
                </div>

                <div class="info-cell w-200">
                  <strong>Total Student Count:</strong>
                  ${allocatedCount}
                </div>
              </div>

              <div class="info-row">
                <div class="info-cell flex-1">
                  <strong>Block Name:</strong>
                  ${escapeHtml(block.blockNumber)}
                  &nbsp;&nbsp;
                  <strong>Date &amp; Time:</strong>
                  ${escapeHtml(selectedRow!.date)}
                  &amp;
                  ${escapeHtml(selectedRow!.time)}
                </div>

                <div class="info-cell w-200">
                  <strong>Seat No. From:</strong>
                  ${escapeHtml(startSeat)}
                  <strong>To:</strong>
                  ${escapeHtml(endSeat)}
                </div>
              </div>

              <div class="info-row supervisor-row">
                <strong>Supervisor Name:</strong>
              </div>

              <table class="report-table">
                <thead>
                  <tr>
                    <th style="width:12%">Sr. No.</th>
                    <th style="width:35%">Seat No</th>
                    <th style="width:25%">A/B No.</th>
                    <th style="width:28%">Signature</th>
                  </tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>

              <div class="declaration-text">
                <strong>Declaration by Jr. Supervisor:</strong>
                I have verified the Seat No. of all the students on
                each answer sheet submitted by each student in the
                block and tallies with number allotted by the
                University/College.
              </div>

              <div class="summary-row">
                <div class="summary-cell">
                  <strong>Total Present Students:</strong>
                </div>
                <div class="summary-cell">
                  <strong>Total Absent Students:</strong>
                </div>
                <div class="summary-cell border-right-none">
                  <strong>Total No. of Students in block:</strong>
                  ${allocatedCount}
                </div>
              </div>

              <div class="absent-row">
                <div class="absent-title">
                  <strong>Absent Seat No.</strong>
                </div>
                <div class="absent-space"></div>
                <div class="absent-space"></div>
                <div class="absent-space border-right-none"></div>
              </div>

              <div class="absent-space-large"></div>

              <div class="sign-footer">
                <div class="sign-cell">
                  <strong>Checked By:</strong>
                </div>
                <div class="sign-cell">
                  <strong>Sr. Supervisor (Sign/Name):</strong>
                </div>
                <div class="sign-cell border-right-none">
                  <strong>Jr. Supervisor (Sign/Name):</strong>
                </div>
              </div>
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
              <title>Paper Wise Attendance Sheet and Supervisor Report</title>

              <style>
                @page {
                  size: A4 portrait;
                  margin: 8mm;
                }

                * {
                  box-sizing: border-box;
                }

                body {
                  margin: 0;
                  padding: 10px;
                  color: #000;
                  background: #fff;
                  font-family: "Times New Roman", Times, serif;
                  font-size: 11px;
                }

                .report-card {
                  width: 100%;
                  max-width: 800px;
                  margin: 0 auto 30px;
                  border: 2px solid #000;
                  page-break-inside: avoid;
                  break-inside: avoid;
                }

                ${commonBannerCss}

                .header-container {
                  display: flex;
                  align-items: center;
                  border-bottom: 1.5px solid #000;
                  padding: 6px;
                }

                .logo-container {
                  width: 60px;
                  display: flex;
                  justify-content: center;
                }

                .logo-box {
                  width: 42px;
                  height: 42px;
                  border: 1px solid #444;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: bold;
                }

                .title-container {
                  flex: 1;
                  text-align: center;
                }

                .uni-name {
                  font-size: 14px;
                  font-weight: bold;
                }

                .center-name {
                  font-size: 12px;
                  font-weight: bold;
                  margin-top: 2px;
                }

                .report-header-title {
                  text-align: center;
                  border-bottom: 1.5px solid #000;
                  padding: 6px 4px;
                  font-size: 16px;
                  line-height: 1.35;
                }

                .info-row {
                  display: flex;
                  border-bottom: 1px solid #000;
                  font-size: 15px;
                }

                .info-cell {
                  padding: 4px 6px;
                }

                .flex-1 {
                  flex: 1;
                }

                .w-200 {
                  width: 260px;
                  border-left: 1px solid #000;
                }

                .supervisor-row {
                  padding: 6px;
                  min-height: 28px;
                }

                .report-table {
                  width: 100%;
                  border-collapse: collapse;
                }

                .report-table th,
                .report-table td {
                  border: 1px solid #000;
                  padding: 4px 6px;
                  font-size: 15px;
                  height: 22px;
                }

                .report-table th {
                  text-align: center;
                  font-weight: bold;
                  background: #f2f2f2;
                }

                .report-table .sr,
                .report-table .seat-no {
                  text-align: center;
                  font-weight: bold;
                }

                .declaration-text {
                  padding: 5px 6px;
                  border-top: 1.5px solid #000;
                  border-bottom: 1px solid #000;
                  font-size: 15px;
                  text-align: justify;
                  line-height: 1.25;
                }

                .summary-row {
                  display: flex;
                  border-bottom: 1px solid #000;
                }

                .summary-cell {
                  flex: 1;
                  border-right: 1px solid #000;
                  padding: 4px 6px;
                  font-size: 13px;
                }

                .absent-row {
                  display: flex;
                  border-bottom: 1px solid #000;
                }

                .absent-title {
                  width: 220px;
                  padding: 6px;
                  font-size: 13px;
                  border-right: 2px solid #000;
                  display: flex;
                  align-items: center;
                }

                .absent-space {
                  flex: 1;
                  border-right: 1.5px solid #000;
                  min-height: 28px;
                }

                .absent-space-large {
                  height: 35px;
                  border-bottom: 1.5px solid #000;
                }

                .sign-footer {
                  display: flex;
                }

                .sign-cell {
                  flex: 1;
                  border-right: 1.5px solid #000;
                  padding: 6px;
                  min-height: 40px;
                  font-size: 13px;
                }

                .border-right-none {
                  border-right: none !important;
                }

                .print-button {
                  display: block;
                  margin: 20px auto;
                  padding: 8px 24px;
                  font-size: 14px;
                  font-weight: bold;
                  background: #2563eb;
                  color: #fff;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                }

                @media print {
                  body {
                    padding: 0;
                  }

                  .print-button {
                    display: none;
                  }

                  .report-card {
                    margin-bottom: 0;
                  }
                }
              </style>
            </head>

            <body>
              ${reportHtml}

              
            </body>
          </html>
        `
      );
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

    const examName =
      ExamOptions.find((item) => item.value === Exam)?.label ?? Exam;

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
            <div class="packing-title">PACKING SLIP</div>

            <table class="packing-table">
              <tbody>
                <tr>
                  <td class="lbl-col">Name of College</td>
                  <td class="val-col">
                    VIVA Institute of Technology Shirgaon Kumbhar Pada, Virar
                  </td>
                </tr>

                <tr>
                  <td class="lbl-col">Program Name</td>
                  <td class="val-col">${escapeHtml(programName)}</td>
                </tr>

                <tr>
                  <td class="lbl-col">SEM (Course Part)</td>
                  <td class="val-col">Semester ${escapeHtml(semester)}</td>
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

                ${commonBannerCss}

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

                .print-button {
                  display: block;
                  margin: 20px auto;
                  padding: 8px 24px;
                  font-size: 14px;
                  font-weight: bold;
                  background: #9333ea;
                  color: #fff;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                }

                @media print {
                  body {
                    padding: 0;
                  }

                  .print-button {
                    display: none;
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
  // NUMBER OF BLOCKS
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

  // ============================================================
  // UPDATE BLOCK INPUTS
  // ============================================================

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

  // ============================================================
  // DATATABLE COLUMNS
  // ============================================================

  const columns = [
    {
      key: "subjectCode",
      label: "Subject Code",
    },
    {
      key: "subjectName",
      label: "Subject Name",
    },
    {
      key: "date",
      label: "Date",
    },
    {
      key: "time",
      label: "Time",
    },
    {
      key: "studentCount",
      label: "Student Count",
    },
    {
      key: "actions",
      label: "Action",
      render: (row: AttendanceReportResponse) => (
        <button
          type="button"
          onClick={() => handleOpenBlockPopup(row)}
          title="Enter Number of Blocks"
          className="inline-flex items-center justify-center rounded-lg bg-blue-100 p-2 text-blue-700 transition hover:bg-blue-200"
        >
          <Blocks size={18} />
        </button>
      ),
    },
  ];

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <PageMeta
        title="Attendance Report"
        description="Attendance Report"
      />

      <ComponentCard title="Attendance Report">
        <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* COURSE */}
          <Select
            options={courseOptions}
            placeholder="Select Course"
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setPattern("");
              setSemester("");
              setExam("");
              setExamOptions([]);
              setReportData([]);
            }}
          />

          {/* PATTERN */}
          {courseId && (
            <Select
              options={patternOptions}
              placeholder="Select Pattern"
              value={pattern}
              onChange={(value) => {
                setPattern(value);
                setSemester("");
                setExam("");
                setExamOptions([]);
                setReportData([]);
              }}
            />
          )}

          {/* SEMESTER */}
          {pattern && (
            <Select
              options={semesterOptions}
              placeholder="Select Semester"
              value={semester}
              onChange={(value) => {
                setSemester(value);
                setExam("");
                setExamOptions([]);
                setReportData([]);

                void fetchexam(courseId);
              }}
            />
          )}

          {/* EXAM */}
          {semester && (
            <Select
              options={ExamOptions}
              placeholder="Select Exam"
              value={Exam}
              onChange={(value) => {
                setExam(value);
                setReportData([]);
              }}
            />
          )}

          

          {/* GET DATA */}
          {Exam && (
            <button
              type="button"
              onClick={getData}
              disabled={loading}
              className="flex min-w-64 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              <Save size={18} />
              <span>{loading ? "Loading..." : "Get Data"}</span>
            </button>
          )}
        </div>

        {/* ATTENDANCE REPORT TABLE */}
        {reportData.length > 0 && (
          <div className="mt-6">
            <DataTable
              columns={columns}
              data={reportData}
            />
          </div>
        )}

        {/* BLOCK DETAILS MODAL */}
        <Modal
          isOpen={showBlockPopup}
          onClose={handleCloseBlockPopup}
          className="max-w-6xl p-6"
        >
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Block / Laboratory Details
            </h3>
          </div>

        {selectedRow && (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
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
          <div className="mb-5 max-w-sm">
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

          {/* DYNAMIC BLOCK TABLE */}
          {blockDetails.length > 0 && (
            <div className="mt-4 w-full overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse border border-gray-300 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border border-gray-300 px-3 py-3 text-center dark:border-gray-700">
                      Sr No.
                    </th>

                    <th className="border border-gray-300 px-3 py-3 text-center dark:border-gray-700">
                      Block Number / Laboratory Number
                    </th>

                    <th className="border border-gray-300 px-3 py-3 text-center dark:border-gray-700">
                      Count of Student to be Allocated
                    </th>

                    <th className="border border-gray-300 px-3 py-3 text-center dark:border-gray-700">
                      Present Student Count
                    </th>

                    <th className="border border-gray-300 px-3 py-3 text-center dark:border-gray-700">
                      Coding
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {blockDetails.map((block, index) => (
                    <tr key={block.srNo}>
                      <td className="border border-gray-300 px-3 py-2 text-center dark:border-gray-700">
                        {block.srNo}
                      </td>

                      <td className="border border-gray-300 px-3 py-2 dark:border-gray-700">
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
                          placeholder="Enter block / lab number"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2 dark:border-gray-700">
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
                          placeholder="Enter allocated count"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2 dark:border-gray-700">
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
                          placeholder="Enter present count"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                      </td>

                      <td className="border border-gray-300 px-3 py-2 dark:border-gray-700">
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
                          placeholder="Enter coding"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                      </td>
                    </tr>
                  ))}

                  {/* TOTAL ROW */}
                  <tr className="bg-gray-100 font-semibold dark:bg-gray-800">
                    <td
                      colSpan={2}
                      className="border border-gray-300 px-3 py-3 text-right dark:border-gray-700"
                    >
                      Total
                    </td>

                    <td className="border border-gray-300 px-3 py-3 text-center dark:border-gray-700">
                      {blockDetails.reduce(
                        (total, block) =>
                          total +
                          (Number(block.allocatedStudentCount) || 0),
                        0
                      )}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 dark:border-gray-700" />

                    <td className="border border-gray-300 px-3 py-3 dark:border-gray-700" />
                  </tr>
                </tbody>
              </table>

              {/* REPORT ACTION BUTTONS */}
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSeatingArrangement}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Seating Arrangement
                </button>

                <button
                  type="button"
                  onClick={handleGenerateReport}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Generate Report
                </button>

                <button
                  type="button"
                  onClick={handlePackingSlip}
                  className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Packing Slip
                </button>
              </div>
            </div>
          )}
        </Modal>
      </ComponentCard>
    </>
  );
}
