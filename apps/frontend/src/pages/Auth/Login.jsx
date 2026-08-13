import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Terminal, Sparkles } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/useAuth'
import ErrorBanner from '../../components/error-banner'

/**
 * Login page component converted from Stitch-generated HTML design.
 */
export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setApiError(null)

    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      setApiError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-ink">Raasocial</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink text-left">
            Log in to your account
          </h1>
          <p className="text-sm text-ink-muted text-left">
            Welcome back! Please enter your details.
          </p>
        </div>
      </div>

      {apiError && (
        <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
      )}

      {/* Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          placeholder="name@company.com"
          required
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              name="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <label htmlFor="remember-me" className="text-xs text-ink-muted leading-none">
              Remember Me
            </label>
          </div>
          <a
            className="text-xs font-medium text-primary hover:text-primary-700 transition-colors"
            href="/forgot-password"
          >
            Forgot Password?
          </a>
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold shadow-soft flex items-center justify-center gap-2 cursor-pointer"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>

      {/* Footer Link */}
      <footer className="text-center pt-2">
        <p className="text-sm text-ink-muted">
          Don't have an account?{' '}
          <a className="text-primary-600 font-bold hover:underline" href="/signup">
            Sign up
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
