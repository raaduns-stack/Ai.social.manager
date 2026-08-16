import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import Button from '../../components/ui/Button'

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
    setSuccess(true)
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-left space-y-2">
        <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#111111] tracking-tight">
          Reset password
        </h2>
        <p className="text-sm text-[#666666]">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {success ? (
        <div className="space-y-6">
          <div className="p-4 bg-[#FFF5F0] text-[#FF6600] rounded-control text-sm border border-[#FFEBE0]">
            A password reset link has been sent to <strong className="font-semibold">{email}</strong>. Please check your inbox.
          </div>
          <Button
            as={Link}
            to="/login"
            variant="outline"
            className="w-full font-semibold flex items-center justify-center gap-2 border-gray-300 text-[#111111] hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to Log In
          </Button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email address field */}
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
                  error ? 'border-danger' : 'border-gray-200'
                }`}
                id="email"
                name="email"
                placeholder="name@company.com"
                required
                type="email"
                value={email}
                onChange={handleChange}
              />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-semibold text-white hover:opacity-95"
          >
            Send Reset Link
          </Button>

          {/* Navigation back */}
          <div className="text-center pt-2">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#666666] hover:text-[#111111] transition-colors"
              to="/login"
            >
              <ArrowLeft size={16} />
              Back to Log In
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
