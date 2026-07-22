import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { CheckCircle2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 49,
    annual: 39,
    features: [
      '5 social accounts',
      'Basic analytics dashboard',
      'Standard AI generation',
    ],
    recommended: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly: 99,
    annual: 79,
    features: [
      '15 social accounts',
      'Advanced analytics & reporting',
      'Custom AI training & templates',
      'Priority generation queue',
    ],
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 249,
    annual: 199,
    features: [
      'Unlimited social accounts',
      'Full API access for integrations',
      'Dedicated success manager',
      'Custom security controls',
    ],
    recommended: false,
  },
]

const FAQS = [
  {
    q: 'Can I change plans later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
  },
  {
    q: 'Is there a free version?',
    a: 'All plans are paid to ensure we provide a premium, ad-free service with high-performance AI generation and dedicated resources for every user.',
  },
  {
    q: 'Do you offer discounts for non-profits?',
    a: 'We support organizations making an impact. Please contact our support team with your non-profit documentation to apply for special rates.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, PayPal, and bank transfers for Pro annual plans.',
  },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Animated price — React key trick causes re-mount on billing change,
 * triggering the CSS fade-in without any external animation library.
 */
function PriceDisplay({ value, isAnnual }) {
  return (
    <div
      key={`${isAnnual}-${value}`}
      className="flex items-baseline gap-1"
      style={{ animation: 'priceFadeIn 0.15s ease-out forwards' }}
    >
      <span className="text-4xl font-bold tracking-tight text-ink">${value}</span>
      <span className="text-sm text-ink-muted">/mo</span>
    </div>
  )
}

/** Individual pricing card */
function PlanCard({ plan, isAnnual }) {
  const price = isAnnual ? plan.annual : plan.monthly

  return (
    <div className="relative flex flex-col">
      {plan.recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Badge
            tone="primary"
            className="px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full"
          >
            Recommended
          </Badge>
        </div>
      )}

      <Card
        className={[
          'flex flex-col h-full p-6 transition-all duration-150',
          plan.recommended
            ? 'border-2 border-primary shadow-hover ring-1 ring-primary/20'
            : 'hover:shadow-hover hover:border-primary/30',
        ].join(' ')}
        hover={!plan.recommended}
      >
        {/* Plan name + price */}
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-ink mb-2">{plan.name}</h3>
          <PriceDisplay value={price} isAnnual={isAnnual} />
        </div>

        {/* Feature list */}
        <ul className="flex-grow space-y-3 mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-accent-500" />
              <span className="text-sm text-ink-muted">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          variant={plan.recommended ? 'primary' : 'outline'}
          size="md"
          className="w-full"
        >
          Get Started
        </Button>
      </Card>
    </div>
  )
}

/** Billing cycle pill toggle */
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
          'relative w-14 h-7 rounded-full border transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
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

/** Collapsible FAQ row */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <span className="text-sm font-semibold text-ink">{q}</span>
        <span
          aria-hidden="true"
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
/**
 * Pricing — converted from Stitch design.
 * Rendered inside DashboardLayout; nav/sidebar/footer are handled there.
 */
export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <>
      {/* Keyframe for price number animation */}
      <style>{`
        @keyframes priceFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-10">
        {/* Page hero */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
            Simple, transparent pricing
          </h1>
          <p className="text-base text-ink-muted max-w-xl mx-auto">
            Choose the plan that&apos;s right for your growth.
          </p>
        </div>

        {/* Billing toggle */}
        <BillingToggle isAnnual={isAnnual} onToggle={() => setIsAnnual((v) => !v)} />

        {/* Plan cards — extra top padding so the "Recommended" badge isn't clipped */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} isAnnual={isAnnual} />
          ))}
        </div>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="pt-4 border-t border-border">
          <h2
            id="faq-heading"
            className="text-xl font-semibold text-ink text-center mb-6"
          >
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section
          aria-labelledby="cta-heading"
          className="relative overflow-hidden rounded-card bg-primary p-10 text-center"
        >
          {/* Dot-grid texture overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10">
            <h2
              id="cta-heading"
              className="text-3xl font-bold text-white mb-3 tracking-tight"
            >
              Ready to automate your growth?
            </h2>
            <p className="text-sm text-primary-100 mb-6 max-w-md mx-auto">
              Join 10,000+ businesses scaling their presence with precision AI tools.
            </p>
            <button className="inline-flex items-center justify-center px-8 py-3 rounded-control bg-white text-primary text-sm font-bold shadow-hover hover:bg-primary-50 transition-colors">
              Create Your Account
            </button>
          </div>
        </section>
      </div>
    </>
  )
}
