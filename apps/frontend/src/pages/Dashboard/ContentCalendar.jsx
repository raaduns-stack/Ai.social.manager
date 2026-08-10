/**
 * ContentCalendar.jsx  (Customer view)
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays the authenticated customer's content calendar.
 * Supports Month / Week / Day views, Upcoming and Published tabs,
 * and a post details modal.
 *
 * Data comes from the real backend via calendar-api.ts.
 * Auth: apiClient interceptor automatically attaches the Bearer token.
 * The user UUID is read from useAuthStore — never hard-coded.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Camera,
  Linkedin,
  Twitter,
  Music,
  Share2,
  Eye,
  List,
  CalendarDays,
  Tag,
  AlertCircle,
  XCircle,
  FileEdit,
  Sparkles,
  RefreshCw,
  Facebook,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../store/auth-store'
import {
  getCalendarPosts,
  getUpcomingPosts,
  getPublishedPosts,
} from '../../features/calendar/calendar-api'

// ─── Helper: map platform name to icon and colour ─────────────────────────────
function getPlatformMeta(platform) {
  switch (platform) {
    case 'Instagram': return { icon: <Camera size={12} />, colour: 'danger' }
    case 'LinkedIn':  return { icon: <Linkedin size={12} />, colour: 'primary' }
    case 'X / Twitter': return { icon: <Twitter size={12} />, colour: 'neutral' }
    case 'TikTok':   return { icon: <Music size={12} />, colour: 'warning' }
    case 'Facebook':  return { icon: <Facebook size={12} />, colour: 'primary' }
    default:          return { icon: <Share2 size={12} />, colour: 'neutral' }
  }
}

// ─── Helper: map approvalStatus to Badge tone and label ───────────────────────
function getApprovalMeta(status) {
  switch (status) {
    case 'APPROVED':          return { tone: 'success',  label: 'Approved',          icon: <CheckCircle2 size={12} /> }
    case 'PENDING':           return { tone: 'warning',  label: 'Pending Review',    icon: <Clock size={12} /> }
    case 'REVISION_REQUIRED': return { tone: 'warning',  label: 'Revision Required', icon: <FileEdit size={12} /> }
    case 'REJECTED':          return { tone: 'danger',   label: 'Rejected',          icon: <XCircle size={12} /> }
    default:                  return { tone: 'neutral',  label: status,              icon: <AlertCircle size={12} /> }
  }
}

// ─── Helper: map postStatus to Badge tone ─────────────────────────────────────
function getStatusMeta(status) {
  switch (status) {
    case 'SCHEDULED':  return { tone: 'primary',  label: 'Scheduled' }
    case 'PUBLISHED':  return { tone: 'success',  label: 'Published' }
    case 'DRAFT':      return { tone: 'neutral',  label: 'Draft' }
    default:           return { tone: 'neutral',  label: status }
  }
}

// ─── Helper: format date for display ─────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',       label: 'All Content' },
  { id: 'upcoming',  label: 'Upcoming Posts' },
  { id: 'published', label: 'Published Posts' },
]

const VIEWS = ['Month', 'Week', 'Day']

// ─── Loader placeholder ───────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-canvas bg-canvas p-3">
      <div className="mb-2 h-3 w-1/3 rounded bg-gray-200" />
      <div className="mb-1 h-4 w-2/3 rounded bg-gray-200" />
      <div className="h-3 w-1/2 rounded bg-gray-200" />
    </div>
  )
}

// ─── Post card used in list / calendar grid ────────────────────────────────────
function PostCard({ post, onClick }) {
  const { icon, colour } = getPlatformMeta(post.platform)
  const approval = getApprovalMeta(post.approvalStatus)
  const dateStr = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : post.publishedAt
    ? new Date(post.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <button
      onClick={() => onClick(post)}
      className="w-full text-left rounded-lg border border-canvas bg-surface p-3 shadow-sm hover:shadow-hover hover:border-primary-200 transition-all duration-150 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <Badge tone={colour} className="flex items-center gap-1">
          {icon} {post.platform}
        </Badge>
        {dateStr && <span className="text-xs text-ink-muted flex items-center gap-1"><Clock size={10} />{dateStr}</span>}
      </div>
      <p className="text-sm font-medium text-ink line-clamp-2">{post.title}</p>
      <div className="flex items-center gap-2 mt-2">
        <Badge tone={approval.tone} className="flex items-center gap-1 text-[10px]">
          {approval.icon} {approval.label}
        </Badge>
        {post.aiGenerated && (
          <Badge tone="primary" className="flex items-center gap-1 text-[10px]">
            <Sparkles size={10} /> AI
          </Badge>
        )}
      </div>
    </button>
  )
}

// ─── Month calendar grid ───────────────────────────────────────────────────────
function MonthView({ posts, currentDate, onPostClick }) {
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Build days of month aligned to week (Sun = 0)
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()  // 0 = Sun
  const totalCells = startPad + lastDay.getDate()
  const cells = Array.from({ length: Math.ceil(totalCells / 7) * 7 })

  // Group posts by date string YYYY-MM-DD
  const postsByDate = useMemo(() => {
    const map = {}
    posts.forEach(p => {
      const ts = p.scheduledAt || p.publishedAt || p.createdAt
      if (!ts) return
      const key = ts.split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(p)
    })
    return map
  }, [posts])

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-canvas mb-1">
        {dayNames.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-ink-muted">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-px bg-canvas">
        {cells.map((_, idx) => {
          const dayNum = idx - startPad + 1
          const isValid = dayNum >= 1 && dayNum <= lastDay.getDate()
          const dateStr = isValid
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            : null
          const dayPosts = dateStr ? (postsByDate[dateStr] || []) : []
          const isToday = dateStr === todayStr

          return (
            <div
              key={idx}
              className={`min-h-[100px] bg-surface p-1 ${!isValid ? 'opacity-30' : ''}`}
            >
              {isValid && (
                <>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-primary-600 text-white' : 'text-ink-muted'}`}>
                    {dayNum}
                  </div>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map(p => {
                      const { colour } = getPlatformMeta(p.platform)
                      return (
                        <button
                          key={p.id}
                          onClick={() => onPostClick(p)}
                          className={`w-full text-left text-[10px] rounded px-1 py-0.5 truncate
                            bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors`}
                        >
                          {p.title}
                        </button>
                      )
                    })}
                    {dayPosts.length > 3 && (
                      <span className="text-[10px] text-ink-muted pl-1">+{dayPosts.length - 3} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week view ─────────────────────────────────────────────────────────────────
function WeekView({ posts, currentDate, onPostClick }) {
  // Build the 7 days of the week containing currentDate (Mon–Sun)
  const monday = new Date(currentDate)
  monday.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7))

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const postsByDate = useMemo(() => {
    const map = {}
    posts.forEach(p => {
      const ts = p.scheduledAt || p.publishedAt || p.createdAt
      if (!ts) return
      const key = ts.split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(p)
    })
    return map
  }, [posts])

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(d => {
        const dateStr = d.toISOString().split('T')[0]
        const dayPosts = postsByDate[dateStr] || []
        const isToday = dateStr === todayStr
        return (
          <div key={dateStr} className={`rounded-lg border p-2 min-h-[160px] ${isToday ? 'border-primary-400 bg-primary-50' : 'border-canvas bg-surface'}`}>
            <div className="text-xs font-semibold text-ink-muted mb-1">
              {d.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-sm font-bold mb-2 ${isToday ? 'text-primary-600' : 'text-ink'}`}>
              {d.getDate()}
            </div>
            <div className="space-y-1">
              {dayPosts.length === 0 && <p className="text-[10px] text-ink-muted">—</p>}
              {dayPosts.map(p => (
                <button
                  key={p.id}
                  onClick={() => onPostClick(p)}
                  className="w-full text-left text-[10px] rounded px-1 py-0.5 bg-primary-50 text-primary-700 hover:bg-primary-100 truncate transition-colors"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Day view ──────────────────────────────────────────────────────────────────
function DayView({ posts, currentDate, onPostClick }) {
  const dateStr = currentDate.toISOString().split('T')[0]

  // Filter posts for the selected day
  const dayPosts = useMemo(() => posts.filter(p => {
    const ts = p.scheduledAt || p.publishedAt || p.createdAt
    return ts && ts.startsWith(dateStr)
  }), [posts, dateStr])

  const label = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-3">{label}</h3>
      {dayPosts.length === 0 ? (
        <div className="text-center py-12 text-ink-muted">
          <CalendarDays className="mx-auto mb-2 opacity-30" size={32} />
          <p className="text-sm">No posts scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayPosts.map(p => <PostCard key={p.id} post={p} onClick={onPostClick} />)}
        </div>
      )}
    </div>
  )
}

// ─── Post Details Modal ────────────────────────────────────────────────────────
function PostDetailModal({ post, onClose }) {
  if (!post) return null
  const platform = getPlatformMeta(post.platform)
  const approval = getApprovalMeta(post.approvalStatus)
  const status   = getStatusMeta(post.status)

  return (
    <Modal open={!!post} onClose={onClose} title="Post Details" className="max-w-xl">
      {/* Media */}
      {post.mediaUrl && (
        <img src={post.mediaUrl} alt="Post media" className="w-full rounded-lg mb-4 object-cover max-h-48" />
      )}

      {/* Platform + Status row */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge tone={platform.colour} className="flex items-center gap-1">
          {platform.icon} {post.platform}
        </Badge>
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge tone={approval.tone} className="flex items-center gap-1">
          {approval.icon} {approval.label}
        </Badge>
        {post.aiGenerated && (
          <Badge tone="primary" className="flex items-center gap-1">
            <Sparkles size={10} /> AI Generated
          </Badge>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-ink mb-2">{post.title}</h3>

      {/* Caption */}
      <p className="text-sm text-ink-muted mb-3 whitespace-pre-wrap">{post.caption}</p>

      {/* Schedule info */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-xs text-ink-muted block mb-0.5">Scheduled Date</span>
          <span className="font-medium text-ink">{formatDate(post.scheduledAt)}</span>
        </div>
        <div>
          <span className="text-xs text-ink-muted block mb-0.5">Scheduled Time</span>
          <span className="font-medium text-ink">{formatTime(post.scheduledAt)}</span>
        </div>
        {post.publishedAt && (
          <div>
            <span className="text-xs text-ink-muted block mb-0.5">Published At</span>
            <span className="font-medium text-ink">{formatDate(post.publishedAt)}</span>
          </div>
        )}
      </div>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-ink-muted block mb-1 flex items-center gap-1"><Tag size={10} /> Hashtags</span>
          <div className="flex flex-wrap gap-1">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-xs bg-primary-50 text-primary-700 rounded-full px-2 py-0.5">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes (read-only for customer) */}
      {post.adminNotes && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <span className="text-xs font-medium text-amber-800 block mb-1">Admin Notes</span>
          <p className="text-xs text-amber-700">{post.adminNotes}</p>
        </div>
      )}
    </Modal>
  )
}

// ─── Main page component ───────────────────────────────────────────────────────
export default function ContentCalendar() {
  // Read the authenticated user's UUID from the global auth store
  const user = useAuthStore(state => state.user)
  const userId = user?.id

  // ── State ──
  const [activeTab, setActiveTab]   = useState('all')
  const [activeView, setActiveView] = useState('Month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState(null)

  // Separate fetch state per tab to avoid mixing data
  const [allPosts, setAllPosts]           = useState([])
  const [upcomingPosts, setUpcomingPosts] = useState([])
  const [publishedPosts, setPublishedPosts] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── Fetch logic ────────────────────────────────────────────────────────────

  /**
   * Fetch all three post lists in parallel on mount.
   * Re-fetches if the authenticated user changes.
   */
  const fetchAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [all, upcoming, published] = await Promise.all([
        getCalendarPosts(userId),
        getUpcomingPosts(userId),
        getPublishedPosts(userId),
      ])
      setAllPosts(all)
      setUpcomingPosts(upcoming)
      setPublishedPosts(published)
    } catch (err) {
      // Show a friendly error message
      const msg = err?.message || 'Failed to load calendar posts. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── Derive the active post list based on tab ────────────────────────────────
  const activePosts = useMemo(() => {
    if (activeTab === 'upcoming')  return upcomingPosts
    if (activeTab === 'published') return publishedPosts
    return allPosts
  }, [activeTab, allPosts, upcomingPosts, publishedPosts])

  // ── Calendar navigation ─────────────────────────────────────────────────────
  function navigatePrev() {
    setCurrentDate(d => {
      const next = new Date(d)
      if (activeView === 'Month') next.setMonth(d.getMonth() - 1)
      else if (activeView === 'Week') next.setDate(d.getDate() - 7)
      else next.setDate(d.getDate() - 1)
      return next
    })
  }

  function navigateNext() {
    setCurrentDate(d => {
      const next = new Date(d)
      if (activeView === 'Month') next.setMonth(d.getMonth() + 1)
      else if (activeView === 'Week') next.setDate(d.getDate() + 7)
      else next.setDate(d.getDate() + 1)
      return next
    })
  }

  // ── Calendar header label ───────────────────────────────────────────────────
  const calendarLabel = useMemo(() => {
    if (activeView === 'Month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    if (activeView === 'Week') {
      const mon = new Date(currentDate)
      mon.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7))
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return `${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }, [activeView, currentDate])

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Content Calendar" subtitle="Your scheduled content" />
        <div className="mt-8 rounded-lg bg-red-50 border border-red-200 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-danger" size={32} />
          <p className="text-sm font-medium text-danger mb-1">Failed to load calendar</p>
          <p className="text-xs text-red-600 mb-3">{error}</p>
          <Button size="sm" onClick={fetchAll}>
            <RefreshCw size={14} className="mr-1" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Content Calendar"
        subtitle="Plan, schedule, and track your social media content."
      />

      {/* ── Tab bar ── */}
      <div className="flex gap-1 mb-6 border-b border-canvas">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2">
          <Button variant="ghost" size="sm" onClick={fetchAll} title="Refresh">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* ── Calendar / List view selector ── */}
      {activeTab === 'all' && (
        <Card className="mb-6">
          {/* View switcher + navigation */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            {/* Month / Week / Day buttons */}
            <div className="flex rounded-lg border border-canvas overflow-hidden">
              {VIEWS.map(v => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeView === v
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface text-ink-muted hover:bg-canvas'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Navigation arrows + label */}
            <div className="flex items-center gap-2">
              <button onClick={navigatePrev} className="p-1 rounded hover:bg-canvas text-ink-muted hover:text-ink">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-ink min-w-[180px] text-center">{calendarLabel}</span>
              <button onClick={navigateNext} className="p-1 rounded hover:bg-canvas text-ink-muted hover:text-ink">
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="text-xs text-primary-600 hover:underline ml-2">
                Today
              </button>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : activePosts.length === 0 ? (
            <div className="text-center py-16 text-ink-muted">
              <CalendarDays className="mx-auto mb-3 opacity-30" size={40} />
              <p className="font-medium">No posts yet</p>
              <p className="text-sm mt-1">Schedule your first post to see it here.</p>
            </div>
          ) : (
            <>
              {activeView === 'Month' && (
                <MonthView posts={activePosts} currentDate={currentDate} onPostClick={setSelectedPost} />
              )}
              {activeView === 'Week' && (
                <WeekView posts={activePosts} currentDate={currentDate} onPostClick={setSelectedPost} />
              )}
              {activeView === 'Day' && (
                <DayView posts={activePosts} currentDate={currentDate} onPostClick={setSelectedPost} />
              )}
            </>
          )}
        </Card>
      )}

      {/* ── Upcoming / Published list view ── */}
      {(activeTab === 'upcoming' || activeTab === 'published') && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink flex items-center gap-2">
              {activeTab === 'upcoming' ? <Clock size={16} className="text-primary-600" /> : <CheckCircle2 size={16} className="text-accent-600" />}
              {activeTab === 'upcoming' ? 'Upcoming Posts' : 'Published Posts'}
              {!loading && (
                <Badge tone="neutral" className="ml-1">{activePosts.length}</Badge>
              )}
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : activePosts.length === 0 ? (
            <div className="text-center py-12 text-ink-muted">
              <List className="mx-auto mb-3 opacity-30" size={32} />
              <p className="font-medium">
                {activeTab === 'upcoming' ? 'No upcoming posts' : 'No published posts yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePosts.map(post => (
                <PostCard key={post.id} post={post} onClick={setSelectedPost} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Post details modal ── */}
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  )
}
