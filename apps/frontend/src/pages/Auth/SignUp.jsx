import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/useAuth'
import ErrorBanner from '../../components/error-banner'
import { trackEvent } from '../../lib/analytics'

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
      trackEvent('sign_up', { method: 'email' })
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
      <div className="text-left space-y-2">
        <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#111111] tracking-tight">Create Account</h2>
        <p className="text-sm text-[#666666]">Join 2,000+ marketing teams using AI to grow.</p>
      </div>

      {apiError && (
        <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
      )}

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#111111]" htmlFor="fullName">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
                <User size={18} />
              </div>
              <input
                className={`block w-full pl-10 pr-3 py-3 border rounded-control bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-1 focus:ring-[#FF6600] focus:border-[#FF6600] transition-colors text-sm ${
                  errors.fullName ? 'border-danger' : 'border-gray-200'
                }`}
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                required
                type="text"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            {errors.fullName && <p className="text-xs text-danger">{errors.fullName}</p>}
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#111111]" htmlFor="companyName">
              Company Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
                <Building2 size={18} />
              </div>
              <input
                className={`block w-full pl-10 pr-3 py-3 border rounded-control bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-1 focus:ring-[#FF6600] focus:border-[#FF6600] transition-colors text-sm ${
                  errors.companyName ? 'border-danger' : 'border-gray-200'
                }`}
                id="companyName"
                name="companyName"
                placeholder="Acme Inc."
                required
                type="text"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
            {errors.companyName && <p className="text-xs text-danger">{errors.companyName}</p>}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#111111]" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
              <Mail size={18} />
            </div>
            <input
              className={`block w-full pl-10 pr-3 py-3 border rounded-control bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-1 focus:ring-[#FF6600] focus:border-[#FF6600] transition-colors text-sm ${
                errors.email ? 'border-danger' : 'border-gray-200'
              }`}
              id="email"
              name="email"
              placeholder="john@example.com"
              required
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#111111]" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
                <Lock size={18} />
              </div>
              <input
                className={`block w-full pl-10 pr-10 py-3 border rounded-control bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-1 focus:ring-[#FF6600] focus:border-[#FF6600] transition-colors text-sm ${
                  errors.password ? 'border-danger' : 'border-gray-200'
                }`}
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#111111] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#111111]" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              className={`block w-full px-3 py-3 border border-gray-200 rounded-control bg-white text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-1 focus:ring-[#FF6600] focus:border-[#FF6600] transition-colors text-sm ${
                errors.confirmPassword ? 'border-danger' : 'border-gray-200'
              }`}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              required
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-danger">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-start gap-2">
            <input
              id="terms"
              name="agreeToTerms"
              type="checkbox"
              className="mt-1 rounded border-gray-300 text-[#FF6600] focus:ring-[#FF6600] h-4 w-4"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              required
            />
            <label htmlFor="terms" className="text-xs text-[#666666] leading-tight select-none">
              By creating an account, I agree to the{' '}
              <Link to="/terms-of-service" className="text-[#111111] font-semibold hover:text-[#FF6600] transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="text-[#111111] font-semibold hover:text-[#FF6600] transition-colors">
                Privacy Policy
              </Link>
              .
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-xs text-danger">{errors.agreeToTerms}</p>
          )}
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full flex justify-center py-3 font-semibold text-white transition-opacity hover:opacity-95 mt-2"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>

        {/* Secondary Action */}
        <div className="text-center pt-2">
          <p className="text-sm text-[#666666]">
            Already have an account?{' '}
            <Link className="font-semibold text-[#111111] hover:text-[#FF6600] transition-colors underline decoration-gray-200 hover:decoration-[#FF6600] underline-offset-4" to="/login">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
