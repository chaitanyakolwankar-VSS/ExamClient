import { useState, useEffect } from "react";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import { Modal } from "../../../components/ui/modal";

type PasswordTab = "remember" | "forgot";
type ForgotStep = "send-otp" | "verify-otp" | "new-password";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const BASE_URL = "https://localhost:7225/api";

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  userId,
}: ResetPasswordModalProps) => {
  const [activeTab, setActiveTab] = useState<PasswordTab>("remember");

  // ── Remember password states ──────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  // ── Forgot password states ────────────────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>("send-otp");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Clear stale email when modal reopens for a different user
  useEffect(() => {
    if (!isOpen) return;
    setEmployeeEmail("");
  }, [isOpen]);

  // Fetch email when switching to forgot tab
  useEffect(() => {
    if (activeTab === "forgot" && isOpen && !employeeEmail) {
      fetchEmployeeEmail();
    }
  }, [activeTab, isOpen, employeeEmail]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ── Reset all state on close ──────────────────────────
  const resetAllStates = () => {
    setActiveTab("remember");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setChangeError("");
    setForgotStep("send-otp");
    setEmployeeEmail("");
    setOtp("");
    setOtpVerified(false);
    setOtpError("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotPasswordError("");
    setResendTimer(0);
  };

  const handleClose = () => {
    resetAllStates();
    onClose();
  };

  // ── GET api/UserMaster/GetAll/{id} ────────────────────
  const fetchEmployeeEmail = async () => {
    setEmailLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/UserMaster/GetAll/${userId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployeeEmail(data.email);
    } catch {
      setEmployeeEmail("Failed to load email.");
    } finally {
      setEmailLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes("@")) return email;
    const [user, domain] = email.split("@");
    if (user.length <= 2) return "*".repeat(user.length) + "@" + domain;
    return (
      user[0] +
      "*".repeat(user.length - 2) +
      user[user.length - 1] +
      "@" +
      domain
    );
  };

  // ── POST api/UserMaster/ChangePassword ────────────────
  const handleChangePassword = async () => {
    setChangeError("");

    if (!currentPassword) {
      setChangeError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setChangeError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangeError("Passwords do not match.");
      return;
    }

    setChangeLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/UserMaster/ChangePassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setChangeError(err.message || "Current password is incorrect.");
        return;
      }
      handleClose();
    } catch {
      setChangeError("Something went wrong. Please try again.");
    } finally {
      setChangeLoading(false);
    }
  };

  // ── POST api/SendResetOtp/send-reset-otp ──────────────
  const handleSendOtp = async () => {
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/SendResetOtp/send-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: userId }),
      });

      if (!res.ok) throw new Error();
      setForgotStep("verify-otp");
      setResendTimer(30);
    } catch {
      setOtpError("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp("");
    setOtpError("");
    await handleSendOtp();
  };

  // ── POST api/SendResetOtp/verify-otp-only ─────────────
  // Only verifies OTP — does NOT reset password
  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/SendResetOtp/verify-otp-only`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: userId,
          otp: otp,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setOtpError(err.message || "Invalid OTP. Please try again.");
        return;
      }

      setOtpVerified(true);
      setForgotStep("new-password");
    } catch {
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleForgotResetPassword = async () => {
    setForgotPasswordError("");

    if (!otpVerified) {
      setForgotPasswordError("Please verify your OTP first.");
      return;
    }
    if (forgotNewPassword.length < 8) {
      setForgotPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotPasswordError("Passwords do not match.");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/SendResetOtp/VerifyOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: userId,
          otp: otp,
          newPassword: forgotNewPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setForgotPasswordError(err.message || "Failed to reset password.");
        return;
      }

      handleClose();
    } catch {
      setForgotPasswordError("Something went wrong. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const getStepNumber = () => {
    if (activeTab === "remember") return null;
    if (forgotStep === "send-otp") return 1;
    if (forgotStep === "verify-otp") return 2;
    if (forgotStep === "new-password") return 3;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Reset Password</h2>
        {activeTab === "forgot" && (
          <span className="text-xs text-gray-400">
            Step {getStepNumber()} of 3
          </span>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "remember"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("remember")}
        >
          Remember Password
        </button>
        <button
          className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "forgot"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("forgot")}
        >
          Forgot Password
        </button>
      </div>

      {/* ── Remember Password Tab ── */}
      {activeTab === "remember" && (
        <div className="flex flex-col gap-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />

          {changeError && <p className="text-sm text-red-500">{changeError}</p>}

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={changeLoading}>
              {changeLoading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Forgot Password Tab ── */}
      {activeTab === "forgot" && (
        <div className="flex flex-col gap-4">
          {/* Step 1 — Show registered email + Send OTP */}
          {forgotStep === "send-otp" && (
            <>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  OTP will be sent to
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-gray-50">
                  {emailLoading ? (
                    <span className="text-sm text-gray-400">
                      Fetching email...
                    </span>
                  ) : (
                    <span className="text-sm text-gray-700 flex-1">
                      {maskEmail(employeeEmail)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  This is your registered email. Contact your admin if it's
                  incorrect.
                </p>
              </div>

              {otpError && <p className="text-sm text-red-500">{otpError}</p>}

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendOtp}
                  disabled={otpLoading || emailLoading}
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </Button>
              </div>
            </>
          )}

          {/* Step 2 — Enter OTP and verify */}
          {forgotStep === "verify-otp" && (
            <>
              <p className="text-sm text-gray-500">
                Enter the 6-digit OTP sent to{" "}
                <span className="font-medium text-gray-800">
                  {maskEmail(employeeEmail)}
                </span>
              </p>

              <Input
                label="Enter OTP"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6-digit OTP"
              />

              {otpError && <p className="text-sm text-red-500">{otpError}</p>}

              <div className="text-sm text-gray-500 text-center">
                {resendTimer > 0 ? (
                  <span>Resend OTP in {resendTimer}s</span>
                ) : (
                  <button
                    className="text-blue-500 underline text-sm"
                    onClick={handleResendOtp}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleVerifyOtp} disabled={otpLoading}>
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
            </>
          )}

          {/* Step 3 — Set new password (only reachable after OTP verified) */}
          {forgotStep === "new-password" && otpVerified && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-green-200 bg-green-50">
                <span className="text-green-600 text-sm">
                  ✓ OTP verified successfully
                </span>
              </div>

              <Input
                label="New Password"
                type="password"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />

              {forgotPasswordError && (
                <p className="text-sm text-red-500">{forgotPasswordError}</p>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleForgotResetPassword}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? "Saving..." : "Reset Password"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};
