import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import { CheckCircle2, Lock, LogOut, Mail, XCircle } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  StudentAccessService,
  studentReason,
  studentStore,
} from "../../services/StudentAccessService";
import type {
  LinkInfo,
  StudentHome,
} from "../../services/StudentAccessService";
import StudentDetailsForm from "./StudentDetailsForm";
import StudentHallTicket from "./StudentHallTicket";
import StudentMarksheet from "./StudentMarksheet";
import { day } from "./format";

/**
 * The address in the email, /s#token (the part after "#" never reaches the server, so the token stays out of its
 * logs; links sent earlier as /s/:token still work): keeps the token for this tab and moves to /student, so it
 * leaves the address bar.
 */
export function StudentLinkEntry() {
  const params = useParams();
  const token = params.token || window.location.hash.replace(/^#/, "");
  if (token) {
    studentStore.clear();
    studentStore.setToken(token);
  }
  return <Navigate to="/student" replace />;
}

/** The page frame: college name on top, one centred column that reads well on a phone (where most students open the email). */
export function Shell({
  college,
  wide,
  action,
  children,
}: {
  college?: string | null;
  wide?: boolean | "page";
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const width = wide === "page" ? "max-w-4xl" : wide ? "max-w-lg" : "max-w-sm";
  return (
    <div className="student-site min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur print:hidden">
        <div className={`mx-auto flex h-14 items-center gap-3 px-4 ${width}`}>
          <img
            src={`${import.meta.env.BASE_URL}images/logo/logo-icon.svg`}
            alt=""
            className="size-7"
          />
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            {college || "GradeSphere"}
          </p>
          {action}
        </div>
      </header>
      <main className={`mx-auto px-4 ${wide ? "py-5" : "py-12"} ${width}`}>
        {children}
      </main>
    </div>
  );
}

/** A full-stop page: invalid, closed or finished link. */
function Notice({
  tone,
  title,
  text,
  help,
}: {
  tone: "ok" | "closed" | "bad" | "mail";
  title: string;
  text: string;
  help?: string | null;
}) {
  const icon = {
    ok: <CheckCircle2 className="size-7 text-success-500" />,
    closed: <Lock className="size-6 text-muted-foreground" />,
    bad: <XCircle className="size-7 text-destructive" />,
    mail: <Mail className="size-6 text-primary" />,
  }[tone];
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="mb-1 flex size-14 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{text}</p>
      {help && (
        <a
          className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          href={`mailto:${help}`}
        >
          {help}
        </a>
      )}
    </div>
  );
}

/** A small ID card, the same shape the details page opens with. */
function CardMark() {
  return (
    <div
      aria-hidden
      className="mb-6 flex h-12 w-18 gap-1.5 rounded-lg bg-primary p-2 shadow-md shadow-primary/25"
    >
      <span className="h-full w-5 rounded-sm bg-primary-foreground/80" />
      <span className="flex flex-1 flex-col gap-1 pt-0.5">
        <span className="h-1.5 w-full rounded-full bg-primary-foreground/80" />
        <span className="h-1.5 w-2/3 rounded-full bg-primary-foreground/50" />
        <span className="mt-auto h-2.5 w-full rounded-sm bg-white" />
      </span>
    </div>
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
      setError(
        studentReason(
          err,
          "The link could not be opened. Check your connection and try again.",
        ),
      );
      setStep("link");
    }
  }, []);

  const loadHome = useCallback(async () => {
    try {
      setHome(await StudentAccessService.me());
      setStep("home");
    } catch {
      studentStore.setSession(null);
      await openLink("Your session ended. Get a new code to continue.");
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
      await StudentAccessService.sendCode(token);
      setNotice(null);
      setStep("code");
      setCode("");
      setWait(60);
    } catch (err) {
      setError(
        studentReason(
          err,
          "The code could not be sent. Try again in a minute.",
        ),
      );
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
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-11 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </Shell>
    );

  if (step === "none")
    return (
      <Shell>
        <Notice
          tone="mail"
          title="Open the link from your email"
          text="Your college emails you a link. It brings you here."
        />
      </Shell>
    );

  if (step === "home" && home)
    return (
      <Shell
        college={home.college}
        wide={
          home.taskType === "HALL_TICKET" || home.taskType === "MARKSHEET"
            ? "page"
            : true
        }
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="-mr-2 shrink-0 text-muted-foreground"
          >
            <LogOut /> Sign out
          </Button>
        }
      >
        <PageMeta
          title={`${home.college} | ${
            home.taskType === "HALL_TICKET"
              ? "Hall ticket"
              : home.taskType === "MARKSHEET"
                ? "Marksheet"
                : "My details"
          }`}
          description="Your student details"
        />
        {home.taskType === "HALL_TICKET" ? (
          <StudentHallTicket home={home} onEnded={loadHome} />
        ) : home.taskType === "MARKSHEET" ? (
          <StudentMarksheet home={home} onEnded={loadHome} />
        ) : (
          <StudentDetailsForm
            home={home}
            onHome={setHome}
            onEnded={loadHome}
          />
        )}
      </Shell>
    );

  if (!info)
    return (
      <Shell>
        <Notice
          tone="bad"
          title="Something went wrong"
          text={error ?? "Try again in a moment."}
        />
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
        <Notice
          tone={info.updatedAt ? "ok" : "closed"}
          title={info.updatedAt ? "All done" : "This link is closed"}
          text={info.message}
          help={info.helpEmail}
        />
      </Shell>
    );

  const task = info.taskName || "Check your details";
  return (
    <Shell college={info.college}>
      <PageMeta
        title={`${info.college ?? "GradeSphere"} | ${
          info.taskType === "HALL_TICKET"
            ? "Hall ticket"
            : info.taskType === "MARKSHEET"
              ? "Marksheet"
              : "Student details"
        }`}
        description={
          info.taskType === "HALL_TICKET" || info.taskType === "MARKSHEET"
            ? "Download it with your one-time code"
            : "Check your student details"
        }
      />
      <div className="flex flex-col items-center text-center">
        <CardMark />
        {step === "link" ? (
          <>
            <h1 className="text-2xl font-semibold">
              Hi {info.firstName || "there"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {info.taskType === "HALL_TICKET"
                ? `Your hall ticket is ready. The link works until ${day(info.deadline)}.`
                : info.taskType === "MARKSHEET"
                  ? `Your marksheet is ready. The link works until ${day(info.deadline)}.`
                  : `${task} by ${day(info.deadline)}.`}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Enter the code</h1>
            <p className="mt-2 text-muted-foreground">
              Sent to {info.maskedEmail}
            </p>
          </>
        )}

        {info.updatedAt && step === "link" && info.taskType === "STUDENT_MASTER" && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-success-600 dark:text-success-400">
            <CheckCircle2 className="size-4" /> Saved on {day(info.updatedAt)}.
            You can still edit.
          </p>
        )}
        {notice && (
          <p className="mt-4 text-sm text-muted-foreground">{notice}</p>
        )}

        {step === "link" && (
          <div className="mt-8 w-full">
            <Button
              size="lg"
              className="h-12 w-full text-base"
              onClick={sendCode}
              disabled={busy}
            >
              {busy ? "Sending…" : "Email me a code"}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              It goes to {info.maskedEmail}
            </p>
          </div>
        )}

        {step === "code" && (
          <form
            className="mt-8 flex w-full flex-col items-center"
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
          >
            <InputOTP
              maxLength={6}
              value={code}
              autoFocus
              inputMode="numeric"
              pattern="^[0-9]*$"
              disabled={busy}
              aria-label="Code from the email"
              onChange={(v) => {
                setCode(v);
                setError(null);
                if (v.length === 6) verify(v);
              }}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-13 w-11 rounded-lg border text-xl font-medium"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button
              size="lg"
              className="mt-8 h-12 w-full text-base"
              disabled={busy || code.length !== 6}
            >
              {busy ? "Checking…" : "Continue"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 text-muted-foreground"
              onClick={sendCode}
              disabled={busy || wait > 0}
            >
              {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
            </Button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </Shell>
  );
}
