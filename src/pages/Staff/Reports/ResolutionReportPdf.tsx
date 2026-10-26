import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

export interface ReportPdfData {
  courseName: string;
  semester: string;
  pattern: string;
  examName: string;
  subjectName: string;
  date: string;
  examinerName?: string;
  bannerSrc?: string; // PNG data URL of the college banner
}

const s = StyleSheet.create({
  page: {
    paddingVertical: 24,
    paddingHorizontal: 34,
    fontSize: 13,
    fontFamily: "Times-Roman",
    lineHeight: 1.35,
  },
  block: { flex: 1, paddingBottom: 8 },
  divider: {
    borderBottomWidth: 1,
    borderStyle: "dotted",
    borderColor: "#000",
    marginBottom: 12,
  },

  banner: { width: "100%", height: 100, objectFit: "contain", marginBottom: 1 },
  headerBold: { textAlign: "center", fontFamily: "Times-Bold", fontSize: 12 },

  dateRow: { textAlign: "right", marginTop: 6, marginBottom: 4 },
  title: {
    textAlign: "center",
    fontFamily: "Times-Bold",
    fontSize: 14,
    marginBottom: 6,
  },
  line: { marginBottom: 3 },
  splitRow: { flexDirection: "row", marginBottom: 4 },
  branch: { flex: 1, marginLeft: 50 },
  underline: { textDecoration: "underline" },

  // table
  table: { borderWidth: 1, borderColor: "#000", marginTop: 6 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
  trLast: { flexDirection: "row" },
  th: {
    padding: 6,
    fontSize: 11.5,
    textAlign: "center",
    fontFamily: "Times-Bold",
    borderRightWidth: 1,
    borderColor: "#000",
  },

  td: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 36,
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: "#000",
  },
  c1: { width: "48%" },
  c2: { width: "30%" },
  c3: { width: "22%", borderRightWidth: 0 },
  small: { fontSize: 10.5 },
});

const nameFontSize = (name: string) =>
  name.length > 42 ? 8 : name.length > 36 ? 10 : name.length > 30 ? 10 : 12;

function ResolutionBlock({ data }: { data: ReportPdfData }) {
  return (
    <View style={s.block}>
      {/* header (static) */}
      {data.bannerSrc ? (
        <Image src={data.bannerSrc} style={s.banner} />
      ) : (
        <Text style={s.headerBold}></Text>
      )}

      <Text style={s.dateRow}>
        DATE <Text style={s.underline}>{data.date}</Text>
      </Text>

      <Text style={s.title}>-:RESOLUTION:-</Text>

      <Text style={s.line}>
        " Maximum of 03 ( ZERO THREE ) grace marks be given to the candidates to
        enable them to pass in the subject examined by us. "
      </Text>

      {/* user selections */}
      <Text style={s.line}>
        Subject :- <Text style={s.underline}>{data.subjectName}</Text>
      </Text>
      <View style={s.splitRow}>
        <Text>
          Semester :- <Text style={s.underline}>{data.semester}</Text>
        </Text>
        <Text style={s.branch}>
          Branch :- <Text style={s.underline}>{data.courseName}</Text> ({" "}
          {data.pattern} )
        </Text>
      </View>
      <Text style={s.line}>
        Month & Year of Examination :-{" "}
        <Text style={s.underline}>{data.examName}</Text>
      </Text>

      {/* signature table */}
      <View style={s.table}>
        <View style={s.tr}>
          <Text style={[s.th, s.c1]}>Name of the Examiner/Moderator</Text>
          <Text style={[s.th, s.c2]}>Name of the College</Text>
          <Text style={[s.th, s.c3]}>Signature</Text>
        </View>
        <View style={s.tr}>
          {/* <View style={[s.td, s.c1]}>
            <Text>
              Examiner's Name:{" "}
              <Text style={s.small}>
                {(data.examinerName || "").toUpperCase()}
              </Text>
            </Text>
          </View> */}
          <View style={[s.td, s.c1]}>
            <Text style={s.small}>Examiner's Name:</Text>
            <Text style={{ fontSize: nameFontSize(data.examinerName || "") }}>
              {(data.examinerName || "").toUpperCase()}
            </Text>
          </View>
          <View style={[s.td, s.c2]}>
            <Text style={[s.small, { textAlign: "center" }]}>
              VIVA Institute of Technology{"\n"}Virar(E)
            </Text>
          </View>
          <View style={[s.td, s.c3]} />
        </View>
        <View style={s.trLast}>
          <View style={[s.td, s.c1]}>
            <Text>Moderator's Name:</Text>
          </View>
          <View style={[s.td, s.c2]} />
          <View style={[s.td, s.c3]} />
        </View>
      </View>
    </View>
  );
}

export default function ResolutionReportPdf({ data }: { data: ReportPdfData }) {
  return (
    <Document title="Resolution Report">
      <Page size="A4" style={s.page}>
        <ResolutionBlock data={data} />
        <View style={s.divider} />
        <ResolutionBlock data={data} />
      </Page>
    </Document>
  );
}
