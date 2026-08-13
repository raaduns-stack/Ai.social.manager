import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronRight, ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Input from '../../../components/ui/Input'
import LogTable from '../../../components/staff/LogTable'
import { getLoginHistory } from '../../../features/admin/login-history-api'

// ─── Table column definitions ──────────────────────────────────────────────
const COLUMNS = [
  { key: 'name',     label: 'Name' },
  { key: 'device',   label: 'Device' },
  { key: 'browser',  label: 'Browser' },
  { key: 'ip',       label: 'IP Address' },
  { key: 'location', label: 'Location' },
  { key: 'time',     label: 'Time' },
  { key: 'status',   label: 'Status' },
]

const PAGE_SIZE = 20

// ─── Helpers ──────────────────────────────────────────────────────────────
/**
 * Maps a backend LoginHistoryRecord to the flat shape LogTable expects.
 * - status: 'success' / 'failure' + isSuspicious → 'Successful' / 'Suspicious' / 'Failed'
 * - location: built from country/city
 * - name: userName when available, else fallback to email
 */
function mapRecord(record) {
  let statusLabel = 'Failed'
  if (record.status === 'success') {
    statusLabel = record.isSuspicious ? 'Suspicious' : 'Successful'
  }

  const locationParts = [record.city, record.country].filter(Boolean)
  const location = locationParts.length ? locationParts.join(', ') : '—'

  const name = record.userName || record.userEmail || record.email || '—'

  const time = record.createdAt
    ? new Date(record.createdAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return {
    id: record.id,
    name,
    device: record.device || '—',
    browser: record.browser || '—',
    ip: record.ipAddress || '—',
    location,
    time,
    status: statusLabel,
  }
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function LoginHistory() {
  // ── Filter state ──
  const [searchEmail, setSearchEmail]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')  // '' | 'success' | 'failure'
  const [fromDate, setFromDate]         = useState('')
  const [toDate, setToDate]             = useState('')
  const [ipFilter, setIpFilter]         = useState('')

  // ── Pagination ──
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
      const response = await getLoginHistory({
        ...(searchEmail  ? { email: searchEmail }     : {}),
        ...(statusFilter ? { status: statusFilter }   : {}),
        ...(fromDate     ? { from: fromDate }         : {}),
        ...(toDate       ? { to: toDate }             : {}),
        ...(ipFilter     ? { ipAddress: ipFilter }    : {}),
        page: currentPage,
        limit: PAGE_SIZE,
      })
      setRows(response.data.map(mapRecord))
      setMeta(response.meta)
    } catch (err) {
      setError(err?.message || 'Failed to load login history. Please try again.')
      setRows([])
      setMeta(null)
    } finally {
      setIsLoading(false)
    }
  }, [searchEmail, statusFilter, fromDate, toDate, ipFilter])

  // Fetch whenever filters change (reset to page 1)
  useEffect(() => {
    setPage(1)
    fetchData(1)
  }, [searchEmail, statusFilter, fromDate, toDate, ipFilter, fetchData])

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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1 text-xs text-ink-muted mb-2 font-medium">
          <span className="hover:text-ink cursor-pointer">Admin</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="hover:text-ink cursor-pointer">Staff Dashboard</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="text-primary font-semibold">Login History</span>
        </div>

        <PageHeader
          title="Audit Authentication Logs"
          description="View recent staff dashboard access attempts, authentication channels, and geographic origins."
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

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-end gap-4 bg-surface border border-border p-4 rounded-control shadow-soft">
        {/* Email search */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider pl-1">
            Email
          </label>
          <div className="relative max-w-xs w-60">
            <Input
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Search by email..."
              className="pl-9 text-xs"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider pl-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-border rounded-control px-3 h-9 text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none min-w-[130px]"
          >
            <option value="">All Statuses</option>
            <option value="success">Successful</option>
            <option value="failure">Failed</option>
          </select>
        </div>

        {/* From date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider pl-1">
            From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-surface border border-border rounded-control px-3 h-9 text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-w-[150px] cursor-pointer"
          />
        </div>

        {/* To date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider pl-1">
            To
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-surface border border-border rounded-control px-3 h-9 text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-w-[150px] cursor-pointer"
          />
        </div>

        {/* IP address filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider pl-1">
            IP Address
          </label>
          <Input
            value={ipFilter}
            onChange={(e) => setIpFilter(e.target.value)}
            placeholder="e.g. 192.168.1.1"
            className="text-xs w-40"
          />
        </div>

        {/* Clear filters */}
        {(searchEmail || statusFilter || fromDate || toDate || ipFilter) && (
          <button
            onClick={() => {
              setSearchEmail('')
              setStatusFilter('')
              setFromDate('')
              setToDate('')
              setIpFilter('')
            }}
            className="self-end mb-0.5 text-xs font-semibold text-ink-muted hover:text-danger transition-colors"
          >
            Clear filters
          </button>
        )}
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

      {/* Login History Table */}
      <div className="space-y-3">
        <LogTable
          columns={COLUMNS}
          rows={rows}
          statusKey="status"
          isLoading={isLoading}
          emptyMessage="No login activity matched your search filters."
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
