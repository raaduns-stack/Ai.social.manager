import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Award,
  Star,
  Send,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Bell,
  X,
  Filter,
  Image as ImageIcon,
  Heart,
  ChevronLeft,
  ChevronRight,
  Camera,
  Linkedin,
  Youtube,
  Facebook,
  Music,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Loader from '../../components/ui/Loader'
import Banner from '../../components/ui/Banner'
import { getMyDashboardSummary, getMyAnalyticsSummary } from '../../features/dashboard/dashboard-api'
import { useAuthStore } from '../../store/auth-store'
import EmptyState from '../../components/ui/EmptyState'

// ---------------------------------------------------------------------------
// Data — metrics change depending on the selected period filter
// ---------------------------------------------------------------------------
const METRICS_BY_PERIOD = {
  day: {
    label: 'yesterday',
    totalReach: '12,450',
    reachChange: '5.4%',
    engagement: '3.8%',
    engagementChange: '0.2%',
    followerGrowth: 62,
    growthChange: '8.1%',
  },
  week: {
    label: 'this week',
    totalReach: '84,200',
    reachChange: '12.2%',
    engagement: '4.2%',
    engagementChange: '0.5%',
    followerGrowth: 1240,
    growthChange: '14.3%',
  },
  month: {
    label: 'this month',
    totalReach: '324,500',
    reachChange: '18.5%',
    engagement: '4.6%',
    engagementChange: '1.1%',
    followerGrowth: 5310,
    growthChange: '22.4%',
  },
}

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

// ---------------------------------------------------------------------------
// Data — Post Activity tab (published posts, distinct from system activity)
// ---------------------------------------------------------------------------
const POST_ACTIVITY = [
  {
    id: 'post-1',
    platform: 'Instagram',
    caption: 'Product Update: October — carousel post walking through the new dashboard.',
    time: '3h ago',
    likes: 214,
    comments: 18,
  },
  {
    id: 'post-2',
    platform: 'LinkedIn',
    caption: 'Case study: how Client X grew engagement 3x using our AI scheduling tools.',
    time: '1d ago',
    likes: 98,
    comments: 7,
  },
  {
    id: 'post-3',
    platform: 'Twitter',
    caption: 'Quick tip thread on writing hooks that actually stop the scroll.',
    time: '2d ago',
    likes: 156,
    comments: 22,
  },
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function formatDate(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// ---------------------------------------------------------------------------
// DatePicker — click the header badge to open a real calendar grid
// ---------------------------------------------------------------------------
function DatePicker({ selectedDate, onSelectDate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  )
  const containerRef = useRef(null)

  // Close the calendar when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const goToPrevMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const goToNextMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleSelectDay = (day) => {
    const picked = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
    onSelectDate(picked)
    setIsOpen(false)
  }

  const handleToggleOpen = () => {
    if (!isOpen) {
      // Reset the visible month to match the currently selected date each time it opens
      setViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
    setIsOpen((prev) => !prev)
  }

  // Build the grid: leading blanks + day numbers for the visible month
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const today = new Date()

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggleOpen}
        className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-control text-ink-muted shadow-soft hover:border-primary-200 transition-colors"
      >
        <Calendar size={18} />
        <span className="text-sm font-medium text-ink">{formatDate(selectedDate)}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-card shadow-lg z-50 p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded-control text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-semibold text-ink">
              {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </p>
            <button
              onClick={goToNextMonth}
              className="p-1.5 rounded-control text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="text-center text-[11px] font-medium text-ink-muted py-1">
                {label}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarCells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />

              const cellDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
              const isSelected = isSameDay(cellDate, selectedDate)
              const isToday = isSameDay(cellDate, today)

              return (
                <button
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  className={`w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-full transition-colors ${isSelected
                      ? 'bg-primary text-white font-semibold'
                      : isToday
                        ? 'text-primary font-semibold hover:bg-primary-50'
                        : 'text-ink hover:bg-canvas'
                    }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Quick action */}
          <div className="mt-3 pt-3 border-t border-border">
            <button
              onClick={() => {
                onSelectDate(new Date())
                setIsOpen(false)
              }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Jump to Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * DashboardHome page component converted from Stitch-generated HTML design.
 * Renders inside DashboardLayout.
 */
export default function DashboardHome() {
  const user = useAuthStore((state) => state.user)
  const [connectedAccountsCount, setConnectedAccountsCount] = useState(0)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getMyAnalyticsSummary()
        setConnectedAccountsCount(data.connectedAccountsCount)
      } catch (err) {
        console.error('Failed to load analytics summary:', err)
      } finally {
        setLoadingAnalytics(false)
      }
    }
    fetchAnalytics()
  }, [])

  // Header calendar filter — defaults to the current date
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Dashboard period filter — drives the Quick Stats row
  const [period, setPeriod] = useState('week')
  const metrics = METRICS_BY_PERIOD[period]

  // Business info onboarding banner — dismissible, and auto-hides once complete
  const [businessInfoComplete, setBusinessInfoComplete] = useState(() => {
    return localStorage.getItem('businessInfoComplete') === 'true'
  })
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const showBusinessBanner = !businessInfoComplete && !bannerDismissed
  const navigate = useNavigate()

  const handleCompleteBusinessProfile = () => {
    navigate('/dashboard/settings')
  }
  // Activity section tabs — only one tab's content shows at a time
  const [activityTab, setActivityTab] = useState('recent') // 'recent' | 'posts'

  // Summary states for active subscription widget
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const data = await getMyDashboardSummary()
        setSummary(data)
      } catch (err) {
        console.error('Failed to load dashboard summary:', err)
        setSummaryError('Failed to load active plan details.')
      } finally {
        setLoadingSummary(false)
      }
    }
    fetchSummary()
  }, [])

  useEffect(() => {
    const checkBusinessProfile = () => {
      setBusinessInfoComplete(
        localStorage.getItem('businessInfoComplete') === 'true'
      )
    }

    checkBusinessProfile()

    window.addEventListener('focus', checkBusinessProfile)

    return () => window.removeEventListener('focus', checkBusinessProfile)
  }, [])
  return (
    <div className="space-y-6">
      {/* Plan Status Banner */}
      {!loadingSummary && !summaryError && (
        <Banner 
          planId={summary?.activeSubscription?.planId} 
          planName={summary?.activeSubscription?.planName} 
        />
      )}

      {/* Header Section */}
      <PageHeader
        title="Workspace Overview"
        description={user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Welcome back'}
        action={<DatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />}
      />

      {/* Business Information Onboarding Banner */}
      {showBusinessBanner && (
        <Card className="p-4 flex items-center justify-between gap-4 border-primary-100 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Complete your business information</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Step 2 of onboarding — add your business details so we can tailor your AI suggestions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Wire this up to your real onboarding flow/route */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompleteBusinessProfile}
            >
              Complete Now
            </Button>
            <button
              onClick={() => setBannerDismissed(true)}
              title="Dismiss"
              className="text-ink-muted hover:text-ink transition-colors p-1.5 rounded-control hover:bg-canvas"
            >
              <X size={16} />
            </button>
          </div>
        </Card>
      )}



      {loadingAnalytics ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader />
          <p className="text-sm text-ink-muted">Loading workspace data...</p>
        </div>
      ) : connectedAccountsCount === 0 ? (
        <div className="max-w-4xl mx-auto py-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Welcome Card */}
          <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-surface to-primary/5 shadow-lg relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary-700 text-xs font-semibold">
                  <Sparkles size={14} className="animate-spin duration-1000" />
                  <span>Welcome to Raasocial</span>
                </div>
                
                <h2 className="text-3xl font-extrabold text-ink tracking-tight">
                  Let's set up your workspace, {user?.fullName ? user.fullName.split(' ')[0] : 'there'}! 
                </h2>
                
                <p className="text-sm text-ink-muted leading-relaxed">
                  To start automating your posts, generating AI captions, creating stunning brand images, and tracking engagement metrics, you need to connect your social media accounts first.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/dashboard/channels')}
                    className="font-semibold px-6 py-3 shadow-md hover:shadow-lg transition-all"
                  >
                    Connect a Channel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard/settings')}
                    className="font-semibold px-6 cursor-pointer"
                  >
                    View Settings
                  </Button>
                </div>
              </div>

              {/* Supported Platforms Preview */}
              <div className="w-full md:w-80 grid grid-cols-3 gap-3 bg-surface/50 p-4 rounded-xl border border-border backdrop-blur-sm">
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-canvas transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#E1306C]/10 text-[#E1306C] flex items-center justify-center">
                    <Camera size={20} />
                  </div>
                  <span className="text-xs font-semibold text-ink">Instagram</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-canvas transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center">
                    <Linkedin size={20} />
                  </div>
                  <span className="text-xs font-semibold text-ink">LinkedIn</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-canvas transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#000000]/10 text-ink flex items-center justify-center">
                    <span className="font-bold text-sm">X</span>
                  </div>
                  <span className="text-xs font-semibold text-ink">Twitter</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-canvas transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#000000]/10 text-ink flex items-center justify-center">
                    <Music size={20} />
                  </div>
                  <span className="text-xs font-semibold text-ink">TikTok</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-canvas transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center">
                    <Facebook size={20} />
                  </div>
                  <span className="text-xs font-semibold text-ink">Facebook</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-canvas transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#FF0000]/10 text-[#FF0000] flex items-center justify-center">
                    <Youtube size={20} />
                  </div>
                  <span className="text-xs font-semibold text-ink">YouTube</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Setup Steps Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink text-center">Your Setup Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <Card className="p-6 border-2 border-primary bg-primary/5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1</span>
                    <Badge tone="primary" className="animate-pulse">Active</Badge>
                  </div>
                  <h4 className="text-base font-bold text-ink">Link Channels</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Connect your professional social media pages via secure OAuth 2.0 to grant scheduling access.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dashboard/channels')}
                  className="w-full mt-4 font-semibold cursor-pointer"
                >
                  Link Now
                </Button>
              </Card>

              {/* Step 2 */}
              <Card className="p-6 border-dashed border-border opacity-70 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Step 2</span>
                    <span className="text-xs text-ink-muted">Locked</span>
                  </div>
                  <h4 className="text-base font-bold text-ink">Create First Post</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Use our AI content suite to generate professional captions, hashtags, and images instantly.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full mt-4 font-semibold"
                >
                  Locked
                </Button>
              </Card>

              {/* Step 3 */}
              <Card className="p-6 border-dashed border-border opacity-70 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Step 3</span>
                    <span className="text-xs text-ink-muted">Locked</span>
                  </div>
                  <h4 className="text-base font-bold text-ink">Analyze Results</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Track engagement rates, follower demographics, and post performance to refine your strategy.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full mt-4 font-semibold"
                >
                  Locked
                </Button>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Period Filter */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">Quick Stats</h4>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-control px-3 py-1.5 shadow-soft">
          <Filter size={14} className="text-ink-muted" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm font-medium text-ink bg-transparent focus:outline-none cursor-pointer"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Stats Row — values driven by the period filter above */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Card 1 */}
        <Card className="p-6 border-t-4 border-t-primary flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/5 rounded-control text-primary">
                <Send size={20} />
              </div>
              <Badge tone="success" className="gap-1 text-xs font-semibold">
                <TrendingUp size={12} />
                +{metrics.reachChange}
              </Badge>
            </div>
            <p className="text-ink-muted text-xs font-medium mb-1">Total Reach</p>
          </div>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-extrabold text-ink font-headline-lg leading-none">
              {metrics.totalReach}
            </p>
            <div className="h-8 w-24 shrink-0">
              <svg className="w-full h-full text-primary" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M0 25 Q 15 15, 30 20 T 60 10 T 90 5 T 100 2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0 25 Q 15 15, 30 20 T 60 10 T 90 5 T 100 2 L 100 30 L 0 30 Z" fill="rgba(255, 102, 0, 0.08)" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-ink-muted mt-2">{metrics.label}</p>
        </Card>

        {/* Stats Card 2 */}
        <Card className="p-6 border-t-4 border-t-secondary flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-secondary/5 rounded-control text-secondary">
                <Zap size={20} />
              </div>
              <Badge tone="success" className="gap-1 text-xs font-semibold">
                <TrendingUp size={12} />
                +{metrics.engagementChange}
              </Badge>
            </div>
            <p className="text-ink-muted text-xs font-medium mb-1">Avg. Engagement</p>
          </div>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-extrabold text-ink font-headline-lg leading-none">
              {metrics.engagement}
            </p>
            <div className="h-8 w-24 shrink-0">
              <svg className="w-full h-full text-secondary" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M0 20 Q 20 28, 40 10 T 70 15 T 100 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0 20 Q 20 28, 40 10 T 70 15 T 100 5 L 100 30 L 0 30 Z" fill="rgba(249, 87, 0, 0.08)" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-ink-muted mt-2">{metrics.label}</p>
        </Card>

        {/* Stats Card 3 */}
        <Card className="p-6 border-t-4 border-t-primary flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/5 rounded-control text-primary">
                <Users size={20} />
              </div>
              <Badge tone="success" className="gap-1 text-xs font-semibold">
                <TrendingUp size={12} />
                +{metrics.growthChange}
              </Badge>
            </div>
            <p className="text-ink-muted text-xs font-medium mb-1">Follower Growth</p>
          </div>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-extrabold text-ink font-headline-lg leading-none">
              {metrics.followerGrowth.toLocaleString()}
            </p>
            <div className="h-8 w-24 shrink-0">
              <svg className="w-full h-full text-primary" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M0 28 C 20 25, 45 10, 65 18 C 80 8, 90 2, 100 0" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0 28 C 20 25, 45 10, 65 18 C 80 8, 90 2, 100 0 L 100 30 L 0 30 Z" fill="rgba(255, 102, 0, 0.08)" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-ink-muted mt-2">followers {metrics.label}</p>
        </Card>
      </div>

      <div className="flex justify-end -mt-2">
        <Button variant="ghost" className="text-primary hover:text-primary-700 font-semibold gap-1 hover:bg-transparent px-0">
          View Full Analytics <ArrowRight size={16} />
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (Wide) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Connected Channels */}
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
              <h4 className="text-base font-semibold text-ink">Connected Channels</h4>
              <Button variant="ghost" className="text-primary hover:text-primary-700 hover:bg-transparent font-semibold p-0 h-auto">
                + Connect New
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Instagram */}
              <div className="p-6 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center relative bg-canvas">
                  <img
                    className="w-6 h-6 object-contain"
                    alt="Instagram Logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC65sd9d0ewBp_0q0rSnjKRWITCol8waaQvmAaj8HyH-0T2k2zkxP0kyyaTbSaIlrifCFbZVIe1cS_REa8EtPBAQXo_qIXGarLFlcdTp_o3NHWbkpFFa1N6O4EyflkHRiDl_NHVIf48vX3eNMQl6j8DSPfufkL1oxR4FwdzGGlaSWSXjZbps6RCagv7mWgCG6fWs2FpDFjlC61sVMF28SmQ4eiF6EhqrIZTArKyJA7Es0LrDJsmGeBZ7ofoOxFsXPMx4qa9KpUYqzuj"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-surface rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-ink">Instagram</p>
                <p className="text-xs text-ink-muted">Active</p>
              </div>

              {/* LinkedIn */}
              <div className="p-6 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center relative bg-canvas">
                  <img
                    className="w-6 h-6 object-contain"
                    alt="LinkedIn Logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT9ZbMB0Ci_mRsvi41klDxAmIP8OuXS9rZaP9yQlc7nMIeG1KKFpgsQ6SQLT64KBSIj_1J1g9Lp91gp5d83iM2lVcKoZQC2hGEmG6rbWYoDATtommdy8hdmI3dQl20OluPCshZlL9Irg4NHY5UHpzwc-ldTXcl6UkbgjBeokBuYSv1VIKC9orlbiVCPEWFdb4gyVMYB4mC7-aBmbfl4uRVyJKXKW2bjPx_JvDZTIE2t3dQvjsjz52yrm_5-C3p_y8VLL807xsTP_GB"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-surface rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-ink">LinkedIn</p>
                <p className="text-xs text-ink-muted">Active</p>
              </div>

              {/* Twitter */}
              <div className="p-6 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center relative bg-canvas">
                  <img
                    className="w-6 h-6 object-contain"
                    alt="Twitter Logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuABU12EZeRYocqGNuQn0F7mlEf8Dz5S2r8t_TkAdMOeaIwlO_00FQbVGlXbP51aTsVkI34TfGDMktbAt90kvCx9b-_BgC8QRf-xGPRC8-2TcfEPwpwH_Zq9j3TwNpW00gVqPwf6ek7d1Zo6Lw8zAk7vi3VXv_WfTRsVvkUYIIMtHsRVQC7bIV3W0J1aDxzaNlzFmhia5X1tDwsdhspRrKEi_gm8lfr1jz60TUVKedhBSHmf_UF7AC67EWz6Lh1wqbPD1M0EIy98XDsI"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-surface rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-ink">Twitter</p>
                <p className="text-xs text-ink-muted">Active</p>
              </div>

              {/* TikTok */}
              <div className="p-6 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center relative bg-canvas">
                  <img
                    className="w-6 h-6 object-contain"
                    alt="TikTok Logo"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPVxhmGoGxIGcEL74ib0vKCIuC-aDj0KuU_VRMUaY53kIngDvi5P506MO8BPItUpP5HXyMIJRQm4dpg_tEQpdqNQ8KTVMTVgAdOIiJMFlTv42dOCvu6hWeLoXW3ItU0TCzXpOXFXO614LHyAVTHpx7Xt68uS0F4bHP4hF_haxNfq9KRxZ_af83SOBrNrCCw6SH6ACjQyfPCkYWA7FLdsVN7rqW4eHYBLr5NfT_oDaIVHFKgeNnVyIBchzaEmhjq0XCE6pZke4ZloM0"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-danger border-2 border-surface rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-ink">TikTok</p>
                <Badge tone="danger">Re-auth needed</Badge>
              </div>
            </div>
          </Card>

          {/* Activity Section — tabbed: Recent Activity / Post Activity */}
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border bg-surface flex items-center gap-6">
              <button
                onClick={() => setActivityTab('recent')}
                className={`text-sm font-semibold pb-1 border-b-2 -mb-4 transition-colors ${activityTab === 'recent'
                    ? 'text-primary border-primary'
                    : 'text-ink-muted border-transparent hover:text-ink'
                  }`}
              >
                Recent Activity
              </button>
              <button
                onClick={() => setActivityTab('posts')}
                className={`text-sm font-semibold pb-1 border-b-2 -mb-4 transition-colors ${activityTab === 'posts'
                    ? 'text-primary border-primary'
                    : 'text-ink-muted border-transparent hover:text-ink'
                  }`}
              >
                Post Activity
              </button>
            </div>
            <div className="divide-y divide-border">
              <div className="p-6 hover:bg-canvas transition-colors flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 text-primary-600 flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-ink">Post Scheduled</p>
                    <span className="text-xs text-ink-muted">10m ago</span>
                  </div>
                  <p className="text-sm text-ink-muted truncate md:whitespace-normal">
                    "Product Update: October" scheduled for Instagram and Twitter for tomorrow at 10:00 AM.
                  </p>
                </div>
              </div>

              <div className="p-6 hover:bg-canvas transition-colors flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-ink">AI Suggestion Generated</p>
                    <span className="text-xs text-ink-muted">2h ago</span>
                  </div>
                  <p className="text-sm text-ink-muted truncate md:whitespace-normal">
                    New caption ideas and optimal posting times calculated for your LinkedIn campaign.
                  </p>
                </div>
              </div>

              <div className="p-6 hover:bg-canvas transition-colors flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-canvas text-ink-muted flex items-center justify-center shrink-0">
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-ink">New Comment Received</p>
                    <span className="text-xs text-ink-muted">5h ago</span>
                  </div>
                  <p className="text-sm text-ink-muted truncate md:whitespace-normal">
                    A user commented "Love this update!" on your most recent Instagram Reel.
                  </p>
                </div>
              </div>
            </div>


            {/* Post Activity tab content */}
            {activityTab === 'posts' && (
              <div className="divide-y divide-border">
                {POST_ACTIVITY.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-canvas transition-colors flex items-start gap-4">
                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 text-primary-600 flex items-center justify-center shrink-0">
                      <ImageIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-ink">{post.platform}</p>
                        <span className="text-xs text-ink-muted">{post.time}</span>
                      </div>
                      <p className="text-sm text-ink-muted truncate md:whitespace-normal">{post.caption}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Heart size={12} /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} /> {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-canvas border-t border-border">
              <Button variant="ghost" className="w-full text-ink-muted hover:text-ink font-medium h-12 rounded-none hover:bg-canvas/50">
                {activityTab === 'recent' ? 'View All Activity' : 'View All Posts'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Kleos Intelligence Recommendations */}
          <Card className="overflow-hidden flex flex-col p-0 border border-primary/20 bg-gradient-to-br from-surface to-primary/5">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h4 className="text-base font-semibold text-ink">Kleos Intelligence</h4>
              </div>
              <Badge tone="primary">AI Strategy</Badge>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-ink-muted leading-relaxed">
                Based on your business context and active channel engagement, our LLM recommends targeting these industry tags for maximum visibility:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { tag: '#SaaSGrowth', weight: 'High impact' },
                  { tag: '#AIAutomation', weight: 'Trending' },
                  { tag: '#SocialStrategy', weight: 'Optimal reach' },
                  { tag: '#TechHooks', weight: 'High engagement' },
                  { tag: '#StartupMarketing', weight: 'Growing' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-primary/20 rounded-full shadow-soft text-xs transition-transform hover:scale-105">
                    <span className="font-semibold text-primary">{item.tag}</span>
                    <span className="text-[10px] text-ink-muted border-l border-border pl-1.5">{item.weight}</span>
                  </div>
                ))}
              </div>
              <div className="bg-surface/50 border border-border rounded-control p-3 flex items-start gap-2.5">
                <Zap size={16} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink">Optimal Posting Window</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Your audience is most active on LinkedIn between **2:00 PM – 4:00 PM EST** on Tuesdays.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden flex flex-col p-0">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface">
              <h4 className="text-base font-semibold text-ink">Notifications</h4>
              <Badge tone="primary" className="bg-primary-600 text-white font-bold text-[10px]">
                4 NEW
              </Badge>
            </div>
            <div className="flex-1 divide-y divide-border/60">
              {/* Notification Item 1 */}
              <div className="p-6 bg-primary/5">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Weekly Report Ready</p>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Your social performance report for Jul 13-20 is now available for download.
                    </p>
                    <Button variant="ghost" className="mt-3 text-primary hover:text-primary-700 hover:bg-transparent font-semibold p-0 h-auto">
                      View Report
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notification Item 2 */}
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-transparent mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">Low Token Alert</p>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      You have used 85% of your AI generation tokens for this month.
                    </p>
                    <Button variant="ghost" className="mt-3 text-primary hover:text-primary-700 hover:bg-transparent font-semibold p-0 h-auto">
                      Add Tokens
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notification Item 3 */}
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-transparent mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">System Maintenance</p>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Scheduled downtime for Saturday at 2:00 AM UTC (30 mins expected).
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Item 4 */}
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-transparent mt-2 shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-ink">New Feature: Reels Auto-Draft</p>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      You can now automatically convert trending sounds into draft reels.
                    </p>
                    <Button variant="ghost" className="mt-3 text-primary hover:text-primary-700 hover:bg-transparent font-semibold p-0 h-auto">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-canvas border-t border-border">
              <Button variant="ghost" className="w-full text-ink-muted hover:text-ink font-medium h-12 rounded-none hover:bg-canvas/50">
                Clear All Notifications
              </Button>
            </div>
          </Card>
        </div>
      </div>
        </>
      )}
    </div>
  )
}