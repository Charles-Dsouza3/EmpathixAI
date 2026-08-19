import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

const TABS = ["Google", "Email"];

export default function AuthModal({ open, onClose }) {
  const [tab, setTab] = useState("Google");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    signInWithGoogle, signUpWithEmail, signInWithEmail,
    sendPhoneOtp, confirmPhoneOtp,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailMode, setEmailMode] = useState("signin"); // "signin" | "signup"

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
  if (open) {
    setEmail("");
    setPassword("");
    setPhone("");
    setOtpCode("");
    setOtpSent(false);
    setError("");
  }
}, [open]);

  if (!open) return null;

  const runAction = async (fn) => {
    setError("");
    setLoading(true);
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => runAction(signInWithGoogle);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    runAction(() =>
      emailMode === "signup" ? signUpWithEmail(email, password) : signInWithEmail(email, password)
    );
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPhoneOtp(phone, "recaptcha-container");
      setOtpSent(true);
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = (e) => {
    e.preventDefault();
    runAction(() => confirmPhoneOtp(otpCode));
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 px-4">
      <div className="w-full max-w-sm bg-paper border border-hairline rounded-sm shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-hairline">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-mist">Patient Access</p>
            <h2 className="font-display text-lg font-semibold text-ink">Sign in to EmpathixAI</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink font-mono text-sm">✕</button>
        </div>

        <div className="flex border-b border-hairline">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wide transition-colors
                ${tab === t ? "text-sage-dark border-b-2 border-sage-dark -mb-px" : "text-ink/40 hover:text-ink/70"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-5 py-5">
          {error && (
            <p className="mb-3 text-xs font-mono text-pulse border border-pulse/30 bg-pulse/5 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          {tab === "Google" && (
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full stamp-btn rounded-sm bg-sage/10 hover:bg-sage/20 text-ink font-mono text-xs uppercase tracking-wide py-2.5 disabled:opacity-50"
            >
              Continue with Google
            </button>
          )}

          {tab === "Email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete={emailMode === "signup" ? "off" : "email"}
                className="w-full border border-hairline rounded-sm bg-white/60 px-3 py-2 text-sm outline-none focus:border-mist/60"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={emailMode === "signup" ? "new-password" : "current-password"}
                className="w-full border border-hairline rounded-sm bg-white/60 px-3 py-2 text-sm outline-none focus:border-mist/60"
                />
              <button
                type="submit"
                disabled={loading}
                className="w-full stamp-btn rounded-sm bg-sage-dark hover:bg-ink text-paper font-mono text-xs uppercase tracking-wide py-2.5 disabled:opacity-50"
              >
                {emailMode === "signup" ? "Create account" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => setEmailMode((m) => (m === "signup" ? "signin" : "signup"))}
                className="w-full text-center font-mono text-[11px] text-mist hover:underline"
              >
                {emailMode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}