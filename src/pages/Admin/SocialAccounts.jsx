import { useState } from 'react'
import {
  Instagram,
  Facebook,
  Music,
  MoreVertical,
  ChevronDown,
  RefreshCw,
  Link2Off,
  Share2,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'

// ---------------------------------------------------------------------------
// Initial Mock Data (Matching Stitch-generated HTML visual items)
// ---------------------------------------------------------------------------
const INITIAL_ACCOUNTS = [
  {
    id: "acc_1",
    customerName: "Oluwaseun Adeyemi",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8F3iHu2WuS_YlMzr6lYAmHs2eecWjFvni6fExHnOIkdjl-svwtdttaiApjmblDijHzbcNutUclJySt8neIl6O-cV6cfrZXZqBli4xdjyCGVUh8eoRlk_09XJgTHrdzp5f--RL8Lm8-7NlqoUAfwReK-Tuv6y8bRbbafb79hCbyBRa7mEN-iQnHWyNkP5152Vrp3F8svSP_BV6VDaIuo2GxNagi1WFzgusJIzChwzi_GJMBAlsv4xKM4Xt29cBCnJoc3v2L_25JdVz",
    platform: "Instagram",
    status: "Connected",
    oauthStatus: "Valid",
    connectedSince: "Oct 12, 2023",
  },
  {
    id: "acc_2",
    customerName: "Chidinma Okafor",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8xo3q9jtVG2TVcHe29eoSd87AsavYuAvrMjs3tC5KoWXv7cOqg55x4JtQzozhuyPdaA6trlNhhNhBIw-qsj39Jrhr9Do4AEoxpmn5JPhfFm4DIzZ-ZIIyI1g7dTbgC6Gk3hi9MWQ_jM7qFPJktGnjTqdv629Ku2e5NKpEn5T_Vz6dSfDDHHok9istSQ-l88KpZE1Gb7cgrmhqNL0vDgN3lDfi9FcHu1EoJBr7YLRht-NBVcvfJUOcgagPLezowr4B3elec65APXQe",
    platform: "Facebook",
    status: "Disconnected",
    oauthStatus: "Expired",
    connectedSince: "Aug 05, 2023",
  },
  {
    id: "acc_3",
    customerName: "Tunde Bakare",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmj7-7D8LR7nWGhrNGFi5a9gxefshX_tYfCcPx4CkiFpjY5hF3Zo1EKS3ubC1fY7Qx7ELgFXu4Q2gUjuiJmzw9WUEmad60Y1uEkL8ZH6ksTdJH4KHmGVFai0vYjOOC3U9FQcdl0tWp0QTTZntA1Kt4WaUUY2naEMzd3vmRGo5Z4RbWOXHC4I9nYnyfRF1lBVcTge-g0qGtoUtrdTUNzjKxQ2mcPJe7RChsxfUcSWbrY_9Dq5dj0_BpISiT6PYZMRiyqF5rY4j0v-L2",
    platform: "TikTok",
    status: "Connected",
    oauthStatus: "Valid",
    connectedSince: "Jan 22, 2024",
  },
  {
    id: "acc_4",
    customerName: "Amaka Obi",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9F82pmpav0m_f8T_JoCWlyQU30Ucx-jUElLEYXNHbrcVIGHVfaiOZIbxq51dmAnq8d7G4KY_sHxnzO0ihKb-OiC9GyfcRovYROqHzEeSEIzm_3aM_M4k0BkwjumY6qD7yk6R89A0N6Rtr_PRRIXbo86AdHr8HITviNV2leSphvda1iCbNCLhK4fDuKPe3ByoiGydT93mLZxHjK6ItxyXvtkIK4bk-b7RyD5R94CzckbGlEdXcnQZayM-hBfm-ab07S_GdA1FOZgwb",
    platform: "Instagram",
    status: "Connected",
    oauthStatus: "Valid",
    connectedSince: "Dec 15, 2023",
  },
  {
    id: "acc_5",
    customerName: "Emeka Nwosu",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB1EHZVYIthwPNNVo3j4TTcVFuZUUBWuIvRQOP4k4MxIGmEmIio2W7sGx4U2Aae80CwMciWphXciHiA99032qj3WPEPpOU84EK92rvKDZJGNZaRrwv8ZNd8O0xOVtZjPmkb57AikBnZ83JH5Pc3kLw23CvKOnC9VmFPrRzNtkq5Krb6y5lM1H7qi-MBTKTBS8EILyhdu6_DiK0EiAnFutYS8xamDN2cQkAohxZ6dAiIng-zscTWp6Ttgnu7m0GgoJ6pyf2rvriUjE4A",
    platform: "Facebook",
    status: "Connected",
    oauthStatus: "Valid",
    connectedSince: "Feb 01, 2024",
  },
]

const INITIAL_LOGS = [
  { id: "log_1", message: "TikTok token expired for Tunde Bakare", time: "Today at 10:45 AM", detail: "Token Refresh Failed", type: "error" },
  { id: "log_2", message: "Instagram reconnected for Amaka Obi", time: "Today at 09:12 AM", detail: "Authorization Successful", type: "success" },
  { id: "log_3", message: "Facebook connection established for Emeka Nwosu", time: "Yesterday at 04:30 PM", detail: "New Account Linked", type: "success" },
  { id: "log_4", message: "API Authentication Error: TikTok for Ifeanyi Obi", time: "Yesterday at 11:20 AM", detail: "Error Code 403: Invalid Secret", type: "error" },
]

export default function SocialAccounts() {
  // ---------------------------------------------------------------------------
  // State variables
  // ---------------------------------------------------------------------------
  const [platformFilter, setPlatformFilter] = useState('All Platforms')
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS)
  const [logs, setLogs] = useState(INITIAL_LOGS)
  const [activeActionsRowId, setActiveActionsRowId] = useState(null)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleDisconnect = (accountId) => {
    const targetAccount = accounts.find(a => a.id === accountId)
    if (!targetAccount) return

    // Update account connection states
    setAccounts(prev =>
      prev.map(a =>
        a.id === accountId
          ? { ...a, status: 'Disconnected', oauthStatus: 'Expired' }
          : a
      )
    )

    // Prepend a disconnection log event to timeline
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHour = hours % 12 || 12
    const timeStr = `Today at ${formattedHour}:${minutes} ${ampm}`

    setLogs(prev => [
      {
        id: `log_${Date.now()}`,
        message: `${targetAccount.platform} disconnected for ${targetAccount.customerName}`,
        time: timeStr,
        detail: 'Manual Disconnection',
        type: 'error'
      },
      ...prev
    ])

    setActiveActionsRowId(null)
  }

  const handleReconnect = (accountId) => {
    const targetAccount = accounts.find(a => a.id === accountId)
    if (!targetAccount) return

    // Update account connection states
    setAccounts(prev =>
      prev.map(a =>
        a.id === accountId
          ? { ...a, status: 'Connected', oauthStatus: 'Valid' }
          : a
      )
    )

    // Prepend a reconnection log event to timeline
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const formattedHour = hours % 12 || 12
    const timeStr = `Today at ${formattedHour}:${minutes} ${ampm}`

    setLogs(prev => [
      {
        id: `log_${Date.now()}`,
        message: `${targetAccount.platform} reconnected for ${targetAccount.customerName}`,
        time: timeStr,
        detail: 'Authorization Successful',
        type: 'success'
      },
      ...prev
    ])

    setActiveActionsRowId(null)
  }

  // Helper selector for platform icons
  const getPlatformDetails = (platform) => {
    switch (platform) {
      case 'Instagram':
        return { icon: Instagram, color: 'text-pink-500' }
      case 'Facebook':
        return { icon: Facebook, color: 'text-blue-600' }
      case 'TikTok':
        return { icon: Music, color: 'text-ink' }
      default:
        return { icon: Share2, color: 'text-ink-muted' }
    }
  }

  // ---------------------------------------------------------------------------
  // Computations
  // ---------------------------------------------------------------------------
  const filteredAccounts = accounts.filter(acc => {
    if (platformFilter === 'All Platforms') return true
    return acc.platform === platformFilter
  })

  // Healthy count is calculated dynamically based on local states
  const healthyCount = 16 + accounts.filter(a => a.status === 'Connected').length // offset for the remaining 18/22 healthy accounts
  const totalConnections = 22

  return (
    <div className="space-y-6">
      {/* Page Header Section */}
      <PageHeader
        title="Connected Accounts"
        description="Manage third-party platform authorizations and status."
        action={
          <div className="relative inline-block text-left">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="appearance-none bg-surface border border-border text-ink font-medium text-sm rounded-control py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="All Platforms">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted"
              size={16}
            />
          </div>
        }
      />

      {/* Connected Accounts Table Card */}
      <Card className="overflow-hidden p-0 border-border">
        {filteredAccounts.length === 0 ? (
          <EmptyState
            icon={<Share2 size={32} />}
            title="No connected accounts"
            description="There are no authorized accounts that match this platform filter."
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
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Connected Since</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAccounts.map((acc) => {
                  const plat = getPlatformDetails(acc.platform)
                  return (
                    <tr
                      key={acc.id}
                      className={cn(
                        "transition-colors duration-150",
                        acc.status === 'Disconnected'
                          ? "bg-primary-50/20 hover:bg-primary-50/30"
                          : "hover:bg-canvas"
                      )}
                    >
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-ink-muted font-medium text-sm">
                          <plat.icon size={16} className={plat.color} />
                          {acc.platform}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          tone={acc.status === 'Connected' ? 'success' : 'neutral'}
                          className="gap-1 flex items-center w-fit"
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              acc.status === 'Connected' ? "bg-accent" : "bg-ink-muted"
                            )}
                          />
                          {acc.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={acc.oauthStatus === 'Valid' ? 'success' : 'danger'} className="w-fit">
                          {acc.oauthStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-muted">{acc.connectedSince}</td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          {acc.status === 'Disconnected' && (
                            <button
                              onClick={() => handleReconnect(acc.id)}
                              className="text-sm font-semibold text-primary hover:text-primary-700 hover:underline"
                            >
                              Reconnect
                            </button>
                          )}
                          <div className="relative">
                            <button
                              onClick={() => setActiveActionsRowId(activeActionsRowId === acc.id ? null : acc.id)}
                              className="p-1.5 text-ink-muted hover:bg-canvas hover:text-ink rounded-full transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeActionsRowId === acc.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-surface border border-border rounded-card shadow-lg z-20 py-1">
                                {acc.status === 'Connected' ? (
                                  <button
                                    onClick={() => handleDisconnect(acc.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-canvas text-danger font-medium text-sm flex items-center gap-2"
                                  >
                                    <Link2Off size={14} />
                                    Disconnect
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReconnect(acc.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-canvas text-accent font-medium text-sm flex items-center gap-2"
                                  >
                                    <RefreshCw size={14} />
                                    Reconnect
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Grid: Timeline and Stats Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Logs Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-ink mb-6">Connection Logs</h3>
            <div className="relative space-y-6">
              {/* Vertical Line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

              {logs.map((log) => (
                <div key={log.id} className="relative flex gap-4 pl-10">
                  <div
                    className={cn(
                      "absolute left-[13px] top-2 w-[10px] h-[10px] rounded-full border-2 border-white",
                      log.type === 'error' ? "bg-danger" : "bg-accent"
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
          {/* Status Overview Card */}
          <div className="bg-primary text-white rounded-card p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw size={18} className="animate-spin-slow" />
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

          {/* System Health Card */}
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-ink mb-4">System Health</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">API Latency</span>
                <span className="text-sm font-semibold text-accent">42ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">OAuth Services</span>
                <span className="text-sm font-semibold text-accent">Operational</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
