import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Mail, Send, Trash2 } from "lucide-react";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { platformErrorMessage, platformService } from "../../services/platformService";
import type { EmailAccountInput, EmailAccountView } from "../../services/platformService";

interface Props {
  /** Null = the platform default account. */
  collegeId: string | null;
}

const blank = (): EmailAccountInput => ({
  host: "smtp.gmail.com",
  port: 587,
  useStartTls: true,
  username: "",
  password: "",
  fromAddress: "",
  fromName: "",
});

type Notice = { variant: "success" | "error" | "warning" | "info"; message: string };

/**
 * The mail account student emails (task links, OTPs) are sent from. For a Google account: smtp.gmail.com, port
 * 587, STARTTLS, the Gmail address as sign-in and an app password (Google account > Security > App passwords).
 * The password is stored encrypted and never shown again; leave it blank to keep the saved one.
 */
export default function EmailAccountCard({ collegeId }: Props) {
  const [view, setView] = useState<EmailAccountView | null>(null);
  const [form, setForm] = useState<EmailAccountInput>(blank);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [testTo, setTestTo] = useState("");

  const show = (v: EmailAccountView) => {
    setView(v);
    setForm(
      v.exists
        ? { host: v.host, port: v.port, useStartTls: v.useStartTls, username: v.username, password: "", fromAddress: v.fromAddress, fromName: v.fromName ?? "" }
        : blank(),
    );
  };

  useEffect(() => {
    platformService.getEmailAccount(collegeId).then(show).catch((err) => setNotice({ variant: "error", message: platformErrorMessage(err, "The email account could not be loaded.") }));
  }, [collegeId]);

  if (!view) return notice ? <Alert variant={notice.variant} title="Email" message={notice.message} /> : null;

  const save = async () => {
    setBusy(true);
    setNotice(null);
    try {
      show(await platformService.saveEmailAccount(collegeId, { ...form, fromAddress: form.fromAddress || form.username }));
      setNotice({ variant: "success", message: "Saved. Send a test email to check it." });
    } catch (err) {
      setNotice({ variant: "error", message: platformErrorMessage(err, "The account could not be saved.") });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await Swal.fire({
      icon: "warning",
      title: collegeId ? "Remove this college's account?" : "Remove the platform default account?",
      text: collegeId
        ? view.defaultExists
          ? "The college's emails will then go out from the platform default account."
          : "There is no platform default: the college will not be able to send emails."
        : "Colleges without their own account will not be able to send emails.",
      showCancelButton: true,
      confirmButtonText: "Remove",
    });
    if (!ok.isConfirmed) return;
    setBusy(true);
    try {
      await platformService.deleteEmailAccount(collegeId);
      show(await platformService.getEmailAccount(collegeId));
      setNotice({ variant: "info", message: "Account removed." });
    } catch (err) {
      setNotice({ variant: "error", message: platformErrorMessage(err, "The account could not be removed.") });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const r = await platformService.sendTestEmail(collegeId, testTo);
      setNotice({ variant: r.sent ? "success" : "error", message: r.message });
    } catch (err) {
      setNotice({ variant: "error", message: platformErrorMessage(err, "The test email could not be sent.") });
    } finally {
      setBusy(false);
    }
  };

  const status = view.exists
    ? `Set up: ${view.username}${view.updatedAt ? ` (changed ${new Date(view.updatedAt).toLocaleDateString()})` : ""}.`
    : collegeId
      ? view.defaultExists
        ? "No own account: this college's emails go out from the platform default."
        : "No account and no platform default: this college cannot send emails."
      : "No default account: colleges without their own account cannot send emails.";

  return (
    <ComponentCard
      title={collegeId ? "Email sender" : "Default email sender"}
      desc={
        collegeId
          ? "The account this college's student emails (links, OTPs) are sent from. Leave it empty to use the platform default."
          : "Used by every college that has no account of its own."
      }
    >
      <p className={`flex items-center gap-2 text-sm ${view.exists || view.defaultExists ? "text-gray-700 dark:text-gray-300" : "text-warning-600 dark:text-orange-400"}`}>
        <Mail className="size-4 shrink-0" aria-hidden="true" /> {status}
      </p>
      {notice && <Alert variant={notice.variant} title="Email" message={notice.message} />}

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Sign-in (Gmail address)" type="email" placeholder="exams@gmail.com" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.trim() })} />
        <Input
          label="App password"
          type="password"
          placeholder={view.hasPassword ? "Saved (leave blank to keep)" : "16-letter app password"}
          hint="Google account > Security > 2-Step Verification > App passwords."
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Input label="Sender name" placeholder="VIVA Exam Office" maxLength={100} value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} />
        <Input
          label="Send from address"
          type="email"
          placeholder={form.username || "noreply@college.edu"}
          hint="Usually the same as the sign-in, or an alias added to it in Gmail."
          value={form.fromAddress}
          onChange={(e) => setForm({ ...form, fromAddress: e.target.value.trim() })}
        />
        <Input label="Mail server" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value.trim() })} />
        <div className="grid grid-cols-2 items-center gap-3">
          <Input label="Port" type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) || 0 })} />
          <Checkbox label="STARTTLS" checked={form.useStartTls} onChange={(v) => setForm({ ...form, useStartTls: v })} />
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-64">
            <Input label="Send a test to" type="email" placeholder="you@gmail.com" value={testTo} onChange={(e) => setTestTo(e.target.value.trim())} />
          </div>
          <Button variant="outline" onClick={test} disabled={busy || !testTo || (!view.exists && !(collegeId && view.defaultExists))} startIcon={<Send className="size-4" />}>
            Send test
          </Button>
        </div>
        <div className="flex gap-2">
          {view.exists && (
            <Button variant="danger" onClick={remove} disabled={busy} startIcon={<Trash2 className="size-4" />}>
              Remove
            </Button>
          )}
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save account"}
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
}
