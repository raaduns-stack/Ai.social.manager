import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { verifyPayment } from './payments-api'
import { trackEvent } from '../../lib/analytics'

export default function PaymentCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [status, setStatus] = useState<'success' | 'failure' | null>(null)
  const [message, setMessage] = useState('')
  const [planName, setPlanName] = useState<string | null>(null)

  // Flutterwave appends both ?transaction_id=<numeric>&tx_ref=SPILOT-xxx to the redirect URL.
  // Prefer transaction_id (numeric Flutterwave ID) for direct API verification.
  const transactionId =
    searchParams.get('transaction_id') || searchParams.get('tx_ref')
  const status_param = searchParams.get('status')

  useEffect(() => {
    async function verify() {
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
        return
      }

      try {
        const response = await verifyPayment(transactionId)

        // Treat 'successful' or 'verified' as success
        if (
          response &&
          (response.status === 'successful' || response.status === 'verified')
        ) {
          const savedPlanName = localStorage.getItem('checkout_plan_name')
          if (savedPlanName) {
            const savedPlanPrice = parseFloat(localStorage.getItem('checkout_plan_price') || '0') / 100
            trackEvent('purchase', {
              transaction_id: response.paymentId || transactionId,
              value: savedPlanPrice,
              currency: 'USD',
              items: [{ item_name: savedPlanName }]
            })
            localStorage.removeItem('checkout_plan_name')
            localStorage.removeItem('checkout_plan_price')
          }
          setStatus('success')
          setMessage(
            'Your payment was successfully verified and your subscription is now active! Welcome aboard.'
          )
        } else {
          setStatus('failure')
          setMessage(
            response?.message ||
            'We could not verify your payment transaction. Please contact support.'
          )
        }
      } catch (err: any) {
        console.error('Payment verification error:', err)
        const errMsg =
          err?.response?.data?.message ||
          err.message ||
          'An unexpected error occurred during verification.'
        setStatus('failure')
        setMessage(errMsg)
      } finally {
        setVerifying(false)
      }
    }

    verify()
  }, [transactionId, status_param])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <div className="w-full max-w-md mx-auto text-center">
        <Card className="p-8 border border-border bg-surface shadow-hover">
          {verifying ? (
            <div className="space-y-4 py-8">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-ink">Verifying Payment...</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Please do not close this window or navigate away while we confirm your transaction.
              </p>
            </div>
          ) : status === 'success' ? (
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
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="text-red-500 w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-ink">Payment Failed</h2>
                <p className="text-sm text-ink-muted leading-relaxed max-w-xs mx-auto">
                  {message}
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => navigate('/choose-plan')}
                  variant="primary"
                  className="w-full font-bold cursor-pointer"
                >
                  Back to Plan Selection
                </Button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-semibold text-ink-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Continue to Dashboard
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