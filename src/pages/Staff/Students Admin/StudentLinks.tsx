import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { CalendarClock, ChevronDown, ChevronRight, Lock, Pencil, RefreshCw, Send, Square } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import DataTable from "../../../components/ui/table/DataTable";
import { SenderBanner } from "./StudentEmailReview";
import { ALL_FIELDS, FIELD_GROUPS, FIELD_LABEL, StudentLinksService } from "../../../services/StudentLinksService";
import type { LinkBatch, LinkBatchDetail, LinkRow, LinkState, StudentField } from "../../../services/StudentLinksService";

interface Option {
  value: string;
  label: string;
}

interface Props {
  ayid: string;
  academicYear: string;
  courseOptions: Option[];
  semesterOptions: Option[];
  reason: (err: unknown, fallback: string) => string;
}

const DAY_OPTIONS: Option[] = [7, 14, 21, 30, 45, 60].map((d) => ({ value: String(d), label: `${d} days` }));

const PRESETS: { label: string; desc: string; fields: StudentField[] }[] = [
  { label: "Everything", desc: "All details except Student ID and email", fields: ALL_FIELDS },
  { label: "Photo and signature", desc: "Only the two pictures", fields: ["photo", "signature"] },
  { label: "Contact and pictures", desc: "Phone, address, photo, signature", fields: ["phone", "address", "photo", "signature"] },
  { label: "Nothing, just check", desc: "Students see their details only", fields: [] },
];

const STATE_STYLE: Record<LinkState, string> = {
  Updated: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  Opened: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  Sent: "bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-400",
  Queued: "bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-400",
  EmailFailed: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  Closed: "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-gray-500",
  Stopped: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400",
};

const STATE_LABEL: Record<LinkState, string> = {
  Updated: "Updated",
  Opened: "Opened",
  Sent: "Not opened",
  Queued: "Waiting to send",
  EmailFailed: "Email failed",
  Closed: "Closed",
  Stopped: "Stopped",
};

const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

/** yyyy-mm-dd of a local date, for <input type="date">. */
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const canChange = (fields: StudentField[]) =>
  fields.length === 0 ? "nothing" : fields.length === ALL_FIELDS.length ? "everything" : fields.map((f) => FIELD_LABEL[f]).join(", ");

/** Hall ticket batches: "Updated" means the student downloaded the hall ticket. */
const isHallTicket = (b: { taskType: string }) => b.taskType === "HALL_TICKET";

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

/** Two or more side-by-side choices, one selected. */
export function Choice<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-white/[0.05]" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition ${
            value === o.value ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** How far a send has got: one bar, green for updated, blue for opened. */
function Progress({ b }: { b: LinkBatch }) {
  const live = b.total - b.stopped;
  if (live <= 0) return null;
  return (
    <span className="flex w-40 flex-col gap-1">
      <span className="text-right text-xs text-gray-600 dark:text-gray-400">
        <b className="font-semibold text-gray-800 dark:text-white/90">{b.updated}</b> of {b.total - b.stopped} {isHallTicket(b) ? "downloaded" : "updated"}
      </span>
      <span className="flex h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <span className="bg-success-500" style={{ width: `${(b.updated / live) * 100}%` }} />
        <span className="bg-brand-400" style={{ width: `${(b.opened / live) * 100}%` }} />
        <span className="bg-error-400" style={{ width: `${(b.failed / live) * 100}%` }} />
      </span>
    </span>
  );
}

/**
 * Student Master > Student links: send a class (or one student) the link to check and change their details, then
 * follow who opened it and who updated, and resend, extend or stop. Staff choose per send which fields students may
 * change; everything else is shown to them read-only.
 */
export default function StudentLinks({ ayid, academicYear, courseOptions, semesterOptions, reason }: Props) {
  const [who, setWho] = useState<"class" | "one">("class");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [student, setStudent] = useState("");
  const [days, setDays] = useState("14");
  const [fields, setFields] = useState<Set<StudentField>>(new Set(ALL_FIELDS));
  const [custom, setCustom] = useState(false);
  const [sending, setSending] = useState(false);
  const [batches, setBatches] = useState<LinkBatch[] | null>(null);
  const [open, setOpen] = useState<LinkBatchDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    if (!ayid) return;
    try {
      setBatches(await StudentLinksService.batches(who === "class" ? { ayid, courseId: course, semesterId: semester } : { ayid }));
    } catch (err) {
      Swal.fire("Student links", reason(err, "The list could not be loaded."), "error");
    }
  }, [ayid, who, course, semester, reason]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const openBatch = async (id: string | null) => {
    if (!id || open?.id === id) {
      setOpen(null);
      return;
    }
    try {
      setOpen(await StudentLinksService.batch(id));
    } catch (err) {
      Swal.fire("Student links", reason(err, "The links could not be loaded."), "error");
    }
  };

  const refresh = async (id?: string) => {
    await loadBatches();
    const which = id ?? open?.id;
    if (which) setOpen(await StudentLinksService.batch(which));
  };

  const toggle = (f: StudentField) =>
    setFields((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  const preset = PRESETS.find((p) => p.fields.length === fields.size && p.fields.every((f) => fields.has(f)));
  const className = `${courseOptions.find((o) => o.value === course)?.label ?? "All branches"}${semester ? `, ${semesterOptions.find((o) => o.value === semester)?.label ?? semester}` : ""}`;
  const until = new Date();
  until.setDate(until.getDate() + Number(days));
  const ready = !!ayid && (who === "class" || !!student.trim());

  const send = async () => {
    const editable = ALL_FIELDS.filter((f) => fields.has(f));
    const target = who === "one" ? `<b>${student.trim().replace(/[<>&]/g, "")}</b>` : `everyone in <b>${className}</b> (${academicYear})`;
    const ok = await Swal.fire({
      icon: "question",
      title: who === "one" ? "Send the link?" : "Send links to the class?",
      html: `<p>To ${target}.</p><p>Students can change: <b>${canChange(editable)}</b>. Links work until <b>${day(until.toISOString())}</b>.</p><p style="font-size:13px;color:#6b7280">An earlier link for this stops working.</p>`,
      showCancelButton: true,
      confirmButtonText: who === "one" ? "Send link" : "Send links",
    });
    if (!ok.isConfirmed) return;
    setSending(true);
    try {
      const r = await StudentLinksService.send({
        ayid,
        courseId: who === "class" ? course : undefined,
        semesterId: who === "class" ? semester : undefined,
        days: Number(days),
        editableFields: editable,
        student: who === "one" ? student : undefined,
      });
      const skipped = [r.noEmail && `${r.noEmail} without an email`, r.flagged && `${r.flagged} flagged`, r.inactive && `${r.inactive} inactive`].filter(Boolean);
      Swal.fire({
        icon: "success",
        title: who === "one" ? "Link sent" : "Links sent",
        html: `<p>${r.message}</p>${skipped.length ? `<p style="font-size:13px;color:#6b7280">Skipped ${skipped.join(", ")}. Fix them under Check emails, then resend.</p>` : ""}`,
      });
      if (who === "one") setStudent("");
      await refresh(r.batchId);
    } catch (err) {
      Swal.fire("Not sent", reason(err, "The links could not be sent."), "error");
    } finally {
      setSending(false);
    }
  };

  const act = async (key: string, run: () => Promise<unknown>, done?: string) => {
    setBusy(key);
    try {
      await run();
      await refresh();
      if (done) Swal.fire({ icon: "success", title: done, timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Not done", reason(err, "That didn't work. Try again."), "error");
    } finally {
      setBusy(null);
    }
  };

  const stopLink = async (r: LinkRow) => {
    const ok = await Swal.fire({ icon: "warning", title: `Stop ${r.name}'s link?`, text: "The link stops working at once. You can send a new one later.", showCancelButton: true, confirmButtonText: "Stop link" });
    if (ok.isConfirmed) await act(r.id, () => StudentLinksService.stopLink(r.id), "Link stopped");
  };

  const resend = (r: LinkRow) =>
    act(r.id, () => StudentLinksService.resend(r.id), r.state === "Stopped" || r.state === "Closed" ? "New link on its way" : "Email sent again");

  const changeDeadline = async (b: LinkBatchDetail) => {
    const current = b.deadline ? new Date(b.deadline) : new Date();
    const max = new Date();
    max.setDate(max.getDate() + 90);
    const res = await Swal.fire({
      title: "Links work until",
      input: "date",
      inputValue: isoDay(current),
      inputAttributes: { min: isoDay(new Date()), max: isoDay(max) },
      text: "Closed links open again; stopped ones stay stopped.",
      showCancelButton: true,
      confirmButtonText: "Save date",
      inputValidator: (v) => (!v ? "Choose a date." : undefined),
    });
    if (res.isConfirmed && res.value) await act("deadline", () => StudentLinksService.setDeadline(b.id, res.value), "Deadline changed");
  };

  const resendBatch = async (b: LinkBatchDetail) => {
    const notOpened = b.notOpened + b.failed;
    const notUpdated = notOpened + b.opened;
    const res = await Swal.fire({
      title: "Resend the link",
      input: "radio",
      inputOptions: {
        notOpened: `Students who haven't opened it (${notOpened})`,
        notUpdated: `Everyone who hasn't ${isHallTicket(b) ? "downloaded it" : "updated"} yet (${notUpdated})`,
      },
      inputValue: notOpened > 0 ? "notOpened" : "notUpdated",
      customClass: { input: "flex! flex-col! items-start! gap-3! px-10! text-left" },
      text: "They get a new email. The link in the earlier email stops working.",
      showCancelButton: true,
      confirmButtonText: "Resend",
      inputValidator: (v) => (!v ? "Choose who gets it." : undefined),
    });
    if (!res.isConfirmed) return;
    setBusy("remind");
    try {
      const n = await StudentLinksService.remind(b.id, res.value);
      await refresh();
      Swal.fire({ icon: "success", title: n ? `Link on its way to ${n}` : "Nobody to send to", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Not sent", reason(err, "The links could not be sent."), "error");
    } finally {
      setBusy(null);
    }
  };

  const stopAll = async (b: LinkBatchDetail) => {
    const ok = await Swal.fire({ icon: "warning", title: "Stop all links of this send?", text: "Every open link stops working at once.", showCancelButton: true, confirmButtonText: "Stop all" });
    if (ok.isConfirmed) await act("stopAll", () => StudentLinksService.stopBatch(b.id), "Links stopped");
  };

  const columns = [
    { key: "studentId", label: "Student ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    {
      key: "state",
      label: "Status",
      sortable: true,
      render: (r: LinkRow) => (
        <div className="max-w-64">
          <Pill className={STATE_STYLE[r.state]}>{r.state === "Updated" ? `${open && isHallTicket(open) ? "Downloaded" : "Updated"} ${day(r.updatedAt)}` : STATE_LABEL[r.state]}</Pill>
          {r.note && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{r.note}</p>}
          {r.changes && (
            <details className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer text-brand-500">Changed: {r.changes.split("; ").map((c) => c.split(":")[0]).join(", ")}</summary>
              <ul className="mt-1 space-y-0.5">
                {r.changes.split("; ").map((c) => (
                  <li key={c} className="break-words">{c}</li>
                ))}
              </ul>
            </details>
          )}
          {r.state === "Opened" && r.openedAt && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Opened {day(r.openedAt)}</p>}
        </div>
      ),
    },
    { key: "email", label: "Email", render: (r: LinkRow) => <span className="text-sm text-gray-600 dark:text-gray-400">{r.email}</span> },
    {
      key: "actions",
      label: "",
      render: (r: LinkRow) => {
        const live = r.state !== "Stopped" && r.state !== "Closed";
        return (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => resend(r)} disabled={!!busy || (!live && !open?.isOpen)}>
              {live ? "Resend" : "Send new"}
            </Button>
            {live && (
              <Button size="sm" variant="outline" onClick={() => stopLink(r)} disabled={!!busy}>
                Stop
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <SenderBanner />
      <ComponentCard title="Send a details link" desc="Students get an email with a link, confirm it's them with a code, then check and correct their details.">
        <div className="space-y-4">
          <Choice
            value={who}
            onChange={setWho}
            options={[
              { value: "class", label: "A class" },
              { value: "one", label: "One student" },
            ]}
          />
          {who === "class" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select options={courseOptions} placeholder="All branches" value={course} onChange={setCourse} />
              <Select options={semesterOptions} placeholder="All semesters" value={semester} onChange={setSemester} />
              <Select options={DAY_OPTIONS} placeholder="Open for" value={days} onChange={(v) => setDays(v || "14")} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Input label="Student ID or email" value={student} onChange={(e) => setStudent(e.target.value)} />
              </div>
              <Select options={DAY_OPTIONS} placeholder="Open for" value={days} onChange={(v) => setDays(v || "14")} />
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">What students can change</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup">
            {PRESETS.map((p) => {
              const active = !custom && preset === p;
              return (
                <button
                  key={p.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setFields(new Set(p.fields));
                    setCustom(false);
                  }}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    active ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:bg-brand-500/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                  }`}
                >
                  <span className={`block text-sm font-medium ${active ? "text-brand-700 dark:text-brand-400" : "text-gray-800 dark:text-white/90"}`}>{p.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{p.desc}</span>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setCustom((c) => !c)} className="mt-2 text-sm text-brand-500 hover:underline">
            {custom ? "Hide field list" : "Choose fields one by one"}
          </button>
          {custom && (
            <div className="mt-3 space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              {FIELD_GROUPS.map((g) => (
                <div key={g.title} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <span className="w-44 shrink-0 pt-1.5 text-sm text-gray-500 dark:text-gray-400">{g.title}</span>
                  <div className="flex flex-wrap gap-2">
                    {g.fields.map((f) => {
                      const on = fields.has(f.key);
                      return (
                        <button
                          key={f.key}
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            toggle(f.key);
                            setCustom(true);
                          }}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                            on
                              ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-400"
                              : "border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-500"
                          }`}
                        >
                          {on ? <Pencil className="size-3.5" /> : <Lock className="size-3.5" />}
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 dark:text-gray-400">Pencil: the student can change it. Lock: shown, not changeable.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {who === "one" ? (student.trim() ? <>To <b className="font-medium text-gray-800 dark:text-white/90">{student.trim()}</b></> : "Enter a Student ID or email") : <>To everyone in <b className="font-medium text-gray-800 dark:text-white/90">{className}</b></>}
            {ready && <>, working until {day(until.toISOString())}</>}
          </p>
          <Button onClick={send} disabled={sending || !ready} startIcon={<Send className="size-4" />}>
            {sending ? "Sending…" : who === "one" ? "Send link" : "Send links"}
          </Button>
        </div>
      </ComponentCard>

      <ComponentCard title="Links sent" desc={who === "class" ? "For the branch and semester chosen above. Open one to see each student." : "Open one to see each student."}>
        {!batches ? (
          <p className="py-6 text-center text-sm text-gray-500">Loading…</p>
        ) : batches.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No links sent for this selection yet.</p>
        ) : (
          <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {batches.map((b) => {
              const isOpen = open?.id === b.id;
              return (
                <div key={b.id}>
                  <button type="button" onClick={() => openBatch(b.id)} className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <span className="flex min-w-0 items-center gap-2">
                      {isOpen ? <ChevronDown className="size-4 shrink-0 text-gray-400" /> : <ChevronRight className="size-4 shrink-0 text-gray-400" />}
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-800 dark:text-white/90">{b.title}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          Sent {day(b.createdAt)}, {b.isOpen ? `open until ${day(b.deadline)}` : "closed"}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {b.failed > 0 && <Pill className={STATE_STYLE.EmailFailed}>{b.failed} failed</Pill>}
                      {b.stopped > 0 && <Pill className={STATE_STYLE.Stopped}>{b.stopped} stopped</Pill>}
                      <Progress b={b} />
                    </span>
                  </button>
                  {isOpen && open && (
                    <div className="space-y-3 border-t border-gray-200 px-4 py-4 dark:border-gray-800">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isHallTicket(open)
                            ? `${open.updated} downloaded, ${open.opened} opened, ${open.notOpened} not opened. Students missing a photo or signature add it first.`
                            : `${open.updated} updated, ${open.opened} opened, ${open.notOpened} not opened. Students can change ${canChange(open.editableFields)}.`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => resendBatch(open)} disabled={!!busy || !open.isOpen} startIcon={<RefreshCw className="size-4" />}>
                            {busy === "remind" ? "Sending…" : "Resend"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => changeDeadline(open)} disabled={!!busy} startIcon={<CalendarClock className="size-4" />}>
                            Change deadline
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => stopAll(open)} disabled={!!busy || !open.isOpen} startIcon={<Square className="size-4" />}>
                            Stop all
                          </Button>
                        </div>
                      </div>
                      <DataTable data={open.links} columns={columns} searchKeys={["studentId", "name", "email"]} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
