import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  CreditCard,
  HelpCircle,
  CheckCheck,
  Filter,
  ChevronDown,
  Settings,
  MoreVertical,
  Trash2,
  Loader2,
  RefreshCcw,
  Image as ImageIcon,
  FileText,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/error-banner'
import {
  getCustomerNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../features/customer/notifications-api'

const TYPE_VISUAL = {
  SYSTEM_ANNOUNCEMENT: { icon: Info, style: 'bg-primary/10 text-primary border-primary/20', label: 'System' },
  MAINTENANCE: { icon: AlertTriangle, style: 'bg-amber-500/10 text-warning border-warning/20', label: 'Maintenance' },
  CONTENT_APPROVAL: { icon: CheckCircle2, style: 'bg-accent-50 text-accent-600 border-accent/20', label: 'Approval' },
  CONTENT_PUBLISHED: { icon: CheckCircle2, style: 'bg-accent-50 text-accent-600 border-accent/20', label: 'Published' },
  CONTENT_PUBLISH_FAILED: { icon: AlertTriangle, style: 'bg-red-500/10 text-danger border-danger/20', label: 'Failed' },
  SUBSCRIPTION_RENEWAL_REMINDER: { icon: Info, style: 'bg-primary/10 text-primary border-primary/20', label: 'Reminder' },
  SUBSCRIPTION_EXPIRED: { icon: AlertTriangle, style: 'bg-red-500/10 text-danger border-danger/20', label: 'Expired' },
  SUBSCRIPTION_PAYMENT_SUCCESS: { icon: CreditCard, style: 'bg-accent-50 text-accent-600 border-accent/20', label: 'Payment' },
  SUBSCRIPTION_PAYMENT_FAILED: { icon: AlertTriangle, style: 'bg-red-500/10 text-danger border-danger/20', label: 'Payment Failed' },
  SUBSCRIPTION_INVOICE_AVAILABLE: { icon: CreditCard, style: 'bg-primary/10 text-primary border-primary/20', label: 'Invoice' },
  ACCOUNT_CONNECTION_DISCONNECTED: { icon: AlertTriangle, style: 'bg-amber-500/10 text-warning border-warning/20', label: 'Account' },
  ACCOUNT_CONNECTION_REAUTHORIZATION_REQUIRED: { icon: AlertTriangle, style: 'bg-red-500/10 text-danger border-danger/20', label: 'Reauth' },
  ACCOUNT_CONNECTION_RECONNECTED: { icon: CheckCircle2, style: 'bg-accent-50 text-accent-600 border-accent/20', label: 'Account' },
  CALENDAR_UPLOADED: { icon: Info, style: 'bg-primary/10 text-primary border-primary/20', label: 'Calendar' },
  TICKET_RECEIVED: { icon: HelpCircle, style: 'bg-amber-500/10 text-warning border-warning/20', label: 'Support' },
  TICKET_ASSIGNED: { icon: HelpCircle, style: 'bg-amber-500/10 text-warning border-warning/20', label: 'Support' },
  TICKET_RESPONDED: { icon: HelpCircle, style: 'bg-amber-500/10 text-warning border-warning/20', label: 'Support' },
  TICKET_RESOLVED: { icon: CheckCircle2, style: 'bg-accent-50 text-accent-600 border-accent/20', label: 'Support' },
  TICKET_CLOSED: { icon: CheckCircle2, style: 'bg-canvas text-ink-muted border-border', label: 'Support' },
  SECURITY_NOTICE: { icon: AlertTriangle, style: 'bg-red-500/10 text-danger border-danger/20', label: 'Security' },
  FEATURE_UPDATE: { icon: Info, style: 'bg-accent-50 text-accent-600 border-accent/20', label: 'New Feature' },
  SERVICE_UPDATE: { icon: Info, style: 'bg-primary/10 text-primary border-primary/20', label: 'Service' },
}

const FILTER_OPTIONS = ['All', 'Unread', 'System', 'Alerts']

function relativeTime(dateInput) {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateInput) {
  if (!dateInput) return ''
  return new Date(dateInput).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(dateInput) {
  const d = new Date(dateInput)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (d > weekAgo) return 'This Week'
  return 'Earlier'
}

function isAlertType(type) {
  return [
    'MAINTENANCE',
    'CONTENT_PUBLISH_FAILED',
    'SUBSCRIPTION_EXPIRED',
    'SUBSCRIPTION_PAYMENT_FAILED',
    'ACCOUNT_CONNECTION_DISCONNECTED',
    'ACCOUNT_CONNECTION_REAUTHORIZATION_REQUIRED',
    'TICKET_RESPONDED',
    'TICKET_ASSIGNED',
    'SECURITY_NOTICE',
  ].includes(type)
}

function isSystemType(type) {
  return ['SYSTEM_ANNOUNCEMENT', 'MAINTENANCE', 'SECURITY_NOTICE', 'FEATURE_UPDATE', 'SERVICE_UPDATE'].includes(type)
}

function extractImages(html) {
  const imgs = []
  const div = document.createElement('div')
  div.innerHTML = html
  div.querySelectorAll('img').forEach((img) => {
    imgs.push({ src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || 'attachment' })
    img.remove()
  })
  return { imgs, cleanedHtml: div.innerHTML }
}

function extractFiles(html) {
  const files = []
  const div = document.createElement('div')
  div.innerHTML = html
  div.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || ''
    if (href.startsWith('data:')) {
      files.push({ href, name: a.textContent || 'attachment' })
      a.remove()
    }
  })
  return { files, cleanedHtml: div.innerHTML }
}

function NotificationBody({ html }) {
  const { imgs, cleanedHtml: htmlNoImgs } = useMemo(() => extractImages(html || ''), [html])
  const { files, cleanedHtml: finalHtml } = useMemo(() => extractFiles(htmlNoImgs), [htmlNoImgs])

  if (!finalHtml.trim() && imgs.length === 0 && files.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {finalHtml.trim() && (
        <div
          className="text-sm text-ink-muted leading-relaxed [&_p]:my-1 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
      )}
      {imgs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {imgs.map((img, idx) => (
            <a
              key={idx}
              href={img.src}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-control border border-border overflow-hidden bg-canvas"
            >
              <img src={img.src} alt={img.alt} className="w-full h-32 object-cover" />
            </a>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, idx) => (
            <a
              key={idx}
              href={f.href}
              download={f.name}
              className="flex items-center gap-2 px-3 py-2 rounded-control border border-border bg-canvas hover:bg-surface transition-colors"
            >
              <FileText size={14} className="text-primary shrink-0" />
              <span className="text-xs font-medium text-ink truncate flex-1">{f.name}</span>
              <ImageIcon size={12} className="text-ink-muted" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeItemMenu, setActiveItemMenu] = useState(null)
  const [busy, setBusy] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getCustomerNotifications({ limit: 100 })
      setNotifications(list)
    } catch (err) {
      setError(err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    const count = notifications.filter((n) => !n.isRead).length
    window.dispatchEvent(new CustomEvent('notifications:unread-changed', { detail: { count } }))
  }, [notifications])

  const handleOpen = async (n) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
      try {
        await markAsRead(n.id)
      } catch (err) {
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)))
      }
    }
    if (n.actionUrl) {
      window.location.href = n.actionUrl
    }
  }

  const handleMarkAll = async () => {
    setBusy(true)
    setError(null)
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true, readAt: new Date().toISOString() })))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    setActiveItemMenu(null)
    const previous = notifications
    setNotifications((prev) => prev.filter((x) => x.id !== id))
    try {
      await deleteNotification(id)
    } catch (err) {
      setNotifications(previous)
      setError(err)
    }
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'Unread') return !n.isRead
      if (filter === 'Alerts') return isAlertType(n.type)
      if (filter === 'System') return isSystemType(n.type)
      return true
    })
  }, [notifications, filter])

  const grouped = useMemo(() => {
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier']
    const map = {}
    for (const n of filteredNotifications) {
      const label = formatDateLabel(n.sentAt || n.createdAt)
      if (!map[label]) map[label] = []
      map[label].push(n)
    }
    return order.filter((k) => map[k]?.length).map((k) => ({ label: k, items: map[k] }))
  }, [filteredNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
      <PageHeader
        title="Notifications"
        description="Stay updated with your latest social channel activity and system alerts."
        action={
          <div className="flex items-center gap-2 relative">
            <Button
              variant="outline"
              onClick={handleMarkAll}
              disabled={busy || unreadCount === 0}
              className="gap-1.5 font-semibold text-xs border-primary/20 text-primary-700 hover:bg-primary-50 h-9"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
              <span>Mark all as read</span>
            </Button>

            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="gap-1.5 font-semibold text-xs h-9 bg-surface hover:bg-canvas"
              >
                <Filter size={16} />
                <span>Filter: {filter}</span>
                <ChevronDown size={14} />
              </Button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-card shadow-hover p-1.5 z-20">
                    {FILTER_OPTIONS.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilter(type)
                          setDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-control text-sm font-medium transition-colors ${
                          filter === type
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-ink-muted hover:bg-canvas hover:text-ink'
                        }`}
                      >
                        {type === 'All' ? 'All Notifications' : type}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      {error && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-ink-muted">Loading your notifications…</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.label} className="space-y-4">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-border/40 pb-2">
                {group.label}
              </h3>
              <div className="space-y-3">
                {group.items.map((item) => {
                  const config = TYPE_VISUAL[item.type] || TYPE_VISUAL.SYSTEM_ANNOUNCEMENT
                  const Icon = config.icon
                  const time = item.sentAt || item.createdAt
                  const isToday = formatDateLabel(time) === 'Today'

                  return (
                    <Card
                      key={item.id}
                      onClick={() => handleOpen(item)}
                      className={`p-4 flex items-start gap-4 cursor-pointer relative group transition-all border ${
                        !item.isRead
                          ? 'bg-primary/5 border-primary/20 hover:border-primary/40 border-l-4 border-l-primary'
                          : 'bg-surface hover:border-border border-border/60 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-[9999px] flex items-center justify-center shrink-0 border ${config.style}`}
                        title={config.label}
                      >
                        <Icon size={20} className={isAlertType(item.type) ? 'fill-current' : ''} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <h4 className="text-sm font-semibold text-ink truncate">
                            {item.title}
                          </h4>
                          <span className="text-xs text-ink-muted shrink-0">
                            {isToday ? formatTime(time) : relativeTime(time)}
                          </span>
                        </div>

                        <NotificationBody html={item.message} />

                        {item.sender?.fullName && (
                          <p className="mt-2 text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                            From {item.sender.fullName}
                          </p>
                        )}

                        {item.actionUrl && (
                          <a
                            href={item.actionUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            View details →
                          </a>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2 ml-2 shrink-0">
                        {!item.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-[9999px] mt-1.5" />
                        )}

                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveItemMenu(activeItemMenu === item.id ? null : item.id)
                            }}
                            className="p-1 h-8 w-8 rounded-[9999px] text-ink-muted hover:bg-canvas opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical size={16} />
                          </Button>

                          {activeItemMenu === item.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveItemMenu(null)
                                }}
                              />
                              <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-control shadow-hover p-1 z-20">
                                <button
                                  onClick={(e) => handleDelete(item.id, e)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-control text-xs font-medium text-danger hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}

          {filteredNotifications.length === 0 && !loading && (
            <EmptyState
              icon={<Bell size={36} className="text-ink-muted" />}
              title="No notifications"
              description={
                filter === 'All'
                  ? "You don't have any notifications yet. We'll let you know when something happens."
                  : `You don't have any notifications in the "${filter}" filter.`
              }
              action={
                <div className="flex items-center gap-2">
                  {filter !== 'All' && (
                    <Button variant="outline" onClick={() => setFilter('All')}>
                      View all notifications
                    </Button>
                  )}
                  <Button variant="ghost" onClick={fetchNotifications} className="gap-1.5">
                    <RefreshCcw size={14} />
                    Refresh
                  </Button>
                </div>
              }
            />
          )}
        </div>
      )}

      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-30">
        <div className="bg-surface shadow-hover border border-border p-1.5 rounded-full flex items-center gap-1">
          <Button
            variant={filter === 'All' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-full text-xs font-semibold px-4 h-8"
            onClick={() => setFilter('All')}
          >
            All
          </Button>
          <Button
            variant={filter === 'Unread' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-full text-xs font-semibold px-4 h-8"
            onClick={() => setFilter('Unread')}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/20 text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant={filter === 'Alerts' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-full text-xs font-semibold px-4 h-8"
            onClick={() => setFilter('Alerts')}
          >
            Alerts
          </Button>
          <div className="w-[1px] h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            className="w-8 h-8 p-0 rounded-full text-ink-muted hover:text-ink hover:bg-canvas"
            aria-label="Refresh"
          >
            <RefreshCcw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 rounded-full text-ink-muted hover:text-ink hover:bg-canvas"
            aria-label="Notification Settings"
            onClick={() => (window.location.href = '/dashboard/settings/notifications')}
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
