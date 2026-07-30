import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

const PLANS = [
  {
    id: 'free',
    name: 'Free Plan',
    price: '₦0',
    interval: 'free forever',
    features: [
      'Connect 1 social account',
      '5 AI posts/month',
      'AI caption + hashtags',
      'Basic AI image generation',
      'Content preview',
      'Basic analytics',
      'AI/WhatsApp Support',
    ],
    badge: null,
    buttonText: 'Continue with Free',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₦30,000',
    interval: 'month',
    features: [
      'Everything in Free +',
      'Connect 3 social accounts',
      '30 AI posts/month',
      'Content Calendar',
      'Post Scheduling',
      'Brand Assets Upload',
      'Basic Analytics',
      'AI Content Suggestions',
    ],
    badge: null,
    buttonText: 'Choose Plan',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '₦100,000',
    interval: 'month',
    features: [
      'Everything in Starter +',
      'Connect 7 social accounts',
      '150 AI posts/month (Fair Use)',
      'Advanced AI Images',
      'Competitor Analysis',
      'Weekly Reports',
      '5 Team Members',
      'Approval Workflow',
    ],
    badge: 'Recommended',
    buttonText: 'Choose Plan',
  },
  {
    id: 'enterprise',
    name: 'Brand Domination / Enterprise',
    price: '₦150,000',
    interval: 'month',
    features: [
      'Everything in Growth +',
      'Connect 15 social accounts',
      '300 AI posts/month (Fair Use)',
      'Unlimited Team Members',
      'AI Marketing Strategy & Campaign Planner',
      'Multi-location support',
      'Dedicated Account Manager',
    ],
    badge: null,
    buttonText: 'Choose Plan',
  },
]

export default function ChoosePlan() {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('growth')

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
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="text-primary w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Choose your workspace plan</h1>
        <p className="text-sm text-ink-muted leading-relaxed max-w-lg mx-auto">
          Select a workspace subscription plan to unlock post scheduling and custom AI tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const isFree = plan.id === 'free'
          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col justify-between border-2 transition-all relative ${
                isSelected ? 'border-primary shadow-hover bg-primary/5' : 'border-border bg-surface'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge tone={plan.id === 'growth' ? 'primary' : 'neutral'}>{plan.badge}</Badge>
                </div>
              )}

              <div className="space-y-4">
                <div className="text-center md:text-left">
                  <h3 className="text-base font-bold text-ink">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline justify-center md:justify-start gap-1">
                    <span className="text-2xl font-extrabold text-ink">{plan.price}</span>
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
                  onClick={() => (isFree ? handleContinueFree() : handleSelectPaidPlan(plan.id))}
                  variant={isFree ? 'outline' : isSelected ? 'primary' : 'outline'}
                  className={`w-full font-semibold cursor-pointer ${
                    isFree ? 'border-primary text-primary hover:bg-primary/5' : ''
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
