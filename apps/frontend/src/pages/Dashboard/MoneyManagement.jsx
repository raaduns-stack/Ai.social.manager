import { useState, useEffect, useMemo } from 'react'
import {
  DollarSign,
  Clock,
  Calendar,
  Landmark,
  TrendingUp,
  TrendingDown,
  Upload,
  Download,
  Filter,
  Info,
  Sparkles,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Search,
  Loader2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ErrorBanner from '../../components/error-banner'
import { getAdminBillingStats, getAdminSubscriptions, getAdminPayments } from '../../features/admin/admin-api'

// Helper function to format cents to NGN currency
const formatPrice = (cents) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100)
}

// Helper to format date strings
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Helper to get initials of user
const getInitials = (name) => {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function MoneyManagement() {
  const [timeframe, setTimeframe] = useState('Daily')
  const [statusFilter, setStatusFilter] = useState('All')
  const [methodFilter, setMethodFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [reportType, setReportType] = useState('Quarterly Report')
  const [isGenerating, setIsGenerating] = useState(false)

  // API Data States
  const [stats, setStats] = useState({ totalRevenue: 0, activeSubscriptions: 0, pendingPayments: 0 })
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [fetchedStats, fetchedSubs, fetchedPays] = await Promise.all([
        getAdminBillingStats(),
        getAdminSubscriptions(),
        getAdminPayments(),
      ])
      setStats(fetchedStats)
      setSubscriptions(fetchedSubs)
      setPayments(fetchedPays)
    } catch (err) {
      console.error('Failed to load money management data:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate dynamic revenue statistics based on payments list
  const computedRevenueStats = useMemo(() => {
    const now = new Date()
    const todayStr = now.toDateString()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    let todayCents = 0
    let monthCents = 0
    let yearCents = 0
    const totalCents = stats.totalRevenue || 0

    payments.forEach(p => {
      const status = p.status?.toLowerCase()
      if (status === 'successful' || status === 'success') {
        const pDate = new Date(p.date)
        if (pDate.toDateString() === todayStr) {
          todayCents += p.amount
        }
        if (pDate.getMonth() === thisMonth && pDate.getFullYear() === thisYear) {
          monthCents += p.amount
        }
        if (pDate.getFullYear() === thisYear) {
          yearCents += p.amount
        }
      }
    })

    return [
      {
        id: 'total',
        label: 'Total Revenue',
        amount: formatPrice(totalCents),
        change: '—',
        changeSub: 'Overall successful platform revenue',
        isPositive: true,
        icon: DollarSign,
        badgeBg: 'bg-primary-50 text-primary-700',
      },
      {
        id: 'today',
        label: "Today's Revenue",
        amount: formatPrice(todayCents),
        change: '—',
        changeSub: "Today's successful collections",
        isPositive: true,
        icon: Clock,
        badgeBg: 'bg-accent-50 text-accent-600',
      },
      {
        id: 'monthly',
        label: 'Monthly Revenue',
        amount: formatPrice(monthCents),
        change: '—',
        changeSub: 'Current calendar month',
        isPositive: true,
        icon: Calendar,
        badgeBg: 'bg-amber-50 text-warning',
      },
      {
        id: 'annual',
        label: 'Annual Revenue',
        amount: formatPrice(yearCents),
        change: '—',
        changeSub: 'Current calendar year',
        isPositive: true,
        icon: Landmark,
        badgeBg: 'bg-canvas text-ink-muted',
      },
    ]
  }, [stats.totalRevenue, payments])

  // Calculate dynamic chart points based on timeframe selection
  const chartData = useMemo(() => {
    const successfulPayments = payments.filter(p => {
      const status = p.status?.toLowerCase()
      return status === 'successful' || status === 'success'
    })
    
    // 1. Daily (last 7 days)
    const dailyPoints = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dateStr = d.toDateString()
      const valueCents = successfulPayments
        .filter(p => new Date(p.date).toDateString() === dateStr)
        .reduce((sum, p) => sum + p.amount, 0)
      dailyPoints.push({ label, val: valueCents })
    }
    
    // 2. Weekly (last 4 weeks)
    const weeklyPoints = []
    for (let i = 3; i >= 0; i--) {
      const label = `W-${i}`
      const dStart = new Date()
      dStart.setDate(dStart.getDate() - (i + 1) * 7)
      const dEnd = new Date()
      dEnd.setDate(dEnd.getDate() - i * 7)
      const valueCents = successfulPayments
        .filter(p => {
          const pDate = new Date(p.date)
          return pDate >= dStart && pDate < dEnd
        })
        .reduce((sum, p) => sum + p.amount, 0)
      weeklyPoints.push({ label, val: valueCents })
    }

    // 3. Monthly (last 6 months)
    const monthlyPoints = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      const month = d.getMonth()
      const year = d.getFullYear()
      const valueCents = successfulPayments
        .filter(p => {
          const pDate = new Date(p.date)
          return pDate.getMonth() === month && pDate.getFullYear() === year
        })
        .reduce((sum, p) => sum + p.amount, 0)
      monthlyPoints.push({ label, val: valueCents })
    }

    // 4. Yearly (last 4 years)
    const yearlyPoints = []
    const thisYear = new Date().getFullYear()
    for (let i = 3; i >= 0; i--) {
      const year = thisYear - i
      const label = String(year)
      const valueCents = successfulPayments
        .filter(p => new Date(p.date).getFullYear() === year)
        .reduce((sum, p) => sum + p.amount, 0)
      yearlyPoints.push({ label, val: valueCents })
    }

    const mapToHeight = (points) => {
      const maxVal = Math.max(...points.map(p => p.val), 0)
      return points.map(p => {
        const heightPercent = maxVal > 0 ? (p.val / maxVal) * 80 + 10 : 0
        return {
          label: p.label,
          value: formatChartVal(p.val),
          height: maxVal > 0 ? `${heightPercent}%` : '5%',
          active: p.val > 0 && p.val === maxVal,
        }
      })
    }

    const formatChartVal = (val) => formatPrice(val)

    return {
      Daily: mapToHeight(dailyPoints),
      Weekly: mapToHeight(weeklyPoints),
      Monthly: mapToHeight(monthlyPoints),
      Yearly: mapToHeight(yearlyPoints),
    }
  }, [payments])

  // Calculate dynamic Payment Analytics
  const paymentAnalytics = useMemo(() => {
    let successfulCount = 0
    let successfulAmount = 0
    let pendingCount = 0
    let pendingAmount = 0
    let failedCount = 0
    let failedAmount = 0
    let refundedCount = 0
    let refundedAmount = 0

    payments.forEach(p => {
      const status = p.status?.toLowerCase()
      if (status === 'successful' || status === 'success') {
        successfulCount++
        successfulAmount += p.amount
      } else if (status === 'pending') {
        pendingCount++
        pendingAmount += p.amount
      } else if (status === 'failed') {
        failedCount++
        failedAmount += p.amount
      } else if (status === 'refunded') {
        refundedCount++
        refundedAmount += p.amount
      }
    })

    const totalCount = payments.length

    return [
      {
        id: 'successful',
        label: 'Successful',
        count: successfulCount.toLocaleString(),
        amount: formatPrice(successfulAmount),
        change: totalCount > 0 ? `${Math.round((successfulCount / totalCount) * 100)}%` : '0%',
        isPositive: true,
        borderClass: 'border-l-accent',
        tone: 'success',
      },
      {
        id: 'pending',
        label: 'Pending',
        count: pendingCount.toLocaleString(),
        amount: formatPrice(pendingAmount),
        change: totalCount > 0 ? `${Math.round((pendingCount / totalCount) * 100)}%` : '0%',
        isPositive: true,
        borderClass: 'border-l-warning',
        tone: 'warning',
      },
      {
        id: 'failed',
        label: 'Failed',
        count: failedCount.toLocaleString(),
        amount: formatPrice(failedAmount),
        change: totalCount > 0 ? `${Math.round((failedCount / totalCount) * 100)}%` : '0%',
        isPositive: false,
        borderClass: 'border-l-danger',
        tone: 'danger',
      },
      {
        id: 'refunded',
        label: 'Refunded',
        count: refundedCount.toLocaleString(),
        amount: formatPrice(refundedAmount),
        change: totalCount > 0 ? `${Math.round((refundedCount / totalCount) * 100)}%` : '0%',
        isPositive: null,
        borderClass: 'border-l-primary',
        tone: 'neutral',
      },
    ]
  }, [payments])

  // Calculate Subscription tier breakdown
  const subscriptionBreakdown = useMemo(() => {
    let freeCount = 0
    let starterCount = 0
    let growthCount = 0
    let enterpriseCount = 0

    subscriptions.forEach(sub => {
      const p = sub.plan?.toLowerCase() || ''
      if (p.includes('free')) {
        freeCount++
      } else if (p.includes('starter')) {
        starterCount++
      } else if (p.includes('growth')) {
        growthCount++
      } else {
        enterpriseCount++
      }
    })

    const totalCount = subscriptions.length || 1

    return [
      { label: 'Free Plan', amount: freeCount.toString(), share: `${Math.round((freeCount / totalCount) * 100)}% Share`, color: 'bg-primary-300' },
      { label: 'Starter Tier', amount: starterCount.toString(), share: `${Math.round((starterCount / totalCount) * 100)}% Share`, color: 'bg-primary' },
      { label: 'Growth Tier', amount: growthCount.toString(), share: `${Math.round((growthCount / totalCount) * 100)}% Share`, color: 'bg-accent' },
      { label: 'Enterprise Tier', amount: enterpriseCount.toString(), share: `${Math.round((enterpriseCount / totalCount) * 100)}% Share`, color: 'bg-warning' },
    ]
  }, [subscriptions])

  // Dynamic values for donut diagram
  const subscriptionPercentages = useMemo(() => {
    const total = subscriptions.length || 1
    let free = 0
    let starter = 0
    let growth = 0
    let enterprise = 0

    subscriptions.forEach(sub => {
      const p = sub.plan?.toLowerCase() || ''
      if (p.includes('free')) free++
      else if (p.includes('starter')) starter++
      else if (p.includes('growth')) growth++
      else enterprise++
    })

    return {
      free: Math.round((free / total) * 100),
      starter: Math.round((starter / total) * 100),
      growth: Math.round((growth / total) * 100),
      enterprise: Math.round((enterprise / total) * 100),
    }
  }, [subscriptions])

  // Dynamic Payment Methods percentage
  const paymentMethodsPercentages = useMemo(() => {
    let flwCount = 0
    let otherCount = 0

    payments.forEach(p => {
      const gateway = p.method?.toLowerCase()
      if (gateway?.includes('flutterwave')) {
        flwCount++
      } else {
        otherCount++
      }
    })

    const total = payments.length || 1
    return {
      flw: Math.round((flwCount / total) * 100),
      other: Math.round((otherCount / total) * 100)
    }
  }, [payments])

  // Dynamic Billing Period percentage (Monthly vs Annual)
  const billingPeriodPercentages = useMemo(() => {
    let monthlyCount = 0
    let annualCount = 0

    subscriptions.forEach(sub => {
      if (sub.plan?.toLowerCase().includes('annual') || sub.plan?.toLowerCase().includes('yearly')) {
        annualCount++
      } else {
        monthlyCount++
      }
    })

    const total = subscriptions.length || 1
    return {
      monthly: Math.round((monthlyCount / total) * 100),
      annual: Math.round((annualCount / total) * 100)
    }
  }, [subscriptions])

  // Filter transactions dynamically
  const filteredTransactions = useMemo(() => {
    return payments.filter((trx) => {
      const matchesStatus =
        statusFilter === 'All' || trx.status?.toLowerCase() === statusFilter.toLowerCase()
      
      const methodLower = trx.method?.toLowerCase() || ''
      const matchesMethod =
        methodFilter === 'All' ||
        (methodFilter === 'Flutterwave' && methodLower.includes('flutterwave')) ||
        (methodFilter === 'Paystack' && methodLower.includes('paystack')) ||
        (methodFilter === 'Card' && methodLower.includes('card')) ||
        (methodFilter === 'Bank Transfer' && methodLower.includes('transfer'))

      const matchesSearch =
        searchQuery === '' ||
        (trx.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trx.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trx.plan || '').toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesMethod && matchesSearch
    })
  }, [payments, statusFilter, methodFilter, searchQuery])

  // Client-side report generation helper
  const handleGenerateReport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      // Display native alert or confirm
      const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0)
      alert(`Report generated successfully!\nType: ${reportType}\nTransactions analyzed: ${filteredTransactions.length}\nTotal Volume: ${formatPrice(totalAmount)}`)
    }, 1500)
  }

  // Get color code for status badges
  const getStatusBadgeTone = (status) => {
    if (!status) return 'neutral'
    switch (status.toUpperCase()) {
      case 'SUCCESS':
      case 'SUCCESSFUL':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'FAILED':
        return 'danger'
      case 'REFUNDED':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={36} className="text-primary animate-spin" />
        <span className="text-sm font-semibold text-ink-muted">Loading Money Management...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <PageHeader title="Money Management" description="Monitor platform revenue and transactions." />
        <ErrorBanner error={error} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Controls */}
      <PageHeader
        title="Money Management"
        description="Monitor platform revenue, payments, subscription earnings, transactions, and financial reports."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-control shadow-soft text-sm text-ink-muted">
              <Calendar size={16} />
              <span className="font-medium text-ink">
                {payments.length > 0
                  ? `${formatDate(payments[payments.length - 1].date)} - ${formatDate(payments[0].date)}`
                  : 'No Records'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              title="Export Report"
              onClick={handleGenerateReport}
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Export Report</span>
            </Button>
          </div>
        }
      />

      {/* Section 1: Revenue Overview */}
      <section className="space-y-6">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {computedRevenueStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.id} hover className="p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className={`p-2 rounded-control flex items-center justify-center ${stat.badgeBg}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-ink">{stat.amount}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    <span className="text-ink-muted">{stat.changeSub}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Main Revenue Performance Chart Area */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-ink">Revenue Performance</h2>
              {payments.length === 0 && (
                <p className="text-xs text-ink-muted mt-0.5">No revenue records found in database.</p>
              )}
            </div>
            <div className="flex bg-canvas p-1 rounded-control border border-border">
              {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-control text-xs font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-surface text-ink shadow-soft font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full relative pt-6">
            {payments.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas/30 rounded-card border border-dashed border-border p-6 text-center">
                <TrendingUp size={24} className="text-ink-muted mb-2" />
                <p className="text-xs font-semibold text-ink">No Transaction History</p>
                <p className="text-[10px] text-ink-muted mt-0.5">Visual charts will populate once successful transactions are logged.</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4 px-2">
                {chartData[timeframe].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    <div
                      style={{ height: item.height }}
                      className={`w-full rounded-t-control transition-all relative ${
                        item.active ? 'bg-primary shadow-soft' : 'bg-primary-50 hover:bg-primary-100'
                      }`}
                    >
                      <div className="absolute bottom-full mb-1 inset-x-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-primary bg-surface border border-border rounded px-1 py-0.5 shadow-soft z-10 whitespace-nowrap">
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="absolute bottom-0 left-0 w-full h-px bg-border" />
          </div>

          {payments.length > 0 && (
            <div className="flex justify-between mt-4 px-2 text-xs font-medium text-ink-muted">
              {chartData[timeframe].map((item, idx) => (
                <span key={idx} className="flex-1 text-center">
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Section 2: Payment Analytics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Payment Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paymentAnalytics.map((item) => (
            <Card key={item.id} className={`p-6 border-l-4 ${item.borderClass}`}>
              <div className="text-xs font-medium text-ink-muted mb-2">{item.label}</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-bold text-ink">{item.count}</div>
                  <div className="text-sm text-ink-muted font-medium mt-0.5">{item.amount}</div>
                </div>
                {payments.length > 0 && item.change !== '0%' && (
                  <div className="text-xs font-semibold flex items-center gap-0.5 text-accent-600">
                    {item.change} Share
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3 & 4: Breakdown Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Revenue Donut */}
        <Card className="lg:col-span-2 p-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/2">
            <h2 className="text-lg font-semibold text-ink mb-1">Subscription Revenue</h2>
            <p className="text-xs text-ink-muted mb-6">Breakdown by active user subscription plans</p>
            <div className="space-y-3">
              {subscriptionBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 hover:bg-canvas rounded-control transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-ink">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-ink">{item.amount} Users</div>
                    <div className="text-xs text-ink-muted">{item.share}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center shrink-0 my-4 md:my-0">
            {subscriptions.length === 0 ? (
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-border flex items-center justify-center text-center p-4">
                <span className="text-[10px] text-ink-muted font-medium">No Subscriptions</span>
              </div>
            ) : (
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle className="stroke-canvas" cx="18" cy="18" fill="none" r="16" strokeWidth="3.5" />
                {subscriptionPercentages.starter > 0 && (
                  <circle
                    className="stroke-primary"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeDasharray={`${subscriptionPercentages.starter} 100`}
                    strokeWidth="3.5"
                  />
                )}
                {subscriptionPercentages.growth > 0 && (
                  <circle
                    className="stroke-accent"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeDasharray={`${subscriptionPercentages.growth} 100`}
                    strokeDashoffset={`-${subscriptionPercentages.starter}`}
                    strokeWidth="3.5"
                  />
                )}
                {subscriptionPercentages.enterprise > 0 && (
                  <circle
                    className="stroke-warning"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeDasharray={`${subscriptionPercentages.enterprise} 100`}
                    strokeDashoffset={`-${subscriptionPercentages.starter + subscriptionPercentages.growth}`}
                    strokeWidth="3.5"
                  />
                )}
              </svg>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-ink">
                {subscriptions.filter((s) => s.status?.toLowerCase() === 'active').length}
              </span>
              <span className="text-xs font-medium text-ink-muted">Active</span>
            </div>
          </div>
        </Card>

        {/* Mini Breakdown Column */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Payment Gateways
              </h3>
              <Info size={16} className="text-ink-muted" />
            </div>
            {payments.length === 0 ? (
              <div className="py-2 text-center text-xs text-ink-muted">No gateway data.</div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 relative shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle className="stroke-canvas" cx="18" cy="18" fill="none" r="16" strokeWidth="4" />
                    <circle
                      className="stroke-primary"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="16"
                      strokeDasharray={`${paymentMethodsPercentages.flw} 100`}
                      strokeWidth="4"
                    />
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-ink">Flutterwave</span>
                    <span className="text-ink font-semibold">{paymentMethodsPercentages.flw}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-ink-muted">
                    <span>Other Gateways</span>
                    <span className="font-medium">{paymentMethodsPercentages.other}%</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Billing Period
              </h3>
              <Info size={16} className="text-ink-muted" />
            </div>
            {subscriptions.length === 0 ? (
              <div className="py-2 text-center text-xs text-ink-muted">No billing period data.</div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 relative shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle className="stroke-canvas" cx="18" cy="18" fill="none" r="16" strokeWidth="4" />
                    <circle
                      className="stroke-accent"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="16"
                      strokeDasharray={`${billingPeriodPercentages.monthly} 100`}
                      strokeWidth="4"
                    />
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-ink">Monthly Interval</span>
                    <span className="text-ink font-semibold">{billingPeriodPercentages.monthly}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-ink-muted">
                    <span>Annual Interval</span>
                    <span className="font-medium">{billingPeriodPercentages.annual}%</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Section 5: Transaction Management */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">Transaction Management</h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 text-xs rounded-control border border-border bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-surface border border-border px-3 py-1.5 rounded-control text-xs text-ink-muted">
              <Filter size={14} className="text-ink-muted shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter transactions by status"
                className="bg-transparent text-ink font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center bg-surface border border-border px-3 py-1.5 rounded-control text-xs text-ink-muted">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                aria-label="Filter transactions by payment method"
                className="bg-transparent text-ink font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">Gateway: All</option>
                <option value="Flutterwave">Flutterwave</option>
                <option value="Paystack">Paystack</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden p-0 border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border">
                  <th className="px-6 py-3.5 text-xs font-bold text-ink uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-ink uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-ink uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-ink uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-ink uppercase tracking-wider">
                    Gateway
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-ink uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-ink uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3.5 text-xs font-bold text-ink uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-canvas transition-colors">
                      <td className="px-6 py-4 text-xs font-medium text-ink truncate max-w-[120px]" title={trx.id}>
                        {trx.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-[9999px] bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 border border-primary/20">
                            {getInitials(trx.customerName)}
                          </div>
                          <span className="text-xs font-semibold text-ink">{trx.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone="neutral" className="text-[10px] font-semibold uppercase">
                          {trx.plan}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-ink">{formatPrice(trx.amount)}</td>
                      <td className="px-6 py-4 text-xs text-ink-muted capitalize">{trx.method}</td>
                      <td className="px-6 py-4">
                        <Badge tone={getStatusBadgeTone(trx.status)} className="text-[10px] capitalize">
                          {trx.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted">{formatDate(trx.date)}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(trx)}
                          className="text-primary hover:text-primary-700 h-auto p-0 font-medium text-xs"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-xs text-ink-muted">
                      No transactions found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border gap-4 bg-surface">
            <span className="text-xs text-ink-muted">
              Showing {filteredTransactions.length} of {payments.length} transactions
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Transaction Details Modal */}
      <Modal
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={selectedTransaction ? `Transaction Details — ${selectedTransaction.id}` : ''}
      >
        {selectedTransaction && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 bg-canvas rounded-card border border-border">
              <div>
                <p className="text-xs text-ink-muted">Amount Paid</p>
                <p className="text-2xl font-bold text-ink mt-0.5">{formatPrice(selectedTransaction.amount)}</p>
              </div>
              <Badge tone={getStatusBadgeTone(selectedTransaction.status)} className="text-xs px-3 py-1 capitalize">
                {selectedTransaction.status}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Customer Name</span>
                <span className="font-medium text-ink">{selectedTransaction.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Email</span>
                <span className="font-medium text-ink">{selectedTransaction.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Subscription Plan</span>
                <span className="font-medium text-ink">{selectedTransaction.plan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Payment Gateway</span>
                <span className="font-medium text-ink capitalize">{selectedTransaction.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Transaction Date</span>
                <span className="font-medium text-ink">{formatDate(selectedTransaction.date)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(null)}>
                Close
              </Button>
              <Button variant="primary" size="sm" className="gap-1.5" onClick={() => {
                alert(`Receipt downloaded for transaction ${selectedTransaction.id}`)
              }}>
                <Download size={14} /> Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Section 6: Financial Reports */}
      <section className="space-y-4">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-ink mb-1">Financial Reports</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Configure and download detailed financial statements for your accounting and audit purposes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  aria-label="Select report type"
                  className="appearance-none bg-surface border border-border pl-3 pr-8 py-2 rounded-control text-xs font-medium text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[160px]"
                >
                  <option>Quarterly Report</option>
                  <option>Annual Report</option>
                  <option>Custom Range</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="gap-1.5"
              >
                <Sparkles size={16} />
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 'report-1',
                name: 'Q3 Revenue Statement.pdf',
                meta: 'Generated Oct 12, 2026 • 2.4 MB',
                icon: FileText,
                iconColor: 'text-primary bg-primary-50',
              },
              {
                id: 'report-2',
                name: 'Annual Tax Summary.xlsx',
                meta: 'Generated Jan 05, 2026 • 1.1 MB',
                icon: FileSpreadsheet,
                iconColor: 'text-accent-600 bg-accent-50',
              },
              {
                id: 'report-3',
                name: 'Subscription Audit.pdf',
                meta: 'Generated Sept 30, 2026 • 4.8 MB',
                icon: FileText,
                iconColor: 'text-warning bg-amber-50',
              },
            ].map((report) => {
              const Icon = report.icon
              return (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-card hover:border-primary-200 transition-colors cursor-pointer group bg-surface shadow-soft"
                  onClick={() => {
                    alert(`Opening report: ${report.name}`)
                  }}
                >
                  <div
                    className={`p-3 rounded-full shrink-0 ${report.iconColor} group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-ink truncate group-hover:text-primary transition-colors">
                      {report.name}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-0.5">{report.meta}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>
    </div>
  )
}
