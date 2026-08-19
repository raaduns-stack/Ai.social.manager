import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { getPlans } from '../features/plans/plans-api'
import ErrorBanner from '../components/error-banner'
import FinalCTA from '../components/marketing/FinalCTA'
import { PLAN_DETAILS } from '../utils/constants'

function PriceDisplay({ value, isAnnual }) {
  const displayVal = isAnnual ? Math.round(value * 12 * 0.8) : value
  const displayInterval = isAnnual ? '/yr' : '/mo'

  const formatted = value === 0 
    ? 'Free' 
    : new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
      }).format(displayVal)

  return (
    <div
      key={`${isAnnual}-${value}`}
      className="flex items-baseline gap-1 animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <span className="text-3xl font-extrabold tracking-tight text-[#111111]">{formatted}</span>
      {value > 0 && <span className="text-xs text-[#666666]">{displayInterval}</span>}
    </div>
  )
}

function PlanCard({ plan, isAnnual, onGetStarted }) {
  const price = plan.price / 100
  const isGrowth = plan.slug === 'growth'
  const isEnterprise = plan.slug === 'enterprise'

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
    featuresList = PLAN_DETAILS[plan.slug]?.features || []
  }

  return (
    <div className="relative flex flex-col h-full w-full">
      {isGrowth && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Badge
            tone="primary"
            className="px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full bg-[#FF6600] text-white animate-pulse"
          >
            Recommended
          </Badge>
        </div>
      )}

      <Card
        className={[
          'flex flex-col h-full p-6 border-2 transition-all duration-300 bg-white justify-between rounded-card',
          isGrowth
            ? 'border-[#FF6600] shadow-hover ring-1 ring-[#FF6600]/20'
            : 'border-[#E5E7EB] hover:shadow-hover hover:border-[#FF6600]/30',
        ].join(' ')}
      >
        <div>
          <div className="mb-5 text-left border-b border-gray-100 pb-5">
            <h3 className="text-xl font-bold text-[#111111] mb-2 font-['Plus_Jakarta_Sans']">
              {plan.name === 'Brand Domination' ? 'Brand Domination' : plan.name}
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed mb-4">
              {plan.description || PLAN_DETAILS[plan.slug]?.description || ''}
            </p>
            <PriceDisplay value={price} isAnnual={isAnnual} />
          </div>

          <ul className="space-y-3 mb-8 text-left">
            {featuresList.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${isGrowth ? 'text-[#FF6600]' : 'text-[#111111]'}`} />
                <span className="text-sm text-[#666666] leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => onGetStarted(plan)}
          variant={isGrowth ? 'primary' : 'outline'}
          size="md"
          className={`w-full font-bold cursor-pointer ${
            isGrowth 
              ? 'bg-[#FF6600] hover:bg-[#E05300] text-white border-transparent' 
              : 'border-[#111111] text-[#111111] hover:bg-gray-50'
          }`}
        >
          {plan.slug === 'free' ? 'Continue with Free' : 'Choose Plan'}
        </Button>
      </Card>
    </div>
  )
}

function BillingToggle({ isAnnual, onToggle }) {
  return (
    <div className="flex items-center gap-3 justify-center select-none">
      <span
        className={[
          'text-sm transition-colors',
          !isAnnual ? 'font-bold text-[#111111]' : 'text-[#666666]',
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
          'relative w-14 h-7 rounded-full border transition-colors duration-300 cursor-pointer flex items-center',
          isAnnual ? 'bg-[#FF6600] border-[#FF6600]' : 'bg-gray-200 border-gray-300',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-soft transition-transform duration-300',
            isAnnual ? 'translate-x-7' : 'translate-x-0',
          ].join(' ')}
        />
      </button>

      <div className="flex items-center gap-2">
        <span
          className={[
            'text-sm transition-colors',
            isAnnual ? 'font-bold text-[#111111]' : 'text-[#666666]',
          ].join(' ')}
        >
          Annual billing
        </span>
        <Badge
          tone="success"
          className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 bg-green-100 text-green-800"
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
    <Card className="overflow-hidden border border-gray-200 bg-white rounded-card">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 p-5 text-left focus:outline-none cursor-pointer"
      >
        <span className="text-base font-semibold text-[#111111] font-['Plus_Jakarta_Sans']">{q}</span>
        <span
          className={[
            'shrink-0 text-[#666666] transition-transform duration-300',
            open ? 'rotate-45' : 'rotate-0',
          ].join(' ')}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 animate-in fade-in duration-200">
          <p className="text-sm text-[#666666] leading-relaxed">{a}</p>
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
      a: 'Yes, we provide 24/7 support across all subscription tiers, including our Free plan.',
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

      <div className="w-full">
        <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="bg-[#FFEBE0] text-[#FF6600] font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
              Pricing Options
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight mt-4">
              Simple, transparent pricing.
            </h1>
            <p className="text-base md:text-lg text-[#666666] leading-relaxed">
              Select the plan that fits your social publishing frequency. No hidden fees.
            </p>
          </div>

          {apiError && (
            <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
          )}

          {/* Toggle */}
          <BillingToggle isAnnual={isAnnual} onToggle={() => setIsAnnual((v) => !v)} />

          {/* Plan Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="animate-spin text-[#FF6600] w-8 h-8" />
              <p className="text-sm text-[#666666]">Loading plans...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4 items-stretch">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isAnnual={isAnnual}
                  onGetStarted={handleGetStarted}
                />
              ))}
            </div>
          )}

          {/* FAQ section */}
          <section aria-labelledby="faq-heading" className="pt-16 border-t border-gray-200 max-w-3xl mx-auto">
            <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </section>
        </div>

        {/* Final CTA */}
        <FinalCTA />
      </div>
    </>
  )
}
