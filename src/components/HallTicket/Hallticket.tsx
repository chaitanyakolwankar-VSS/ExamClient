import React from "react";
import AuthImage from "../common/AuthImage";

// ================= TYPES =================
interface Subject {
  code: string;
  name: string;
  date: string;
  time: string;
}

interface College {
  logo: string;
  center: string;
  /** Shown as a text header when there is no logo (or it cannot be loaded). */
  collegeName?: string;
  CourseNmae: string;
}

interface Student {
  name: string;
  centre: string;
  seat: string;
  studentid:string;
  photo?: string | null;
  subjects: Subject[];
}

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

const th: React.CSSProperties = {
  border: "1px solid black",
  padding: "10px",
  fontWeight: "bold",
  textAlign: "center"
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px",
  textAlign: "center"
};

// Height reserved at the bottom of each card for the signature block (absolutely positioned).
const SIGNATURE_BLOCK_HEIGHT_PX = 70;

// ================= CARD =================
const HallTicketCard = ({
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderBottom: "2px solid black",
          paddingBottom: "10px",
        }}
      >
        <AuthImage
          src={college.logo}
          alt="logo"
          style={{ maxWidth: "100%", maxHeight: "30mm", objectFit: "contain" }}
          fallback={
            college.collegeName ? (
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  textAlign: "center",
                  textTransform: "uppercase",
                  padding: "6px 0",
                }}
              >
                {college.collegeName}
              </div>
            ) : null
          }
        />
      </div>

      {/* TITLE */}
      <h2
        style={{
          textAlign: "center",
          margin: "10px 0",
          fontSize: "18px",
        }}
      >
        UNIVERSITY EXAMINATION OF : {college.CourseNmae}
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
              rowSpan={4}
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
              <td style={td}>{sub.code}</td>
              <td style={td}>{sub.name}</td>
              <td style={td}>{sub.date}</td>
              <td style={td}>{sub.time}</td>
                <td style={td}></td>
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

      {/* SIGNATURE */}
   {/* ✅ Signature Fixed Bottom */}
  <div
    style={{
      position: "absolute",
      bottom: "20px",
      left: "15px",
      right: "15px",
      display: "flex",
      justifyContent: "space-between"
    }}
  >
    <div style={{ width: "200px", textAlign: "center" }}>
      <div style={{ borderTop: "1px solid black", paddingTop: "5px" }}>
        Signature of Candidate
      </div>
    </div>

    <div style={{ width: "200px", textAlign: "center" }}>
      <div style={{ borderTop: "1px solid black", paddingTop: "5px" }}>
        Principal
      </div>
    </div>
  </div>

</div>
  );
};

// ================= PAGE =================
export default function HallTicketPage() {
  const storedData = localStorage.getItem("hallTicketData");

  const parsedData: HallTicketData | null = storedData
    ? JSON.parse(storedData)
    : null;

  const college: College = parsedData?.college || {
    logo: "",
    center: "",
    CourseNmae: "",
  };

  const data: Student[] = parsedData?.students || [];

  // Print the whole set ONCE (not once per card). Logo and photos arrive asynchronously through
  // AuthImage, so wait until every expected image is on the page and decoded, with a cap so a
  // missing/failed image cannot block printing forever.
  const expectedImages =
    (college.logo ? 1 : 0) + data.filter((s) => s.photo).length;
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