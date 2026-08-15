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
  Star,
  ThumbsUp,
  ThumbsDown,
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
  updateCalendarPost,
} from '../../features/calendar/calendar-api'
import {
  getPostSuggestions,
  regeneratePostSuggestions,
  saveSuggestionFeedback,
} from '../../features/dashboard/dashboard-api'
import KycOverlay from '../../features/kyc/KycOverlay'
import { getMyKyc } from '../../features/kyc/kyc-api'

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
    <div className="border border-border rounded-card overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 bg-surface-container-low border-b border-border">
        {dayNames.map(d => (
          <div key={d} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-ink border-r border-border/60 last:border-r-0">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-px bg-border">
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
              className={`min-h-[110px] bg-surface p-2 flex flex-col justify-between transition-colors hover:bg-primary/5 ${!isValid ? 'opacity-25 bg-canvas/30' : ''}`}
            >
              {isValid && (
                <>
                  <div className="flex justify-between items-start">
                    <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-primary text-white font-extrabold shadow-soft' : 'text-ink-muted'}`}>
                      {dayNum}
                    </div>
                    {dayPosts.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="space-y-1 mt-2 flex-grow">
                    {dayPosts.slice(0, 3).map(p => {
                      const { colour } = getPlatformMeta(p.platform)
                      return (
                        <button
                          key={p.id}
                          onClick={() => onPostClick(p)}
                          className="w-full text-left text-[10px] rounded px-1.5 py-0.5 truncate bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium transition-colors border border-primary-100/50 block"
                        >
                          {p.title}
                        </button>
                      )
                    })}
                    {dayPosts.length > 3 && (
                      <span className="text-[9px] font-semibold text-primary pl-1">+{dayPosts.length - 3} more</span>
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

// ─── AI Suggestion Card Component (Frees rating and handles selection) ──────────
function SuggestionCard({ suggestion, post, onSelected, onFeedbackSaved }) {
  const [rating, setRating] = useState(suggestion.feedback?.rating || 0)
  const [reaction, setReaction] = useState(suggestion.feedback?.reaction || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRated = !!suggestion.feedback
  const stars = isRated ? suggestion.feedback.rating : rating
  const finalReaction = isRated ? (suggestion.feedback.reaction === 'up' ? 'like' : 'dislike') : reaction
  const isEligible = isRated ? stars >= 3 : true

  async function handleRate(selectedStars, selectedReaction) {
    if (isRated || isSubmitting) return
    setIsSubmitting(true)
    try {
      const fb = await saveSuggestionFeedback(
        suggestion.id,
        selectedReaction === 'like' ? 'up' : 'down',
        selectedStars
      )
      onFeedbackSaved(suggestion.id, fb)
    } catch (err) {
      alert(err.message || 'Failed to save feedback.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={`p-4 border rounded-control transition-all ${isRated && !isEligible ? 'bg-canvas/50 border-gray-200 opacity-60' : 'bg-surface border-border/60 hover:shadow-sm'}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-ink text-sm">{suggestion.title}</h4>
        <div className="flex gap-1.5 items-center">
          {isRated && !isEligible && (
            <Badge tone="danger" className="text-[9px] uppercase font-bold tracking-wider">Not Eligible</Badge>
          )}
          {post.selectedSuggestionId === suggestion.id && (
            <Badge tone="success" className="text-[9px] uppercase font-bold tracking-wider">Selected Post</Badge>
          )}
        </div>
      </div>
      <p className="text-xs text-ink-muted mb-2 whitespace-pre-wrap leading-relaxed">{suggestion.content}</p>
      {suggestion.hashtags && suggestion.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {suggestion.hashtags.map((tag, idx) => (
            <span key={idx} className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
        {/* Rating and reaction */}
        <div className="flex items-center gap-2">
          {isRated ? (
            <div className="text-xs font-semibold text-primary-700 flex items-center gap-1.5 bg-primary-50 border border-primary-100 px-2 py-1 rounded">
              <span>Rating saved:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={11}
                    className={s <= stars ? 'fill-primary-600 text-primary-600' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="uppercase font-bold text-[9px] text-primary-600">
                ({finalReaction === 'like' ? '👍 Liked' : '👎 Disliked'})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Star Picker */}
              <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-0.5 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={13}
                      className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
              {/* Reaction Buttons */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setReaction('like')}
                  className={`p-1 rounded hover:bg-canvas transition-colors ${reaction === 'like' ? 'text-accent' : 'text-ink-muted'}`}
                >
                  <ThumbsUp size={13} className={reaction === 'like' ? 'fill-accent' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => setReaction('dislike')}
                  className={`p-1 rounded hover:bg-canvas transition-colors ${reaction === 'dislike' ? 'text-danger' : 'text-ink-muted'}`}
                >
                  <ThumbsDown size={13} className={reaction === 'dislike' ? 'fill-danger' : ''} />
                </button>
              </div>
              {rating > 0 && reaction && (
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => handleRate(rating, reaction)}
                  disabled={isSubmitting}
                  className="text-[10px] py-0.5 px-2 font-bold"
                >
                  Submit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        {(!isRated || isEligible) && post.selectedSuggestionId !== suggestion.id && (
          <Button
            size="xs"
            variant="outline"
            onClick={() => onSelected(suggestion)}
            className="text-xs font-semibold py-1 px-3 border-primary text-primary hover:bg-primary-50"
          >
            Use Suggestion
          </Button>
        )}
      </div>
    </Card>
  )
}

// ─── Post Details Modal ────────────────────────────────────────────────────────
function PostDetailModal({ post, onClose, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Edit fields
  const [editTitle, setEditTitle] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editPlatform, setEditPlatform] = useState('Instagram')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Suggestions states
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [errorSuggestions, setErrorSuggestions] = useState(null)

  useEffect(() => {
    if (post) {
      setEditTitle(post.title)
      setEditCaption(post.caption)
      setEditPlatform(post.platform)
      if (post.scheduledAt) {
        const d = new Date(post.scheduledAt)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        setEditDate(`${yyyy}-${mm}-${dd}`)

        const hh = String(d.getHours()).padStart(2, '0')
        const min = String(d.getMinutes()).padStart(2, '0')
        setEditTime(`${hh}:${min}`)
      } else {
        setEditDate('')
        setEditTime('')
      }
      setIsEditing(false)
      setShowSuggestions(false)
    }
  // Only reset when the selected POST changes — NOT on every feedback update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id])

  // Fetch suggestions when the panel opens (or a different post is selected)
  useEffect(() => {
    if (post && showSuggestions) {
      loadSuggestions()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, showSuggestions])

  async function loadSuggestions() {
    setLoadingSuggestions(true)
    setErrorSuggestions(null)
    try {
      const data = await getPostSuggestions(post.id)
      setSuggestions(data)
    } catch (err) {
      setErrorSuggestions(err.message || 'Failed to load AI suggestions.')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const data = await regeneratePostSuggestions(post.id)
      setSuggestions(data)
    } catch (err) {
      alert(err.message || 'Failed to regenerate suggestions.')
    } finally {
      setRegenerating(false)
    }
  }

  async function handleSaveEdits(e) {
    e.preventDefault()
    setIsSaving(true)
    try {
      let scheduledAt = null
      if (editDate) {
        scheduledAt = editTime ? `${editDate}T${editTime}:00` : `${editDate}T12:00:00`
      }
      const updated = await updateCalendarPost(post.id, {
        title: editTitle,
        caption: editCaption,
        platform: editPlatform,
        scheduledAt,
      })
      onUpdated(updated)
      setIsEditing(false)
    } catch (err) {
      alert(err.message || 'Failed to save edits.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSelectSuggestion(suggestion) {
    try {
      const updated = await updateCalendarPost(post.id, {
        selectedSuggestionId: suggestion.id,
        title: suggestion.title,
        caption: suggestion.content,
        hashtags: suggestion.hashtags,
        aiGenerated: true,
      })
      onUpdated(updated)
      setShowSuggestions(false)
    } catch (err) {
      alert(err.message || 'Failed to select suggestion.')
    }
  }

  function handleFeedbackSaved(suggestionId, feedback) {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === suggestionId
          ? {
              ...s,
              feedback: {
                reaction: feedback.reaction,
                rating: feedback.rating,
              },
            }
          : s
      )
    )
    // Update the parent's suggestions payload as well so the details screen re-syncs
    if (post && post.suggestions) {
      const updatedSuggestions = post.suggestions.map((s) =>
        s.id === suggestionId
          ? {
              ...s,
              feedback: {
                reaction: feedback.reaction,
                rating: feedback.rating,
              },
            }
          : s
      )
      onUpdated({ ...post, suggestions: updatedSuggestions })
    }
  }

  if (!post) return null
  const platform = getPlatformMeta(post.platform)
  const approval = getApprovalMeta(post.approvalStatus)
  const status   = getStatusMeta(post.status)

  if (showSuggestions) {
    return (
      <Modal open={!!post} onClose={onClose} title="✨ AI Content Suggestions" className="max-w-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)} className="text-sm font-semibold">
            ← Back to Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating || loadingSuggestions}
            className="gap-2 text-xs font-semibold"
          >
            <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
            <span>{regenerating ? 'Regenerating...' : 'Regenerate Suggestions'}</span>
          </Button>
        </div>

        {loadingSuggestions ? (
          <div className="py-16 text-center text-ink-muted">
            <RefreshCw className="animate-spin mx-auto mb-2 text-primary" size={24} />
            <p className="text-sm font-medium">Generating 4 tailored suggestions...</p>
          </div>
        ) : errorSuggestions ? (
          <div className="p-4 text-center bg-red-50 text-danger border border-red-200 rounded">
            <p className="text-sm">{errorSuggestions}</p>
            <Button size="xs" onClick={loadSuggestions} className="mt-2 block mx-auto">Retry</Button>
          </div>
        ) : (
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {/* Post media preview */}
            {post.mediaUrl && (
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full rounded-lg object-cover max-h-40 mb-1"
              />
            )}
            <p className="text-xs text-ink-muted">
              AI suggestions are generated based on your post topic: <span className="font-semibold text-ink">"{post.title}"</span>.
            </p>
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                post={post}
                onSelected={handleSelectSuggestion}
                onFeedbackSaved={handleFeedbackSaved}
              />
            ))}
          </div>
        )}
      </Modal>
    )
  }

  if (isEditing) {
    return (
      <Modal open={!!post} onClose={onClose} title="Edit Post Details" className="max-w-xl">
        <form onSubmit={handleSaveEdits} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-ink-muted uppercase block mb-1">Title / Topic</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full h-10 px-3 border border-border rounded-control bg-surface text-ink text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-muted uppercase block mb-1">Caption / Content</label>
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows={4}
              className="w-full p-3 border border-border rounded-control bg-surface text-ink text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-muted uppercase block mb-1">Platform</label>
              <select
                value={editPlatform}
                onChange={(e) => setEditPlatform(e.target.value)}
                className="w-full h-10 px-3 border border-border rounded-control bg-surface text-ink text-sm focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="X / Twitter">X / Twitter</option>
                <option value="TikTok">TikTok</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted uppercase block mb-1">Scheduled Date</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full h-10 px-3 border border-border rounded-control bg-surface text-ink text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ink-muted uppercase block mb-1">Scheduled Time</label>
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-full h-10 px-3 border border-border rounded-control bg-surface text-ink text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    )
  }

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
      <div className="mb-3">
        <span className="text-xs font-bold text-ink-muted uppercase block mb-0.5">Title / Topic</span>
        <h3 className="text-base font-semibold text-ink leading-snug">{post.title}</h3>
      </div>

      {/* Caption */}
      <div className="mb-4">
        <span className="text-xs font-bold text-ink-muted uppercase block mb-0.5">Caption / Content</span>
        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{post.caption}</p>
      </div>

      {/* Schedule info */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <span className="text-xs font-bold text-ink-muted uppercase block mb-0.5">Scheduled Date</span>
          <span className="font-semibold text-ink">{formatDate(post.scheduledAt)}</span>
        </div>
        <div>
          <span className="text-xs font-bold text-ink-muted uppercase block mb-0.5">Scheduled Time</span>
          <span className="font-semibold text-ink">{formatTime(post.scheduledAt)}</span>
        </div>
        {post.publishedAt && (
          <div>
            <span className="text-xs font-bold text-ink-muted uppercase block mb-0.5">Published At</span>
            <span className="font-semibold text-ink">{formatDate(post.publishedAt)}</span>
          </div>
        )}
      </div>

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-bold text-ink-muted uppercase block mb-1.5 flex items-center gap-1">
            <Tag size={10} /> Hashtags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100 rounded-full px-2.5 py-0.5">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes (read-only for customer) */}
      {post.adminNotes && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
          <span className="text-xs font-bold text-amber-800 block mb-1">Note</span>
          <p className="text-xs text-amber-700 leading-relaxed">{post.adminNotes}</p>
        </div>
      )}

      {/* Actions Footer */}
      <div className="pt-4 border-t border-border flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="font-semibold text-xs">
            Edit Post
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSuggestions(true)}
            className="gap-1.5 bg-gradient-to-r from-primary-600 to-primary-500 border-none shadow-soft text-white hover:from-primary-700 hover:to-primary-600 text-xs font-semibold"
          >
            <Sparkles size={12} />
            <span>AI Suggestions</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-ink-muted font-medium text-xs">
          Close
        </Button>
      </div>
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
  const [kycLoading, setKycLoading] = useState(true)
  const [kycRecord, setKycRecord] = useState(null)
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
      const [all, upcoming, published, kyc] = await Promise.all([
        getCalendarPosts(userId),
        getUpcomingPosts(userId),
        getPublishedPosts(userId),
        getMyKyc()
      ])
      setAllPosts(all)
      setUpcomingPosts(upcoming)
      setPublishedPosts(published)
      setKycRecord(kyc)
    } catch (err) {
      // Show a friendly error message
      const msg = err?.message || 'Failed to load calendar posts. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
      setKycLoading(false)
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

  const kycBlocked = !kycLoading && kycRecord?.status !== 'approved'

  return (
    <div className="relative p-6">
      {kycBlocked && (
        <KycOverlay kycRecord={kycRecord} onRefresh={fetchAll} />
      )}
      
      <div 
        className={kycBlocked ? 'opacity-40 pointer-events-none select-none' : ''}
        aria-hidden={kycBlocked}
      >
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
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Main Calendar Card */}
          <Card className="col-span-12 lg:col-span-9 p-6">
            {/* View switcher + navigation */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              {/* Month / Week / Day buttons */}
              <div className="flex rounded-lg border border-border overflow-hidden bg-canvas p-1 shadow-soft">
                {VIEWS.map(v => (
                  <button
                    key={v}
                    onClick={() => setActiveView(v)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-control transition-all ${
                      activeView === v
                        ? 'bg-surface text-primary shadow-soft'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Navigation arrows + label */}
              <div className="flex items-center gap-2">
                <button onClick={navigatePrev} className="p-1.5 rounded-control border border-border hover:bg-canvas text-ink-muted hover:text-ink transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-ink min-w-[180px] text-center font-headline-lg">{calendarLabel}</span>
                <button onClick={navigateNext} className="p-1.5 rounded-control border border-border hover:bg-canvas text-ink-muted hover:text-ink transition-colors">
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold text-primary hover:underline ml-2">
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
                <CalendarDays className="mx-auto mb-3 opacity-30 text-primary" size={40} />
                <p className="font-bold text-ink">No scheduled posts</p>
                <p className="text-xs mt-1 text-ink-muted">Select an AI draft or create a post to get started.</p>
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

          {/* Sidebar Recommendations Drafts List */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card className="p-4 border border-primary/20 bg-gradient-to-br from-surface to-primary/5 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-primary animate-pulse" />
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">AI Draft Suggestions</h4>
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Click to schedule or drag these AI-crafted templates directly into your calendar.
              </p>
            </Card>

            {[
              { title: 'SaaS Automation Roadmap', platform: 'LinkedIn', category: 'Educational', length: '5 Steps' },
              { title: 'Behind the Scenes: Product Sprint', platform: 'Instagram', category: 'Reel Draft', length: '15s video' },
              { title: 'Why Quality Beats Velocity', platform: 'X / Twitter', category: 'Growth Hook', length: 'Short form' },
              { title: 'Customer Onboarding Checklists', platform: 'LinkedIn', category: 'Case Study', length: 'Text post' }
            ].map((draft, idx) => {
              const meta = getPlatformMeta(draft.platform)
              return (
                <Card
                  key={idx}
                  className="p-4 border border-border bg-surface hover:border-primary-200 transition-all shadow-soft cursor-grab active:cursor-grabbing hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[9px] bg-primary-50 text-primary border border-primary-100/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {draft.category}
                    </span>
                    <span className="text-[10px] text-ink-muted">{draft.length}</span>
                  </div>
                  <h5 className="text-xs font-bold text-ink leading-snug line-clamp-2">{draft.title}</h5>
                  <div className="flex items-center gap-1.5 mt-3 text-[10px] text-ink-muted pt-2 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      {meta.icon}
                      <span className="font-semibold">{draft.platform}</span>
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
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
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdated={(updatedPost) => {
          setAllPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p))
          setUpcomingPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p))
          setPublishedPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p))
          setSelectedPost(updatedPost)
        }}
      />
      </div>
    </div>
  )
}
