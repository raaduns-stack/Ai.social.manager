import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Banner({ planId, planName }) {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!planId) return
    const hidden = localStorage.getItem(`sp_hide_plan_banner_v1_${planId}`)
    if (!hidden) {
      setIsVisible(true)
    }
  }, [planId])

  const handleDismiss = () => {
    if (planId) {
      localStorage.setItem(`sp_hide_plan_banner_v1_${planId}`, 'true')
    }
    setIsVisible(false)
  }

  if (!isVisible || !planId) return null

  const isFree = planName?.toLowerCase().includes('free')

  // Only show banner for free tier
  if (!isFree) {
    return null
  }

  return (
    <div className="bg-warning/10 border border-warning/20 text-warning-700 px-4 py-3 flex items-center justify-between text-sm w-full rounded-md mb-6 shadow-sm">
      <div className="flex-1 font-medium text-warning">
        You are currently on the Free Plan. Upgrade to Starter to unlock 30 AI posts/month.
        <button 
          onClick={() => navigate('/dashboard/billing')} 
          className="ml-3 underline font-bold hover:text-warning/80"
        >
          Upgrade Now
        </button>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-1 rounded-control hover:bg-warning/20 transition-colors ml-4 shrink-0 text-warning"
        aria-label="Dismiss banner"
      >
        <X size={16} />
      </button>
    </div>
  )
}
