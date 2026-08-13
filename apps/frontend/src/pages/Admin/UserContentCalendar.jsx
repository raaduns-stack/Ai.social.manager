/**
 * Admin/UserContentCalendar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Detailed per-user calendar view for admins.
 * Route: /admin/users/:userId/calendar (defined in AdminRoutes.jsx)
 * The userId comes from useParams() — not hard-coded.
 *
 * Admins can:
 *  - View Month / Week / Day calendar of a customer's posts
 *  - Click a post to see full details
 *  - Approve / Reject / Request Revision with optional notes
 *    via PATCH /api/calendar/admin/posts/:id/approval
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Tag,
  Camera,
  Linkedin,
  Twitter,
  Music,
  Share2,
  Facebook,
  CalendarDays,
  Star,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import {
  getAdminCalendarPosts,
  getAdminOverview,
  updatePostApproval,
} from '../../features/calendar/calendar-api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlatformMeta(platform) {
  switch (platform) {
    case 'Instagram':   return { icon: <Camera size={12} />,   colour: 'danger' }
    case 'LinkedIn':    return { icon: <Linkedin size={12} />,  colour: 'primary' }
    case 'X / Twitter': return { icon: <Twitter size={12} />,  colour: 'neutral' }
    case 'TikTok':      return { icon: <Music size={12} />,    colour: 'warning' }
    case 'Facebook':    return { icon: <Facebook size={12} />, colour: 'primary' }
    default:            return { icon: <Share2 size={12} />,   colour: 'neutral' }
  }
}

function getApprovalMeta(status) {
  switch (status) {
    case 'APPROVED':          return { tone: 'success', label: 'Approved',          icon: <CheckCircle2 size={12} /> }
    case 'PENDING':           return { tone: 'warning', label: 'Pending Review',    icon: <Clock size={12} /> }
    case 'REVISION_REQUIRED': return { tone: 'warning', label: 'Revision Required', icon: <FileEdit size={12} /> }
    case 'REJECTED':          return { tone: 'danger',  label: 'Rejected',          icon: <XCircle size={12} /> }
    default:                  return { tone: 'neutral', label: status,              icon: <AlertCircle size={12} /> }
  }
}

function getStatusMeta(status) {
  switch (status) {
    case 'SCHEDULED': return { tone: 'primary', label: 'Scheduled' }
    case 'PUBLISHED': return { tone: 'success', label: 'Published' }
    case 'DRAFT':     return { tone: 'neutral', label: 'Draft' }
    default:          return { tone: 'neutral', label: status }
  }
}

function formatDateTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Month calendar grid ───────────────────────────────────────────────────────
function MonthView({ posts, currentDate, onPostClick }) {
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalCells = startPad + lastDay.getDate()
  const cells = Array.from({ length: Math.ceil(totalCells / 7) * 7 })

  // Group posts by date key YYYY-MM-DD
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
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-canvas mb-1">
        {dayNames.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-ink-muted">{d}</div>
        ))}
      </div>
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
            <div key={idx} className={`min-h-[90px] bg-surface p-1 ${!isValid ? 'opacity-20' : ''}`}>
              {isValid && (
                <>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-primary-600 text-white' : 'text-ink-muted'}`}>
                    {dayNum}
                  </div>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map(p => {
                      const appr = getApprovalMeta(p.approvalStatus)
                      return (
                        <button
                          key={p.id}
                          onClick={() => onPostClick(p)}
                          className={`w-full text-left text-[10px] rounded px-1 py-0.5 truncate transition-colors
                            ${p.approvalStatus === 'APPROVED' ? 'bg-accent-50 text-accent-700 hover:bg-accent-100'
                            : p.approvalStatus === 'REJECTED' ? 'bg-red-50 text-danger hover:bg-red-100'
                            : p.approvalStatus === 'REVISION_REQUIRED' ? 'bg-amber-50 text-warning hover:bg-amber-100'
                            : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}
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
          <div key={dateStr} className={`rounded-lg border p-2 min-h-[140px] ${isToday ? 'border-primary-400 bg-primary-50' : 'border-canvas bg-surface'}`}>
            <div className="text-xs font-semibold text-ink-muted mb-1">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className={`text-sm font-bold mb-2 ${isToday ? 'text-primary-600' : 'text-ink'}`}>{d.getDate()}</div>
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
  const dayPosts = useMemo(() => posts.filter(p => {
    const ts = p.scheduledAt || p.publishedAt || p.createdAt
    return ts && ts.startsWith(dateStr)
  }), [posts, dateStr])

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-3">
        {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </h3>
      {dayPosts.length === 0 ? (
        <div className="text-center py-12 text-ink-muted">
          <CalendarDays className="mx-auto mb-2 opacity-30" size={32} />
          <p className="text-sm">No posts for this day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayPosts.map(p => {
            const platform = getPlatformMeta(p.platform)
            const appr = getApprovalMeta(p.approvalStatus)
            return (
              <button
                key={p.id}
                onClick={() => onPostClick(p)}
                className="w-full text-left rounded-lg border border-canvas bg-surface p-3 hover:shadow-hover hover:border-primary-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone={platform.colour} className="flex items-center gap-1">{platform.icon} {p.platform}</Badge>
                  <Badge tone={appr.tone} className="flex items-center gap-1">{appr.icon} {appr.label}</Badge>
                </div>
                <p className="text-sm font-medium text-ink">{p.title}</p>
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{p.caption}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Admin approval action panel ───────────────────────────────────────────────
function ApprovalPanel({ post, onApprove, isUpdating }) {
  const [notes, setNotes] = useState(post.adminNotes || '')
  const [status, setStatus] = useState(post.approvalStatus)

  // Sync when post changes (e.g. after a successful update)
  useEffect(() => {
    setStatus(post.approvalStatus)
    setNotes(post.adminNotes || '')
  }, [post.id, post.approvalStatus, post.adminNotes])

  // Approval status options matching backend enum exactly
  const OPTIONS = [
    { value: 'APPROVED',          label: 'Approve',          tone: 'success' },
    { value: 'REVISION_REQUIRED', label: 'Request Revision', tone: 'warning' },
    { value: 'REJECTED',          label: 'Reject',           tone: 'danger' },
    { value: 'PENDING',           label: 'Set Pending',       tone: 'neutral' },
  ]

  return (
    <div className="mt-4 border-t border-canvas pt-4">
      <h4 className="text-sm font-semibold text-ink mb-2">Admin Approval Action</h4>

      {/* Status selector */}
      <div className="flex flex-wrap gap-2 mb-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
              status === opt.value
                ? opt.value === 'APPROVED'   ? 'bg-accent-600 text-white border-accent-600'
                : opt.value === 'REJECTED'   ? 'bg-danger text-white border-danger'
                : opt.value === 'REVISION_REQUIRED' ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-gray-500 text-white border-gray-500'
                : 'bg-surface text-ink-muted border-canvas hover:border-ink-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Admin notes — always shown so admin can provide context */}
      <textarea
        rows={3}
        placeholder="Admin notes (optional — visible to the customer)…"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="w-full text-sm border border-canvas rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-400 bg-canvas resize-none"
      />

      {/* Submit button */}
      <Button
        className="mt-2 w-full"
        size="sm"
        disabled={isUpdating}
        onClick={() => onApprove({ approvalStatus: status, adminNotes: notes.trim() || undefined })}
      >
        {isUpdating ? 'Saving…' : 'Save Approval Decision'}
      </Button>
    </div>
  )
}

// ─── Post details modal with admin approval ────────────────────────────────────
function PostDetailModal({ post, onClose, onUpdated }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [updateError, setUpdateError] = useState(null)

  if (!post) return null

  const platform = getPlatformMeta(post.platform)
  const approval = getApprovalMeta(post.approvalStatus)
  const status   = getStatusMeta(post.status)

  /**
   * Send the PATCH request to update approval status.
   * Request body shape matches UpdateApprovalDto exactly:
   *   { approvalStatus: string, adminNotes?: string }
   */
  async function handleApprove(dto) {
    setIsUpdating(true)
    setUpdateError(null)
    setSuccessMsg(null)
    try {
      const updated = await updatePostApproval(post.id, dto)
      setSuccessMsg(`Status updated to ${dto.approvalStatus}`)
      // Notify parent to refresh the post in the list
      onUpdated(updated)
    } catch (err) {
      setUpdateError(err?.message || 'Failed to update approval status.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Modal open={!!post} onClose={onClose} title="Post Details" className="max-w-xl">
      {/* Media */}
      {post.mediaUrl && (
        <img src={post.mediaUrl} alt="Post media" className="w-full rounded-lg mb-4 object-cover max-h-48" />
      )}

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge tone={platform.colour} className="flex items-center gap-1">{platform.icon} {post.platform}</Badge>
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge tone={approval.tone} className="flex items-center gap-1">{approval.icon} {approval.label}</Badge>
        {post.aiGenerated && (
          <Badge tone="primary" className="flex items-center gap-1"><Sparkles size={10} /> AI</Badge>
        )}
      </div>

      {/* Title + caption */}
      <h3 className="text-base font-semibold text-ink mb-1">{post.title}</h3>
      <p className="text-sm text-ink-muted mb-3 whitespace-pre-wrap">{post.caption}</p>

      {/* Schedule/publish times */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        {post.scheduledAt && (
          <div>
            <span className="text-xs text-ink-muted block mb-0.5">Scheduled</span>
            <span className="font-medium text-ink">{formatDateTime(post.scheduledAt)}</span>
          </div>
        )}
        {post.publishedAt && (
          <div>
            <span className="text-xs text-ink-muted block mb-0.5">Published</span>
            <span className="font-medium text-ink">{formatDateTime(post.publishedAt)}</span>
          </div>
        )}
      </div>

      {/* Hashtags */}
      {post.hashtags?.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-ink-muted flex items-center gap-1 mb-1"><Tag size={10} /> Hashtags</span>
          <div className="flex flex-wrap gap-1">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-xs bg-primary-50 text-primary-700 rounded-full px-2 py-0.5">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Customer info */}
      {post.user && (
        <div className="text-xs text-ink-muted mb-3">
          Customer: <span className="font-medium text-ink">{post.user.fullName}</span>
          {post.user.businessName && <span> · {post.user.businessName}</span>}
        </div>
      )}

      {/* AI Suggestions & Feedback */}
      {post.suggestions && post.suggestions.length > 0 && (
        <div className="mt-4 border-t border-canvas pt-4 mb-3">
          <h4 className="text-sm font-semibold text-ink mb-2">AI Suggestions & Customer Feedback</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {post.suggestions.map((suggestion) => {
              const feedback = suggestion.feedback?.[0];
              const isSelected = post.selectedSuggestionId === suggestion.id;

              return (
                <div
                  key={suggestion.id}
                  className={`p-2.5 rounded border text-xs leading-relaxed ${
                    isSelected ? 'bg-primary-50/60 border-primary-200' : 'bg-canvas/30 border-border/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-semibold text-ink">{suggestion.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <Badge tone="success" className="text-[9px] uppercase font-bold py-0.5 px-1.5 tracking-wider">
                          Selected
                        </Badge>
                      )}
                      {feedback && (
                        <Badge
                          tone={feedback.rating >= 3 ? 'success' : 'danger'}
                          className="text-[9px] font-bold py-0.5 px-1.5"
                        >
                          {feedback.reaction === 'up' ? '👍' : '👎'} {feedback.rating} ★
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-ink-muted text-xs leading-normal">{suggestion.content}</p>
                  {feedback ? (
                    <div className="text-[10px] text-primary-700 font-semibold mt-1">
                      Customer rated: {feedback.rating} star{feedback.rating > 1 ? 's' : ''} ({feedback.reaction === 'up' ? 'Liked' : 'Disliked'})
                    </div>
                  ) : (
                    <div className="text-[10px] text-ink-muted italic mt-1">
                      Not rated yet by customer.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Success / error feedback */}
      {successMsg && (
        <div className="rounded-lg bg-accent-50 border border-accent-200 p-2 mb-2 text-xs text-accent-700 flex items-center gap-2">
          <CheckCircle2 size={12} /> {successMsg}
        </div>
      )}
      {updateError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2 mb-2 text-xs text-danger flex items-center gap-2">
          <AlertCircle size={12} /> {updateError}
        </div>
      )}

      {/* Admin approval action */}
      <ApprovalPanel post={post} onApprove={handleApprove} isUpdating={isUpdating} />
    </Modal>
  )
}

// ─── Calendar navigation views ─────────────────────────────────────────────────
const VIEWS = ['Month', 'Week', 'Day']

// ─── Main page component ───────────────────────────────────────────────────────
export default function UserContentCalendar() {
  // userId comes from the route /admin/users/:userId/calendar
  const { userId } = useParams()

  const [posts, setPosts]           = useState([])
  const [overview, setOverview]     = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [activeView, setActiveView] = useState('Month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  // ── Fetch the customer's posts + approval overview ──────────────────────────
  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      // Fetch all posts for this user (admin view, no approval filter — admin sees everything)
      const [postData, overviewData] = await Promise.all([
        getAdminCalendarPosts(userId),
        getAdminOverview(userId),
      ])
      setPosts(postData)
      setOverview(overviewData)
    } catch (err) {
      setError(err?.message || 'Failed to load calendar for this user.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── After a successful approval update, patch the local post list ────────────
  function handlePostUpdated(updatedPost) {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    // Also update the selected post so the modal reflects the new status immediately
    setSelectedPost(prev => prev?.id === updatedPost.id ? { ...prev, ...updatedPost } : prev)
  }

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

  // ── Header label ────────────────────────────────────────────────────────────
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

  // ── Customer name from first post's user join ───────────────────────────────
  const customerName = posts[0]?.user?.fullName || `User ${userId}`

  if (error) {
    return (
      <div className="p-6">
        <Link to="/admin/calendar" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4">
          <ArrowLeft size={14} /> Back to Calendar Management
        </Link>
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-danger" size={32} />
          <p className="text-sm font-medium text-danger mb-1">Failed to load calendar</p>
          <p className="text-xs text-red-600 mb-3">{error}</p>
          <Button size="sm" onClick={fetchData}><RefreshCw size={14} className="mr-1" /> Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Back link */}
      <Link to="/admin/calendar" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4 w-fit">
        <ArrowLeft size={14} /> Back to Calendar Management
      </Link>

      <PageHeader
        title={`${customerName}'s Content Calendar`}
        subtitle="Admin view — approve or review posts below."
      />

      {/* ── Approval metrics overview ── */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 mb-6">
          {[
            { label: 'Total Posts',      value: overview.total,            tone: 'neutral' },
            { label: 'Approved',         value: overview.approved,         tone: 'success' },
            { label: 'Pending',          value: overview.pending,          tone: 'warning' },
            { label: 'Revision Required', value: overview.revisionRequired, tone: 'warning' },
            { label: 'Rejected',         value: overview.rejected,         tone: 'danger' },
          ].map(m => (
            <Card key={m.label} className="text-center py-3">
              <p className="text-xl font-bold text-ink">{m.value}</p>
              <p className="text-xs text-ink-muted mt-0.5">{m.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* ── Calendar card ── */}
      <Card>
        {/* View switcher + navigation */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
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

          <div className="flex items-center gap-2">
            <button onClick={navigatePrev} className="p-1 rounded hover:bg-canvas text-ink-muted hover:text-ink">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-ink min-w-[180px] text-center">{calendarLabel}</span>
            <button onClick={navigateNext} className="p-1 rounded hover:bg-canvas text-ink-muted hover:text-ink">
              <ChevronRight size={18} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="text-xs text-primary-600 hover:underline ml-2">Today</button>
            <Button variant="ghost" size="sm" onClick={fetchData} title="Refresh"><RefreshCw size={14} /></Button>
          </div>
        </div>

        {/* Calendar body */}
        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-canvas bg-canvas p-2 min-h-[90px]" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-ink-muted">
            <CalendarDays className="mx-auto mb-3 opacity-30" size={40} />
            <p className="font-medium">No posts found for this customer.</p>
          </div>
        ) : (
          <>
            {activeView === 'Month' && (
              <MonthView posts={posts} currentDate={currentDate} onPostClick={setSelectedPost} />
            )}
            {activeView === 'Week' && (
              <WeekView posts={posts} currentDate={currentDate} onPostClick={setSelectedPost} />
            )}
            {activeView === 'Day' && (
              <DayView posts={posts} currentDate={currentDate} onPostClick={setSelectedPost} />
            )}
          </>
        )}
      </Card>

      {/* ── Post list (all posts in a scannable table-like view) ── */}
      <Card className="mt-6">
        <h3 className="font-semibold text-ink mb-3">All Posts</h3>
        {posts.length === 0 ? (
          <p className="text-sm text-ink-muted">No posts.</p>
        ) : (
          <div className="space-y-2">
            {posts.map(p => {
              const platform = getPlatformMeta(p.platform)
              const appr = getApprovalMeta(p.approvalStatus)
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPost(p)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-canvas hover:bg-canvas hover:border-primary-200 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <Badge tone={platform.colour} className="flex items-center gap-1 text-[10px]">{platform.icon} {p.platform}</Badge>
                      <Badge tone={appr.tone} className="flex items-center gap-1 text-[10px]">{appr.icon} {appr.label}</Badge>
                    </div>
                    <p className="text-sm font-medium text-ink truncate">{p.title}</p>
                    {p.scheduledAt && (
                      <p className="text-xs text-ink-muted mt-0.5">{formatDateTime(p.scheduledAt)}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-ink-muted shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Post detail + approval modal ── */}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdated={handlePostUpdated}
      />
    </div>
  )
}
