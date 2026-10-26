import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
Font.registerHyphenationCallback((word) => [word]);
export interface CertificatePdfData {
  courseName: string;
  semester: string;
  pattern: string;
  examName: string;
  subjectName: string;
  types: string[];
  professorName: string;
  collegeName: string;
  fromDate: string;
  toDate: string;
  date: string;
  imageSrc?: string;
  bannerSrc?: string;
}

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    fontSize: 15,
    fontFamily: "Times-Roman",
  },
  banner: {
    width: "100%",
    height: 100,
    objectFit: "contain",
    marginBottom: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 11,
    fontFamily: "Times-Bold",
  },
  title: {
    marginTop: 40,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Times-BoldItalic",
    textDecoration: "underline",
  },
  paragraph: {
    marginTop: 40,
    textAlign: "justify",
    lineHeight: 2.2,
    textIndent: 45,
  },
  underline: { textDecoration: "underline" },
  signBlock: { marginTop: 100, alignItems: "flex-end", paddingRight: 10 },
  sign: { width: 110, height: 45, objectFit: "contain" },
});

export default function ResolutionCertificatePdf({
  data,
}: {
  data: CertificatePdfData;
}) {
  const dateText =
    data.fromDate === data.toDate
      ? data.fromDate
      : `${data.fromDate} & ${data.toDate}`;
  return (
    <Document title="Resolution Certificate">
      <Page size="A4" style={s.page}>
        {data.bannerSrc && <Image src={data.bannerSrc} style={s.banner} />}
        <View style={s.topRow}>
          <Text>Ref. No. VIT/</Text>
          <Text>
            Date :- <Text style={s.underline}>{data.date}</Text>
          </Text>
        </View>

        <Text style={s.title}>TO WHOMSOEVER IT MAY CONCERN</Text>

        <Text style={s.paragraph}>
          This is to certify that Prof.{" "}
          <Text style={s.underline}>{data.professorName}</Text> From{" "}
          <Text style={s.underline}>{data.collegeName}</Text> College, attended
          our institute for {data.types.join(" / ")} of answer books in the
          subject <Text style={s.underline}>{data.subjectName}</Text> of
          Semester {data.semester}, Branch{" "}
          <Text style={s.underline}>{data.courseName}</Text>, for{" "}
          {data.examName} exam conducted on behalf of University of Mumbai on{" "}
          <Text style={s.underline}>{dateText}</Text>.
        </Text>

        <View style={s.signBlock}>
          {data.imageSrc && <Image src={data.imageSrc} style={s.sign} />}
          <Text>Principal</Text>
        </View>
      </Page>
    </Document>
  );
}
