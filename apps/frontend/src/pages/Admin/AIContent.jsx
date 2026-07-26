import { useState, useMemo } from 'react'
import {
  Plus,
  FileText,
  Camera,
  TrendingUp,
  Edit,
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

const INITIAL_TEMPLATES = [
  {
    id: 1,
    name: 'Professional LinkedIn Post',
    description: 'Optimized for executive thought leadership and B2B engagement.',
    lastEdited: 'Oct 12, 2023',
    active: true,
    icon: 'description', // filetext
  },
  {
    id: 2,
    name: 'Casual Instagram Caption',
    description: 'Short, punchy, and emoji-rich captions for lifestyle brands.',
    lastEdited: 'Oct 10, 2023',
    active: true,
    icon: 'camera',
  },
  {
    id: 3,
    name: 'Viral Thread Starter',
    description: 'Hook-heavy frameworks designed for Twitter/X reach.',
    lastEdited: 'Sep 28, 2023',
    active: false,
    icon: 'trending',
  },
]

const RATING_DISTRIBUTION = [
  { stars: 5, count: '9,673', percentage: 78 },
  { stars: 4, count: '1,860', percentage: 15 },
  { stars: 3, count: '496', percentage: 4 },
  { stars: 2, count: '248', percentage: 2 },
  { stars: 1, count: '125', percentage: 1 },
]

export default function AIContent() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(null) // template to edit or null for new

  const [formState, setFormState] = useState({
    name: '',
    description: '',
    icon: 'description',
  })

  // Dynamic template search
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchName = t.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchDesc = t.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchName || matchDesc
    })
  }, [templates, searchQuery])

  const handleToggle = (id) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    )
  }

  const handleOpenAddModal = () => {
    setActiveTemplate(null)
    setFormState({
      name: '',
      description: '',
      icon: 'description',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (template) => {
    setActiveTemplate(template)
    setFormState({
      name: template.name,
      description: template.description,
      icon: template.icon,
    })
    setIsModalOpen(true)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!formState.name.trim() || !formState.description.trim()) return

    const now = new Date()
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    if (activeTemplate) {
      // Edit mode
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === activeTemplate.id
            ? {
                ...t,
                name: formState.name,
                description: formState.description,
                icon: formState.icon,
                lastEdited: formattedDate,
              }
            : t
        )
      )
    } else {
      // Add mode
      const created = {
        id: Date.now(),
        name: formState.name,
        description: formState.description,
        icon: formState.icon,
        lastEdited: formattedDate,
        active: true,
      }
      setTemplates((prev) => [...prev, created])
    }

    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Content Management"
        description="Control generative assets and analyze feedback performance across all channels."
      />

      {/* Section 1: AI Prompt Management */}
      <section className="space-y-4">
        <Card className="p-0 overflow-hidden shadow-soft">
          <div className="p-5 border-b border-border bg-canvas/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-ink">AI Prompt Management</h3>
              <p className="text-xs text-ink-muted">Manage and version control your content generation templates.</p>
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
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Last Edited</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-ink">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-ink-muted text-xs font-medium">
                      No prompt templates matched your search.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((template) => {
                    let IconComponent = FileText
                    let iconBg = 'bg-primary-50 text-primary'

                    if (template.icon === 'camera') {
                      IconComponent = Camera
                      iconBg = 'bg-accent-50 text-accent-600'
                    } else if (template.icon === 'trending') {
                      IconComponent = TrendingUp
                      iconBg = 'bg-amber-50 text-warning'
                    }

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
                        <td className="px-5 py-4 text-ink-muted max-w-xs truncate">
                          {template.description}
                        </td>
                        <td className="px-5 py-4 text-ink-muted">
                          {template.lastEdited}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggle(template.id)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              template.active ? 'bg-primary' : 'bg-border'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                template.active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleOpenEditModal(template)}
                            className="p-1.5 rounded-control text-ink-muted hover:text-primary hover:bg-primary-50 transition-colors"
                          >
                            <Edit size={16} />
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
                +2.4%
              </span>
            </div>
            <div className="text-3xl font-bold text-ink">94.2%</div>
            <p className="text-xs text-ink-muted mt-2">Based on human-in-the-loop validation</p>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-ink-muted uppercase">Avg. Rating</span>
              <div className="flex text-warning">
                <Star size={14} className="fill-warning" />
                <Star size={14} className="fill-warning" />
                <Star size={14} className="fill-warning" />
                <Star size={14} className="fill-warning" />
                <Star size={14} className="fill-warning opacity-30" />
              </div>
            </div>
            <div className="text-3xl font-bold text-ink">
              4.8<span className="text-lg font-normal text-ink-muted">/5</span>
            </div>
            <p className="text-xs text-ink-muted mt-2">Across all active prompt templates</p>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-ink-muted uppercase">Total Rated Posts</span>
              <BarChart2 size={16} className="text-ink-muted" />
            </div>
            <div className="text-3xl font-bold text-ink">12,402</div>
            <p className="text-xs text-ink-muted mt-2">Lifetime feedback events recorded</p>
          </Card>
        </div>

        {/* Rating Distribution Chart Card */}
        <Card className="p-5 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-semibold text-ink">Rating Distribution</h4>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-canvas hover:bg-canvas/70 text-ink rounded-control text-xs font-semibold border border-border">
                Last 30 Days
              </button>
              <button className="p-1 rounded-control text-ink-muted hover:text-ink hover:bg-canvas">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4 max-w-3xl">
            {RATING_DISTRIBUTION.map((rating) => (
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
                  {rating.count}
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
                <p className="text-sm font-semibold text-ink">High Sentiment</p>
                <p className="text-xs text-ink-muted">93% of feedback is positive</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Optimization Hub</p>
                <p className="text-xs text-ink-muted">Recommended: Update "Casual" prompt</p>
              </div>
            </div>
          </div>
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
            <label className="text-sm font-medium text-ink">Description</label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Describe target tone, platforms, or guidelines..."
              className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Icon Theme</label>
            <select
              value={formState.icon}
              onChange={(e) => setFormState((prev) => ({ ...prev, icon: e.target.value }))}
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
            >
              <option value="description">Document / B2B (Indigo)</option>
              <option value="camera">Camera / Media (Emerald)</option>
              <option value="trending">Graph / Growth (Amber)</option>
            </select>
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