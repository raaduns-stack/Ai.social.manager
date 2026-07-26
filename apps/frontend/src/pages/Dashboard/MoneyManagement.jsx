import { useState } from 'react'
import {
  DollarSign,
  Clock,
  Calendar,
  Landmark,
  TrendingUp,
  TrendingDown,
  Upload,
  Download,
  Filter,
  Info,
  Sparkles,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Eye,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'

// ---------------------------------------------------------------------------
// Data & Constants
// ---------------------------------------------------------------------------

const REVENUE_STATS = [
  {
    id: 'total',
    label: 'Total Revenue',
    amount: '₦12,450,000',
    change: '+12.5%',
    changeSub: 'vs last month',
    isPositive: true,
    icon: DollarSign,
    badgeBg: 'bg-primary-50 text-primary-700',
  },
  {
    id: 'today',
    label: "Today's Revenue",
    amount: '₦420,500',
    change: '+4.2%',
    changeSub: 'from yesterday',
    isPositive: true,
    icon: Clock,
    badgeBg: 'bg-accent-50 text-accent-600',
  },
  {
    id: 'monthly',
    label: 'Monthly Revenue',
    amount: '₦2,100,000',
    change: '-2.1%',
    changeSub: 'from Sept',
    isPositive: false,
    icon: Calendar,
    badgeBg: 'bg-amber-50 text-warning',
  },
  {
    id: 'annual',
    label: 'Annual Revenue',
    amount: '₦14,800,000',
    change: '+28.4%',
    changeSub: 'vs 2022',
    isPositive: true,
    icon: Landmark,
    badgeBg: 'bg-canvas text-ink-muted',
  },
]

const CHART_DATA = {
  Daily: [
    { label: 'Mon', value: '₦4.2M', height: '40%' },
    { label: 'Tue', value: '₦5.8M', height: '55%' },
    { label: 'Wed', value: '₦4.9M', height: '45%' },
    { label: 'Thu', value: '₦7.2M', height: '70%' },
    { label: 'Fri', value: '₦6.1M', height: '60%' },
    { label: 'Sat', value: '₦9.1M', height: '85%', active: true },
    { label: 'Sun', value: '₦7.8M', height: '75%' },
  ],
  Weekly: [
    { label: 'W1', value: '₦18.5M', height: '50%' },
    { label: 'W2', value: '₦22.1M', height: '65%' },
    { label: 'W3', value: '₦28.4M', height: '80%', active: true },
    { label: 'W4', value: '₦24.0M', height: '70%' },
  ],
  Monthly: [
    { label: 'Jan', value: '₦4.5M', height: '40%' },
    { label: 'Feb', value: '₦5.2M', height: '50%' },
    { label: 'Mar', value: '₦6.8M', height: '65%' },
    { label: 'Apr', value: '₦6.1M', height: '60%' },
    { label: 'May', value: '₦7.5M', height: '75%' },
    { label: 'Jun', value: '₦8.8M', height: '88%', active: true },
  ],
  Yearly: [
    { label: '2021', value: '₦3.2M', height: '45%' },
    { label: '2022', value: '₦4.8M', height: '65%' },
    { label: '2023', value: '₦14.8M', height: '90%', active: true },
  ],
}

const PAYMENT_ANALYTICS = [
  {
    id: 'successful',
    label: 'Successful',
    count: '1,240',
    amount: '₦8,940,000',
    change: '8%',
    isPositive: true,
    borderClass: 'border-l-accent',
    tone: 'success',
  },
  {
    id: 'pending',
    label: 'Pending',
    count: '84',
    amount: '₦1,250,000',
    change: '14%',
    isPositive: true,
    borderClass: 'border-l-warning',
    tone: 'warning',
  },
  {
    id: 'failed',
    label: 'Failed',
    count: '12',
    amount: '₦120,500',
    change: '2%',
    isPositive: false,
    borderClass: 'border-l-danger',
    tone: 'danger',
  },
  {
    id: 'refunded',
    label: 'Refunded',
    count: '4',
    amount: '₦45,000',
    change: '0%',
    isPositive: null,
    borderClass: 'border-l-primary',
    tone: 'neutral',
  },
]

const SUBSCRIPTION_BREAKDOWN = [
  { label: 'New Subs', amount: '₦4.2M', share: '32% Share', color: 'bg-primary' },
  { label: 'Renewals', amount: '₦6.8M', share: '55% Share', color: 'bg-accent' },
  { label: 'Upgrades', amount: '₦1.2M', share: '10% Share', color: 'bg-warning' },
]

const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-829104',
    customer: 'Adeola Oluchi',
    initials: 'AO',
    plan: 'Enterprise',
    amount: '₦250,000',
    method: 'Paystack',
    status: 'SUCCESS',
    date: 'Oct 24, 2023',
    email: 'adeola@company.com',
  },
  {
    id: 'TRX-829105',
    customer: 'Kelechi Musa',
    initials: 'KM',
    plan: 'Pro Plan',
    amount: '₦45,000',
    method: 'Flutterwave',
    status: 'PENDING',
    date: 'Oct 24, 2023',
    email: 'kelechi@musa.io',
  },
  {
    id: 'TRX-829106',
    customer: 'Tunde Ajayi',
    initials: 'TA',
    plan: 'Basic',
    amount: '₦12,500',
    method: 'Card',
    status: 'FAILED',
    date: 'Oct 23, 2023',
    email: 'tunde@ajayi.co',
  },
  {
    id: 'TRX-829107',
    customer: 'Chioma Nnamdi',
    initials: 'CN',
    plan: 'Pro Plan',
    amount: '₦45,000',
    method: 'Paystack',
    status: 'SUCCESS',
    date: 'Oct 22, 2023',
    email: 'chioma@tech.ng',
  },
  {
    id: 'TRX-829108',
    customer: 'Emeka Okafor',
    initials: 'EO',
    plan: 'Enterprise',
    amount: '₦250,000',
    method: 'Bank Transfer',
    status: 'SUCCESS',
    date: 'Oct 21, 2023',
    email: 'emeka@corp.com',
  },
]

const FINANCIAL_REPORTS = [
  {
    id: 'report-1',
    name: 'Q3 Revenue Statement.pdf',
    meta: 'Generated Oct 12, 2023 • 2.4 MB',
    type: 'pdf',
    icon: FileText,
    iconColor: 'text-primary bg-primary-50',
  },
  {
    id: 'report-2',
    name: 'Annual Tax Summary.xlsx',
    meta: 'Generated Jan 05, 2023 • 1.1 MB',
    type: 'excel',
    icon: FileSpreadsheet,
    iconColor: 'text-accent-600 bg-accent-50',
  },
  {
    id: 'report-3',
    name: 'Subscription Audit.pdf',
    meta: 'Generated Sept 30, 2023 • 4.8 MB',
    type: 'doc',
    icon: FileText,
    iconColor: 'text-warning bg-amber-50',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MoneyManagement() {
  const [timeframe, setTimeframe] = useState('Daily')
  const [statusFilter, setStatusFilter] = useState('All')
  const [methodFilter, setMethodFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [reportType, setReportType] = useState('Quarterly Report')
  const [isGenerating, setIsGenerating] = useState(false)

  // Filter transactions
  const filteredTransactions = INITIAL_TRANSACTIONS.filter((trx) => {
    const matchesStatus =
      statusFilter === 'All' || trx.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesMethod =
      methodFilter === 'All' || trx.method.toLowerCase() === methodFilter.toLowerCase()
    const matchesSearch =
      searchQuery === '' ||
      trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.plan.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesMethod && matchesSearch
  })

  const handleGenerateReport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 1500)
  }

  const getStatusBadgeTone = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'FAILED':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Controls */}
      <PageHeader
        title="Money Management"
        description="Monitor platform revenue, payments, subscription earnings, transactions, and financial reports."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-control shadow-soft text-sm text-ink-muted">
              <Calendar size={16} />
              <span className="font-medium text-ink">Oct 1 - Oct 31, 2023</span>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" title="Export Report">
              <Upload size={16} />
              <span className="hidden sm:inline">Export Report</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" title="Download CSV">
              <Download size={16} />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        }
      />

      {/* Section 1: Revenue Overview */}
      <section className="space-y-6">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REVENUE_STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.id} hover className="p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div
                    className={`p-2 rounded-control flex items-center justify-center ${stat.badgeBg}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-ink">{stat.amount}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    {stat.isPositive ? (
                      <TrendingUp size={14} className="text-accent-600" />
                    ) : (
                      <TrendingDown size={14} className="text-danger" />
                    )}
                    <span
                      className={`font-semibold ${
                        stat.isPositive ? 'text-accent-600' : 'text-danger'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-ink-muted">{stat.changeSub}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Main Revenue Performance Chart Area */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-ink">Revenue Performance</h2>
            <div className="flex bg-canvas p-1 rounded-control border border-border">
              {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-control text-xs font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-surface text-ink shadow-soft font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full relative pt-6">
            <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {CHART_DATA[timeframe].map((item, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <div
                    style={{ height: item.height }}
                    className={`w-full rounded-t-control transition-all relative ${
                      item.active
                        ? 'bg-primary shadow-soft'
                        : 'bg-primary-50 hover:bg-primary-100'
                    }`}
                  >
                    <div className="absolute bottom-full mb-1 inset-x-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-primary bg-surface border border-border rounded px-1 py-0.5 shadow-soft z-10 whitespace-nowrap">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-border" />
          </div>

          <div className="flex justify-between mt-4 px-2 text-xs font-medium text-ink-muted">
            {CHART_DATA[timeframe].map((item, idx) => (
              <span key={idx} className="flex-1 text-center">
                {item.label}
              </span>
            ))}
          </div>
        </Card>
      </section>

      {/* Section 2: Payment Analytics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Payment Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PAYMENT_ANALYTICS.map((item) => (
            <Card key={item.id} className={`p-6 border-l-4 ${item.borderClass}`}>
              <div className="text-xs font-medium text-ink-muted mb-2">{item.label}</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-bold text-ink">{item.count}</div>
                  <div className="text-sm text-ink-muted font-medium mt-0.5">{item.amount}</div>
                </div>
                {item.isPositive !== null && (
                  <div
                    className={`text-xs font-medium flex items-center gap-0.5 ${
                      item.isPositive ? 'text-accent-600' : 'text-danger'
                    }`}
                  >
                    {item.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {item.change}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3 & 4: Breakdown Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Revenue Donut */}
        <Card className="lg:col-span-2 p-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/2">
            <h2 className="text-lg font-semibold text-ink mb-1">Subscription Revenue</h2>
            <p className="text-xs text-ink-muted mb-6">Breakdown by status and tier</p>
            <div className="space-y-3">
              {SUBSCRIPTION_BREAKDOWN.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 hover:bg-canvas rounded-control transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-ink">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-ink">{item.amount}</div>
                    <div className="text-xs text-ink-muted">{item.share}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center shrink-0 my-4 md:my-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                className="stroke-canvas"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeWidth="3.5"
              />
              <circle
                className="stroke-primary"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray="32 100"
                strokeWidth="3.5"
              />
              <circle
                className="stroke-accent"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray="55 100"
                strokeDashoffset="-32"
                strokeWidth="3.5"
              />
              <circle
                className="stroke-warning"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray="10 100"
                strokeDashoffset="-87"
                strokeWidth="3.5"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-ink">87%</span>
              <span className="text-xs font-medium text-ink-muted">Growth</span>
            </div>
          </div>
        </Card>

        {/* Mini Breakdown Column */}
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Payment Methods
              </h3>
              <Info size={16} className="text-ink-muted" />
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 relative shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="stroke-canvas"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeWidth="4"
                  />
                  <circle
                    className="stroke-primary"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeDasharray="75 100"
                    strokeWidth="4"
                  />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-ink">Card</span>
                  <span className="text-ink font-semibold">75%</span>
                </div>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Transfer</span>
                  <span className="font-medium">25%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Billing Period
              </h3>
              <Info size={16} className="text-ink-muted" />
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 relative shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="stroke-canvas"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeWidth="4"
                  />
                  <circle
                    className="stroke-accent"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeDasharray="40 100"
                    strokeWidth="4"
                  />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-ink">Annual</span>
                  <span className="text-ink font-semibold">40%</span>
                </div>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Monthly</span>
                  <span className="font-medium">60%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Section 5: Transaction Management */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">Transaction Management</h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 text-xs rounded-control border border-border bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-surface border border-border px-3 py-1.5 rounded-control text-xs text-ink-muted">
              <Filter size={14} className="text-ink-muted shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter transactions by status"
                className="bg-transparent text-ink font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="SUCCESS">Successful</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center bg-surface border border-border px-3 py-1.5 rounded-control text-xs text-ink-muted">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                aria-label="Filter transactions by payment method"
                className="bg-transparent text-ink font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">Method: All</option>
                <option value="Paystack">Paystack</option>
                <option value="Flutterwave">Flutterwave</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border">
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-canvas transition-colors">
                      <td className="px-6 py-4 text-xs font-medium text-ink">{trx.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-50 text-primary-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {trx.initials}
                          </div>
                          <span className="text-xs font-medium text-ink">{trx.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone="neutral" className="text-[10px] font-semibold uppercase">
                          {trx.plan}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-ink">{trx.amount}</td>
                      <td className="px-6 py-4 text-xs text-ink-muted">{trx.method}</td>
                      <td className="px-6 py-4">
                        <Badge tone={getStatusBadgeTone(trx.status)} className="text-[10px]">
                          {trx.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-muted">{trx.date}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(trx)}
                          className="text-primary hover:text-primary-700 h-auto p-0 font-medium text-xs"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-xs text-ink-muted">
                      No transactions found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-t border-border gap-4 bg-surface">
            <span className="text-xs text-ink-muted">
              Showing {filteredTransactions.length} of {INITIAL_TRANSACTIONS.length} transactions
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Transaction Details Modal */}
      <Modal
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={selectedTransaction ? `Transaction Details — ${selectedTransaction.id}` : ''}
      >
        {selectedTransaction && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 bg-canvas rounded-card border border-border">
              <div>
                <p className="text-xs text-ink-muted">Amount Paid</p>
                <p className="text-2xl font-bold text-ink mt-0.5">{selectedTransaction.amount}</p>
              </div>
              <Badge tone={getStatusBadgeTone(selectedTransaction.status)} className="text-xs px-3 py-1">
                {selectedTransaction.status}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Customer Name</span>
                <span className="font-medium text-ink">{selectedTransaction.customer}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Email</span>
                <span className="font-medium text-ink">{selectedTransaction.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Subscription Plan</span>
                <span className="font-medium text-ink">{selectedTransaction.plan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Payment Method</span>
                <span className="font-medium text-ink">{selectedTransaction.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-ink-muted">Transaction Date</span>
                <span className="font-medium text-ink">{selectedTransaction.date}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(null)}>
                Close
              </Button>
              <Button variant="primary" size="sm" className="gap-1.5">
                <Download size={14} /> Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Section 6: Financial Reports */}
      <section className="space-y-4">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-ink mb-1">Financial Reports</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Configure and download detailed financial statements for your accounting and audit
                purposes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  aria-label="Select report type"
                  className="appearance-none bg-surface border border-border pl-3 pr-8 py-2 rounded-control text-xs font-medium text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[160px]"
                >
                  <option>Quarterly Report</option>
                  <option>Annual Report</option>
                  <option>Custom Range</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="gap-1.5"
              >
                <Sparkles size={16} />
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FINANCIAL_REPORTS.map((report) => {
              const Icon = report.icon
              return (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-card hover:border-primary-200 transition-colors cursor-pointer group bg-surface shadow-soft"
                >
                  <div
                    className={`p-3 rounded-full shrink-0 ${report.iconColor} group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-ink truncate group-hover:text-primary transition-colors">
                      {report.name}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-0.5">{report.meta}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </section>
    </div>
  )
}
