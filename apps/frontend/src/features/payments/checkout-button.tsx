import { useState } from 'react'
import Button from '../../components/ui/Button'
import { initializePayment } from './payments-api'

export default function CheckoutButton({ planId, className, children = 'Choose Plan', variant = 'primary' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await initializePayment(planId)
      if (response && response.link) {
        window.location.href = response.link
      } else {
        throw new Error('No checkout link returned from server.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Payment initialization failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
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
      {error && <p className="text-[10px] text-danger mt-1.5 text-center">{error}</p>}
    </div>
  )
}
