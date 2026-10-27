import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Download, Loader2, X, XCircle } from "lucide-react";
import Button from "../ui/button/Button";
import MarksheetCard from "./MarksheetCard";
import { ReportService } from "../../services/ReportService";
import type {
  DownloadMarksheetParams,
  MarksheetBranding,
  MarksheetData,
} from "../../services/ReportService";

/** An A4 marksheet at 96 dpi; the preview is scaled down to fit the column. */
const SHEET_PX = 794;

/** The API's sentence for a failed request (ProblemDetails `detail`, or a plain `message`). */
const reason = (err: unknown, fallback: string) => {
  const data = (
    err as {
      response?: { data?: { detail?: string; message?: string; title?: string } };
    }
  )?.response?.data;
  return data?.detail || data?.message || data?.title || fallback;
};

/** Shows a fixed-width sheet scaled to fit the column (a laptop shows the whole sheet, smaller). */
function FitToWidth({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const fit = () => {
      if (!outer.current || !inner.current) return;
      const s = Math.min(1, outer.current.clientWidth / SHEET_PX);
      setScale(s);
      setHeight(inner.current.offsetHeight * s);
    };
    const observer = new ResizeObserver(fit);
    if (outer.current) observer.observe(outer.current);
    if (inner.current) observer.observe(inner.current);
    fit();
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={outer}
      className="mx-auto overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-800"
      style={{ height, maxWidth: SHEET_PX }}
    >
      <div
        ref={inner}
        style={{
          width: SHEET_PX,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface Props {
  /** The marksheet to draw: one student, the selected exam/semester/pattern and the page's options. */
  params: DownloadMarksheetParams;
  onClose: () => void;
}

/**
 * The staff marksheet preview: the same sheet the PDF prints, drawn in the browser from the API's
 * marksheet data (GET /Report/marksheet/data), just like the hall ticket preview. The download
 * button captures this card and writes an A4 PDF, so the file matches what was on screen.
 */
export default function MarksheetPreview({ params, onClose }: Props) {
  const { studId, examId, semId, pattern, includeHistory, resultDate, noRleForFail } =
    params;

  const [data, setData] = useState<MarksheetData | null>(null);
  const [branding, setBranding] = useState<MarksheetBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [making, setMaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      ReportService.getMarksheetData({
        studId,
        examId,
        semId,
        pattern,
        includeHistory,
        resultDate,
        noRleForFail,
      }),
      ReportService.getMarksheetBranding(),
    ])
      .then(([sheet, college]) => {
        if (cancelled) return;
        setData(sheet);
        setBranding(college);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setError(reason(err, "The marksheet could not be loaded. Try again."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    studId,
    examId,
    semId,
    pattern,
    includeHistory,
    resultDate,
    noRleForFail,
  ]);

  const sheet = useRef<HTMLDivElement>(null);

  // The card as shown, captured and written to an A4 PDF that downloads straight away (no print window).
  const download = async () => {
    const card = sheet.current?.querySelector<HTMLElement>(".marksheet-card");
    if (!card || !data) return;
    setMaking(true);
    setError(null);
    try {
      // The letterhead and signatures load through the authenticated Files endpoint; wait for them
      // so they are not missing from the PDF.
      await Promise.all(
        Array.from(card.querySelectorAll("img")).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = img.onerror = () => resolve();
              }),
        ),
      );

      const [{ toJpeg }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const image = await toJpeg(card, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true,
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      // 8 mm margins; a sheet longer than A4 (many subjects plus history) is scaled down to one page.
      const maxW = 194,
        maxH = 281;
      const ratio = card.offsetHeight / card.offsetWidth;
      const w = Math.min(maxW, maxH / ratio);
      const h = w * ratio;
      pdf.addImage(
        image,
        "JPEG",
        (210 - w) / 2,
        8 + (maxH - h) / 2,
        w,
        h,
      );
      pdf.save(
        `Marksheet ${data.studentId} ${data.examName}.pdf`.replace(
          /[\\/:*?"<>|]/g,
          "-",
        ),
      );
    } catch {
      setError(
        "The PDF could not be made. Try again, or use a different browser.",
      );
    } finally {
      setMaking(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <header className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Marksheet preview
          </h3>
          <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
            {data
              ? `${data.studentName} · ${data.examName}${data.semester ? ` · ${data.semester}` : ""}`
              : "Loading the marksheet…"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11"
            title="Close the preview"
            aria-label="Close the preview"
          >
            <X className="size-4" />
            Close
          </Button>
          <Button
            onClick={download}
            disabled={!data || making}
            className="h-11 text-sm font-semibold"
            title="Save this marksheet as a PDF"
          >
            {making ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <Download className="size-4" />
            )}
            {making ? "Preparing…" : "Download PDF"}
          </Button>
        </div>
      </header>

      <div className="border-t border-gray-100 p-4 sm:p-6 dark:border-gray-800">
        {error && (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400"
          >
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-brand-500" />
          </div>
        )}

        {!loading && data && branding && (
          <div ref={sheet}>
            <FitToWidth>
              <MarksheetCard data={data} branding={branding} />
            </FitToWidth>
          </div>
        )}
      </div>
    </section>
  );
}
