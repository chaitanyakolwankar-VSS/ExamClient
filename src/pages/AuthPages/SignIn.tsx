import { useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  // While the user types, download the dashboard's code in the background (only code, no data and no
  // login needed), so it opens straight after sign-in. A failed download is harmless: it is retried on open.
  useEffect(() => {
    const timer = setTimeout(() => {
      import("../Staff/Dashboard/Home").catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PageMeta
        title="GradeSphere | SignIn"
        description="GradeSphere | SignIn"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
