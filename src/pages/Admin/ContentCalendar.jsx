import { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Camera,
  Video,
  Zap,
  FileText,
  Download,
  PlusCircle,
  CheckCircle,
  Plus,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'

const INITIAL_POSTS = [
  {
    id: 1,
    day: 1,
    type: 'published', // 'published', 'scheduled', 'draft'
    platform: 'Instagram',
    format: 'photo',
    text: 'New morning routine...',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9Sc6LpLgJQH9vmc4zu3fcmjgM9L2fYJYsRdIUBv93XDi7RTpY-HEdv7_gU4uQgwEMzOujH6K_NTfmLAIm_5y7lylpkV7IDKy2qtGpci3c5xZo6_QI5B9EJpV64XNzMWm7lloqbGn-WsDKtq1VQ3Rl1wZy_heRcy0ovpEfIDktC3SJTuYQXtFcVFv4RVnwSsHqsc4dOTKJmhw1JBFhJcRcXIzjTlPl1rnPekJv_KfTXJ9hJ8nYbdhxBRn9pVEMYxW21QQn_Hu-Tu1_',
    customer: 'Amaka Obi',
  },
  {
    id: 2,
    day: 3,
    type: 'draft',
    platform: 'Instagram',
    format: 'video',
    text: 'Reel: Behind the sc...',
    customer: 'John Doe',
  },
  {
    id: 3,
    day: 6,
    type: 'scheduled',
    platform: 'Facebook',
    format: 'photo',
    text: 'Productivity hacks for...',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg5wYx6jUpTwCMGXDKKxiIkZlvmfdBeEQyHOrGrplyQAG9ZdvH_D-b27x985l8TKQjq7tJ2SDc9v2EFHhtTP-lSrkee3LE4OwqleDRxd4FeT-li8YiG6wdp343Ypi46hU0cDkX06l_G1GIuzJ37ZPdT-VU5jlWjsBVD5bWKARLr4szyVrjn3nESwV8E6wB0X_jjnQOu687eIW5BTm7CzNr5GAUZ-9PY5iDhz8CuGjjpmpnkBf3pIhRQ6whX2a6j9x15BnIw3IEPAuu',
    customer: 'Sarah Chen',
  },
  {
    id: 4,
    day: 10,
    type: 'published',
    platform: 'Instagram',
    format: 'photo',
    text: 'Summer Sale Launch',
    customer: 'Amaka Obi',
  },
  {
    id: 5,
    day: 10,
    type: 'scheduled',
    platform: 'Facebook',
    format: 'photo',
    text: 'Customer Review #42',
    customer: 'Amaka Obi',
  },
  {
    id: 6,
    day: 13,
    type: 'scheduled',
    platform: 'TikTok',
    format: 'video',
    text: 'AI Integration Update...',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUri0p8q27PrGV8KDh6P3l6thQFLEpZoW3Ap8ST7Rhk2SiwT70jNfLUdOdLkkF2o2WinG5Xaa_-Ha13VAA3UTcdBfZfDaOAchYTtmb_rSZfBT9NdD3Bd4oVhaieGbLREJLhmUUqTZUVTrdBCG2srqBprEv4ffg8pKvEmJbnGczMlRVfoAm2dyVxjPHVxtriY154Sjt0OkhhX2YBdZ3wHtIpB8KZFjzJus-BUXJnc7dHXZ1a4QRSqHdH-H45beOBDqhnK8-bUTMYrqO',
    customer: 'Amaka Obi',
  },
  {
    id: 7,
    day: 15,
    type: 'draft',
    platform: 'TikTok',
    format: 'article',
    text: 'Blog: The future of...',
    customer: 'John Doe',
  },
  {
    id: 8,
    day: 21,
    type: 'scheduled',
    platform: 'TikTok',
    format: 'video',
    text: 'Weekend Vlog Teaser',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsdl494QkBZDubMnx5tw6tq2II4uZGZnZ4Y81A2crrUMBFp8yQi24TZlf8zzcpYPUkU-Dsz1KcUX67CJAyd3odZKUuBIXVOpzwmNTXCCy1SdsEoS9J6dEZDUD7CZ55Tp6MvDhjd5lhfbrOI56ScLco3G3EXozpHh8si5jPwsE1paByLv8Ce14Mc3lEuqHW-Dro1HB-TD9BYsvljstA9J_KnvaiDVoayDrWA9EeWxur8hl35rHJmvE9XH2qG6FzrMzj1o2pchKBcUMO',
    customer: 'Sarah Chen',
  },
]

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const CALENDAR_CELLS = [
  { day: 28, currentMonth: false },
  { day: 29, currentMonth: false },
  { day: 30, currentMonth: false },
  { day: 1, currentMonth: true },
  { day: 2, currentMonth: true },
  { day: 3, currentMonth: true },
  { day: 4, currentMonth: true },
  { day: 5, currentMonth: true },
  { day: 6, currentMonth: true },
  { day: 7, currentMonth: true },
  { day: 8, currentMonth: true },
  { day: 9, currentMonth: true },
  { day: 10, currentMonth: true },
  { day: 11, currentMonth: true },
  { day: 12, currentMonth: true },
  { day: 13, currentMonth: true, isToday: true },
  { day: 14, currentMonth: true },
  { day: 15, currentMonth: true },
  { day: 16, currentMonth: true },
  { day: 17, currentMonth: true },
  { day: 18, currentMonth: true },
  { day: 19, currentMonth: true },
  { day: 20, currentMonth: true },
  { day: 21, currentMonth: true },
  { day: 22, currentMonth: true },
  { day: 23, currentMonth: true },
  { day: 24, currentMonth: true },
  { day: 25, currentMonth: true },
  { day: 26, currentMonth: currentMonth => true }, // fallback standard
  { day: 27, currentMonth: true },
  { day: 28, currentMonth: true },
  { day: 29, currentMonth: true },
  { day: 30, currentMonth: true },
  { day: 1, currentMonth: false },
  { day: 2, currentMonth: false },
]

export default function ContentCalendar() {
  const [posts, setPosts] = useState(INITIAL_POSTS)
  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms')
  const [selectedCustomer, setSelectedCustomer] = useState('All Customers')
  const [viewMode, setViewMode] = useState('Month')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [targetCellDay, setTargetCellDay] = useState(null)

  const [newPostForm, setNewPostForm] = useState({
    text: '',
    platform: 'Instagram',
    format: 'photo',
    customer: 'Amaka Obi',
  })

  // Dynamic cell posts filtration
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesPlatform = selectedPlatform === 'All Platforms' || post.platform === selectedPlatform
      const matchesCustomer = selectedCustomer === 'All Customers' || post.customer === selectedCustomer
      return matchesPlatform && matchesCustomer
    })
  }, [posts, selectedPlatform, selectedCustomer])

  const handleOpenAddModal = (day) => {
    setTargetCellDay(day)
    setIsAddModalOpen(true)
  }

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!newPostForm.text.trim()) return

    const created = {
      id: Date.now(),
      day: targetCellDay || 1,
      type: 'scheduled',
      platform: newPostForm.platform,
      format: newPostForm.format,
      text: newPostForm.text,
      customer: newPostForm.customer,
    }

    setPosts((prev) => [...prev, created])
    setIsAddModalOpen(false)
    setNewPostForm({
      text: '',
      platform: 'Instagram',
      format: 'photo',
      customer: 'Amaka Obi',
    })
  }

  // Define grid viewport based on Month vs Week toggles
  const renderedCells = useMemo(() => {
    if (viewMode === 'Month') return CALENDAR_CELLS
    // Week view filters only the row that contains TODAY (days 12 to 18)
    return CALENDAR_CELLS.slice(14, 21)
  }, [viewMode])

  const handleExportPDF = () => {
    alert('Generating PDF summary report...')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Calendar"
        description="Manage and schedule posts across all connected platforms."
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Platform filter */}
            <div className="relative">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-control py-2 pl-4 pr-10 text-sm font-semibold text-ink focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="All Platforms">All Platforms</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted w-4 h-4" />
            </div>

            {/* Customer filter */}
            <div className="relative">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-control py-2 pl-4 pr-10 text-sm font-semibold text-ink focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="All Customers">All Customers</option>
                <option value="Amaka Obi">Amaka Obi</option>
                <option value="John Doe">John Doe</option>
                <option value="Sarah Chen">Sarah Chen</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted w-4 h-4" />
            </div>

            {/* Month/Week Switcher */}
            <div className="flex border border-border rounded-control overflow-hidden shadow-soft">
              <button
                onClick={() => setViewMode('Month')}
                className={`px-4 py-2 text-xs font-bold transition-all ${
                  viewMode === 'Month'
                    ? 'bg-canvas text-primary border-r border-border'
                    : 'bg-surface text-ink-muted hover:bg-canvas'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('Week')}
                className={`px-4 py-2 text-xs font-bold transition-all ${
                  viewMode === 'Week'
                    ? 'bg-canvas text-primary'
                    : 'bg-surface text-ink-muted hover:bg-canvas'
                }`}
              >
                Week
              </button>
            </div>
          </div>
        }
      />

      {/* Calendar Month Grid */}
      <Card className="overflow-hidden p-0 shadow-soft">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border bg-canvas/60">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-bold ${
                day === 'SAT' || day === 'SUN' ? 'text-primary' : 'text-ink-muted'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells Grid */}
        <div className="grid grid-cols-7 auto-rows-[minmax(140px,auto)] divide-x divide-y divide-border">
          {renderedCells.map((cell, index) => {
            // Find posts for this day
            const dayPosts = cell.currentMonth !== false
              ? filteredPosts.filter((post) => post.day === cell.day)
              : []

            const isToday = cell.isToday

            return (
              <div
                key={index}
                className={`p-3 relative group transition-all duration-200 ${
                  !cell.currentMonth
                    ? 'bg-canvas/50 opacity-40 select-none'
                    : isToday
                    ? 'bg-primary-50/10 border-2 border-primary'
                    : 'bg-surface hover:bg-canvas/30 cursor-pointer'
                }`}
                onClick={() => cell.currentMonth && handleOpenAddModal(cell.day)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-ink'}`}>
                    {cell.day}
                  </span>
                  {isToday && (
                    <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                      Today
                    </span>
                  )}
                  {cell.currentMonth && !isToday && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenAddModal(cell.day)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-primary-500 hover:text-primary transition-all p-0.5"
                    >
                      <PlusCircle size={15} />
                    </button>
                  )}
                </div>

                {/* Render posts inside the cell */}
                <div className="space-y-2 mt-1">
                  {dayPosts.map((post) => {
                    let typeBadgeColor = 'bg-accent-50 border-accent/20'
                    let textAccentColor = 'text-accent'
                    let dotColor = 'bg-accent'
                    let FormatIcon = Camera

                    if (post.type === 'scheduled') {
                      typeBadgeColor = 'bg-primary-50/40 border-primary/10'
                      textAccentColor = 'text-primary'
                      dotColor = 'bg-warning animate-pulse'
                    } else if (post.type === 'draft') {
                      typeBadgeColor = 'bg-canvas border-border/50 border-dashed'
                      textAccentColor = 'text-ink-muted'
                      dotColor = 'bg-ink-muted/50'
                    }

                    if (post.format === 'video') FormatIcon = Video
                    if (post.format === 'article') FormatIcon = FileText

                    return (
                      <div
                        key={post.id}
                        onClick={(e) => e.stopPropagation()} // prevent double modal triggers
                        className={`border rounded-control p-2 flex flex-col gap-1.5 shadow-sm bg-surface max-w-full ${typeBadgeColor}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {post.type === 'published' ? (
                            <CheckCircle size={12} className="text-accent fill-accent-50" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                          )}
                          <FormatIcon size={12} className={textAccentColor} />
                        </div>

                        {post.image ? (
                          <div className="flex gap-2 items-center">
                            <img
                              src={post.image}
                              alt={post.text}
                              className="w-8 h-8 rounded-control object-cover shrink-0 border border-border"
                            />
                            <p className="text-[10px] leading-tight font-semibold text-ink truncate flex-1">
                              {post.text}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] leading-tight font-semibold text-ink truncate">
                            {post.text}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Footer Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-xs text-ink-muted font-medium">Published</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span className="text-xs text-ink-muted font-medium">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-ink-muted/50" />
            <span className="text-xs text-ink-muted font-medium">Draft</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-muted font-medium">
            Showing {filteredPosts.length} posts this month
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-primary font-semibold hover:bg-primary-50 gap-1.5 h-9"
            onClick={handleExportPDF}
          >
            <Download size={14} />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Create Post Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Schedule Post for Nov ${targetCellDay}`}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Post Text"
            value={newPostForm.text}
            onChange={(e) => setNewPostForm((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="Write details or copy caption here..."
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Platform</label>
              <select
                value={newPostForm.platform}
                onChange={(e) => setNewPostForm((prev) => ({ ...prev, platform: e.target.value }))}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
              >
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Format</label>
              <select
                value={newPostForm.format}
                onChange={(e) => setNewPostForm((prev) => ({ ...prev, format: e.target.value }))}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
              >
                <option value="photo">Photo Post</option>
                <option value="video">Reel / Video</option>
                <option value="article">Blog / Article</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Assign Customer</label>
            <select
              value={newPostForm.customer}
              onChange={(e) => setNewPostForm((prev) => ({ ...prev, customer: e.target.value }))}
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
            >
              <option value="Amaka Obi">Amaka Obi</option>
              <option value="John Doe">John Doe</option>
              <option value="Sarah Chen">Sarah Chen</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Schedule Post
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

