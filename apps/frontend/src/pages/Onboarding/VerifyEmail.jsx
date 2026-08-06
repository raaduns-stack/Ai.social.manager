import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuthStore } from '../../store/auth-store'
import apiClient from '../../lib/api-client'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const email = searchParams.get('email') || user?.email || 'user@example.com'

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [resendStatus, setResendStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ]

  useEffect(() => {
    if (countdown === 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs[index - 1].current.focus()
    }
  }

  const handleResend = async (e) => {
    e.preventDefault()
    if (countdown > 0) return
    setResendStatus('sending')
    setError('')
    try {
      await apiClient.post('/auth/resend-verification', { email })
      setResendStatus('sent')
      setCountdown(60)
      setTimeout(() => setResendStatus(''), 3000)
    } catch (err) {
      setResendStatus('')
      setError(err?.message || 'Failed to resend verification code. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await apiClient.post('/auth/verify-email', {
        email,
        code: fullCode,
      })
      const { user: verifiedUser, accessToken, refreshToken } = response.data
      setAuth(verifiedUser, accessToken, refreshToken)
      navigate('/choose-plan')
    } catch (err) {
      setError(err?.message || 'Verification failed. Please check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-center">
      <div className="space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="text-primary w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Verify your email</h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          We sent a 6-digit verification code to <strong className="text-ink">{email}</strong>.
          Enter the code below to activate your account.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2 max-w-xs mx-auto">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-bold rounded-control border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-ink"
                required
              />
            ))}
          </div>

          {error && <p className="text-xs text-danger text-center">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-semibold flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="mt-6 text-xs text-ink-muted">
          Didn't receive the email?{' '}
          <button
            onClick={handleResend}
            disabled={countdown > 0 || resendStatus === 'sending'}
            className={`font-semibold inline-flex items-center gap-1 ${
              countdown > 0 || resendStatus === 'sending'
                ? 'text-ink-muted/50 cursor-not-allowed'
                : 'text-primary hover:underline cursor-pointer'
            }`}
          >
            {resendStatus === 'sending' ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Resending...
              </>
            ) : resendStatus === 'sent' ? (
              <span className="text-accent">✓ Code resent!</span>
            ) : countdown > 0 ? (
              `Resend code in ${countdown}s`
            ) : (
              'Resend code'
            )}
          </button>
        </div>
      </Card>
    </div>
  )
}
