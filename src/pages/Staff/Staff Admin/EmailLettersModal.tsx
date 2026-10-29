import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import { Modal } from "../../../components/ui/modal";
import { Choice } from "../Students Admin/StudentLinks";
import { StaffLetterService } from "../../../services/StaffLetterService";
import type { LetterEmailPreview, LetterKind, LetterTarget } from "../../../services/StaffLetterService";
import { apiReason, countWord } from "./letterHelpers";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The exam (examiner and moderator letters) or the duty chart (supervision letters). */
  target: LetterTarget;
  /** The exam's or the chart's name, as the email calls it. */
  title: string;
  kind: LetterKind;
  /** Called after a send, so the Email column is read again. */
  onSent: () => void;
}

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

/**
 * Email letters: each person with a letter gets one email with a link to check their details and download their
 * letters as PDF. Sending again replaces the person's earlier link.
 */
export default function EmailLettersModal({ isOpen, onClose, target, title, kind, onSent }: Props) {
  const { examId, dutyChartId } = target;
  const [who, setWho] = useState<"all" | "rest">("all");
  const [preview, setPreview] = useState<LetterEmailPreview | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const chosen = useRef(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const p = await StaffLetterService.emailPreview({ examId, dutyChartId, kind, onlyNotSent: who === "rest" });
      setPreview(p);
      // The first time, with some already emailed, offer the people still waiting.
      if (!chosen.current) {
        chosen.current = true;
        if (who === "all" && p.alreadySent > 0 && p.alreadySent < p.people) setWho("rest");
      }
    } catch (err) {
      setPreview(null);
      setError(apiReason(err, "Could not check who the letters would go to."));
    }
  }, [examId, dutyChartId, kind, who]);

  // Each time the window opens it starts afresh and counts the people again.
  useEffect(() => {
    if (!isOpen) {
      chosen.current = false;
      setWho("all");
      setResult("");
      setPreview(null);
      return;
    }
    load();
  }, [isOpen, load]);

  const send = async () => {
    setSending(true);
    setError("");
    try {
      const r = await StaffLetterService.emailSend({ examId, dutyChartId, kind, onlyNotSent: who === "rest" });
      setResult(r.message);
      onSent();
      await load();
    } catch (err) {
      setError(apiReason(err, "The letters could not be emailed. Try again."));
    } finally {
      setSending(false);
    }
  };

  const noEmail = preview?.noEmail ?? [];
  const canSend = !!preview && preview.senderReady && preview.withEmail > 0 && !sending;

  return (
    <Modal isOpen={isOpen} onClose={() => !sending && onClose()} className="m-4 max-w-[560px]">
      <div role="dialog" aria-modal="true" aria-label="Email letters" className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="pr-10">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Email letters</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Each person gets a link for <b className="font-medium text-gray-700 dark:text-gray-300">{title}</b>. They confirm it is them with a code sent to their email, check their details and download their letters as PDF.
          </p>
        </div>

        <Choice
          value={who}
          onChange={setWho}
          options={[
            { value: "all", label: "Everyone" },
            { value: "rest", label: "Only not emailed yet" },
          ]}
        />

        {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}

        {preview && !preview.senderReady && (
          <p className="flex items-start gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>Email is not set up for this college yet, so nothing can be sent. Ask the platform admin to set up the sending account.</span>
          </p>
        )}

        {preview ? (
          <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
            <p>
              Email goes to <b className="font-semibold text-gray-800 dark:text-white/90">{preview.withEmail}</b> of {people(preview.people)} ({countWord(preview.letters, "letter")}).
            </p>
            {preview.alreadySent > 0 && (
              <p className="mt-1">
                {preview.alreadySent} already emailed{who === "all" ? "; an earlier link stops working when a new one is sent." : "."}
              </p>
            )}
            {noEmail.length > 0 && <p className="mt-1 text-warning-700 dark:text-orange-300">No email address: {noEmail.join(", ")}. Add it in Staff Master first.</p>}
          </div>
        ) : (
          !error && <p className="text-sm text-gray-500 dark:text-gray-400">Checking…</p>
        )}

        {result && (
          <p role="status" className="flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{result}</span>
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            {result ? "Close" : "Cancel"}
          </Button>
          <Button onClick={send} disabled={!canSend} startIcon={<Mail className="size-4" />}>
            {sending ? "Sending…" : preview ? `Email ${people(preview.withEmail)}` : "Email"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
