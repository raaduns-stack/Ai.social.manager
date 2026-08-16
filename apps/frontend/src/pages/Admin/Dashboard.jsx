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
  Activity,
  FileText,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import { getAdminDashboardSummary } from '../../features/admin/dashboard-api'
import { cn } from '../../utils/cn'

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
      color: 'bg-primary/10 text-primary',
      title: 'Sarah Jenkins',
      titlePrefix: 'New customer ',
      titleSuffix: ' registered via LinkedIn',
      description: 'Identity verified via OAuth',
      time: '2 mins ago',
    },
    {
      id: 2,
      icon: Calendar,
      color: 'bg-primary-container/10 text-[#FF6600]',
      title: '"Summer Campaign Recap"',
      titlePrefix: 'Post scheduled: ',
      titleSuffix: ' for Twitter',
      description: 'Scheduled for 14:00 PM',
      time: '15 mins ago',
    },
    {
      id: 3,
      icon: DollarSign,
      color: 'bg-[#E6F4EA] text-[#137333]',
      title: 'Enterprise Monthly',
      titlePrefix: 'Subscription renewed: ',
      titleSuffix: '',
      description: 'Invoice #INV-2024-001',
      time: '1 hour ago',
    },
    {
      id: 4,
      icon: AlertCircle,
      color: 'bg-error-container/60 text-error',
      title: 'API Connection',
      titlePrefix: 'Failed attempt: ',
      titleSuffix: ' to Meta Graph',
      description: 'Token expired or invalid permissions',
      time: '3 hours ago',
    },
    {
      id: 5,
      icon: Settings,
      color: 'bg-surface-container/60 text-on-surface-variant',
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
      color: 'bg-[#E6F4EA] text-[#137333]',
      title: 'Instagram',
      titlePrefix: 'Post published successfully to ',
      titleSuffix: '',
      description: '"10 Tips for Mastering AI Workflows"',
      time: '10 mins ago',
    },
    {
      id: 2,
      icon: Calendar,
      color: 'bg-primary-container/10 text-[#FF6600]',
      title: '"Summer Campaign Recap"',
      titlePrefix: 'Post scheduled: ',
      titleSuffix: ' for Twitter',
      description: 'Scheduled for 14:00 PM',
      time: '15 mins ago',
    },
    {
      id: 3,
      icon: AlertCircle,
      color: 'bg-error-container/60 text-error',
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
      return <span className="animate-pulse text-on-surface-variant/40 text-sm">Loading...</span>
    }
    if (error) {
      return <span className="text-error text-xs font-semibold">Error</span>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Good morning, Admin.</h2>
          <p className="text-sm text-on-surface-variant">Here's what's happening across Raasocial.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 border border-surface-variant bg-surface rounded-lg p-1 shadow-soft">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value)}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-all font-ui-mono",
                  period === item.value
                    ? 'bg-primary text-on-primary font-bold shadow-soft'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                )}
              >
                {item.label.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            as={Link}
            to="/admin/analytics"
            variant="outline"
            className="flex items-center gap-2 border border-surface-variant text-on-surface-variant hover:border-on-surface hover:bg-surface-container-low transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Full Analytics</span>
          </Button>
        </div>
      </div>

      {/* Stat Cards Grid (Bento styled) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Total Customers */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors relative">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Total Customers</span>
            <Users className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.totalCustomers)}
            </span>
            <span className="font-ui-mono text-ui-mono text-primary mb-1 flex items-center">
              <TrendingUp className="text-sm w-3.5 h-3.5 mr-0.5" /> {metrics.customersChange}
            </span>
          </div>
        </div>

        {/* Card 2: Subscriptions Status */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors relative">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Active Subscriptions</span>
            <CreditCard className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {isLoading ? (
                <span className="animate-pulse text-on-surface-variant/40 text-sm">Loading...</span>
              ) : error ? (
                <span className="text-error text-xs font-semibold">Error</span>
              ) : (
                `${summaryData?.activeSubscriptions || 0}`
              )}
            </span>
            <span className="font-ui-mono text-ui-mono text-primary mb-1 flex items-center">
              <TrendingUp className="text-sm w-3.5 h-3.5 mr-0.5" /> {metrics.activeSubsChange}
            </span>
          </div>
          {!isLoading && !error && (
            <span className="text-xs text-on-surface-variant mt-1 block">
              {summaryData?.expiredSubscriptions || 0} Expired Subscriptions
            </span>
          )}
        </div>

        {/* Card 3: Published Posts (Mock with Dev Mode Badge) */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors relative">
          <div className="absolute top-2 right-2">
            <span className="text-[8px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Mock
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Published Posts</span>
            <Send className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.totalFeedback)}
            </span>
            <span className="font-ui-mono text-ui-mono text-on-surface-variant/60 mb-1 flex items-center">
              {metrics.postsChange}
            </span>
          </div>
        </div>

        {/* Card 4: New Registrations */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors relative">
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">New Registrations ({period})</span>
            <UserPlus className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.newCustomersThisPeriod)}
            </span>
            <span className="font-ui-mono text-ui-mono text-primary mb-1 flex items-center">
              <TrendingDown className="text-sm w-3.5 h-3.5 mr-0.5 text-error" /> {metrics.registrationsChange}
            </span>
          </div>
        </div>

        {/* Card 5: Connected Accounts (Mock with Dev Mode Badge) */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors relative">
          <div className="absolute top-2 right-2">
            <span className="text-[8px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Mock
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Connected Accounts</span>
            <Link2 className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {metrics.connectedAccounts}
            </span>
            <span className="font-ui-mono text-ui-mono text-primary mb-1 flex items-center">
              <TrendingUp className="text-sm w-3.5 h-3.5 mr-0.5" /> {metrics.connectedAccountsChange}
            </span>
          </div>
        </div>

        {/* Card 6: AI Content Generated (Mock with Dev Mode Badge) */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col gap-2 hover:border-outline transition-colors relative">
          <div className="absolute top-2 right-2">
            <span className="text-[8px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Mock
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">AI Content Generated</span>
            <Sparkles className="text-tertiary-container w-5 h-5 shrink-0" />
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface leading-none">
              {renderValue(summaryData?.totalSuggestions)}
            </span>
            <span className="font-ui-mono text-ui-mono text-primary mb-1 flex items-center">
              <TrendingUp className="text-sm w-3.5 h-3.5 mr-0.5" /> {metrics.aiContentChange}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-unit">
        {/* Left (Wider): Publishing Activity Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col relative">
          <div className="absolute top-4 right-4">
            <span className="text-[8px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Mock Chart
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Publishing Activity</h3>
              <p className="text-xs text-on-surface-variant">Engagement across all platforms</p>
            </div>
            <div className="flex gap-4 mr-20">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                <span className="text-xs text-on-surface-variant font-medium">Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container" />
                <span className="text-xs text-on-surface-variant font-medium">Scheduled</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative min-h-[260px] border-b border-l border-surface-variant/50 pt-4 pr-4">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pt-4 pointer-events-none">
              <div className="w-full h-px bg-[#F2F2F2]"></div>
              <div className="w-full h-px bg-[#F2F2F2]"></div>
              <div className="w-full h-px bg-[#F2F2F2]"></div>
              <div className="w-full h-px bg-[#F2F2F2]"></div>
              <div className="w-full h-px bg-[#F2F2F2]"></div>
            </div>

            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 250">
              {/* Success Line */}
              <path
                key={`success-${period}`}
                className="stroke-primary-container animated-path"
                d={metrics.chartPathSuccess}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Scheduled Line */}
              <path
                key={`scheduled-${period}`}
                className="stroke-tertiary-container animated-path"
                d={metrics.chartPathScheduled}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-2 text-xs text-on-surface-variant font-ui-mono">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <p className="text-xs text-on-surface-variant mb-1 font-medium">Scheduled</p>
              <p className="text-lg font-bold text-on-surface">{metrics.scheduled}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <p className="text-xs text-on-surface-variant mb-1 font-medium">Success</p>
              <p className="text-lg font-bold text-[#FF6600]">{metrics.success}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <p className="text-xs text-on-surface-variant mb-1 font-medium">Failed</p>
              <p className="text-lg font-bold text-error">{metrics.failed}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant/40">
              <p className="text-xs text-on-surface-variant mb-1 font-medium">Pending</p>
              <p className="text-lg font-bold text-on-surface-variant">{metrics.pending}</p>
            </div>
          </div>
        </div>

        {/* Right (Narrower): Revenue Overview Card */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 flex flex-col justify-between relative">
          <div className="absolute top-4 right-4">
            <span className="text-[8px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              Mock Chart
            </span>
          </div>

          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-headline-lg text-headline-lg text-on-surface">Revenue Overview</h3>
                {isLoading ? (
                  <div className="h-8 animate-pulse bg-primary/10 rounded w-32 mt-2" />
                ) : error ? (
                  <p className="text-xs text-error font-semibold mt-2">{error}</p>
                ) : (
                  <div className="mt-1">
                    <span className="text-3xl font-extrabold text-on-surface">
                      ₦{Number(summaryData?.revenueThisPeriod || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block mt-0.5 capitalize font-medium">
                      Total Successful Revenue ({period})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-end gap-1.5 h-40 mb-6 px-2">
              {metrics.barHeights.map((hClass, idx) => (
                <div
                  key={`${period}-${idx}`}
                  className={cn(
                    "flex-grow rounded-t cursor-pointer group relative transition-all duration-300",
                    idx === 3
                      ? 'bg-primary-container'
                      : 'bg-primary-container/20 hover:bg-primary-container',
                    hClass
                  )}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono">
                    ₦{metrics.barValues[idx]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Growth Rate</span>
              <span className="text-[#FF6600] font-semibold text-sm">{metrics.growthRate}</span>
            </div>
            <div className="w-full bg-surface-container-low rounded-full h-1.5 border border-surface-variant/40">
              <div className="bg-[#FF6600] h-1.5 rounded-full transition-all duration-500" style={{ width: metrics.goalProgress }}></div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-on-surface-variant">Annual Goal</span>
              <span className="text-on-surface font-semibold">₦15M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tabs and Activity Feed (Styled as Bento List) */}
      <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden flex flex-col relative">
        <div className="absolute top-4 right-4">
          <span className="text-[8px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20">
            Mock Events
          </span>
        </div>

        <div className="border-b border-surface-variant px-6 flex items-center gap-4 bg-surface-bright">
          <button
            onClick={() => setActiveTab('recent')}
            className={cn(
              "py-4 px-2 border-b-2 text-sm font-semibold transition-all",
              activeTab === 'recent'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            Recent Activity
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={cn(
              "py-4 px-2 border-b-2 text-sm font-semibold transition-all",
              activeTab === 'post'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            Post Activity
          </button>
        </div>

        <div className="divide-y divide-surface-variant">
          {ACTIVITIES[activeTab].map((act) => {
            const Icon = act.icon
            return (
              <div
                key={act.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-default"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", act.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">
                      {act.titlePrefix}
                      <span className="font-semibold text-on-surface">{act.title}</span>
                      {act.titleSuffix}
                    </p>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5">{act.description}</p>
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant font-ui-mono whitespace-nowrap ml-4">
                  {act.time}
                </span>
              </div>
            )
          })}
        </div>

        <div className="p-4 text-center border-t border-surface-variant bg-surface-bright">
          <Link to="/admin/logs" className="text-primary font-semibold hover:underline text-sm">
            View All Activity
          </Link>
        </div>
      </div>
    </div>
  )
}
