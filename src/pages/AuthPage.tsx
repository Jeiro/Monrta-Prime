import React, { useState } from "react";
import { useSignUp, useSignIn } from "@clerk/clerk-react";
import { useApp } from "../context/AppContext";
import { useSupabaseClient, createUserProfile, createFreshAuthedClient } from "../lib/supabase";
import {
  Mail, Lock, User, CheckCircle2, Phone, ChevronDown,
  Eye, EyeOff, Check, X, ArrowRight, ArrowLeft,
  ShieldCheck, Zap, Clock,
} from "lucide-react";

interface AuthPageProps {
  onNavigate: (view: string) => void;
  initialTab?: "login" | "register";
}

type FieldState = "idle" | "ok" | "err";

/* ---------- Presentational field primitives (module scope = stable identity,
   so inputs never remount / lose focus on re-render) ---------- */

const stateBorder = (state: FieldState) =>
  state === "ok"
    ? "border-positive/55"
    : state === "err"
      ? "border-negative/60"
      : "border-line/85 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15";

interface TextInputProps {
  icon?: React.ComponentType<{ size?: number }>;
  label: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "email" | "tel";
  state?: FieldState;
  hint?: string | null;
  password?: boolean;
  rightLabel?: React.ReactNode;
}

const TextInput: React.FC<TextInputProps> = ({
  icon: Icon, label, required, value, onChange, placeholder,
  type = "text", inputMode, state = "idle", hint, password = false, rightLabel,
}) => {
  const [show, setShow] = useState(false);
  const actualType = password ? (show ? "text" : "password") : type;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-2xs uppercase font-subheading tracking-wider text-muted">
          {label}{required && <span className="text-accent ml-0.5">*</span>}
        </label>
        {rightLabel}
      </div>
      <div className={`relative flex items-center rounded-xl bg-ground border transition-all duration-150 ${stateBorder(state)}`}>
        {Icon && (
          <span className="absolute left-3.5 text-faint pointer-events-none">
            <Icon size={15} />
          </span>
        )}
        <input
          type={actualType}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-transparent rounded-xl py-3 text-ink outline-none placeholder:text-faint font-sans ${Icon ? "pl-10" : "pl-4"} pr-10`}
        />
        {password ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 text-faint hover:text-accent cursor-pointer bg-transparent border-none outline-none"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        ) : state === "ok" ? (
          <span className="absolute right-3 text-positive pointer-events-none"><Check size={16} /></span>
        ) : state === "err" ? (
          <span className="absolute right-3 text-negative pointer-events-none"><X size={16} /></span>
        ) : null}
      </div>
      {hint && (
        <p className={`text-2xs leading-tight ${state === "err" ? "text-negative" : "text-positive"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

interface SelectInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  state?: FieldState;
  children: React.ReactNode;
}

const SelectInput: React.FC<SelectInputProps> = ({ label, required, value, onChange, state = "idle", children }) => (
  <div className="space-y-1.5">
    <label className="text-2xs uppercase font-subheading tracking-wider text-muted block">
      {label}{required && <span className="text-accent ml-0.5">*</span>}
    </label>
    <div className={`relative flex items-center rounded-xl bg-ground border transition-all duration-150 ${stateBorder(state)}`}>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-transparent rounded-xl px-4 py-3 text-ink cursor-pointer outline-none appearance-none font-sans [&>option]:bg-surface [&>option]:text-ink"
      >
        {children}
      </select>
      <span className="absolute right-3 text-faint pointer-events-none">
        <ChevronDown size={14} />
      </span>
    </div>
  </div>
);

/* ---------- Password strength (pure client-side, no deps) ---------- */

const passwordStrength = (pw: string): { score: number; label: string } => {
  if (!pw) return { score: 0, label: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return { score: s, label: ["", "Weak", "Fair", "Good", "Strong"][s] };
};

const pwBarColor = (i: number, score: number) => {
  if (i > score) return "bg-line";
  return ["", "bg-negative", "bg-accent", "bg-yellow-400", "bg-positive"][score];
};
const pwTextColor = (score: number) =>
  ["text-muted", "text-negative", "text-accent", "text-yellow-400", "text-positive"][score];

/* Google mark — brand-tinted so it reads as a secondary path, not a rival CTA */
const GoogleMark = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.3-4.53-3.85-5.63z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GoogleButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full py-3.5 px-4 rounded-xl border border-line/90 hover:border-accent/50 bg-white/[0.02] hover:bg-accent/[0.04] text-ink font-semibold font-subheading text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
  >
    <span className="text-accent"><GoogleMark /></span>
    Continue with Google
  </button>
);

const Divider = () => (
  <div className="relative my-5">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-line/40" />
    </div>
    <div className="relative flex justify-center text-2xs uppercase font-bold tracking-[0.14em]">
      <span className="bg-[#0e1116] px-3 text-muted">Or</span>
    </div>
  </div>
);

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, initialTab = "register" }) => {
  const { appSettings, sendWelcomeNotification } = useApp();
  const supabase = useSupabaseClient();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveFromSignUp } = useSignUp();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveFromSignIn } = useSignIn();

  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  // Register wizard step (1 = account, 2 = profile, 3 = preferences)
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot password state (Clerk: request code -> enter code + new password)
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"request" | "reset">("request");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Register States
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("Select Gender");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState("Select Account Type");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("Choose Country");
  const [currency, setCurrency] = useState("Select Currency");
  const [checkedTerms, setCheckedTerms] = useState(false);

  // Email verification (Clerk requires this after sign-up)
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Sign-in second factor. Clerk challenges sign-ins from an unrecognised
  // device with an emailed code (status "needs_second_factor", strategy
  // "email_code"). Previously this screen dead-ended on "contact support",
  // so anyone signing in from a new browser was simply locked out.
  const [pendingSecondFactor, setPendingSecondFactor] = useState(false);
  const [secondFactorCode, setSecondFactorCode] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!signInLoaded) return;
    setErrorMsg(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
      // Browser navigates away here — nothing more to do on this page.
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.message || "Failed to authenticate with Google.");
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded) return;
    if (!forgotEmail) {
      setErrorMsg("Please provide your email address.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setForgotLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: forgotEmail,
      });
      setSuccessMsg("Check your inbox! Enter the code below along with your new password.");
      setForgotStep("reset");
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.message || "Failed to dispatch recovery code.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded) return;
    if (!resetCode || !newPassword) {
      setErrorMsg("Please enter the code and your new password.");
      return;
    }
    setErrorMsg(null);
    setForgotLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });
      if (result.status === "complete") {
        await setActiveFromSignIn({ session: result.createdSessionId });
        setTimeout(() => onNavigate("dashboard"), 800);
      } else {
        setErrorMsg("Could not complete password reset. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.errors?.[0]?.message || "Invalid or expired code.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded) return;
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (result.status === "complete") {
        await setActiveFromSignUp({ session: result.createdSessionId });

        // Write the full profile now that the account is confirmed & active.
        if (result.createdUserId) {
          const freshSupabase = createFreshAuthedClient();
          await createUserProfile(freshSupabase, {
            id: result.createdUserId,
            email,
            name: `${firstName.trim()} ${lastName.trim()}`,
            username: username.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            gender: sex,
            phone: phone.trim(),
            accountType,
            country,
            currency,
          });
        }

        // Branded welcome email (Clerk sends its own verification code, not a
        // welcome). Dedup-guarded in AppContext so it fires exactly once.
        sendWelcomeNotification(email, `${firstName.trim()} ${lastName.trim()}`.trim());

        setIsSuccess(true);
        setTimeout(() => onNavigate("dashboard"), 1000);
      } else {
        // Clerk accepted the request but the sign-up still isn't complete —
        // it's waiting on something. The old copy ("check the code") was
        // actively misleading here, because the code was fine. Report what
        // Clerk is actually holding out for.
        const missing = [
          ...((result as any).missingFields ?? []),
          ...((result as any).unverifiedFields ?? []),
        ];
        console.error("[signup] status:", result.status, "missing:", missing, result);
        setErrorMsg(
          missing.length
            ? `Account not activated yet — still required: ${missing.join(", ")}.`
            : `Account not activated yet (status: ${result.status}). Please contact support.`
        );
      }
    } catch (err: any) {
      const e = err?.errors?.[0];
      console.error("[signup] verification error:", e?.code, e?.longMessage || e?.message, err);
      setErrorMsg(e?.longMessage || e?.message || "Invalid verification code.");
    } finally {
      setIsVerifying(false);
    }
  };

  /** Completes a sign-in that Clerk challenged with an emailed second factor. */
  const handleVerifySecondFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded) return;
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: secondFactorCode.trim(),
      });
      if (result.status === "complete") {
        await setActiveFromSignIn({ session: result.createdSessionId });
        setPendingSecondFactor(false);
        setIsSuccess(true);
        setTimeout(() => onNavigate("dashboard"), 800);
      } else {
        console.error("[login] second factor not complete:", result.status, result);
        setErrorMsg(`Sign-in couldn't be completed (status: ${result.status}).`);
      }
    } catch (err: any) {
      const er = err?.errors?.[0];
      console.error("[login] second factor error:", er?.code, er?.longMessage || er?.message, err);
      setErrorMsg(er?.longMessage || er?.message || "That code wasn't accepted. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeTab === "register") {
      if (!signUpLoaded) return;
      if (!username.trim()) {
        setErrorMsg("Username is required.");
        return;
      }
      if (!firstName.trim()) {
        setErrorMsg("First name is required.");
        return;
      }
      if (!lastName.trim()) {
        setErrorMsg("Last name is required.");
        return;
      }
      if (sex === "Select Gender" || !sex) {
        setErrorMsg("Please select your gender (Sex).");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      if (!phone.trim()) {
        setErrorMsg("Phone number is required.");
        return;
      }
      if (accountType === "Select Account Type" || !accountType) {
        setErrorMsg("Please select an investment account type tier.");
        return;
      }
      if (!password) {
        setErrorMsg("Password is required.");
        return;
      }
      if (password.length < 8) {
        setErrorMsg("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      if (country === "Choose Country" || !country) {
        setErrorMsg("Please select your country.");
        return;
      }
      if (currency === "Select Currency" || !currency) {
        setErrorMsg("Please select a transaction account currency.");
        return;
      }
      if (!checkedTerms) {
        setErrorMsg("You must accept the terms & privacy policy to continue.");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await signUp.create({
          emailAddress: email.trim(),
          password,
          username: username.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });

        if (result.status === "complete") {
          // This Clerk instance doesn't require email verification —
          // registration is already done, activate the session directly.
          await setActiveFromSignUp({ session: result.createdSessionId });

          if (result.createdUserId) {
            const freshSupabase = createFreshAuthedClient();
            await createUserProfile(freshSupabase, {
              id: result.createdUserId,
              email: email.trim(),
              name: `${firstName.trim()} ${lastName.trim()}`,
              username: username.trim(),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              gender: sex,
              phone: phone.trim(),
              accountType,
              country,
              currency,
            });
          }

          setIsSuccess(true);
          setTimeout(() => onNavigate("dashboard"), 1000);
        } else {
          // Verification (e.g. email code) is required before completion.
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setPendingVerification(true);
        }
      } catch (err: any) {
        const e = err?.errors?.[0];
        console.error("[signup] create error:", e?.code, e?.longMessage || e?.message, err);
        setErrorMsg(e?.longMessage || e?.message || "Registration failed. Please attempt with a different email.");
      } finally {
        setIsSubmitting(false);
      }

    } else {
      // Login
      if (!signInLoaded) return;
      if (!loginEmail.trim() || !loginEmail.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      if (!loginPassword) {
        setErrorMsg("Please enter your password.");
        return;
      }

      setIsSuccess(true);
      try {
        const result = await signIn.create({
          identifier: loginEmail.trim(),
          password: loginPassword,
        });
        if (result.status === "complete") {
          await setActiveFromSignIn({ session: result.createdSessionId });
          setTimeout(() => {
            onNavigate("dashboard");
          }, 1000);
        } else {
          setIsSuccess(false);
          // Clerk accepted the request but the session isn't complete yet.
          // Surface the real status (and log the full result) instead of a
          // dead-end "contact support", then route the cases we can handle.
          console.error("[login] sign-in not complete:", result.status, result);

          if (result.status === "needs_first_factor") {
            // Password wasn't accepted as a valid first factor. Usually means
            // the account has no password set (e.g. Google-only sign-up), or
            // the password verification was removed from the Clerk user.
            const canUseEmailCode = result.supportedFirstFactors?.some(
              (f) => f.strategy === "email_code" || f.strategy === "reset_password_email_code",
            );
            setErrorMsg(
              canUseEmailCode
                ? 'This account can’t sign in with that password. Use “Forgot password?” to set a new one, or sign in with Google.'
                : "This account uses a different sign-in method. Try signing in with Google.",
            );
          } else if (result.status === "needs_new_password") {
            setErrorMsg('You need to set a new password. Use “Forgot password?” to continue.');
          } else if (result.status === "needs_second_factor") {
            // Clerk challenges sign-ins from an unrecognised device with a
            // second factor. On this instance that's an emailed code, which
            // this screen can handle — send it and switch to the code step.
            const emailFactor = result.supportedSecondFactors?.find(
              (f) => f.strategy === "email_code",
            );
            if (emailFactor) {
              try {
                await signIn.prepareSecondFactor({ strategy: "email_code" });
                setSecondFactorCode("");
                setPendingSecondFactor(true);
                setErrorMsg(null);
              } catch (prepErr: any) {
                setErrorMsg(
                  prepErr?.errors?.[0]?.longMessage ||
                    "Couldn't send the verification code. Please try again.",
                );
              }
            } else {
              const strategies = result.supportedSecondFactors?.map((f) => f.strategy).join(", ");
              setErrorMsg(
                `This account needs a second factor this screen can't handle yet (${strategies || "unknown"}). Please contact support.`,
              );
            }
          } else {
            setErrorMsg(`Sign-in couldn’t be completed (status: ${result.status}). Please contact support.`);
          }
        }
      } catch (err: any) {
        setIsSuccess(false);
        setErrorMsg(err?.errors?.[0]?.message || "Invalid credentials specified or user doesn't exist.");
      }
    }
  };

  const countriesList = [
    "United States", "United Kingdom", "Canada", "Australia", "Singapore",
    "Germany", "France", "Switzerland", "United Arab Emirates", "Saudi Arabia",
    "Qatar", "South Africa", "Nigeria", "Japan", "India", "Brazil", "Mexico"
  ];

  const currenciesList = ["USD", "EUR", "GBP", "BTC", "USDT"];

  /* ---- Per-step validation for the register wizard. Mirrors the rules in
     handleSubmit (which still runs as the final safety net on step 3). ---- */
  const validateStep = (step: 1 | 2): string | null => {
    if (step === 1) {
      if (!username.trim()) return "Username is required.";
      if (!email.trim() || !email.includes("@")) return "Please enter a valid email address.";
      if (!password) return "Password is required.";
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (password !== confirmPassword) return "Passwords do not match.";
    }
    if (step === 2) {
      if (!firstName.trim()) return "First name is required.";
      if (!lastName.trim()) return "Last name is required.";
      if (sex === "Select Gender" || !sex) return "Please select your gender (Sex).";
      if (!phone.trim()) return "Phone number is required.";
    }
    return null;
  };

  const attemptNext = () => {
    const err = validateStep(regStep as 1 | 2);
    if (err) { setErrorMsg(err); return; }
    setErrorMsg(null);
    setRegStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  };

  const goBackStep = () => {
    setErrorMsg(null);
    setRegStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  };

  // Enter on steps 1/2 advances the wizard instead of submitting the form early.
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (
      e.key === "Enter" &&
      activeTab === "register" &&
      !pendingVerification &&
      !showForgotPassword &&
      regStep < 3 &&
      (e.target as HTMLElement).tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      attemptNext();
    }
  };

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (tab === "register") setRegStep(1);
  };

  // Live field states for inline validation feedback
  const uState: FieldState = username.trim() ? "ok" : "idle";
  const eState: FieldState = email.trim() && email.includes("@") ? "ok" : email.length > 0 ? "err" : "idle";
  const cState: FieldState = confirmPassword ? (confirmPassword === password ? "ok" : "err") : "idle";
  const fnState: FieldState = firstName.trim() ? "ok" : "idle";
  const lnState: FieldState = lastName.trim() ? "ok" : "idle";
  const phState: FieldState = phone.trim() ? "ok" : "idle";
  const pw = passwordStrength(password);

  const headerTitle = pendingSecondFactor
    ? "Confirm this device"
    : pendingVerification
    ? "Verify your email"
    : showForgotPassword
      ? "Reset password"
      : activeTab === "register" ? "Create your account" : "Welcome back";

  const headerSub = pendingSecondFactor
    ? `This is a new device, so we sent a 6-digit code to ${loginEmail} to confirm it's you.`
    : pendingVerification
    ? `We sent a 6-digit code to ${email}. Enter it below to activate your account.`
    : showForgotPassword
      ? "We'll email you a secure code to reset your password."
      : activeTab === "register"
        ? ["Step 1 of 3 — start with your login credentials.",
           "Step 2 of 3 — tell us a little about yourself.",
           "Step 3 of 3 — set your trading preferences."][regStep - 1]
        : "Access real-time indicators, tier yields, and copy-performance logs.";

  const trustRows = [
    { icon: ShieldCheck, t1: "Bank-grade encryption", t2: "Multi-layer, end-to-end protection on every session." },
    { icon: Zap, t1: "Seamless execution", t2: "Low-latency order routing and live market sync." },
    { icon: Clock, t1: "Onboard in under 2 minutes", t2: "Three quick steps — no paperwork, no waiting." },
  ];

  return (
    <div className="mx-auto my-8 w-full max-w-5xl px-4 sm:px-6 lg:px-8 font-sans">
      <div className="grid overflow-hidden rounded-[28px] border border-line/70 bg-gradient-to-br from-surface via-ground to-ground shadow-[0_40px_120px_rgba(0,0,0,0.55)] md:grid-cols-[0.92fr_1.08fr]">

        {/* ---------------- LEFT BRAND RAIL ---------------- */}
        <aside className="relative order-2 flex flex-col overflow-hidden border-t border-line/50 p-8 md:order-1 md:border-r md:border-t-0 md:p-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 0% 0%, rgba(106,165,255,0.12), transparent 55%), radial-gradient(60% 40% at 85% 95%, rgba(61,125,255,0.10), transparent 60%)",
            }}
          />
          <div className="relative z-10 font-sans text-[22px] font-bold tracking-tight">
            <span className="text-ink">moneta </span><span className="text-accent">prime</span>
          </div>

          <div className="relative z-10 mt-auto pt-10">
            <div className="text-2xs font-bold uppercase tracking-[0.22em] text-accent">
              Institutional-grade trading
            </div>
            <h1 className="mt-3 mb-3 max-w-[13ch] font-display text-[30px] font-bold leading-[1.1] tracking-tight text-balance text-ink sm:text-[34px]">
              Trade with{" "}
              <span className="bg-gradient-to-r from-accent to-accent-deep bg-clip-text text-transparent">precision</span>,
              onboard in minutes.
            </h1>
            <p className="mb-8 max-w-[34ch] text-sm leading-relaxed text-muted">
              Real-time indicators, tiered yields, and copy-performance logs — in one workspace built for serious traders.
            </p>

            <div className="flex flex-col gap-4">
              {trustRows.map(({ icon: Icon, t1, t2 }) => (
                <div key={t1} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] border border-accent/30 bg-accent/10 text-accent">
                    <Icon size={15} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold leading-tight text-ink">{t1}</div>
                    <div className="text-xs leading-snug text-muted">{t2}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8 flex items-center gap-2 text-2xs text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive animate-ping" />
            Security node active · End-to-end encryption
          </div>
        </aside>

        {/* ---------------- RIGHT FORM PANEL ---------------- */}
        <section className="order-1 flex flex-col p-7 md:order-2 md:p-10">

          {/* Tab switcher — hidden mid-verify / mid-reset / mid-success */}
          {!pendingVerification && !showForgotPassword && !isSuccess && (
            <div className="mb-7 inline-flex gap-1 self-start rounded-full border border-line/70 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`rounded-full px-5 py-2 text-xs font-bold font-subheading transition-all cursor-pointer ${
                  activeTab === "register" ? "bg-accent text-ground" : "text-muted hover:text-ink"
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={`rounded-full px-5 py-2 text-xs font-bold font-subheading transition-all cursor-pointer ${
                  activeTab === "login" ? "bg-accent text-ground" : "text-muted hover:text-ink"
                }`}
              >
                Sign in
              </button>
            </div>
          )}

          {/* Header */}
          {!isSuccess && (
            <div className="mb-7">
              {pendingVerification && (
                <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
                  <Mail size={26} />
                </span>
              )}
              <h2 className="font-display text-[25px] font-bold tracking-tight text-ink">{headerTitle}</h2>
              <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted">{headerSub}</p>
            </div>
          )}

          {isSuccess ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                <CheckCircle2 size={26} className="animate-bounce" />
              </span>
              <p className="font-subheading text-sm font-bold text-accent">
                {activeTab === "register" ? "Creating your account…" : "Signing you in…"}
              </p>
            </div>
          ) : pendingSecondFactor ? (
            /* Sign-in second factor: emailed code for an unrecognised device */
            <form onSubmit={handleVerifySecondFactor} className="flex flex-col gap-5">
              {errorMsg && (
                <div className="rounded-xl border border-negative/20 bg-negative/10 p-3.5 font-sans text-xs text-negative">
                  {errorMsg}
                </div>
              )}
              <p className="font-sans text-xs text-muted">
                We sent a 6-digit code to <span className="text-ink">{loginEmail}</span> to confirm
                this device.
              </p>
              <div className="space-y-1.5">
                <label className="block text-2xs uppercase font-subheading tracking-wider text-muted">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={secondFactorCode}
                  onChange={(e) => setSecondFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-xl border border-line/85 bg-ground px-4 py-3.5 text-center font-sans tracking-[0.4em] text-ink outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15 tabular-nums"
                  required
                />
              </div>
              <button type="submit" disabled={isVerifying} className="orb-button w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed">
                {isVerifying ? (
                  <><span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ground/30 border-t-ground" />Verifying…</>
                ) : (<>Confirm &amp; sign in <ArrowRight size={16} /></>)}
              </button>
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => { setPendingSecondFactor(false); setErrorMsg(null); }}
                  className="cursor-pointer border-none bg-transparent text-xs font-semibold text-accent outline-none hover:underline"
                >
                  ← Back
                </button>
              </div>
            </form>
          ) : pendingVerification ? (
            /* Email verification step */
            <form onSubmit={handleVerifyEmail} className="flex flex-col gap-5">
              {errorMsg && (
                <div className="rounded-xl border border-negative/20 bg-negative/10 p-3.5 font-sans text-xs text-negative">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-2xs uppercase font-subheading tracking-wider text-muted">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-xl border border-line/85 bg-ground px-4 py-3.5 text-center font-sans tracking-[0.4em] text-ink outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15 tabular-nums"
                  required
                />
              </div>
              <button type="submit" disabled={isVerifying} className="orb-button w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed">
                {isVerifying ? (
                  <><span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ground/30 border-t-ground" />Verifying…</>
                ) : (<>Verify &amp; activate account <ArrowRight size={16} /></>)}
              </button>
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => { setPendingVerification(false); setErrorMsg(null); }}
                  className="cursor-pointer border-none bg-transparent text-xs font-semibold text-accent outline-none hover:underline"
                >
                  ← Back
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="flex flex-col gap-5">

              {errorMsg && (
                <div className="rounded-xl border border-negative/20 bg-negative/10 p-3.5 font-sans text-xs text-negative">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl border border-positive/20 bg-positive/10 p-3.5 font-sans text-xs text-positive">
                  {successMsg}
                </div>
              )}

              {activeTab === "register" ? (
                <div className="flex flex-col gap-5">

                  {/* Progress stepper */}
                  <div className="flex items-center">
                    {[
                      { n: 1, label: "Account" },
                      { n: 2, label: "Profile" },
                      { n: 3, label: "Preferences" },
                    ].map(({ n, label }, i) => {
                      const active = regStep === n;
                      const done = regStep > n;
                      return (
                        <React.Fragment key={n}>
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border text-2xs font-bold tabular-nums transition-all ${
                              active ? "border-accent bg-accent text-ground"
                                : done ? "border-accent bg-accent/15 text-accent"
                                : "border-line bg-white/[0.04] text-muted"
                            }`}>
                              {done ? <Check size={13} /> : n}
                            </span>
                            <span className={`hidden text-2xs font-semibold sm:block ${active ? "text-ink" : "text-muted"}`}>
                              {label}
                            </span>
                          </div>
                          {i < 2 && <div className={`mx-2.5 h-0.5 flex-1 rounded-full transition-all ${regStep > n ? "bg-accent" : "bg-line"}`} />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* STEP 1 — Account basics */}
                  {regStep === 1 && (
                    <div className="flex flex-col gap-4">
                      <TextInput icon={User} label="Username" required value={username}
                        onChange={(e) => setUsername(e.target.value)} placeholder="Choose a unique username" state={uState} />
                      <TextInput icon={Mail} label="Email address" required type="email" inputMode="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" state={eState}
                        hint={eState === "err" ? "Enter a valid email address." : null} />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <TextInput icon={Lock} label="Password" required password value={password}
                            onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />
                          {password && (
                            <div className="mt-2">
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4].map((i) => (
                                  <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${pwBarColor(i, pw.score)}`} />
                                ))}
                              </div>
                              <div className="mt-1.5 flex justify-between text-2xs text-muted">
                                <span>Password strength</span>
                                <span className={`font-semibold ${pwTextColor(pw.score)}`}>{pw.label}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <TextInput icon={Lock} label="Confirm" required password value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" state={cState}
                          hint={cState === "err" ? "Passwords don't match yet." : null} />
                      </div>
                      <div className="mt-1">
                        <button type="button" onClick={attemptNext} className="orb-button w-full py-4">
                          Continue <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 — Profile details */}
                  {regStep === 2 && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextInput icon={User} label="First name" required value={firstName}
                          onChange={(e) => setFirstName(e.target.value)} placeholder="First name" state={fnState} />
                        <TextInput icon={User} label="Last name" required value={lastName}
                          onChange={(e) => setLastName(e.target.value)} placeholder="Last name" state={lnState} />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SelectInput label="Sex" required value={sex} onChange={(e) => setSex(e.target.value)}
                          state={sex !== "Select Gender" ? "ok" : "idle"}>
                          <option disabled value="Select Gender">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </SelectInput>
                        <TextInput icon={Phone} label="Phone number" required type="tel" inputMode="tel" value={phone}
                          onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" state={phState} />
                      </div>
                      <div className="mt-1 flex gap-3">
                        <button type="button" onClick={goBackStep} className="orb-button-secondary py-4">
                          <ArrowLeft size={16} /> Back
                        </button>
                        <button type="button" onClick={attemptNext} className="orb-button flex-1 py-4">
                          Continue <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 — Preferences */}
                  {regStep === 3 && (
                    <div className="flex flex-col gap-4">
                      <SelectInput label="Account type" required value={accountType} onChange={(e) => setAccountType(e.target.value)}
                        state={accountType !== "Select Account Type" ? "ok" : "idle"}>
                        <option disabled value="Select Account Type">Select account tier</option>
                        <option value="Bronze">Bronze Tier (Standard)</option>
                        <option value="Silver">Silver Tier (Advanced)</option>
                        <option value="Gold">Gold Tier (Premium)</option>
                        <option value="Platinum">Platinum Tier (Elite)</option>
                        <option value="Diamond">Diamond Tier (Pro)</option>
                      </SelectInput>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SelectInput label="Country" required value={country} onChange={(e) => setCountry(e.target.value)}
                          state={country !== "Choose Country" ? "ok" : "idle"}>
                          <option disabled value="Choose Country">Choose country</option>
                          {countriesList.map((c, i) => <option key={i} value={c}>{c}</option>)}
                        </SelectInput>
                        <SelectInput label="Currency" required value={currency} onChange={(e) => setCurrency(e.target.value)}
                          state={currency !== "Select Currency" ? "ok" : "idle"}>
                          <option disabled value="Select Currency">Select currency</option>
                          {currenciesList.map((curr, idx) => <option key={idx} value={curr}>{curr}</option>)}
                        </SelectInput>
                      </div>

                      <label htmlFor="chk-terms" className="mt-1 flex cursor-pointer select-none items-start gap-2.5 text-xs leading-tight text-muted">
                        <input
                          type="checkbox"
                          id="chk-terms"
                          checked={checkedTerms}
                          onChange={(e) => setCheckedTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-accent"
                        />
                        <span>
                          I accept the{" "}
                          <button type="button" onClick={() => onNavigate("terms")} className="text-accent hover:underline">Terms of Service</button>
                          {" "}and{" "}
                          <button type="button" onClick={() => onNavigate("privacy")} className="text-accent hover:underline">Privacy Policy</button>.
                        </span>
                      </label>

                      {/* Clerk bot-protection (CAPTCHA) mount point — required on custom
                          sign-up flows, exactly one per page or it silently fails. */}
                      <div id="clerk-captcha" />

                      <div className="mt-1 flex gap-3">
                        <button type="button" onClick={goBackStep} className="orb-button-secondary py-4">
                          <ArrowLeft size={16} /> Back
                        </button>
                        <button type="submit" disabled={isSubmitting} className="orb-button flex-1 py-4 disabled:opacity-50 disabled:cursor-not-allowed">
                          {isSubmitting ? (
                            <><span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ground/30 border-t-ground" />Creating…</>
                          ) : (<>Create account <ArrowRight size={16} /></>)}
                        </button>
                      </div>
                      <p className="text-center text-2xs leading-tight text-muted">
                        A 6-digit code will confirm your email next.
                      </p>
                    </div>
                  )}

                  {/* Social + swap — shown on step 1 only to keep later steps focused */}
                  {regStep === 1 && (
                    <>
                      <Divider />
                      <GoogleButton onClick={handleGoogleSignIn} />
                      <div className="pt-1 text-center text-xs text-muted">
                        Already have an account?{" "}
                        <button type="button" onClick={() => switchTab("login")} className="font-semibold text-accent hover:underline">
                          Sign in
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : showForgotPassword ? (
                /* Forgot Password recovery view */
                <div className="flex flex-col gap-5">
                  {forgotStep === "request" ? (
                    <>
                      <TextInput icon={Mail} label="Email address" type="email" inputMode="email" value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" />
                      <button type="button" disabled={forgotLoading} onClick={handleForgotPasswordRequest}
                        className="orb-button w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed">
                        {forgotLoading ? (
                          <><span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ground/30 border-t-ground" />Processing…</>
                        ) : (<>Send reset code <ArrowRight size={16} /></>)}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-2xs uppercase font-subheading tracking-wider text-muted">Reset code</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="w-full rounded-xl border border-line/85 bg-ground px-4 py-3.5 text-center font-sans tracking-[0.4em] text-ink outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15 tabular-nums"
                          required
                        />
                      </div>
                      <TextInput icon={Lock} label="New password" password value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                      <button type="button" disabled={forgotLoading} onClick={handleForgotPasswordReset}
                        className="orb-button w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed">
                        {forgotLoading ? (
                          <><span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ground/30 border-t-ground" />Resetting…</>
                        ) : (<>Reset password &amp; sign in <ArrowRight size={16} /></>)}
                      </button>
                    </>
                  )}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => { setShowForgotPassword(false); setForgotStep("request"); setErrorMsg(null); setSuccessMsg(null); }}
                      className="cursor-pointer border-none bg-transparent text-xs font-semibold text-accent outline-none hover:underline"
                    >
                      ← Return to sign in
                    </button>
                  </div>
                </div>
              ) : (
                /* Login view */
                <div className="flex flex-col gap-5">
                  <TextInput icon={Mail} label="Email address" type="email" inputMode="email" value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" />
                  <TextInput icon={Lock} label="Password" password value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password"
                    rightLabel={
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(true); setErrorMsg(null); setSuccessMsg(null); }}
                        className="cursor-pointer border-none bg-transparent text-2xs font-semibold text-accent outline-none hover:underline"
                      >
                        Forgot password?
                      </button>
                    }
                  />
                  <button type="submit" className="orb-button mt-1 w-full py-4">
                    Sign in <ArrowRight size={16} />
                  </button>

                  <Divider />
                  <GoogleButton onClick={handleGoogleSignIn} />

                  <div className="pt-1 text-center text-xs text-muted">
                    Don't have an account yet?{" "}
                    <button type="button" onClick={() => switchTab("register")} className="font-semibold text-accent hover:underline">
                      Register now
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Support signpost */}
          <div className="mt-auto pt-8 text-center text-2xs text-muted">
            Need assistance? <a href={`mailto:${appSettings.supportEmail}`} className="text-accent hover:underline">Contact support</a>
          </div>

        </section>
      </div>
    </div>
  );
};
