/**
 * Pricing Component
 * 
 * Marketing and upgrade page that lists all available subscription plans,
 * their features, and pricing details.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { getPlans } from '../features/plans/plans-api'
import ErrorBanner from '../components/error-banner'

function PriceDisplay({ value, isAnnual }) {
  const displayVal = isAnnual ? Math.round(value * 12 * 0.8) : value
  const displayInterval = isAnnual ? '/yr' : '/mo'

  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(displayVal)

  return (
    <div
      key={`${isAnnual}-${value}`}
      className="flex items-baseline gap-1 animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <span className="text-3xl font-extrabold tracking-tight text-ink">{formatted}</span>
      <span className="text-xs text-ink-muted">{displayInterval}</span>
    </div>
  )
}

function PlanCard({ plan, isAnnual, onGetStarted }) {
  const price = plan.price / 100
  const isGrowth = plan.slug === 'growth'

  // Bulletproof features list mapper
  let featuresList = []
  if (Array.isArray(plan.features)) {
    featuresList = plan.features
  } else if (plan.features && Array.isArray(plan.features.additional)) {
    featuresList = [
      `Connect ${plan.features.channels || 0} social accounts`,
      `${plan.features.posts || 0} posts/month`,
      ...plan.features.additional,
    ]
  } else {
    // Hardcoded fallback list matching standard tiers
    if (plan.slug === 'free') {
      featuresList = [
        'Connect 1 social account',
        '5 AI posts/month',
        'AI caption + hashtags',
        'Basic AI image generation',
        'Content preview',
        'Basic analytics',
      ]
    } else if (plan.slug === 'starter') {
      featuresList = [
        'Connect 3 social accounts',
        '30 AI posts/month',
        'Content Calendar',
        'Post Scheduling',
        'Brand Assets Upload',
        'Basic Analytics',
        'AI Content Suggestions',
      ]
    } else if (plan.slug === 'growth') {
      featuresList = [
        'Connect 7 social accounts',
        '150 AI posts/month (Fair Use)',
        'Advanced AI Images',
        'Competitor Analysis',
        'Weekly Reports',
        '5 Team Members',
        'Approval Workflow',
      ]
    } else {
      featuresList = [
        'Connect 15 social accounts',
        '300 AI posts/month (Fair Use)',
        'Unlimited Team Members',
        'AI Marketing Strategy & Campaign Planner',
        'Multi-location support',
        'Dedicated Account Manager',
      ]
    }
  }

  return (
    <div className="relative flex flex-col">
      {isGrowth && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Badge
            tone="primary"
            className="px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full animate-pulse"
          >
            Recommended
          </Badge>
        </div>
      )}

      <Card
        className={[
          'flex flex-col h-full p-6 border-2 transition-all duration-150',
          isGrowth
            ? 'border-primary shadow-hover bg-primary/5 ring-1 ring-primary/20'
            : 'border-border hover:shadow-hover hover:border-primary/30',
        ].join(' ')}
      >
        <div className="mb-5 text-left">
          <h3 className="text-lg font-bold text-ink mb-2">
            {plan.name === 'Brand Domination' ? 'Brand Domination / Enterprise' : plan.name}
          </h3>
          <PriceDisplay value={price} isAnnual={isAnnual} />
        </div>

        <ul className="flex-grow space-y-3 mb-6 text-left">
          {featuresList.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm text-ink-muted">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={() => onGetStarted(plan)}
          variant={isGrowth ? 'primary' : 'outline'}
          size="md"
          className="w-full font-semibold cursor-pointer"
        >
          {plan.slug === 'free' ? 'Continue with Free' : 'Choose Plan'}
        </Button>
      </Card>
    </div>
  )
}

function BillingToggle({ isAnnual, onToggle }) {
  return (
    <div className="flex items-center gap-3 justify-center">
      <span
        className={[
          'text-sm transition-colors',
          !isAnnual ? 'font-semibold text-ink' : 'text-ink-muted',
        ].join(' ')}
      >
        Monthly billing
      </span>

      <button
        id="billing-toggle"
        role="switch"
        aria-checked={isAnnual}
        onClick={onToggle}
        className={[
          'relative w-14 h-7 rounded-full border transition-colors duration-200 cursor-pointer',
          isAnnual ? 'bg-primary border-primary' : 'bg-canvas border-border',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-soft transition-transform duration-200',
            isAnnual ? 'translate-x-7' : 'translate-x-0',
          ].join(' ')}
        />
      </button>

      <div className="flex items-center gap-2">
        <span
          className={[
            'text-sm transition-colors',
            isAnnual ? 'font-semibold text-ink' : 'text-ink-muted',
          ].join(' ')}
        >
          Annual billing
        </span>
        <Badge
          tone="success"
          className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
        >
          Save 20%
        </Badge>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 p-4 text-left focus:outline-none cursor-pointer"
      >
        <span className="text-sm font-semibold text-ink">{q}</span>
        <span
          className={[
            'shrink-0 text-ink-muted transition-transform duration-200',
            open ? 'rotate-45' : 'rotate-0',
          ].join(' ')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-ink-muted">{a}</p>
        </div>
      )}
    </Card>
  )
}

export default function Pricing() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    async function loadPlans() {
      try {
        const fetched = await getPlans()
        // Sort plans so Free is first, then starter, growth, enterprise
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

  const handleGetStarted = (plan) => {
    navigate(`/signup?plan=${plan.id}`)
  }

  const faqs = [
    {
      q: 'Can I change plans later?',
      a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
    },
    {
      q: 'Is there a free version?',
      a: 'Yes! We offer a Free Plan allowing 1 social account connection and up to 5 automated posts per month.',
    },
    {
      q: 'Do you offer support?',
      a: 'Yes, we provide 24/7 AI support across all subscription tiers, including our Free plan.',
    },
  ]

  return (
    <>
      <style>{`
        @keyframes priceFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
            Simple, transparent pricing
          </h1>
          <p className="text-base text-ink-muted max-w-xl mx-auto">
            Choose the plan that's right for your growth.
          </p>
        </div>

        {apiError && (
          <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
        )}

        {/* <BillingToggle isAnnual={isAnnual} onToggle={() => setIsAnnual((v) => !v)} /> */}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <RefreshCw className="animate-spin text-primary w-8 h-8" />
            <p className="text-sm text-ink-muted">Loading plans...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-md mx-auto pt-4">
            {plans.filter((p) => p.slug === 'free').map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                onGetStarted={handleGetStarted}
              />
            ))}
          </div>
        )}

        <section aria-labelledby="faq-heading" className="pt-4 border-t border-border">
          <h2 id="faq-heading" className="text-xl font-semibold text-ink text-center mb-6">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
