import React from "react";
import AuthImage from "../common/AuthImage";
import CollegeHeader from "./CollegeHeader";
import { appStorage } from "../../utils/appStorage";

// ================= TYPES =================
interface Subject {
  code: string;
  name: string;
  date: string;
  time: string;
}

export interface HallTicketCollegeInfo {
  logo: string;
  center: string;
  /** Shown as a text header when there is no logo (or it cannot be loaded). */
  collegeName?: string;
  /** The first line, from hallTicketTitle(): "EXAMINATION OF : CIVIL ENGINEERING (NEP - R-24) REGULAR DEC 2026". */
  title: string;
  /** Stored paths (or blob: URLs) of the Principal's and the Controller of Examinations' signatures and the office seal. */
  principalSign?: string;
  controllerSign?: string;
  seal?: string;
}

export interface HallTicketStudent {
  name: string;
  centre: string;
  seat: string;
  studentid: string;
  /** ERN and ABC ID; empty when not on record. */
  ern?: string;
  abcId?: string;
  photo?: string | null;
  /** Stored path of the student's signature image (null when none). */
  sign?: string | null;
  subjects: Subject[];
}

type College = HallTicketCollegeInfo;
type Student = HallTicketStudent;

interface HallTicketData {
  college: College;
  students: Student[];
}

// ================= STYLES =================
const label: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px",
  fontWeight: "bold",
  backgroundColor: "#f9f9f9",
  width: "149px"
};

const value: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px"
};

// Subject table: compact cells so a full semester (~12 subjects) still fits one A4 sheet in print.
const th: React.CSSProperties = {
  border: "1px solid black",
  padding: "6px",
  fontSize: "12px",
  fontWeight: "bold",
  textAlign: "center"
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "5px 6px",
  fontSize: "12px",
  textAlign: "center"
};

// Code, date and time never wrap; the subject name takes the remaining width.
const tdNoWrap: React.CSSProperties = { ...td, whiteSpace: "nowrap" };

// Height reserved at the bottom of each card for the signature and seal block (absolutely positioned).
const SIGNATURE_BLOCK_HEIGHT_PX = 130;

/**
 * The first line stays on one line: long branch names ("COMPUTER SCIENCE & ENGINEERING (AIML) …") get a smaller
 * font instead of wrapping. ~750px of line on an A4 card; bold Arial capitals measure about 0.6em wide, so aim at 730px.
 */
const titleSize = (title: string) => Math.max(9, Math.min(18, Math.floor(730 / (Math.max(title.length, 1) * 0.62))));

/** A signature over its title line at the bottom of the card. */
const Signatory = ({ src, alt, title }: { src?: string; alt: string; title: string }) => (
  <div style={{ width: "210px", textAlign: "center" }}>
    {src ? (
      <AuthImage src={src} alt={alt} style={{ display: "block", height: "40px", maxWidth: "190px", objectFit: "contain", margin: "0 auto 2px" }} />
    ) : (
      <div style={{ height: "42px" }} />
    )}
    <div style={{ borderTop: "1px solid black", paddingTop: "5px", fontSize: "13px" }}>{title}</div>
  </div>
);

// ================= CARD =================
export const HallTicketCard = ({
  student,
  college,
}: {
  student: Student;
  college: College;
}) => {
  return (
    <div
      className="hallticket-card"
      style={{
        border: "2px solid black",
        padding: "15px",
        // Reserve room for the absolutely positioned signature block so a long subject list
        // (and the Note box) can never run underneath it.
        paddingBottom: `${SIGNATURE_BLOCK_HEIGHT_PX}px`,
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#fff",
        position: "relative",
      }}
    >
      {/* HEADER */}
      <CollegeHeader logo={college.logo} collegeName={college.collegeName} />

      {/* TITLE */}
      <h2
        style={{
          textAlign: "center",
          margin: "10px 0",
          fontSize: `${titleSize(college.title)}px`,
          whiteSpace: "nowrap",
        }}
      >
        {college.title}
      </h2>

      {/* STUDENT DETAILS */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <tbody>
          <tr>
            <td
              colSpan={4}
              style={{
                border: "1px solid black",
                textAlign: "center",
                fontWeight: "bold",
                padding: "8px",
                backgroundColor: "#f2f2f2",
              }}
            >
              STUDENT DETAILS
            </td>

            
          </tr>

          <tr>
            <td style={label}>Candidate Name</td>
            <td colSpan={2} style={value}>{student.name}</td>
            <td
              rowSpan={6}
              style={{
                border: "1px solid black",
                textAlign: "center",
                width: "120px",
              }}
            >
              {/* The student's own uploaded photo, loaded through the authenticated /Files endpoint. */}
              <AuthImage
                src={student.photo}
                alt="student"
                style={{
                  width: "116px",
                  height: "120px",
                  objectFit: "cover",
                }}
                fallback={
                  <div
                    style={{
                      width: "116px",
                      height: "120px",
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed #999",
                      color: "#777",
                      fontSize: "12px",
                    }}
                  >
                    Photo
                  </div>
                }
              />
              {/* The student's uploaded signature, under the photo. */}
              <AuthImage
                src={student.sign}
                alt="student signature"
                style={{
                  display: "block",
                  width: "116px",
                  height: "36px",
                  objectFit: "contain",
                  margin: "4px auto 0",
                }}
                fallback={
                  <div
                    style={{
                      width: "116px",
                      height: "36px",
                      margin: "4px auto 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed #999",
                      color: "#777",
                      fontSize: "11px",
                    }}
                  >
                    Signature
                  </div>
                }
              />
            </td>
          </tr>

          <tr>
            <td style={label}>Center</td>
            <td colSpan={2} style={value}>{college.center}</td>
          </tr>
            <tr>
            <td style={label}>Seat No </td>
            <td colSpan={2} style={value}>{student.seat}</td>
          </tr>
          <tr>
            <td style={label}>Student ID </td>
            <td colSpan={2} style={value}>{student.studentid}</td>
          </tr>
          <tr>
            <td style={label}>ERN No.</td>
            <td colSpan={2} style={value}>{student.ern || "—"}</td>
          </tr>
          <tr>
            <td style={label}>ABC ID</td>
            <td colSpan={2} style={value}>{student.abcId || "—"}</td>
          </tr>
        </tbody>
      </table>

      {/* SUBJECT TABLE */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#eaeaea" }}>
            <th style={th}>Subject Code</th>
            <th style={th}>Subject</th>
            <th style={th}>Date</th>
            <th style={th}>Time</th>
            <th style={th}>Signature Of Invigilator</th>
          </tr>
        </thead>

        <tbody>
          {student.subjects.map((sub, i) => (
            <tr key={i}>
              <td style={tdNoWrap}>{sub.code}</td>
              <td style={{ ...td, textAlign: "left" }}>{sub.name}</td>
              <td style={tdNoWrap}>{sub.date}</td>
              <td style={tdNoWrap}>{sub.time}</td>
              <td style={{ ...td, width: "22%" }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* NOTE */}
      <div
        style={{
          border: "1px solid black",
          padding: "10px",
          marginTop: "15px",
          fontSize: "13px",
          backgroundColor: "#fafafa",
        }}
      >
        <b>Note:</b> Please see notice board for updates.
      </div>

      {/* Signatures and the office seal, fixed at the bottom of the sheet */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "15px",
          right: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Signatory src={college.controllerSign} alt="controller of examinations signature" title="Controller of Examinations" />
        {/* The round seal, printed from College Details; a blank circle marks where to stamp when there is none. */}
        <AuthImage
          src={college.seal}
          alt="college seal"
          style={{ width: "100px", height: "100px", objectFit: "contain" }}
          fallback={<div style={{ width: "100px", height: "100px", border: "1px dashed #999", borderRadius: "50%" }} />}
        />
        <Signatory src={college.principalSign} alt="principal signature" title="Principal" />
      </div>
    </div>
  );
};

// ================= PAGE =================
export default function HallTicketPage() {
  const storedData = appStorage.get("hallTicketData");

  const parsedData: HallTicketData | null = storedData
    ? JSON.parse(storedData)
    : null;

  const college: College = parsedData?.college || {
    logo: "",
    center: "",
    title: "",
  };

  const data: Student[] = parsedData?.students || [];

  // Print the whole set ONCE (not once per card). Logo and photos arrive asynchronously through
  // AuthImage, so wait until every expected image is on the page and decoded, with a cap so a
  // missing/failed image cannot block printing forever.
  const expectedImages =
    (college.logo ? 1 : 0) +
    ((college.principalSign ? 1 : 0) + (college.controllerSign ? 1 : 0) + (college.seal ? 1 : 0)) * data.length +
    data.filter((s) => s.photo).length +
    data.filter((s) => s.sign).length;
  React.useEffect(() => {
    if (data.length === 0) return;
    const startedAt = Date.now();
    let timer: number | undefined;
    const tick = () => {
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".hallticket-card img"));
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

  return (
    <div>
      {data.map((student, index) => (
        <div key={index} className="page">
          <HallTicketCard student={student} college={college} />
        </div>
      ))}

      {/* PRINT STYLE */}
      <style>
        {`
          @page { size: A4; margin: 10mm; }

          /* On screen: one A4 sheet per card. */
          .hallticket-card {
            width: 210mm;
            min-height: 297mm;
            margin: 10px auto;
          }

          @media print {
            button { display: none; }

            /* 297mm - 2 x 10mm @page margins = 277mm printable; stay just under so a card never
               spills onto a second sheet. */
            .hallticket-card {
              width: 100%;
              min-height: 276mm;
              margin: 0;
            }

            .page {
              page-break-after: always;
              break-after: page;
            }

            .page:last-of-type {
              page-break-after: auto;
              break-after: auto;
            }

            body {
              margin: 0;
            }
          }
        `}
      </style>
    </div>
  );
}