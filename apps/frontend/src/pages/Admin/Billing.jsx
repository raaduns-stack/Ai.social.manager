import { useState, useEffect, useMemo } from 'react'
import {
  CreditCard,
  Users,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Layers,
  RefreshCw,
  Pencil,
  X,
  Save,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { getAdminBillingStats, getAdminSubscriptions, getAdminPayments, getAdminPlans, updateAdminPlan } from '../../features/admin/admin-api'
import ErrorBanner from '../../components/error-banner'

export default function Billing() {
  const [activeTab, setActiveTab] = useState('subscriptions') // 'plans' | 'subscriptions' | 'payments'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Plan editor modal state
  const [editingPlan, setEditingPlan] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [planSaveMsg, setPlanSaveMsg] = useState(null)

  const [stats, setStats] = useState({ totalRevenue: 0, activeSubscriptions: 0, pendingPayments: 0 })
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [plans, setPlans] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadBillingData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [fetchedStats, fetchedSubs, fetchedPays, fetchedPlans] = await Promise.all([
        getAdminBillingStats(),
        getAdminSubscriptions(),
        getAdminPayments(),
        getAdminPlans()
      ])
      setStats(fetchedStats)
      setSubscriptions(fetchedSubs)
      setPayments(fetchedPays)
      setPlans(fetchedPlans)
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBillingData()
  }, [])

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format((cents || 0) / 100)
  }

  // Filter lists
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchesSearch =
        (sub.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.plan || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || (sub.status || '').toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [subscriptions, searchQuery, statusFilter])

  const filteredPayments = useMemo(() => {
    return payments.filter(pay => {
      const matchesSearch =
        (pay.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pay.plan || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [payments, searchQuery])

  const openPlanEditor = (plan) => {
    setEditingPlan(plan)
    setEditForm({
      name: plan.name || '',
      price: plan.price ? plan.price / 100 : 0,
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      monthlyPostLimit: plan.monthlyPostLimit || 0,
      maxSocialAccounts: plan.maxSocialAccounts || 0,
    })
    setPlanSaveMsg(null)
  }

  const closePlanEditor = () => {
    setEditingPlan(null)
    setEditForm({})
    setPlanSaveMsg(null)
  }

  const handlePlanSave = async () => {
    setIsSavingPlan(true)
    setPlanSaveMsg(null)
    try {
      const payload = {
        name: editForm.name,
        price: Math.round(Number(editForm.price) * 100),
        description: editForm.description,
        features: editForm.features.split('\n').map(f => f.trim()).filter(Boolean),
        monthlyPostLimit: Number(editForm.monthlyPostLimit),
        maxSocialAccounts: Number(editForm.maxSocialAccounts),
      }
      await updateAdminPlan(editingPlan.id, payload)
      setPlanSaveMsg({ type: 'success', text: 'Plan updated successfully!' })
      const refreshed = await getAdminPlans()
      setPlans(refreshed)
      setTimeout(() => closePlanEditor(), 1200)
    } catch (err) {
      setPlanSaveMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to update plan.' })
    } finally {
      setIsSavingPlan(false)
    }
  }

  const statsCards = [
    {
      label: 'MRR / Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: CreditCard,
      tone: 'primary',
    },
    {
      label: 'Active Subscriptions',
      value: String(stats.activeSubscriptions),
      icon: Users,
      tone: 'success',
    },
    {
      label: 'Pending Payments',
      value: String(stats.pendingPayments),
      icon: AlertCircle,
      tone: 'warning',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscriptions"
        description="Monitor system revenue streams, active plans, and customer payment statuses."
      />

      {error && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`p-2 rounded-control ${
                stat.tone === 'primary' ? 'bg-primary-50 text-primary' :
                stat.tone === 'success' ? 'bg-green-50 text-green-600' :
                'bg-yellow-50 text-yellow-600'
              }`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-2xl font-bold text-ink">{stat.value}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-border flex items-center gap-6">
        {['subscriptions', 'payments', 'plans'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSearchQuery('')
            }}
            className={`px-4 pb-3 text-sm font-semibold border-b-2 transition-colors capitalize cursor-pointer ${
              activeTab === tab
                ? "text-primary border-primary"
                : "text-ink-muted border-transparent hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Canvas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
          <p className="text-sm text-ink-muted">Loading billing statistics...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab !== 'plans' && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  placeholder={activeTab === 'subscriptions' ? "Search subscriptions..." : "Search payments..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-control border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {activeTab === 'subscriptions' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-canvas border-b border-border text-ink-muted font-semibold">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Plan Level</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Renewal Date</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-canvas">
                        <td className="p-4">
                          <div className="font-semibold text-ink">{sub.customerName}</div>
                          <div className="text-xs text-ink-muted">{sub.email}</div>
                        </td>
                        <td className="p-4 font-medium text-ink">{sub.plan}</td>
                        <td className="p-4 text-ink">{formatPrice(sub.amount)}</td>
                        <td className="p-4 text-ink-muted">
                          {sub.renewsOn ? new Date(sub.renewsOn).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-4">
                          <Badge tone={sub.status === 'active' ? 'success' : 'neutral'}>
                            {sub.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-canvas border-b border-border text-ink-muted font-semibold">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-canvas">
                        <td className="p-4 font-semibold text-ink">{pay.customerName}</td>
                        <td className="p-4 text-ink">{pay.plan}</td>
                        <td className="p-4 text-ink">{formatPrice(pay.amount)}</td>
                        <td className="p-4 text-ink-muted">{new Date(pay.date).toLocaleDateString()}</td>
                        <td className="p-4 text-ink-muted capitalize">{pay.method}</td>
                        <td className="p-4">
                          <Badge tone={pay.status === 'successful' ? 'success' : 'neutral'}>
                            {pay.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-6 border-2 border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-ink">{plan.name}</h4>
                      <button
                        onClick={() => openPlanEditor(plan)}
                        className="p-1.5 rounded-control text-ink-muted hover:text-primary hover:bg-primary-50 transition-colors cursor-pointer"
                        title="Edit plan"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                    <p className="text-2xl font-black text-primary mb-1">{formatPrice(plan.price)}<span className="text-xs font-normal text-ink-muted">/mo</span></p>
                    {plan.description && (
                      <p className="text-xs text-ink-muted mb-4">{plan.description}</p>
                    )}
                    <div className="flex gap-4 mb-4">
                      <div className="text-xs text-ink-muted">
                        <span className="font-semibold text-ink">{plan.monthlyPostLimit || 0}</span> posts/mo
                      </div>
                      <div className="text-xs text-ink-muted">
                        <span className="font-semibold text-ink">{plan.maxSocialAccounts || 0}</span> accounts
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-4">
                      {(Array.isArray(plan.features) ? plan.features : []).map((f, i) => (
                        <li key={i} className="flex gap-2 text-xs text-ink-muted">
                          <span className="text-primary">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan Editor Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold text-ink">Edit Plan: {editingPlan.name}</h3>
              <button onClick={closePlanEditor} className="p-1 rounded-control hover:bg-canvas text-ink-muted hover:text-ink cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Price (NGN)</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">Monthly Post Limit</label>
                  <input
                    type="number"
                    value={editForm.monthlyPostLimit}
                    onChange={(e) => setEditForm(f => ({ ...f, monthlyPostLimit: e.target.value }))}
                    className="h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">Max Social Accounts</label>
                  <input
                    type="number"
                    value={editForm.maxSocialAccounts}
                    onChange={(e) => setEditForm(f => ({ ...f, maxSocialAccounts: e.target.value }))}
                    className="h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Features (one per line)</label>
                <textarea
                  rows={8}
                  value={editForm.features}
                  onChange={(e) => setEditForm(f => ({ ...f, features: e.target.value }))}
                  className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {planSaveMsg && (
                <div className={`text-sm font-medium px-3 py-2 rounded-control ${
                  planSaveMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {planSaveMsg.text}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={closePlanEditor}
                className="px-4 py-2 text-sm font-semibold text-ink-muted rounded-control border border-border hover:bg-canvas transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePlanSave}
                disabled={isSavingPlan}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-control hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingPlan ? (
                  <><RefreshCw size={14} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={14} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
