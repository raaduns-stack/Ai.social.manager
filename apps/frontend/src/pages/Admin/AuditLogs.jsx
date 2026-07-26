import { useState, useMemo } from 'react'
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

const INITIAL_LOGS = [
  {
    id: 1,
    type: 'Login',
    detail: 'Admin login successful from IP 192.168.1.1',
    actor: 'Admin: Sarah Connor',
    time: '10 mins ago',
    ip: '192.168.1.1',
    status: 'success',
  },
  {
    id: 2,
    type: 'Payment',
    detail: "Subscription plan 'Enterprise' successfully renewed for customer: Acme Corp",
    actor: 'System',
    time: '2 hours ago',
    status: 'success',
  },
  {
    id: 3,
    type: 'Publishing',
    detail: 'Failed to publish scheduled post to Instagram: API Authentication Error',
    actor: 'System',
    time: '5 hours ago',
    status: 'failed',
  },
  {
    id: 4,
    type: 'System',
    detail: "Prompt template 'Professional LinkedIn' updated by orchestrator",
    actor: 'Admin: Alex Rivera',
    time: 'Yesterday',
    status: 'success',
  },
  {
    id: 5,
    type: 'Login',
    detail: 'Multiple failed login attempts detected for account: admin@socialai.com',
    actor: 'System',
    time: 'Oct 24, 2023',
    status: 'failed',
  },
  {
    id: 6,
    type: 'Publishing',
    detail: "Successfully published 15 posts across all channels for 'Holiday Blitz' campaign",
    actor: 'Admin: Amaka Obi',
    time: 'Oct 23, 2023',
    status: 'success',
  },
]

export default function AuditLogs() {
  const [logs] = useState(INITIAL_LOGS)
  const [selectedType, setSelectedType] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[120px_1fr_220px] gap-4 px-6 py-3 bg-canvas/60 border-b border-border text-xs font-semibold text-ink-muted uppercase tracking-wider">
              <span>Type</span>
              <span>Detail</span>
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
                  if (log.type === 'Login') toneVal = 'primary'
                  if (log.type === 'Payment') toneVal = 'success'
                  if (log.type === 'Publishing') {
                    toneVal = log.status === 'failed' ? 'danger' : 'success'
                  }

                  return (
                    <div
                      key={log.id}
                      onClick={() => handleOpenDetailModal(log)}
                      className="grid grid-cols-[120px_1fr_220px] gap-4 px-6 py-4 hover:bg-canvas/40 transition-colors cursor-pointer group items-center"
                    >
                      <div>
                        <Badge tone={toneVal}>{log.type}</Badge>
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold truncate ${
                            log.status === 'failed' ? 'text-danger' : 'text-ink'
                          }`}
                        >
                          {log.detail}
                        </p>
                      </div>
                      <div className="flex flex-col text-xs text-ink-muted">
                        <span className="font-semibold text-ink">{log.actor}</span>
                        <span>{log.time}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="px-6 py-3 bg-surface border-t border-border flex items-center justify-between text-xs text-ink-muted">
          <span>Showing {filteredLogs.length} of 1,248 entries</span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="p-1 hover:bg-canvas rounded-control transition-colors disabled:opacity-30 border border-border"
            >
              <ChevronLeft size={16} />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded bg-primary text-white font-semibold">
              1
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-canvas border border-transparent hover:border-border font-semibold transition-colors">
              2
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-canvas border border-transparent hover:border-border font-semibold transition-colors">
              3
            </button>
            <span className="mx-1">...</span>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-canvas border border-transparent hover:border-border font-semibold transition-colors">
              42
            </button>
            <button className="p-1 hover:bg-canvas rounded-control transition-colors border border-border">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      {/* QUICK STATS BENTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 shadow-soft flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Total Actions (24h)
            </span>
            <Activity size={16} className="text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-ink">3,204</h3>
          <div className="flex items-center gap-1 text-accent text-xs font-semibold">
            <span>+12.5% from yesterday</span>
          </div>
        </Card>

        <Card className="p-5 shadow-soft flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Failed Events
            </span>
            <AlertTriangle size={16} className="text-danger" />
          </div>
          <h3 className="text-2xl font-bold text-ink">18</h3>
          <div className="flex items-center gap-1 text-danger text-xs font-semibold">
            <span>+2 since last hour</span>
          </div>
        </Card>

        <Card className="p-5 shadow-soft flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Active Admins
            </span>
            <UserCheck size={16} className="text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-ink">12</h3>
          <div className="flex items-center gap-1 text-ink-muted text-xs font-semibold">
            <Eye size={12} />
            <span>Real-time monitoring active</span>
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
                <span className="text-xs font-semibold text-ink-muted uppercase">Type:</span>
                <Badge
                  tone={
                    selectedLog.type === 'Login'
                      ? 'primary'
                      : selectedLog.type === 'Payment'
                      ? 'success'
                      : selectedLog.status === 'failed'
                      ? 'danger'
                      : 'neutral'
                  }
                >
                  {selectedLog.type}
                </Badge>
              </div>
              <span className="text-xs text-ink-muted">{selectedLog.time}</span>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Event Detail</p>
              <p className={`font-semibold ${selectedLog.status === 'failed' ? 'text-danger' : 'text-ink'}`}>
                {selectedLog.detail}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase mb-1">Actor</p>
                <p className="font-semibold text-ink">{selectedLog.actor}</p>
              </div>
              {selectedLog.ip && (
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase mb-1">IP Address</p>
                  <p className="font-semibold text-ink">{selectedLog.ip}</p>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-ink-muted uppercase mb-1.5">Technical Details</p>
              <pre className="text-[11px] font-mono bg-canvas p-3 rounded-control border border-border overflow-x-auto text-ink-muted">
                {JSON.stringify(
                  {
                    logId: selectedLog.id,
                    timestamp: new Date().toISOString(),
                    status: selectedLog.status,
                    systemScope: 'Production Console',
                    node: 'ai-orchestrator-instance-09',
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

