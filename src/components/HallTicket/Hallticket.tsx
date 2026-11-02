import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
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
  /** Printed as a numbered list under the subjects; empty or missing = no block. */
  instructions?: string[];
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
  padding: "5px 8px",
  fontSize: "14px",
  fontWeight: "bold",
  backgroundColor: "#f9f9f9",
  width: "149px"
};

const value: React.CSSProperties = {
  border: "1px solid black",
  padding: "5px 8px",
  fontSize: "14px"
};

// Subject table: compact cells so a full semester (~12 subjects) still fits one A4 sheet in print.
const th: React.CSSProperties = {
  border: "1px solid black",
  padding: "4px 6px",
  fontSize: "12px",
  fontWeight: "bold",
  textAlign: "center"
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "3px 6px",
  fontSize: "12px",
  textAlign: "center"
};

// Code, date and time never wrap; the subject name takes the remaining width.
const tdNoWrap: React.CSSProperties = { ...td, whiteSpace: "nowrap" };

// Height reserved at the bottom of each card for the signature and seal block (absolutely positioned).
const SIGNATURE_BLOCK_HEIGHT_PX = 116;

/**
 * The first line stays on one line: long branch names ("COMPUTER SCIENCE & ENGINEERING (AIML) …") get a smaller
 * font instead of wrapping. ~750px of line on an A4 card; bold Arial capitals measure about 0.6em wide, so aim at 730px.
 */
const titleSize = (title: string) => Math.max(9, Math.min(18, Math.floor(730 / (Math.max(title.length, 1) * 0.62))));

// The card is one A4 sheet: 276 mm (the 297 mm sheet less the 10 mm @page margins and a little to spare), at 96 dpi.
const CARD_MAX_HEIGHT_PX = (276 * 96) / 25.4;
// The card's 2px border (top and bottom) and 15px top padding; the bottom padding is the signature block.
const CARD_FIXED_PX = 4 + 15 + SIGNATURE_BLOCK_HEIGHT_PX;

/** Sizes of the instructions block, biggest first; the first one that fits the sheet is used. */
const INSTRUCTION_LEVELS = [
  { font: 12, line: 1.4, columns: 1 },
  { font: 11, line: 1.4, columns: 1 },
  { font: 10, line: 1.4, columns: 1 },
  { font: 9, line: 1.4, columns: 1 },
  { font: 9, line: 1.4, columns: 2 },
];

/** The boxed, numbered instructions. The wrapper's top padding is the gap above the box (a margin would not be measured). */
const InstructionsBlock = ({
  lines,
  level,
  blockRef,
}: {
  lines: string[];
  level: (typeof INSTRUCTION_LEVELS)[number];
  blockRef?: (el: HTMLDivElement | null) => void;
}) => (
  <div ref={blockRef} style={{ paddingTop: "10px" }}>
    <div
      style={{
        border: "1px solid black",
        padding: "6px 10px",
        backgroundColor: "#fafafa",
        fontSize: `${level.font}px`,
        lineHeight: level.line,
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: `${level.font + 1}px` }}>Instructions to candidates</div>
      <ol
        style={{
          margin: "4px 0 0",
          paddingLeft: "20px",
          listStyleType: "decimal",
          columnCount: level.columns,
          columnGap: "20px",
        }}
      >
        {lines.map((line, i) => (
          <li key={i} style={{ breakInside: "avoid", paddingLeft: "2px", marginBottom: "1px" }}>
            {line}
          </li>
        ))}
      </ol>
    </div>
  </div>
);

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
  onFit,
}: {
  student: Student;
  college: College;
  /** Called with whether the card fits one A4 sheet; false only when even the smallest instructions text overflows. */
  onFit?: (fits: boolean) => void;
}) => {
  const lines = college.instructions ?? [];
  const hasInstructions = lines.length > 0;

  // Everything above the signature block, so its height can be measured without the instructions.
  const contentRef = useRef<HTMLDivElement>(null);
  const shownRef = useRef<HTMLDivElement>(null);
  const trialRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [level, setLevel] = useState(0);
  const [fits, setFits] = useState<boolean | null>(null);

  // Picks the biggest level whose block fits. "other" (the card without the block) does not depend on the level and the
  // sizes come from hidden copies, so the choice cannot flip back and forth. offsetHeight ignores CSS transforms.
  const measure = () => {
    if (!hasInstructions) {
      setLevel(0);
      setFits(true);
      return;
    }
    const content = contentRef.current;
    const shown = shownRef.current;
    if (!content || !shown) return;
    const other = content.offsetHeight - shown.offsetHeight;
    const room = CARD_MAX_HEIGHT_PX - CARD_FIXED_PX - other;
    let pick = INSTRUCTION_LEVELS.length - 1;
    let ok = false;
    for (let i = 0; i < INSTRUCTION_LEVELS.length; i++) {
      const trial = trialRefs.current[i];
      if (trial && trial.offsetHeight <= room) {
        pick = i;
        ok = true;
        break;
      }
    }
    setLevel((old) => (old === pick ? old : pick));
    setFits((old) => (old === ok ? old : ok));
  };

  // Runs after every render (it only sets state when the result changes) and when the content resizes (images load late).
  const measureRef = useRef(measure);
  useLayoutEffect(() => {
    measureRef.current = measure;
    measure();
  });
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const onFitRef = useRef(onFit);
  useEffect(() => {
    onFitRef.current = onFit;
  });
  useEffect(() => {
    if (fits !== null) onFitRef.current?.(fits);
  }, [fits]);

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
      <div ref={contentRef} style={{ display: "flow-root" }}>
      {/* HEADER */}
      <CollegeHeader logo={college.logo} collegeName={college.collegeName} logoMaxHeight="22mm" />

      {/* TITLE */}
      <h2
        style={{
          textAlign: "center",
          margin: "8px 0",
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
          marginTop: "6px",
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
                padding: "5px",
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
          marginTop: "12px",
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
              <td style={{ ...td, width: "18%" }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* INSTRUCTIONS */}
      {hasInstructions && <InstructionsBlock lines={lines} level={INSTRUCTION_LEVELS[level]} blockRef={(el) => { shownRef.current = el; }} />}
      </div>

      {/* Hidden copies of the instructions at every size, only to measure them */}
      {hasInstructions &&
        INSTRUCTION_LEVELS.map((l, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{ position: "absolute", top: 0, left: "15px", width: "calc(100% - 30px)", visibility: "hidden", pointerEvents: "none" }}
          >
            <InstructionsBlock lines={lines} level={l} blockRef={(el) => { trialRefs.current[i] = el; }} />
          </div>
        ))}

      {/* Signatures and the office seal, fixed at the bottom of the sheet */}
      <div
        style={{
          position: "absolute",
          bottom: "14px",
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
          style={{ width: "90px", height: "90px", objectFit: "contain" }}
          fallback={<div style={{ width: "90px", height: "90px", border: "1px dashed #999", borderRadius: "50%" }} />}
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

          /* On screen: the same width as in print (the 210mm sheet less the 10mm margins), so the text wraps the same. */
          .hallticket-card {
            width: 190mm;
            min-height: 276mm;
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