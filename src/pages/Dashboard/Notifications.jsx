import { useState } from 'react'
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
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'

const initialNotifications = [
  {
    id: 1,
    category: 'Today',
    type: 'success', // check_circle
    title: 'Post Successfully Published',
    description: 'Your campaign "Summer Vibes 2026" has been successfully posted to Instagram and LinkedIn. Engagement tracking is now live.',
    time: '2 mins ago',
    unread: true,
  },
  {
    id: 2,
    category: 'Today',
    type: 'alert', // warning
    title: 'Connection Alert: Twitter/X',
    description: 'Your API token for @SocialAI_Dev has expired. Please re-authenticate to continue scheduled posts.',
    time: '10:45 AM',
    unread: false,
  },
  {
    id: 3,
    category: 'Today',
    type: 'info', // info
    title: 'Platform Update: v2.4.0',
    description: "We've introduced new AI-powered hashtag generation and improved video cropping tools. Check the release notes.",
    time: '9:15 AM',
    unread: false,
  },
  {
    id: 4,
    category: 'Yesterday',
    type: 'billing', // credit card
    title: 'Monthly Invoice Ready',
    description: 'Your invoice for the billing period June 2026 is now available for download in your billing dashboard.',
    time: 'Yesterday, 4:20 PM',
    unread: false,
  },
  {
    id: 5,
    category: 'Yesterday',
    type: 'support', // help-circle
    title: 'Support Ticket Update: #48102',
    description: 'Support agent Sarah J. has replied to your inquiry about API limits. "We\'ve increased your daily threshold..."',
    time: 'Yesterday, 11:30 AM',
    unread: false,
  },
  {
    id: 6,
    category: 'Last Week',
    type: 'success_read', // check_circle gray
    title: 'Campaign "Growth Hack" Finished',
    description: 'Your 7-day scheduled campaign has concluded. Total reach increased by 24% across all connected platforms.',
    time: 'July 15, 2026',
    unread: false,
  },
]

const typeConfig = {
  success: {
    icon: CheckCircle2,
    style: 'bg-accent-50 text-accent-600 border-accent-100',
  },
  alert: {
    icon: AlertTriangle,
    style: 'bg-red-50 text-danger border-red-100',
  },
  info: {
    icon: Info,
    style: 'bg-primary-50 text-primary-700 border-primary-100',
  },
  billing: {
    icon: CreditCard,
    style: 'bg-primary-50 text-primary-700 border-primary-100',
  },
  support: {
    icon: HelpCircle,
    style: 'bg-amber-50 text-warning border-amber-100',
  },
  success_read: {
    icon: CheckCircle2,
    style: 'bg-gray-100 text-ink-muted border-border',
  },
}

const groups = ['Today', 'Yesterday', 'Last Week']

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState('All')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeItemMenu, setActiveItemMenu] = useState(null)

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, unread: false }))
    )
  }

  const deleteNotification = (id, e) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setActiveItemMenu(null)
  }

  const handleActionClick = (e, action) => {
    e.stopPropagation()
    console.log(`Action clicked: ${action}`)
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'Unread') return n.unread
    if (filter === 'Alerts') return n.type === 'alert'
    if (filter === 'System') return n.type === 'info'
    return true
  })

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <PageHeader
        title="Notifications"
        description="Stay updated with your latest social channel activity and system alerts."
        action={
          <div className="flex items-center gap-2 relative">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="gap-1.5 font-semibold text-xs border-primary/20 text-primary-700 hover:bg-primary-50 h-9"
            >
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </Button>

            {/* Filter Dropdown */}
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
                    {['All', 'Unread', 'Alerts', 'System'].map((type) => (
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

      {/* Notifications Lists */}
      <div className="space-y-8">
        {groups.map((group) => {
          const groupItems = filteredNotifications.filter((n) => n.category === group)
          if (groupItems.length === 0) return null

          return (
            <section key={group} className="space-y-4">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-border/40 pb-2">
                {group}
              </h3>
              <div className="space-y-3">
                {groupItems.map((item) => {
                  const config = typeConfig[item.type] || typeConfig.info
                  const Icon = config.icon

                  return (
                    <Card
                      key={item.id}
                      onClick={() => markAsRead(item.id)}
                      className={`p-4 flex items-start gap-4 cursor-pointer relative group transition-all border ${
                        item.unread
                          ? 'bg-primary-50/20 border-primary-100 hover:border-primary-200'
                          : 'bg-surface hover:border-border border-border/60'
                      }`}
                    >
                      {/* Left Circular Icon Badge */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${config.style}`}
                      >
                        <Icon size={20} className={item.type === 'success' || item.type === 'alert' || item.type === 'support' ? 'fill-current' : ''} />
                      </div>

                      {/* Main Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <h4 className="text-sm font-semibold text-ink truncate">
                            {item.title}
                          </h4>
                          <span className="text-xs text-ink-muted shrink-0">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-sm text-ink-muted leading-relaxed">
                          {item.description}
                        </p>

                        {/* Action buttons under post publish updates */}
                        {item.type === 'success' && (
                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => handleActionClick(e, 'View Post')}
                              className="text-xs font-semibold py-1.5 h-8"
                            >
                              View Post
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleActionClick(e, 'Analytics')}
                              className="text-xs font-semibold py-1.5 h-8 bg-surface hover:bg-canvas"
                            >
                              Analytics
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Right Control indicators */}
                      <div className="flex flex-col items-center gap-2 ml-2 shrink-0">
                        {item.unread && (
                          <div className="w-2.5 h-2.5 bg-primary-600 rounded-full mt-1.5" />
                        )}

                        {/* Action Menu (Delete) */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveItemMenu(activeItemMenu === item.id ? null : item.id)
                            }}
                            className="p-1 h-8 w-8 rounded-full text-ink-muted hover:bg-canvas opacity-0 group-hover:opacity-100 transition-opacity"
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
                                  onClick={(e) => deleteNotification(item.id, e)}
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
          )
        })}

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <EmptyState
            icon={<Bell size={36} className="text-ink-muted" />}
            title="No notifications"
            description={`You don't have any notifications in the "${filter}" filter.`}
            action={
              filter !== 'All' && (
                <Button variant="outline" onClick={() => setFilter('All')}>
                  View all notifications
                </Button>
              )
            }
          />
        )}
      </div>

      {/* Quick Filter Chips (Bottom Floating Bar) */}
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
            className="w-8 h-8 p-0 rounded-full text-ink-muted hover:text-ink hover:bg-canvas"
            aria-label="Notification Settings"
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
