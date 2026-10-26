import { useEffect, useMemo, useState } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { Loader2, Printer, ScrollText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCourses,
  usePatterns,
  useSemesters,
  useExams,
  useSubjects,
  toCourseOptions,
  toPatternOptions,
  toSemesterOptions,
  toExamOptions,
} from "../../../data";
import { pdf } from "@react-pdf/renderer";
import ResolutionReportPdf from "./ResolutionReportPdf";
import ResolutionCertificatePdf from "./ResolutionCertificatePdf";
import apiClient from "../../../api/Client";
import collegedetailService from "../../../services/collegedetailService";
import DatePicker from "../../../components/form/date-picker";

// Convert any image blob (jpg/png/webp) to a PNG data URL that react-pdf accepts
const blobToPngDataUrl = async (blob: Blob) => {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  return canvas.toDataURL("image/png");
};

const loadCollegeHeader = async () => {
  const college = await collegedetailService.getCollege();
  let bannerSrc: string | undefined;

  if (college?.bannerUrl) {
    try {
      // same request that useAuthImage makes
      const res = await apiClient.get<Blob>("/Files", {
        params: { path: college.bannerUrl },
        responseType: "blob",
      });
      bannerSrc = await blobToPngDataUrl(res.data);
    } catch (e) {
      console.error("Banner load failed", e);
    }
  }

  return {
    bannerSrc,
    collegeName: college?.name,
    collegeCenter: college?.collegeCenter,
  };
};

const fmtLongDate = (d: string) => {
  const [y, m, day] = d.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day}-${months[Number(m) - 1]}-${y}`;
};
export default function ResolutionReport() {
  // 1. Selected values (must be declared BEFORE the hooks that use them)
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedPattern, setSelectedPattern] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [panelReady, setPanelReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageAlert, setPageAlert] = useState<{
    variant: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  // Certificate state
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateTypes, setCertificateTypes] = useState({
    assessment: false,
    moderation: false,
    revaluation: false,
  });
  const [professorName, setProfessorName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [examinerName, setExaminerName] = useState("");
  // 2. Lookup data from the shared cached hooks (src/data)
  const courses = useCourses();
  const patterns = usePatterns();
  const semesters = useSemesters();
  const exams = useExams({ courseId: selectedCourse, purpose: "all" });
  const subjects = useSubjects({
    courseId: selectedCourse,
    pattern: selectedPattern,
    semester: selectedSemester,
  });

  // 3. Convert to { value, label } for <Select>
  const courseOptions = useMemo(
    () => toCourseOptions(courses.data),
    [courses.data],
  );
  const patternOptions = useMemo(
    () => toPatternOptions(patterns.data),
    [patterns.data],
  );
  const semesterOptions = useMemo(
    () => toSemesterOptions(semesters.data),
    [semesters.data],
  );
  const examOptions = useMemo(() => toExamOptions(exams.data), [exams.data]);
  const subjectOptions = useMemo(
    () =>
      (subjects.data ?? []).map((s) => ({ value: s.subjectId, label: s.name })),
    [subjects.data],
  );

  // Auto-dismiss alert
  useEffect(() => {
    if (pageAlert) {
      const timer = setTimeout(() => setPageAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [pageAlert]);

  // 4. Cascading reset handlers
  const handleCourseChange = (val: string) => {
    setSelectedCourse(val);
    setSelectedSemester("");
    setSelectedPattern("");
    setSelectedExam("");
    setSelectedSubject("");
  };

  const handleSemesterChange = (val: string) => {
    setSelectedSemester(val);
    setSelectedPattern("");
    setSelectedExam("");
    setSelectedSubject("");
  };

  const handlePatternChange = (val: string) => {
    setSelectedPattern(val);
    setSelectedExam("");
    setSelectedSubject("");
  };

  const handleExamChange = (val: string) => {
    setSelectedExam(val);
    setSelectedSubject("");
  };

  const handleSubjectChange = (val: string) => {
    setSelectedSubject(val);
  };

  const filtersComplete =
    !!selectedCourse &&
    !!selectedSemester &&
    !!selectedPattern &&
    !!selectedExam &&
    !!selectedSubject;

  // 5. Actions
  const labelOf = (opts: { value: string; label: string }[], v: string) =>
    opts.find((o) => o.value === v)?.label ?? v;

  const fmtDate = (d: string) => d.split("-").reverse().join("/");

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCertificateTypeChange = (type: keyof typeof certificateTypes) => {
    setCertificateTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const filtersValid = () => {
    if (!filtersComplete) {
      setPageAlert({
        variant: "error",
        title: "Missing Filters",
        message: "Please select all required filters.",
      });
      return false;
    }
    return true;
  };

  const baseData = () => ({
    courseName: labelOf(courseOptions, selectedCourse),
    semester: labelOf(semesterOptions, selectedSemester),
    pattern: selectedPattern,
    examName: labelOf(examOptions, selectedExam),
    subjectName: labelOf(subjectOptions, selectedSubject),
  });

  // PRINT button -> Report PDF
  const handlePrintReport = async () => {
    if (!filtersValid()) return;

    if (!examinerName.trim()) {
      setPageAlert({
        variant: "error",
        title: "Missing Examiner Name",
        message: "Please enter the examiner name before printing.",
      });
      return;
    }
    const tab = window.open("", "_blank");
    setLoading(true);
    try {
      const header = await loadCollegeHeader();

      const blob = await pdf(
        <ResolutionReportPdf
          data={{
            ...baseData(),
            semester:
              selectedSemester.replace(/\D/g, "") || baseData().semester,
            date: new Date().toLocaleDateString("en-GB"),
            examinerName: examinerName.trim(),
            ...header,
          }}
        />,
      ).toBlob();
      openPdfInNewTab(blob, tab);
      // downloadBlob(
      //   blob,
      //   `Report_${labelOf(subjectOptions, selectedSubject)}.pdf`,
      // );
    } catch (e) {
      console.error(e);
      setPageAlert({
        variant: "error",
        title: "Error",
        message: "Failed to generate report PDF.",
      });
    } finally {
      setLoading(false);
    }
  };

  // PRINT CERTIFICATE button -> Certificate PDF
  const handlePrintCertificate = async () => {
    if (!filtersValid()) return;

    if (!professorName.trim() || !collegeName.trim() || !fromDate || !toDate) {
      setPageAlert({
        variant: "error",
        title: "Missing Details",
        message: "Please fill in all certificate details.",
      });
      return;
    }
    if (toDate < fromDate) {
      setPageAlert({
        variant: "error",
        title: "Invalid Dates",
        message: "To Date cannot be earlier than From Date.",
      });
      return;
    }
    if (!Object.values(certificateTypes).some(Boolean)) {
      setPageAlert({
        variant: "error",
        title: "Select Certificate Type",
        message: "Please select at least one certificate type.",
      });
      return;
    }

    const types = [
      certificateTypes.assessment && "Assessment",
      certificateTypes.moderation && "Moderation",
      certificateTypes.revaluation && "Revaluation",
    ].filter(Boolean) as string[];
    const tab = window.open("", "_blank");
    setLoading(true);
    try {
      const header = await loadCollegeHeader();

      const blob = await pdf(
        <ResolutionCertificatePdf
          data={{
            ...baseData(),
            semester:
              selectedSemester.replace(/\D/g, "") || baseData().semester,
            types,
            professorName: professorName.trim(),
            collegeName: collegeName.trim(),
            fromDate: fmtLongDate(fromDate),
            toDate: fmtLongDate(toDate),
            date: new Date().toLocaleDateString("en-GB"),
            bannerSrc: header.bannerSrc,
          }}
        />,
      ).toBlob();
      openPdfInNewTab(blob, tab);
      // downloadBlob(
      //   blob,
      //   `Certificate_${labelOf(subjectOptions, selectedSubject)}.pdf`,
      // );
    } catch (e) {
      console.error(e);
      setPageAlert({
        variant: "error",
        title: "Error",
        message: "Failed to generate certificate PDF.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setShowCertificate(false);
    setCertificateTypes({
      assessment: false,
      moderation: false,
      revaluation: false,
    });
    setProfessorName("");
    setCollegeName("");
    setFromDate("");
    setToDate("");
  }, [
    selectedCourse,
    selectedSemester,
    selectedPattern,
    selectedExam,
    selectedSubject,
  ]);

  const openPdfInNewTab = (blob: Blob, tab: Window | null) => {
    const url = URL.createObjectURL(blob);
    if (tab) {
      tab.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <ComponentCard title="Resolution Report">
      {pageAlert && (
        <div className="mb-4">
          <Alert
            variant={pageAlert.variant}
            title={pageAlert.title}
            message={pageAlert.message}
            onClose={() => setPageAlert(null)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
        <div className="w-full">
          <Select
            label="Course"
            options={courseOptions}
            value={selectedCourse}
            onChange={handleCourseChange}
            placeholder="Select Course"
          />
        </div>

        <AnimatePresence mode="popLayout">
          {/* Semester: visible only when Course is selected */}
          {selectedCourse && (
            <motion.div
              key="semester"
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Select
                label="Semester"
                options={semesterOptions}
                value={selectedSemester}
                onChange={handleSemesterChange}
                placeholder="Select Semester"
              />
            </motion.div>
          )}

          {/* Pattern: visible only when Semester is selected */}
          {selectedCourse && selectedSemester && (
            <motion.div
              key="pattern"
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Select
                label="Pattern"
                options={patternOptions}
                value={selectedPattern}
                onChange={handlePatternChange}
                placeholder="Select Pattern"
              />
            </motion.div>
          )}

          {/* Exam: visible only when Pattern is selected */}
          {selectedCourse && selectedSemester && selectedPattern && (
            <motion.div
              key="exam"
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Select
                label="Exam Master"
                options={examOptions}
                value={selectedExam}
                onChange={handleExamChange}
                placeholder="Select Exam"
              />
            </motion.div>
          )}

          {/* Subject: visible only when Exam is selected */}
          {selectedCourse &&
            selectedSemester &&
            selectedPattern &&
            selectedExam && (
              <motion.div
                key="subject"
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Select
                  label="Subject"
                  options={subjectOptions}
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  placeholder="Select Subject"
                />
              </motion.div>
            )}

          {filtersComplete && (
            <motion.div
              key="examiner-name"
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                type="text"
                label="Examiner Name"
                value={examinerName}
                onChange={(e) => setExaminerName(e.target.value)}
                placeholder="Enter Examiner name"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 dark:border-gray-700"
              />
            </motion.div>
          )}

          {/* Actions: Print & Certificate */}
          {filtersComplete && (
            <motion.div
              key="actions"
              className="w-full flex items-end gap-2 h-11"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="primary"
                onClick={handlePrintReport}
                disabled={loading}
                className="flex-grow h-11"
              >
                {loading ? (
                  <Loader2 className="animate-spin size-4 mr-2" />
                ) : (
                  <Printer className="size-4 mr-2" />
                )}
                Print
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowCertificate((prev) => !prev)}
                disabled={loading}
                className="flex-grow h-11"
              >
                <ScrollText className="size-4 mr-2" />
                Certificate
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCertificate && filtersComplete && (
          <motion.div
            key="certificate-fields"
            initial={{ opacity: 0, height: 0, y: 15 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 15 }}
            transition={{ duration: 0.3 }}
            onAnimationStart={() => setPanelReady(false)}
            onAnimationComplete={() => setPanelReady(true)}
            className={panelReady ? "overflow-visible" : "overflow-hidden"}
          >
            <div className="relative z-10 mt-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
                Certificate Details
              </h3>

              {/* Certificate checkboxes */}
              <div className="mb-5 flex flex-wrap gap-6">
                {(
                  [
                    ["assessment", "Assessment"],
                    ["moderation", "Moderation"],
                    ["revaluation", "Revaluation"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={certificateTypes[key]}
                      onChange={() => handleCertificateTypeChange(key)}
                      className="size-4 rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* Professor and College */}
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Professor Name
                  </label>
                  <input
                    type="text"
                    value={professorName}
                    onChange={(e) => setProfessorName(e.target.value)}
                    placeholder="Enter professor name"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    College Name
                  </label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="Enter college name"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <DatePicker
                    id="certificate-from-date"
                    label="From Date"
                    placeholder="Select from date"
                    onChange={(_dates, dateStr) => setFromDate(dateStr)}
                  />
                </div>

                <div>
                  <DatePicker
                    id="certificate-to-date"
                    label="To Date"
                    placeholder="Select to date"
                    onChange={(_dates, dateStr) => setToDate(dateStr)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="primary"
                    onClick={handlePrintCertificate}
                    disabled={loading}
                    className="flex-grow h-11"
                  >
                    <Printer className="size-4 mr-2" />
                    Print Certificate
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ComponentCard>
  );
}
