import { useState } from "react";
import { Download, FileText, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffAccessService, staffBlobReason } from "../../services/StaffAccessService";
import type { StaffHome, StaffSiteLetter } from "../../services/StaffAccessService";
import { day } from "./format";

const KIND_LABEL: Record<StaffSiteLetter["kind"], string> = {
  Supervision: "Supervision duty",
  Examiner: "Examiner appointment",
  Moderator: "Moderator appointment",
};

interface Props {
  home: StaffHome;
  onEdit: () => void;
  /** The session ended while downloading: the page goes back to the code step. */
  onEnded: () => void;
}

/** The letters for this link's exam, then the earlier ones folded away. */
export default function StaffLettersList({ home, onEdit, onEnded }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = home.letters.filter((l) => l.current);
  const earlier = home.letters.filter((l) => !l.current);

  const download = async (letter: StaffSiteLetter) => {
    setBusyId(letter.letterId);
    setError(null);
    try {
      const blob = await StaffAccessService.letterPdf(letter.letterId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${letter.letterNo.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 401) onEnded();
      else setError(await staffBlobReason(err, "The letter could not be downloaded. Try again."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pb-8">
      <div className="mb-4 px-1">
        <h1 className="text-xl font-semibold">Your letters for {home.examTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hi {home.firstName}. Download each letter as a PDF.</p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {current.length === 0 ? (
        <p className="rounded-2xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          There are no letters for this exam yet. Ask the examination office.
        </p>
      ) : (
        <ul className="space-y-3">
          {current.map((l) => (
            <LetterCard key={l.letterId} letter={l} busy={busyId === l.letterId} disabled={busyId !== null} onDownload={download} />
          ))}
        </ul>
      )}

      {earlier.length > 0 && (
        <details className="group mt-6 rounded-2xl border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <span>Earlier letters ({earlier.length})</span>
            <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <ul className="space-y-3 border-t p-3">
            {earlier.map((l) => (
              <LetterCard key={l.letterId} letter={l} busy={busyId === l.letterId} disabled={busyId !== null} onDownload={download} />
            ))}
          </ul>
        </details>
      )}

      <div className="mt-6 px-1">
        <Button variant="link" className="h-auto p-0 text-sm" onClick={onEdit}>
          <Pencil className="size-3.5" /> Edit my details
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">These are printed on your letters.</p>
      </div>
    </div>
  );
}

function LetterCard({
  letter,
  busy,
  disabled,
  onDownload,
}: {
  letter: StaffSiteLetter;
  busy: boolean;
  disabled: boolean;
  onDownload: (letter: StaffSiteLetter) => void;
}) {
  return (
    <li className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary">{KIND_LABEL[letter.kind]}</p>
          <p className="mt-0.5 font-medium leading-snug break-words">{letter.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Letter {letter.letterNo} · {day(letter.letterDate)}
            {!letter.current && letter.examTitle ? ` · ${letter.examTitle}` : ""}
          </p>
        </div>
      </div>
      <Button className="mt-3 h-11 w-full" variant={letter.current ? "default" : "outline"} onClick={() => onDownload(letter)} disabled={disabled}>
        {busy ? <Loader2 className="animate-spin" /> : <Download />}
        {busy ? "Getting your letter…" : "Download PDF"}
        <span className="sr-only"> for letter {letter.letterNo}</span>
      </Button>
    </li>
  );
}
