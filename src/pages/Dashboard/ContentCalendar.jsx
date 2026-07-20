import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  Camera,
  Linkedin,
  Twitter,
  Music,
  Share2,
  Trash2,
  Send,
  Eye,
  List,
  Grid,
  CalendarDays,
  Tag,
  TrendingUp,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'

// Initial Scheduled Posts Data
const initialPosts = [
  {
    id: 1,
    title: '5 Steps to Automate Your Workflow',
    caption:
      "Efficiency isn't just about doing more; it's about doing what matters. Check out these 5 automation hacks that saved our team 20+ hours a week. Which one are you trying first? 👇",
    platform: 'Instagram',
    status: 'Scheduled',
    date: '2026-07-20',
    time: '10:00 AM',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    hashtags: ['#productivity', '#SaaS', '#WorkflowAutomation'],
    aiGenerated: true,
  },
  {
    id: 2,
    title: 'The Future of AI in Content Creation',
    caption:
      "AI isn't replacing creators; it's empowering them. 🚀 We analyzed the latest engagement data—here's what you need to know about the current shift in content strategies.",
    platform: 'X / Twitter',
    status: 'Published',
    date: '2026-07-18',
    time: '02:30 PM',
    image:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
    hashtags: ['#AI', '#ContentStrategy', '#SocialMediaTrends'],
    aiGenerated: true,
  },
  {
    id: 3,
    title: 'Behind the Scenes at Product Launch',
    caption:
      "Behind every 'perfect' post is a whole lot of chaos. ☕️ Tag someone who needs to see the unedited version of building a startup!",
    platform: 'TikTok',
    status: 'Scheduled',
    date: '2026-07-21',
    time: '04:00 PM',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    hashtags: ['#BTS', '#StartupLife', '#CreativeProcess'],
    aiGenerated: false,
  },
  {
    id: 4,
    title: "Why 'Quantity' is No Longer King in B2B",
    caption:
      "Stop chasing the algorithm and start chasing your audience's needs. 🎯 In 2026, one 'perfect' post is worth 100 'good enough' ones. Here is why focus is your new superpower.",
    platform: 'LinkedIn',
    status: 'Scheduled',
    date: '2026-07-22',
    time: '09:15 AM',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    hashtags: ['#LinkedInTips', '#ThoughtLeadership', '#MarketingStrategy'],
    aiGenerated: true,
  },
  {
    id: 5,
    title: 'Transforming Social Analytics into Real ROI',
    caption:
      'Turn raw data into real ROI. 📊 Our latest dashboard update gives you real-time insights with zero noise. Check the link in bio for early access!',
    platform: 'Instagram',
    status: 'Scheduled',
    date: '2026-07-24',
    time: '11:00 AM',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    hashtags: ['#SocialMediaTools', '#Analytics', '#Growth'],
    aiGenerated: true,
  },
  {
    id: 6,
    title: '3 Key Takeaways from Q3 Social Engagement',
    caption:
      'B2B social distribution is changing fast. Here are 3 non-obvious lessons we learned from publishing 500+ posts across accounts this quarter.',
    platform: 'LinkedIn',
    status: 'Published',
    date: '2026-07-16',
    time: '01:00 PM',
    image:
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
    hashtags: ['#B2BMarketing', '#GrowthStrategy'],
    aiGenerated: false,
  },
  {
    id: 7,
    title: 'Community Q&A Announcement',
    caption:
      'We are live this Friday answering all your questions about multi-channel content scaling! Drop your questions below 👇',
    platform: 'X / Twitter',
    status: 'Scheduled',
    date: '2026-07-25',
    time: '03:45 PM',
    image:
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80',
    hashtags: ['#AMA', '#Community', '#LiveStream'],
    aiGenerated: true,
  },
  {
    id: 8,
    title: 'Productivity Hacks for Content Managers',
    caption:
      'Short reels on how to batch produce 30 days of social content in 4 hours using AI assistants and smart templates.',
    platform: 'TikTok',
    status: 'Scheduled',
    date: '2026-07-26',
    time: '06:00 PM',
    image:
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
    hashtags: ['#Productivity', '#ContentCreation', '#TikTokTips'],
    aiGenerated: true,
  },
]

const platformsList = ['Instagram', 'LinkedIn', 'X / Twitter', 'TikTok']
const statusesList = ['Scheduled', 'Published']

// Helper component for Platform Badges
function PlatformBadge({ platform, showName = true, className = '' }) {
  let icon = <Share2 size={12} />
  let colorClasses = 'bg-primary-50 text-primary-700 border-primary-200'

  if (platform === 'Instagram') {
    icon = <Camera size={12} />
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200'
  } else if (platform === 'LinkedIn') {
    icon = <Linkedin size={12} />
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200'
  } else if (platform === 'X / Twitter') {
    icon = <Twitter size={12} />
    colorClasses = 'bg-slate-100 text-slate-800 border-slate-300'
  } else if (platform === 'TikTok') {
    icon = <Music size={12} />
    colorClasses = 'bg-cyan-50 text-cyan-800 border-cyan-200'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${colorClasses} ${className}`}
    >
      {icon}
      {showName && <span>{platform}</span>}
    </span>
  )
}

// Helper component for Status Badges
function StatusBadge({ status }) {
  if (status === 'Published') {
    return (
      <Badge tone="success" className="gap-1 font-bold text-[10px] uppercase tracking-wider">
        <CheckCircle2 size={11} /> Published
      </Badge>
    )
  }
  return (
    <Badge tone="primary" className="gap-1 font-bold text-[10px] uppercase tracking-wider">
      <Clock size={11} /> Scheduled
    </Badge>
  )
}

export default function ContentCalendar() {
  const [posts, setPosts] = useState(initialPosts)
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week' | 'list'
  const [activePlatform, setActivePlatform] = useState('All')
  const [activeStatus, setActiveStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Navigation state (simulating July 2026 calendar)
  const [currentMonth, setCurrentMonth] = useState('July 2026')

  // Modal States
  const [selectedPost, setSelectedPost] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newPostData, setNewPostData] = useState({
    title: '',
    caption: '',
    platform: 'Instagram',
    status: 'Scheduled',
    date: '2026-07-20',
    time: '10:00 AM',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    hashtags: '#marketing, #ai',
  })

  // Filtering posts
  const filteredPosts = posts.filter((post) => {
    const matchesPlatform = activePlatform === 'All' || post.platform === activePlatform
    const matchesStatus = activeStatus === 'All' || post.status === activeStatus
    const matchesSearch =
      searchQuery.trim() === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.caption.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesPlatform && matchesStatus && matchesSearch
  })

  // Stats computation
  const totalScheduled = posts.filter((p) => p.status === 'Scheduled').length
  const totalPublished = posts.filter((p) => p.status === 'Published').length

  const handleCreatePost = (e) => {
    e.preventDefault()
    if (!newPostData.title) return

    const newPost = {
      id: Date.now(),
      title: newPostData.title,
      caption: newPostData.caption,
      platform: newPostData.platform,
      status: newPostData.status,
      date: newPostData.date,
      time: newPostData.time,
      image: newPostData.image,
      hashtags: newPostData.hashtags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      aiGenerated: false,
    }

    setPosts([newPost, ...posts])
    setIsCreateModalOpen(false)
    setNewPostData({
      title: '',
      caption: '',
      platform: 'Instagram',
      status: 'Scheduled',
      date: '2026-07-20',
      time: '10:00 AM',
      image:
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      hashtags: '#marketing, #ai',
    })
  }

  const handleDeletePost = (id) => {
    setPosts(posts.filter((p) => p.id !== id))
    setSelectedPost(null)
  }

  // Days of July 2026 simulation (July 1 - July 31, starting on Wednesday)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1)
  const monthStartOffset = 3 // Wednesday offset in Sun-Sat grid

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Content Calendar"
        description="Central planning hub for multi-channel post scheduling and AI publishing strategies."
      />

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-surface border-l-4 border-l-primary shadow-soft">
          <div className="p-3 bg-primary-50 text-primary-700 rounded-control">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">Scheduled</p>
            <h4 className="text-xl font-bold text-ink">{totalScheduled} Posts</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-surface border-l-4 border-l-accent shadow-soft">
          <div className="p-3 bg-accent-50 text-accent-600 rounded-control">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">Published</p>
            <h4 className="text-xl font-bold text-ink">{totalPublished} Posts</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-surface border-l-4 border-l-ink-muted shadow-soft">
          <div className="p-3 bg-gray-100 text-ink-muted rounded-control">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">Connected</p>
            <h4 className="text-xl font-bold text-ink">4 Platforms</h4>
          </div>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <Card className="p-4 space-y-4 bg-surface shadow-soft">
        {/* Top Controls: Date Navigator & View Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Date Navigator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-control bg-canvas overflow-hidden">
              <button
                type="button"
                className="p-2 text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-1.5 text-sm font-bold text-ink border-x border-border">
                {currentMonth}
              </span>
              <button
                type="button"
                className="p-2 text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <Button variant="outline" size="sm" className="text-xs font-semibold">
              Today
            </Button>
          </div>

          {/* Search & View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="text"
                placeholder="Search schedule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-border rounded-control bg-canvas text-ink focus:outline-none focus:border-primary"
              />
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center border border-border rounded-control bg-canvas p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-control text-xs font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-surface text-primary shadow-soft'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Grid size={14} />
                <span>Month</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-control text-xs font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-surface text-primary shadow-soft'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <CalendarDays size={14} />
                <span>Week</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-control text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-surface text-primary shadow-soft'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <List size={14} />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills: Platforms & Statuses */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          {/* Platforms Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider mr-1">
              Platform:
            </span>
            {['All', ...platformsList].map((plat) => (
              <Button
                key={plat}
                type="button"
                variant={activePlatform === plat ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActivePlatform(plat)}
                className="rounded-full text-xs font-semibold py-0.5 h-7"
              >
                {plat}
              </Button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider mr-1">
              Status:
            </span>
            {['All', ...statusesList].map((st) => (
              <Button
                key={st}
                type="button"
                variant={activeStatus === st ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus(st)}
                className="rounded-full text-xs font-semibold py-0.5 h-7"
              >
                {st}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* MONTH VIEW GRID */}
      {viewMode === 'month' && (
        <Card className="p-4 bg-surface shadow-soft overflow-x-auto">
          {/* Calendar Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-ink-muted uppercase tracking-wider pb-3 border-b border-border min-w-[700px]">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2 pt-2 min-w-[700px]">
            {/* Blank offset cells for start of month */}
            {Array.from({ length: monthStartOffset }).map((_, idx) => (
              <div
                key={`offset-${idx}`}
                className="min-h-[110px] p-2 bg-canvas/30 rounded-control border border-transparent opacity-40"
              />
            ))}

            {/* Month Day Cells */}
            {daysInMonth.map((dayNum) => {
              const dateString = `2026-07-${dayNum < 10 ? '0' + dayNum : dayNum}`
              const dayPosts = filteredPosts.filter((p) => p.date === dateString)
              const isToday = dayNum === 20

              return (
                <div
                  key={dayNum}
                  className={`min-h-[120px] p-2 rounded-control border flex flex-col gap-1.5 transition-colors ${
                    isToday
                      ? 'bg-primary-50/40 border-primary-300 shadow-soft'
                      : 'bg-canvas/60 border-border/60 hover:bg-surface'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isToday ? 'bg-primary text-white shadow-soft' : 'text-ink'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayPosts.length > 0 && (
                      <span className="text-[10px] font-bold text-ink-muted">
                        {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}
                      </span>
                    )}
                  </div>

                  {/* Scheduled Posts in Day */}
                  <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-0.5">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="p-1.5 rounded bg-surface border border-border/80 hover:border-primary/50 shadow-soft cursor-pointer transition-all duration-200 group flex items-start gap-1.5"
                      >
                        {/* Thumbnail */}
                        {post.image && (
                          <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-canvas border border-border/40">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <PlatformBadge platform={post.platform} showName={false} />
                            <span className="text-[9px] font-medium text-ink-muted truncate">
                              {post.time}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-ink truncate leading-tight mt-0.5 group-hover:text-primary transition-colors">
                            {post.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* WEEK VIEW COLUMNS */}
      {viewMode === 'week' && (
        <Card className="p-4 bg-surface shadow-soft overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[900px]">
            {[
              { day: 'Mon', date: 'Jul 20', dateStr: '2026-07-20' },
              { day: 'Tue', date: 'Jul 21', dateStr: '2026-07-21' },
              { day: 'Wed', date: 'Jul 22', dateStr: '2026-07-22' },
              { day: 'Thu', date: 'Jul 23', dateStr: '2026-07-23' },
              { day: 'Fri', date: 'Jul 24', dateStr: '2026-07-24' },
              { day: 'Sat', date: 'Jul 25', dateStr: '2026-07-25' },
              { day: 'Sun', date: 'Jul 26', dateStr: '2026-07-26' },
            ].map(({ day, date, dateStr }) => {
              const dayPosts = filteredPosts.filter((p) => p.date === dateStr)
              const isToday = day === 'Mon'

              return (
                <div key={day} className="space-y-3">
                  {/* Day Column Header */}
                  <div
                    className={`p-2.5 text-center rounded-control border ${
                      isToday
                        ? 'bg-primary text-white border-primary shadow-soft'
                        : 'bg-canvas text-ink border-border'
                    }`}
                  >
                    <p className="text-xs uppercase font-bold opacity-80">{day}</p>
                    <p className="text-sm font-extrabold">{date}</p>
                  </div>

                  {/* Day Column Cards */}
                  <div className="space-y-3 min-h-[350px]">
                    {dayPosts.length === 0 ? (
                      <div className="h-full p-4 border border-dashed border-border rounded-control flex items-center justify-center text-center text-xs text-ink-muted">
                        No posts
                      </div>
                    ) : (
                      dayPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="p-3 rounded-control bg-surface border border-border hover:border-primary/50 shadow-soft cursor-pointer transition-all duration-200 space-y-2 group"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <PlatformBadge platform={post.platform} />
                            <StatusBadge status={post.status} />
                          </div>

                          {post.image && (
                            <div className="w-full aspect-video rounded overflow-hidden bg-canvas border border-border/40">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}

                          <div>
                            <h5 className="text-xs font-bold text-ink line-clamp-1 group-hover:text-primary">
                              {post.title}
                            </h5>
                            <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5 italic">
                              "{post.caption}"
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-ink-muted pt-1 border-t border-border/30">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock size={10} /> {post.time}
                            </span>
                            {post.aiGenerated && (
                              <span className="text-primary font-bold flex items-center gap-0.5">
                                <Sparkles size={10} /> AI Post
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}


      {/* LIST / AGENDA VIEW */}
      {viewMode === 'list' && (
        <Card className="p-4 bg-surface shadow-soft space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-ink-muted space-y-2">
              <CalendarIcon size={32} className="mx-auto text-ink-muted opacity-50" />
              <p className="text-sm font-semibold">No scheduled posts found.</p>
              <p className="text-xs">Try selecting a different filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-canvas/50 px-2 rounded-control transition-colors"
                >
                  {/* Left Side: Thumbnail & Text Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {post.image && (
                      <div className="w-16 h-16 rounded-control shrink-0 overflow-hidden bg-canvas border border-border">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PlatformBadge platform={post.platform} />
                        <StatusBadge status={post.status} />
                        <span className="text-xs text-ink-muted font-medium flex items-center gap-1">
                          <CalendarDays size={12} /> {post.date} at {post.time}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-ink leading-snug truncate">
                        {post.title}
                      </h4>
                      <p className="text-xs text-ink-muted line-clamp-1 italic">
                        "{post.caption}"
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPost(post)}
                      className="gap-1 text-xs"
                    >
                      <Eye size={14} />
                      <span>Preview</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-danger hover:bg-red-50"
                      title="Delete Post"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* POST DETAIL / PREVIEW MODAL */}
      {selectedPost && (
        <Modal
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          title="Scheduled Post Details"
        >
          <div className="space-y-4 pt-1">
            {/* Header Badges */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={selectedPost.platform} />
                <StatusBadge status={selectedPost.status} />
              </div>
              <span className="text-xs font-semibold text-ink-muted flex items-center gap-1">
                <Clock size={12} className="text-primary" />
                {selectedPost.date} • {selectedPost.time}
              </span>
            </div>

            {/* Post Image Thumbnail */}
            {selectedPost.image && (
              <div className="w-full aspect-video rounded-control overflow-hidden border border-border bg-canvas">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Post Title & Full Caption */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-ink">{selectedPost.title}</h3>
              <div className="bg-canvas p-3.5 rounded-control border border-border text-xs leading-relaxed italic text-ink">
                "{selectedPost.caption}"
              </div>
            </div>

            {/* Hashtags */}
            {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedPost.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-canvas border border-border text-ink-muted text-[11px] rounded font-medium flex items-center gap-1"
                  >
                    <Tag size={10} /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border gap-3">
              <Button
                variant="ghost"
                onClick={() => handleDeletePost(selectedPost.id)}
                className="text-danger hover:bg-red-50 gap-1.5 text-xs"
              >
                <Trash2 size={14} /> Delete Post
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPost(null)}>
                  Close
                </Button>
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Send size={14} /> Publish Now
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* SCHEDULE NEW POST MODAL */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule New Post"
      >
        <form onSubmit={handleCreatePost} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Post Title
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. 5 Productivity Tips for Marketing Teams"
              value={newPostData.title}
              onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Target Platform
              </label>
              <select
                value={newPostData.platform}
                onChange={(e) => setNewPostData({ ...newPostData, platform: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border rounded-control bg-canvas text-ink focus:outline-none focus:border-primary"
              >
                {platformsList.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={newPostData.status}
                onChange={(e) => setNewPostData({ ...newPostData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border rounded-control bg-canvas text-ink focus:outline-none focus:border-primary"
              >
                {statusesList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Scheduled Date
              </label>
              <Input
                type="date"
                required
                value={newPostData.date}
                onChange={(e) => setNewPostData({ ...newPostData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Scheduled Time
              </label>
              <Input
                type="text"
                required
                placeholder="10:00 AM"
                value={newPostData.time}
                onChange={(e) => setNewPostData({ ...newPostData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Caption
            </label>
            <textarea
              rows={3}
              placeholder="Write your social post caption here..."
              value={newPostData.caption}
              onChange={(e) => setNewPostData({ ...newPostData, caption: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-border rounded-control bg-canvas text-ink focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Image Thumbnail URL
            </label>
            <Input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={newPostData.image}
              onChange={(e) => setNewPostData({ ...newPostData, image: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Hashtags (comma separated)
            </label>
            <Input
              type="text"
              placeholder="#marketing, #ai, #productivity"
              value={newPostData.hashtags}
              onChange={(e) => setNewPostData({ ...newPostData, hashtags: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save & Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
