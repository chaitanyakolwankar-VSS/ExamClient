import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Switch from "../../../components/form/switch/Switch";
import { HallTicketCard } from "../../../components/HallTicket/Hallticket";
import type { HallTicketCollegeInfo, HallTicketStudent } from "../../../components/HallTicket/Hallticket";
import { hallTicketTitle } from "../../../components/HallTicket/title";
import { useAuth } from "../../../context/AuthContext";
import { GenerateHallTicketService } from "../../../services/GenerateHallTicketService";
import type { HallTicketCollege, HallTicketInstructions } from "../../../services/GenerateHallTicketService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/** The hall ticket card is 190 mm wide (the A4 sheet less the print margins); the preview is scaled down from that. */
const CARD_PX = 718;

const SAMPLE_SUBJECTS = [
  ["CE601", "Design of Reinforced Concrete Structures"],
  ["CE602", "Geotechnical Engineering"],
  ["CE603", "Transportation Engineering"],
  ["CE604", "Environmental Engineering and Waste Water Management"],
  ["CE605", "Construction Management"],
  ["CE606", "Estimating, Costing and Valuation"],
  ["CE607", "Professional Elective III: Advanced Structural Analysis"],
  ["CE608", "Open Elective II: Introduction to Remote Sensing"],
  ["CE609", "Design Laboratory"],
  ["CE610", "Environmental Engineering Laboratory"],
  ["CE611", "Seminar and Technical Writing"],
  ["CE612", "Industrial Training and Project Work"],
].map(([code, name], i) => ({
  code,
  name,
  date: `${String(2 + i).padStart(2, "0")}-12-2026`,
  time: "10:00 AM - 01:00 PM",
}));

const SAMPLE_STUDENT: HallTicketStudent = {
  name: "KULKARNI SHRADDHA RAJENDRAKUMAR",
  centre: "",
  seat: "26001234",
  studentid: "26CE0001",
  ern: "2600123456",
  abcId: "123456789012",
  subjects: SAMPLE_SUBJECTS,
};

const SAMPLE_TITLE = hallTicketTitle({ branch: "Civil Engineering", pattern: "NEP - R-24", examName: "Regular Dec 2026" });

/** What a pasted line may start with: "1.", "1)", a bullet or a dash. */
const LEADING_MARK = /^\s*(?:\d{1,3}\s*[.)]|[•·*\-–])\s*/;

/** The lines to save: numbers and bullets taken off the start, empty lines left out. */
const cleanLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => l.replace(LEADING_MARK, "").trim())
    .filter(Boolean);

const fieldLabel = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";
const fieldBox =
  "w-full rounded-lg border border-gray-300 bg-transparent px-3.5 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";
const errorText = "text-error-600 dark:text-error-400";

/** A full hall ticket card scaled down to the width of its column. */
function ScaledCard({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState<number>();
  useLayoutEffect(() => {
    const fit = () => {
      if (!outer.current || !inner.current) return;
      const s = Math.min(1, outer.current.clientWidth / CARD_PX);
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
    <div ref={outer} className="ht-preview overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700" style={{ height }}>
      <div ref={inner} style={{ width: CARD_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
      <style>{`.ht-preview .hallticket-card { width: 190mm; min-height: 276mm; }`}</style>
    </div>
  );
}

/** Staff admin window: switch the hall ticket instructions on or off, edit the text, and see the card as it will print. */
export default function HallTicketInstructionsModal({ isOpen, onClose }: Props) {
  const { isAdmin } = useAuth();
  const [loaded, setLoaded] = useState<HallTicketInstructions | null>(null);
  const [college, setCollege] = useState<HallTicketCollege | null>(null);
  const [on, setOn] = useState(true);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fits, setFits] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setSaveError("");
    setFits(null);
    Promise.all([GenerateHallTicketService.getInstructions(), GenerateHallTicketService.getcollegeDataExam().catch(() => null)])
      .then(([ins, col]) => {
        if (cancelled) return;
        setLoaded(ins);
        setCollege(col);
        setOn(ins.on);
        setText(ins.lines.join("\n"));
      })
      .catch(() => {
        if (!cancelled) setLoadError("The instructions could not be loaded. Check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const maxLines = loaded?.maxLines ?? 10;
  const maxLineLength = loaded?.maxLineLength ?? 250;
  const maxLength = loaded?.maxLength ?? 1500;

  const lines = useMemo(() => cleanLines(text), [text]);
  const characters = lines.join("\n").length;
  const tooMany = lines.length > maxLines;
  const tooLong = characters > maxLength;
  // The first line of the box (counted as the person sees it) that is too long.
  const longLine = useMemo(() => {
    const raw = text.split(/\r?\n/);
    for (let i = 0; i < raw.length; i++) if (raw[i].replace(LEADING_MARK, "").trim().length > maxLineLength) return i + 1;
    return 0;
  }, [text, maxLineLength]);
  const overLimit = tooMany || tooLong || longLine > 0;

  // The card shows the default text when the box is empty, as the printed hall ticket will.
  const shownLines = useMemo(() => (!on ? [] : lines.length > 0 ? lines : (loaded?.defaultLines ?? [])), [on, lines, loaded]);
  const previewCollege = useMemo<HallTicketCollegeInfo>(
    () => ({
      logo: college?.logo ?? "",
      center: college?.center ?? "",
      collegeName: college?.collegeName,
      principalSign: college?.principalSign,
      controllerSign: college?.controllerSign,
      seal: college?.seal,
      title: SAMPLE_TITLE,
      instructions: shownLines,
    }),
    [college, shownLines],
  );
  const previewStudent = useMemo<HallTicketStudent>(() => ({ ...SAMPLE_STUDENT, centre: college?.center ?? "" }), [college]);
  const handleFit = useCallback((ok: boolean) => setFits(ok), []);

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await GenerateHallTicketService.saveInstructions({ on, text: lines.length > 0 ? lines.join("\n") : null });
      Swal.fire({
        title: "Saved!",
        text: on ? "Hall tickets will print these instructions." : "Hall tickets will print without instructions.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      onClose();
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      setSaveError(
        e.response?.status === 403
          ? "Only a college admin can change these."
          : (e.response?.data?.message ?? "The instructions could not be saved. Try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="pr-10">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Hall ticket instructions</h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Printed under the subjects on every hall ticket of your college.</p>
        </div>

        {loadError && (
          <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {loadError}
          </p>
        )}
        {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}

        {loaded && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Editor */}
            <div className="flex flex-col gap-4">
              <div className="w-fit rounded-xl border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-white/[0.02]">
                <Switch label="Print instructions on hall tickets" color="blue" checked={on} disabled={!isAdmin} onChange={setOn} />
              </div>

              <div>
                <label htmlFor="ht-instructions" className={fieldLabel}>
                  One instruction per line
                </label>
                <textarea
                  id="ht-instructions"
                  value={text}
                  rows={12}
                  readOnly={!isAdmin}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={loaded.defaultLines.join("\n")}
                  className={`${fieldBox} resize-y ${on ? "" : "bg-gray-50 text-gray-500 dark:bg-white/[0.02]"}`}
                />
                <p className={`mt-1.5 text-sm ${tooMany || tooLong ? errorText : "text-gray-500 dark:text-gray-400"}`}>
                  {lines.length} of {maxLines} lines · {characters} of {maxLength} characters
                </p>
                {longLine > 0 && (
                  <p className={`mt-0.5 text-sm ${errorText}`}>
                    Line {longLine} is longer than {maxLineLength} characters.
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Numbers are added for you. Leave it empty to use the default text.</p>
                  {isAdmin && (
                    <button type="button" onClick={() => setText(loaded.defaultLines.join("\n"))} className="text-sm font-medium text-brand-500 hover:text-brand-600">
                      Use default text
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="min-w-0">
              <p className={fieldLabel}>Preview</p>
              <ScaledCard>
                <HallTicketCard student={previewStudent} college={previewCollege} onFit={handleFit} />
              </ScaledCard>
              <p
                role="status"
                className={`mt-2 text-sm ${!on ? "text-gray-500 dark:text-gray-400" : fits === false ? "text-warning-600 dark:text-warning-400" : "text-success-600 dark:text-success-400"}`}
              >
                {!on
                  ? "Instructions are off. The hall ticket prints without them."
                  : fits === false
                    ? `Too long to fit with ${SAMPLE_SUBJECTS.length} subjects — shorten the text.`
                    : `Fits on one A4 page with ${SAMPLE_SUBJECTS.length} subjects.`}
              </p>
            </div>
          </div>
        )}

        {saveError && (
          <p role="alert" className={`text-sm ${errorText}`}>
            {saveError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          {loaded && !isAdmin && <p className="mr-auto text-sm text-gray-500 dark:text-gray-400">Only a college admin can change these.</p>}
          <Button size="sm" variant="outline" onClick={onClose}>
            {isAdmin ? "Cancel" : "Close"}
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={save} disabled={!loaded || saving || overLimit}>
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
