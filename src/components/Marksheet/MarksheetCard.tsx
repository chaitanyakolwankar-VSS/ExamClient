import AuthImage from "../common/AuthImage";
import type {
  MarksheetBranding,
  MarksheetData,
  MarksheetSubject,
} from "../../services/ReportService";

/**
 * The marksheet as an A4 sheet in the browser. Every measurement and colour mirrors
 * EXAM_API/ExamAPI/Services/Report/Documents/MarksheetDocument.cs (30 pt margins, 9 pt body text,
 * Blue.Darken3 headings, the same column widths), so the preview and the generated PDF agree.
 *
 * Sizes are written in px at 96 dpi (1 pt = 4/3 px) because the PNG captured for the PDF is
 * rasterised at that scale.
 */

const PT = 4 / 3; // px per point

/** A4 at 96 dpi; QuestPDF's 210 mm x 297 mm page. */
const SHEET_WIDTH = 794;
const SHEET_HEIGHT = 1123;

const BLUE_DARKEN3 = "#1565C0";
const GREY_DARKEN4 = "#212121";
const GREY_LIGHTEN4 = "#F5F5F5";
const GREY_LIGHTEN3 = "#EEEEEE";
const GREY_LIGHTEN2 = "#E0E0E0";
const GREY_LIGHTEN1 = "#BDBDBD";
const BLUE_LIGHTEN5 = "#E3F2FD";
const BLUE_LIGHTEN3 = "#90CAF9";
const GREEN_DARKEN2 = "#388E3C";
const RED_DARKEN2 = "#D32F2F";

/** C# prints doubles without trailing zeros ("4", "3.5"); `0.##` caps heads at two decimals. */
const num = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? ""
    : String(Number(value.toFixed(2)));

/** A fixed 2-decimal figure, as `{value:F2}` prints it. */
const fixed2 = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "-"
    : value.toFixed(2);

/** The ISO date from the API as the sheet prints it (dd/MM/yyyy), without a timezone shift. */
const printedDate = (iso: string | null | undefined) => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : (iso ?? "");
};

const isPass = (remark: string | null | undefined) =>
  (remark ?? "").trim().toLowerCase() === "pass";

const cell: React.CSSProperties = {
  borderBottom: `0.5px solid ${GREY_LIGHTEN2}`,
  padding: `${4 * PT}px`,
  fontSize: 9 * PT,
  verticalAlign: "middle",
};

const th: React.CSSProperties = {
  background: BLUE_DARKEN3,
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: 9 * PT,
  padding: `${5 * PT}px`,
  textAlign: "center",
};

const signatureBlock: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
};

const signatureImage: React.CSSProperties = {
  height: "100%",
  maxWidth: "100%",
  objectFit: "contain",
};

function SubjectRow({ subject }: { subject: MarksheetSubject }) {
  return (
    <tr>
      <td style={{ ...cell, textAlign: "center" }}>{subject.subjectCode}</td>
      <td style={{ ...cell, textAlign: "left" }}>{subject.subjectName}</td>
      <td style={{ ...cell, textAlign: "center" }}>
        {subject.heads.map((head, i) => (
          <div key={`${head.head}-${i}`} style={{ fontSize: 8 * PT, lineHeight: 1.4 }}>
            {head.head}: {head.marks}
            {head.grace}/{num(head.max)}
          </div>
        ))}
      </td>
      <td style={{ ...cell, textAlign: "center" }}>
        {subject.totalObtained}/{num(subject.totalMax)}
      </td>
      <td style={{ ...cell, textAlign: "center" }}>
        {subject.grade}
        {subject.grace}
      </td>
      <td style={{ ...cell, textAlign: "center" }}>
        {num(subject.gradePoint)}
      </td>
      <td style={{ ...cell, textAlign: "center" }}>{num(subject.credits)}</td>
      <td style={{ ...cell, textAlign: "center" }}>
        {num(subject.earnedGradePoints)}
      </td>
    </tr>
  );
}

function Signatory({
  title,
  image,
}: {
  title: string;
  image: string | null | undefined;
}) {
  return (
    <div style={signatureBlock}>
      <div
        style={{
          height: 34 * PT,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <AuthImage src={image} alt="" style={signatureImage} />
      </div>
      <div
        style={{
          borderTop: "0.75px solid #000000",
          paddingTop: 4,
          textAlign: "center",
          fontSize: 9 * PT,
          fontWeight: 700,
        }}
      >
        {title}
      </div>
    </div>
  );
}

interface Props {
  data: MarksheetData;
  branding: MarksheetBranding;
}

export default function MarksheetCard({ data, branding }: Props) {
  const hasBanner = !!branding.banner;
  const hasLogo = !!branding.logo;
  const logoWidth = 44 * PT * 1.5; // logo height 44 pt, width 1.5x (BrandedHeader)

  const summary: { label: string; value: string; color?: string }[] = [
    { label: "Total Marks", value: `${num(data.totalObtained)} / ${num(data.totalMax)}` },
    {
      label: "Credits Earned",
      value: `${num(data.creditsEarned)} / ${num(data.totalCredits)}`,
    },
    { label: "SGPI", value: fixed2(data.sgpi) },
    { label: "CGPI", value: data.cgpi === null ? "-" : fixed2(data.cgpi) },
    {
      label: "Remark",
      value: data.remark,
      color: isPass(data.remark) ? GREEN_DARKEN2 : RED_DARKEN2,
    },
  ];

  return (
    <div
      className="marksheet-card"
      style={{
        width: SHEET_WIDTH,
        minHeight: SHEET_HEIGHT,
        boxSizing: "border-box",
        padding: 30 * PT,
        background: "#FFFFFF",
        color: GREY_DARKEN4,
        fontFamily: "Arial, Helvetica, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header>
        {/* Banner replaces the logo and name text; otherwise logo left of the title, title stays centred. */}
        {hasBanner ? (
          <div
            style={{
              height: 72 * PT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AuthImage
              src={branding.banner}
              alt=""
              style={{ height: "100%", maxWidth: "100%", objectFit: "contain" }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: hasLogo ? logoWidth : 0,
                height: 44 * PT,
                display: "flex",
                alignItems: "center",
              }}
            >
              {hasLogo && (
                <AuthImage
                  src={branding.logo}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              )}
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 15 * PT,
                fontWeight: 700,
                color: BLUE_DARKEN3,
                whiteSpace: "pre-line",
              }}
            >
              {data.collegeName || branding.collegeName}
            </div>
            {/* Mirrors the logo column so the title stays centred on the page. */}
            <div style={{ width: hasLogo ? logoWidth : 0 }} />
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            fontSize: 12 * PT,
            fontWeight: 700,
            color: GREY_DARKEN4,
          }}
        >
          STATEMENT OF MARKS
        </div>

        <div
          style={{
            marginTop: 10 * PT,
            background: GREY_LIGHTEN4,
            border: `0.5px solid ${GREY_LIGHTEN2}`,
            padding: 8 * PT,
            display: "flex",
            justifyContent: "space-between",
            gap: 4 * PT,
          }}
        >
          <div style={{ fontSize: 9 * PT, lineHeight: 1.6 }}>
            <div>
              <strong>Name: </strong>
              {data.studentName}
            </div>
            <div>
              <strong>Program: </strong>
              {data.programName}
            </div>
            <div>
              <strong>Examination: </strong>
              {data.examName}
            </div>
          </div>
          <div
            style={{ fontSize: 9 * PT, lineHeight: 1.6, textAlign: "right" }}
          >
            <div>
              <strong>Seat No: </strong>
              {data.seatNo}
            </div>
            <div>
              <strong>ERN: </strong>
              {data.prn}
            </div>
            <div>
              <strong>Semester: </strong>
              {data.semester}
            </div>
          </div>
        </div>

        <div
          style={{ marginTop: 10 * PT, borderTop: `1px solid ${GREY_LIGHTEN1}` }}
        />
      </header>

      <section style={{ paddingTop: 10 * PT, paddingBottom: 10 * PT }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: 64 * PT }} />
            <col style={{ width: "27.5%" }} />
            <col style={{ width: "20.2%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "7.3%" }} />
            <col style={{ width: "7.3%" }} />
            <col style={{ width: "7.3%" }} />
            <col style={{ width: "7.3%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={th}>Code</th>
              <th style={{ ...th, textAlign: "left" }}>Course Name</th>
              <th style={th}>Heads (obt/max)</th>
              <th style={th}>Total</th>
              <th style={th}>Grd</th>
              <th style={th}>GP</th>
              <th style={th}>C</th>
              <th style={th}>CG</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((subject, i) => (
              <SubjectRow key={`${subject.subjectCode}-${i}`} subject={subject} />
            ))}
          </tbody>
        </table>

        <div
          style={{
            marginTop: 15 * PT,
            background: BLUE_LIGHTEN5,
            border: `1px solid ${BLUE_LIGHTEN3}`,
            padding: 8 * PT,
            display: "flex",
          }}
        >
          {summary.map((item) => (
            <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 8 * PT,
                  fontWeight: 700,
                  color: BLUE_DARKEN3,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 11 * PT,
                  fontWeight: 700,
                  color: item.color,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {data.pastSemesters.length > 0 && (
          <>
            <div
              style={{
                marginTop: 20 * PT,
                fontSize: 11 * PT,
                fontWeight: 700,
                color: BLUE_DARKEN3,
              }}
            >
              Semester History
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                marginTop: 5 * PT,
              }}
            >
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr>
                  {[
                    "Semester",
                    "Credits",
                    "Earned Grade Points (CG)",
                    "SGPI",
                  ].map((label) => (
                    <th
                      key={label}
                      style={{
                        background: GREY_LIGHTEN3,
                        fontWeight: 700,
                        fontSize: 9 * PT,
                        padding: `${4 * PT}px`,
                        textAlign: "center",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.pastSemesters.map((past) => (
                  <tr key={past.semesterName}>
                    {[
                      past.semesterName,
                      num(past.credits),
                      num(past.earnedGradePoints),
                      fixed2(past.sgpi),
                    ].map((value, i) => (
                      <td
                        key={i}
                        style={{ ...cell, textAlign: "center" }}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      {/* SignatureFooter: the result date, then the Controller and the Principal. */}
      <footer style={{ marginTop: "auto", paddingTop: 20 * PT }}>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div
            style={{ flex: 1, fontSize: 10 * PT, paddingBottom: 2 }}
          >
            Date: {printedDate(data.resultDate)}
          </div>
          <div style={{ width: 150 * PT }}>
            <Signatory
              title="Controller of Examinations"
              image={branding.controllerSignature}
            />
          </div>
          <div style={{ width: 30 * PT }} />
          <div style={{ width: 130 * PT }}>
            <Signatory title="Principal" image={branding.principalSignature} />
          </div>
        </div>
      </footer>
    </div>
  );
}
