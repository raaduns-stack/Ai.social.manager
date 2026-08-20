import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Instagram,
  Facebook,
  Music,
  RefreshCw,
  Link2Off,
  Link2,
  Share2,
  Search,
  ChevronDown,
  ExternalLink,
  Twitter,
  Linkedin,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'
import { getAdminSocialAccounts, disconnectAdminSocialAccount } from '../../features/admin/admin-api'
import { getActivityLogs } from '../../features/admin/activity-logs-api'
import ErrorBanner from '../../components/error-banner'



// ---------------------------------------------------------------------------
// Platform icon config — returns icon component + colour + bg
// ---------------------------------------------------------------------------
const PLATFORM_CONFIG = {
  Instagram: { icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-50' },
  Facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
  TikTok: { icon: Music, color: 'text-ink', bg: 'bg-canvas' },
  LinkedIn: { icon: Linkedin, color: 'text-sky-700', bg: 'bg-sky-50' },
  'X (Twitter)': { icon: Twitter, color: 'text-ink', bg: 'bg-canvas' },
}

function getPlatformConfig(platform) {
  return PLATFORM_CONFIG[platform] || { icon: Share2, color: 'text-ink-muted', bg: 'bg-canvas' }
}

// ---------------------------------------------------------------------------
// Platform icon cell — icon with green/red dot indicator above it
// ---------------------------------------------------------------------------
function PlatformCell({ platform, status }) {
  const { icon: Icon, color, bg } = getPlatformConfig(platform)
  const isConnected = status === 'Connected'
  return (
    <div className="relative inline-flex" title={platform}>
      <div className={cn('w-9 h-9 rounded-control flex items-center justify-center', bg)}>
        <Icon size={18} className={color} />
      </div>
      {/* Status dot above the icon */}
      <span
        className={cn(
          'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white',
          isConnected ? 'bg-accent-500' : 'bg-danger'
        )}
        title={isConnected ? 'Connected' : 'Disconnected'}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Billing status badge helper
// ---------------------------------------------------------------------------
const BILLING_TONES = {
  active: 'success',
  expired: 'danger',
  cancelled: 'neutral',
}

function BillingBadge({ status }) {
  return (
    <Badge tone={BILLING_TONES[status] || 'neutral'} className="capitalize">
      {status}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
const PAGE_SIZES = [10, 30, 60]
const PLATFORMS = ['All Platforms', 'Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'X (Twitter)']
export default function SocialAccounts() {
  const navigate = useNavigate()

  // Filters
  const [platformFilter, setPlatformFilter] = useState('All Platforms')
  const [customerSearch, setCustomerSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  // Data
  const [accounts, setAccounts] = useState([])
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeActionsRowId, setActiveActionsRowId] = useState(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [accsRes, logsRes] = await Promise.all([
        getAdminSocialAccounts(),
        getActivityLogs({ module: 'SocialAccounts', limit: 10 }),
      ])
      setAccounts(accsRes)
      setLogs(logsRes.data || [])
    } catch (err) {
      console.error('Failed to load social accounts data:', err)
      setError('Failed to load social accounts database.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDisconnect = async (accountId) => {
    if (!window.confirm('Are you sure you want to disconnect this social account?')) return
    try {
      await disconnectAdminSocialAccount(accountId)
      alert('Social account disconnected successfully.')
      loadData()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to disconnect account.')
    }
    setActiveActionsRowId(null)
  }

  const getPlatformLabel = (platform) => {
    const mapping = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      tiktok: 'TikTok',
      linkedin: 'LinkedIn',
      x: 'X (Twitter)',
      youtube: 'YouTube',
    }
    return mapping[platform.toLowerCase()] || platform
  }

  // ---------------------------------------------------------------------------
  // Filtered + paginated data
  // ---------------------------------------------------------------------------
  const filtered = accounts.filter(acc => {
    const matchesPlatform = platformFilter === 'All Platforms' ||
      acc.platform.toLowerCase() === platformFilter.toLowerCase() ||
      (platformFilter === 'X (Twitter)' && acc.platform.toLowerCase() === 'x')

    const matchesSearch = customerSearch === '' ||
      (acc.customerName || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
      (acc.email || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
      (acc.accountHandle || '').toLowerCase().includes(customerSearch.toLowerCase())

    return matchesPlatform && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const healthyCount = accounts.filter(a => a.status === 'connected').length
  const totalConnections = accounts.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Connected Accounts"
        description="Manage third-party platform authorizations and status."
      />

      {error && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search by customer name */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, email or handle…"
            value={customerSearch}
            onChange={e => { setCustomerSearch(e.target.value); setPage(1) }}
            className="h-10 w-full rounded-control border border-border bg-surface pl-9 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filter by platform */}
        <div className="relative">
          <select
            value={platformFilter}
            onChange={e => { setPlatformFilter(e.target.value); setPage(1) }}
            className="h-10 appearance-none rounded-control border border-border bg-surface pl-3 pr-9 text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted" />
        </div>

        {/* Page size dropdown */}
        <div className="relative">
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="h-10 appearance-none rounded-control border border-border bg-surface pl-3 pr-9 text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            {PAGE_SIZES.map(n => <option key={n} value={n}>Show {n}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted" />
        </div>
      </div>

      {/* Connected Accounts Table */}
      <Card className="overflow-hidden p-0 border-border">
        {isLoading ? (
          <div className="px-6 py-20 text-center text-sm text-ink-muted">Loading social accounts database...</div>
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={<Share2 size={32} />}
            title="No connected accounts"
            description="There are no authorized accounts that match this filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-canvas">
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Platform</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Connection Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">OAuth Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map(acc => {
                  const isConnected = acc.status === 'connected'
                  const statusLabel = isConnected ? 'Connected' : acc.status === 'disconnected' ? 'Disconnected' : 'Action Required'
                  const oauthStatus = acc.tokenExpiresAt && new Date(acc.tokenExpiresAt) < new Date() ? 'Expired' : 'Valid'
                  const platformLabel = getPlatformLabel(acc.platform)

                  return (
                    <tr
                      key={acc.id}
                      className={cn(
                        'transition-colors duration-150',
                        !isConnected ? 'bg-primary-50/20 hover:bg-primary-50/30' : 'hover:bg-canvas'
                      )}
                    >
                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-ink text-sm block">{acc.customerName || '—'}</span>
                          <span className="text-xs text-ink-muted block">{acc.email || '—'}</span>
                        </div>
                      </td>

                      {/* Platform — icon with status dot */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <PlatformCell platform={platformLabel} status={isConnected ? 'Connected' : 'Disconnected'} />
                          <span className="text-xs text-ink-muted">({acc.accountHandle || '—'})</span>
                        </div>
                      </td>

                      {/* Connection Status */}
                      <td className="px-6 py-4">
                        <Badge
                          tone={isConnected ? 'success' : 'neutral'}
                          className="gap-1 flex items-center w-fit"
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              isConnected ? 'bg-accent-500' : 'bg-ink-muted'
                            )}
                          />
                          {statusLabel}
                        </Badge>
                      </td>

                      {/* OAuth Status */}
                      <td className="px-6 py-4">
                        <Badge tone={oauthStatus === 'Valid' ? 'success' : 'danger'} className="w-fit">
                          {oauthStatus}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          {/* Disconnect button for Connected accounts */}
                          {isConnected && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => handleDisconnect(acc.id)}
                            >
                              <Link2Off size={12} />
                              Disconnect
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-border bg-surface">
            <span className="text-xs text-ink-muted">
              Showing {Math.min((safePage - 1) * pageSize + 1, filtered.length)}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} accounts
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Grid: Timeline and Stats Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Logs Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-ink">Connection Logs</h3>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary hover:text-primary-700 font-semibold p-0 h-auto"
                onClick={() => navigate('/admin/logs')}
              >
                View More
                <ExternalLink size={14} />
              </Button>
            </div>
            {logs.length === 0 ? (
              <div className="text-sm text-ink-muted py-10 text-center">No connection logs available</div>
            ) : (
              <div className="relative space-y-6">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

                {logs.slice(0, 5).map(log => (
                  <div key={log.id} className="relative flex gap-4 pl-10">
                    <div
                      className={cn(
                        'absolute left-[13px] top-2 w-[10px] h-[10px] rounded-full border-2 border-white',
                        log.action === 'SOCIAL_ACCOUNT_DISCONNECTED' ? 'bg-danger' : 'bg-accent'
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium text-ink">{log.description}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {new Date(log.createdAt).toLocaleString()} • {log.userName || 'System'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Stats Panel */}
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="bg-primary text-white rounded-card p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw size={18} />
              <h4 className="text-sm font-semibold">Status Overview</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-95">Healthy Connections</span>
                <span className="font-semibold">{healthyCount} / {totalConnections}</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalConnections > 0 ? (healthyCount / totalConnections) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* System Health */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-ink mb-4">System Health</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">API Latency</span>
                <span className="text-sm font-semibold text-accent-600">42ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">OAuth Services</span>
                <span className="text-sm font-semibold text-accent-600">Operational</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
