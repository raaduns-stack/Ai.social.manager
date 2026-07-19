import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

/**
 * ForgotPassword page component converted from Stitch-generated HTML design.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email address')
      return
    }

    console.log('Reset password request for:', email)
    // Perform password reset API call here
    setSuccess(true)
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-2 text-left">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Reset your password
        </h1>
        <p className="text-sm text-ink-muted">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="p-4 bg-accent-50 text-accent-600 rounded-control text-sm border border-accent-100">
            A password reset link has been sent to <strong className="font-semibold">{email}</strong>. Please check your inbox.
          </div>
          <Button
            type="button"
            variant="outline"
            as="a"
            href="/login"
            className="w-full font-bold flex items-center justify-center gap-2 bg-surface hover:bg-canvas"
          >
            <ArrowLeft size={18} />
            Back to Log In
          </Button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            placeholder="name@company.com"
            required
            value={email}
            onChange={handleChange}
            error={error}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-soft"
          >
            Send Reset Link
          </Button>

          {/* Navigation back */}
          <div className="pt-2 text-center">
            <a
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-primary-600 transition-colors duration-150"
              href="/login"
            >
              <ArrowLeft size={16} />
              Back to Log In
            </a>
          </div>
        </form>
      )}

      {/* Bottom Copyright */}
      <div className="text-center text-xs text-ink-muted/60 pt-4 border-t border-border/60">
        <span>© 2024 SocialPulse AI</span>
      </div>
    </div>
  )
}
