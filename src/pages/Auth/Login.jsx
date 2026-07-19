import { useState } from 'react'
import { Eye, EyeOff, Terminal, Sparkles } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

/**
 * Login page component converted from Stitch-generated HTML design.
 */
export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

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

  const handleSubmit = (e) => {
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

    console.log('Login submitted:', formData)
    // Perform authentication logic here
  }

  return (
    <div className="w-full space-y-8">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-ink">SocialAI</span>
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
          className="w-full font-bold shadow-soft flex items-center justify-center gap-2"
        >
          Log In
        </Button>
      </form>

      {/* Alternative Social Logins */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-4 text-ink-muted font-medium tracking-widest">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          className="bg-surface hover:bg-canvas flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            ></path>
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            ></path>
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            ></path>
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            ></path>
          </svg>
          <span className="text-sm font-medium text-ink">Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="bg-surface hover:bg-canvas flex items-center justify-center gap-2"
        >
          <Terminal size={18} className="text-ink" />
          <span className="text-sm font-medium text-ink">GitHub</span>
        </Button>
      </div>

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
        <span>© 2024 SocialPulse AI</span>
      </div>
    </div>
  )
}
