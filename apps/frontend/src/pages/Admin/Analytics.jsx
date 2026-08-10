import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  Sparkles,
  Download,
  ChevronDown,
  Activity,
  Clock,
  MoreVertical
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { cn } from '../../utils/cn'
import { getAdminAnalyticsSummary } from '../../features/admin/analytics-api'

const TIMEFRAMES = [
  { value: 'daily', label: 'Day' },
  { value: 'weekly', label: 'Week' },
  { value: 'monthly', label: 'Month' },
]

const DONUT_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#0EA5E9', '#8B5CF6', '#F97316']

export default function Analytics() {
  // ---------------------------------------------------------------------------
  // State variables
  // ---------------------------------------------------------------------------
  const [timeframe, setTimeframe] = useState('monthly') // 'daily' | 'weekly' | 'monthly'
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchAnalytics() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getAdminAnalyticsSummary(timeframe)
        if (isMounted) setData(result)
      } catch (err) {
        console.error('Failed to fetch admin analytics summary:', err)
        const status = err?.statusCode ? ` (HTTP ${err.statusCode})` : ''
        const message = err?.message || 'Failed to load analytics data.'
        if (isMounted) setError(`${message}${status}`)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchAnalytics()
    return () => {
      isMounted = false
    }
  }, [timeframe])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleExport = (format) => {
    alert(`Exporting reports as ${format} to downloads folder...`)
    setExportMenuOpen(false)
  }

  const formatGrowth = (percent) => {
    if (percent === null || percent === undefined) return '—'
    const sign = percent > 0 ? '+' : ''
    return `${sign}${percent}%`
  }

  // ---------------------------------------------------------------------------
  // Derived chart data
  // ---------------------------------------------------------------------------
  const revenueTrend = data?.revenueTrend || []
  const maxRevenue = Math.max(1, ...revenueTrend.map((p) => p.amount))

  let cumulativePercent = 0
  const donutSegments = (data?.planDistribution || []).map((item, idx) => {
    const segment = {
      ...item,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
      dasharray: `${item.percent} ${100 - item.percent}`,
      dashoffset: -cumulativePercent,
    }
    cumulativePercent += item.percent
    return segment
  })

  const formatDayLabel = (label) => {
    const parsed = new Date(label)
    if (Number.isNaN(parsed.getTime())) return label
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Page Header Section */}
      <PageHeader
        title="Analytics & Reports"
        description="Real-time data synchronization across all integrated social channels."
        action={
          <div className="flex items-center gap-3">
            {/* Timeframe Switcher */}
            <div className="inline-flex bg-canvas p-1 rounded-control border border-border">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTimeframe(t.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-control text-xs font-semibold capitalize transition-all",
                    timeframe === t.value
                      ? "bg-white shadow-soft text-primary font-bold"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Export Dropdown Button */}
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center gap-1.5"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                <Download size={16} />
                Export
                <ChevronDown size={14} />
              </Button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-surface border border-border rounded-card shadow-lg z-20">
                  <div className="p-1.5 space-y-1">
                    <button
                      onClick={() => handleExport('PDF')}
                      className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-canvas rounded-control text-ink transition-colors"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleExport('Excel')}
                      className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-canvas rounded-control text-ink transition-colors"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => handleExport('CSV')}
                      className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-canvas rounded-control text-ink transition-colors"
                    >
                      CSV Format
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Customer Growth (Live) */}
        <Card className="p-6 transition-all duration-200 hover:-translate-y-1" hover>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-primary-50 text-primary-700 rounded-control">
              <Users size={18} />
            </span>
            {!isLoading && !error && (
              <Badge tone={(data?.customerGrowthPercent ?? 0) >= 0 ? 'success' : 'danger'}>
                {formatGrowth(data?.customerGrowthPercent)}
              </Badge>
            )}
          </div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Customer Growth</p>
          <h3 className="text-2xl font-bold text-ink mt-1">
            {isLoading ? (
              <span className="animate-pulse text-primary-200 text-sm">Loading...</span>
            ) : error ? (
              <span className="text-red-500 text-xs font-semibold" title={error}>Error</span>
            ) : (
              data?.newCustomersThisPeriod ?? 0
            )}
          </h3>
          <p className="text-xs text-ink-muted mt-2">vs. last period · {data?.totalCustomers ?? 0} total</p>
        </Card>

        {/* Card 2: Revenue Growth (Live) */}
        <Card className="p-6 transition-all duration-200 hover:-translate-y-1" hover>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-accent-50 text-accent-600 rounded-control">
              <CreditCard size={18} />
            </span>
            {!isLoading && !error && (
              <Badge tone={(data?.revenueGrowthPercent ?? 0) >= 0 ? 'success' : 'danger'}>
                {formatGrowth(data?.revenueGrowthPercent)}
              </Badge>
            )}
          </div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Revenue Growth</p>
          <h3 className="text-2xl font-bold text-ink mt-1">
            {isLoading ? (
              <span className="animate-pulse text-primary-200 text-sm">Loading...</span>
            ) : error ? (
              <span className="text-red-500 text-xs font-semibold" title={error}>Error</span>
            ) : (
              `₦${Number(data?.revenueThisPeriod || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
            )}
          </h3>
          <p className="text-xs text-ink-muted mt-2">Revenue this period</p>
        </Card>

        {/* Card 3: Engagement Rate (Coming Soon - no backing data source) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-warning/10 text-warning rounded-control">
              <Activity size={18} />
            </span>
            <Badge tone="neutral">
              <Clock size={11} className="mr-1 inline" />
              Coming Soon
            </Badge>
          </div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Engagement Rate</p>
          <h3 className="text-2xl font-bold text-ink-muted/40 mt-1">—</h3>
          <p className="text-xs text-ink-muted mt-2">Avg. across channels</p>
        </Card>

        {/* Card 4: AI Usage Volume (Coming Soon - no backing data source) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-primary-50 text-primary-700 rounded-control">
              <Sparkles size={18} />
            </span>
            <Badge tone="neutral">
              <Clock size={11} className="mr-1 inline" />
              Coming Soon
            </Badge>
          </div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">AI Usage Volume</p>
          <h3 className="text-2xl font-bold text-ink-muted/40 mt-1">—</h3>
          <p className="text-xs text-ink-muted mt-2">Total generations</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Analytics (Live) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-ink">Revenue Analytics</h4>
            <span className="text-ink-muted cursor-pointer"><MoreVertical size={16} /></span>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-ink-muted">Loading chart...</div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center text-sm text-red-500 text-center px-6">{error}</div>
          ) : revenueTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-ink-muted">
              No revenue recorded for this period yet.
            </div>
          ) : (
            <>
              <div className="h-64 relative flex items-end justify-between gap-3 border-b border-l border-border pb-2 pl-2">
                {revenueTrend.map((point, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-primary/20 hover:bg-primary transition-all rounded-t-sm"
                    style={{ height: `${Math.max(4, (point.amount / maxRevenue) * 100)}%` }}
                    title={`₦${point.amount.toLocaleString('en-NG')}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-3 px-2 text-xs font-medium text-ink-muted">
                {revenueTrend.map((point, index) => (
                  <span key={index}>{formatDayLabel(point.label)}</span>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Social Media Performance (Coming Soon - no backing data source) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-ink">Social Media Performance</h4>
            <Badge tone="neutral">
              <Clock size={11} className="mr-1 inline" />
              Coming Soon
            </Badge>
          </div>
          <div className="h-64 flex items-center justify-center text-center px-6">
            <p className="text-sm text-ink-muted">
              Reach, engagement, and conversion tracking will appear here once post-level performance data is available.
            </p>
          </div>
        </Card>

        {/* Platform Analytics (Donut - Live) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-ink">Platform Analytics</h4>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-ink-muted">Loading chart...</div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center text-sm text-red-500">Failed to load chart data.</div>
          ) : donutSegments.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-ink-muted">
              No active subscriptions yet.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-8 h-auto sm:h-64 py-4 sm:py-0">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" fill="none" r="15.915" stroke="#F3F4F6" strokeWidth="3" />
                  {donutSegments.map((segment, idx) => (
                    <circle
                      key={idx}
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      stroke={segment.color}
                      strokeWidth="3"
                      strokeDasharray={segment.dasharray}
                      strokeDashoffset={segment.dashoffset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-ink">{data.activeSubscriptions}</span>
                  <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">Active Subs</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                {donutSegments.map((segment, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-ink-muted">{segment.planName}</span>
                    </div>
                    <span className="font-semibold text-ink">{segment.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* AI Usage Reports (Coming Soon - no backing data source) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-ink">AI Usage Reports</h4>
            <Badge tone="neutral">
              <Clock size={11} className="mr-1 inline" />
              Coming Soon
            </Badge>
          </div>
          <div className="h-64 flex items-center justify-center text-center px-6">
            <p className="text-sm text-ink-muted">
              AI generation volume tracking will appear here once usage logging is added.
            </p>
          </div>
        </Card>
      </div>

      {/* Top Performing Content (Coming Soon - no backing data source) */}
      <Card className="overflow-hidden p-0 border-border">
        <div className="p-6 flex items-center justify-between border-b border-border">
          <h4 className="text-base font-semibold text-ink">Top Performing Content</h4>
          <Badge tone="neutral">
            <Clock size={11} className="mr-1 inline" />
            Coming Soon
          </Badge>
        </div>
        <div className="p-10 flex items-center justify-center text-center">
          <p className="text-sm text-ink-muted max-w-md">
            Post-level engagement scoring will appear here once content performance tracking is added.
          </p>
        </div>
      </Card>

      {/* Footer */}
      <footer className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted border-t border-border gap-4">
        <p>© 2023 Precision AI. All data encrypted and secured.</p>
        <div className="flex items-center gap-6">
          <a className="hover:text-primary transition-colors" href="#">Documentation</a>
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">API Status</a>
        </div>
      </footer>
    </div>
  )
}