import { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Loader,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import {
  adminGetFaqs,
  adminCreateFaq,
  adminUpdateFaq,
  adminDeleteFaq,
} from '../../features/support/support-api'

export default function Faqs() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search & Filter
  const [search, setSearch] = useState('')

  // Modal State
  const [isOpen, setIsOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)

  // Form State
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')
  const [isPublished, setIsPublished] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadFaqs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminGetFaqs()
      setFaqs(data)
    } catch (err) {
      setError('Failed to load FAQs. Please make sure the backend is online.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFaqs()
  }, [])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingFaq(null)
    setQuestion('')
    setAnswer('')
    setCategory('General')
    setDisplayOrder('0')
    setIsPublished(false)
    setFormError(null)
    setIsOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (faq) => {
    setEditingFaq(faq)
    setQuestion(faq.question)
    setAnswer(faq.answer)
    setCategory(faq.category)
    setDisplayOrder(String(faq.displayOrder))
    setIsPublished(faq.isPublished)
    setFormError(null)
    setIsOpen(true)
  }

  // Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const payload = {
      question,
      answer,
      category,
      displayOrder: parseInt(displayOrder, 10) || 0,
      isPublished,
    }

    try {
      if (editingFaq) {
        const updated = await adminUpdateFaq(editingFaq.id, payload)
        setFaqs((prev) => prev.map((f) => (f.id === editingFaq.id ? updated : f)))
      } else {
        const created = await adminCreateFaq(payload)
        setFaqs((prev) => [...prev, created])
      }
      setIsOpen(false)
    } catch (err) {
      setFormError(err?.message || 'Something went wrong. Please check fields.')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle published status inline
  const handleTogglePublish = async (faq) => {
    try {
      const newStatus = !faq.isPublished
      const updated = await adminUpdateFaq(faq.id, { isPublished: newStatus })
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? updated : f)))
    } catch (err) {
      console.error('Failed to toggle publish status:', err)
    }
  }

  // Delete FAQ
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    try {
      await adminDeleteFaq(id)
      setFaqs((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      console.error('Failed to delete FAQ:', err)
    }
  }

  // Filter FAQs
  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQ Manager"
        description="Add, modify, or publish FAQs displayed on the customer Support page."
        action={
          <Button variant="primary" onClick={handleOpenCreate} className="flex items-center gap-1.5">
            <Plus size={16} />
            Create FAQ
          </Button>
        }
      />

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-control text-sm">
          {error}
        </div>
      )}

      {/* Search Filter */}
      <div className="relative w-full max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 rounded-control border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 shadow-soft"
        />
      </div>

      {/* FAQ Table Card */}
      <Card className="overflow-hidden p-0 border border-border rounded-card">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader size={24} label="Loading FAQs..." />
          </div>
        ) : filteredFaqs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-canvas border-b border-border text-ink-muted font-semibold text-xs">
                  <th className="px-6 py-3 w-16 text-center">Order</th>
                  <th className="px-6 py-3">Question</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredFaqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-6 py-4 text-center font-mono text-xs text-ink-muted">
                      {faq.displayOrder}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-ink leading-snug">{faq.question}</p>
                        <p className="text-xs text-ink-muted mt-1 line-clamp-2 max-w-xl">{faq.answer}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone="neutral" className="capitalize">
                        {faq.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(faq)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                          faq.isPublished
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-ink-muted bg-canvas border-border hover:bg-[#F9FAFB]'
                        }`}
                        title={faq.isPublished ? 'Click to Unpublish' : 'Click to Publish'}
                      >
                        {faq.isPublished ? (
                          <>
                            <Eye size={12} />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(faq)}
                          className="p-1.5 text-ink-muted hover:text-primary hover:bg-primary-50 rounded-control transition-all"
                          title="Edit FAQ"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-1.5 text-ink-muted hover:text-danger hover:bg-danger/5 rounded-control transition-all"
                          title="Delete FAQ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-ink-muted">
            <p className="font-semibold">No FAQs found.</p>
            <p className="text-xs mt-1">Click "Create FAQ" above to add your first record.</p>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-control text-xs">
              {formError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="faq-question" className="text-xs font-semibold text-ink">
              Question
            </label>
            <textarea
              id="faq-question"
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="E.g., How do I renew my plan?"
              required
              className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="faq-answer" className="text-xs font-semibold text-ink">
              Answer
            </label>
            <textarea
              id="faq-answer"
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide a detailed explanation..."
              required
              className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              id="faq-category"
              placeholder="E.g., Billing, Technical"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />

            <Input
              label="Display Order"
              id="faq-order"
              type="number"
              min="0"
              placeholder="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="faq-published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-primary border-border focus:ring-primary"
            />
            <label htmlFor="faq-published" className="text-sm text-ink font-semibold">
              Publish immediately
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save FAQ'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
