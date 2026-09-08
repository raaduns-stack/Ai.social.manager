import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Palette } from "lucide-react";
import Button from "../../../components/ui/Button";
import { useDesignerAuth } from "../../../context/useDesignerAuth";
import ErrorBanner from "../../../components/error-banner";

export default function DesignerLogin() {
  const { login } = useDesignerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/designer";

  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";
    if (!formData.password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setApiError(null);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setApiError({ message: result.error });
      }
    } catch (err) {
      // EMAIL_NOT_VERIFIED is redirected by api-client (403 → /designer/verify-email)
      // This catch prevents an unhandled rejection when that pending redirect fires
      // For any other throw, surface it
      if (err?.statusCode !== 403 || !err?.message?.toLowerCase?.().includes("not verified")) {
        setApiError({ message: err?.message || "Invalid email or password." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-white border border-border rounded-card p-8 shadow-soft">
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
          <Palette size={22} />
        </div>
        <h2 className="text-3xl font-bold text-ink tracking-tight">Designer Portal</h2>
        <p className="text-sm text-ink-muted">Graphic designers — sign in with your assigned credentials.</p>
      </div>

      {apiError && <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="email">Email address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><Mail size={18} /></div>
            <input
              id="email" name="email" type="email" placeholder="designer@raasocial.io"
              value={formData.email} onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm ${errors.email ? 'border-danger' : 'border-border'}`}
            />
          </div>
          {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-ink" htmlFor="password">Password</label>
            <Link className="text-xs font-semibold text-ink hover:text-primary transition-colors" to="/designer/forgot-password">Forgot password?</Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><Lock size={18} /></div>
            <input
              id="password" name="password" placeholder="••••••••"
              type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange}
              className={`block w-full pl-10 pr-10 py-3 border rounded-lg bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm ${errors.password ? 'border-danger' : 'border-border'}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input id="remember-me" name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <label htmlFor="remember-me" className="text-xs text-ink-muted select-none">Remember Me</label>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full flex justify-center py-3 font-semibold text-white" disabled={loading}>
          {loading ? "Signing In..." : "Sign In to Designer Portal"}
        </Button>

        <div className="text-center pt-2 space-y-2">
          <p className="text-sm text-ink-muted">Don&apos;t have an account? <Link to="/designer/register" className="font-semibold text-ink hover:text-primary underline decoration-border hover:decoration-primary underline-offset-4">Sign up</Link></p>
          <p className="text-sm text-ink-muted"><Link to="/" className="font-semibold text-ink hover:text-primary underline decoration-border underline-offset-4">← Back to website</Link></p>
        </div>
      </form>
      </div>
    </div>
  );
}
