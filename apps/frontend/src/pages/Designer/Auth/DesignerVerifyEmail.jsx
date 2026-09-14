import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import apiClient from "../../../lib/api-client";
import { useDesignerAuth } from "../../../context/useDesignerAuth";

export default function DesignerVerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { designer } = useDesignerAuth();
  const email = searchParams.get("email") || designer?.email || (() => { try { return JSON.parse(localStorage.getItem("designer_session") || "null")?.email; } catch { return ""; } })() || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendStatus, setResendStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (countdown === 0) return;
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError("");
    if (value && index < 5) inputRefs[index + 1].current?.focus();
  };
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) inputRefs[index - 1].current?.focus();
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (countdown > 0) return;
    if (!email) { setError("Missing email — return to registration."); return; }
    setResendStatus("sending");
    setError("");
    try {
      await apiClient.post("/auth/resend-verification", { email });
      setResendStatus("sent");
      setCountdown(60);
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Verification code resent!", type: "success" } }));
      setTimeout(() => setResendStatus(""), 3000);
    } catch (err) {
      setResendStatus("");
      const msg = err?.message || "Failed to resend code.";
      setError(msg);
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: msg, type: "error" } }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (!email) { setError("Missing email — return to registration."); return; }
    if (fullCode.length < 6) { setError("Please enter all 6 digits."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/auth/verify-email", { email, code: fullCode });
      const { user, accessToken, refreshToken } = res.data;
      if (user?.role && user.role !== "designer") {
        setError("This verification is for designer accounts only.");
        return;
      }
      // Persist via localStorage and force reload of DesignerAuthContext (provider reads on mount)
      const session = {
        id: user.id,
        email: user.email,
        name: user.fullName || user.name || user.email,
        role: user.role,
        accessToken,
        refreshToken,
        rawUser: user,
      };
      localStorage.setItem("designer_session", JSON.stringify(session));
      // Trigger context sync by dispatching storage event + reloading — context will pick up on next render via useEffect
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Email verified — welcome!", type: "success" } }));
      // Small delay so toast shows before navigation
      setTimeout(() => navigate("/designer", { replace: true }), 300);
    } catch (err) {
      setError(err?.message || "Verification failed. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-100">
            <Mail className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">Verify your email</h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            We sent a 6-digit code to <strong className="text-ink">{email || "your email"}</strong>. Enter it below to activate your designer account.
          </p>
        </div>

        <Card className="p-8 border border-border bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2 max-w-xs mx-auto">
              {code.map((d, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-12 text-center text-lg font-bold rounded-control border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-ink"
                  required
                />
              ))}
            </div>
            {error && <p className="text-xs text-danger text-center">{error}</p>}
            <Button type="submit" variant="primary" size="lg" className="w-full font-semibold text-white" disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          <div className="mt-6 text-xs text-ink-muted">
            Didn&apos;t receive the email?{" "}
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resendStatus === "sending"}
              className={`font-semibold inline-flex items-center gap-1 ${countdown > 0 || resendStatus === "sending" ? "text-ink-muted/50 cursor-not-allowed" : "text-primary hover:underline cursor-pointer"}`}
            >
              {resendStatus === "sending" ? <><RefreshCw size={12} className="animate-spin" /> Resending...</> : resendStatus === "sent" ? "✓ Code resent!" : countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
