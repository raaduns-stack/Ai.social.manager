import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { verifyPayment } from './payments-api'

/**
 * PaymentCallbackPage
 *
 * Flutterwave redirects users here after checkout with the following query params:
 *   - transaction_id  (numeric Flutterwave transaction ID — primary identifier)
 *   - tx_ref          (our internal reference, e.g. SPILOT-1234-ABCD)
 *   - status          ("successful" | "cancelled" | "failed")
 *
 * Steps:
 *  1. If status=cancelled, show failure immediately — no API call needed.
 *  2. Extract transaction_id (falls back to tx_ref) and call our backend verify endpoint.
 *  3. Show loading → success/failure based on the response.
 */
export default function PaymentCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [status, setStatus] = useState<'success' | 'failure' | null>(null)
  const [message, setMessage] = useState('')
  const hasCalled = useRef(false)

  // Flutterwave appends transaction_id (numeric) as the primary param.
  // tx_ref is our own reference (string) and is the fallback for older flows.
  const transactionId =
    searchParams.get('transaction_id') || searchParams.get('tx_ref')
  const flwStatus = searchParams.get('status')

  useEffect(() => {
    // Guard: only run once even in React StrictMode double-invoke
    if (hasCalled.current) return
    hasCalled.current = true

    async function verify() {
      // 1. User cancelled on Flutterwave's page
      if (flwStatus === 'cancelled') {
        setVerifying(false)
        setStatus('failure')
        setMessage('You cancelled the payment. Please choose a plan to continue.')
        return
      }

      // 2. Missing transaction reference — something went very wrong
      if (!transactionId) {
        setVerifying(false)
        setStatus('failure')
        setMessage('Missing transaction reference in the redirect URL. Please contact support.')
        return
      }

      // 3. Call our backend to re-verify with Flutterwave and fulfill the subscription
      try {
        const response = await verifyPayment(transactionId)
        if (response?.status === 'successful') {
          setStatus('success')
          setMessage(
            response.message ||
              'Your payment was successfully verified and your subscription is now active!'
          )
        } else {
          setStatus('failure')
          setMessage(
            response?.message ||
              'We could not verify your payment. Please contact support if money was deducted.'
          )
        }
      } catch (err: any) {
        console.error('Payment verification error:', err)
        setStatus('failure')
        setMessage(
          err?.message ||
            'An unexpected error occurred during verification. Please contact support.'
        )
      } finally {
        setVerifying(false)
      }
    }

    verify()
  }, [transactionId, flwStatus])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <Card className="p-8 border border-border bg-surface shadow-hover">

          {/* ── Loading ── */}
          {verifying && (
            <div className="space-y-4 py-8">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-ink">Verifying your payment…</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Please do not close this window while we confirm your transaction with Flutterwave.
              </p>
            </div>
          )}

          {/* ── Success ── */}
          {!verifying && status === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-green-500 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-ink">Payment Successful!</h2>
                <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
              </div>
              <Button
                id="go-to-dashboard-btn"
                onClick={() => navigate('/dashboard')}
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-soft cursor-pointer"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* ── Failure / Cancelled ── */}
          {!verifying && status === 'failure' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="text-red-500 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-ink">
                  {flwStatus === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  id="back-to-plans-btn"
                  onClick={() => navigate('/choose-plan')}
                  variant="primary"
                  className="w-full font-bold cursor-pointer"
                >
                  Back to Plan Selection
                </Button>
                <button
                  id="continue-to-dashboard-btn"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-semibold text-ink-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Continue to Dashboard without upgrading
                </button>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  )
}
