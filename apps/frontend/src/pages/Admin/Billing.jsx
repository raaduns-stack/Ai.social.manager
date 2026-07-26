import { useState } from 'react'
import {
  CreditCard,
  Users,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Search,
  MoreVertical,
  Zap,
  Eye,
  X,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'

// ---------------------------------------------------------------------------
// Initial Mock Data (Preserving original values from Stitch-generated HTML)
// ---------------------------------------------------------------------------
const INITIAL_SUBSCRIPTIONS = [
  {
    id: "sub_1",
    customerName: "Oluwaseun Adeyemi",
    email: "oluwaseun.adeyemi@example.com",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCs-GoYKpskwtAtPXQf-hy_BwDlPYe8CAxA0UXlPFqOJk_EBqld2iacimtz7nt60mfg_xJLC6ACLTdmLdCU0gUY3gE304xAFOJ1CGYk-YpBhGRMU1q0CeOOWqLXdBX3x12gIAHRV3wzdpl-Kv1MzN_3d13sBll9SwI0ewCdPTBMf2kl1Dc1lv00IUtMNR7ylP4jhNtT4D0w5B3q9-sGKwKiqUxx9oBapuso9Hx9HHudX2pF0LJMli8oBLZ8edt2PqZ09_68mH6Y5Bln",
    plan: "Enterprise",
    status: "active",
    renewsOn: "Oct 28, 2023",
    amount: 45000,
  },
  {
    id: "sub_2",
    customerName: "Chidinma Okafor",
    email: "chidinma.okafor@example.com",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJ1HvlIuCFhaEL-CeV5mCeOcQq881HNWzA6KLbIu-JA5p61LF6nsxVLangQJ2Bdf45lv7s2YRWJFZJufFHQAPi3gzKCW5yLv7HkXNAr0AY6HImlwTnI20jYsd9Q8RUotYbdL-PLzbDPQLjcajuZhWg5A7XQVsUCyBn2URKh2yIrQV1YjBPCXLp4R4MedLQfpNlaED8OjS1O2dXFEjxUQ7gabpn3MfgRMfo_RM0pB6Mayo_N-sFGvpmjX5GPvQ9Qtzz27JOuvHgtZR2",
    plan: "Pro",
    status: "pending",
    renewsOn: "Nov 12, 2023",
    amount: 12500,
  },
  {
    id: "sub_3",
    customerName: "Emeka Nwosu",
    email: "emeka.nwosu@example.com",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCs_Fv69L2F84b92q_7MjTMtFkAzgesBLTS6kYE_gLe57WIW6s5t4CdQqz8PyDvanxSp3wyBQEubyQ-FJh_MkzTaVBKTr3bk-dsqt5qSlR9guu_WZdgjRcwQq5l2f0DMK7yMSiMMknLQdJVoD0rWA1XbL0OCy-86q1I0F6RBuW1sjEzQ1-t_j_-cRomLDPJ25FUALC89HKYSy4c-9XOhsX2DPie-AtIK40bDeQpbs5jKVk1QuzuUMmoByj5hMCqwlucdJylAtp9N726",
    plan: "Starter",
    status: "active",
    renewsOn: "Oct 30, 2023",
    amount: 10000,
  },
  {
    id: "sub_4",
    customerName: "Tunde Bakare",
    email: "tunde.bakare@example.com",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq1dw4KcohBPHgT4cOOO551D--xpbeDQqhe6ZonqCfls7nqKcCBL64VBWTvt_nzep0Sni73g4ibByxj3a601MkHxavCz9buPGGAVJG47vae2Hy7i3tQAEIAT75HFeMZ55uO2wqBipF5ETKnoH9-ScaRpjsjQmuuQT-FWQUK1QvFD2ERjxaphJhAofA1uX55ZytQi9Pc-XtnR9J0Z4QWP06t_5z0A5EUfF8yYixBQq1OzeE-mgrFbYyDtTHaBHa9d9EpSIOD3M4O1JZ",
    plan: "Pro",
    status: "expired",
    renewsOn: "Oct 15, 2023",
    amount: 12500,
  },
  {
    id: "sub_5",
    customerName: "Ifeanyi Obi",
    email: "ifeanyi.obi@example.com",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-81Plu7H0oYBjsnwyZ9XaaDar10SAcCWM5__JbDj3ox0Q77NoA4FokAStJHUZ709EZUgALZ1LZRCHo41p16avFyTQxZYcBJrzF0LYT0y50fNRH3oyJRd04ujZbLUL7Sb9WpnWquLfMeo9P52fbyRdUyNP-qAuPdoYIY-szF3NMnwrHabiN5EPDOkOwwbtUwVtZxwkcFEGpT2P-I4W8fxXyOjMXiwoxc6Uhxha3XxnnFYhEQ6XhpQo8lRPfyDAow4idjwJ-v7sngeY",
    plan: "Enterprise",
    status: "active",
    renewsOn: "Nov 22, 2023",
    amount: 45000,
  },
]

const INITIAL_PLANS = [
  {
    id: "plan_basic",
    name: "Starter",
    priceMonthly: 10000,
    priceYearly: 100000,
    discountPrice: 8000,
    channels: 3,
    posts: 10,
    features: ["Facebook", "Instagram"],
    imagePosting: true,
    videoPosting: false
  },
  {
    id: "plan_pro",
    name: "Pro",
    priceMonthly: 12500,
    priceYearly: 120000,
    discountPrice: null,
    channels: 8,
    posts: 35,
    features: ["Facebook", "Instagram", "X (Twitter)", "LinkedIn"],
    imagePosting: true,
    videoPosting: true
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    priceMonthly: 45000,
    priceYearly: 450000,
    discountPrice: null,
    channels: 25,
    posts: 250,
    features: ["Facebook", "Instagram", "X (Twitter)", "LinkedIn", "TikTok"],
    imagePosting: true,
    videoPosting: true
  },
]

const INITIAL_PAYMENTS = [
  { id: "pay_1", customerName: "Oluwaseun Adeyemi", plan: "Enterprise", amount: 45000, date: "Oct 28, 2023", method: "Card", status: "verified" },
  { id: "pay_2", customerName: "Chidinma Okafor", plan: "Pro", amount: 12500, date: "Nov 12, 2023", method: "Bank Transfer", status: "pending" },
  { id: "pay_3", customerName: "Emeka Nwosu", plan: "Starter", amount: 10000, date: "Oct 30, 2023", method: "Card", status: "verified" },
  { id: "pay_4", customerName: "Tunde Bakare", plan: "Pro", amount: 12500, date: "Oct 15, 2023", method: "Card", status: "verified" },
  { id: "pay_5", customerName: "Ifeanyi Obi", plan: "Enterprise", amount: 45000, date: "Nov 22, 2023", method: "Card", status: "verified" },
]

export default function Billing() {
  // ---------------------------------------------------------------------------
  // State variables
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('subscriptions') // 'plans' | 'subscriptions' | 'payments'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [subscriptions, setSubscriptions] = useState(INITIAL_SUBSCRIPTIONS)
  const [plans, setPlans] = useState(INITIAL_PLANS)
  const [payments, setPayments] = useState(INITIAL_PAYMENTS)

  // Actions Popovers & Modals state
  const [activeActionsRowId, setActiveActionsRowId] = useState(null)
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [modalTopTab, setModalTopTab] = useState('create') // 'create' | 'edit'
  const [modalInnerTab, setModalInnerTab] = useState('details') // 'details' | 'features'
  const [selectedPlanToEditId, setSelectedPlanToEditId] = useState('')
  const [planForm, setPlanForm] = useState({
    name: '',
    priceMonthly: '',
    priceYearly: '',
    discountPrice: '',
    channels: '',
    posts: '',
    features: [],
    imagePosting: false,
    videoPosting: false,
  })

  // Pagination (Dummy for demo purposes, showing matching subset)
  const [currentPage, setCurrentPage] = useState(1)

  // ---------------------------------------------------------------------------
  // Derived Statistics
  // ---------------------------------------------------------------------------
  const activeSubsCount = subscriptions.filter(s => s.status === 'active').length
  const totalSubscribers = 482 // Static offset matching Stitch HTML stats label
  const totalChurned = 12 // Static offset matching Stitch HTML stats label

  const stats = [
    {
      label: 'MRR (₦)',
      value: '₦1,250,000',
      icon: CreditCard,
      trend: { value: '12.4%', type: 'up' },
    },
    {
      label: 'Active Subscriptions',
      value: String(totalSubscribers + (activeSubsCount - 3)), // Dynamic adjustments
      icon: Users,
      detail: '+24 from last month',
    },
    {
      label: 'Churned This Month',
      value: String(totalChurned),
      icon: UserMinus,
      trend: { value: '2%', type: 'down' },
    },
  ]

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleManualActivate = (subId) => {
    const targetSub = subscriptions.find(s => s.id === subId)
    if (!targetSub) return

    // Update subscription status
    setSubscriptions(prev =>
      prev.map(s => s.id === subId ? { ...s, status: 'active' } : s)
    )

    // Update payments history
    setPayments(prev =>
      prev.map(p =>
        p.customerName === targetSub.customerName && p.status === 'pending'
          ? { ...p, status: 'verified', method: 'Bank Transfer' }
          : p
      )
    )

    setActiveActionsRowId(null)
  }

  const handleOpenCreateModal = () => {
    setEditingPlan(null)
    setModalTopTab('create')
    setModalInnerTab('details')
    setPlanForm({
      name: '',
      priceMonthly: '',
      priceYearly: '',
      discountPrice: '',
      channels: '',
      posts: '',
      features: [],
      imagePosting: false,
      videoPosting: false,
    })
    setCreateModalOpen(true)
  }

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan)
    setModalTopTab('edit')
    setModalInnerTab('details')
    setSelectedPlanToEditId(plan.id)
    setPlanForm({
      name: plan.name,
      priceMonthly: String(plan.priceMonthly || plan.price || 0),
      priceYearly: String(plan.priceYearly || 0),
      discountPrice: plan.discountPrice ? String(plan.discountPrice) : '',
      channels: String(plan.channels),
      posts: String(plan.posts),
      features: plan.features || [],
      imagePosting: !!plan.imagePosting,
      videoPosting: !!plan.videoPosting,
    })
    setCreateModalOpen(true)
  }

  const handleSavePlan = (e) => {
    e.preventDefault()

    const targetId = modalTopTab === 'edit' ? selectedPlanToEditId : `plan_${Date.now()}`

    const newPlanData = {
      id: targetId,
      name: planForm.name,
      priceMonthly: Number(planForm.priceMonthly) || 0,
      priceYearly: Number(planForm.priceYearly) || 0,
      discountPrice: planForm.discountPrice ? Number(planForm.discountPrice) : null,
      channels: Number(planForm.channels) || 0,
      posts: Number(planForm.posts) || 0,
      features: planForm.features,
      imagePosting: planForm.imagePosting,
      videoPosting: planForm.videoPosting,
    }

    if (modalTopTab === 'edit') {
      setPlans(prev => prev.map(p => p.id === targetId ? newPlanData : p))
    } else {
      setPlans(prev => [...prev, newPlanData])
    }

    setCreateModalOpen(false)
  }

  const handleDeletePlan = (planId) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      setPlans(prev => prev.filter(p => p.id !== planId))
    }
  }

  // ---------------------------------------------------------------------------
  // Filters and Queries
  // ---------------------------------------------------------------------------
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch =
      sub.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredPayments = payments.filter(pay => {
    const matchesSearch =
      pay.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.plan.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header Section */}
      <PageHeader
        title="Billing & Subscriptions"
        description="Manage revenue streams, active plans, and customer payment status."
        action={
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Create Plan
          </Button>
        }
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                {stat.label}
              </span>
              <div
                className={cn(
                  "p-2 rounded-control",
                  stat.icon === UserMinus ? "bg-danger/10 text-danger" : "bg-primary-50 text-primary-700"
                )}
              >
                <stat.icon size={20} />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-2xl font-bold text-ink">{stat.value}</span>
              {stat.trend && (
                <Badge
                  tone={stat.trend.type === 'up' ? 'success' : 'danger'}
                  className="gap-1 text-xs mb-1"
                >
                  {stat.trend.type === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend.value}
                </Badge>
              )}
              {stat.detail && (
                <span className="text-xs text-ink-muted mb-1">{stat.detail}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs Section */}
      <div className="border-b border-border flex items-center gap-6">
        {['plans', 'subscriptions', 'payments'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSearchQuery('') // Clear query on tab change
            }}
            className={cn(
              "px-4 pb-3 text-sm font-medium transition-colors border-b-2 capitalize",
              activeTab === tab
                ? "text-primary border-primary font-semibold"
                : "text-ink-muted border-transparent hover:text-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Canvas Content */}
      <div className="space-y-4">
        {/* Local Search & Filtering Controls */}
        {activeTab !== 'plans' && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder={activeTab === 'subscriptions' ? "Search subscriptions..." : "Search payments..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-control border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {activeTab === 'subscriptions' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-44"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            )}
          </div>
        )}

        {/* 1. PLANS TAB */}
        {activeTab === 'plans' && (
          plans.length === 0 ? (
            <EmptyState
              icon={<Layers size={32} />}
              title="No pricing plans configured"
              description="Define pricing subscriptions to start collecting revenue."
              action={
                <Button variant="primary" onClick={handleOpenCreateModal}>
                  Create First Plan
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-6 flex flex-col justify-between" hover>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
                      <Badge
                        tone={
                          plan.name === 'Enterprise' ? 'primary' :
                          plan.name === 'Pro' ? 'success' : 'neutral'
                        }
                      >
                        Active
                      </Badge>
                    </div>
                    <div className="mb-6 space-y-1">
                      <div>
                        <span className="text-2xl font-bold text-ink">
                          ₦{Number(plan.discountPrice || plan.priceMonthly || plan.price || 0).toLocaleString()}
                        </span>
                        <span className="text-sm text-ink-muted"> / month</span>
                        {plan.discountPrice && (
                          <span className="ml-2 text-xs text-ink-muted line-through">
                            ₦{Number(plan.priceMonthly || plan.price || 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-ink-muted">
                          ₦{Number(plan.priceYearly || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-ink-muted"> / year</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6 text-sm text-ink-muted">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {plan.channels} Social Channels
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {plan.posts} Scheduled Posts / week
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Platforms: <span className="font-medium text-ink">{plan.features && plan.features.length > 0 ? plan.features.join(' + ') : 'None'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Image Posting: <span className="font-medium text-ink">{plan.imagePosting ? 'Enabled' : 'Disabled'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Video Posting: <span className="font-medium text-ink">{plan.videoPosting ? 'Enabled' : 'Disabled'}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex gap-2 border-t border-border pt-4 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-1"
                      onClick={() => handleOpenEditModal(plan)}
                    >
                      <Edit2 size={12} />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center justify-center"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* 2. SUBSCRIPTIONS TAB */}
        {activeTab === 'subscriptions' && (
          filteredSubscriptions.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No subscriptions match this filter"
              description="Try adjusting your search criteria or filter options."
            />
          ) : (
            <Card className="overflow-hidden p-0 border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas border-b border-border">
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Customer</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Plan</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Renews On</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Amount (₦)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase relative">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSubscriptions.map((sub) => (
                      <tr
                        key={sub.id}
                        className={cn(
                          "transition-colors",
                          sub.status === 'pending'
                            ? "bg-primary-50/20 hover:bg-primary-50/30"
                            : "hover:bg-canvas"
                        )}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              className="w-10 h-10 rounded-full border border-border object-cover animate-fade-in"
                              src={sub.avatar}
                              alt={sub.customerName}
                            />
                            <div>
                              <p className="font-semibold text-ink text-sm">{sub.customerName}</p>
                              <p className="text-xs text-ink-muted">{sub.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            tone={
                              sub.plan === 'Enterprise' ? 'primary' :
                              sub.plan === 'Pro' ? 'success' : 'neutral'
                            }
                          >
                            {sub.plan}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                sub.status === 'active' ? "bg-accent" :
                                sub.status === 'pending' ? "bg-warning" : "bg-ink-muted"
                              )}
                            />
                            <span className="text-xs font-medium text-ink capitalize">
                              {sub.status === 'pending' ? 'Payment Pending' : sub.status}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">{sub.renewsOn}</td>
                        <td className="px-6 py-4 text-sm font-medium text-ink">
                          ₦{Number(sub.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 relative">
                          {activeActionsRowId === sub.id ? (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-surface border border-border rounded-control p-1.5 shadow-lg z-10 animate-in fade-in slide-in-from-right-2 duration-200">
                              {sub.status === 'pending' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 px-2 text-xs flex items-center gap-1"
                                  onClick={() => handleManualActivate(sub.id)}
                                >
                                  <Zap size={12} />
                                  Manual Activation
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs flex items-center gap-1"
                                onClick={() => {
                                  setSelectedSubscription(sub)
                                  setDetailModalOpen(true)
                                  setActiveActionsRowId(null)
                                }}
                              >
                                <Eye size={12} />
                                View Detail
                              </Button>
                              <button
                                onClick={() => setActiveActionsRowId(null)}
                                className="p-1 text-ink-muted hover:bg-canvas hover:text-ink rounded-full"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveActionsRowId(sub.id)}
                              className="p-1.5 text-ink-muted hover:bg-canvas hover:text-ink rounded-full transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="px-6 py-4 flex justify-between items-center bg-surface border-t border-border">
                <span className="text-xs font-medium text-ink-muted">
                  Showing 1-{filteredSubscriptions.length} of {totalSubscribers} subscriptions
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          )
        )}

        {/* 3. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          filteredPayments.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={32} />}
              title="No payment history matches this filter"
              description="Adjust your search query to look for verified or pending transactions."
            />
          ) : (
            <Card className="overflow-hidden p-0 border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas border-b border-border">
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Transaction ID</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Customer</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Plan</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Amount (₦)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Method</th>
                      <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-canvas transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-ink-muted uppercase">
                          {pay.id}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-ink">
                          {pay.customerName}
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {pay.plan}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-ink">
                          ₦{Number(pay.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {pay.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-muted">
                          {pay.method}
                        </td>
                        <td className="px-6 py-4">
                          <Badge tone={pay.status === 'verified' ? 'success' : 'warning'}>
                            {pay.status === 'verified' ? 'Verified' : 'Pending Verification'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        )}
      </div>

      {/* -------------------------------------------------------------------------
         MODAL: CREATE / EDIT PLAN FORM
      ------------------------------------------------------------------------- */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={modalTopTab === 'edit' ? "Edit Pricing Plan" : "Create New Pricing Plan"}
      >
        <div className="space-y-4">
          {/* Top-Level Tabs */}
          <div className="flex border-b border-border mb-4">
            {['create', 'edit'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setModalTopTab(tab)
                  setModalInnerTab('details')
                  if (tab === 'create') {
                    setEditingPlan(null)
                    setPlanForm({
                      name: '',
                      priceMonthly: '',
                      priceYearly: '',
                      discountPrice: '',
                      channels: '',
                      posts: '',
                      features: [],
                      imagePosting: false,
                      videoPosting: false,
                    })
                  } else {
                    const firstPlan = plans[0] || null
                    setSelectedPlanToEditId(firstPlan ? firstPlan.id : '')
                    if (firstPlan) {
                      setEditingPlan(firstPlan)
                      setPlanForm({
                        name: firstPlan.name,
                        priceMonthly: String(firstPlan.priceMonthly || firstPlan.price || 0),
                        priceYearly: String(firstPlan.priceYearly || 0),
                        discountPrice: firstPlan.discountPrice ? String(firstPlan.discountPrice) : '',
                        channels: String(firstPlan.channels || 0),
                        posts: String(firstPlan.posts || 0),
                        features: firstPlan.features || [],
                        imagePosting: !!firstPlan.imagePosting,
                        videoPosting: !!firstPlan.videoPosting,
                      })
                    }
                  }
                }}
                className={cn(
                  "flex-1 pb-2 text-center text-sm font-semibold border-b-2 capitalize",
                  modalTopTab === tab
                    ? "text-primary border-primary"
                    : "text-ink-muted border-transparent hover:text-ink"
                )}
              >
                {tab === 'create' ? 'Create Plan' : 'Edit Plan'}
              </button>
            ))}
          </div>

          {/* Edit Plan Dropdown Selection */}
          {modalTopTab === 'edit' && (
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-ink-muted uppercase">Select Plan to Edit</label>
              <select
                value={selectedPlanToEditId}
                onChange={(e) => {
                  const selectedId = e.target.value
                  setSelectedPlanToEditId(selectedId)
                  const plan = plans.find(p => p.id === selectedId)
                  if (plan) {
                    setEditingPlan(plan)
                    setPlanForm({
                      name: plan.name,
                      priceMonthly: String(plan.priceMonthly || plan.price || 0),
                      priceYearly: String(plan.priceYearly || 0),
                      discountPrice: plan.discountPrice ? String(plan.discountPrice) : '',
                      channels: String(plan.channels || 0),
                      posts: String(plan.posts || 0),
                      features: plan.features || [],
                      imagePosting: !!plan.imagePosting,
                      videoPosting: !!plan.videoPosting,
                    })
                  }
                }}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Inner Tabs */}
          <div className="flex bg-canvas p-1 rounded-control border border-border mb-4">
            {['details', 'features'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setModalInnerTab(tab)}
                className={cn(
                  "flex-1 py-1.5 text-center text-xs font-semibold rounded-control transition-all",
                  modalInnerTab === tab
                    ? "bg-surface text-ink shadow-soft font-bold"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                {tab === 'details' ? 'Plan Details' : 'Plan Features'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSavePlan} className="space-y-4">
            {modalInnerTab === 'details' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <Input
                  label="Plan Name"
                  placeholder="e.g. Starter, Premium"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Monthly Price (₦)"
                    type="number"
                    placeholder="e.g. 10000"
                    value={planForm.priceMonthly}
                    onChange={(e) => setPlanForm({ ...planForm, priceMonthly: e.target.value })}
                    required
                  />
                  <Input
                    label="Yearly Price (₦)"
                    type="number"
                    placeholder="e.g. 100000"
                    value={planForm.priceYearly}
                    onChange={(e) => setPlanForm({ ...planForm, priceYearly: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Discount Price (₦) - Optional"
                  type="number"
                  placeholder="e.g. 8000"
                  value={planForm.discountPrice}
                  onChange={(e) => setPlanForm({ ...planForm, discountPrice: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Social Channels"
                    type="number"
                    placeholder="e.g. 5"
                    value={planForm.channels}
                    onChange={(e) => setPlanForm({ ...planForm, channels: e.target.value })}
                    required
                  />
                  <Input
                    label="Posts per Week"
                    type="number"
                    placeholder="e.g. 10"
                    value={planForm.posts}
                    onChange={(e) => setPlanForm({ ...planForm, posts: e.target.value })}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Platform modules */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">Feature Modules</label>
                  <p className="text-xs text-ink-muted -mt-1 mb-1">Select the social channels included in this subscription tier.</p>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-canvas rounded-control border border-border">
                    {['Facebook', 'Instagram', 'X (Twitter)', 'LinkedIn', 'TikTok'].map((feature) => {
                      const isChecked = planForm.features.includes(feature)
                      return (
                        <label key={feature} className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updatedFeatures = isChecked
                                ? planForm.features.filter(f => f !== feature)
                                : [...planForm.features, feature]
                              setPlanForm({ ...planForm, features: updatedFeatures })
                            }}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          />
                          {feature}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Media posting permissions */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">Posting Permissions</label>
                  <p className="text-xs text-ink-muted -mt-1 mb-1">Determine the media types users are allowed to schedule.</p>
                  <div className="flex flex-col gap-3 p-3 bg-canvas rounded-control border border-border">
                    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={planForm.imagePosting}
                        onChange={(e) => setPlanForm({ ...planForm, imagePosting: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      Enable Image Posting
                    </label>
                    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={planForm.videoPosting}
                        onChange={(e) => setPlanForm({ ...planForm, videoPosting: e.target.checked })}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      Enable Video Posting
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {modalTopTab === 'edit' ? "Save Changes" : "Save Plan"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* -------------------------------------------------------------------------
         MODAL: SUBSCRIPTION DETAIL VIEWER
      ------------------------------------------------------------------------- */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Subscription Overview"
      >
        {selectedSubscription && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <img
                className="w-12 h-12 rounded-full border border-border object-cover"
                src={selectedSubscription.avatar}
                alt={selectedSubscription.customerName}
              />
              <div>
                <h4 className="text-base font-semibold text-ink">{selectedSubscription.customerName}</h4>
                <p className="text-xs text-ink-muted">{selectedSubscription.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase">Plan Type</p>
                <p className="font-semibold text-ink mt-0.5">{selectedSubscription.plan}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase">Billed Amount</p>
                <p className="font-semibold text-ink mt-0.5">₦{Number(selectedSubscription.amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase">Subscription Status</p>
                <div className="mt-1">
                  <Badge
                    tone={
                      selectedSubscription.status === 'active' ? 'success' :
                      selectedSubscription.status === 'pending' ? 'warning' : 'danger'
                    }
                  >
                    {selectedSubscription.status === 'pending' ? 'Payment Pending' : selectedSubscription.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase">Next Renewal Date</p>
                <p className="font-semibold text-ink mt-0.5">{selectedSubscription.renewsOn}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              {selectedSubscription.status === 'pending' && (
                <Button
                  variant="primary"
                  className="flex items-center gap-1"
                  onClick={() => {
                    handleManualActivate(selectedSubscription.id)
                    setDetailModalOpen(false)
                  }}
                >
                  <Zap size={14} />
                  Manual Activation
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
