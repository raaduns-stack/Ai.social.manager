import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Layers,
  Briefcase,
  ArrowUpRight,
  FileText,
  Calendar,
  Banknote,
  Check,
  ChevronDown,
  Activity,
  Award,
  SlidersHorizontal,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { cn } from '../../utils/cn'
import {
  getDesignOverview,
  getDesignPerformanceReport,
  getDesignerPerformanceReport,
  getStaffPerformanceReport,
  getPaymentEarningsReport,
  getOperationalWorkflowReport,
} from '../../features/admin/design-reports-api'

const TIMEFRAMES = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
]

const TABS = [
  { id: 'overview', label: 'Executive Overview', icon: Layers },
  { id: 'design', label: 'Design Performance', icon: BarChart3 },
  { id: 'designer', label: 'Designer Performance', icon: Users },
  { id: 'staff', label: 'Staff Performance', icon: Briefcase },
  { id: 'financials', label: 'Payments & Earnings', icon: Banknote },
  { id: 'operational', label: 'Operational Workflow', icon: Activity },
]

export default function DesignReports() {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeframe, setTimeframe] = useState('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showCustomDates, setShowCustomDates] = useState(false)
  const [selectedDesignerId, setSelectedDesignerId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Report Data States
  const [overviewData, setOverviewData] = useState(null)
  const [designData, setDesignData] = useState(null)
  const [designerData, setDesignerData] = useState(null)
  const [staffData, setStaffData] = useState(null)
  const [financialsData, setFinancialsData] = useState(null)
  const [operationalData, setOperationalData] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const queryParams = useMemo(() => ({
    timeframe: showCustomDates ? undefined : timeframe,
    startDate: showCustomDates && startDate ? startDate : undefined,
    endDate: showCustomDates && endDate ? endDate : undefined,
    designerId: selectedDesignerId || undefined,
  }), [timeframe, showCustomDates, startDate, endDate, selectedDesignerId])

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const [ov, dp, dsg, st, fin, op] = await Promise.all([
        getDesignOverview(queryParams),
        getDesignPerformanceReport(queryParams),
        getDesignerPerformanceReport(queryParams),
        getStaffPerformanceReport(queryParams),
        getPaymentEarningsReport(queryParams),
        getOperationalWorkflowReport(queryParams),
      ])

      setOverviewData(ov)
      setDesignData(dp)
      setDesignerData(dsg)
      setStaffData(st)
      setFinancialsData(fin)
      setOperationalData(op)
    } catch (err) {
      console.error('Failed to load design reports:', err)
      setError(err?.message || 'Failed to load report data from the server.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [queryParams])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const formatNaira = (kobo) => {
    if (kobo === null || kobo === undefined) return '₦0'
    return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const exportCurrentReportCSV = () => {
    let rows = []
    let filename = `design-report-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`

    if (activeTab === 'designer' && designerData?.designers) {
      rows.push(['Designer', 'Email', 'Assignments', 'Submissions', 'Approved', 'Workload', 'Total Earned', 'Paid', 'Outstanding Balance', 'Approval Rate'])
      for (const d of designerData.designers) {
        rows.push([
          `"${d.fullName}"`,
          `"${d.email}"`,
          d.assignmentsCount,
          d.submissionsCount,
          d.completedCount,
          d.currentWorkload,
          (d.totalEarned / 100).toFixed(2),
          (d.paidEarnings / 100).toFixed(2),
          (d.outstandingBalance / 100).toFixed(2),
          `${d.approvalRate}%`,
        ])
      }
    } else if (activeTab === 'staff' && staffData?.staff) {
      rows.push(['Staff Member', 'Email', 'Role', 'Tasks Assigned', 'Reviews Conducted', 'Approvals Given', 'Revisions Requested', 'Total Actions'])
      for (const s of staffData.staff) {
        rows.push([
          `"${s.fullName}"`,
          `"${s.email}"`,
          `"${s.role}"`,
          s.tasksAssignedCount,
          s.reviewsConductedCount,
          s.approvalsGivenCount,
          s.revisionsRequestedCount,
          s.totalActions,
        ])
      }
    } else if (activeTab === 'financials' && financialsData?.recentPayouts) {
      rows.push(['Reference', 'Designer', 'Email', 'Gross Amount', 'Fee', 'Net Amount', 'Status', 'Payout Type', 'Date'])
      for (const p of financialsData.recentPayouts) {
        rows.push([
          `"${p.reference}"`,
          `"${p.designerName || ''}"`,
          `"${p.designerEmail || ''}"`,
          (p.amount / 100).toFixed(2),
          (p.fee / 100).toFixed(2),
          (p.netAmount / 100).toFixed(2),
          `"${p.status}"`,
          `"${p.payoutType}"`,
          `"${new Date(p.createdAt).toLocaleDateString()}"`,
        ])
      }
    } else {
      // General summary export
      rows.push(['Metric', 'Value'])
      if (overviewData?.kpis) {
        rows.push(['Total Submissions', overviewData.kpis.totalSubmissions])
        rows.push(['Approved Designs', overviewData.kpis.approvedDesigns])
        rows.push(['Pending Reviews', overviewData.kpis.pendingReviews])
        rows.push(['Active Workload', overviewData.kpis.activeWorkload])
        rows.push(['Approval Rate', `${overviewData.kpis.approvalRate}%`])
        rows.push(['Total Designers', overviewData.kpis.totalDesigners])
        rows.push(['Total Earned (₦)', (overviewData.kpis.totalEarned / 100).toFixed(2)])
        rows.push(['Total Paid (₦)', (overviewData.kpis.totalPaid / 100).toFixed(2)])
        rows.push(['Outstanding Balance (₦)', (overviewData.kpis.outstandingBalance / 100).toFixed(2)])
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered Designer Leaderboard
  const filteredDesigners = useMemo(() => {
    if (!designerData?.designers) return []
    if (!searchQuery) return designerData.designers
    const q = searchQuery.toLowerCase()
    return designerData.designers.filter(
      (d) =>
        d.fullName?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.accountStatus?.toLowerCase().includes(q)
    )
  }, [designerData, searchQuery])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Design Reports & Analytics"
        description="Real-time operational metrics, graphic designer performance, staff throughput, and financial audits directly from live database activity."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReports(true)}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={exportCurrentReportCSV}
              className="flex items-center gap-1.5"
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filter Control Toolbar */}
      <Card className="p-4 bg-surface border-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Timeframe Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {!showCustomDates && TIMEFRAMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeframe(t.value)}
                className={cn(
                  "px-3 py-1.5 rounded-control text-xs font-semibold transition-all cursor-pointer",
                  timeframe === t.value
                    ? "bg-primary text-white shadow-sm font-bold"
                    : "bg-canvas text-ink-muted hover:text-ink hover:bg-canvas/80 border border-border"
                )}
              >
                {t.label}
              </button>
            ))}

            <button
              onClick={() => setShowCustomDates(!showCustomDates)}
              className={cn(
                "px-3 py-1.5 rounded-control text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-border",
                showCustomDates
                  ? "bg-primary text-white font-bold"
                  : "bg-canvas text-ink-muted hover:text-ink"
              )}
            >
              <Calendar size={13} />
              {showCustomDates ? "Preset Ranges" : "Custom Dates"}
            </button>
          </div>

          {/* Designer Filter Dropdown */}
          <div className="flex items-center gap-3">
            {showCustomDates && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 px-2 text-xs rounded border border-border bg-canvas text-ink"
                  title="Start Date"
                />
                <span className="text-xs text-ink-muted">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 px-2 text-xs rounded border border-border bg-canvas text-ink"
                  title="End Date"
                />
              </div>
            )}

            {designerData?.designers && designerData.designers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-ink-muted" />
                <select
                  value={selectedDesignerId}
                  onChange={(e) => setSelectedDesignerId(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-control border border-border bg-canvas text-ink font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Designers ({designerData.designers.length})</option>
                  {designerData.designers.map((d) => (
                    <option key={d.designerId} value={d.designerId}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer",
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-border"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {error && (
        <Card className="p-4 bg-danger/10 border-danger/30 text-danger text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </Card>
      )}

      {/* TAB CONTENT 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && overviewData && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-border hover:shadow-soft transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Total Submissions</p>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <BarChart3 size={18} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink mt-2">
                {overviewData.kpis.totalSubmissions}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-ink-muted">
                <span className="font-semibold text-success">{overviewData.kpis.approvedDesigns} Approved</span>
                <span>·</span>
                <span className="text-warning">{overviewData.kpis.pendingReviews} In Review</span>
              </div>
            </Card>

            <Card className="p-5 border-border hover:shadow-soft transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Approval Rate</p>
                <div className="p-2 rounded-lg bg-success/10 text-success">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink mt-2">
                {overviewData.kpis.approvalRate}%
              </h3>
              <p className="text-xs text-ink-muted mt-2">
                Based on approved vs submitted work
              </p>
            </Card>

            <Card className="p-5 border-border hover:shadow-soft transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Total Designer Earnings</p>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Banknote size={18} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink mt-2">
                {formatNaira(overviewData.kpis.totalEarned)}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-ink-muted">
                <span className="text-success font-medium">{formatNaira(overviewData.kpis.totalPaid)} Paid</span>
              </div>
            </Card>

            <Card className="p-5 border-border hover:shadow-soft transition-all">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Outstanding Balance</p>
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <Clock size={18} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink mt-2">
                {formatNaira(overviewData.kpis.outstandingBalance)}
              </h3>
              <p className="text-xs text-ink-muted mt-2">
                Approved work awaiting payout
              </p>
            </Card>
          </div>

          {/* Workflow Pipeline Funnel */}
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold text-ink">Design Workflow Pipeline</h4>
                <p className="text-xs text-ink-muted">Real-time distribution of design tasks through lifecycle stages.</p>
              </div>
              <Badge variant="primary">
                {overviewData.funnel.reduce((s, f) => s + f.count, 0)} Total Work Items
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {overviewData.funnel.map((stage, idx) => (
                <div
                  key={stage.stage}
                  className="p-4 rounded-card border border-border bg-canvas/40 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-muted">Step {idx + 1}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-bold text-ink">{stage.count}</div>
                    <div className="text-xs font-medium text-ink mt-0.5">{stage.stage}</div>
                  </div>
                  <p className="text-[11px] text-ink-muted">{stage.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Two-column: Top Categories & Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card className="p-6 border-border">
              <h4 className="text-base font-semibold text-ink mb-1">Top Design Categories</h4>
              <p className="text-xs text-ink-muted mb-4">Volume and approval rates by graphic design category.</p>
              <div className="space-y-4">
                {overviewData.categories.length === 0 ? (
                  <p className="text-xs text-ink-muted py-4">No categories recorded yet.</p>
                ) : (
                  overviewData.categories.map((c) => (
                    <div key={c.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">{c.category}</span>
                        <span className="text-ink-muted font-mono">{c.total} designs ({c.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-canvas border border-border overflow-hidden flex">
                        <div
                          className="h-full bg-success transition-all"
                          style={{ width: `${c.total > 0 ? (c.approved / c.total) * 100 : 0}%` }}
                          title={`${c.approved} Approved`}
                        />
                        <div
                          className="h-full bg-warning transition-all"
                          style={{ width: `${c.total > 0 ? (c.pending / c.total) * 100 : 0}%` }}
                          title={`${c.pending} Pending`}
                        />
                        <div
                          className="h-full bg-danger transition-all"
                          style={{ width: `${c.total > 0 ? (c.revisions / c.total) * 100 : 0}%` }}
                          title={`${c.revisions} Revisions`}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Top Designer Leaderboard */}
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-semibold text-ink">Designer Leaderboard</h4>
                  <p className="text-xs text-ink-muted">Highest output graphic designers.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('designer')}
                  className="text-xs"
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {overviewData.topDesigners.length === 0 ? (
                  <p className="text-xs text-ink-muted py-4">No designer activity found.</p>
                ) : (
                  overviewData.topDesigners.map((d, index) => (
                    <div
                      key={d.designerId}
                      className="p-3 rounded-control border border-border bg-canvas/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-ink">{d.fullName}</div>
                          <div className="text-[11px] text-ink-muted">{d.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-ink">{d.completedCount} approved</div>
                        <div className="text-[11px] text-success font-medium">{formatNaira(d.totalEarned)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DESIGN PERFORMANCE REPORTS */}
      {activeTab === 'design' && designData && (
        <div className="space-y-6">
          {/* Status Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-4 border-border">
              <span className="text-[11px] font-semibold text-ink-muted uppercase">Total Submissions</span>
              <div className="text-2xl font-bold text-ink mt-1">{designData.summary.totalSubmissions}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-[11px] font-semibold text-success uppercase">Approved / Done</span>
              <div className="text-2xl font-bold text-success mt-1">{designData.summary.totalApproved}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-[11px] font-semibold text-warning uppercase">Pending Review</span>
              <div className="text-2xl font-bold text-warning mt-1">{designData.summary.pendingReviews}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-[11px] font-semibold text-danger uppercase">Revisions</span>
              <div className="text-2xl font-bold text-danger mt-1">{designData.summary.revisions}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-[11px] font-semibold text-ink-muted uppercase">Drafts</span>
              <div className="text-2xl font-bold text-ink mt-1">{designData.summary.drafts}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-[11px] font-semibold text-primary uppercase">Approval Rate</span>
              <div className="text-2xl font-bold text-primary mt-1">{designData.summary.approvalRate}%</div>
            </Card>
          </div>

          {/* Categories Detailed Table */}
          <Card className="p-0 overflow-hidden border-border">
            <div className="p-5 border-b border-border bg-canvas/30">
              <h4 className="text-base font-semibold text-ink">Design Categories Breakdown</h4>
              <p className="text-xs text-ink-muted">Aggregated performance across graphic design request categories.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas text-ink-muted border-b border-border uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Total Submissions</th>
                    <th className="px-4 py-3">Approved</th>
                    <th className="px-4 py-3">In Review</th>
                    <th className="px-4 py-3">Revisions</th>
                    <th className="px-4 py-3">Share</th>
                    <th className="px-4 py-3">Approval Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {designData.categories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                        No submissions recorded for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    designData.categories.map((c) => {
                      const appRate = c.total > 0 ? Math.round((c.approved / c.total) * 100) : 0
                      return (
                        <tr key={c.category} className="hover:bg-canvas/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-ink">{c.category}</td>
                          <td className="px-4 py-3 font-bold text-ink">{c.total}</td>
                          <td className="px-4 py-3 text-success font-medium">{c.approved}</td>
                          <td className="px-4 py-3 text-warning font-medium">{c.pending}</td>
                          <td className="px-4 py-3 text-danger font-medium">{c.revisions}</td>
                          <td className="px-4 py-3 text-ink-muted">{c.percentage}%</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[11px] font-bold",
                              appRate >= 80 ? "bg-success/10 text-success" :
                              appRate >= 50 ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"
                            )}>
                              {appRate}%
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Submission Velocity Timeline */}
          {designData.timeline.length > 0 && (
            <Card className="p-6 border-border">
              <h4 className="text-base font-semibold text-ink mb-1">Activity Timeline</h4>
              <p className="text-xs text-ink-muted mb-4">Daily submission and approval volume.</p>
              <div className="space-y-2">
                {designData.timeline.slice(-10).map((pt) => (
                  <div key={pt.date} className="flex items-center gap-3 text-xs">
                    <span className="w-24 font-mono text-ink-muted">{pt.date}</span>
                    <div className="flex-1 flex items-center gap-1 h-3 bg-canvas rounded overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, pt.submitted * 15)}%` }} title={`${pt.submitted} Submitted`} />
                      <div className="h-full bg-success" style={{ width: `${Math.min(100, pt.approved * 15)}%` }} title={`${pt.approved} Approved`} />
                    </div>
                    <span className="font-semibold text-ink">{pt.submitted} submitted / {pt.approved} approved</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: DESIGNER PERFORMANCE REPORTS */}
      {activeTab === 'designer' && designerData && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-ink-muted uppercase">Active Designers</span>
              <div className="text-2xl font-bold text-ink mt-1">{designerData.totals.totalDesigners}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-ink-muted uppercase">Total Assigned Tasks</span>
              <div className="text-2xl font-bold text-ink mt-1">{designerData.totals.totalAssigned}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-success uppercase">Completed & Approved</span>
              <div className="text-2xl font-bold text-success mt-1">{designerData.totals.totalCompleted}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-primary uppercase">Total Earned By Designers</span>
              <div className="text-2xl font-bold text-primary mt-1">{formatNaira(designerData.totals.totalEarned)}</div>
            </Card>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search designer by name or email..."
                className="w-full h-9 pl-9 pr-3 rounded-control border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <span className="text-xs text-ink-muted font-mono">
              Showing {filteredDesigners.length} of {designerData.totals.totalDesigners} designers
            </span>
          </div>

          {/* Designer Performance Table */}
          <Card className="p-0 overflow-hidden border-border shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas text-ink-muted border-b border-border uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Designer</th>
                    <th className="px-4 py-3">Assigned Tasks</th>
                    <th className="px-4 py-3">Submissions</th>
                    <th className="px-4 py-3">Approved Work</th>
                    <th className="px-4 py-3">Active Workload</th>
                    <th className="px-4 py-3">Approval Rate</th>
                    <th className="px-4 py-3">Total Earned</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDesigners.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-ink-muted">
                        No designers match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDesigners.map((d) => (
                      <tr key={d.designerId} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{d.fullName}</div>
                          <div className="text-[11px] text-ink-muted">{d.email}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-ink">{d.assignmentsCount}</td>
                        <td className="px-4 py-3 font-medium text-ink">{d.submissionsCount}</td>
                        <td className="px-4 py-3 text-success font-bold">{d.completedCount}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-semibold",
                            d.currentWorkload > 3 ? "bg-warning/15 text-warning" : "bg-canvas text-ink-muted"
                          )}>
                            {d.currentWorkload} active
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-bold",
                            d.approvalRate >= 80 ? "bg-success/10 text-success" :
                            d.approvalRate >= 50 ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"
                          )}>
                            {d.approvalRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-ink">{formatNaira(d.totalEarned)}</td>
                        <td className="px-4 py-3 text-success font-medium">{formatNaira(d.paidEarnings)}</td>
                        <td className="px-4 py-3 font-bold text-warning">{formatNaira(d.outstandingBalance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 4: STAFF PERFORMANCE REPORTS */}
      {activeTab === 'staff' && staffData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-ink-muted uppercase">Staff Engaged</span>
              <div className="text-2xl font-bold text-ink mt-1">{staffData.totals.totalStaff}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-ink-muted uppercase">Tasks Assigned</span>
              <div className="text-2xl font-bold text-ink mt-1">{staffData.totals.totalTasksAssigned}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-success uppercase">Approvals Granted</span>
              <div className="text-2xl font-bold text-success mt-1">{staffData.totals.totalApprovals}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-danger uppercase">Revisions Requested</span>
              <div className="text-2xl font-bold text-danger mt-1">{staffData.totals.totalRevisions}</div>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden border-border shadow-soft">
            <div className="p-5 border-b border-border bg-canvas/30">
              <h4 className="text-base font-semibold text-ink">Staff Design Activity Matrix</h4>
              <p className="text-xs text-ink-muted">Tracking staff actions across task assignments, review iterations, and approvals.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas text-ink-muted border-b border-border uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Tasks Assigned</th>
                    <th className="px-4 py-3">Reviews Conducted</th>
                    <th className="px-4 py-3">Approvals Given</th>
                    <th className="px-4 py-3">Revisions Requested</th>
                    <th className="px-4 py-3">Total Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffData.staff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                        No staff activity logged in this period.
                      </td>
                    </tr>
                  ) : (
                    staffData.staff.map((s) => (
                      <tr key={s.staffId} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-ink">
                          <div>{s.fullName}</div>
                          <div className="text-[11px] text-ink-muted">{s.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[11px] uppercase">
                            {s.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-ink">{s.tasksAssignedCount}</td>
                        <td className="px-4 py-3 font-medium text-ink">{s.reviewsConductedCount}</td>
                        <td className="px-4 py-3 text-success font-bold">{s.approvalsGivenCount}</td>
                        <td className="px-4 py-3 text-danger font-medium">{s.revisionsRequestedCount}</td>
                        <td className="px-4 py-3 font-bold text-primary">{s.totalActions}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: PAYMENTS & EARNINGS REPORTS */}
      {activeTab === 'financials' && financialsData && (
        <div className="space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-border">
              <span className="text-xs font-semibold text-ink-muted uppercase">Total Designer Earnings</span>
              <h3 className="text-2xl font-bold text-ink mt-2">
                {formatNaira(financialsData.financials.totalDesignerEarnings)}
              </h3>
              <p className="text-xs text-ink-muted mt-1">Total approved design compensation</p>
            </Card>

            <Card className="p-5 border-border">
              <span className="text-xs font-semibold text-success uppercase">Processed Payouts</span>
              <h3 className="text-2xl font-bold text-success mt-2">
                {formatNaira(financialsData.financials.processedPayments)}
              </h3>
              <p className="text-xs text-ink-muted mt-1">Successfully settled to bank accounts</p>
            </Card>

            <Card className="p-5 border-border">
              <span className="text-xs font-semibold text-warning uppercase">Pending Payouts</span>
              <h3 className="text-2xl font-bold text-warning mt-2">
                {formatNaira(financialsData.financials.pendingPayments)}
              </h3>
              <p className="text-xs text-ink-muted mt-1">Queued or currently processing</p>
            </Card>

            <Card className="p-5 border-border">
              <span className="text-xs font-semibold text-primary uppercase">Outstanding Balance</span>
              <h3 className="text-2xl font-bold text-primary mt-2">
                {formatNaira(financialsData.financials.outstandingPayments)}
              </h3>
              <p className="text-xs text-ink-muted mt-1">Earned balance not yet requested</p>
            </Card>
          </div>

          {/* Status Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(financialsData.statusDistribution).map(([statusKey, stat]) => (
              <div key={statusKey} className="p-3.5 rounded-card border border-border bg-surface">
                <span className="text-[11px] font-bold text-ink-muted uppercase">{statusKey}</span>
                <div className="text-lg font-bold text-ink mt-1">{stat.count}</div>
                <div className="text-xs text-primary font-medium">{formatNaira(stat.amount)}</div>
              </div>
            ))}
          </div>

          {/* Recent Payout Records Table */}
          <Card className="p-0 overflow-hidden border-border shadow-soft">
            <div className="p-5 border-b border-border bg-canvas/30 flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-ink">Recent Payout Records</h4>
                <p className="text-xs text-ink-muted">Transaction audit trail including reference codes, fee deductions, and bank destinations.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas text-ink-muted border-b border-border uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Designer</th>
                    <th className="px-4 py-3">Gross Amount</th>
                    <th className="px-4 py-3">Fee (2%)</th>
                    <th className="px-4 py-3">Net Payout</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {financialsData.recentPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                        No payout records logged yet.
                      </td>
                    </tr>
                  ) : (
                    financialsData.recentPayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-ink">{p.reference}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{p.designerName || 'Designer'}</div>
                          <div className="text-[11px] text-ink-muted">{p.designerEmail}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">{formatNaira(p.amount)}</td>
                        <td className="px-4 py-3 text-danger font-medium">{p.fee > 0 ? formatNaira(p.fee) : '0%'}</td>
                        <td className="px-4 py-3 font-bold text-success">{formatNaira(p.netAmount)}</td>
                        <td className="px-4 py-3 text-ink-muted">
                          {p.bankName ? `${p.bankName} (${p.accountNumber?.slice(-4) || '****'})` : 'Bank Transfer'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-semibold uppercase",
                            p.status === 'successful' || p.status === 'paid' ? "bg-success/15 text-success" :
                            p.status === 'pending' ? "bg-warning/15 text-warning" :
                            p.status === 'declined' || p.status === 'failed' ? "bg-danger/15 text-danger" :
                            "bg-primary/15 text-primary"
                          )}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted font-mono">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 6: OPERATIONAL WORKFLOW REPORTS */}
      {activeTab === 'operational' && operationalData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-ink-muted uppercase">Total Work Items</span>
              <div className="text-2xl font-bold text-ink mt-1">
                {operationalData.metrics.totalTasks + operationalData.metrics.totalSubmissions}
              </div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-warning uppercase">Review Queue Backlog</span>
              <div className="text-2xl font-bold text-warning mt-1">{operationalData.metrics.awaitingReview}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-danger uppercase">Iterations / Revisions</span>
              <div className="text-2xl font-bold text-danger mt-1">{operationalData.metrics.inRevision}</div>
            </Card>
            <Card className="p-4 border-border">
              <span className="text-xs font-semibold text-success uppercase">Throughput Rate</span>
              <div className="text-2xl font-bold text-success mt-1">{operationalData.metrics.throughputRate}%</div>
            </Card>
          </div>

          <Card className="p-6 border-border">
            <h4 className="text-base font-semibold text-ink mb-1">Operational Funnel Progression</h4>
            <p className="text-xs text-ink-muted mb-6">Tracking item counts through each sequential operational phase.</p>

            <div className="space-y-4 max-w-2xl">
              {operationalData.funnel.map((stage) => {
                const total = operationalData.metrics.totalTasks + operationalData.metrics.totalSubmissions
                const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0
                return (
                  <div key={stage.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                        {stage.stage}
                      </span>
                      <span className="font-mono text-ink-muted">
                        {stage.count} items ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-canvas border border-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
