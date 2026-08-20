import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CheckCircle2, CreditCard, RefreshCw } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { getPlans } from '../../features/plans/plans-api'
import CheckoutButton from '../../features/payments/checkout-button'
import ErrorBanner from '../../components/error-banner'
import { PLAN_DETAILS } from '../../utils/constants'

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

  const getFeaturesList = (plan) => {
    if (!plan) return []
    let features = plan.features
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features)
      } catch (e) {}
    }

    if (Array.isArray(features)) return features
    
    if (features && Array.isArray(features.additional)) {
      return [
        `Connect ${features.channels || 0} social accounts`,
        `${features.posts || 0} posts/month`,
        ...features.additional,
      ]
    }

    return PLAN_DETAILS[plan.slug]?.features || []
  }

  const formatPrice = (plan) => {
    if (plan.slug === 'free') return 'Free'
    if (plan.slug === 'enterprise') return 'Custom'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(plan.price / 100)
  }

  return (
    <div className="w-full space-y-12 py-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl md:text-5xl font-bold font-['Plus_Jakarta_Sans'] text-[#111111] tracking-tight">
          Select your growth engine.
        </h1>
        <p className="text-base md:text-lg text-[#666666] leading-relaxed">
          Scalable plans designed for teams that move fast.
        </p>
      </div>

      {apiError && (
        <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <RefreshCw className="animate-spin text-[#FF6600] w-8 h-8" />
          <p className="text-sm text-[#666666]">Loading plans...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[1000px] mx-auto items-stretch relative z-10 pt-4">
            {plans.filter((p) => p.slug !== 'free').map((plan) => {
              const isGrowth = plan.slug === 'growth'
              const isEnterprise = plan.slug === 'enterprise'
              const features = getFeaturesList(plan)

              return (
                <Card
                  key={plan.id}
                  className={`bg-white border rounded-xl p-8 flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300 relative ${
                    isGrowth ? 'border-2 border-[#FF6600] shadow-md scale-105 z-10' : 'border-gray-200 shadow-sm'
                  }`}
                >
                  {isGrowth && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-[#FF6600] text-white font-semibold text-xs px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-[#111111] font-['Plus_Jakarta_Sans'] tracking-tight mb-2">
                        {plan.name === 'Brand Domination' ? 'Enterprise' : plan.name}
                      </h3>
                      <p className="text-sm text-[#666666] leading-relaxed mb-4">
                        {plan.description || PLAN_DETAILS[plan.slug]?.description || ''}
                      </p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-extrabold text-[#111111] font-['Plus_Jakarta_Sans'] tracking-tight">
                          {formatPrice(plan)}
                        </span>
                        {!isEnterprise && (
                          <span className="text-sm text-[#666666]">/mo</span>
                        )}
                      </div>
                    </div>

                    <ul className="flex flex-col space-y-3.5 border-t border-gray-100 pt-6">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-left">
                          <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${isGrowth ? 'text-[#FF6600]' : 'text-[#111111]'}`} />
                          <span className="text-sm text-[#666666]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    {isEnterprise ? (
                      <Button
                        as={Link}
                        to="/contact"
                        variant="outline"
                        className="w-full py-3 font-semibold text-[#111111] border-[#111111] hover:bg-gray-50"
                      >
                        Contact Sales
                      </Button>
                    ) : (
                      <CheckoutButton
                        planId={plan.id}
                        planName={plan.name}
                        price={plan.price}
                        variant={isGrowth ? 'primary' : 'outline'}
                        className={`w-full py-3 font-semibold ${
                          isGrowth
                            ? 'bg-[#FF6600] text-white hover:bg-[#E65C00]'
                            : 'text-[#111111] border-[#111111] hover:bg-gray-50'
                        }`}
                      >
                        Choose {plan.name}
                      </CheckoutButton>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Onboarding Bottom Actions */}
          <div className="flex items-center justify-between w-full max-w-[1000px] mx-auto mt-12 pt-6 border-t border-gray-200">
            <button
              onClick={handleContinueFree}
              className="px-6 py-2 font-semibold text-[#666666] hover:text-[#111111] transition-colors cursor-pointer"
            >
              Skip for now
            </button>
            <Button
              onClick={handleContinueFree}
              variant="primary"
              className="px-8 py-3 bg-[#FF6600] text-white rounded font-semibold hover:bg-[#E65C00] transition-all active:scale-95 shadow-sm"
            >
              Continue with Free
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
