import React from "react";
import { useLocation } from "react-router-dom";
interface Subject {
  code: string;
  name: string;
  date: string;
  time: string;
}
interface College{
  logo:string;
  center:string;
  CourseNmae:string;
}

interface Student {
  name: string;
  centre: string;
  seat: string;
  subjects: Subject[];
}
interface HallTicketData {
  college: College;
  students: Student[];
}
const HallTicketCard = ({ student, college }: { student: Student; college: College }) => {
 
  React.useEffect(() => {
  setTimeout(() => {
    window.print();
  }, 500); // slight delay for render
}, []);

  return (
  <div style={{  border: "1px solid black", padding: "10px" }}>
      <div style={{ display: "flex", justifyContent: "center", borderBottom: "1px solid black", padding: "10px" }}>
        <img
        //  src="https://res.cloudinary.com/dhgbsprh4/image/upload/v1769075102/college_banners/xqdfwnxbdx0xqp3uqcky.png"
         src={college.logo}
        alt="logo"
          
        />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }} >
        <tbody>
          <tr>
            <td colSpan={3} align="center">
              UNIVERSITY EXAMINATION OF :{college.CourseNmae}
            </td>
            <td rowSpan={2} align="center">
              <img
                src="https://vivacollege.org/LTCE_GradeSphere/img/profile.png"
                alt="student"
                style={{ width: "100px" }}
              />
            </td>
          </tr>
          <tr>
            <td>
              <strong>CANDIDATE:</strong> {student.name}
            </td>
            <td>
              <strong>CENTRE:</strong>{college.center}
            </td>
            <td>
              <strong>SEAT NO:</strong> {student.seat}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" ,border: "1px solid black"}} >
        <thead>
          <tr>
            <th style={{ border: "1px solid black", }}>SUBJECT CODE</th>
            <th style={{ border: "1px solid black", }}>SUBJECT</th>
            <th>DATE</th>
            <th>TIME</th>
          </tr>
        </thead>
        <tbody>
          {student.subjects.map((sub, i) => (
            <tr key={i} style={{ border: "1px solid black", }}>
              <td align="center" style={{ border: "1px solid black", }}>{sub.code}</td>
              <td align="center" >{sub.name}</td>
              <td align="center" style={{ border: "1px solid black", }}>{sub.date}</td>
              <td align="center" style={{ border: "1px solid black", }}>{sub.time}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ border: "1px solid black", marginTop: "10px" }}>
        Note: Please see notice board.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
        <p>Signature of Candidate</p>
        <p>Principal</p>
      </div>
    </div>
  );
};


export default function HallTicketPage() {
//   const location = useLocation();
// const state = location.state as HallTicketData;

// const college = state?.college;
// const data = state?.students || [];
const storedData = localStorage.getItem("hallTicketData");

const parsedData: HallTicketData | null = storedData
  ? JSON.parse(storedData)
  : null;

const college: College = parsedData?.college || {
  logo: "",
  center: "",
  CourseNmae: ""
};
const data: Student[] = parsedData?.students || [];
  return (
    <div>
      <div>
      {data.map((student, index) => (
  <div key={index} className="page">
    <HallTicketCard  student={student} college={college}  />
  </div>
))}
      </div>


     <style>
{`
  @media print {
    button { display: none; }

    .page {
      pagse-break-after: always;
    }
      * {
   border: "1px solid black"
  }
  }
`}
</style>
    </div>
  );
}
