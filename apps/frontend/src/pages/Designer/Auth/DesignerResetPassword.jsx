import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import Button from "../../../components/ui/Button";
import apiClient from "../../../lib/api-client";

export default function DesignerResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setError("Missing reset token — open the link from your email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post("/auth/reset-password", { token, password });
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Password reset — sign in with your new password.", type: "success" } }));
      navigate("/designer/login", { replace: true });
    } catch (err) {
      setError(err?.message || "Reset failed. The link may have expired — request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-white border border-border rounded-card p-8 shadow-soft">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-ink tracking-tight">Reset password</h2>
        <p className="text-sm text-ink-muted">Create a new secure password for your designer account.</p>
        {!token && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No token found. Use the link from your reset email.</p>}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink">New password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><Lock size={18} /></div>
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="block w-full pl-10 pr-10 py-3 border border-border rounded-control bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink">Confirm password</label>
          <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="block w-full px-3 py-3 border border-border rounded-control bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
        </div>
        {error && <p className="text-xs text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full py-3 font-semibold text-white" disabled={loading}>{loading ? "Resetting..." : "Reset password"}</Button>
        <p className="text-center text-sm text-ink-muted"><Link to="/designer/login" className="font-semibold text-ink hover:text-primary underline underline-offset-4">Back to login</Link></p>
      </form>
      </div>
    </div>
  );
}
