import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Printer,
  RotateCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StudentAccessService,
  studentReason,
} from "../../services/StudentAccessService";
import type {
  StudentHome,
  StudentMarksheetView,
} from "../../services/StudentAccessService";
import { day } from "./format";

interface Props {
  home: StudentHome;
  onEnded: () => void;
}

/** The API's sentence from a failed blob download (the error body is a Blob, not JSON). */
const blobReason = async (err: unknown, fallback: string) => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text()) as { message?: string };
      if (body.message) return body.message;
    } catch {
      /* not a JSON error body */
    }
  }
  return studentReason(err, fallback);
};

/**
 * A marksheet link: the result must be declared, then the student previews and downloads the same PDF staff generate.
 * The server builds it from the link; the browser sends nothing but the session header.
 */
export default function StudentMarksheet({ home, onEnded }: Props) {
  const [view, setView] = useState<StudentMarksheetView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [making, setMaking] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const load = useCallback(async () => {
    try {
      setView(await StudentAccessService.marksheet());
      setError(null);
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        setError(
          "Your session has ended. Open the link from your email again.",
        );
        onEnded();
      } else
        setError(
          studentReason(
            err,
            "Your marksheet could not be loaded. Check your connection and try again.",
          ),
        );
    }
  }, [onEnded]);

  useEffect(() => {
    load();
  }, [load]);

  const loadPdf = useCallback(async () => {
    if (!view?.ready) return;
    setLoadingPdf(true);
    setPdfError(null);
    try {
      const blob = await StudentAccessService.marksheetPdf();
      const cleanBlob =
        blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" });
      setPdfBlob(cleanBlob);
      const url = URL.createObjectURL(cleanBlob);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        onEnded();
      } else {
        setPdfError(
          await blobReason(
            err,
            "The marksheet preview could not be loaded. Click to retry.",
          ),
        );
      }
    } finally {
      setLoadingPdf(false);
    }
  }, [view?.ready, onEnded]);

  useEffect(() => {
    if (view?.ready && !pdfBlob && !loadingPdf && !pdfError) {
      loadPdf();
    }
  }, [view?.ready, pdfBlob, loadingPdf, pdfError, loadPdf]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  const download = async () => {
    setMaking(true);
    setError(null);
    try {
      let blob = pdfBlob;
      if (!blob) {
        const fetched = await StudentAccessService.marksheetPdf();
        blob =
          fetched.type === "application/pdf"
            ? fetched
            : new Blob([fetched], { type: "application/pdf" });
        setPdfBlob(blob);
        const newUrl = URL.createObjectURL(blob);
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return newUrl;
        });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        `Marksheet ${view?.studentId ?? home.student.studentId} ${view?.examName ?? ""}.pdf`.replace(
          /[\\/:*?"<>|]/g,
          "-",
        );
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 401)
        onEnded();
      else
        setError(
          await blobReason(
            err,
            "The marksheet could not be downloaded. Try again.",
          ),
        );
    } finally {
      setMaking(false);
    }
  };

  const openInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const printPdf = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch {
        /* fallback to opening in new window */
      }
    }
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  if (!view)
    return error ? (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        <XCircle className="mt-0.5 size-4 shrink-0" /> {error}
      </p>
    ) : (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );

  if (!view.ready)
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Clock className="size-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Not available yet</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {view.message ?? "Your marksheet isn't ready yet."}
        </p>
        {home.helpEmail && (
          <a
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            href={`mailto:${home.helpEmail}`}
          >
            {home.helpEmail}
          </a>
        )}
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Your marksheet</h1>
            <p className="truncate text-sm text-muted-foreground">
              {view.examName}
              {view.semester ? ` · ${view.semester}` : ""}
            </p>
          </div>
        </div>
        <Button
          size="lg"
          className="h-11 shrink-0 px-5"
          onClick={download}
          disabled={making}
          title="Download your official marksheet PDF"
        >
          {making ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {making ? "Preparing…" : "Download Marksheet"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Student</dt>
            <dd className="font-medium">{view.studentName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Student ID</dt>
            <dd className="font-medium">{view.studentId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Result date</dt>
            <dd className="font-medium">
              {view.resultDate ? day(view.resultDate) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Link works until</dt>
            <dd className="font-medium">{day(home.deadline)}</dd>
          </div>
        </dl>
      </section>

      {/* Marksheet PDF Preview Section */}
      <section
        className={`mt-6 rounded-2xl border bg-card shadow-sm transition-all duration-200 overflow-hidden ${
          isFullscreen
            ? "fixed inset-2 sm:inset-4 z-50 flex flex-col bg-background shadow-2xl border-border"
            : "relative flex flex-col"
        }`}
      >
        {/* Preview Header / Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Marksheet Preview
            </h2>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Official PDF
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pdfUrl && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={openInNewTab}
                  title="Open PDF in new tab"
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={printPdf}
                  title="Print marksheet"
                >
                  <Printer className="size-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen (Esc)" : "View fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  </span>
                </Button>

                {isFullscreen && (
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-medium"
                    onClick={download}
                    disabled={making || loadingPdf}
                    title="Download marksheet PDF"
                  >
                    {making ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    <span>{making ? "Downloading…" : "Download"}</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Preview Frame */}
        <div
          className={`relative w-full bg-muted/20 ${
            isFullscreen ? "flex-1 min-h-0" : "h-[750px] sm:h-[820px]"
          }`}
        >
          {loadingPdf && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Generating marksheet preview…
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Loading your official marksheet directly from the examination system.
              </p>
            </div>
          )}

          {pdfError && !loadingPdf && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="size-6" />
              </div>
              <p className="max-w-md text-sm font-medium text-destructive">
                {pdfError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPdf}
                className="gap-1.5 text-xs"
              >
                <RotateCw className="size-3.5" /> Retry Preview
              </Button>
            </div>
          )}

          {pdfUrl && !loadingPdf && (
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#toolbar=0&view=FitH`}
              title={`Marksheet Preview - ${view.studentName}`}
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </section>
    </div>
  );
}
