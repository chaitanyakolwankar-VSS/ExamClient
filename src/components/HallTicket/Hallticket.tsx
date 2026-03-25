import React from "react";

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
  CourseNmae: string;
}

interface Student {
  name: string;
  centre: string;
  seat: string;
  studentid:string;
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

const sign: React.CSSProperties = {
  borderTop: "1px solid black",
  width: "200px",
  textAlign: "center",
  paddingTop: "5px"
};

// ================= CARD =================
const HallTicketCard = ({
  student,
  college,
}: {
  student: Student;
  college: College;
}) => {
  React.useEffect(() => {
    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  return (
    <div
      style={{
        border: "2px solid black",
        padding: "15px",
        margin: "10px auto",
        width: "210mm",
        minHeight: "280mm",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#fff",
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
        <img
          src={college.logo}
          alt="logo"
          style={{  objectFit: "contain" }}
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
              <img
                src="https://vivacollege.org/LTCE_GradeSphere/img/profile.png"
                alt="student"
                style={{
                  width: "116px",
                  height: "120px",
                  objectFit: "cover",
                }}
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "135px",
        }}
      >
        <div style={sign}>Signature of Candidate</div>
        <div style={sign}>Principal</div>
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
          @media print {
            button { display: none; }

            .page {
              page-break-after: always;
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