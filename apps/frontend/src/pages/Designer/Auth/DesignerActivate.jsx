import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import Button from "../../../components/ui/Button";
import { useDesignerAuth } from "../../../context/useDesignerAuth";
import ErrorBanner from "../../../components/error-banner";

export default function DesignerActivate() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { activate } = useDesignerAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setApiError({ message: "Missing activation token. Please use the link from your invitation email." }); return; }
    if (!fullName.trim()) { setApiError({ message: "Full name is required." }); return; }
    if (password.length < 8) { setApiError({ message: "Password must be at least 8 characters." }); return; }
    if (password !== confirm) { setApiError({ message: "Passwords do not match." }); return; }
    setLoading(true);
    setApiError(null);
    const result = await activate({ token, fullName: fullName.trim(), password });
    setLoading(false);
    if (result.success) navigate("/designer", { replace: true });
    else setApiError({ message: result.error });
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-white border border-border rounded-card p-8 shadow-soft">
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-xl bg-ink flex items-center justify-center text-white"><ShieldCheck size={22} /></div>
        <h2 className="text-3xl font-bold text-ink tracking-tight">Activate Your Account</h2>
        <p className="text-sm text-ink-muted">You were invited as a graphic designer. Set your password to access the Designer Portal.</p>
        {!token && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No token found. Open the link from your invitation email.</p>}
      </div>

      {apiError && <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="activate-fullname">Full name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><User size={18} /></div>
            <input id="activate-fullname" autoComplete="name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Designer" className="block w-full pl-10 pr-3 py-3 border border-border rounded-control bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="activate-password">New password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><Lock size={18} /></div>
            <input id="activate-password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="block w-full pl-10 pr-10 py-3 border border-border rounded-control bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="activate-confirm">Confirm password</label>
          <input id="activate-confirm" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="block w-full px-3 py-3 border border-border rounded-control bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full py-3 font-semibold text-white" disabled={loading}>
          {loading ? "Activating..." : "Activate & Sign In"}
        </Button>
        <p className="text-center text-sm text-ink-muted"><Link to="/designer/login" className="font-semibold text-ink hover:text-primary underline underline-offset-4">Already activated? Sign in</Link></p>
      </form>
      </div>
    </div>
  );
}
