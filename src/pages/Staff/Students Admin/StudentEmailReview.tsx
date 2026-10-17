import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { CheckCircle2, Settings } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import DataTable from "../../../components/ui/table/DataTable";
import { StudentEmailService } from "../../../services/StudentEmailService";
import type { EmailSettings, EmailShow, EmailState, StudentEmailList, StudentEmailRow } from "../../../services/StudentEmailService";
import { isValidEmail } from "./studentFields";

interface Option {
  value: string;
  label: string;
}

interface Props {
  ayid: string;
  academicYear: string;
  courseOptions: Option[];
  semesterOptions: Option[];
  isAdmin: boolean;
  reason: (err: unknown, fallback: string) => string;
}

const SHOWS: { value: EmailShow; label: string; count: (l: StudentEmailList) => number | null }[] = [
  { value: "attention", label: "Needs attention", count: (l) => l.missing + l.flagged },
  { value: "unchecked", label: "Not checked", count: (l) => l.unchecked },
  { value: "verified", label: "Verified", count: (l) => l.verified },
  { value: "all", label: "All", count: () => null },
];

const STATE_STYLE: Record<EmailState, string> = {
  Missing: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  Flagged: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400",
  Unchecked: "bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-400",
  Verified: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
};

const STATE_LABEL: Record<EmailState, string> = { Missing: "Missing", Flagged: "Flagged", Unchecked: "Not checked", Verified: "Verified" };

/**
 * Student Master > Check emails: before links are sent, staff fix missing and flagged emails and mark them
 * verified (one by one, or the selected rows at once). College admins also set the allowed domains, the exam
 * office email shown in every student email, and the daily email limit.
 */
export default function StudentEmailReview({ ayid, academicYear, courseOptions, semesterOptions, isAdmin, reason }: Props) {
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [show, setShow] = useState<EmailShow>("attention");
  const [list, setList] = useState<StudentEmailList | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null); // a student ID, or "bulk"

  const load = useCallback(async () => {
    if (!ayid) return;
    setLoading(true);
    try {
      setList(await StudentEmailService.list({ ayid, courseId: course, semesterId: semester, show }));
      setSelected(new Set());
    } catch (err) {
      Swal.fire("Check emails", reason(err, "The list could not be loaded."), "error");
    } finally {
      setLoading(false);
    }
  }, [ayid, course, semester, show, reason]);

  useEffect(() => {
    load();
  }, [load]);

  const draftOf = (r: StudentEmailRow) => drafts[r.studentId] ?? r.email ?? "";

  const save = async (r: StudentEmailRow, verify: boolean) => {
    const email = draftOf(r).trim();
    if (!isValidEmail(email)) {
      Swal.fire("Email", email ? "Enter a valid email address." : "Enter the student's email.", "warning");
      return;
    }
    setBusy(r.studentId);
    try {
      await StudentEmailService.update(r.studentId, email, verify);
      setDrafts((d) => {
        const next = { ...d };
        delete next[r.studentId];
        return next;
      });
      await load();
    } catch (err) {
      Swal.fire("Not saved", reason(err, "The email could not be saved."), "error");
    } finally {
      setBusy(null);
    }
  };

  const verifiable = useMemo(() => (list?.rows ?? []).filter((r) => r.email && r.status !== "Verified"), [list]);
  const verifySelected = async () => {
    const ids = verifiable.filter((r) => selected.has(r.studentId)).map((r) => r.studentId);
    if (ids.length === 0) return;
    const ok = await Swal.fire({
      icon: "question",
      title: `Mark ${ids.length} email(s) as verified?`,
      text: "Only do this after checking that each address really is the student's own.",
      showCancelButton: true,
      confirmButtonText: "Mark verified",
    });
    if (!ok.isConfirmed) return;
    setBusy("bulk");
    try {
      const n = await StudentEmailService.verify(ids);
      await load();
      Swal.fire({ icon: "success", title: `${n} email(s) verified`, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Not saved", reason(err, "The emails could not be marked verified."), "error");
    } finally {
      setBusy(null);
    }
  };

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const allSelected = verifiable.length > 0 && verifiable.every((r) => selected.has(r.studentId));

  const columns = [
    {
      key: "select",
      label: "",
      render: (r: StudentEmailRow) =>
        r.email && r.status !== "Verified" ? (
          <input
            type="checkbox"
            aria-label={`Select ${r.studentId}`}
            className="size-4 accent-brand-500"
            checked={selected.has(r.studentId)}
            onChange={(e) => toggle(r.studentId, e.target.checked)}
          />
        ) : null,
    },
    { key: "studentId", label: "Student ID", sortable: true },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (r: StudentEmailRow) => (
        <span>
          {r.name}
          {!r.isActive && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-white/[0.05]">Inactive</span>}
        </span>
      ),
    },
    { key: "branch", label: "Branch", sortable: true, render: (r: StudentEmailRow) => `${r.branch}${r.semesterId ? ` · ${r.semesterId}` : ""}` },
    {
      key: "email",
      label: "Email",
      render: (r: StudentEmailRow) => (
        <input
          type="email"
          aria-label={`Email of ${r.studentId}`}
          value={draftOf(r)}
          placeholder="student@email"
          maxLength={255}
          onChange={(e) => setDrafts((d) => ({ ...d, [r.studentId]: e.target.value.replace(/\s/g, "") }))}
          className="h-9 w-full min-w-56 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r: StudentEmailRow) => (
        <div className="max-w-64">
          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STATE_STYLE[r.status]}`}>{STATE_LABEL[r.status]}</span>
          {r.reason && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{r.reason}</p>}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r: StudentEmailRow) => {
        const changed = draftOf(r).trim() !== (r.email ?? "");
        const working = busy === r.studentId;
        return (
          <div className="flex justify-end gap-2">
            {changed && (
              <Button size="sm" variant="outline" onClick={() => save(r, false)} disabled={!!busy}>
                Save
              </Button>
            )}
            {(changed || r.status !== "Verified") && (
              <Button size="sm" onClick={() => save(r, true)} disabled={!!busy || !draftOf(r).trim()} title="Save this email and mark it checked">
                {working ? "Saving…" : "Verify"}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <ComponentCard
        title="Check emails"
        desc={`Task links and OTPs go to these addresses. Fix missing and flagged ones and mark them verified before sending links. Students enrolled in ${academicYear || "the academic year in the header"}.`}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select options={courseOptions} placeholder="All branches" value={course} onChange={setCourse} />
          <Select options={semesterOptions} placeholder="All semesters" value={semester} onChange={setSemester} />
          <div role="group" aria-label="Show" className="grid grid-cols-2 overflow-hidden rounded-lg border border-gray-300 sm:col-span-2 sm:flex dark:border-gray-700">
            {SHOWS.map((s, i) => {
              const n = list ? s.count(list) : null;
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={show === s.value}
                  onClick={() => setShow(s.value)}
                  className={`flex-1 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition ${i > 0 ? "border-l border-gray-300 dark:border-gray-700" : ""} ${
                    show === s.value ? "bg-brand-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  {s.label}
                  {n !== null && <span className="ml-1 opacity-80">({n})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {list && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {list.missing} missing · {list.flagged} flagged · {list.unchecked} not checked · {list.verified} verified
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="size-4 accent-brand-500"
              checked={allSelected}
              disabled={verifiable.length === 0}
              onChange={(e) => setSelected(e.target.checked ? new Set(verifiable.map((r) => r.studentId)) : new Set())}
            />
            Select all with an email ({verifiable.length})
          </label>
          <Button size="sm" onClick={verifySelected} disabled={selected.size === 0 || !!busy} startIcon={<CheckCircle2 className="size-4" />}>
            {busy === "bulk" ? "Saving…" : `Mark selected verified (${selected.size})`}
          </Button>
        </div>

        {loading && !list ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading…</p>
        ) : (
          <DataTable data={list?.rows ?? []} columns={columns} searchKeys={["studentId", "name", "email"]} />
        )}
      </ComponentCard>

      <EmailSettingsCard isAdmin={isAdmin} reason={reason} onSaved={load} />
    </div>
  );
}

/** The college's email settings; college admins can change them (the API refuses everyone else). */
function EmailSettingsCard({ isAdmin, reason, onSaved }: { isAdmin: boolean; reason: Props["reason"]; onSaved: () => void }) {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    StudentEmailService.getSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  if (!settings) return null;

  const save = async () => {
    setSaving(true);
    try {
      const flagged = await StudentEmailService.saveSettings(settings);
      onSaved();
      Swal.fire({ icon: "success", title: "Email settings saved", text: `Emails were re-checked: ${flagged} flagged.`, timer: 2500 });
    } catch (err) {
      Swal.fire("Not saved", reason(err, "The settings could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ComponentCard
      title="Email settings"
      desc={isAdmin ? "For the whole college. Changing the domains re-checks every email that is not verified yet." : "Set by the college admin."}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input
          label="Allowed email domains"
          placeholder="Any domain"
          hint="E.g. vivatech.in, student.vivatech.in. Others are flagged; empty = any."
          value={settings.allowedEmailDomains ?? ""}
          disabled={!isAdmin}
          onChange={(e) => setSettings({ ...settings, allowedEmailDomains: e.target.value })}
        />
        <Input
          type="email"
          label="Exam office email"
          placeholder="exams@college.edu"
          hint="Shown in every student email: “For help, contact …”."
          value={settings.examOfficeEmail ?? ""}
          disabled={!isAdmin}
          onChange={(e) => setSettings({ ...settings, examOfficeEmail: e.target.value.replace(/\s/g, "") })}
        />
        <Input
          type="number"
          label="Daily email limit"
          hint="Bulk sends stop at this many emails a day (OTPs always go)."
          value={settings.dailyEmailLimit}
          min="1"
          max="100000"
          disabled={!isAdmin}
          onChange={(e) => setSettings({ ...settings, dailyEmailLimit: Number(e.target.value) || 0 })}
        />
      </div>
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} startIcon={<Settings className="size-4" />}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      )}
    </ComponentCard>
  );
}
