import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import Button from "../../../components/ui/Button";
import apiClient from "../../../lib/api-client";

export default function DesignerForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Backend always returns a neutral message (no account enumeration),
      // so showing the "check your email" screen is correct either way.
      await apiClient.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 text-center bg-white border border-border rounded-card p-8 shadow-soft">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Mail size={20} /></div>
        <h2 className="text-2xl font-bold text-ink">Check your email</h2>
        <p className="text-sm text-ink-muted">If an account exists for <span className="font-semibold text-ink">{email}</span>, you will receive a password reset link shortly.</p>
        <Link to="/designer/login" className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-primary"><ArrowLeft size={16} /> Back to Designer Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-white border border-border rounded-card p-8 shadow-soft">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-ink tracking-tight">Forgot password?</h2>
        <p className="text-sm text-ink-muted">Enter your designer email and we will send you a reset link.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><Mail size={18} /></div>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="designer@raasocial.io" className="block w-full pl-10 pr-3 py-3 border border-border rounded-control bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
          </div>
        </div>
        {error && <p className="text-xs text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full py-3 font-semibold text-white" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
        <p className="text-center text-sm"><Link to="/designer/login" className="font-semibold text-ink hover:text-primary inline-flex items-center gap-1"><ArrowLeft size={14} /> Back to login</Link></p>
      </form>
      </div>
    </div>
  );
}
