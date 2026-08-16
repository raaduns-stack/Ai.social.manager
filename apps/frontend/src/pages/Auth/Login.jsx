import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/useAuth'
import ErrorBanner from '../../components/error-banner'

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
      {/* Form Header */}
      <div className="text-left space-y-2">
        <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#111111] tracking-tight">Sign In</h2>
        <p className="text-sm text-[#666666]">Welcome back. Please enter your details.</p>
      </div>

      {apiError && (
        <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
      )}

      {/* Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="space-y-2">
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
              placeholder="name@company.com"
              required
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-[#111111]" htmlFor="password">
              Password
            </label>
            <Link className="text-xs font-semibold text-[#111111] hover:text-[#FF6600] transition-colors" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
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

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            name="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[#FF6600] focus:ring-[#FF6600]"
            checked={formData.rememberMe}
            onChange={handleChange}
          />
          <label htmlFor="remember-me" className="text-xs text-[#666666] leading-none select-none">
            Remember Me
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full flex justify-center py-3 font-semibold text-white transition-opacity hover:opacity-95"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>

        {/* Secondary Action */}
        <div className="text-center pt-2">
          <p className="text-sm text-[#666666]">
            Don't have an account?{' '}
            <Link className="font-semibold text-[#111111] hover:text-[#FF6600] transition-colors underline decoration-gray-200 hover:decoration-[#FF6600] underline-offset-4" to="/signup">
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
