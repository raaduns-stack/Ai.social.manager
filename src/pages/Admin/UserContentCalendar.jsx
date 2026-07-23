import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Trash2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'

const CUSTOMERS = {
  '1': 'Amaka Obi',
  '2': 'Lena Dubois',
  '3': 'David Chen',
  '4': 'Sasha Kovic',
  '5': 'Marcus Thorne',
  '6': 'Julia Peters',
  '7': 'Alex Rivera',
}

const INITIAL_POSTS = [
  // Amaka Obi (User ID 1)
  {
    id: 1,
    day: 1,
    type: 'published',
    platform: 'Instagram',
    format: 'photo',
    text: 'New morning routine showing the startup workspace setup.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9Sc6LpLgJQH9vmc4zu3fcmjgM9L2fYJYsRdIUBv93XDi7RTpY-HEdv7_gU4uQgwEMzOujH6K_NTfmLAIm_5y7lylpkV7IDKy2qtGpci3c5xZo6_QI5B9EJpV64XNzMWm7lloqbGn-WsDKtq1VQ3Rl1wZy_heRcy0ovpEfIDktC3SJTuYQXtFcVFv4RVnwSsHqsc4dOTKJmhw1JBFhJcRcXIzjTlPl1rnPekJv_KfTXJ9hJ8nYbdhxBRn9pVEMYxW21QQn_Hu-Tu1_',
    customer: 'Amaka Obi',
    approvalStatus: 'Approved',
  },
  {
    id: 4,
    day: 10,
    type: 'published',
    platform: 'Instagram',
    format: 'photo',
    text: 'Summer Sale Launch - 20% off all productivity bundles!',
    customer: 'Amaka Obi',
    approvalStatus: 'Approved',
  },
  {
    id: 5,
    day: 10,
    type: 'scheduled',
    platform: 'Facebook',
    format: 'photo',
    text: 'Customer Review #42: "This service changed how we automate social sharing!"',
    customer: 'Amaka Obi',
    approvalStatus: 'Pending',
  },
  {
    id: 6,
    day: 13,
    type: 'scheduled',
    platform: 'TikTok',
    format: 'video',
    text: 'AI Integration Update - walkthrough of the neural content scheduler.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUri0p8q27PrGV8KDh6P3l6thQFLEpZoW3Ap8ST7Rhk2SiwT70jNfLUdOdLkkF2o2WinG5Xaa_-Ha13VAA3UTcdBfZfDaOAchYTtmb_rSZfBT9NdD3Bd4oVhaieGbLREJLhmUUqTZUVTrdBCG2srqBprEv4ffg8pKvEmJbnGczMlRVfoAm2dyVxjPHVxtriY154Sjt0OkhhX2YBdZ3wHtIpB8KZFjzJus-BUXJnc7dHXZ1a4QRSqHdH-H45beOBDqhnK8-bUTMYrqO',
    customer: 'Amaka Obi',
    approvalStatus: 'Approved',
  },
  {
    id: 11,
    day: 18,
    type: 'scheduled',
    platform: 'Instagram',
    format: 'photo',
    text: 'A sneak peek of the upcoming dashboard upgrades.',
    customer: 'Amaka Obi',
    approvalStatus: 'Rejected',
  },

  // Lena Dubois (User ID 2)
  {
    id: 2,
    day: 3,
    type: 'draft',
    platform: 'Instagram',
    format: 'video',
    text: 'Reel: Behind the scenes of our Paris creative studio vlog.',
    customer: 'Lena Dubois',
    approvalStatus: 'Pending',
  },
  {
    id: 12,
    day: 12,
    type: 'scheduled',
    platform: 'Facebook',
    format: 'photo',
    text: 'Expanding our creative boundaries this summer.',
    customer: 'Lena Dubois',
    approvalStatus: 'Pending',
  },

  // David Chen (User ID 3)
  {
    id: 3,
    day: 6,
    type: 'scheduled',
    platform: 'Facebook',
    format: 'photo',
    text: 'Productivity hacks for solo developers - terminal setups.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg5wYx6jUpTwCMGXDKKxiIkZlvmfdBeEQyHOrGrplyQAG9ZdvH_D-b27x985l8TKQjq7tJ2SDc9v2EFHhtTP-lSrkee3LE4OwqleDRxd4FeT-li8YiG6wdp343Ypi46hU0cDkX06l_G1GIuzJ37ZPdT-VU5jlWjsBVD5bWKARLr4szyVrjn3nESwV8E6wB0X_jjnQOu687eIW5BTm7CzNr5GAUZ-9PY5iDhz8CuGjjpmpnkBf3pIhRQ6whX2a6j9x15BnIw3IEPAuu',
    customer: 'David Chen',
    approvalStatus: 'Approved',
  },

  // Sasha Kovic (User ID 4)
  {
    id: 8,
    day: 21,
    type: 'scheduled',
    platform: 'TikTok',
    format: 'video',
    text: 'Weekend Agency Vlog Teaser - filming setups.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsdl494QkBZDubMnx5tw6tq2II4uZGZnZ4Y81A2crrUMBFp8yQi24TZlf8zzcpYPUkU-Dsz1KcUX67CJAyd3odZKUuBIXVOpzwmNTXCCy1SdsEoS9J6dEZDUD7CZ55Tp6MvDhjd5lhfbrOI56ScLco3G3EXozpHh8si5jPwsE1paByLv8Ce14Mc3lEuqHW-Dro1HB-TD9BYsvljstA9J_KnvaiDVoayDrWA9EeWxur8hl35rHJmvE9XH2qG6FzrMzj1o2pchKBcUMO',
    customer: 'Sasha Kovic',
    approvalStatus: 'Pending',
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
  { day: 26, currentMonth: true },
  { day: 27, currentMonth: true },
  { day: 28, currentMonth: true },
  { day: 29, currentMonth: true },
  { day: 30, currentMonth: true },
  { day: 1, currentMonth: false },
  { day: 2, currentMonth: false },
]

export default function UserContentCalendar() {
  const { userId } = useParams()
  const customerName = CUSTOMERS[userId] || 'Amaka Obi'

  const [posts, setPosts] = useState(INITIAL_POSTS)
  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms')
  const [viewMode, setViewMode] = useState('Month')
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  const [targetCellDay, setTargetCellDay] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)

  const [newPostForm, setNewPostForm] = useState({
    text: '',
    platform: 'Instagram',
    format: 'photo',
  })

  // Dynamic cell posts filtration - locked to current customer
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesPlatform = selectedPlatform === 'All Platforms' || post.platform === selectedPlatform
      const matchesCustomer = post.customer === customerName
      return matchesPlatform && matchesCustomer
    })
  }, [posts, selectedPlatform, customerName])

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
      customer: customerName,
      approvalStatus: 'Pending',
    }

    setPosts((prev) => [...prev, created])
    setIsAddModalOpen(false)
    setNewPostForm({
      text: '',
      platform: 'Instagram',
      format: 'photo',
    })
  }

  const handleOpenDetailModal = (e, post) => {
    e.stopPropagation()
    setSelectedPost(post)
    setIsDetailModalOpen(true)
  }

  const handleUpdateApprovalStatus = (status) => {
    if (!selectedPost) return
    setPosts((prev) =>
      prev.map((post) =>
        post.id === selectedPost.id ? { ...post, approvalStatus: status } : post
      )
    )
    setSelectedPost((prev) => ({ ...prev, approvalStatus: status }))
  }

  const handleDeletePost = () => {
    if (!selectedPost) return
    setPosts((prev) => prev.filter((post) => post.id !== selectedPost.id))
    setIsDetailModalOpen(false)
    setSelectedPost(null)
  }

  const renderedCells = useMemo(() => {
    if (viewMode === 'Month') return CALENDAR_CELLS
    return CALENDAR_CELLS.slice(14, 21) // Week view filters the row around today
  }, [viewMode])

  const handleExportPDF = () => {
    alert(`Generating PDF summary report for ${customerName}...`)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-4">
        <Link
          to={`/admin/users/${userId}`}
          className="w-10 h-10 flex items-center justify-center rounded-control border border-border bg-surface hover:bg-canvas text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <nav className="flex items-center gap-2 text-sm text-ink-muted">
          <Link to="/admin/users" className="hover:text-primary transition-colors font-medium">
            Users
          </Link>
          <ChevronRight size={14} className="text-ink-muted/50" />
          <Link to={`/admin/users/${userId}`} className="hover:text-primary transition-colors font-medium">
            {customerName}
          </Link>
          <ChevronRight size={14} className="text-ink-muted/50" />
          <span className="text-ink font-semibold">Content Calendar</span>
        </nav>
      </div>

      <PageHeader
        title={`${customerName}'s Calendar`}
        description="Review scheduled content and manage approval workflows."
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Platform filter */}
            <div className="relative">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-full py-2 pl-4 pr-10 text-sm font-semibold text-ink focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="All Platforms">All Platforms</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
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
                      if (post.approvalStatus === 'Approved') {
                        typeBadgeColor = 'bg-emerald-50 border-emerald-100'
                        textAccentColor = 'text-emerald-700'
                        dotColor = 'bg-emerald-500'
                      } else if (post.approvalStatus === 'Rejected') {
                        typeBadgeColor = 'bg-rose-50 border-rose-100'
                        textAccentColor = 'text-rose-700'
                        dotColor = 'bg-rose-500'
                      } else {
                        typeBadgeColor = 'bg-amber-50 border-amber-100'
                        textAccentColor = 'text-amber-700'
                        dotColor = 'bg-amber-500 animate-pulse'
                      }
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
                        onClick={(e) => handleOpenDetailModal(e, post)}
                        className={`border rounded-control p-2 flex flex-col gap-1.5 shadow-sm bg-surface max-w-full hover:shadow transition-all ${typeBadgeColor}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            {post.type === 'published' ? (
                              <CheckCircle size={11} className="text-accent fill-accent-50 shrink-0" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                            )}
                            <span className="text-[8px] font-bold uppercase tracking-wider text-ink-muted truncate">
                              {post.type === 'scheduled' ? post.approvalStatus || 'Pending' : post.type}
                            </span>
                          </div>
                          <FormatIcon size={11} className={`${textAccentColor} shrink-0`} />
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-ink-muted font-medium">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-ink-muted font-medium">Pending Approval</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-ink-muted font-medium">Rejected</span>
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Client Account</label>
            <div className="h-10 px-3 flex items-center bg-canvas border border-border text-sm text-ink-muted rounded-control select-none">
              {customerName} (Pre-assigned)
            </div>
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

      {/* Post Detail & Approval Action Modal */}
      {selectedPost && (
        <Modal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Scheduled Post Details"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-0.5">
                <span className="text-xs text-ink-muted">Publish Target</span>
                <p className="text-sm font-bold text-ink">
                  {selectedPost.platform} ({selectedPost.format})
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-xs text-ink-muted">Approval Status</span>
                <div>
                  <Badge
                    tone={
                      selectedPost.type === 'published'
                        ? 'success'
                        : selectedPost.approvalStatus === 'Approved'
                        ? 'success'
                        : selectedPost.approvalStatus === 'Rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    className="font-bold uppercase tracking-wider text-[9px] gap-1"
                  >
                    {selectedPost.type === 'published' ? (
                      'Published'
                    ) : selectedPost.approvalStatus === 'Approved' ? (
                      <ShieldCheck size={11} />
                    ) : selectedPost.approvalStatus === 'Rejected' ? (
                      <ShieldX size={11} />
                    ) : (
                      <ShieldAlert size={11} />
                    )}
                    <span>{selectedPost.type === 'published' ? 'Published' : selectedPost.approvalStatus}</span>
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-ink-muted">Caption & Hashtags</span>
              <p className="text-sm bg-canvas border border-border p-3 rounded-control text-ink leading-relaxed whitespace-pre-line font-medium">
                {selectedPost.text}
              </p>
            </div>

            {selectedPost.image && (
              <div className="space-y-1">
                <span className="text-xs text-ink-muted">Image Attachment</span>
                <div className="border border-border rounded-control overflow-hidden bg-canvas max-h-60 flex items-center justify-center">
                  <img
                    src={selectedPost.image}
                    alt="Post attachment preview"
                    className="max-h-60 object-contain w-full"
                  />
                </div>
              </div>
            )}

            {/* Approval Workflow buttons */}
            {selectedPost.type === 'scheduled' && (
              <div className="space-y-2 border-t border-border pt-4">
                <span className="text-xs font-semibold text-ink-muted block uppercase tracking-wider">
                  Approval Actions
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="text-xs font-semibold border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 gap-1.5 flex items-center justify-center"
                    onClick={() => handleUpdateApprovalStatus('Approved')}
                    disabled={selectedPost.approvalStatus === 'Approved'}
                  >
                    <ShieldCheck size={14} />
                    <span>Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-xs font-semibold border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50 gap-1.5 flex items-center justify-center"
                    onClick={() => handleUpdateApprovalStatus('Rejected')}
                    disabled={selectedPost.approvalStatus === 'Rejected'}
                  >
                    <ShieldX size={14} />
                    <span>Reject</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="text-xs font-semibold border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50 gap-1.5 flex items-center justify-center"
                    onClick={() => handleUpdateApprovalStatus('Pending')}
                    disabled={selectedPost.approvalStatus === 'Pending'}
                  >
                    <ShieldAlert size={14} />
                    <span>Set Pending</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-border pt-4 gap-2">
              <Button
                variant="outline"
                className="text-xs text-rose-600 border-rose-100 hover:bg-rose-50 font-semibold gap-1.5 flex items-center h-9"
                onClick={handleDeletePost}
              >
                <Trash2 size={14} />
                <span>Delete Post</span>
              </Button>
              <Button
                variant="primary"
                className="text-xs h-9 px-4 font-semibold"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
