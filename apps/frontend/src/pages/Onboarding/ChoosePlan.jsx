import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₦15,000',
    interval: 'month',
    features: ['3 social accounts', '30 scheduled posts/mo', 'Standard AI content builder'],
    badge: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₦45,000',
    interval: 'month',
    features: ['8 social accounts', '150 scheduled posts/mo', 'Advanced AI & custom templates', 'Priority queue support'],
    badge: 'Popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₦150,000',
    interval: 'month',
    features: ['25 social accounts', '1,000 scheduled posts/mo', 'Dedicated account manager', 'API access & custom controls'],
    badge: 'Custom',
  },
]

export default function ChoosePlan() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('pro')

  const handleSelectPaidPlan = (planId) => {
    localStorage.setItem('onboarding_selected_plan', planId)
    navigate('/payment')
  }

  const handleContinueFree = () => {
    localStorage.setItem('onboarding_selected_plan', 'free')
    // Bypasses /payment and /payment-verification, goes straight to dashboard
    navigate('/dashboard')
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="text-primary w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Choose your workspace plan</h1>
        <p className="text-sm text-ink-muted leading-relaxed max-w-lg mx-auto">
          Unlock the full power of scheduled postings, visual analytics, and premium AI features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id
          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col justify-between border-2 transition-all relative ${
                isSelected ? 'border-primary shadow-hover bg-primary/5' : 'border-border bg-surface'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge tone={plan.id === 'pro' ? 'primary' : 'neutral'}>{plan.badge}</Badge>
                </div>
              )}

              <div className="space-y-4">
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline justify-center md:justify-start gap-1">
                    <span className="text-3xl font-extrabold text-ink">{plan.price}</span>
                    <span className="text-xs text-ink-muted">/{plan.interval}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-ink-muted text-left border-t border-border/60 pt-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  onClick={() => handleSelectPaidPlan(plan.id)}
                  variant={isSelected ? 'primary' : 'outline'}
                  className="w-full font-semibold cursor-pointer"
                >
                  Get {plan.name}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="pt-4 text-center border-t border-border max-w-sm mx-auto space-y-4">
        <Button
          onClick={handleContinueFree}
          variant="outline"
          size="lg"
          className="w-full font-bold shadow-soft flex items-center justify-center gap-2 cursor-pointer border-dashed"
        >
          Continue with Free Plan
        </Button>
        <p className="text-[11px] text-ink-muted">
          Our Free plan allows 1 social profile connection and up to 5 scheduled posts per month.
        </p>
      </div>
    </div>
  )
}
