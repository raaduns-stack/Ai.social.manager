import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { initializePayment } from './payments-api'
import ErrorBanner from '../../components/error-banner'

export default function CheckoutButton({ planId, className, children = 'Choose Plan', variant = 'primary' }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await initializePayment(planId)
      // Check both response.link and response.data.link
      const link = (response as any)?.link || (response as any)?.data?.link
      if (link) {
        window.location.href = link
      } else {
        throw new Error('No checkout link was returned from the server.')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      const errorMessage = err?.response?.data?.message || err.message || 'Payment initialization failed.'
      setError(new Error(errorMessage))
      // Optional fallback: navigate to manual payment or dashboard
      // navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      {error && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}
      
      <Button
        onClick={handleCheckout}
        disabled={loading}
        variant={variant}
        className={className}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-1.5">
            <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Redirecting...
          </span>
        ) : (
          children
        )}
      </Button>
    </div>
  )
}
