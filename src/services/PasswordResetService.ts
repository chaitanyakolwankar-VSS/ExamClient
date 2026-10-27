import axios from "axios";

/** Sign-in page "Forgot password" (api/SendResetOtp/by-email): no staff token, no sign-in redirect. */
const client = axios.create({
  baseURL: import.meta.env.DEV ? "https://localhost:7225/api" : `${(import.meta.env.VITE_API_BASE || "/ExamAPI").replace(/\/+$/, "")}/api`,
  headers: { "Content-Type": "application/json" },
});

export const PasswordResetService = {
  /** Answers the same sentence whether or not the email has an account. */
  async sendCode(email: string): Promise<string> {
    return (await client.post<{ message: string }>("/SendResetOtp/by-email/send", { email })).data.message;
  },
  async reset(email: string, otp: string, newPassword: string): Promise<string> {
    return (await client.post<{ message: string }>("/SendResetOtp/by-email/reset", { email, otp, newPassword })).data.message;
  },
};
