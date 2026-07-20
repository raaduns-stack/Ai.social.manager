import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Download,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const kpiStats = [
  {
    title: 'Total Followers',
    value: '12,450',
    change: '5.2%',
    isPositive: true,
    path: 'M0,18 L10,15 L20,16 L30,12 L40,14 L50,10 L60,8 L70,11 L80,5 L90,7 L100,2',
  },
  {
    title: 'Impressions',
    value: '84.2K',
    change: '12.4%',
    isPositive: true,
    path: 'M0,18 L10,12 L20,14 L30,8 L40,10 L50,6 L60,4 L70,8 L80,2 L90,5 L100,1',
  },
  {
    title: 'Engagement Rate',
    value: '4.2%',
    change: '0.5%',
    isPositive: true,
    path: 'M0,15 L10,14 L20,15 L30,13 L40,14 L50,12 L60,11 L70,12 L80,10 L90,9 L100,8',
  },
  {
    title: 'Profile Visits',
    value: '2,100',
    change: '2.1%',
    isPositive: false,
    path: 'M0,5 L10,7 L20,6 L30,10 L40,8 L50,12 L60,14 L70,12 L80,16 L90,15 L100,18',
  },
]

const barData = [
  { platform: 'IG', height: 'h-[180px]', opacity: 'bg-primary' },
  { platform: 'TW', height: 'h-[120px]', opacity: 'bg-primary/60' },
  { platform: 'LI', height: 'h-[90px]', opacity: 'bg-primary/40' },
  { platform: 'TK', height: 'h-[150px]', opacity: 'bg-primary/80' },
]

const topPosts = [
  {
    id: 1,
    title: '10 Tips for Mastering AI Workflows in 2024',
    subtitle: 'Posted 2 days ago • Instagram',
    likes: '1.2K',
    er: '8.4%',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAleUQStKWP_nrPLhcPgKO1wb_6LbpZM2WcZRJkvqSNyOd-4d16FY3P2EwbkP_FP3Wt33EZeXgjELG-2ONDt-4UJobjnV5my8HB9QsvMP3rQ2AVhomrZux2ECKmXz8SSap3un_SuaqzTlkCxSeJeYuA_e_an2mmozXi8MShxo5flHnQP1rRkQd1ygbWn21cg1wttdiGBBorf956x22nx9OgxLRR6xXSk08b9mBoJVweYkYugFLIoIcqlBDx0ynqSg_Ze5a6BKFYi37e',
  },
  {
    id: 2,
    title: 'Inside our new HQ: Sustainability first',
    subtitle: 'Posted 5 days ago • LinkedIn',
    likes: '840',
    er: '6.1%',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA_TCW9MEojrE-BVdB2cDHKN5mDcDIhpWmOLM-Eeqd5HoAgBCuWLG1DNh0dBUbQY-aIQuy5a3lb0rgNETGnXEo_82iclQQErWtGuj6szlBxWHMXa3rYZw8P2kmj-vtvXZcDTCtH9V5dGNXAozRoyQmhT5YSJ5EOHT6irpuQLqmCluQSwe_BJ03fT-X6RLtbTWweu1Cn71E5CPFzCIN3lqSs0Dl8RQTWa2QOoQMioxx8dEWMMjxjDCUHbef7JwRhGwdBcZOm4zTYnmw0',
  },
  {
    id: 3,
    title: 'Product Update: Analytics V2 is live!',
    subtitle: 'Posted 1 week ago • Twitter',
    likes: '452',
    er: '5.8%',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuARceeh-SFmrFXtS95KOcl1SGU9LL-7Qa2gITQvzfQJ2o_5uuVCvYrQpAcKr-lA2eSVhohBWn488izPgZT8M7210K1KIinBIw8XiTHtJE71LmRcwcTI-BGAYfqb_gcYgfuMcquZE_cYGhNbaicqyWXV4k6Xsim0Ts957E5XF51nIsEbJeHrdKeNsiUwc6M10jRs2ygLwFOyh49V_GUaxuuGsNaxR-Ju_eYXFB7-LUHPhAJQ9gnA81Z5R6lLAOF9-GdZjZ_vWScZBxHD',
  },
]

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('Monthly')
  const timeframes = ['Daily', 'Weekly', 'Monthly']

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Analytics"
        description="Real-time performance metrics across your social ecosystem."
        action={
          <div className="bg-canvas border border-border rounded-control p-1 flex items-center shadow-soft">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs rounded-control transition-all ${
                  timeframe === tf
                    ? 'bg-surface text-primary shadow-soft font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStats.map((stat) => (
          <Card key={stat.title} className="p-5 flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              {stat.title}
            </span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-ink">{stat.value}</span>
              <Badge
                tone={stat.isPositive ? 'success' : 'danger'}
                className="gap-1 font-bold"
              >
                {stat.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {stat.change}
              </Badge>
            </div>
            <div className="mt-2 h-8 w-full">
              <svg
                className={`w-full h-full stroke-current fill-none ${
                  stat.isPositive ? 'text-accent' : 'text-danger'
                }`}
                strokeWidth="2"
                viewBox="0 0 100 20"
              >
                <path d={stat.path} strokeLinecap="round" />
              </svg>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Follower Growth Line Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-ink">Follower Growth</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-ink-muted">Followers</span>
              </div>
              <button className="text-ink-muted hover:text-ink transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-grow min-h-[260px] relative mt-2">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 300">
              <line stroke="#E5E7EB" strokeDasharray="4" x1="0" x2="800" y1="50" y2="50" />
              <line stroke="#E5E7EB" strokeDasharray="4" x1="0" x2="800" y1="150" y2="150" />
              <line stroke="#E5E7EB" strokeDasharray="4" x1="0" x2="800" y1="250" y2="250" />
              <path
                d="M0,280 Q100,260 200,220 T400,180 T600,100 T800,40"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M0,280 Q100,260 200,220 T400,180 T600,100 T800,40 L800,300 L0,300 Z"
                fill="url(#followerChartGradient)"
              />
              <defs>
                <linearGradient id="followerChartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-ink-muted px-2 pt-2">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </Card>

        {/* Engagement Overview Bar Chart */}
        <Card className="p-6 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-ink mb-6">Engagement Overview</h3>
          <div className="flex-grow flex items-end justify-between gap-4 px-2 pt-4 min-h-[200px]">
            {barData.map((item) => (
              <div key={item.platform} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-full ${item.height} ${item.opacity} rounded-t-control transition-all duration-300 hover:opacity-100`}
                />
                <span className="text-xs font-bold text-ink">{item.platform}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-6 text-center">
            Instagram remains your most interactive platform this month.
          </p>
        </Card>
      </div>

      {/* Top Posts & Monthly Report Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Posts */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Top Performing Posts</h3>
            <Button variant="ghost" size="sm" className="text-primary font-semibold hover:text-primary-700">
              View All
            </Button>
          </div>
          <div className="divide-y divide-border">
            {topPosts.map((post) => (
              <div key={post.id} className="p-5 flex items-center gap-4 hover:bg-canvas transition-colors group">
                <div className="w-16 h-16 rounded-control bg-canvas overflow-hidden shrink-0 border border-border">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{post.title}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{post.subtitle}</p>
                </div>
                <div className="flex gap-6 text-center shrink-0">
                  <div>
                    <p className="text-sm font-bold text-ink">{post.likes}</p>
                    <p className="text-xs text-ink-muted">Likes</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{post.er}</p>
                    <p className="text-xs text-ink-muted">ER</p>
                  </div>
                </div>
                <button className="p-2 text-ink-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Performance Report Card */}
        <Card className="bg-primary text-white p-6 flex flex-col justify-between relative overflow-hidden shadow-soft border-transparent">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />

          <div className="mb-6 z-10">
            <div className="w-12 h-12 rounded-control bg-white/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Monthly Report</h3>
            <p className="text-xs text-white/80 mt-1">Jan 1 - Jan 31, 2024</p>
          </div>

          <div className="flex-grow mb-6 z-10">
            <div className="bg-white/10 rounded-control p-4 border border-white/10 backdrop-blur-sm">
              <p className="text-sm font-medium text-white">
                Your engagement is up <span className="font-bold text-accent-100">12%</span> compared to last month.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-white/90">
                <Clock className="w-4 h-4 text-accent-100 shrink-0" />
                <span>
                  Best performing time: <strong className="text-white font-bold">Tuesdays at 10 AM</strong>
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full bg-white text-primary hover:bg-white/90 border-transparent font-semibold gap-2 z-10"
          >
            <Download className="w-4 h-4" />
            Download Full Report (PDF)
          </Button>
        </Card>
      </div>
    </div>
  )
}

