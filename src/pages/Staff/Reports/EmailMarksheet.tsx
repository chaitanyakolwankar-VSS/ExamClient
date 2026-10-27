import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { AlertTriangle, Mail, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { Choice } from "../Students Admin/StudentLinks";
import { SenderBanner } from "../Students Admin/StudentEmailReview";
import { StudentLinksService } from "../../../services/StudentLinksService";
import type {
  HallTicketSelection,
  MarksheetSendPreview,
} from "../../../services/StudentLinksService";

const DAY_OPTIONS = [7, 14, 21, 30, 45, 60].map((d) => ({
  value: String(d),
  label: `${d} days`,
}));

type Who = "all" | "pass" | "fail" | "one";

const WHO_OPTIONS: { value: Who; label: string }[] = [
  { value: "all", label: "Everyone" },
  { value: "pass", label: "Pass only" },
  { value: "fail", label: "Fail only" },
  { value: "one", label: "One student" },
];

const GROUP_LABEL = {
  all: "Everyone",
  pass: "Pass only",
  fail: "Fail only",
} as const;

const day = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const reason = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const escape = (s: string) => s.replace(/[<>&]/g, "");

interface Props {
  selection: HallTicketSelection; // ayid, courseId, semester, pattern, examId
  examName: string;
  resultDate: string;
  includeHistory: boolean;
  noRleForFail: boolean;
}

/**
 * Email marksheets: each student gets a link to view and save their marksheet as PDF.
 * Formatting (history, No RLE, result date) comes from the options on the Marksheet page.
 */
export default function EmailMarksheets({
  selection,
  examName,
  resultDate,
  includeHistory,
  noRleForFail,
}: Props) {
  const { ayid, courseId, semester, pattern, examId } = selection;
  const [who, setWho] = useState<Who>("all");
  const [student, setStudent] = useState("");
  const [days, setDays] = useState("30");
  const [preview, setPreview] = useState<MarksheetSendPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<"all" | "rest" | null>(null);

  // The group the preview counts: a single student is previewed against everyone.
  const group = who === "one" ? "all" : who;

  const load = useCallback(async () => {
    try {
      setPreview(
        await StudentLinksService.previewMarksheets({
          ayid,
          courseId,
          semester,
          pattern,
          examId,
          generationType: group,
        }),
      );
      setError(null);
    } catch (err) {
      setPreview(null);
      setError(reason(err, "Could not check who the marksheets would go to."));
    }
  }, [ayid, courseId, semester, pattern, examId, group]);

  useEffect(() => {
    load();
  }, [load]);

  const blocked = preview ? !preview.resultDeclared : false;
  const skipped = preview
    ? [
        preview.noEmail && `${preview.noEmail} without an email`,
        preview.flagged && `${preview.flagged} flagged`,
        preview.inactive && `${preview.inactive} inactive`,
      ].filter(Boolean)
    : [];
  const notDownloaded = preview
    ? preview.emailed > 0 && preview.downloaded < preview.sendable
    : false;
  const until = new Date();
  until.setDate(until.getDate() + Number(days));

  const send = async (mode: "all" | "rest") => {
    const one = who === "one" && mode === "all";
    const id = student.trim();
    const target = one
      ? `student <b>${escape(id)}</b>`
      : mode === "rest"
        ? `the <b>${preview!.sendable - preview!.downloaded}</b> students who haven't downloaded it`
        : `<b>${preview!.sendable}</b> student${preview!.sendable === 1 ? "" : "s"}`;
    const ok = await Swal.fire({
      icon: "question",
      title: one ? "Email this marksheet?" : "Email marksheets?",
      html: `<p>The <b>${escape(examName)}</b> marksheet goes to ${target}. Links work until <b>${day(until.toISOString())}</b>.</p><p style="font-size:13px;color:#6b7280">An earlier marksheet link for this exam stops working.</p>`,
      showCancelButton: true,
      confirmButtonText: "Email",
    });
    if (!ok.isConfirmed) return;
    setSending(mode);
    try {
      const r = await StudentLinksService.sendMarksheets({
        ...selection,
        generationType: one ? "single" : group,
        days: Number(days),
        student: one ? id : undefined,
        onlyNotDownloaded: mode === "rest",
        includeHistory,
        noRleForFail,
        resultDate: resultDate || undefined,
      });
      const left = [
        r.noEmail && `${r.noEmail} without an email`,
        r.flagged && `${r.flagged} flagged`,
        r.inactive && `${r.inactive} inactive`,
      ].filter(Boolean);
      Swal.fire({
        icon: "success",
        title: one ? "Marksheet emailed" : "Marksheets emailed",
        html: `<p>${r.message}</p>${left.length ? `<p style="font-size:13px;color:#6b7280">Skipped ${left.join(", ")}. Fix them under Student Master &gt; Check emails.</p>` : ""}`,
      });
      if (one) setStudent("");
      await load();
    } catch (err) {
      Swal.fire(
        "Not sent",
        reason(err, "The marksheets could not be emailed. Try again."),
        "error",
      );
    } finally {
      setSending(null);
    }
  };

  return (
    <ComponentCard
      title="Email marksheets"
      desc="Each student gets a link to view and save their marksheet as PDF. Formatting follows the options above."
    >
      <SenderBanner />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="shrink-0">
          <Choice value={who} onChange={setWho} options={WHO_OPTIONS} />
        </div>

        {who === "one" && (
          <div className="w-full sm:max-w-xs sm:flex-1">
            <Input
              placeholder="Student ID"
              value={student}
              onChange={(e) =>
                setStudent(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))
              }
            />
          </div>
        )}

        <div className="w-full sm:ml-auto sm:w-54">
          <Select
            options={DAY_OPTIONS}
            placeholder="Links open for"
            value={days}
            onChange={(v) => setDays(v || "30")}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
      )}

      {blocked && (
        <p className="flex items-start gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            Declare the result for this exam first, so no marksheet goes out
            before the result is out.
          </span>
        </p>
      )}

      {preview && preview.emailed > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last emailed {day(preview.lastSentAt)} ·{" "}
              <b className="font-semibold text-gray-800 dark:text-white/90">
                {preview.downloaded}
              </b>{" "}
              of {preview.sendable} downloaded
            </p>
            <span className="mt-1.5 flex h-1.5 max-w-sm overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <span
                className="bg-success-500"
                style={{
                  width: `${preview.sendable ? (preview.downloaded / preview.sendable) * 100 : 0}%`,
                }}
              />
            </span>
          </div>
          <Link
            to="/Staff/Student_Master?tab=links"
            className="text-sm text-brand-500 hover:underline"
          >
            See each student in Student links
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {who === "one" ? (
            student.trim() ? (
              <>
                To{" "}
                <b className="font-medium text-gray-800 dark:text-white/90">
                  {student.trim()}
                </b>
              </>
            ) : (
              "Enter a Student ID"
            )
          ) : preview ? (
            <>
              {GROUP_LABEL[group]}:{" "}
              <b className="font-medium text-gray-800 dark:text-white/90">
                {preview.sendable}
              </b>{" "}
              of {preview.students} students
              {skipped.length > 0 && (
                <>
                  {" "}
                  (skipping {skipped.join(", ")}; fix under Student Master &gt;
                  Check emails)
                </>
              )}
            </>
          ) : (
            "Checking…"
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {who !== "one" && notDownloaded && (
            <Button
              variant="outline"
              onClick={() => send("rest")}
              disabled={!!sending || blocked}
              startIcon={<RefreshCw className="size-4" />}
            >
              {sending === "rest"
                ? "Sending…"
                : "Resend to those not downloaded"}
            </Button>
          )}
          <Button
            onClick={() => send("all")}
            disabled={
              !!sending ||
              blocked ||
              !preview ||
              (who === "one" ? !student.trim() : preview.sendable === 0)
            }
            startIcon={<Mail className="size-4" />}
          >
            {sending === "all"
              ? "Sending…"
              : who === "one"
                ? "Email marksheet"
                : preview && preview.emailed > 0
                  ? "Email again"
                  : "Email marksheets"}
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
}
