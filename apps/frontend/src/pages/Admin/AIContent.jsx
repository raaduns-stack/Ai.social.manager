import { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  FileText,
  Camera,
  TrendingUp,
  Edit,
  Trash2,
  Star,
  BarChart2,
  MoreVertical,
  Smile,
  Sparkles,
  Search,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import {
  getPrompts,
  createPrompt as createPromptApi,
  updatePrompt as updatePromptApi,
  togglePrompt as togglePromptApi,
  deletePrompt as deletePromptApi,
  getFeedbackAnalytics,
  getCustomerFeedbackAnalytics,
} from '../../features/admin/prompt-api'

const INITIAL_FALLBACK_TEMPLATES = [
  {
    id: 'mock-1',
    name: 'Professional LinkedIn Post',
    category: 'LinkedIn',
    prompt: 'Generate executive thought leadership and B2B engagement content.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    name: 'Casual Instagram Caption',
    category: 'Instagram',
    prompt: 'Short, punchy, and emoji-rich captions for lifestyle brands.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    name: 'Viral Thread Starter',
    category: 'X / Twitter',
    prompt: 'Hook-heavy frameworks designed for maximum reach.',
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default function AIContent() {
  const [templates, setTemplates] = useState([])
  const [customerAnalytics, setCustomerAnalytics] = useState([])
  const [analytics, setAnalytics] = useState({
    totalSuggestions: 0,
    totalFeedback: 0,
    upReactions: 0,
    downReactions: 0,
    approvalRate: 0,
    avgRating: 0,
    ratingDistribution: [
      { stars: 5, count: '0', percentage: 0 },
      { stars: 4, count: '0', percentage: 0 },
      { stars: 3, count: '0', percentage: 0 },
      { stars: 2, count: '0', percentage: 0 },
      { stars: 1, count: '0', percentage: 0 },
    ],
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(null) // template to edit or null for new

  // Pagination state for the customer feedback table
  const [feedbackPage, setFeedbackPage] = useState(1)
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1)
  const [feedbackTotal, setFeedbackTotal] = useState(0)
  const FEEDBACK_LIMIT = 20

  const [formState, setFormState] = useState({
    name: '',
    category: 'General',
    prompt: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (page = 1) => {
    try {
      setLoading(true)
      const [promptsRes, analyticsRes, customerAnalyticsRes] = await Promise.all([
        getPrompts().catch(() => []),
        getFeedbackAnalytics().catch(() => null),
        getCustomerFeedbackAnalytics(page, FEEDBACK_LIMIT).catch(() => ({ data: [], meta: { page: 1, limit: FEEDBACK_LIMIT, total: 0, totalPages: 1 } })),
      ])

      if (promptsRes && promptsRes.length > 0) {
        setTemplates(promptsRes)
      } else {
        setTemplates(INITIAL_FALLBACK_TEMPLATES)
      }

      if (analyticsRes) {
        setAnalytics(analyticsRes)
      }

      if (customerAnalyticsRes) {
        setCustomerAnalytics(customerAnalyticsRes.data || [])
        setFeedbackPage(customerAnalyticsRes.meta?.page || 1)
        setFeedbackTotalPages(customerAnalyticsRes.meta?.totalPages || 1)
        setFeedbackTotal(customerAnalyticsRes.meta?.total || 0)
      }
    } catch (err) {
      console.error('Failed to load AI content data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackPageChange = async (newPage) => {
    if (newPage < 1 || newPage > feedbackTotalPages) return
    try {
      const res = await getCustomerFeedbackAnalytics(newPage, FEEDBACK_LIMIT)
      setCustomerAnalytics(res.data || [])
      setFeedbackPage(res.meta?.page || newPage)
      setFeedbackTotalPages(res.meta?.totalPages || 1)
      setFeedbackTotal(res.meta?.total || 0)
    } catch (err) {
      console.error('Failed to load feedback page:', err)
    }
  }

  // Dynamic template search
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchName = t.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = (t.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchPrompt = (t.prompt || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchName || matchCategory || matchPrompt
    })
  }, [templates, searchQuery])

  const handleToggle = async (id) => {
    // Optimistic UI update
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    )

    if (id.startsWith && !id.startsWith('mock-')) {
      try {
        await togglePromptApi(id)
      } catch (err) {
        console.error('Failed to toggle prompt:', err)
        // Rollback on error
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
        )
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prompt template?')) return

    setTemplates((prev) => prev.filter((t) => t.id !== id))

    if (id.startsWith && !id.startsWith('mock-')) {
      try {
        await deletePromptApi(id)
      } catch (err) {
        console.error('Failed to delete prompt:', err)
        loadData()
      }
    }
  }

  const handleOpenAddModal = () => {
    setActiveTemplate(null)
    setFormState({
      name: '',
      category: 'General',
      prompt: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (template) => {
    setActiveTemplate(template)
    setFormState({
      name: template.name,
      category: template.category || 'General',
      prompt: template.prompt || '',
    })
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formState.name.trim() || !formState.prompt.trim()) return

    try {
      if (activeTemplate) {
        // Edit mode
        if (activeTemplate.id.startsWith && !activeTemplate.id.startsWith('mock-')) {
          const updated = await updatePromptApi(activeTemplate.id, {
            name: formState.name,
            category: formState.category,
            prompt: formState.prompt,
          })
          setTemplates((prev) =>
            prev.map((t) => (t.id === activeTemplate.id ? updated : t))
          )
        } else {
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === activeTemplate.id
                ? {
                    ...t,
                    name: formState.name,
                    category: formState.category,
                    prompt: formState.prompt,
                    updatedAt: new Date().toISOString(),
                  }
                : t
            )
          )
        }
      } else {
        // Create mode
        try {
          const created = await createPromptApi({
            name: formState.name,
            category: formState.category,
            prompt: formState.prompt,
            isActive: true,
          })
          setTemplates((prev) => [created, ...prev])
        } catch (apiErr) {
          console.error(apiErr)
          const fallbackCreated = {
            id: `mock-${Date.now()}`,
            name: formState.name,
            category: formState.category,
            prompt: formState.prompt,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setTemplates((prev) => [fallbackCreated, ...prev])
        }
      }
    } catch (err) {
      console.error('Error saving prompt:', err)
    }

    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Content Management"
        description="Control generative prompt assets and analyze feedback performance across all customer channels."
      />

      {/* Section 1: AI Prompt Management */}
      <section className="space-y-4">
        <Card className="p-0 overflow-hidden shadow-soft">
          <div className="p-5 border-b border-border bg-canvas/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-ink">AI Prompt Management</h3>
              <p className="text-xs text-ink-muted">Manage, edit, activate, and delete your AI prompt templates.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-48 pl-9 pr-3 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 font-semibold text-xs h-9"
                onClick={handleOpenAddModal}
              >
                <Plus size={14} />
                New Prompt Template
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-canvas/10 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  <th className="px-5 py-3">Template Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Prompt Content</th>
                  <th className="px-5 py-3">Last Updated</th>
                  <th className="px-5 py-3">Active Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-ink">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-ink-muted text-xs font-medium">
                      Loading prompt templates...
                    </td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-ink-muted text-xs font-medium">
                      No prompt templates matched your search.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((template) => {
                    let IconComponent = FileText
                    let iconBg = 'bg-primary-50 text-primary'

                    if ((template.category || '').toLowerCase().includes('instagram') || (template.category || '').toLowerCase().includes('media')) {
                      IconComponent = Camera
                      iconBg = 'bg-accent-50 text-accent-600'
                    } else if ((template.category || '').toLowerCase().includes('twitter') || (template.category || '').toLowerCase().includes('growth')) {
                      IconComponent = TrendingUp
                      iconBg = 'bg-amber-50 text-warning'
                    }

                    const formattedDate = new Date(template.updatedAt || template.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })

                    return (
                      <tr key={template.id} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                              <IconComponent size={20} />
                            </div>
                            <span className="font-semibold text-ink">{template.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone="neutral" className="font-semibold text-xs">
                            {template.category || 'General'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-ink-muted max-w-xs truncate" title={template.prompt}>
                          {template.prompt}
                        </td>
                        <td className="px-5 py-4 text-ink-muted text-xs">
                          {formattedDate}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggle(template.id)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              template.isActive ? 'bg-primary' : 'bg-border'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                template.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(template)}
                            className="p-1.5 rounded-control text-ink-muted hover:text-primary hover:bg-primary-50 transition-colors"
                            title="Edit Prompt"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-1.5 rounded-control text-ink-muted hover:text-danger hover:bg-red-50 transition-colors"
                            title="Delete Prompt"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-canvas/30 border-t border-border flex justify-between items-center text-xs text-ink-muted">
            <span>Showing {filteredTemplates.length} of {templates.length} templates</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-border rounded-control hover:bg-canvas transition-colors bg-surface text-ink font-semibold">
                Previous
              </button>
              <button className="px-3 py-1.5 border border-border rounded-control hover:bg-canvas transition-colors bg-surface text-ink font-semibold">
                Next
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* Section 2: AI Feedback Analytics */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-ink uppercase tracking-wider">AI Feedback Analytics</h3>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 shadow-soft">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-ink-muted uppercase">Approval Rate</span>
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold bg-accent-50 text-accent-600">
                <TrendingUp size={12} />
                {analytics.approvalRate >= 50 ? 'High' : 'Normal'}
              </span>
            </div>
            <div className="text-3xl font-bold text-ink">{analytics.approvalRate}%</div>
            <p className="text-xs text-ink-muted mt-2">Percentage of thumbs-up customer reactions</p>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-ink-muted uppercase">Avg. Rating</span>
              <div className="flex text-warning">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={star <= Math.round(analytics.avgRating || 0) ? 'fill-warning' : 'fill-warning opacity-30'}
                  />
                ))}
              </div>
            </div>
            <div className="text-3xl font-bold text-ink">
              {analytics.avgRating}<span className="text-lg font-normal text-ink-muted">/5</span>
            </div>
            <p className="text-xs text-ink-muted mt-2">Average customer star rating</p>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-ink-muted uppercase">Total Feedback Events</span>
              <BarChart2 size={16} className="text-ink-muted" />
            </div>
            <div className="text-3xl font-bold text-ink">{analytics.totalFeedback.toLocaleString()}</div>
            <p className="text-xs text-ink-muted mt-2">Total user feedback interactions recorded</p>
          </Card>
        </div>

        {/* Rating Distribution Chart Card */}
        <Card className="p-5 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-semibold text-ink">Rating Distribution</h4>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-canvas hover:bg-canvas/70 text-ink rounded-control text-xs font-semibold border border-border">
                All Time
              </button>
            </div>
          </div>

          <div className="space-y-4 max-w-3xl">
            {analytics.ratingDistribution.map((rating) => (
              <div key={rating.stars} className="flex items-center gap-4">
                <div className="w-12 text-xs text-ink-muted flex items-center justify-end gap-1 font-semibold">
                  {rating.stars} <Star size={12} className="fill-ink-muted/30" />
                </div>
                <div className="flex-1 h-5 bg-canvas rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${rating.percentage}%` }}
                  />
                </div>
                <div className="w-16 text-right text-xs font-bold text-ink">
                  {rating.count} ({rating.percentage}%)
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center text-accent">
                <Smile size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Positive Reactions</p>
                <p className="text-xs text-ink-muted">{analytics.upReactions} Thumbs Up vs {analytics.downReactions} Thumbs Down</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">AI Suggestions Generated</p>
                <p className="text-xs text-ink-muted">{analytics.totalSuggestions} total content items generated</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Customer AI Feedback Table */}
        <Card className="p-0 overflow-hidden shadow-soft">
          <div className="p-5 border-b border-border bg-canvas/30">
            <h4 className="text-sm font-semibold text-ink">AI Feedback by Customer</h4>
            <p className="text-xs text-ink-muted mt-0.5">Aggregate metrics and topics preferred by each customer.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-canvas/10 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  <th className="px-5 py-3">Customer / Business</th>
                  <th className="px-5 py-3 text-center">Suggestions</th>
                  <th className="px-5 py-3 text-center">Ratings Count</th>
                  <th className="px-5 py-3">Avg. Rating</th>
                  <th className="px-5 py-3 text-center">Reactions (👍/👎)</th>
                  <th className="px-5 py-3">Preferred Topics</th>
                  <th className="px-5 py-3">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-ink">
                {customerAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-ink-muted text-xs font-medium">
                      No customer AI feedback records found.
                    </td>
                  </tr>
                ) : (
                  customerAnalytics.map((ca) => (
                    <tr key={ca.userId} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-semibold text-ink">{ca.fullName}</div>
                          {ca.businessName && (
                            <div className="text-xs text-ink-muted font-medium mt-0.5">{ca.businessName}</div>
                          )}
                          <div className="text-[10px] text-ink-muted">{ca.email}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-medium text-ink-muted">
                        {ca.totalSuggestions}
                      </td>
                      <td className="px-5 py-4 text-center font-medium text-ink-muted">
                        {ca.totalRatings}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-ink">{ca.avgRating}</span>
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= Math.round(ca.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center text-xs font-semibold">
                        <span className="text-accent">👍 {ca.likes}</span>
                        <span className="text-ink-muted mx-1">/</span>
                        <span className="text-danger">👎 {ca.dislikes}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-muted max-w-xs truncate" title={ca.preferredTopics}>
                        {ca.preferredTopics}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-ink-muted">
                        {ca.suggestionPerformance}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {feedbackTotalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-canvas/20">
              <span className="text-xs text-ink-muted">
                {feedbackTotal} customer{feedbackTotal !== 1 ? 's' : ''} total &mdash; page {feedbackPage} of {feedbackTotalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleFeedbackPageChange(feedbackPage - 1)}
                  disabled={feedbackPage <= 1}
                  className="px-3 py-1.5 rounded-control text-xs font-semibold border border-border bg-surface text-ink-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: feedbackTotalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === feedbackTotalPages || Math.abs(p - feedbackPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs text-ink-muted">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handleFeedbackPageChange(p)}
                        className={`w-8 h-8 rounded-control text-xs font-semibold border transition-colors ${
                          feedbackPage === p
                            ? 'bg-primary border-primary text-white'
                            : 'border-border bg-surface text-ink-muted hover:border-primary hover:text-primary'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )
                }
                <button
                  onClick={() => handleFeedbackPageChange(feedbackPage + 1)}
                  disabled={feedbackPage >= feedbackTotalPages}
                  className="px-3 py-1.5 rounded-control text-xs font-semibold border border-border bg-surface text-ink-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Add / Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTemplate ? 'Edit Prompt Template' : 'Create Prompt Template'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Template Name"
            value={formState.name}
            onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Friendly Product Announcement"
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Category / Platform</label>
            <select
              value={formState.category}
              onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
            >
              <option value="General">General</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="X / Twitter">X / Twitter</option>
              <option value="TikTok">TikTok</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Prompt Content</label>
            <textarea
              value={formState.prompt}
              onChange={(e) => setFormState((prev) => ({ ...prev, prompt: e.target.value }))}
              rows={4}
              placeholder="Write the system prompt instructions for the AI..."
              className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono"
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {activeTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}