import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required.')
      return false
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      return false
    }
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccess(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-sm rounded-card border border-[#E5E7EB] bg-white p-8">
        <h1 className="text-lg font-semibold text-[#111827]">Reset Admin Password</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Enter your admin email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div className="mt-6 space-y-4">
            <div className="p-3 bg-accent-50 text-accent-600 rounded-lg text-xs border border-accent-100 leading-relaxed">
              A password reset link has been sent to <strong className="font-semibold">{email}</strong>. Please check your inbox.
            </div>
            
            <Button
              as={Link}
              to="/admin/login"
              variant="outline"
              className="w-full font-bold flex items-center justify-center gap-2 bg-surface hover:bg-canvas text-sm py-2 rounded-lg border border-[#E5E7EB]"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#111827]">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-2.5 text-[#6B7280]" />
                <input
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="you@raaduns.com"
                  className={`w-full rounded-lg border px-9 py-2 text-sm outline-none ${
                    error ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
                  }`}
                  required
                />
              </div>
              {error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-95 transition-opacity"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 text-xs font-medium text-[#6B7280] hover:text-[#4F46E5] transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
