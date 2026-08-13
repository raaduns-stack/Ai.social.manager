import { useState, useEffect, useCallback } from 'react'
import { Filter, ChevronRight, ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import LogTable from '../../../components/staff/LogTable'
import { getActivityLogs } from '../../../features/admin/activity-logs-api'

const COLUMNS = [
  { key: 'timestamp',   label: 'Timestamp' },
  { key: 'user',        label: 'User' },
  { key: 'action',      label: 'Action' },
  { key: 'module',      label: 'Module' },
  { key: 'description', label: 'Description' },
]

const PAGE_SIZE = 20

// ─── Helpers ──────────────────────────────────────────────────────────────
/**
 * Maps a backend ActivityLogRecord to the flat shape LogTable expects.
 * - createdAt → timestamp
 * - userName → user
 * - action → action
 * - module → module
 * - description → description
 */
function mapRecord(record) {
  const timestamp = record.createdAt
    ? new Date(record.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '—'

  return {
    id: record.id,
    timestamp,
    user: record.userName || '—',
    action: record.action || '—',
    module: record.module || '—',
    description: record.description || '—',
  }
}

export default function ActivityLogs() {
  const [selectedModule, setSelectedModule] = useState('All')
  const [page, setPage] = useState(1)

  // ── Data / UI state ──
  const [rows, setRows]           = useState([])
  const [meta, setMeta]           = useState(null)   // { page, limit, total, totalPages }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState(null)

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (currentPage) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getActivityLogs({
        ...(selectedModule !== 'All' ? { module: selectedModule } : {}),
        page: currentPage,
        limit: PAGE_SIZE,
      })
      setRows(response.data.map(mapRecord))
      setMeta(response.meta)
    } catch (err) {
      setError(err?.message || 'Failed to load activity logs. Please try again.')
      setRows([])
      setMeta(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedModule])

  // Fetch whenever filters change (reset to page 1)
  useEffect(() => {
    setPage(1)
    fetchData(1)
  }, [selectedModule, fetchData])

  // Fetch when page changes (but NOT when filters change — handled above)
  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchData(newPage)
  }

  // Manual refresh
  const handleRefresh = () => fetchData(page)

  // ── Pagination helpers ─────────────────────────────────────────────────
  const totalPages  = meta?.totalPages ?? 1
  const totalItems  = meta?.total ?? 0
  const currentPage = meta?.page ?? page

  /** Build a compact page window: [1, …, p-1, p, p+1, …, last] */
  const buildPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1].filter(p => p >= 1 && p <= totalPages))
    return [...pages].sort((a, b) => a - b)
  }

  const pageNumbers = buildPageNumbers()

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1 text-xs text-ink-muted mb-2 font-medium">
          <span className="hover:text-ink cursor-pointer">Admin</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="hover:text-ink cursor-pointer">Staff Dashboard</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="text-primary font-semibold">Activity Logs</span>
        </div>

        <PageHeader
          title="System Activity Audit Trails"
          description="Track administrative operations, platform changes, and content moderation activities."
          action={
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh"
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink border border-border rounded-control px-3 py-1.5 bg-surface hover:bg-canvas transition-colors disabled:opacity-40"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          }
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-surface border border-border p-4 rounded-control shadow-soft">
        <Filter size={16} className="text-ink-muted shrink-0" />
        <span className="text-xs font-bold text-ink-muted uppercase select-none mr-2">Filter by module</span>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="h-9 rounded-control border border-border bg-surface px-3 text-xs text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer w-48"
        >
          <option value="All">All Modules</option>
          <option value="Auth">Auth</option>
          <option value="Users">Users</option>
          <option value="Billing">Billing</option>
          <option value="AI Management">AI Management</option>
          <option value="Staff">Staff</option>
          <option value="Calendar">Calendar</option>
          <option value="System">System</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 border border-danger/30 bg-danger/5 text-danger rounded-control px-4 py-3 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Activity Table */}
      <div className="space-y-3">
        <LogTable
          columns={COLUMNS}
          rows={rows}
          isLoading={isLoading}
          emptyMessage="No operations log history found matching selected module."
        />
      </div>

      {/* Pagination */}
      {!isLoading && !error && meta && totalPages > 0 && (
        <div className="flex items-center justify-between text-xs text-ink-muted bg-surface border border-border rounded-control px-4 py-3">
          <span>
            Showing{' '}
            <span className="font-semibold text-ink">
              {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, totalItems)}
            </span>{' '}
            of <span className="font-semibold text-ink">{totalItems.toLocaleString()}</span> entries
          </span>

          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1 hover:bg-canvas rounded-control transition-colors disabled:opacity-30 border border-border"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((p, idx) => {
              const prevP = pageNumbers[idx - 1]
              const showEllipsis = idx > 0 && p - prevP > 1
              return (
                <span key={p} className="flex items-center gap-1">
                  {showEllipsis && (
                    <span className="px-1 text-ink-muted">…</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={`w-7 h-7 flex items-center justify-center rounded font-semibold transition-colors ${
                      p === currentPage
                        ? 'bg-primary text-white'
                        : 'hover:bg-canvas border border-transparent hover:border-border'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              )
            })}

            {/* Next */}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1 hover:bg-canvas rounded-control transition-colors disabled:opacity-30 border border-border"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
