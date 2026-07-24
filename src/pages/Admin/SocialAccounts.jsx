import { useState } from 'react'
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

// ---------------------------------------------------------------------------
// Initial Mock Data
// ---------------------------------------------------------------------------
const INITIAL_ACCOUNTS = [
  {
    id: 'acc_1',
    customerName: 'Oluwaseun Adeyemi',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8F3iHu2WuS_YlMzr6lYAmHs2eecWjFvni6fExHnOIkdjl-svwtdttaiApjmblDijHzbcNutUclJySt8neIl6O-cV6cfrZXZqBli4xdjyCGVUh8eoRlk_09XJgTHrdzp5f--RL8Lm8-7NlqoUAfwReK-Tuv6y8bRbbafb79hCbyBRa7mEN-iQnHWyNkP5152Vrp3F8svSP_BV6VDaIuo2GxNagi1WFzgusJIzChwzi_GJMBAlsv4xKM4Xt29cBCnJoc3v2L_25JdVz',
    platform: 'Instagram',
    status: 'Connected',
    oauthStatus: 'Valid',
    billingStatus: 'active',
  },
  {
    id: 'acc_2',
    customerName: 'Chidinma Okafor',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8xo3q9jtVG2TVcHe29eoSd87AsavYuAvrMjs3tC5KoWXv7cOqg55x4JtQzozhuyPdaA6trlNhhNhBIw-qsj39Jrhr9Do4AEoxpmn5JPhfFm4DIzZ-ZIIyI1g7dTbgC6Gk3hi9MWQ_jM7qFPJktGnjTqdv629Ku2e5NKpEn5T_Vz6dSfDDHHok9istSQ-l88KpZE1Gb7cgrmhqNL0vDgN3lDfi9FcHu1EoJBr7YLRht-NBVcvfJUOcgagPLezowr4B3elec65APXQe',
    platform: 'Facebook',
    status: 'Disconnected',
    oauthStatus: 'Expired',
    billingStatus: 'expired',
  },
  {
    id: 'acc_3',
    customerName: 'Tunde Bakare',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmj7-7D8LR7nWGhrNGFi5a9gxefshX_tYfCcPx4CkiFpjY5hF3Zo1EKS3ubC1fY7Qx7ELgFXu4Q2gUjuiJmzw9WUEmad60Y1uEkL8ZH6ksTdJH4KHmGVFai0vYjOOC3U9FQcdl0tWp0QTTZntA1Kt4WaUUY2naEMzd3vmRGo5Z4RbWOXHC4I9nYnyfRF1lBVcTge-g0qGtoUtrdTUNzjKxQ2mcPJe7RChsxfUcSWbrY_9Dq5dj0_BpISiT6PYZMRiyqF5rY4j0v-L2',
    platform: 'TikTok',
    status: 'Connected',
    oauthStatus: 'Valid',
    billingStatus: 'active',
  },
  {
    id: 'acc_4',
    customerName: 'Amaka Obi',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9F82pmpav0m_f8T_JoCWlyQU30Ucx-jUElLEYXNHbrcVIGHVfaiOZIbxq51dmAnq8d7G4KY_sHxnzO0ihKb-OiC9GyfcRovYROqHzEeSEIzm_3aM_M4k0BkwjumY6qD7yk6R89A0N6Rtr_PRRIXbo86AdHr8HITviNV2leSphvda1iCbNCLhK4fDuKPe3ByoiGydT93mLZxHjK6ItxyXvtkIK4bk-b7RyD5R94CzckbGlEdXcnQZayM-hBfm-ab07S_GdA1FOZgwb',
    platform: 'Instagram',
    status: 'Connected',
    oauthStatus: 'Valid',
    billingStatus: 'active',
  },
  {
    id: 'acc_5',
    customerName: 'Emeka Nwosu',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1EHZVYIthwPNNVo3j4TTcVFuZUUBWuIvRQOP4k4MxIGmEmIio2W7sGx4U2Aae80CwMciWphXciHiA99032qj3WPEPpOU84EK92rvKDZJGNZaRrwv8ZNd8O0xOVtZjPmkb57AikBnZ83JH5Pc3kLw23CvKOnC9VmFPrRzNtkq5Krb6y5lM1H7qi-MBTKTBS8EILyhdu6_DiK0EiAnFutYS8xamDN2cQkAohxZ6dAiIng-zscTWp6Ttgnu7m0GgoJ6pyf2rvriUjE4A',
    platform: 'Facebook',
    status: 'Connected',
    oauthStatus: 'Valid',
    billingStatus: 'cancelled',
  },
  {
    id: 'acc_6',
    customerName: 'Ngozi Eze',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8F3iHu2WuS_YlMzr6lYAmHs2eecWjFvni6fExHnOIkdjl-svwtdttaiApjmblDijHzbcNutUclJySt8neIl6O-cV6cfrZXZqBli4xdjyCGVUh8eoRlk_09XJgTHrdzp5f--RL8Lm8-7NlqoUAfwReK-Tuv6y8bRbbafb79hCbyBRa7mEN-iQnHWyNkP5152Vrp3F8svSP_BV6VDaIuo2GxNagi1WFzgusJIzChwzi_GJMBAlsv4xKM4Xt29cBCnJoc3v2L_25JdVz',
    platform: 'LinkedIn',
    status: 'Disconnected',
    oauthStatus: 'Expired',
    billingStatus: 'active',
  },
  {
    id: 'acc_7',
    customerName: 'Biodun Femi',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8xo3q9jtVG2TVcHe29eoSd87AsavYuAvrMjs3tC5KoWXv7cOqg55x4JtQzozhuyPdaA6trlNhhNhBIw-qsj39Jrhr9Do4AEoxpmn5JPhfFm4DIzZ-ZIIyI1g7dTbgC6Gk3hi9MWQ_jM7qFPJktGnjTqdv629Ku2e5NKpEn5T_Vz6dSfDDHHok9istSQ-l88KpZE1Gb7cgrmhqNL0vDgN3lDfi9FcHu1EoJBr7YLRht-NBVcvfJUOcgagPLezowr4B3elec65APXQe',
    platform: 'X (Twitter)',
    status: 'Connected',
    oauthStatus: 'Valid',
    billingStatus: 'active',
  },
]

const INITIAL_LOGS = [
  { id: 'log_1', message: 'TikTok token expired for Tunde Bakare', time: 'Today at 10:45 AM', detail: 'Token Refresh Failed', type: 'error' },
  { id: 'log_2', message: 'Instagram reconnected for Amaka Obi', time: 'Today at 09:12 AM', detail: 'Authorization Successful', type: 'success' },
  { id: 'log_3', message: 'Facebook connection established for Emeka Nwosu', time: 'Yesterday at 04:30 PM', detail: 'New Account Linked', type: 'success' },
  { id: 'log_4', message: 'API Authentication Error: TikTok for Ifeanyi Obi', time: 'Yesterday at 11:20 AM', detail: 'Error Code 403: Invalid Secret', type: 'error' },
  { id: 'log_5', message: 'LinkedIn connected for Ngozi Eze', time: '2 days ago at 08:00 AM', detail: 'New Account Linked', type: 'success' },
]

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
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS)
  const [logs, setLogs] = useState(INITIAL_LOGS)
  const [activeActionsRowId, setActiveActionsRowId] = useState(null)

  // ---------------------------------------------------------------------------
  // Timestamp helper
  // ---------------------------------------------------------------------------
  const nowStr = () => {
    const d = new Date()
    const h = d.getHours() % 12 || 12
    const m = d.getMinutes().toString().padStart(2, '0')
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM'
    return `Today at ${h}:${m} ${ampm}`
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleDisconnect = (accountId) => {
    const target = accounts.find(a => a.id === accountId)
    if (!target) return
    setAccounts(prev =>
      prev.map(a => a.id === accountId ? { ...a, status: 'Disconnected', oauthStatus: 'Expired' } : a)
    )
    setLogs(prev => [{
      id: `log_${Date.now()}`,
      message: `${target.platform} disconnected for ${target.customerName}`,
      time: nowStr(),
      detail: 'Manual Disconnection',
      type: 'error',
    }, ...prev])
    setActiveActionsRowId(null)
  }

  const handleReconnect = (accountId) => {
    const target = accounts.find(a => a.id === accountId)
    if (!target) return
    setAccounts(prev =>
      prev.map(a => a.id === accountId ? { ...a, status: 'Connected', oauthStatus: 'Valid' } : a)
    )
    setLogs(prev => [{
      id: `log_${Date.now()}`,
      message: `${target.platform} reconnected for ${target.customerName}`,
      time: nowStr(),
      detail: 'Authorization Successful',
      type: 'success',
    }, ...prev])
    setActiveActionsRowId(null)
  }

  const handleConnect = (accountId) => handleReconnect(accountId)

  // ---------------------------------------------------------------------------
  // Filtered + paginated data
  // ---------------------------------------------------------------------------
  const filtered = accounts.filter(acc => {
    const matchesPlatform = platformFilter === 'All Platforms' || acc.platform === platformFilter
    const matchesSearch = customerSearch === '' ||
      acc.customerName.toLowerCase().includes(customerSearch.toLowerCase())
    return matchesPlatform && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const healthyCount = 16 + accounts.filter(a => a.status === 'Connected').length
  const totalConnections = 22

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Connected Accounts"
        description="Manage third-party platform authorizations and status."
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search by customer name */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name…"
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
        {paginated.length === 0 ? (
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
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Billing Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map(acc => (
                  <tr
                    key={acc.id}
                    className={cn(
                      'transition-colors duration-150',
                      acc.status === 'Disconnected'
                        ? 'bg-primary-50/20 hover:bg-primary-50/30'
                        : 'hover:bg-canvas'
                    )}
                  >
                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          className="w-10 h-10 rounded-full border border-border object-cover"
                          src={acc.avatar}
                          alt={acc.customerName}
                        />
                        <span className="font-semibold text-ink text-sm">{acc.customerName}</span>
                      </div>
                    </td>

                    {/* Platform — icon with status dot */}
                    <td className="px-6 py-4">
                      <PlatformCell platform={acc.platform} status={acc.status} />
                    </td>

                    {/* Connection Status */}
                    <td className="px-6 py-4">
                      <Badge
                        tone={acc.status === 'Connected' ? 'success' : 'neutral'}
                        className="gap-1 flex items-center w-fit"
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            acc.status === 'Connected' ? 'bg-accent-500' : 'bg-ink-muted'
                          )}
                        />
                        {acc.status}
                      </Badge>
                    </td>

                    {/* OAuth Status */}
                    <td className="px-6 py-4">
                      <Badge tone={acc.oauthStatus === 'Valid' ? 'success' : 'danger'} className="w-fit">
                        {acc.oauthStatus}
                      </Badge>
                    </td>

                    {/* Billing Status */}
                    <td className="px-6 py-4">
                      <BillingBadge status={acc.billingStatus} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        {/* Connect button for fully unconnected accounts */}
                        {acc.status === 'Disconnected' && acc.oauthStatus !== 'Expired' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => handleConnect(acc.id)}
                          >
                            <Link2 size={12} />
                            Connect
                          </Button>
                        )}

                        {/* Reconnect button for Expired OAuth */}
                        {acc.status === 'Disconnected' && acc.oauthStatus === 'Expired' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => handleReconnect(acc.id)}
                          >
                            <RefreshCw size={12} />
                            Reconnect
                          </Button>
                        )}

                        {/* Disconnect button for Connected accounts */}
                        {acc.status === 'Connected' && (
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
                ))}
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
            <div className="relative space-y-6">
              {/* Vertical timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

              {logs.slice(0, 5).map(log => (
                <div key={log.id} className="relative flex gap-4 pl-10">
                  <div
                    className={cn(
                      'absolute left-[13px] top-2 w-[10px] h-[10px] rounded-full border-2 border-white',
                      log.type === 'error' ? 'bg-danger' : 'bg-accent'
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">{log.message}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{log.time} • {log.detail}</p>
                  </div>
                </div>
              ))}
            </div>
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
                  style={{ width: `${(healthyCount / totalConnections) * 100}%` }}
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
