import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  UserMinus,
  Sparkles,
  Search,
  MoreVertical,
  Download,
  ChevronDown,
  Instagram,
  Facebook,
  Music,
  Linkedin,
  Zap,
  Activity,
  Award
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { cn } from '../../utils/cn'

// ---------------------------------------------------------------------------
// Mock Data set driven by timeframe
// ---------------------------------------------------------------------------
const METRICS_BY_TIMEFRAME = {
  day: {
    customerGrowth: { value: '48', trend: '+1.5%', type: 'up' },
    revenueGrowth: { value: '₦1,380', trend: '+0.5%', type: 'up' },
    engagementRate: { value: '4.2%', trend: '-0.2%', type: 'down' },
    aiUsage: { value: '820', trend: '+12%', type: 'up' },
    revenueHeights: [20, 35, 25, 45, 30, 50, 40, 60],
    socialHeights: {
      fb: [40, 50, 30],
      ig: [30, 45, 55],
      tk: [50, 40, 60]
    },
    donut: { ent: 55, pro: 30, basic: 15, total: '1.2k' },
    areaFill: "M0,200 L0,175 C50,160 100,180 150,160 C200,150 250,135 300,120 C350,110 400,115 450,90 L500,80 L500,200 Z",
    areaStroke: "M0,175 C50,160 100,180 150,160 C200,150 250,135 300,120 C350,110 400,115 450,90 L500,80"
  },
  week: {
    customerGrowth: { value: '312', trend: '+4.8%', type: 'up' },
    revenueGrowth: { value: '₦9,250', trend: '+2.1%', type: 'up' },
    engagementRate: { value: '4.5%', trend: '+0.3%', type: 'up' },
    aiUsage: { value: '5.8k', trend: '+18%', type: 'up' },
    revenueHeights: [30, 45, 35, 55, 48, 65, 58, 75],
    socialHeights: {
      fb: [50, 65, 40],
      ig: [40, 55, 70],
      tk: [60, 55, 75]
    },
    donut: { ent: 58, pro: 27, basic: 15, total: '1.8k' },
    areaFill: "M0,200 L0,160 C50,145 100,170 150,130 C200,120 250,100 300,90 C350,65 400,80 450,50 L500,40 L500,200 Z",
    areaStroke: "M0,160 C50,145 100,170 150,130 C200,120 250,100 300,90 C350,65 400,80 450,50 L500,40"
  },
  month: {
    customerGrowth: { value: '1,482', trend: '+12.5%', type: 'up' },
    revenueGrowth: { value: '₦42,910', trend: '+8.2%', type: 'up' },
    engagementRate: { value: '4.8%', trend: '-1.2%', type: 'down' },
    aiUsage: { value: '24.2k', trend: '+24%', type: 'up' },
    revenueHeights: [40, 55, 45, 70, 60, 85, 75, 90],
    socialHeights: {
      fb: [60, 80, 40],
      ig: [45, 65, 85],
      tk: [70, 50, 90]
    },
    donut: { ent: 60, pro: 25, basic: 15, total: '2.4k' },
    areaFill: "M0,200 L0,150 C50,130 100,180 150,140 C200,100 250,120 300,80 C350,40 400,60 450,30 L500,20 L500,200 Z",
    areaStroke: "M0,150 C50,130 100,180 150,140 C200,100 250,120 300,80 C350,40 400,60 450,30 L500,20"
  }
}

const INITIAL_CONTENT = [
  {
    id: "post_1",
    title: "The Future of AI Architecture...",
    customer: "Global Creative Agency",
    platform: "Instagram",
    score: 98.4,
    published: "Oct 12, 2023",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbetoyOJiogW5YOQx-MIK-NNbmEgxg9ZDwdOqEiYlAdK_NQgU9KSFobMbeL7sbwF9d3EjPTeXUTlSOO-y2JLJv3asW6_0EsDirCo8oOoa4S4_wmjEBfaYL0UT_zhbGT2lNL1QDsaiSAJ7-3r9IlIOyDQVBZczLpSCUbtSsqXYPJx-Z3G6EkOw1ehKZLit-m1eZO5N-oODnEssZS1-Pn1lNUH1L9ZyvAA0Is3w1AkYlX0apmEGt0z1w5kz61SMN8EIZwgwo62s-qX5h",
  },
  {
    id: "post_2",
    title: "Next-Gen Processing Power",
    customer: "TechNova Solutions",
    platform: "Facebook",
    score: 85.1,
    published: "Oct 10, 2023",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRAoFxoFclyaqwMOmMO1aAj2W35PFjDgypf2E8wxBLhuRk6NJHP9AlkcjaBVemk22sIGVzd5gmEzeqyE4affsQzc1VMyy0ICVMq1OJLFUMt0kcrlnP84GyPwQw_6OHQIRNg36cyTXptKu0qL86xdhQvmvP6HmMxkfbRGq5l5HcIZXgxIP4BDsW17b6uarSRCEZFPV38Y6AGas2pDyDcvgpqA-U70iiAFo_xn95JNw-bx-Bk18xsMvfBhmuPn7T3t4QrK9lIivDRVpr",
  },
  {
    id: "post_3",
    title: "A Day in the Life: AI Strategist",
    customer: "Lumina Media",
    platform: "TikTok",
    score: 76.8,
    published: "Oct 08, 2023",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5ng_W8RwW94XGQwNlObL6_ocKc4XcITYuIQwqgfoDSquj27MEJnjc2iGCdF9UPF-yR_9uqpDLm0WMnfHuSSS4zNrztpTeBsO5Ojd7uBnksr80OZ4ZIcjtPuOUsLQtxY18MYo6q8QhxfaHq2Qes_wlXXp4nYuDVOfO9ub4zNdb_Dx1m_DE-rgidFtuFWT7DELAo5MsZ7yLZ3_D1Cp-iGwnqmSLVmxLzWMNpRCsSf7k8-ZQ_1d9OBCXvTJZjCNXblk1dj4kwbeOZ4Sd",
  },
  {
    id: "post_4",
    title: "Leveraging LLMs for Growth",
    customer: "DataPoint SaaS",
    platform: "LinkedIn",
    score: 92.3,
    published: "Oct 05, 2023",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5nPRgY3Ta-1y-Wfyrkpz2XqwjzXEMXhisYFsCdqWhDX5ufzfQYgwLB3tCG0TFdnXx42MVpPq_uUuwB6qveKLjcYc507xGKIHbMMCgN-0PqmgJv15VmrFRzNqLqUMOCAblMDmcWSdy3kFYfxle-nJ8wo1OAsetP20-71KprP9KPBVkBer2oqa4eZ1P74nrTJqfteECHc2JJW4ol_unUce5AsgV80O7xjwjeNr73RWIA6HsJEJdRFkFNTCkoDAUrtZmHGVMz8Tdp10z",
  },
]

export default function Analytics() {
  // ---------------------------------------------------------------------------
  // State variables
  // ---------------------------------------------------------------------------
  const [timeframe, setTimeframe] = useState('month') // 'day' | 'week' | 'month'
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const currentMetrics = METRICS_BY_TIMEFRAME[timeframe]

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleExport = (format) => {
    alert(`Exporting reports as ${format} to downloads folder...`)
    setExportMenuOpen(false)
  }

  // Helper selector for platform network colors and badges
  const getNetworkIcon = (platform) => {
    switch (platform) {
      case 'Instagram':
        return { icon: Instagram, color: 'bg-pink-600 text-white' }
      case 'Facebook':
        return { icon: Facebook, color: 'bg-blue-600 text-white' }
      case 'TikTok':
        return { icon: Music, color: 'bg-black text-white' }
      case 'LinkedIn':
        return { icon: Linkedin, color: 'bg-blue-700 text-white' }
      default:
        return { icon: Activity, color: 'bg-primary text-white' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header Section */}
      <PageHeader
        title="Analytics & Reports"
        description="Real-time data synchronization across all integrated social channels."
        action={
          <div className="flex items-center gap-3">
            {/* Timeframe Switcher */}
            <div className="inline-flex bg-canvas p-1 rounded-control border border-border">
              {['day', 'week', 'month'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={cn(
                    "px-4 py-1.5 rounded-control text-xs font-semibold capitalize transition-all",
                    timeframe === t
                      ? "bg-white shadow-soft text-primary font-bold"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Export Dropdown Button */}
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center gap-1.5"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                <Download size={16} />
                Export
                <ChevronDown size={14} />
              </Button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-surface border border-border rounded-card shadow-lg z-20">
                  <div className="p-1.5 space-y-1">
                    <button
                      onClick={() => handleExport('PDF')}
                      className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-canvas rounded-control text-ink transition-colors"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleExport('Excel')}
                      className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-canvas rounded-control text-ink transition-colors"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => handleExport('CSV')}
                      className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-canvas rounded-control text-ink transition-colors"
                    >
                      CSV Format
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <Card className="p-6 transition-all duration-200 hover:-translate-y-1" hover>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-primary-50 text-primary-700 rounded-control">
              <Users size={18} />
            </span>
            <Badge tone={currentMetrics.customerGrowth.type === 'up' ? 'success' : 'danger'}>
              {currentMetrics.customerGrowth.value === '48' ? '' : ''}
              {currentMetrics.customerGrowth.trend}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Customer Growth</p>
          <h3 className="text-2xl font-bold text-ink mt-1">{currentMetrics.customerGrowth.value}</h3>
          <p className="text-xs text-ink-muted mt-2">vs. last period</p>
        </Card>

        {/* Card 2 */}
        <Card className="p-6 transition-all duration-200 hover:-translate-y-1" hover>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-accent-50 text-accent-600 rounded-control">
              <CreditCard size={18} />
            </span>
            <Badge tone="success">
              {currentMetrics.revenueGrowth.trend}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Revenue Growth</p>
          <h3 className="text-2xl font-bold text-ink mt-1">{currentMetrics.revenueGrowth.value}</h3>
          <p className="text-xs text-ink-muted mt-2">Monthly recurring rev.</p>
        </Card>

        {/* Card 3 */}
        <Card className="p-6 transition-all duration-200 hover:-translate-y-1" hover>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-warning/10 text-warning rounded-control">
              <Activity size={18} />
            </span>
            <Badge tone={currentMetrics.engagementRate.type === 'up' ? 'success' : 'danger'}>
              {currentMetrics.engagementRate.trend}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Engagement Rate</p>
          <h3 className="text-2xl font-bold text-ink mt-1">{currentMetrics.engagementRate.value}</h3>
          <p className="text-xs text-ink-muted mt-2">Avg. across channels</p>
        </Card>

        {/* Card 4 */}
        <Card className="p-6 transition-all duration-200 hover:-translate-y-1" hover>
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-primary-50 text-primary-700 rounded-control">
              <Sparkles size={18} />
            </span>
            <Badge tone="success">
              {currentMetrics.aiUsage.trend}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">AI Usage Volume</p>
          <h3 className="text-2xl font-bold text-ink mt-1">{currentMetrics.aiUsage.value}</h3>
          <p className="text-xs text-ink-muted mt-2">Total generations</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Analytics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-ink">Revenue Analytics</h4>
            <span className="text-ink-muted cursor-pointer"><MoreVertical size={16} /></span>
          </div>
          <div className="h-64 relative flex items-end justify-between gap-3 border-b border-l border-border pb-2 pl-2">
            {currentMetrics.revenueHeights.map((h, index) => (
              <div
                key={index}
                className="flex-1 bg-primary/20 hover:bg-primary transition-all rounded-t-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-3 px-4 text-xs font-medium text-ink-muted">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
          </div>
        </Card>

        {/* Social Media Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-ink">Social Media Performance</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-xs font-medium text-ink-muted">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> FB
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-ink-muted">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" /> IG
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-ink-muted">
                <span className="w-2.5 h-2.5 rounded-full bg-warning" /> TK
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end gap-6 border-b border-l border-border pb-2 pl-2">
            {['Reach', 'Engagement', 'Conversion'].map((metric, idx) => {
              const fbHeight = currentMetrics.socialHeights.fb[idx]
              const igHeight = currentMetrics.socialHeights.ig[idx]
              const tkHeight = currentMetrics.socialHeights.tk[idx]
              return (
                <div key={idx} className="flex-1 h-full flex items-end gap-1">
                  <div className="flex-1 bg-primary rounded-t-sm" style={{ height: `${fbHeight}%` }} />
                  <div className="flex-1 bg-accent rounded-t-sm" style={{ height: `${igHeight}%` }} />
                  <div className="flex-1 bg-warning rounded-t-sm" style={{ height: `${tkHeight}%` }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-3 text-xs font-medium text-ink-muted px-8">
            <span>Reach</span><span>Engagement</span><span>Conversion</span>
          </div>
        </Card>

        {/* Platform Analytics (Donut) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-ink">Platform Analytics</h4>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 h-auto sm:h-64 py-4 sm:py-0">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="15.915" stroke="#F3F4F6" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="15.915"
                  stroke="#4F46E5"
                  strokeWidth="3"
                  strokeDasharray={`${currentMetrics.donut.ent} ${100 - currentMetrics.donut.ent}`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="15.915"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray={`${currentMetrics.donut.pro} ${100 - currentMetrics.donut.pro}`}
                  strokeDashoffset={`-${currentMetrics.donut.ent}`}
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="15.915"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  strokeDasharray={`${currentMetrics.donut.basic} ${100 - currentMetrics.donut.basic}`}
                  strokeDashoffset={`-${currentMetrics.donut.ent + currentMetrics.donut.pro}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-ink">{currentMetrics.donut.total}</span>
                <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">Users</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-ink-muted">Enterprise</span>
                </div>
                <span className="font-semibold text-ink">{currentMetrics.donut.ent}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-ink-muted">Pro Plan</span>
                </div>
                <span className="font-semibold text-ink">{currentMetrics.donut.pro}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-ink-muted">Basic</span>
                </div>
                <span className="font-semibold text-ink">{currentMetrics.donut.basic}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Usage Reports */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-semibold text-ink">AI Usage Reports</h4>
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
              <Zap size={14} />
              System Optimized
            </div>
          </div>
          <div className="h-64 relative border-b border-l border-border pl-2 pb-2">
            {/* Abstract Area Chart using dynamic fill and stroke */}
            <div className="absolute inset-0 flex items-end">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 200">
                <defs>
                  <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${currentMetrics.areaFill}`} fill="url(#areaGradient)" />
                <path d={`${currentMetrics.areaStroke}`} fill="none" stroke="#4F46E5" strokeWidth="2" />
              </svg>
            </div>
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
              <div className="w-full border-t border-ink" />
              <div className="w-full border-t border-ink" />
              <div className="w-full border-t border-ink" />
              <div className="w-full border-t border-ink" />
            </div>
          </div>
          <div className="flex justify-between mt-3 text-xs font-medium text-ink-muted px-4">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </Card>
      </div>

      {/* Top Performing Content Table */}
      <Card className="overflow-hidden p-0 border-border">
        <div className="p-6 flex items-center justify-between border-b border-border">
          <h4 className="text-base font-semibold text-ink">Top Performing Content</h4>
          <button className="text-sm font-semibold text-primary hover:text-primary-700 hover:underline transition-colors">
            View Full Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-canvas border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Post</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Platform</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Engagement Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {INITIAL_CONTENT.map((post) => {
                const plat = getNetworkIcon(post.platform)
                return (
                  <tr key={post.id} className="hover:bg-canvas transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          className="w-12 h-12 rounded-control object-cover border border-border"
                          src={post.thumbnail}
                          alt={post.title}
                        />
                        <span className="font-semibold text-ink text-sm truncate max-w-[200px]" title={post.title}>
                          {post.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink font-medium">
                      {post.customer}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center", plat.color)}>
                          <plat.icon size={12} />
                        </div>
                        <span className="text-sm text-ink-muted font-medium">{post.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-ink">{post.score}</span>
                        <div className="w-24 h-1.5 bg-canvas border border-border rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              post.score >= 90 ? "bg-accent" : "bg-primary"
                            )}
                            style={{ width: `${post.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted">
                      {post.published}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer */}
      <footer className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted border-t border-border gap-4">
        <p>© 2023 Precision AI. All data encrypted and secured.</p>
        <div className="flex items-center gap-6">
          <a className="hover:text-primary transition-colors" href="#">Documentation</a>
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">API Status</a>
        </div>
      </footer>
    </div>
  )
}
