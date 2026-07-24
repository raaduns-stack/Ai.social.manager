/**
 * AdminLogin.jsx
 * Standalone admin login (renders outside AdminLayout — no sidebar/navbar).
 * Validates fields client-side, calls the mock login, redirects to
 * /admin/dashboard (or wherever the user was headed before being bounced
 * to login) on success.
 */
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Loader2, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/admin/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!form.password) {
      next.password = "Password is required.";
    } else if (form.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login(form.email, form.password);
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-sm rounded-card border border-[#E5E7EB] bg-white p-8">
        <h1 className="text-lg font-semibold text-[#111827]">Admin Sign In</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Sign in to manage the AI Social Media Manager platform.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#111827]">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-2.5 text-[#6B7280]" />
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="you@raaduns.com"
                className={`w-full rounded-lg border px-9 py-2 text-sm outline-none ${errors.email ? "border-[#EF4444]" : "border-[#E5E7EB]"
                  }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-[#EF4444]">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[#111827]">
                Password
              </label>
              <Link
                to="/admin/forgot-password"
                className="text-xs text-[#4F46E5] hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-2.5 text-[#6B7280]" />
              <input
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="••••••••"
                className={`w-full rounded-lg border px-9 py-2 text-sm outline-none ${errors.password ? "border-[#EF4444]" : "border-[#E5E7EB]"
                  }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-[#EF4444]">{errors.password}</p>
            )}
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-[#EF4444]">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-xs text-[#6B7280]">
            Demo credentials: pascal@raaduns.com / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
