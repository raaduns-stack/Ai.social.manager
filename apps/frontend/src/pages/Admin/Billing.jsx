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
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { getAdminBillingStats, getAdminSubscriptions, getAdminPayments } from '../../features/admin/admin-api'
import { getPlans } from '../../features/plans/plans-api'
import ErrorBanner from '../../components/error-banner'

export default function Billing() {
  const [activeTab, setActiveTab] = useState('subscriptions') // 'plans' | 'subscriptions' | 'payments'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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
        getPlans()
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-6 border-2 border-border flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-ink mb-2">{plan.name}</h4>
                    <p className="text-2xl font-black text-primary mb-4">{formatPrice(plan.price)}<span className="text-xs font-normal text-ink-muted">/mo</span></p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex gap-2 text-sm text-ink-muted">
                        <span>•</span>
                        <span>Connect {plan.features?.channels || 1} accounts</span>
                      </li>
                      <li className="flex gap-2 text-sm text-ink-muted">
                        <span>•</span>
                        <span>{plan.features?.posts || 5} AI posts/month</span>
                      </li>
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
