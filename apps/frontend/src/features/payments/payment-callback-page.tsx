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
<<<<<<< HEAD
  const hasCalled = useRef(false)

  // Flutterwave appends transaction_id (numeric) as the primary param.
  // tx_ref is our own reference (string) and is the fallback for older flows.
  const transactionId =
    searchParams.get('transaction_id') || searchParams.get('tx_ref')
  const flwStatus = searchParams.get('status')
=======
  const [planName, setPlanName] = useState<string | null>(null)

  // Flutterwave appends both ?transaction_id=<numeric>&tx_ref=SPILOT-xxx to the redirect URL.
  // Prefer transaction_id (numeric Flutterwave ID) for direct API verification.
  const transactionId =
    searchParams.get('transaction_id') || searchParams.get('tx_ref')
  const status_param = searchParams.get('status')
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139

  useEffect(() => {
    // Guard: only run once even in React StrictMode double-invoke
    if (hasCalled.current) return
    hasCalled.current = true

    async function verify() {
<<<<<<< HEAD
      // 1. User cancelled on Flutterwave's page
      if (flwStatus === 'cancelled') {
        setVerifying(false)
        setStatus('failure')
        setMessage('You cancelled the payment. Please choose a plan to continue.')
=======
      // Flutterwave sometimes appends status=cancelled directly in the URL
      if (status_param === 'cancelled') {
        setVerifying(false)
        setStatus('failure')
        setMessage('Payment was cancelled. Please try again or choose a different plan.')
        return
      }

      if (!transactionId) {
        setVerifying(false)
        setStatus('failure')
        setMessage('Missing transaction reference in redirect URL. Please contact support if you believe this is an error.')
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139
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
<<<<<<< HEAD
        if (response?.status === 'successful') {
          setStatus('success')
          setMessage(
            response.message ||
              'Your payment was successfully verified and your subscription is now active!'
=======

        // Treat 'successful' or 'verified' as success
        if (
          response &&
          (response.status === 'successful' || response.status === 'verified')
        ) {
          setStatus('success')
          setMessage(
            'Your payment was successfully verified and your subscription is now active! Welcome aboard.'
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139
          )
        } else {
          setStatus('failure')
          setMessage(
            response?.message ||
<<<<<<< HEAD
              'We could not verify your payment. Please contact support if money was deducted.'
=======
              'We could not verify your payment transaction. Please contact support.'
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139
          )
        }
      } catch (err: any) {
        console.error('Payment verification error:', err)
<<<<<<< HEAD
        setStatus('failure')
        setMessage(
          err?.message ||
            'An unexpected error occurred during verification. Please contact support.'
        )
=======
        const errMsg =
          err?.response?.data?.message ||
          err.message ||
          'An unexpected error occurred during verification.'
        setStatus('failure')
        setMessage(errMsg)
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139
      } finally {
        setVerifying(false)
      }
    }

    verify()
<<<<<<< HEAD
  }, [transactionId, flwStatus])
=======
  }, [transactionId, status_param])
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <div className="w-full max-w-md mx-auto text-center">
        <Card className="p-8 border border-border bg-surface shadow-hover">

          {/* ── Loading ── */}
          {verifying && (
            <div className="space-y-4 py-8">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-ink">Verifying your payment…</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
<<<<<<< HEAD
                Please do not close this window while we confirm your transaction with Flutterwave.
=======
                Please do not close this window or navigate away while we confirm your transaction.
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139
              </p>
            </div>
          )}

          {/* ── Success ── */}
          {!verifying && status === 'success' && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-green-500 w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-ink">Payment Successful! 🎉</h2>
                <p className="text-sm text-ink-muted leading-relaxed max-w-xs mx-auto">
                  {message}
                </p>
              </div>
              <div className="pt-2 space-y-3">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="primary"
                  className="w-full font-bold shadow-soft cursor-pointer"
                >
                  Go to Dashboard
                </Button>
                <button
                  onClick={() => navigate('/dashboard/billing')}
                  className="text-xs font-semibold text-ink-muted hover:text-primary transition-colors cursor-pointer"
                >
                  View Billing & Invoices
                </button>
              </div>
<<<<<<< HEAD
              <Button
                id="go-to-dashboard-btn"
                onClick={() => navigate('/dashboard')}
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-soft cursor-pointer"
              >
                Go to Dashboard
              </Button>
=======
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139
            </div>
          )}

          {/* ── Failure / Cancelled ── */}
          {!verifying && status === 'failure' && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="text-red-500 w-12 h-12" />
              </div>
              <div className="space-y-2">
<<<<<<< HEAD
                <h2 className="text-2xl font-extrabold text-ink">
                  {flwStatus === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
=======
                <h2 className="text-2xl font-extrabold text-ink">Payment Failed</h2>
                <p className="text-sm text-ink-muted leading-relaxed max-w-xs mx-auto">
                  {message}
                </p>
>>>>>>> 64ebcd995e36f72d86b1fe6fce53d5edac100139
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

        {/* Transaction reference for debugging */}
        {transactionId && (
          <p className="mt-4 text-[10px] text-ink-muted/50">
            Ref: {transactionId}
          </p>
        )}
      </div>
    </div>
  )
}
