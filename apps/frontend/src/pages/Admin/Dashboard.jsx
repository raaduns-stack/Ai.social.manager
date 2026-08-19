import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CreditCard,
  Send,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Link2,
  UserCheck,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import { getAdminDashboardSummary } from '../../features/admin/dashboard-api'
import { cn } from '../../utils/cn'

function formatGrowth(percent) {
  if (percent === null || percent === undefined) return '0%'
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent}%`
}

function relativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const delta = Math.max(0, Date.now() - then)
  const mins = Math.floor(delta / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function pointsToPath(values, width = 800, height = 250) {
  if (!values.length) return ''
  const max = Math.max(1, ...values)
  const step = values.length === 1 ? 0 : width / (values.length - 1)
  return values
    .map((v, i) => {
      const x = i * step
      const y = height - (v / max) * (height - 24) - 12
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
}

function formatDayLabel(label) {
  const parsed = new Date(label)
  if (Number.isNaN(parsed.getTime())) return label
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function GrowthBadge({ percent }) {
  const up = (percent ?? 0) >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={cn('font-ui-mono text-ui-mono mb-1 flex items-center', up ? 'text-primary' : 'text-error')}>
      <Icon className="text-sm w-3.5 h-3.5 mr-0.5" /> {formatGrowth(percent)}
    </span>
  )
}

function UserGroupTable({ title, count, users, emptyLabel, viewAllTo }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-surface-variant flex items-center justify-between">
        <div>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{title}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {count} {count === 1 ? 'user' : 'users'}
          </p>
        </div>
        <Link to={viewAllTo} className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      </div>
      {users.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-on-surface-variant">{emptyLabel}</div>
      ) : (
        <div className="divide-y divide-surface-variant">
          {users.map((user) => (
            <Link
              key={user.id}
              to={`/admin/users/${user.id}`}
              className="px-6 py-3 flex items-center justify-between hover:bg-surface-container-low transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{user.name || '—'}</p>
                <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
              </div>
              <span className="ml-3 shrink-0 inline-flex items-center px-2 py-0.5 rounded-DEFAULT text-xs font-semibold bg-surface-container-highest text-on-surface border border-surface-variant">
                {user.plan}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState('weekly')
  const [summaryData, setSummaryData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('recent')

  useEffect(() => {
    let isMounted = true
    async function fetchSummary() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getAdminDashboardSummary(period)
        if (isMounted) setSummaryData(data)
      } catch (err) {
        console.error('Failed to fetch admin summary:', err)
        if (isMounted) setError('Failed to load dashboard metrics.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchSummary()
    return () => {
      isMounted = false
    }
  }, [period])

  const renderValue = (value) => {
    if (isLoading) {
      return <span className="animate-pulse text-on-surface-variant/40 text-sm">Loading...</span>
    }
    if (error) {
      return <span className="text-error text-xs font-semibold">Error</span>
    }
    if (value === null || value === undefined) return 0
    return value
  }

  const pubTrend = summaryData?.publishingTrend || []
  const hasPublishingData = pubTrend.some((p) => p.published > 0 || p.scheduled > 0)
  const successPath = pointsToPath(pubTrend.map((p) => p.published))
  const scheduledPath = pointsToPath(pubTrend.map((p) => p.scheduled))
  const chartLabels = pubTrend.filter((_, i) => {
    if (pubTrend.length <= 8) return true
    const step = Math.ceil(pubTrend.length / 7)
    return i % step === 0 || i === pubTrend.length - 1
  })

  const revenueTrend = summaryData?.revenueTrend || []
  const hasRevenueBars = revenueTrend.some((p) => p.amount > 0)
  const maxRevenue = Math.max(1, ...revenueTrend.map((p) => p.amount))

  const recentActivity = summaryData?.recentActivity || []
  const recentPosts = summaryData?.recentPosts || []

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        .animated-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawPath 1.8s ease-out forwards;
        }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Good morning, Admin.</h2>
          <p className="text-sm text-on-surface-variant">Here is what is happening across Raasocial.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 border border-surface-variant bg-surface rounded-lg p-1 shadow-soft">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value)}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-all font-ui-mono",
                  period === item.value
                    ? 'bg-primary text-on-primary font-bold shadow-soft'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                )}
              >
                {item.label.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            as={Link}
            to="/admin/analytics"
            variant="outline"
            className="flex items-center gap-2 border border-surface-variant text-on-surface-variant hover:border-on-surface hover:bg-surface-container-low transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Full Analytics</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Total Customers</span>
            <Users className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.totalCustomers ?? 0)}
            </span>
            {!isLoading && !error && <GrowthBadge percent={summaryData?.customerGrowthPercent} />}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Free Users</span>
            <UserCheck className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.freeUsers ?? 0)}
            </span>
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">Currently on the Free plan</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Paid Users</span>
            <CreditCard className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.paidUsers ?? 0)}
            </span>
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block">
            {summaryData?.expiredSubscriptions ?? 0} expired subscriptions
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Published Posts</span>
            <Send className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.publishedPosts ?? 0)}
            </span>
            {!isLoading && !error && <GrowthBadge percent={summaryData?.publishedPostsGrowthPercent} />}
          </div>
          <span className="text-xs text-on-surface-variant mt-1 block capitalize">Published this {period.replace('ly', '')}</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">New Registrations</span>
            <UserPlus className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.newCustomersThisPeriod ?? 0)}
            </span>
            {!isLoading && !error && <GrowthBadge percent={summaryData?.registrationsGrowthPercent} />}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Connected Accounts</span>
            <Link2 className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.connectedAccounts ?? 0)}
            </span>
            {!isLoading && !error && <GrowthBadge percent={summaryData?.connectedAccountsGrowthPercent} />}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">AI Content Generated</span>
            <Sparkles className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.aiContentGenerated ?? 0)}
            </span>
            {!isLoading && !error && <GrowthBadge percent={summaryData?.aiContentGrowthPercent} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-unit">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Publishing Activity</h3>
              <p className="text-xs text-on-surface-variant">Scheduled vs published posts in this period</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                <span className="text-xs text-on-surface-variant font-medium">Published</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
                <span className="text-xs text-on-surface-variant font-medium">Scheduled</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative min-h-[260px] border-b border-l border-surface-variant/50 pt-4 pr-4">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-on-surface-variant">Loading chart...</div>
            ) : !hasPublishingData ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-on-surface-variant">No data available</div>
            ) : (
              <>
                <div className="absolute inset-0 flex flex-col justify-between pt-4 pointer-events-none">
                  <div className="w-full h-px bg-[#F2F2F2]"></div>
                  <div className="w-full h-px bg-[#F2F2F2]"></div>
                  <div className="w-full h-px bg-[#F2F2F2]"></div>
                  <div className="w-full h-px bg-[#F2F2F2]"></div>
                  <div className="w-full h-px bg-[#F2F2F2]"></div>
                </div>
                <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 250">
                  <path
                    key={`success-${period}`}
                    className="stroke-primary-container animated-path"
                    d={successPath}
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    key={`scheduled-${period}`}
                    className="stroke-tertiary-container animated-path"
                    d={scheduledPath}
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                  />
                </svg>
              </>
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-on-surface-variant font-ui-mono">
            {chartLabels.map((p) => (
              <span key={p.label}>{formatDayLabel(p.label)}</span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <p className="text-xs text-on-surface-variant mb-1 font-medium">Scheduled</p>
              <p className="text-lg font-bold text-on-surface">{isLoading ? '—' : summaryData?.publishing?.scheduled ?? 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <p className="text-xs text-on-surface-variant mb-1 font-medium">Published</p>
              <p className="text-lg font-bold text-[#FF6600]">{isLoading ? '—' : summaryData?.publishing?.published ?? 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <p className="text-xs text-on-surface-variant mb-1 font-medium">Failed</p>
              <p className="text-lg font-bold text-error">{isLoading ? '—' : summaryData?.publishing?.failed ?? 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <p className="text-xs text-on-surface-variant mb-1 font-medium">Pending</p>
              <p className="text-lg font-bold text-on-surface-variant">{isLoading ? '—' : summaryData?.publishing?.pending ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Revenue Overview</h3>
                {isLoading ? (
                  <div className="h-8 animate-pulse bg-primary/10 rounded w-32 mt-2" />
                ) : error ? (
                  <p className="text-xs text-error font-semibold mt-2">{error}</p>
                ) : (
                  <div className="mt-1">
                    <span className="text-3xl font-extrabold text-on-surface">
                      ₦{Number(summaryData?.revenueThisPeriod || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block mt-0.5 capitalize font-medium">
                      Total successful revenue ({period})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-end gap-1.5 h-40 mb-6 px-2">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">Loading...</div>
              ) : !hasRevenueBars ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">No data available</div>
              ) : (
                revenueTrend.map((point, idx) => (
                  <div
                    key={`${point.label}-${idx}`}
                    className="flex-grow rounded-t cursor-pointer group relative transition-all duration-300 bg-primary-container/20 hover:bg-primary-container"
                    style={{ height: `${Math.max(4, (point.amount / maxRevenue) * 100)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono">
                      ₦{Number(point.amount).toLocaleString('en-NG')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Growth vs last period</span>
              <span className={cn('font-semibold text-sm', (summaryData?.revenueGrowthPercent ?? 0) >= 0 ? 'text-[#FF6600]' : 'text-error')}>
                {isLoading ? '—' : formatGrowth(summaryData?.revenueGrowthPercent)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGroupTable
          title="Free Users"
          count={summaryData?.freeUsers ?? 0}
          users={summaryData?.freeUsersPreview || []}
          emptyLabel="No users yet"
          viewAllTo="/admin/users?group=free"
        />
        <UserGroupTable
          title="Paid Users"
          count={summaryData?.paidUsers ?? 0}
          users={summaryData?.paidUsersPreview || []}
          emptyLabel="No paid users yet"
          viewAllTo="/admin/users?group=paid"
        />
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden flex flex-col">
        <div className="border-b border-surface-variant px-6 flex items-center gap-4 bg-surface-bright">
          <button
            onClick={() => setActiveTab('recent')}
            className={cn(
              "py-4 px-2 border-b-2 text-sm font-semibold transition-all",
              activeTab === 'recent'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            Recent Activity
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={cn(
              "py-4 px-2 border-b-2 text-sm font-semibold transition-all",
              activeTab === 'post'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            Post Activity
          </button>
        </div>

        <div className="divide-y divide-surface-variant min-h-[120px]">
          {isLoading ? (
            <div className="px-6 py-10 text-center text-sm text-on-surface-variant">Loading...</div>
          ) : activeTab === 'recent' ? (
            recentActivity.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-on-surface-variant">No recent activity</div>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-on-surface">
                      <span className="font-semibold">{act.userName || 'System'}</span>
                      <span className="text-on-surface-variant"> · {act.action}</span>
                    </p>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5">{act.description}</p>
                  </div>
                  <span className="text-xs text-on-surface-variant font-ui-mono whitespace-nowrap ml-4">
                    {relativeTime(act.createdAt)}
                  </span>
                </div>
              ))
            )
          ) : recentPosts.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-on-surface-variant">No recent activity</div>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} className="px-6 py-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-on-surface">
                    <span className="font-semibold">{post.platform || 'Post'}</span>
                    <span className="text-on-surface-variant"> · {post.status}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant/70 mt-0.5 truncate">
                    {post.error || post.content || 'No additional detail'}
                  </p>
                </div>
                <span className="text-xs text-on-surface-variant font-ui-mono whitespace-nowrap ml-4">
                  {relativeTime(post.attemptedAt)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="p-4 text-center border-t border-surface-variant bg-surface-bright">
          <Link to="/admin/logs" className="text-primary font-semibold hover:underline text-sm">
            View All Activity
          </Link>
        </div>
      </div>
    </div>
  )
}
