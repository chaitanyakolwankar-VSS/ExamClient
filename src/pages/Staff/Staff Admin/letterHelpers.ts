import Swal from "sweetalert2";
import { saveAs } from "file-saver";

/** The API's reason from an axios error ({ message } or a plain string), else the fallback. */
export const apiReason = (err: unknown, fallback: string): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (data as { message?: string } | undefined)?.message || fallback;
};

/** Today as yyyy-MM-dd, the way a date field wants it. */
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const countWord = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Names go into SweetAlert's html, so strip anything that could be read as a tag. */
export const escapeHtml = (s: string) => s.replace(/[<>&]/g, "");

/** Text that goes into SweetAlert's html: markup characters shown as they are. */
export const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const letterInputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:text-white/90";

/** Asks before unsaved changes are thrown away. True when it is fine to carry on. */
export async function confirmLeave(text: string): Promise<boolean> {
  const ok = await Swal.fire({
    icon: "warning",
    title: "Leave without saving?",
    text,
    showCancelButton: true,
    confirmButtonText: "Leave",
    confirmButtonColor: "#d92d20",
  });
  return ok.isConfirmed;
}

/** Asks before the screen goes back to what is saved. True when the person agreed. */
export async function confirmUndo(text: string): Promise<boolean> {
  const ok = await Swal.fire({ icon: "question", title: "Undo your changes?", text, showCancelButton: true, confirmButtonText: "Undo changes" });
  return ok.isConfirmed;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** dd MMM of a date from the API ("05 Dec"), for the small status labels. */
export const shortDay = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
};

type EmailTimes = { sentAt: string | null; openedAt: string | null; downloadedAt: string | null; stoppedAt?: string | null; expiredAt?: string | null; queuedAt?: string | null; failed?: boolean };

/** True when the link was stopped and not emailed again since. */
export const isStopped = (s: EmailTimes | undefined) => !!s?.stoppedAt && (!s.sentAt || new Date(s.stoppedAt) >= new Date(s.sentAt));

/** True when the email is in the queue and has not left yet. */
export const isQueued = (s: EmailTimes | undefined) => !!s?.queuedAt && !s.failed && !isStopped(s);

/** True when the person has a link that works: waiting to be sent, or emailed (opened, downloaded), and not stopped. */
export const hasActiveLink = (s: EmailTimes | undefined) => isQueued(s) || (!!s?.sentAt && !isStopped(s) && !s.expiredAt && !s.failed);

/** True when the emailed link ran out, was stopped or could not be sent: a new link has to be sent. */
export const needsNewLink = (s: EmailTimes | undefined) => !!s?.failed || isStopped(s) || (!!s?.sentAt && !!s.expiredAt);

export type EmailTone = "none" | "queued" | "sent" | "opened" | "done" | "stopped" | "error";

/** Where a person got to with the emailed link: the furthest step they reached, or that the link was stopped. */
export function emailProgress(s: EmailTimes | undefined): { text: string; tone: EmailTone } {
  if (isStopped(s)) return { text: `Stopped ${shortDay(s!.stoppedAt!)}`, tone: "stopped" };
  if (s?.sentAt && s.expiredAt) return { text: `Link ran out ${shortDay(s.expiredAt)}`, tone: "stopped" };
  if (s?.failed) return { text: "Email failed", tone: "error" };
  if (s?.queuedAt) return { text: "Waiting to send", tone: "queued" };
  if (s?.downloadedAt) return { text: `Downloaded ${shortDay(s.downloadedAt)}`, tone: "done" };
  if (s?.openedAt) return { text: `Opened ${shortDay(s.openedAt)}`, tone: "opened" };
  if (s?.sentAt) return { text: `Sent ${shortDay(s.sentAt)}`, tone: "sent" };
  return { text: "Not sent", tone: "none" };
}

/**
 * Shows a PDF in a new tab. The tab is opened first (a browser only allows that straight after a click), then
 * filled when the PDF arrives; if the browser blocks the tab the PDF is saved as a file instead.
 */
export async function openPdf(title: string, get: () => Promise<{ blob: Blob; fileName: string }>) {
  const tab = window.open("", "_blank");
  try {
    const { blob, fileName } = await get();
    if (tab) {
      const url = URL.createObjectURL(blob);
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    } else {
      saveAs(blob, fileName);
    }
  } catch (err) {
    tab?.close();
    Swal.fire(title, apiReason(err, "The PDF could not be made. Try again."), "error");
  }
}
