import { useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import apiClient from "../../api/Client";

export default function SignIn() {
  // Wake the API now (public health check, no data): if IIS had stopped it, it starts while the user types.
  useEffect(() => {
    apiClient.get("/health").catch(() => {});
  }, []);

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
