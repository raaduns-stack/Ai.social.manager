import { useState } from 'react'
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
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

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
  const [timeframe, setTimeframe] = useState('Week')
  const [showBanner, setShowBanner] = useState(true)
  const [activeTab, setActiveTab] = useState('recent')

  const metrics = METRICS_BY_TIMEFRAME[timeframe]

  const stats = [
    {
      title: 'Total Customers',
      value: metrics.customers,
      change: metrics.customersChange,
      trend: metrics.customersTrend,
      icon: Users,
    },
    {
      title: 'Active Subscriptions',
      value: metrics.activeSubs,
      change: metrics.activeSubsChange,
      trend: metrics.activeSubsTrend,
      icon: CreditCard,
    },
    {
      title: 'Published Posts',
      value: metrics.posts,
      change: metrics.postsChange,
      trend: metrics.postsTrend,
      icon: Send,
    },
    {
      title: 'New Registrations',
      value: metrics.registrations,
      change: metrics.registrationsChange,
      trend: metrics.registrationsTrend,
      icon: UserPlus,
    },
    {
      title: 'Connected Accounts',
      value: metrics.connectedAccounts,
      change: metrics.connectedAccountsChange,
      trend: metrics.connectedAccountsTrend,
      icon: Link2,
    },
    {
      title: 'AI Content Generated',
      value: metrics.aiContent,
      change: metrics.aiContentChange,
      trend: metrics.aiContentTrend,
      icon: Sparkles,
    },
  ]

  const timeframes = ['Day', 'Week', 'Month']

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
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-primary text-white shadow-soft font-bold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {tf}
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

      {/* Dismissible Info Banner */}
     
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200" hover>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  {stat.title}
                </span>
                <Icon className="w-5 h-5 text-ink-muted/50" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-ink">{stat.value}</span>
                <Badge
                  tone={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'danger' : 'neutral'}
                  className="gap-1 font-semibold"
                >
                  {stat.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                  {stat.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{stat.change}</span>
                </Badge>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (Wider): Publishing Activity Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-semibold text-ink">Publishing Activity</h3>
                <p className="text-xs text-ink-muted">Engagement across all platforms</p>
              </div>
              <div className="flex gap-4">
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
                  key={`success-${timeframe}`}
                  className="text-primary stroke-primary animated-path"
                  d={metrics.chartPathSuccess}
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Scheduled Line */}
                <path
                  key={`scheduled-${timeframe}`}
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

        {/* Right (Narrower): Revenue Overview Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-semibold text-ink">Revenue Overview</h3>
              <button className="text-ink-muted hover:text-ink transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-end gap-1.5 h-48 mb-6">
              {metrics.barHeights.map((hClass, idx) => (
                <div
                  key={`${timeframe}-${idx}`}
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
      <Card className="overflow-hidden p-0">
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

