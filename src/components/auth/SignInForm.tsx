import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeClosed, AlertCircle, Loader2 } from "lucide-react";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { authService } from "../../services/authService";
import { AxiosError } from "axios";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // CALL THE  API
      const data = await authService.login({
        username: email,
        password: password,
      });

      const userForContext = {
        id: data.user.userId,
        name: data.user.username,
        email: data.user.email,
        role: data.user.role,
        avatar: "/images/user/owner.png",
      };

      // UPDATE GLOBAL STATE
      login(data.token, userForContext);
      navigate("/staff/dashboard");
    } catch (err) {
      const error = err as AxiosError;

      console.error("Login failed", error);

      if (error.response && error.response.status === 401) {
        setError("Invalid username or password");
      } else {
        setError(`Server error occurred. Please try again later.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const variants: Variants = {
    initial: (isOpen: boolean) => ({
      y: isOpen ? 5 : -5,
      opacity: 0,
      scale: 0.8,
    }),
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
    exit: (isOpen: boolean) => ({
      y: isOpen ? -5 : 5,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.15 },
    }),
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your Email/Username and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleLogin}>
              <div className="space-y-6">
                {/* SHOW ERROR MESSAGE IF ANY */}
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div>
                  <Input
                    label="Email/Username"
                    placeholder="admin"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 flex items-center justify-center w-6 h-6"
                    >
                      {/* mode="wait" ensures the exit finishes before the entry starts */}
                      {/* custom={showPassword} passes the state to our variants */}
                      <AnimatePresence
                        mode="wait"
                        initial={false}
                        custom={showPassword}
                      >
                        <motion.div
                          key={showPassword ? "open" : "closed"}
                          custom={showPassword}
                          variants={variants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {showPassword ? (
                            <Eye className="text-gray-500 dark:text-gray-400 size-5" />
                          ) : (
                            <EyeClosed className="text-gray-500 dark:text-gray-400 size-5" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
