import React from "react";
import CollegeHeader from "./CollegeHeader";
import { appStorage } from "../../utils/appStorage";
import type { TimeTableAll } from "../../services/GenerateHallTicketService";

// ================= STYLES =================
// Compact cells so three blocks of ~6-11 subjects fit one A4 portrait sheet.
const th: React.CSSProperties = {
  border: "1px solid black",
  padding: "2px 4px",
  fontSize: "10.5px",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "#eaeaea",
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "2px 4px",
  fontSize: "10.5px",
  lineHeight: 1.25,
  textAlign: "center",
};

const tdNoWrap: React.CSSProperties = { ...td, whiteSpace: "nowrap" };

/** Weekday of a DD-MM-YYYY date ("Thursday"); blank when the text is not a real date. */
function weekdayOf(date: string): string {
  const m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec((date ?? "").trim());
  if (!m) return "";
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return "";
  return dt.toLocaleDateString("en-IN", { weekday: "long" });
}

// ================= PAGE =================
export default function TimeTablePrintPage() {
  const stored = appStorage.get("timeTableAllData");
  const data: TimeTableAll | null = stored ? JSON.parse(stored) : null;

  const college = data?.college ?? { logo: "", center: "" };
  const blocks = data?.blocks ?? [];
  const examLine = [
    [data?.examName, data?.examType ? `(${data.examType})` : ""].filter(Boolean).join(" "),
    data?.academicYear ? `A.Y. ${data.academicYear}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  // Print once, after the logo (repeated in every block) has loaded; capped so a missing image cannot block printing.
  const expectedImages = college.logo ? blocks.length : 0;
  React.useEffect(() => {
    if (blocks.length === 0) return;
    const startedAt = Date.now();
    let timer: number | undefined;
    const tick = () => {
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".tt-block img"));
      const ready = imgs.length >= expectedImages && imgs.every((i) => i.complete);
      if (ready || Date.now() - startedAt > 8000) {
        timer = window.setTimeout(() => window.print(), 300);
      } else {
        timer = window.setTimeout(tick, 250);
      }
    };
    timer = window.setTimeout(tick, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (blocks.length === 0) {
    return <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>No time table found to print.</div>;
  }

  return (
    <div className="tt-sheet">
      {blocks.map((block, i) => (
        <div key={i} className="tt-block">
          <CollegeHeader logo={college.logo} collegeName={college.collegeName} logoMaxHeight="15mm" nameFontSize="16px" />

          <h2
            style={{
              textAlign: "center",
              margin: "4px 0 1px",
              fontSize: "15px",
              letterSpacing: "0.5px",
            }}
          >
            EXAMINATION TIME TABLE
          </h2>
          {examLine && (
            <div style={{ textAlign: "center", margin: "0 0 2px", fontSize: "11.5px", fontWeight: "bold" }}>{examLine}</div>
          )}
          <div style={{ textAlign: "center", margin: "0 0 4px", fontSize: "11.5px" }}>
            <b>Programme:</b> {block.branchName}
            <span style={{ display: "inline-block", width: "6mm" }} />
            <b>Semester:</b> {block.semester}
            <span style={{ display: "inline-block", width: "6mm" }} />
            <b>Pattern:</b> {block.pattern}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Day</th>
                <th style={th}>Time</th>
                <th style={th}>Subject Code</th>
                <th style={th}>Subject Name</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, j) => (
                <tr key={j}>
                  <td style={tdNoWrap}>{r.date}</td>
                  <td style={tdNoWrap}>{weekdayOf(r.date)}</td>
                  <td style={tdNoWrap}>{r.time}</td>
                  <td style={tdNoWrap}>{r.subjectCode}</td>
                  <td style={{ ...td, textAlign: "left" }}>{r.subjectName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* PRINT STYLE */}
      <style>
        {`
          @page { size: A4 portrait; margin: 8mm; }

          .tt-sheet { font-family: Arial, sans-serif; background: #fff; color: #000; }

          /* On screen: an A4-wide column of blocks. */
          .tt-block {
            width: 210mm;
            margin: 10px auto;
            padding: 2mm 3mm 3mm;
            box-sizing: border-box;
            border: 1.5px solid black;
            background: #fff;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @media print {
            button { display: none; }
            body { margin: 0; }

            /* Compact stacking: three typical blocks (6-11 rows) fill one sheet; a taller block simply
               pushes the next one to a new page instead of being split. */
            .tt-block {
              width: 100%;
              margin: 0 0 3mm;
            }
          }
        `}
      </style>
    </div>
  );
}
