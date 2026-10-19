import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { BellRing, CalendarClock, ChevronDown, ChevronRight, Lock, Pencil, RefreshCw, Send, Square } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
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

const PRESETS: { label: string; fields: StudentField[] }[] = [
  { label: "Everything", fields: ALL_FIELDS },
  { label: "Photo and signature only", fields: ["photo", "signature"] },
  { label: "Contact, photo and signature", fields: ["phone", "address", "photo", "signature"] },
  { label: "View only", fields: [] },
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

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

/**
 * Student Master > Student links: send a class the link to check (and change) their details, then follow who
 * opened it and who updated, and stop, extend, remind or resend. Staff choose per send which fields students may
 * change; everything else is shown to them read-only.
 */
export default function StudentLinks({ ayid, academicYear, courseOptions, semesterOptions, reason }: Props) {
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [days, setDays] = useState("14");
  const [fields, setFields] = useState<Set<StudentField>>(new Set(ALL_FIELDS));
  const [sending, setSending] = useState(false);
  const [batches, setBatches] = useState<LinkBatch[] | null>(null);
  const [open, setOpen] = useState<LinkBatchDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    if (!ayid) return;
    try {
      setBatches(await StudentLinksService.batches({ ayid, courseId: course, semesterId: semester }));
    } catch (err) {
      Swal.fire("Student links", reason(err, "The list could not be loaded."), "error");
    }
  }, [ayid, course, semester, reason]);

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

  const toggleGroup = (keys: StudentField[]) =>
    setFields((prev) => {
      const next = new Set(prev);
      const all = keys.every((k) => next.has(k));
      keys.forEach((k) => (all ? next.delete(k) : next.add(k)));
      return next;
    });

  const send = async () => {
    const className = `${courseOptions.find((o) => o.value === course)?.label ?? "All branches"}${semester ? `, ${semesterOptions.find((o) => o.value === semester)?.label ?? semester}` : ""}`;
    const editable = ALL_FIELDS.filter((f) => fields.has(f));
    const until = new Date();
    until.setDate(until.getDate() + Number(days));
    const ok = await Swal.fire({
      icon: "question",
      title: "Send details links?",
      html: `<p>${className} (${academicYear})</p><p>Links work until <b>${day(until.toISOString())}</b>.</p><p>Students can change: <b>${
        editable.length === 0 ? "nothing (view only)" : editable.length === ALL_FIELDS.length ? "everything" : editable.map((f) => FIELD_LABEL[f]).join(", ")
      }</b></p><p style="font-size:13px;color:#6b7280">A student's earlier link for this is stopped. Students without a usable email are skipped.</p>`,
      showCancelButton: true,
      confirmButtonText: "Send links",
    });
    if (!ok.isConfirmed) return;
    setSending(true);
    try {
      const r = await StudentLinksService.send({ ayid, courseId: course, semesterId: semester, days: Number(days), editableFields: editable });
      const skipped = [r.noEmail && `${r.noEmail} without an email`, r.flagged && `${r.flagged} flagged`, r.inactive && `${r.inactive} inactive`].filter(Boolean);
      Swal.fire({
        icon: "success",
        title: "Links sent",
        html: `<p>${r.message}</p>${skipped.length ? `<p style="font-size:13px;color:#6b7280">Skipped: ${skipped.join(", ")}. Fix them under Check emails, then resend.</p>` : ""}${
          r.replaced ? `<p style="font-size:13px;color:#6b7280">${r.replaced} earlier link(s) stopped.</p>` : ""
        }`,
      });
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
      text: "For every open link of this send. Closed links open again; stopped ones stay stopped.",
      showCancelButton: true,
      confirmButtonText: "Save date",
      inputValidator: (v) => (!v ? "Choose a date." : undefined),
    });
    if (res.isConfirmed && res.value) await act("deadline", () => StudentLinksService.setDeadline(b.id, res.value), "Deadline changed");
  };

  const remind = async (b: LinkBatchDetail) => {
    const ok = await Swal.fire({
      icon: "question",
      title: "Remind students who haven't opened it?",
      text: "They get a new email; the link in the earlier one stops working.",
      showCancelButton: true,
      confirmButtonText: "Send reminders",
    });
    if (!ok.isConfirmed) return;
    setBusy("remind");
    try {
      const n = await StudentLinksService.remind(b.id);
      await refresh();
      Swal.fire({ icon: "success", title: n ? `Reminder on its way to ${n}` : "Nobody to remind", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Not sent", reason(err, "The reminders could not be sent."), "error");
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
          <Pill className={STATE_STYLE[r.state]}>{r.state === "Updated" ? `Updated ${day(r.updatedAt)}` : STATE_LABEL[r.state]}</Pill>
          {r.note && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{r.note}</p>}
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
            <Button size="sm" variant="outline" onClick={() => resend(r)} disabled={!!busy || (!live && !open?.isOpen)} startIcon={<RefreshCw className="size-3.5" />}>
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
      <ComponentCard title="Send details links" desc={`Each student gets an email with a link to check their details; a 6-digit code to their email confirms it's them. Students enrolled in ${academicYear || "the academic year in the header"}.`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select options={courseOptions} placeholder="All branches" value={course} onChange={setCourse} />
          <Select options={semesterOptions} placeholder="All semesters" value={semester} onChange={setSemester} />
          <Select options={DAY_OPTIONS} placeholder="Open for" value={days} onChange={(v) => setDays(v || "14")} />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">What students can change — tap a field to switch it</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const active = p.fields.length === fields.size && p.fields.every((f) => fields.has(f));
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setFields(new Set(p.fields))}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      active ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {FIELD_GROUPS.map((g) => {
              const keys = g.fields.map((f) => f.key);
              const all = keys.every((k) => fields.has(k));
              return (
                <div key={g.title} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{g.title}</span>
                    <button type="button" onClick={() => toggleGroup(keys)} className="text-xs text-brand-500 hover:underline">
                      {all ? "Lock all" : "Allow all"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.fields.map((f) => {
                      const on = fields.has(f.key);
                      return (
                        <button
                          key={f.key}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(f.key)}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                            on
                              ? "border-success-300 bg-success-50 text-success-700 dark:border-success-500/40 dark:bg-success-500/15 dark:text-success-400"
                              : "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-500"
                          }`}
                        >
                          {on ? <Pencil className="size-3.5" /> : <Lock className="size-3.5" />}
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <Pencil className="mr-1 inline size-3" /> green: the student can change it · <Lock className="mx-1 inline size-3" /> gray: shown read-only. Student ID and the email are never editable.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={send} disabled={sending || !ayid} startIcon={<Send className="size-4" />}>
            {sending ? "Sending…" : "Send links"}
          </Button>
        </div>
      </ComponentCard>

      <ComponentCard title="Links sent" desc="For the branch and semester chosen above. Open a send to see each student.">
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
                  <button type="button" onClick={() => openBatch(b.id)} className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <span className="flex items-center gap-2">
                      {isOpen ? <ChevronDown className="size-4 text-gray-400" /> : <ChevronRight className="size-4 text-gray-400" />}
                      <span>
                        <span className="block text-sm font-medium text-gray-800 dark:text-white/90">{b.title}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          Sent {day(b.createdAt)} · {b.isOpen ? `open until ${day(b.deadline)}` : "closed"} · can change:{" "}
                          {b.editableFields.length === 0 ? "nothing" : b.editableFields.length === ALL_FIELDS.length ? "everything" : b.editableFields.map((f) => FIELD_LABEL[f]).join(", ")}
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <Pill className={STATE_STYLE.Updated}>{b.updated} updated</Pill>
                      <Pill className={STATE_STYLE.Opened}>{b.opened} opened</Pill>
                      <Pill className={STATE_STYLE.Sent}>{b.notOpened} not opened</Pill>
                      {b.failed > 0 && <Pill className={STATE_STYLE.EmailFailed}>{b.failed} failed</Pill>}
                      {b.stopped > 0 && <Pill className={STATE_STYLE.Stopped}>{b.stopped} stopped</Pill>}
                    </span>
                  </button>
                  {isOpen && open && (
                    <div className="space-y-3 border-t border-gray-200 px-4 py-4 dark:border-gray-800">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => changeDeadline(open)} disabled={!!busy} startIcon={<CalendarClock className="size-4" />}>
                          Change deadline
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remind(open)} disabled={!!busy || !open.isOpen || open.notOpened === 0} startIcon={<BellRing className="size-4" />}>
                          {busy === "remind" ? "Sending…" : `Remind not opened (${open.notOpened})`}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => stopAll(open)} disabled={!!busy || !open.isOpen} startIcon={<Square className="size-4" />}>
                          Stop all
                        </Button>
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
