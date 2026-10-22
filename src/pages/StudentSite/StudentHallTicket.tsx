import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Clock, Download, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HallTicketCard } from "../../components/HallTicket/Hallticket";
import type { HallTicketCollegeInfo, HallTicketStudent } from "../../components/HallTicket/Hallticket";
import { hallTicketTitle } from "../../components/HallTicket/title";
import { StudentAccessService, studentReason } from "../../services/StudentAccessService";
import type { StudentHallTicketView, StudentHome, StudentImageKind } from "../../services/StudentAccessService";
import { STUDENT_PICTURE, shrinkImage } from "../../utils/shrinkImage";
import { Picture } from "./StudentDetailsForm";
import PictureGuide from "./PictureGuide";

/** An A4 hall ticket at 96 dpi; the preview is scaled down to the screen width. */
const SHEET_PX = 794;

/** Shows a fixed-width sheet scaled to fit the column (a phone shows the whole sheet, smaller). */
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
    <div ref={outer} className="ht-fit mx-auto overflow-hidden rounded-lg border shadow-sm" style={{ height, maxWidth: SHEET_PX }}>
      <div ref={inner} className="ht-sheet" style={{ width: SHEET_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

type Images = Partial<Record<"logo" | "principal" | "controller" | "seal" | "photo" | "signature", string | null>>;

interface Props {
  home: StudentHome;
  /** The session ended: the page goes back to the code step. */
  onEnded: () => void;
}

/**
 * A hall ticket link: once the exam's hall ticket is released and the student's photo and signature are on
 * record, the same hall ticket staff print, with a button to save it as PDF (the browser's print to PDF). A
 * missing photo or signature is added here first.
 */
export default function StudentHallTicket({ home, onEnded }: Props) {
  const [view, setView] = useState<StudentHallTicketView | null>(null);
  const [images, setImages] = useState<Images>({});
  const [error, setError] = useState<string | null>(null);

  const failed = useCallback(
    (err: unknown, fallback: string) => {
      if ((err as { response?: { status?: number } })?.response?.status === 401) onEnded();
      else setError(studentReason(err, fallback));
    },
    [onEnded],
  );

  const load = useCallback(async () => {
    try {
      const v = await StudentAccessService.hallTicket();
      setView(v);
      setError(null);
      const want = <K extends keyof Images>(key: K, on: boolean, get: () => Promise<string | null>) => (on ? get().then((u) => [key, u] as const) : Promise.resolve([key, null] as const));
      const loaded = await Promise.all([
        want("photo", home.student.hasPhoto || !v.missing.includes("photo"), () => StudentAccessService.imageUrl("photo")),
        want("signature", home.student.hasSignature || !v.missing.includes("signature"), () => StudentAccessService.imageUrl("signature")),
        want("logo", v.ready && v.hasLogo, () => StudentAccessService.hallTicketImage("logo")),
        want("principal", v.ready && v.hasPrincipalSign, () => StudentAccessService.hallTicketImage("principal")),
        want("controller", v.ready && v.hasControllerSign, () => StudentAccessService.hallTicketImage("controller")),
        want("seal", v.ready && v.hasSeal, () => StudentAccessService.hallTicketImage("seal")),
      ]);
      setImages((old) => {
        Object.values(old).forEach((u) => u && URL.revokeObjectURL(u));
        return Object.fromEntries(loaded);
      });
    } catch (err) {
      failed(err, "Your hall ticket could not be loaded. Check your connection and try again.");
    }
  }, [home.student.hasPhoto, home.student.hasSignature, failed]);

  useEffect(() => {
    load();
  }, [load]);

  // Missing pictures are picked first (shown on the card), then saved together.
  const [staged, setStaged] = useState<Partial<Record<StudentImageKind, string>>>({});
  const [saving, setSaving] = useState(false);

  const pick = async (kind: StudentImageKind, file: File) => {
    try {
      const dataUrl = await shrinkImage(file, STUDENT_PICTURE[kind].maxSide, STUDENT_PICTURE[kind].maxBytes);
      setStaged((p) => ({ ...p, [kind]: dataUrl }));
      setError(null);
      return dataUrl;
    } catch (err) {
      setError((err as Error)?.message || "That picture can't be used. Try another one.");
      return null;
    }
  };

  const savePictures = async () => {
    setSaving(true);
    try {
      await StudentAccessService.saveDetails({ photo: staged.photo, signature: staged.signature });
      setStaged({});
      await load();
    } catch (err) {
      failed(err, "The pictures could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // The hall ticket as shown, captured and written to an A4 PDF that downloads straight away (no print window).
  const sheet = useRef<HTMLDivElement>(null);
  const [making, setMaking] = useState(false);
  const download = async () => {
    const card = sheet.current?.querySelector<HTMLElement>(".hallticket-card");
    if (!card || !view?.student) return;
    setMaking(true);
    try {
      const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const image = await toJpeg(card, { quality: 0.92, pixelRatio: 2, backgroundColor: "#ffffff", skipFonts: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      // 8 mm margins; a long subject list is scaled down to stay on one page.
      const maxW = 194, maxH = 281;
      const ratio = card.offsetHeight / card.offsetWidth;
      const w = Math.min(maxW, maxH / ratio);
      pdf.addImage(image, "JPEG", (210 - w) / 2, 8, w, w * ratio);
      pdf.save(`Hall ticket ${view.student.studentid} ${view.examName}.pdf`.replace(/[\\/:*?"<>|]/g, "-"));
      StudentAccessService.hallTicketDownloaded().catch(() => undefined);
    } catch {
      setError("The PDF could not be made. Try again, or use a different browser.");
    } finally {
      setMaking(false);
    }
  };

  if (!view)
    return error ? (
      <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <XCircle className="mt-0.5 size-4 shrink-0" /> {error}
      </p>
    ) : (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );

  // Photo or signature missing: add it on the card, then the hall ticket shows.
  if (view.missing.length > 0) {
    const both = view.missing.length === 2;
    const name = [home.student.firstName, home.student.middleName, home.student.lastName].filter(Boolean).join(" ");
    const ready = view.missing.every((k) => staged[k]);
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="px-1 text-xl font-semibold">Add your {both ? "photo and signature" : view.missing[0]}</h1>
        <p className="mt-1 px-1 text-sm text-muted-foreground">
          Your hall ticket needs {both ? "them" : "it"}. Tap {both ? "each box" : "the box"} on your card below.
        </p>
        <section aria-label="ID card" className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="truncate bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{home.college}</div>
          <div className="flex gap-4 p-4">
            <Picture kind="photo" url={staged.photo ?? images.photo ?? null} pending={!!staged.photo} editable={view.missing.includes("photo")} fallback="" onPick={pick} />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-lg font-semibold leading-snug break-words">{name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Student ID {home.student.studentId}</p>
              <div className="mt-auto pt-3">
                <Picture kind="signature" url={staged.signature ?? images.signature ?? null} pending={!!staged.signature} editable={view.missing.includes("signature")} onPick={pick} />
              </div>
            </div>
          </div>
        </section>
        <PictureGuide kinds={view.missing} />
        <div className="mt-4">
          <Button size="lg" className="h-12 w-full text-base" onClick={savePictures} disabled={!ready || saving}>
            {saving && <Loader2 className="animate-spin" />} {saving ? "Saving" : "Save and show my hall ticket"}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {ready ? "Check them first: to change them later, contact your college office." : `Add your ${both ? "photo and signature" : view.missing[0]} to continue.`}
          </p>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Not released (yet), or withdrawn.
  if (!view.ready || !view.student)
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Clock className="size-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Not available yet</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{view.message}</p>
        {home.helpEmail && (
          <a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${home.helpEmail}`}>
            {home.helpEmail}
          </a>
        )}
      </div>
    );

  const college: HallTicketCollegeInfo = {
    logo: images.logo ?? "",
    center: view.center,
    collegeName: view.collegeName,
    title: hallTicketTitle({ branch: view.branch, pattern: view.pattern, examType: view.examType, examName: view.examName }),
    principalSign: images.principal ?? undefined,
    controllerSign: images.controller ?? undefined,
    seal: images.seal ?? undefined,
  };
  const student: HallTicketStudent = { ...view.student, photo: images.photo, sign: images.signature };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Your hall ticket</h1>
          <p className="mt-1 text-sm text-muted-foreground">{view.examName}. Keep the PDF and print it for the exam.</p>
        </div>
        <Button size="lg" className="h-11 px-5" onClick={download} disabled={making}>
          {making ? <Loader2 className="animate-spin" /> : <Download />} {making ? "Preparing…" : "Download PDF"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mb-4 px-1 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="ht-print" ref={sheet}>
        <FitToWidth>
          <HallTicketCard student={student} college={college} />
        </FitToWidth>
      </div>

      <style>{`
        .ht-print .hallticket-card { width: 210mm; min-height: 297mm; }
        @page { size: A4; margin: 10mm; }
        @media print {
          body * { visibility: hidden; }
          .ht-print, .ht-print * { visibility: visible; }
          .ht-print { position: absolute; inset: 0 auto auto 0; width: 100%; }
          .ht-fit { height: auto !important; border: 0 !important; box-shadow: none !important; overflow: visible !important; }
          .ht-sheet { width: 100% !important; transform: none !important; }
          .ht-print .hallticket-card { width: 100%; min-height: 276mm; }
        }
      `}</style>
    </div>
  );
}
