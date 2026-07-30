import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { verifyPayment } from './payments-api'

export default function PaymentCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [status, setStatus] = useState<'success' | 'failure' | null>(null)
  const [message, setMessage] = useState('')

  const transactionId = searchParams.get('transaction_id') || searchParams.get('tx_ref')

  useEffect(() => {
    async function verify() {
      if (!transactionId) {
        setVerifying(false)
        setStatus('failure')
        setMessage('Missing transaction reference parameters in redirect URL.')
        return
      }

      try {
        const response = await verifyPayment(transactionId)
        // If server returns successful payment status
        if (response && (response.status === 'verified' || response.status === 'successful')) {
          setStatus('success')
          setMessage('Your payment was successfully verified and your subscription is active!')
        } else {
          setStatus('failure')
          setMessage(response?.message || 'We could not verify your payment transaction. Please try again.')
        }
      } catch (err: any) {
        console.error(err)
        setStatus('failure')
        setMessage(err.message || 'An error occurred during payment verification. Please reach out to support.')
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [transactionId])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas">
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <Card className="p-8 border border-border bg-surface shadow-hover">
          {verifying ? (
            <div className="space-y-4 py-8">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-ink">Verifying Payment...</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                Please do not close this window or navigate away while we verify your transaction status.
              </p>
            </div>
          ) : status === 'success' ? (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-green-500 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-ink">Payment Successful!</h2>
                <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
              </div>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-soft cursor-pointer"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="text-red-500 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-ink">Payment Failed</h2>
                <p className="text-sm text-ink-muted leading-relaxed">{message}</p>
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
      </div>
    </div>
  )
}
