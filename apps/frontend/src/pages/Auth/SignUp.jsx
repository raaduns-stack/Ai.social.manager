import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Terminal } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/useAuth'
import ErrorBanner from '../../components/error-banner'

/**
 * SignUp page component converted from Stitch-generated HTML design.
 */
export default function SignUp() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear errors when the user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms and Conditions'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setApiError(null)

    try {
      await register(formData.email, formData.password, formData.fullName, formData.companyName)
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err) {
      setApiError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink text-left">
          Create your account
        </h1>
        <p className="text-sm text-ink-muted text-left">
          Join 2,000+ marketing teams using AI to drive growth.
        </p>
      </div>

      {apiError && (
        <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
      )}

      {/* Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            id="full_name"
            name="fullName"
            type="text"
            placeholder="John Doe"
            required
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />
          <Input
            label="Company Name"
            id="company_name"
            name="companyName"
            type="text"
            placeholder="Acme Inc."
            required
            value={formData.companyName}
            onChange={handleChange}
            error={errors.companyName}
          />
        </div>

        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          required
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full h-10 rounded-control border border-border bg-surface pl-3 pr-10 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-primary-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm_password" className="text-sm font-medium text-ink">
              Confirm Password
            </label>
            <input
              id="confirm_password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="w-full h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-danger">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <input
              id="terms"
              name="agreeToTerms"
              type="checkbox"
              className="mt-1 rounded border-border text-primary-600 focus:ring-primary-500 h-4 w-4"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              required
            />
            <label htmlFor="terms" className="text-xs text-ink-muted leading-tight text-left">
              By creating an account, I agree to the{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>
              .
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-xs text-danger text-left">{errors.agreeToTerms}</p>
          )}
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold shadow-soft flex items-center justify-center gap-2 cursor-pointer"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
          <ArrowRight size={18} />
        </Button>
      </form>

      {/* Footer Link */}
      <footer className="text-center pt-2">
        <p className="text-sm text-ink-muted">
          Already have an account?{' '}
          <a className="text-primary-600 font-bold hover:underline" href="/login">
            Log in
          </a>
        </p>
      </footer>

      {/* Bottom Copyright */}
      <div className="text-center text-xs text-ink-muted/60 pt-4 border-t border-border/60">
        <span>© 2026 SocialPulse AI</span>
      </div>
    </div>
  )
}
