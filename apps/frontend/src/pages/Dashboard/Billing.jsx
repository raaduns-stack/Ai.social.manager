/**
 * Billing Component
 * 
 * Displays the user's current subscription plan, billing history, and provides 
 * a way to upgrade or downgrade plans. Integrates with the backend /subscription API.
 */
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import {
  CreditCard,
  Lock,
  CheckCircle2,
  Download,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { getMySubscription, cancelSubscription } from '../../features/subscriptions/subscriptions-api'
import { getPlans } from '../../features/plans/plans-api'
import { getInvoices } from '../../features/invoices/invoices-api'
import ErrorBanner from '../../components/error-banner'
import CheckoutButton from '../../features/payments/checkout-button'

export default function Billing() {
  const location = useLocation()
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // State for payment method
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'Visa',
    ending: '4242',
    expiry: '12/2025',
    cardholder: 'Alex Rivera',
  })

  // State for pagination
  const [currentPage, setCurrentPage] = useState(0)

  // Modals state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isManagePlanModalOpen, setIsManagePlanModalOpen] = useState(false)

  // Edit payment card form state
  const [cardholderName, setCardholderName] = useState(paymentMethod.cardholder)
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState(paymentMethod.expiry)
  const [cardCvv, setCardCvv] = useState('***')
  const [paymentError, setPaymentError] = useState('')

  // Support ticket form state
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSubmitted, setSupportSubmitted] = useState(false)

  // Fetch subscription, plans and invoices on mount
  useEffect(() => {
    async function loadData() {
      try {
        const sub = await getMySubscription()
        setSubscription(sub)
      } catch (err) {
        console.error('Failed to load subscription:', err)
      }
      try {
        const fetchedPlans = await getPlans()
        const order = { free: 0, starter: 1, growth: 2, enterprise: 3 }
        const sorted = [...fetchedPlans].sort((a, b) => (order[a.slug] ?? 99) - (order[b.slug] ?? 99))
        setPlans(sorted)
      } catch (err) {
        console.error('Failed to load plans:', err)
        setError(err)
      }
      try {
        const fetchedInvoices = await getInvoices()
        setInvoices(fetchedInvoices)
      } catch (err) {
        console.error('Failed to load invoices:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  // location.key changes every time React Router navigates to this page,
  // ensuring we never display stale plan data after returning from /payments/callback
  }, [location.key])

  const handleCancelSub = async () => {
    setCancelling(true)
    try {
      await cancelSubscription()
      const sub = await getMySubscription()
      setSubscription(sub)
      setIsCancelModalOpen(false)
      alert('Subscription cancelled successfully.')
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription.')
    } finally {
      setCancelling(false)
    }
  }

  // Active plan details helpers
  const activePlanSlug = subscription?.plan?.slug || 'free'
  const activePlanName = subscription?.plan?.name || 'Free Plan'
  const activePlanStatus = subscription?.status || 'active'
  const activePlanPrice = subscription?.plan?.price !== undefined ? subscription.plan.price : 0
  const activePlanInterval = subscription?.plan?.interval || 'monthly'
  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'No Billing'

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  // Features list formatter matching plan tiers
  const getFeaturesList = (planSlug) => {
    if (planSlug === 'free') {
      return [
        'Connect 1 social account',
        '5 AI posts/month',
        'AI caption + hashtags',
        'Basic AI image generation',
        'Content preview',
        'Basic analytics',

      ]
    } else if (planSlug === 'starter') {
      return [
        'Everything in Free, plus:',
        'Connect 3 social accounts',
        '30 AI posts/month',
        'Content Calendar',
        'Post Scheduling',
        'Brand Assets Upload',
        'Basic Analytics',
        'AI Content Suggestions',
      ]
    } else if (planSlug === 'growth') {
      return [
        'Everything in Starter, plus:',
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
        'Everything in Growth, plus:',
        'Connect 15 social accounts',
        '300 AI posts/month (Fair Use)',
        'Unlimited Team Members',
        'AI Marketing Strategy & Campaign Planner',
        'Multi-location support',
        'Dedicated Account Manager',
      ]
    }
  }

  const activePlanFeatures = getFeaturesList(activePlanSlug)

  // Pagination calculations
  const itemsPerPage = 4
  const totalPages = Math.ceil(invoices.length / itemsPerPage) || 1
  const paginatedInvoices = invoices.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    if (!cardholderName.trim()) {
      setPaymentError('Cardholder name is required.')
      return
    }
    if (cardNumber.replace(/\s+/g, '').length < 12) {
      setPaymentError('Please enter a valid card number.')
      return
    }
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
      setPaymentError('Expiry date must be in MM/YY format.')
      return
    }

    setPaymentError('')
    const endingNumber = cardNumber.slice(-4)
    setPaymentMethod({
      type: cardNumber.startsWith('5') ? 'Mastercard' : 'Visa',
      ending: endingNumber || '4242',
      expiry: cardExpiry,
      cardholder: cardholderName,
    })
    setIsPaymentModalOpen(false)
  }

  const handleSupportSubmit = (e) => {
    e.preventDefault()
    if (!supportSubject.trim() || !supportMessage.trim()) {
      return
    }
    setSupportSubmitted(true)
    setTimeout(() => {
      setIsSupportModalOpen(false)
      setSupportSubmitted(false)
      setSupportSubject('')
      setSupportMessage('')
      alert('Support query submitted successfully! Our billing team will reach out to you within 24 hours.')
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your workspace plans and payment settings."
        action={
          <Button
            variant="outline"
            className="flex items-center gap-1.5 font-medium text-primary hover:underline hover:bg-canvas cursor-pointer"
            onClick={() => setIsSupportModalOpen(true)}
          >
            <HelpCircle size={18} />
            Contact Billing Support
          </Button>
        }
      />

      {error && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
          <p className="text-sm text-ink-muted">Loading subscription details...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Current Plan Overview */}
            <div className="lg:col-span-2">
              <Card className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Badge tone={activePlanStatus === 'active' ? 'success' : 'neutral'} className="mb-2">
                        {activePlanStatus === 'active' ? 'Active Subscription' : 'Cancelled'}
                      </Badge>
                      <h3 className="text-xl font-bold text-ink">{activePlanName}</h3>
                      <p className="text-sm text-ink-muted">Your active account level and workspace limits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-ink">
                        {formatPrice(activePlanPrice)}
                        <span className="text-sm font-normal text-ink-muted">/month</span>
                      </p>
                      <p className="text-xs text-ink-muted mt-1">
                        {activePlanStatus === 'active' ? 'Next bill on' : 'Expires on'} {renewalDate}
                      </p>
                    </div>
                  </div>

                  {/* Plan Features */}
                  <div className="py-6 border-y border-border">
                    <h4 className="text-sm font-semibold text-ink mb-4">What's Included</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activePlanFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                          <span className="text-sm text-ink">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button variant="primary" onClick={() => setIsManagePlanModalOpen(true)} className="cursor-pointer font-semibold">
                    View Usage Limits
                  </Button>

                  {subscription && activePlanStatus === 'active' && activePlanSlug !== 'free' && (
                    <Button
                      variant="outline"
                      className="border-danger text-danger hover:bg-danger/5 cursor-pointer font-semibold"
                      onClick={() => setIsCancelModalOpen(true)}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* 2. Payment Method & Quick Upgrades Container */}
            <div className="space-y-6">
              {/* Payment Method Card commented out temporarily */}
              {/* <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-ink">Payment Method</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:underline h-auto p-0 font-medium bg-transparent hover:bg-transparent cursor-pointer"
                    onClick={() => setIsPaymentModalOpen(true)}
                  >
                    Edit
                  </Button>
                </div>

                <div className="flex items-center gap-4 bg-canvas p-4 rounded-control border border-border">
                  <div className="w-12 h-8 bg-surface rounded flex items-center justify-center border border-border">
                    <CreditCard className="text-ink-muted w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {paymentMethod.type} ending in {paymentMethod.ending}
                    </p>
                    <p className="text-xs text-ink-muted">Expires {paymentMethod.expiry}</p>
                  </div>
                </div>

                <p className="text-xs text-ink-muted mt-4 flex items-center gap-1.5">
                  <Lock size={12} className="text-ink-muted" />
                  Secure encrypted payments
                </p>
              </Card> */}

              {/* Special Support / Sales CTA */}
              <Card className="p-6 bg-gradient-to-br from-primary to-primary-700 text-white relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary-600 opacity-20 transition-opacity group-hover:opacity-10"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-1">
                      <Sparkles size={18} className="fill-current text-white animate-pulse" />
                      Need more?
                    </h3>
                    <p className="text-xs text-primary-100 opacity-90 mb-6 leading-relaxed">
                      Get specialized support and custom limits for your organization.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-white text-primary-700 hover:bg-primary-50 hover:text-primary font-semibold border-0 py-2 shadow-soft hover:shadow-hover cursor-pointer"
                    onClick={() => setIsSupportModalOpen(true)}
                  >
                    Talk to Sales
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Change Plan Section */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-ink mb-6">Change Your Plan</h3>
            <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
              {plans.filter((p) => p.slug === 'free').map((plan) => {
                const isCurrent = activePlanSlug === plan.slug
                const isFree = plan.slug === 'free'
                const features = getFeaturesList(plan.slug)

                return (
                  <Card
                    key={plan.id}
                    className={`relative p-6 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 ${
                      isCurrent ? 'border-2 border-primary' : 'border-border'
                    }`}
                  >
                    {isCurrent ? (
                      <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-card text-xs font-semibold">
                        Current Plan
                      </div>
                    ) : plan.slug === 'growth' ? (
                      <div className="absolute top-0 right-0 bg-accent text-white px-4 py-1 rounded-bl-card text-xs font-semibold flex items-center gap-1">
                        <Sparkles size={12} />
                        Recommended
                      </div>
                    ) : null}

                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold text-ink">{plan.name}</h4>
                      </div>
                      <p className="text-xs text-ink-muted mb-4">{plan.slug === 'free' ? 'Try Whitebox features' : 'Scale your channels'}</p>

                      <div className="mb-6">
                        <p className="text-2xl font-bold text-primary">{formatPrice(plan.price)}</p>
                        <p className="text-xs text-ink-muted">per month</p>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-ink">
                            <CheckCircle2 size={16} className="text-accent fill-accent-50 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isCurrent ? (
                      <Button className="w-full font-semibold" variant="outline" disabled={true}>
                        Active
                      </Button>
                    ) : isFree ? (
                      <Button
                        onClick={() => alert('Please contact support to downgrade to Free.')}
                        className="w-full font-semibold cursor-pointer"
                        variant="outline"
                      >
                        Choose Plan
                      </Button>
                    ) : (
                      <CheckoutButton
                        planId={plan.id}
                        variant="primary"
                        className="w-full font-semibold cursor-pointer"
                      >
                        Choose Plan
                      </CheckoutButton>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Payment History Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-ink">Payment History</h3>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => alert('Exporting all invoice data as CSV...')}
              >
                Export Invoices
              </Button>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas border-b border-border">
                      <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Invoice ID</th>
                      <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedInvoices.map((invoice) => {
                      const displayStatus = invoice.status === 'paid' ? 'Paid' : 'Failed'
                      const dateStr = new Date(invoice.issuedAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })

                      return (
                        <tr key={invoice.id} className="hover:bg-canvas transition-colors">
                          <td className="px-6 py-4 text-sm text-ink">{dateStr}</td>
                          <td className="px-6 py-4 text-sm font-medium text-ink">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 text-sm text-ink">{formatPrice(invoice.amount)}</td>
                          <td className="px-6 py-4">
                            <Badge tone={displayStatus === 'Paid' ? 'success' : 'neutral'}>
                              {displayStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => alert(`Downloading invoice ${invoice.invoiceNumber}`)}
                              className="text-ink-muted hover:text-primary transition-colors cursor-pointer"
                              title="Download Invoice"
                            >
                              <Download size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-canvas flex justify-between items-center border-t border-border">
                <p className="text-xs text-ink-muted">
                  Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, invoices.length)} of {invoices.length} invoices
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 cursor-pointer"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 cursor-pointer"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Support Modal */}
      <Modal open={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} title="Contact Billing Support">
        <form onSubmit={handleSupportSubmit} className="space-y-4">
          <Input
            label="Subject"
            required
            value={supportSubject}
            onChange={(e) => setSupportSubject(e.target.value)}
            placeholder="e.g. Question about my last subscription"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink text-left">Message</label>
            <textarea
              required
              rows={4}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="Please describe your issue in detail..."
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsSupportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={supportSubmitted}>
              {supportSubmitted ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Edit Payment Method">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {paymentError && <p className="text-xs text-danger">{paymentError}</p>}
          <Input
            label="Cardholder Name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Alex Rivera"
          />
          <Input
            label="Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4111 2222 3333 4444"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiration Date"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              placeholder="MM/YY"
            />
            <Input
              label="CVC"
              type="password"
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value)}
              placeholder="123"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Payment Method
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Plan Modal */}
      <Modal open={isManagePlanModalOpen} onClose={() => setIsManagePlanModalOpen(false)} title="Plan Usage & Subscriptions">
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-sm font-semibold text-ink-muted">Plan Name</span>
            <span className="text-sm font-bold text-ink">{activePlanName}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-sm font-semibold text-ink-muted">Monthly Rate</span>
            <span className="text-sm font-bold text-ink">{formatPrice(activePlanPrice)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-sm font-semibold text-ink-muted">Billing Cycle</span>
            <span className="text-sm text-ink font-medium">Monthly</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-sm font-semibold text-ink-muted">Next Invoice</span>
            <span className="text-sm text-ink font-medium">{renewalDate}</span>
          </div>
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Usage Limits</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-ink">
                <span>Social Accounts Connected</span>
                <span>0 / {subscription?.plan?.features?.channels || 1}</span>
              </div>
              <div className="flex justify-between text-sm text-ink">
                <span>Team Seats</span>
                <span>1 / {subscription?.plan?.slug === 'free' ? 1 : subscription?.plan?.slug === 'starter' ? 1 : subscription?.plan?.slug === 'growth' ? 5 : 'Unlimited'}</span>
              </div>
              <div className="flex justify-between text-sm text-ink">
                <span>AI Posts</span>
                <span>0 / {subscription?.plan?.features?.posts || 5}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="primary" onClick={() => setIsManagePlanModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal open={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Subscription">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-control text-red-700">
            <AlertTriangle className="shrink-0 mt-0.5 w-5 h-5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-ink text-left">Confirm Cancellation</h4>
              <p className="text-xs leading-relaxed text-ink-muted text-left">
                Are you sure you want to cancel your subscription to the <strong>{activePlanName}</strong> plan?
                You will lose access to scheduled postings and custom AI tools at the end of the current billing cycle.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={cancelling}>
              Keep Plan
            </Button>
            <Button
              type="button"
              className="bg-danger hover:bg-danger/90 border-0 text-white font-semibold cursor-pointer"
              onClick={handleCancelSub}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}