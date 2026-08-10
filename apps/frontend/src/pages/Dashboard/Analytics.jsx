import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Download,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { getMyAnalyticsSummary } from '../../features/dashboard/analytics-api'

const kpiCards = [
  { title: 'Total Followers' },
  { title: 'Impressions' },
  { title: 'Engagement Rate' },
  { title: 'Profile Visits' },
]

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('Monthly')
  const timeframes = ['Daily', 'Weekly', 'Monthly']

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchAnalytics() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await getMyAnalyticsSummary()
        if (isMounted) setData(result)
      } catch (err) {
        console.error('Failed to fetch analytics summary:', err)
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
  }, [])

  const connectedPlatforms = data?.connectedPlatforms || []

  const connectedCaption = isLoading
    ? 'Checking your connected accounts...'
    : error
      ? error
      : connectedPlatforms.length === 0
        ? 'No social accounts connected yet — connect one to start collecting data.'
        : `Connected: ${connectedPlatforms.map((p) => p.platform).join(', ')}. Engagement breakdown will appear here once tracking is available.`

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Analytics"
        description="Real-time performance metrics across your social ecosystem."
        action={
          <div className="bg-canvas border border-border rounded-control p-1 flex items-center shadow-soft">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs rounded-control transition-all ${timeframe === tf
                    ? 'bg-surface text-primary shadow-soft font-semibold'
                    : 'text-ink-muted hover:text-ink'
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards Grid (Coming Soon - no post/engagement data source yet) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((stat) => (
          <Card key={stat.title} className="p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                {stat.title}
              </span>
              <Badge tone="neutral" className="gap-1">
                <Clock className="w-3 h-3" />
                Coming Soon
              </Badge>
            </div>
            <span className="text-2xl font-bold text-ink-muted/40 mt-1">—</span>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Follower Growth (Coming Soon - no follower history table) */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-ink">Follower Growth</h3>
            <Badge tone="neutral" className="gap-1">
              <Clock className="w-3 h-3" />
              Coming Soon
            </Badge>
          </div>
          <div className="flex-grow min-h-[260px] flex items-center justify-center text-center px-6">
            <p className="text-sm text-ink-muted">
              Follower growth over time will appear here once we start tracking historical follower counts.
            </p>
          </div>
        </Card>

        {/* Engagement Overview (Coming Soon - shows real connected-account context) */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-ink">Engagement Overview</h3>
            <Badge tone="neutral" className="gap-1">
              <Clock className="w-3 h-3" />
              Coming Soon
            </Badge>
          </div>
          <div className="flex-grow flex items-center justify-center text-center px-2 min-h-[160px]">
            <MoreHorizontal className="w-6 h-6 text-ink-muted/40" />
          </div>
          <p className="text-xs text-ink-muted mt-6 text-center">{connectedCaption}</p>
        </Card>
      </div>

      {/* Top Posts & Monthly Report Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Posts (Coming Soon - no posts/engagement table) */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Top Performing Posts</h3>
            <Badge tone="neutral" className="gap-1">
              <Clock className="w-3 h-3" />
              Coming Soon
            </Badge>
          </div>
          <div className="p-10 flex items-center justify-center text-center">
            <p className="text-sm text-ink-muted max-w-md">
              Post-level likes and engagement rate will appear here once content performance tracking is added.
            </p>
          </div>
        </Card>

        {/* Monthly Performance Report Card (Coming Soon - narrative requires post/engagement data) */}
        <Card className="bg-primary text-white p-6 flex flex-col justify-between relative overflow-hidden shadow-soft border-transparent">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />

          <div className="mb-6 z-10">
            <div className="w-12 h-12 rounded-control bg-white/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Monthly Report</h3>
            <p className="text-xs text-white/80 mt-1">Coming soon</p>
          </div>

          <div className="flex-grow mb-6 z-10">
            <div className="bg-white/10 rounded-control p-4 border border-white/10 backdrop-blur-sm">
              <p className="text-sm font-medium text-white">
                A full performance report will be available here once post-level engagement tracking is live.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full bg-white/50 text-primary border-transparent font-semibold gap-2 z-10 cursor-not-allowed"
            disabled
          >
            <Download className="w-4 h-4" />
            Report Not Yet Available
          </Button>
        </Card>
      </div>
    </div>
  )
}