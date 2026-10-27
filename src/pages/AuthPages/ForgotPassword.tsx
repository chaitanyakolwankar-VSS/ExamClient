import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { PasswordResetService } from "../../services/PasswordResetService";

const reason = (err: unknown, fallback: string) => {
  const e = err as { response?: { status?: number; data?: { message?: string } } };
  if (e?.response?.status === 429) return "Too many attempts. Wait a few minutes and try again.";
  return e?.response?.data?.message || fallback;
};

/**
 * /reset-password, from "Forgot password?" on the sign-in page: email -> a 6-digit code to that email -> new
 * password. The first step answers the same whether or not the email has an account.
 */
export default function ForgotPassword() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.trim())) {
      setError("Enter the email you sign in with.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setInfo(await PasswordResetService.sendCode(email.trim()));
      setStep("code");
      setWait(60);
    } catch (err) {
      setError(reason(err, "The code could not be sent. Try again in a minute."));
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code from the email.");
    if (password.length < 8) return setError("Use at least 8 characters for the new password.");
    if (password !== confirm) return setError("The two passwords are not the same.");
    setBusy(true);
    setError(null);
    try {
      setInfo(await PasswordResetService.reset(email.trim(), code.trim(), password));
      setStep("done");
    } catch (err) {
      setError(reason(err, "The password could not be changed. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageMeta title="GradeSphere | Forgot password" description="Reset your GradeSphere password" />
      <AuthLayout>
        <div className="mb-6">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">Forgot password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {step === "email" && "Enter the email you sign in with. We'll send a 6-digit code to it."}
            {step === "code" && "Enter the code from the email and choose a new password."}
            {step === "done" && "All set."}
          </p>
        </div>

        {info && step !== "email" && (
          <p className="mb-4 flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700 dark:bg-success-500/15 dark:text-success-400">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {info}
          </p>
        )}

        {step === "email" && (
          <form onSubmit={send} className="space-y-5">
            <Input type="email" label="Email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button className="w-full" size="sm" disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {busy ? "Sending…" : "Send code"}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={reset} className="space-y-5">
            <Input label="Code from the email" placeholder="123456" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            <Input type="password" label="New password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input type="password" label="New password again" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button className="w-full" size="sm" disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {busy ? "Saving…" : "Change password"}
            </Button>
            <button type="button" onClick={() => send()} disabled={busy || wait > 0} className="w-full text-center text-sm text-brand-500 hover:underline disabled:text-gray-400 disabled:no-underline">
              {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
            </button>
          </form>
        )}

        {step === "done" && (
          <Link to="/signin" className="block">
            <Button className="w-full" size="sm">
              Go to sign in
            </Button>
          </Link>
        )}

        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-error-600 dark:text-error-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}

        {step !== "done" && (
          <Link to="/signin" className="mt-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400">
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        )}
      </AuthLayout>
    </>
  );
}
