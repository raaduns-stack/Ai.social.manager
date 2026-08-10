/**
 * Admin/ContentCalendar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin overview of all customers' content calendars.
 * Fetches real customer list from GET /api/calendar/admin/customers.
 * Lets admin select a customer and view their posts/approval metrics.
 * Navigates to /admin/users/:userId/calendar for the detailed view.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Search,
  BarChart2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import {
  getCalendarCustomers,
  getAdminCalendarPosts,
  getAdminOverview,
} from '../../features/calendar/calendar-api'

// ─── Approval status filter tabs ──────────────────────────────────────────────
const FILTER_TABS = [
  { id: 'ALL',               label: 'All' },
  { id: 'PENDING',           label: 'Pending' },
  { id: 'APPROVED',          label: 'Approved' },
  { id: 'REJECTED',          label: 'Rejected' },
  { id: 'REVISION_REQUIRED', label: 'Revision Required' },
]

// ─── Helper: approval badge ────────────────────────────────────────────────────
function ApprovalBadge({ status }) {
  const map = {
    APPROVED:          { tone: 'success', label: 'Approved',          icon: <CheckCircle2 size={11} /> },
    PENDING:           { tone: 'warning', label: 'Pending',           icon: <Clock size={11} /> },
    REVISION_REQUIRED: { tone: 'warning', label: 'Revision Required', icon: <FileEdit size={11} /> },
    REJECTED:          { tone: 'danger',  label: 'Rejected',          icon: <XCircle size={11} /> },
  }
  const m = map[status] || { tone: 'neutral', label: status, icon: <AlertCircle size={11} /> }
  return (
    <Badge tone={m.tone} className="flex items-center gap-1">
      {m.icon} {m.label}
    </Badge>
  )
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />
}

export default function AdminContentCalendar() {
  const navigate = useNavigate()

  // ── State ──
  const [customers, setCustomers]       = useState([])
  const [selectedId, setSelectedId]     = useState(null)
  const [posts, setPosts]               = useState([])
  const [overview, setOverview]         = useState(null)
  const [filter, setFilter]             = useState('ALL')
  const [search, setSearch]             = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [error, setError]               = useState(null)

  // ── Fetch customer list on mount ────────────────────────────────────────────
  useEffect(() => {
    async function fetchCustomers() {
      setLoadingCustomers(true)
      setError(null)
      try {
        // Fetch list of customers who have calendar posts
        const data = await getCalendarCustomers()
        setCustomers(data)
        // Auto-select first customer if available
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].userId)
        }
      } catch (err) {
        setError(err?.message || 'Failed to load customers.')
      } finally {
        setLoadingCustomers(false)
      }
    }
    fetchCustomers()
  }, [])

  // ── Fetch posts + overview when selected customer or filter changes ──────────
  useEffect(() => {
    if (!selectedId) return
    async function fetchCustomerData() {
      setLoadingPosts(true)
      setError(null)
      try {
        // Fetch posts and approval overview in parallel for the selected customer
        const [postData, overviewData] = await Promise.all([
          getAdminCalendarPosts(selectedId, filter === 'ALL' ? undefined : filter),
          getAdminOverview(selectedId),
        ])
        setPosts(postData)
        setOverview(overviewData)
      } catch (err) {
        setError(err?.message || 'Failed to load customer calendar.')
      } finally {
        setLoadingPosts(false)
      }
    }
    fetchCustomerData()
  }, [selectedId, filter])

  // ── Filter customers list by search input ───────────────────────────────────
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.fullName?.toLowerCase().includes(q) ||
      c.businessName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  }, [customers, search])

  const selectedCustomer = customers.find(c => c.userId === selectedId)

  if (error && customers.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Content Calendar Management" subtitle="Admin overview of all customer calendars" />
        <div className="mt-8 rounded-lg bg-red-50 border border-red-200 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-danger" size={32} />
          <p className="text-sm font-medium text-danger mb-3">{error}</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            <RefreshCw size={14} className="mr-1" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Content Calendar Management"
        subtitle="Review and manage customer content calendars."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* ── Left panel: customer list ── */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Users size={16} className="text-primary-600" /> Customers
                {!loadingCustomers && (
                  <Badge tone="neutral">{customers.length}</Badge>
                )}
              </h3>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search customers…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-canvas rounded-lg bg-canvas focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>

            {/* Customer list */}
            {loadingCustomers ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 rounded-lg border border-canvas">
                    <Skeleton className="h-4 w-2/3 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-8">No customers found.</p>
            ) : (
              <div className="space-y-1 max-h-[480px] overflow-y-auto">
                {filteredCustomers.map(c => (
                  <button
                    key={c.userId}
                    onClick={() => { setSelectedId(c.userId); setFilter('ALL') }}
                    className={`w-full text-left rounded-lg p-3 transition-colors ${
                      selectedId === c.userId
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-canvas border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ink">{c.fullName}</p>
                        {c.businessName && (
                          <p className="text-xs text-ink-muted">{c.businessName}</p>
                        )}
                        {c.email && (
                          <p className="text-xs text-ink-muted truncate">{c.email}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <Badge tone="neutral">{c.postCount} posts</Badge>
                        {c.pendingCount > 0 && (
                          <Badge tone="warning" className="block mt-1">{c.pendingCount} pending</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right panel: selected customer detail ── */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedId ? (
            <Card>
              <div className="text-center py-16 text-ink-muted">
                <Calendar className="mx-auto mb-3 opacity-30" size={40} />
                <p className="font-medium">Select a customer to view their calendar</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Customer header */}
              <Card>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-ink">{selectedCustomer?.fullName}</h3>
                    {selectedCustomer?.businessName && (
                      <p className="text-sm text-ink-muted">{selectedCustomer.businessName}</p>
                    )}
                    {selectedCustomer?.email && (
                      <p className="text-xs text-ink-muted">{selectedCustomer.email}</p>
                    )}
                  </div>
                  {/* Navigate to full per-user calendar view */}
                  <Button
                    size="sm"
                    onClick={() => navigate(`/admin/users/${selectedId}/calendar`)}
                    className="flex items-center gap-1"
                  >
                    Full Calendar <ChevronRight size={14} />
                  </Button>
                </div>

                {/* Approval metrics */}
                {overview && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Total',    value: overview.total,           tone: 'neutral' },
                      { label: 'Approved', value: overview.approved,        tone: 'success' },
                      { label: 'Pending',  value: overview.pending,         tone: 'warning' },
                      { label: 'Revision', value: overview.revisionRequired, tone: 'warning' },
                    ].map(m => (
                      <div key={m.label} className="rounded-lg bg-canvas p-3 text-center">
                        <p className="text-xl font-bold text-ink">{m.value}</p>
                        <p className="text-xs text-ink-muted">{m.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Filter tabs */}
              <div className="flex gap-1 flex-wrap">
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs rounded-full font-medium border transition-colors ${
                      filter === tab.id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-surface text-ink-muted border-canvas hover:border-primary-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Posts list */}
              <Card>
                {loadingPosts ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-3 rounded-lg border border-canvas">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-2/3 mb-1" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 text-ink-muted">
                    <BarChart2 className="mx-auto mb-3 opacity-30" size={32} />
                    <p className="font-medium">No posts found</p>
                    <p className="text-sm mt-1">Try changing the filter above.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map(post => (
                      <div
                        key={post.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg border border-canvas hover:bg-canvas transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{post.title}</p>
                          <p className="text-xs text-ink-muted line-clamp-2 mt-0.5">{post.caption}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge tone="neutral" className="text-[10px]">{post.platform}</Badge>
                            <Badge tone={post.status === 'PUBLISHED' ? 'success' : post.status === 'SCHEDULED' ? 'primary' : 'neutral'} className="text-[10px]">
                              {post.status}
                            </Badge>
                            <ApprovalBadge status={post.approvalStatus} />
                          </div>
                          {post.scheduledAt && (
                            <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(post.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' '}
                              {new Date(post.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        {/* Link to full user calendar */}
                        <button
                          onClick={() => navigate(`/admin/users/${selectedId}/calendar`)}
                          className="shrink-0 p-1.5 rounded hover:bg-primary-50 text-ink-muted hover:text-primary-600 transition-colors"
                          title="Open full calendar"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
