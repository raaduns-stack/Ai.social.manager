import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard, RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getPlans } from '../../features/plans/plans-api'
import CheckoutButton from '../../features/payments/checkout-button'
import ErrorBanner from '../../components/error-banner'

export default function ChoosePlan() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    async function loadPlans() {
      try {
        const fetched = await getPlans()
        const order = { free: 0, starter: 1, growth: 2, enterprise: 3 }
        const sorted = [...fetched].sort((a, b) => (order[a.slug] ?? 99) - (order[b.slug] ?? 99))
        setPlans(sorted)
      } catch (err) {
        setApiError(err)
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [])

  const handleContinueFree = () => {
    localStorage.setItem('onboarding_selected_plan', 'free')
    navigate('/dashboard')
  }

  // Features list formatter matching plan tiers
  const getFeaturesList = (plan) => {
    if (Array.isArray(plan.features)) return plan.features
    if (plan.features && Array.isArray(plan.features.additional)) {
      return [
        `Connect ${plan.features.channels || 0} social accounts`,
        `${plan.features.posts || 0} posts/month`,
        ...plan.features.additional,
      ]
    }

    // Default hardcoded tiers mapping
    if (plan.slug === 'free') {
      return [
        'Connect 1 social account',
        '5 AI posts/month',
        'AI caption + hashtags',
        'Basic AI image generation',
        'Content preview',
        'Basic analytics',
        'AI/WhatsApp Support',
      ]
    } else if (plan.slug === 'starter') {
      return [
        'Everything in Free +',
        'Connect 3 social accounts',
        '30 AI posts/month',
        'Content Calendar',
        'Post Scheduling',
        'Brand Assets Upload',
        'Basic Analytics',
        'AI Content Suggestions',
      ]
    } else if (plan.slug === 'growth') {
      return [
        'Everything in Starter +',
        'Connect 7 social accounts',
        '150 AI posts/month (Fair Use)',
        'Advanced AI Images',
        'Competitor Analysis',
        'Weekly Reports',
        '5 Team Members',
        'Approval Workflow',
      ]
    } else {
      return [
        'Everything in Growth +',
        'Connect 15 social accounts',
        '300 AI posts/month (Fair Use)',
        'Unlimited Team Members',
        'AI Marketing Strategy & Campaign Planner',
        'Multi-location support',
        'Dedicated Account Manager',
      ]
    }
  }

  const formatPrice = (priceCents) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(priceCents / 100)
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

      {apiError && (
        <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
          <p className="text-sm text-ink-muted">Loading plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => {
            const isFree = plan.slug === 'free'
            const isGrowth = plan.slug === 'growth'
            const features = getFeaturesList(plan)

            return (
              <Card
                key={plan.id}
                className={`p-6 flex flex-col justify-between border-2 transition-all relative ${
                  isGrowth ? 'border-primary shadow-hover bg-primary/5' : 'border-border bg-surface'
                }`}
              >
                {isGrowth && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge tone="primary">Recommended</Badge>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="text-center md:text-left">
                    <h3 className="text-base font-bold text-ink">
                      {plan.name === 'Brand Domination' ? 'Brand Domination / Enterprise' : plan.name}
                    </h3>
                    <div className="mt-2 flex items-baseline justify-center md:justify-start gap-1">
                      <span className="text-2xl font-extrabold text-ink">{formatPrice(plan.price)}</span>
                      <span className="text-xs text-ink-muted">/{isFree ? 'free forever' : 'month'}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-ink-muted text-left border-t border-border/60 pt-4">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isFree ? (
                    <Button
                      onClick={handleContinueFree}
                      variant="outline"
                      className="w-full font-semibold cursor-pointer border-primary text-primary hover:bg-primary/5"
                    >
                      Continue with Free
                    </Button>
                  ) : (
                    <CheckoutButton
                      planId={plan.id}
                      variant={isGrowth ? 'primary' : 'outline'}
                      className="font-semibold cursor-pointer"
                    >
                      Choose Plan
                    </CheckoutButton>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
