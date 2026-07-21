import { useState } from 'react'
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
} from 'lucide-react'

export default function Billing() {
  // State for active plan
const [activePlan, setActivePlan] = useState('Free') // 'Pro' | 'Elite' | 'Enterprise'

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
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null)

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

 // Plan limits metadata depending on active plan
const planDetails = {
  Free: {
    name: "Free Plan",
    price: "₦0",
    billingCycle: "/month",
    nextBill: "No Billing",
    description: "Perfect for individuals getting started.",

    storageUsed: 1,
    storageTotal: 5,
    storagePercentage: 20,

    seatsUsed: 1,
    seatsTotal: 1,

    aiWordsUsed: 5,
    aiWordsTotal: 10,

    features: [
      "1 Social Channel",
      "1 AI Generated Post",
      "Basic Dashboard",
      "Community Support",
    ],
  },

  Starter: {
    name: "Starter Spark",
    price: "₦30,000",
    billingCycle: "/month",
    nextBill: "20 Aug 2026",
    description: "Perfect for small businesses starting to grow.",

    storageUsed: 12,
    storageTotal: 50,
    storagePercentage: 24,

    seatsUsed: 3,
    seatsTotal: 5,

    aiWordsUsed: 30,
    aiWordsTotal: 50,

    features: [
      "Social Media Audit (2 platforms)",
      "Page Revamp",
      "20 Custom Posts",
      "Basic Strategy",
      "Monthly Report",
    ],
  },

  Growth: {
    name: "Growth Package",
    price: "₦100,000",
    billingCycle: "/month",
    nextBill: "20 Aug 2026",
    description: "Ideal for growing businesses and brands.",

    storageUsed: 45,
    storageTotal: 100,
    storagePercentage: 45,

    seatsUsed: 6,
    seatsTotal: 10,

    aiWordsUsed: 75,
    aiWordsTotal: 100,

    features: [
      "Everything in Starter",
      "Brand Identity Development",
      "3 Social Platforms",
      "Content Calendar",
      "Lead Generation",
    ],
  },

  Brand: {
    name: "Brand Domination",
    price: "₦150,000",
    billingCycle: "/month",
    nextBill: "20 Aug 2026",
    description: "Designed for established brands that need maximum growth.",

    storageUsed: 120,
    storageTotal: 200,
    storagePercentage: 60,

    seatsUsed: 12,
    seatsTotal: 20,

    aiWordsUsed: 180,
    aiWordsTotal: 250,

    features: [
      "Everything in Growth",
      "4 Platforms",
      "30 Content Pieces",
      "Growth Strategy",
      "Ads Management",
    ],
  },

  Enterprise: {
    name: "Enterprise",
    price: "Custom",
    billingCycle: "",
    nextBill: "Custom Contract",
    description: "Tailored solutions for large organizations.",

    storageUsed: 250,
    storageTotal: 500,
    storagePercentage: 50,

    seatsUsed: 35,
    seatsTotal: 100,

    aiWordsUsed: 450,
    aiWordsTotal: 1000,

    features: [
      "Unlimited Storage",
      "Unlimited AI",
      "Dedicated Account Manager",
      "Custom Integrations",
    ],
  },
}

const currentPlanInfo = planDetails[activePlan]

  // Mock invoice data
  const mockInvoices = [
  { id: 'INV-9283-21', date: 'Oct 12, 2023', amount: '₦30,000', status: 'Paid' },
  { id: 'INV-8142-05', date: 'Sep 12, 2023', amount: '₦30,000', status: 'Paid' },
  { id: 'INV-7091-88', date: 'Aug 12, 2023', amount: '₦100,000', status: 'Processing' },
  { id: 'INV-6012-44', date: 'Jul 12, 2023', amount: '₦100,000', status: 'Paid' },
  { id: 'INV-5002-12', date: 'Jun 12, 2023', amount: '₦150,000', status: 'Paid' },
  { id: 'INV-4890-09', date: 'May 12, 2023', amount: '₦150,000', status: 'Paid' },
  { id: 'INV-3211-77', date: 'Apr 12, 2023', amount: '₦30,000', status: 'Paid' },
  { id: 'INV-2041-32', date: 'Mar 12, 2023', amount: '₦30,000', status: 'Paid' },
]

  // Pagination calculations
  const itemsPerPage = 4
  const totalPages = Math.ceil(mockInvoices.length / itemsPerPage)
  const paginatedInvoices = mockInvoices.slice(
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

  const handleUpgradeConfirm = () => {
    if (selectedUpgradePlan) {
      setActivePlan(selectedUpgradePlan)
      setIsUpgradeModalOpen(false)
      setSelectedUpgradePlan(null)
    }
  }

  const triggerUpgradeFlow = (plan) => {
    setSelectedUpgradePlan(plan)
    setIsUpgradeModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Page Header Section */}
      <PageHeader
        title="Billing & Subscription"
        description="Manage your workspace plans and payment settings."
        action={
          <Button
            variant="outline"
            className="flex items-center gap-1.5 font-medium text-primary hover:underline hover:bg-canvas"
            onClick={() => setIsSupportModalOpen(true)}
          >
            <HelpCircle size={18} />
            Contact Billing Support
          </Button>
        }
      />

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Current Plan Overview */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Badge tone="success" className="mb-2">
                    Active Subscription
                  </Badge>
                  <h3 className="text-xl font-bold text-ink">{currentPlanInfo.name}</h3>
                  <p className="text-sm text-ink-muted">{currentPlanInfo.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-ink">
                    {currentPlanInfo.price}
                    <span className="text-sm font-normal text-ink-muted">{currentPlanInfo.billingCycle}</span>
                  </p>
                  <p className="text-xs text-ink-muted mt-1">Next bill on {currentPlanInfo.nextBill}</p>
                </div>
              </div>

                            {/* Plan Features */}
              <div className="py-6 border-y border-border">
                <h4 className="text-sm font-semibold text-ink mb-4">
                  What's Included
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPlanInfo.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle2
                        size={16}
                        className="text-green-500"
                      />
                      <span className="text-sm text-ink">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                variant="primary"
                onClick={() => setIsManagePlanModalOpen(true)}
              >
                Manage Plan
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsManagePlanModalOpen(true)}
              >
                View Plan Details
              </Button>
            </div>
          </Card>
        </div>

        {/* 2. Payment Method & Quick Upgrades Container */}
        <div className="space-y-6">
          {/* Payment Method Card */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-ink">
                Payment Method
              </h3>

              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:underline h-auto p-0 font-medium bg-transparent hover:bg-transparent"
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
                <p className="text-xs text-ink-muted">
                  Expires {paymentMethod.expiry}
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-muted mt-4 flex items-center gap-1.5">
              <Lock size={12} className="text-ink-muted" />
              Secure encrypted payments
            </p>
          </Card>

          {/* Special Support / Call to action */}
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
                className="w-full bg-white text-primary-700 hover:bg-primary-50 hover:text-primary font-semibold border-0 py-2 shadow-soft hover:shadow-hover"
              onClick={() => triggerUpgradeFlow('Brand')}
              >
                Talk to Sales
              </Button>
            </div>
          </Card>
        </div>
      </div>

      
      {/* Change Your Plan Section */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-ink mb-6">Change Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan Card */}
          <Card
            className={`relative p-6 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 ${
              activePlan === 'Starter' ? 'border-2 border-primary' : 'border-border'
            }`}
          >
            {activePlan === 'Starter' && (
              <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-card text-xs font-semibold">
                Current Plan
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-ink">Starter Spark</h4>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">₦30,000</p>
                  <p className="text-xs text-ink-muted">per month</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {planDetails.Starter.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-ink">
                    <CheckCircle2 size={16} className="text-accent fill-accent-50" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="w-full font-semibold"
              variant={activePlan === 'Starter' ? 'outline' : 'primary'}
              disabled={activePlan === 'Starter'}
              onClick={() => triggerUpgradeFlow('Starter')}
            >
              {activePlan === 'Starter' ? 'Active' : 'Choose Plan'}
            </Button>
          </Card>

          {/* Growth Package Card — was missing after the merge */}
          <Card
            className={`relative p-6 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 ${
              activePlan === 'Growth' ? 'border-2 border-primary' : 'border-border'
            }`}
          >
            {activePlan === 'Growth' && (
              <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-card text-xs font-semibold">
                Current Plan
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-ink">Growth Package</h4>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">₦100,000</p>
                  <p className="text-xs text-ink-muted">per month</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {planDetails.Growth.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-ink">
                    <CheckCircle2 size={16} className="text-accent fill-accent-50" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="w-full font-semibold"
              variant={activePlan === 'Growth' ? 'outline' : 'primary'}
              disabled={activePlan === 'Growth'}
              onClick={() => triggerUpgradeFlow('Growth')}
            >
              {activePlan === 'Growth' ? 'Active' : 'Choose Plan'}
            </Button>
          </Card>

          {/* Brand Domination Card */}
          <Card
            className={`relative p-6 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:border-primary ${
              activePlan === 'Brand'
                ? 'border-2 border-primary'
                : 'border-border'
            }`}
          >
            {activePlan === 'Brand' && (
              <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-card text-xs font-semibold">
                Current Plan
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-ink">Brand Domination</h4>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">₦150,000</p>
                  <p className="text-xs text-ink-muted">per month</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircle2 size={16} className="text-accent fill-accent-50" />
                  Everything in Growth
                </li>
                <li className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircle2 size={16} className="text-accent fill-accent-50" />
                  4 Social Platforms
                </li>
                <li className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircle2 size={16} className="text-accent fill-accent-50" />
                  30 Content Pieces Monthly
                </li>
                <li className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircle2 size={16} className="text-accent fill-accent-50" />
                  Ads Management & Growth Strategy
                </li>
              </ul>
            </div>

            <Button
              className="w-full"
              variant={activePlan === 'Brand' ? 'outline' : 'primary'}
              onClick={() => triggerUpgradeFlow('Brand')}
              disabled={activePlan === 'Brand'}
            >
              {activePlan === 'Brand' ? 'Active' : 'Upgrade Now'}
            </Button>
          </Card>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-ink">Payment History</h3>
          <Button
            variant="outline"
            size="sm"
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
                {paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-canvas transition-colors">
                    <td className="px-6 py-4 text-sm text-ink">{invoice.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-ink">{invoice.id}</td>
                    <td className="px-6 py-4 text-sm text-ink">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <Badge tone={invoice.status === 'Paid' ? 'success' : 'neutral'}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => alert(`Downloading invoice ${invoice.id}`)}
                        className="text-ink-muted hover:text-primary transition-colors cursor-pointer"
                        title="Download Invoice"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-canvas flex justify-between items-center border-t border-border">
            <p className="text-xs text-ink-muted">
              Showing {currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, mockInvoices.length)} of {mockInvoices.length} invoices
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="px-2"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-2"
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Support Modal */}
      <Modal
        open={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        title="Contact Billing Support"
      >
        <form onSubmit={handleSupportSubmit} className="space-y-4">
          <Input
            label="Subject"
            required
            value={supportSubject}
            onChange={(e) => setSupportSubject(e.target.value)}
            placeholder="e.g. Question about my last subscription"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Message</label>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSupportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={supportSubmitted}>
              {supportSubmitted ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Edit Payment Method"
      >
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Payment Method
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Plan Modal */}
      <Modal
        open={isManagePlanModalOpen}
        onClose={() => setIsManagePlanModalOpen(false)}
        title="Plan Usage & Subscriptions"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-sm font-semibold text-ink-muted">Plan Name</span>
            <span className="text-sm font-bold text-ink">{currentPlanInfo.name}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-sm font-semibold text-ink-muted">Monthly Rate</span>
            <span className="text-sm font-bold text-ink">{currentPlanInfo.price}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-sm font-semibold text-ink-muted">Billing Cycle</span>
            <span className="text-sm text-ink font-medium">Monthly</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-sm font-semibold text-ink-muted">Next Invoice</span>
            <span className="text-sm text-ink font-medium">{currentPlanInfo.nextBill}</span>
          </div>
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Usage Limits</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-ink">
                <span>Storage</span>
                <span>{currentPlanInfo.storageUsed} / {currentPlanInfo.storageTotal} GB</span>
              </div>
              <div className="flex justify-between text-sm text-ink">
                <span>Team Seats</span>
                <span>{currentPlanInfo.seatsUsed} / {currentPlanInfo.seatsTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-ink">
                <span>AI Words</span>
                <span>{currentPlanInfo.aiWordsUsed}k / {currentPlanInfo.aiWordsTotal}k</span>
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

      {/* Upgrade Confirmation Modal */}
      <Modal
        open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title={selectedUpgradePlan === 'Enterprise' ? 'Contact Sales' : 'Upgrade Plan'}
      >
        {selectedUpgradePlan === 'Enterprise' ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              You are requesting information on the Enterprise plan. A sales representative will contact you at your registered email <strong>alex@socialai.com</strong> to discuss custom terms, SAML/SSO configuration, and dedicated support.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  alert('Sales request submitted! We will email you shortly.');
                }}
              >
                Submit Request
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              Are you sure you want to upgrade your subscription to the <strong>{selectedUpgradePlan} Plan</strong>?
            </p>
            <div className="bg-canvas p-4 rounded-control border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">New Monthly Price:</span>
                <span className="font-semibold text-ink">
                  {selectedUpgradePlan ? planDetails[selectedUpgradePlan].price : ''}/mo
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Storage Limit:</span>
                <span className="font-semibold text-ink">
                  {selectedUpgradePlan ? planDetails[selectedUpgradePlan].storageTotal : ''} GB
                </span>
              </div>
            </div>
            <p className="text-xs text-ink-muted italic">
              * Note: The new card details on file ({paymentMethod.type} ending in {paymentMethod.ending}) will be billed automatically starting today. Pro-rated differences will apply to your current billing cycle.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpgradeConfirm}>
                Confirm Upgrade
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
