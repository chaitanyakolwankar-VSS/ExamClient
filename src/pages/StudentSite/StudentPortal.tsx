import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router";
import { CheckCircle2, Lock, LogOut, Mail, Pencil, ShieldCheck, XCircle } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { StudentAccessService, studentReason, studentStore } from "../../services/StudentAccessService";
import type { LinkInfo, StudentHome } from "../../services/StudentAccessService";
import { FIELD_GROUPS } from "../../services/StudentLinksService";
import type { StudentField } from "../../services/StudentLinksService";

const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

/** /s/:token, the address in the email: keeps the token for this tab and moves to /student, so it leaves the address bar. */
export function StudentLinkEntry() {
  const { token } = useParams();
  if (token) {
    studentStore.clear();
    studentStore.setToken(token);
  }
  return <Navigate to="/student" replace />;
}

/** A centred card that reads well on a phone, which is where most students open the email. */
function Shell({ college, children }: { college?: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo/logo-icon.svg`} alt="" className="h-10 w-10" />
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{college || "GradeSphere"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Student details</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:p-7">{children}</div>
        <p className="mt-6 text-center text-xs text-gray-400">GradeSphere · VSS</p>
      </div>
    </div>
  );
}

function Notice({ icon, title, text, help }: { icon: React.ReactNode; title: string; text: string; help?: string | null }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.05]">{icon}</div>
      <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      {help && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          For help, contact{" "}
          <a className="text-brand-500 hover:underline" href={`mailto:${help}`}>
            {help}
          </a>
          .
        </p>
      )}
    </div>
  );
}

type Step = "loading" | "link" | "code" | "home" | "none";

/**
 * /student: the student's side of an emailed link. Opens the link (state only), emails a 6-digit code to the
 * address on record, checks it and then shows the student's details for this one task. The session is this tab's
 * only; closing the tab or signing out ends it.
 */
export default function StudentPortal() {
  const [step, setStep] = useState<Step>("loading");
  const [info, setInfo] = useState<LinkInfo | null>(null);
  const [home, setHome] = useState<StudentHome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const openLink = useCallback(async (message?: string) => {
    const token = studentStore.token();
    if (!token) {
      setStep("none");
      return;
    }
    try {
      setInfo(await StudentAccessService.open(token));
      setNotice(message ?? null);
      setStep("link");
    } catch (err) {
      setError(studentReason(err, "The link could not be opened. Check your connection and try again."));
      setStep("link");
    }
  }, []);

  const loadHome = useCallback(async () => {
    try {
      setHome(await StudentAccessService.me());
      setStep("home");
    } catch {
      studentStore.setSession(null);
      await openLink("Your session ended. Ask for a new code to continue.");
    }
  }, [openLink]);

  useEffect(() => {
    if (studentStore.session()) loadHome();
    else openLink();
  }, [loadHome, openLink]);

  const sendCode = async () => {
    const token = studentStore.token();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const sent = await StudentAccessService.sendCode(token);
      setNotice(sent.message);
      setStep("code");
      setCode("");
      setWait(60);
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (err) {
      setError(studentReason(err, "The code could not be sent. Try again in a minute."));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = studentStore.token();
    if (!token) return;
    if (code.length !== 6) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const signedIn = await StudentAccessService.verify(token, code);
      studentStore.setSession(signedIn.sessionToken);
      await loadHome();
    } catch (err) {
      setError(studentReason(err, "The code could not be checked. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await StudentAccessService.signOut();
    } catch {
      /* the session is dropped here either way */
    }
    studentStore.setSession(null);
    setHome(null);
    await openLink("You've signed out.");
  };

  if (step === "loading")
    return (
      <Shell>
        <p className="py-8 text-center text-sm text-gray-500">Opening…</p>
      </Shell>
    );

  if (step === "none")
    return (
      <Shell>
        <Notice icon={<Mail className="size-6 text-gray-500" />} title="Open the link from your email" text="Use the link your college emailed you. It opens your details after a quick check." />
      </Shell>
    );

  if (step === "home" && home) return <Home home={home} onSignOut={signOut} />;

  if (!info)
    return (
      <Shell>
        <Notice icon={<XCircle className="size-6 text-error-500" />} title="Something went wrong" text={error ?? "Try again in a moment."} />
      </Shell>
    );

  if (info.state === "invalid")
    return (
      <Shell>
        <Notice icon={<XCircle className="size-6 text-error-500" />} title="Link not recognised" text={info.message} />
      </Shell>
    );

  if (info.state === "closed")
    return (
      <Shell college={info.college}>
        <Notice
          icon={info.updatedAt ? <CheckCircle2 className="size-6 text-success-500" /> : <Lock className="size-6 text-gray-500" />}
          title={info.updatedAt ? "All done" : "This link is closed"}
          text={info.message}
          help={info.helpEmail}
        />
      </Shell>
    );

  return (
    <Shell college={info.college}>
      <PageMeta title={`${info.college ?? "GradeSphere"} | Student details`} description="Check your student details" />
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Hi {info.firstName || "there"},</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {info.college} asks you to {(info.taskName ?? "check your details").toLowerCase()}. The link works until <b className="font-medium text-gray-800 dark:text-white/90">{day(info.deadline)}</b>.
      </p>
      {info.updatedAt && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700 dark:bg-success-500/15 dark:text-success-400">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> You updated your details on {day(info.updatedAt)}. You can still change them until {day(info.deadline)}.
        </p>
      )}
      {notice && <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-white/[0.04] dark:text-gray-300">{notice}</p>}

      {step === "link" && (
        <div className="mt-5 space-y-3">
          <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <ShieldCheck className="size-4 text-brand-500" /> To confirm it's you, we'll email a 6-digit code to <b className="font-medium text-gray-800 dark:text-white/90">{info.maskedEmail}</b>.
          </p>
          <Button className="w-full" onClick={sendCode} disabled={busy}>
            {busy ? "Sending…" : "Email me a code"}
          </Button>
        </div>
      )}

      {step === "code" && (
        <form className="mt-5 space-y-3" onSubmit={verify}>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Code from the email
          </label>
          <input
            id="otp"
            ref={codeRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            placeholder="123456"
            className="h-12 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-center text-2xl tracking-[0.5em] text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
          />
          <Button className="w-full" disabled={busy}>
            {busy ? "Checking…" : "Continue"}
          </Button>
          <button type="button" onClick={sendCode} disabled={busy || wait > 0} className="w-full text-center text-sm text-brand-500 hover:underline disabled:text-gray-400 disabled:no-underline">
            {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
    </Shell>
  );
}

const VALUE: Record<StudentField, (s: StudentHome["student"]) => string> = {
  firstName: (s) => s.firstName ?? "",
  middleName: (s) => s.middleName ?? "",
  lastName: (s) => s.lastName ?? "",
  motherName: (s) => s.motherName ?? "",
  dateOfBirth: (s) => day(s.dateOfBirth),
  gender: (s) => s.gender ?? "",
  category: (s) => s.category ?? "",
  phone: (s) => s.phone ?? "",
  address: (s) => s.address ?? "",
  prn: (s) => s.prn ?? "",
  photo: (s) => (s.hasPhoto ? "Uploaded" : "Not uploaded"),
  signature: (s) => (s.hasSignature ? "Uploaded" : "Not uploaded"),
};

function Home({ home, onSignOut }: { home: StudentHome; onSignOut: () => void }) {
  const s = home.student;
  const editable = new Set(home.editableFields);
  const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
  return (
    <Shell college={home.college}>
      <PageMeta title={`${home.college} | My details`} description="Your student details" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{name || "Your details"}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Student ID {s.studentId}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onSignOut} startIcon={<LogOut className="size-4" />}>
          Sign out
        </Button>
      </div>

      <p
        className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
          home.updatedAt ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400" : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
        }`}
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        {home.updatedAt
          ? `Your details were updated on ${day(home.updatedAt)}. You can change them until ${day(home.deadline)}.`
          : `Check your details below. This page is open until ${day(home.deadline)}.`}
      </p>

      <div className="mt-5 space-y-5">
        {FIELD_GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{g.title}</h2>
            <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {g.fields.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <dt className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    {editable.has(f.key) ? <Pencil className="size-3.5 text-brand-500" aria-label="You can change this" /> : <Lock className="size-3.5" aria-label="Locked" />}
                    {f.label}
                  </dt>
                  <dd className="text-right text-gray-800 dark:text-white/90">{VALUE[f.key](s) || <span className="text-gray-400">—</span>}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</h2>
          <p className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 dark:border-gray-800 dark:text-white/90">
            <Lock className="size-3.5 text-gray-500" aria-label="Locked" /> {s.email}
          </p>
        </section>
      </div>

      <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
        <Pencil className="mr-1 inline size-3 text-brand-500" /> fields can be changed; <Lock className="mx-1 inline size-3" /> fields are locked. Changing them opens here soon.
        {home.helpEmail && (
          <>
            {" "}
            Something wrong in a locked field? Contact{" "}
            <a className="text-brand-500 hover:underline" href={`mailto:${home.helpEmail}`}>
              {home.helpEmail}
            </a>
            .
          </>
        )}
      </p>
    </Shell>
  );
}
