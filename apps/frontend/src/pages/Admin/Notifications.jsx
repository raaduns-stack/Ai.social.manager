import { useState, useMemo } from 'react'
import {
  Send,
  CheckCircle,
  Filter,
  Search,
  Loader2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'Announcement', // 'Announcement' | 'Reminder' | 'Approval' | 'Publishing' | 'Maintenance'
    audience: 'All Users',
    message: 'Raasocial v2.4 is now live! Explore the new bento layout...',
    sentDate: 'Oct 24, 2023 · 09:12 AM',
    status: 'Delivered',
  },
  {
    id: 2,
    type: 'Reminder',
    audience: 'Plan Tier: Professional',
    message: 'Your monthly subscription will renew in 3 days. View receipt.',
    sentDate: 'Oct 23, 2023 · 02:45 PM',
    status: 'Delivered',
  },
  {
    id: 3,
    type: 'Approval',
    audience: 'Specific Customer: Acme Corp',
    message: 'Your LinkedIn campaign draft has been approved by the manager.',
    sentDate: 'Oct 22, 2023 · 11:30 AM',
    status: 'Delivered',
  },
  {
    id: 4,
    type: 'Publishing',
    audience: 'Specific Customer: John Doe',
    message: 'Successfully posted "10 AI Tips" to Instagram and Twitter.',
    sentDate: 'Oct 21, 2023 · 05:00 PM',
    status: 'Delivered',
  },
  {
    id: 5,
    type: 'Maintenance',
    audience: 'All Users',
    message: 'Scheduled downtime on Sunday 2:00 AM UTC for server upgrades.',
    sentDate: 'Oct 20, 2023 · 08:20 AM',
    status: 'Delivered',
  },
]

export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types')

  const [formState, setFormState] = useState({
    type: 'System Announcement',
    audience: 'All Users',
    message: '',
  })

  const [sendButtonState, setSendButtonState] = useState('idle') // 'idle', 'sending', 'sent'

  // Dynamic filter for history logs
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch = n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.audience.toLowerCase().includes(searchQuery.toLowerCase())

      const matchType = selectedTypeFilter === 'All Types' ||
                        n.type.toLowerCase() === selectedTypeFilter.toLowerCase() ||
                        (selectedTypeFilter === 'Announcement' && n.type === 'Announcement') ||
                        (selectedTypeFilter === 'Reminder' && n.type === 'Reminder') ||
                        (selectedTypeFilter === 'Approval' && n.type === 'Approval') ||
                        (selectedTypeFilter === 'Publishing' && n.type === 'Publishing') ||
                        (selectedTypeFilter === 'Maintenance' && n.type === 'Maintenance')

      return matchSearch && matchType
    })
  }, [notifications, searchQuery, selectedTypeFilter])

  const handleSendNotification = (e) => {
    e.preventDefault()
    if (!formState.message.trim() || sendButtonState !== 'idle') return

    // Trigger simulation states
    setSendButtonState('sending')

    setTimeout(() => {
      setSendButtonState('sent')

      // Add to list
      const now = new Date()
      const formattedDate = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })

      let cleanType = 'Announcement'
      if (formState.type.includes('Reminder')) cleanType = 'Reminder'
      if (formState.type.includes('Approval')) cleanType = 'Approval'
      if (formState.type.includes('Publishing')) cleanType = 'Publishing'
      if (formState.type.includes('Maintenance')) cleanType = 'Maintenance'

      const created = {
        id: Date.now(),
        type: cleanType,
        audience: formState.audience,
        message: formState.message,
        sentDate: `${formattedDate} · ${formattedTime}`,
        status: 'Delivered',
      }

      setNotifications((prev) => [created, ...prev])
      setFormState((prev) => ({ ...prev, message: '' }))

      // Reset button state
      setTimeout(() => {
        setSendButtonState('idle')
      }, 2000)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Management"
        description="Configure and broadcast system-wide alerts or targeted messages."
      />

      {/* Send New Notification Card */}
      <Card className="p-0 overflow-hidden shadow-soft">
        <div className="p-5 border-b border-border bg-canvas/30">
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <Send size={16} className="text-primary" />
            Send New Notification
          </h3>
        </div>

        <form onSubmit={handleSendNotification} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Type</label>
              <select
                value={formState.type}
                onChange={(e) => setFormState((prev) => ({ ...prev, type: e.target.value }))}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
              >
                <option value="System Announcement">System Announcement</option>
                <option value="Subscription Reminder">Subscription Reminder</option>
                <option value="Content Approval">Content Approval</option>
                <option value="Publishing">Publishing</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Audience</label>
              <select
                value={formState.audience}
                onChange={(e) => setFormState((prev) => ({ ...prev, audience: e.target.value }))}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
              >
                <option value="All Users">All Users</option>
                <option value="Specific Customer">Specific Customer</option>
                <option value="Plan Tier: Enterprise">Plan Tier: Enterprise</option>
                <option value="Plan Tier: Professional">Plan Tier: Professional</option>
                <option value="Plan Tier: Free">Plan Tier: Free</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Message</label>
            <textarea
              value={formState.message}
              onChange={(e) => setFormState((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Enter the notification message here... Keep it concise and actionable for better engagement."
              rows={4}
              className="w-full p-3 rounded-control border border-border bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant={sendButtonState === 'sent' ? 'success' : 'primary'}
              disabled={sendButtonState !== 'idle' || !formState.message.trim()}
              className="gap-2 font-semibold text-sm"
            >
              {sendButtonState === 'sending' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : sendButtonState === 'sent' ? (
                <>
                  <CheckCircle size={16} />
                  Sent!
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Notification History Card */}
      <Card className="p-0 overflow-hidden shadow-soft">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-base font-semibold text-ink">Notification History</h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* Type selection */}
            <div className="relative">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-control py-1.5 pl-3 pr-8 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="All Types">All Types</option>
                <option value="Announcement">Announcement</option>
                <option value="Reminder">Reminder</option>
                <option value="Approval">Approval</option>
                <option value="Publishing">Publishing</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-40 pl-8 pr-3 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-canvas/10 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Audience</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3">Sent Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-ink bg-surface">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink-muted text-xs font-medium">
                    No notifications recorded in history.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((noti) => {
                  let toneVal = 'primary'
                  if (noti.type === 'Reminder') toneVal = 'warning'
                  if (noti.type === 'Approval') toneVal = 'success'
                  if (noti.type === 'Maintenance') toneVal = 'danger'

                  return (
                    <tr key={noti.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-5 py-4">
                        <Badge tone={toneVal}>{noti.type}</Badge>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {noti.audience}
                      </td>
                      <td className="px-5 py-4 text-ink-muted max-w-xs truncate">
                        {noti.message}
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-muted">
                        {noti.sentDate}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-accent font-semibold text-xs">
                          <CheckCircle size={14} className="fill-accent-50 text-accent" />
                          {noti.status}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-border flex justify-between items-center text-xs text-ink-muted bg-surface">
          <span>Showing 1-{filteredNotifications.length} of {notifications.length} notifications</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-border rounded-control hover:bg-canvas transition-colors bg-surface text-ink font-semibold">
              Previous
            </button>
            <button className="px-3 py-1.5 border border-border rounded-control hover:bg-canvas transition-colors bg-surface text-ink font-semibold">
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

