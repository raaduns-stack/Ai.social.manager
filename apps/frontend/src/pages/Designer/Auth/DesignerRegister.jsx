import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Button from "../../../components/ui/Button";
import { useDesignerAuth } from "../../../context/useDesignerAuth";
import ErrorBanner from "../../../components/error-banner";

export default function DesignerRegister() {
  const { register } = useDesignerAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
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
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the Terms and Conditions";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setApiError(null);
    try {
      await register(formData.email, formData.password, formData.fullName);
      navigate(`/designer/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-border rounded-card p-8 shadow-soft space-y-8">
        <div className="text-left space-y-2">
          <h2 className="text-3xl font-bold text-ink tracking-tight">Create Designer Account</h2>
          <p className="text-sm text-ink-muted">Join as a graphic designer to manage submissions and track activity.</p>
        </div>

        {apiError && <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink" htmlFor="fullName">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><User size={18} /></div>
              <input
                id="fullName" name="fullName" placeholder="Alex Designer" required type="text"
                value={formData.fullName} onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm ${errors.fullName ? 'border-danger' : 'border-border'}`}
              />
            </div>
            {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-ink" htmlFor="email">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><Mail size={18} /></div>
              <input
                id="email" name="email" placeholder="designer@raasocial.io" required type="email"
                value={formData.email} onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm ${errors.email ? 'border-danger' : 'border-border'}`}
              />
            </div>
            {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted"><Lock size={18} /></div>
                <input
                  id="password" name="password" placeholder="••••••••" required type={showPassword ? 'text' : 'password'}
                  value={formData.password} onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm ${errors.password ? 'border-danger' : 'border-border'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-ink" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword" name="confirmPassword" placeholder="••••••••" required type="password"
                value={formData.confirmPassword} onChange={handleChange}
                className={`block w-full px-3 py-3 border rounded-lg bg-white text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-sm ${errors.confirmPassword ? 'border-danger' : 'border-border'}`}
              />
              {errors.confirmPassword && <p className="text-xs text-danger">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-start gap-2">
              <input id="terms" name="agreeToTerms" type="checkbox" className="mt-1 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" checked={formData.agreeToTerms} onChange={handleChange} required />
              <label htmlFor="terms" className="text-xs text-ink-muted leading-tight select-none">
                By creating an account, I agree to the <Link to="/terms-of-service" className="text-ink font-semibold hover:text-primary">Terms</Link> and <Link to="/privacy-policy" className="text-ink font-semibold hover:text-primary">Privacy Policy</Link>.
              </label>
            </div>
            {errors.agreeToTerms && <p className="text-xs text-danger">{errors.agreeToTerms}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full flex justify-center py-3 font-semibold text-white mt-2" disabled={loading}>
            {loading ? "Creating Account..." : "Create Designer Account"}
          </Button>

          <div className="text-center pt-2">
            <p className="text-sm text-ink-muted">Already have an account? <Link to="/designer/login" className="font-semibold text-ink hover:text-primary underline decoration-border hover:decoration-primary underline-offset-4">Log in</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}
