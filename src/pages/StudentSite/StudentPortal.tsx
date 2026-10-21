import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import { CheckCircle2, Clock, Lock, LogOut, Mail, ShieldCheck, XCircle } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { StudentAccessService, studentReason, studentStore } from "../../services/StudentAccessService";
import type { LinkInfo, StudentHome } from "../../services/StudentAccessService";
import StudentDetailsForm from "./StudentDetailsForm";

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

/** The page frame: college name on top, one column that reads well on a phone (where most students open the email). */
export function Shell({ college, wide, children }: { college?: string | null; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="student-site min-h-screen bg-muted/40 text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className={`mx-auto flex h-14 items-center gap-3 px-4 ${wide ? "max-w-3xl" : "max-w-md"}`}>
          <img src={`${import.meta.env.BASE_URL}images/logo/logo-icon.svg`} alt="" className="size-8" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{college || "GradeSphere"}</p>
            <p className="text-xs text-muted-foreground">Student details</p>
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 py-6 sm:py-10 ${wide ? "max-w-3xl" : "max-w-md"}`}>{children}</main>
    </div>
  );
}

/** Where the student is in the sign-in: 1 open, 2 code, 3 details. */
function Steps({ at }: { at: 1 | 2 | 3 }) {
  const steps = ["Your link", "Email code", "Your details"];
  return (
    <ol className="mb-5 flex items-center gap-2 text-xs" aria-label="Steps">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < at;
        const current = n === at;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                done ? "bg-primary text-primary-foreground" : current ? "bg-primary/15 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground"
              }`}
              aria-current={current ? "step" : undefined}
            >
              {done ? <CheckCircle2 className="size-3.5" /> : n}
            </span>
            <span className={`hidden truncate sm:inline ${current ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {i < steps.length - 1 && <span className={`h-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function Notice({ tone, title, text, help }: { tone: "ok" | "closed" | "bad" | "mail"; title: string; text: string; help?: string | null }) {
  const icon = {
    ok: <CheckCircle2 className="size-7 text-success-500" />,
    closed: <Lock className="size-7 text-muted-foreground" />,
    bad: <XCircle className="size-7 text-destructive" />,
    mail: <Mail className="size-7 text-primary" />,
  }[tone];
  return (
    <Card className="text-center">
      <CardContent className="flex flex-col items-center gap-3 py-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">{icon}</div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{text}</p>
        {help && (
          <p className="text-sm text-muted-foreground">
            For help, contact{" "}
            <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${help}`}>
              {help}
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type Step = "loading" | "link" | "code" | "home" | "none";

/**
 * /student: the student's side of an emailed link. Opens the link (state only), emails a 6-digit code to the
 * address on record, checks it, then shows the details form for this one task. The session is this tab's only;
 * closing the tab or signing out ends it.
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
    } catch (err) {
      setError(studentReason(err, "The code could not be sent. Try again in a minute."));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    const token = studentStore.token();
    if (!token || busy) return;
    if (value.length !== 6) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const signedIn = await StudentAccessService.verify(token, value);
      studentStore.setSession(signedIn.sessionToken);
      await loadHome();
    } catch (err) {
      setError(studentReason(err, "The code could not be checked. Try again."));
      setCode("");
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
        <Card>
          <CardContent className="space-y-3 py-6">
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
      </Shell>
    );

  if (step === "none")
    return (
      <Shell>
        <Notice tone="mail" title="Open the link from your email" text="Use the link your college emailed you. It opens your details after a quick check." />
      </Shell>
    );

  if (step === "home" && home)
    return (
      <Shell college={home.college} wide>
        <PageMeta title={`${home.college} | My details`} description="Your student details" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <Steps at={3} />
          <Button variant="ghost" size="sm" onClick={signOut} className="mb-5 shrink-0">
            <LogOut /> Sign out
          </Button>
        </div>
        <StudentDetailsForm home={home} onHome={setHome} onEnded={() => loadHome()} />
      </Shell>
    );

  if (!info)
    return (
      <Shell>
        <Notice tone="bad" title="Something went wrong" text={error ?? "Try again in a moment."} />
      </Shell>
    );

  if (info.state === "invalid")
    return (
      <Shell>
        <Notice tone="bad" title="Link not recognised" text={info.message} />
      </Shell>
    );

  if (info.state === "closed")
    return (
      <Shell college={info.college}>
        <Notice tone={info.updatedAt ? "ok" : "closed"} title={info.updatedAt ? "All done" : "This link is closed"} text={info.message} help={info.helpEmail} />
      </Shell>
    );

  return (
    <Shell college={info.college}>
      <PageMeta title={`${info.college ?? "GradeSphere"} | Student details`} description="Check your student details" />
      <Steps at={step === "code" ? 2 : 1} />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Hi {info.firstName || "there"},</CardTitle>
          <CardDescription>
            {info.college} asks you to {(info.taskName ?? "check your details").toLowerCase()}.
          </CardDescription>
          <div className="pt-1">
            <Badge variant="secondary" className="gap-1">
              <Clock className="size-3" /> Open until {day(info.deadline)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {info.updatedAt && (
            <p className="flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700 dark:bg-success-500/15 dark:text-success-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> You updated your details on {day(info.updatedAt)}. You can still change them until {day(info.deadline)}.
            </p>
          )}
          {notice && <p className="rounded-lg bg-muted px-3 py-2 text-sm">{notice}</p>}

          {step === "link" && (
            <>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  To confirm it's you, we'll email a 6-digit code to <b className="font-medium text-foreground">{info.maskedEmail}</b>.
                </span>
              </p>
              <Button size="lg" className="h-11 w-full text-base" onClick={sendCode} disabled={busy}>
                {busy ? "Sending…" : "Email me a code"}
              </Button>
            </>
          )}

          {step === "code" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
            >
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-medium">
                  Code from the email
                </label>
                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={code}
                  autoFocus
                  inputMode="numeric"
                  pattern="^[0-9]*$"
                  disabled={busy}
                  onChange={(v) => {
                    setCode(v);
                    setError(null);
                    if (v.length === 6) verify(v);
                  }}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="size-12 text-xl" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button size="lg" className="h-11 w-full text-base" disabled={busy || code.length !== 6}>
                {busy ? "Checking…" : "Continue"}
              </Button>
              <Button type="button" variant="link" className="w-full" onClick={sendCode} disabled={busy || wait > 0}>
                {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
              </Button>
            </form>
          )}

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <XCircle className="mt-0.5 size-4 shrink-0" /> {error}
            </p>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}
