import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CreditCard,
  Send,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  X,
  MoreVertical,
  Calendar,
  DollarSign,
  AlertCircle,
  Settings,
  CheckCircle,
  Link2,
  Star,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { getAdminDashboardSummary } from '../../features/admin/dashboard-api'

const METRICS_BY_TIMEFRAME = {
  Day: {
    customers: '12,450',
    customersChange: '0.2%',
    customersTrend: 'up',
    activeSubs: '8,908',
    activeSubsChange: '0.1%',
    activeSubsTrend: 'up',
    posts: '2,510',
    postsChange: '0%',
    postsTrend: 'flat',
    registrations: '18',
    registrationsChange: '5.4%',
    registrationsTrend: 'down',
    connectedAccounts: '1,240',
    connectedAccountsChange: '+0.5%',
    connectedAccountsTrend: 'up',
    aiContent: '4,850',
    aiContentChange: '+5.4%',
    aiContentTrend: 'up',
    scheduled: '180',
    success: '124',
    failed: '2',
    pending: '54',
    growthRate: '+11.2%',
    goalProgress: '68%',
    chartPathSuccess: 'M0,180 Q100,160 200,170 T400,140 T600,150 T800,100',
    chartPathScheduled: 'M0,200 Q100,190 200,195 T400,185 T600,190 T800,170',
    barHeights: ['h-[30%]', 'h-[50%]', 'h-[40%]', 'h-[75%]', 'h-[60%]', 'h-[45%]', 'h-[25%]'],
    barValues: ['10k', '15k', '12k', '22k', '18k', '14k', '8k'],
  },
  Week: {
    customers: '12,482',
    customersChange: '12%',
    customersTrend: 'up',
    activeSubs: '8,912',
    activeSubsChange: '5.2%',
    activeSubsTrend: 'up',
    posts: '2,543',
    postsChange: '0%',
    postsTrend: 'flat',
    registrations: '432',
    registrationsChange: '2.4%',
    registrationsTrend: 'down',
    connectedAccounts: '1,254',
    connectedAccountsChange: '+3.1%',
    connectedAccountsTrend: 'up',
    aiContent: '32,410',
    aiContentChange: '+12.4%',
    aiContentTrend: 'up',
    scheduled: '1,240',
    success: '856',
    failed: '24',
    pending: '142',
    growthRate: '+12.4%',
    goalProgress: '72%',
    chartPathSuccess: 'M0,180 Q100,120 200,150 T400,80 T600,120 T800,40',
    chartPathScheduled: 'M0,200 Q100,180 200,190 T400,160 T600,170 T800,140',
    barHeights: ['h-[40%]', 'h-[60%]', 'h-[45%]', 'h-[85%]', 'h-[70%]', 'h-[50%]', 'h-[30%]'],
    barValues: ['12k', '18k', '14k', '25k', '21k', '15k', '9k'],
  },
  Month: {
    customers: '12,740',
    customersChange: '18.5%',
    customersTrend: 'up',
    activeSubs: '9,120',
    activeSubsChange: '8.4%',
    activeSubsTrend: 'up',
    posts: '2,890',
    postsChange: '1.2%',
    postsTrend: 'up',
    registrations: '1,894',
    registrationsChange: '3.1%',
    registrationsTrend: 'up',
    connectedAccounts: '1,380',
    connectedAccountsChange: '+8.5%',
    connectedAccountsTrend: 'up',
    aiContent: '142,900',
    aiContentChange: '+22.8%',
    aiContentTrend: 'up',
    scheduled: '5,420',
    success: '3,890',
    failed: '112',
    pending: '618',
    growthRate: '+14.8%',
    goalProgress: '85%',
    chartPathSuccess: 'M0,120 Q100,80 200,90 T400,50 T600,70 T800,20',
    chartPathScheduled: 'M0,160 Q100,140 200,150 T400,120 T600,130 T800,90',
    barHeights: ['h-[50%]', 'h-[75%]', 'h-[60%]', 'h-[95%]', 'h-[80%]', 'h-[65%]', 'h-[40%]'],
    barValues: ['15k', '22k', '18k', '28k', '24k', '20k', '12k'],
  },
}

const ACTIVITIES = {
  recent: [
    {
      id: 1,
      icon: UserPlus,
      color: 'bg-accent-50 text-accent',
      title: 'Sarah Jenkins',
      titlePrefix: 'New customer ',
      titleSuffix: ' registered via LinkedIn',
      description: 'Identity verified via OAuth',
      time: '2 mins ago',
    },
    {
      id: 2,
      icon: Calendar,
      color: 'bg-primary-50 text-primary',
      title: '"Summer Campaign Recap"',
      titlePrefix: 'Post scheduled: ',
      titleSuffix: ' for Twitter',
      description: 'Scheduled for 14:00 PM',
      time: '15 mins ago',
    },
    {
      id: 3,
      icon: DollarSign,
      color: 'bg-primary-50 text-primary-700',
      title: 'Enterprise Monthly',
      titlePrefix: 'Subscription renewed: ',
      titleSuffix: '',
      description: 'Invoice #INV-2024-001',
      time: '1 hour ago',
    },
    {
      id: 4,
      icon: AlertCircle,
      color: 'bg-red-50 text-danger',
      title: 'API Connection',
      titlePrefix: 'Failed attempt: ',
      titleSuffix: ' to Meta Graph',
      description: 'Token expired or invalid permissions',
      time: '3 hours ago',
    },
    {
      id: 5,
      icon: Settings,
      color: 'bg-canvas text-ink-muted',
      title: 'Admin password',
      titlePrefix: 'Security update: ',
      titleSuffix: ' changed',
      description: 'Triggered by system administrator',
      time: '5 hours ago',
    },
  ],
  post: [
    {
      id: 1,
      icon: CheckCircle,
      color: 'bg-accent-50 text-accent',
      title: 'Instagram',
      titlePrefix: 'Post published successfully to ',
      titleSuffix: '',
      description: '"10 Tips for Mastering AI Workflows"',
      time: '10 mins ago',
    },
    {
      id: 2,
      icon: Calendar,
      color: 'bg-primary-50 text-primary',
      title: '"Summer Campaign Recap"',
      titlePrefix: 'Post scheduled: ',
      titleSuffix: ' for Twitter',
      description: 'Scheduled for 14:00 PM',
      time: '15 mins ago',
    },
    {
      id: 3,
      icon: AlertCircle,
      color: 'bg-red-50 text-danger',
      title: 'Facebook',
      titlePrefix: 'Failed to publish post to ',
      titleSuffix: '',
      description: 'Image resolution limits exceeded',
      time: '1 hour ago',
    },
  ],
}

export default function Dashboard() {
  const [period, setPeriod] = useState('weekly') // 'daily' | 'weekly' | 'monthly'
  const [summaryData, setSummaryData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('recent')

  useEffect(() => {
    async function fetchSummary() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getAdminDashboardSummary(period)
        setSummaryData(data)
      } catch (err) {
        console.error('Failed to fetch admin summary:', err)
        setError('Failed to load dashboard metrics.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSummary()
  }, [period])

  const timeframeKey = period === 'daily' ? 'Day' : period === 'monthly' ? 'Month' : 'Week'
  const metrics = METRICS_BY_TIMEFRAME[timeframeKey]

  const renderValue = (value) => {
    if (isLoading) {
      return <span className="animate-pulse text-primary-200 text-sm">Loading...</span>
    }
    if (error) {
      return <span className="text-red-500 text-xs font-semibold">Error</span>
    }
    return value
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animated-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawPath 1.8s ease-out forwards;
        }
      `}</style>

      {/* Dashboard Title Row with Toggle */}
      <PageHeader
        title="Overview"
        action={
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-canvas border border-border rounded-full p-1 flex items-center shadow-soft">
              {[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPeriod(item.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    period === item.value
                      ? 'bg-primary text-white shadow-soft font-bold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button
              as={Link}
              to="/admin/analytics"
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View Full Analytics</span>
            </Button>
          </div>
        }
      />

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Total Customers (Live) */}
        <Card className="p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200" hover>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Total Customers
            </span>
            <Users className="w-5 h-5 text-ink-muted/50" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink">
              {renderValue(summaryData?.totalCustomers)}
            </span>
          </div>
        </Card>

        {/* Card 2: Active & Expired Subscriptions (Live) */}
        <Card className="p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200" hover>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Subscriptions Status
            </span>
            <CreditCard className="w-5 h-5 text-ink-muted/50" />
          </div>
          <div className="flex flex-col justify-end mt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-ink">
                {isLoading ? (
                  <span className="animate-pulse text-primary-200 text-sm">Loading...</span>
                ) : error ? (
                  <span className="text-red-500 text-xs font-semibold">Error</span>
                ) : (
                  `${summaryData?.activeSubscriptions || 0} Active`
                )}
              </span>
            </div>
            {!isLoading && !error && (
              <span className="text-xs text-ink-muted mt-1.5 font-medium block">
                {summaryData?.expiredSubscriptions || 0} Expired Subscriptions
              </span>
            )}
          </div>
        </Card>

        {/* Card 3: Published Posts (Mock with Dev Mode Badge) */}
        <Card className="relative p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200" hover>
          <div className="absolute top-2 right-2 z-20">
            <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Dev Mode - Mock Data
            </span>
          </div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Published Posts
            </span>
            <Send className="w-5 h-5 text-ink-muted/50" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink">{renderValue(summaryData?.totalFeedback)}</span>{/* Displays total feedback count using helper function to gracefully handle null/undefined states */}
            <Badge tone="neutral" className="gap-1 font-semibold">
              <span>{metrics.postsChange}</span>
            </Badge>
          </div>
        </Card>

        {/* Card 4: New Registrations (Live) */}
        <Card className="p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200" hover>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              New Registrations ({period})
            </span>
            <UserPlus className="w-5 h-5 text-ink-muted/50" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink">
              {renderValue(summaryData?.newCustomersThisPeriod)}
            </span>
          </div>
        </Card>

        {/* Card 5: Connected Accounts (Mock with Dev Mode Badge) */}
        <Card className="relative p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200" hover>
          <div className="absolute top-2 right-2 z-20">
            <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Dev Mode - Mock Data
            </span>
          </div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Connected Accounts
            </span>
            <Link2 className="w-5 h-5 text-ink-muted/50" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink">{metrics.connectedAccounts}</span>
            <Badge tone="success" className="gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metrics.connectedAccountsChange}</span>
            </Badge>
          </div>
        </Card>

        {/* Card 6: AI Content Generated (Mock with Dev Mode Badge) */}
        <Card className="relative p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200" hover>
          <div className="absolute top-2 right-2 z-20">
            <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Dev Mode - Mock Data
            </span>
          </div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              AI Content Generated
            </span>
            <Sparkles className="w-5 h-5 text-ink-muted/50" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink">{renderValue(summaryData?.totalSuggestions)}</span>{/* Displays total suggestions count using helper function to gracefully handle null/undefined states */}
            <Badge tone="success" className="gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{metrics.aiContentChange}</span>
            </Badge>
          </div>
        </Card>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (Wider): Publishing Activity Chart */}
        <Card className="relative lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="absolute top-4 right-4 z-20">
            <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Dev Mode - Mock Data
            </span>
          </div>
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-semibold text-ink">Publishing Activity</h3>
                <p className="text-xs text-ink-muted">Engagement across all platforms</p>
              </div>
              <div className="flex gap-4 mr-24">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-xs text-ink-muted font-medium">Success</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-ink-muted/60" />
                  <span className="text-xs text-ink-muted font-medium">Scheduled</span>
                </div>
              </div>
            </div>

            <div className="relative h-64 w-full bg-canvas/30 rounded-control overflow-hidden border border-border">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-40">
                <hr className="border-border border-dashed" />
                <hr className="border-border border-dashed" />
                <hr className="border-border border-dashed" />
                <hr className="border-border border-dashed" />
              </div>

              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 250">
                {/* Success Line */}
                <path
                  key={`success-${period}`}
                  className="text-primary stroke-primary animated-path"
                  d={metrics.chartPathSuccess}
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Scheduled Line */}
                <path
                  key={`scheduled-${period}`}
                  className="text-ink-muted/50 stroke-ink-muted animated-path"
                  d={metrics.chartPathScheduled}
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                />
              </svg>

              <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6 text-xs text-ink-muted font-medium">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-control bg-canvas border border-border/30">
              <p className="text-xs text-ink-muted mb-1 font-medium">Scheduled</p>
              <p className="text-lg font-bold text-ink">{metrics.scheduled}</p>
            </div>
            <div className="p-3 rounded-control bg-canvas border border-border/30">
              <p className="text-xs text-ink-muted mb-1 font-medium">Success</p>
              <p className="text-lg font-bold text-accent">{metrics.success}</p>
            </div>
            <div className="p-3 rounded-control bg-canvas border border-border/30">
              <p className="text-xs text-ink-muted mb-1 font-medium">Failed</p>
              <p className="text-lg font-bold text-danger">{metrics.failed}</p>
            </div>
            <div className="p-3 rounded-control bg-canvas border border-border/30">
              <p className="text-xs text-ink-muted mb-1 font-medium">Pending</p>
              <p className="text-lg font-bold text-warning">{metrics.pending}</p>
            </div>
          </div>
        </Card>

        {/* Right (Narrower): Revenue Overview Card (Live Revenue, Chart Mocked) */}
        <Card className="relative p-6 flex flex-col justify-between">
          <div className="absolute top-4 right-4 z-20">
            <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Dev Mode - Chart Mocked
            </span>
          </div>
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-semibold text-ink">Revenue Overview</h3>
                {isLoading ? (
                  <div className="h-8 animate-pulse bg-primary/10 rounded w-32 mt-2" />
                ) : error ? (
                  <p className="text-xs text-red-500 font-semibold mt-2">{error}</p>
                ) : (
                  <div className="mt-1">
                    <span className="text-3xl font-extrabold text-ink">
                      ₦{Number(summaryData?.revenueThisPeriod || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-ink-muted block mt-0.5 capitalize font-medium">
                      Total Successful Revenue ({period})
                    </span>
                  </div>
                )}
              </div>
              <button className="text-ink-muted hover:text-ink transition-colors mr-28">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-end gap-1.5 h-40 mb-6">
              {metrics.barHeights.map((hClass, idx) => (
                <div
                  key={`${period}-${idx}`}
                  className={`flex-grow rounded-t-sm cursor-pointer group relative transition-all duration-300 ${
                    idx === 3
                      ? 'bg-primary border-x border-primary-500'
                      : 'bg-primary-100 hover:bg-primary'
                  } ${hClass}`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono">
                    ₦{metrics.barValues[idx]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Growth Rate</span>
              <span className="text-accent font-semibold text-sm">{metrics.growthRate}</span>
            </div>
            <div className="w-full bg-canvas rounded-full h-1.5 border border-border/20">
              <div className="bg-accent h-1.5 rounded-full transition-all duration-500" style={{ width: metrics.goalProgress }}></div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-muted">Annual Goal</span>
              <span className="text-ink font-semibold">₦15M</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Tabs and Recent Activity */}
      <Card className="relative overflow-hidden p-0">
        <div className="absolute top-4 right-4 z-20">
          <span className="text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
            Dev Mode - Mock Data
          </span>
        </div>
        <div className="border-b border-border px-6 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-4 px-2 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'recent'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Recent Activity
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`py-4 px-2 border-b-2 text-sm font-semibold transition-all ${
              activeTab === 'post'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Post Activity
          </button>
        </div>

        <div className="divide-y divide-border/50">
          {ACTIVITIES[activeTab].map((act) => {
            const Icon = act.icon
            return (
              <div
                key={act.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-canvas/50 transition-colors cursor-default"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${act.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-ink-muted">
                      {act.titlePrefix}
                      <span className="font-semibold text-ink">{act.title}</span>
                      {act.titleSuffix}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">{act.description}</p>
                  </div>
                </div>
                <span className="text-xs text-ink-muted font-medium opacity-80 whitespace-nowrap ml-4">
                  {act.time}
                </span>
              </div>
            )
          })}
        </div>

        <div className="p-4 text-center border-t border-border/50 bg-canvas/10">
          <Button variant="ghost" className="text-primary font-semibold hover:text-primary-700">
            View All Activity
          </Button>
        </div>
      </Card>
    </div>
  )
}

