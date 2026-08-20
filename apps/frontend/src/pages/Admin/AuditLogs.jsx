import { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle,
  UserCheck,
  Eye,
  Search,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { getActivityLogs } from '../../features/admin/activity-logs-api'
import ErrorBanner from '../../components/error-banner'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const LIMIT = 20

  const [selectedType, setSelectedType] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadLogs = async (currentPage = 1) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = {
        page: currentPage,
        limit: LIMIT,
      }
      if (selectedType !== 'All') {
        queryParams.module = selectedType
      }
      const res = await getActivityLogs(queryParams)
      setLogs(res.data || [])
      setPage(res.meta?.page || 1)
      setTotalPages(res.meta?.totalPages || 1)
      setTotalLogs(res.meta?.total || 0)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
      setError('Failed to retrieve system audit trail logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs(page)
  }, [selectedType, page])

  // Dynamic filter for log records
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesType = selectedType === 'All' || log.type === selectedType
      const matchesSearch =
        log.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesSearch
    })
  }, [logs, selectedType, searchQuery])

  const handleOpenDetailModal = (log) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <PageHeader
        action={<Badge tone="warning" className="font-bold uppercase tracking-wider text-xs px-3 py-1.5 border border-warning/30 bg-warning/5 text-warning shrink-0">DEV MODE: MOCK DATA (Backend Pending)</Badge>}
            title="Audit Logs"
            description="Track and review all administrative and system-level actions across the platform."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end">
          {/* Local Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search trails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-44 pl-9 pr-3 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider pl-1">
              Log Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-surface border border-border rounded-control px-3 h-9 text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer outline-none min-w-[120px]"
            >
              <option value="All">All Types</option>
              <option value="Login">Login</option>
              <option value="Payment">Payment</option>
              <option value="Publishing">Publishing</option>
              <option value="System">System</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider pl-1">
              Date Range
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                readOnly
                value="Oct 20, 2023 - Oct 27, 2023"
                className="bg-surface border border-border rounded-control pl-9 pr-3 h-9 text-xs font-semibold text-ink min-w-[200px] cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* LOG VIEWER CARD */}
      <Card className="p-0 overflow-hidden shadow-soft">
        {loading ? (
          <div className="px-6 py-20 text-center text-sm text-ink-muted">Loading audit trail...</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Table Header */}
              <div className="grid grid-cols-[140px_1fr_220px] gap-4 px-6 py-3 bg-canvas/60 border-b border-border text-xs font-semibold text-ink-muted uppercase tracking-wider">
                <span>Module</span>
                <span>Description</span>
                <span>Metadata</span>
              </div>

              {/* Log Rows */}
              <div className="divide-y divide-border bg-surface">
                {filteredLogs.length === 0 ? (
                  <div className="px-6 py-10 text-center text-ink-muted text-xs font-medium">
                    No audit trail records match the selected filters.
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    let toneVal = 'neutral'
                    const modLower = (log.module || '').toLowerCase()
                    if (modLower.includes('login') || modLower.includes('auth')) toneVal = 'primary'
                    if (modLower.includes('billing') || modLower.includes('plan')) toneVal = 'success'
                    if (modLower.includes('calendar') || modLower.includes('post')) toneVal = 'accent'

                    return (
                      <div
                        key={log.id}
                        onClick={() => handleOpenDetailModal(log)}
                        className="grid grid-cols-[140px_1fr_220px] gap-4 px-6 py-4 hover:bg-canvas/40 transition-colors cursor-pointer group items-center"
                      >
                        <div>
                          <Badge tone={toneVal}>{log.module}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-semibold truncate text-ink">
                            {log.description}
                          </p>
                        </div>
                        <div className="flex flex-col text-xs text-ink-muted">
                          <span className="font-semibold text-ink">{log.userName || 'System'}</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAGINATION */}
        {totalLogs > 0 && (
          <div className="px-6 py-3 bg-surface border-t border-border flex items-center justify-between text-xs text-ink-muted">
            <span>Showing {Math.min((page - 1) * LIMIT + 1, totalLogs)}–{Math.min(page * LIMIT, totalLogs)} of {totalLogs} entries</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="mx-2 font-semibold">Page {page} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* QUICK STATS BENTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 shadow-soft flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Total Audit Logs (All-Time)
            </span>
            <Activity size={16} className="text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-ink">{loading ? '—' : totalLogs.toLocaleString()}</h3>
          <div className="flex items-center gap-1 text-accent text-xs font-semibold">
            <span>Live audit database synchronization</span>
          </div>
        </Card>

        <Card className="p-5 shadow-soft flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Filter Module
            </span>
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <h3 className="text-2xl font-bold text-ink capitalize">{selectedType}</h3>
          <div className="flex items-center gap-1 text-ink-muted text-xs font-semibold">
            <span>Filtered subset display</span>
          </div>
        </Card>

        <Card className="p-5 shadow-soft flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              System Audit scope
            </span>
            <UserCheck size={16} className="text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-ink">Production</h3>
          <div className="flex items-center gap-1 text-ink-muted text-xs font-semibold">
            <Eye size={12} />
            <span>Real-time tracking active</span>
          </div>
        </Card>
      </div>

      {/* Log Details Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Audit Trail Log Detail"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm text-ink">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-muted uppercase">Module:</span>
                <Badge tone="primary">
                  {selectedLog.module}
                </Badge>
              </div>
              <span className="text-xs text-ink-muted">{new Date(selectedLog.createdAt).toLocaleString()}</span>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Event Detail</p>
              <p className="font-semibold text-ink">
                {selectedLog.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Actor</p>
                <p className="font-semibold text-ink">{selectedLog.userName || 'System'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Action Code</p>
                <p className="font-semibold text-ink font-mono text-xs">{selectedLog.action || '—'}</p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-ink-muted uppercase mb-1.5">Technical Details</p>
              <pre className="text-[11px] font-mono bg-canvas p-3 rounded-control border border-border overflow-x-auto text-ink-muted">
                {JSON.stringify(
                  {
                    logId: selectedLog.id,
                    timestamp: selectedLog.createdAt,
                    userId: selectedLog.userId || null,
                    userRole: selectedLog.userRole || null,
                    systemScope: 'Production Console',
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

