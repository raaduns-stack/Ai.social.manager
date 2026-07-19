import { useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import { MessageCircle, ChevronRight, ShieldCheck, History, Eye, ChevronDown } from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const TICKETS = [
  {
    id: '#TK-8902',
    subject: 'Instagram API connection error',
    updated: '2 hours ago',
    status: 'In Progress',
    tone: 'warning',
  },
  {
    id: '#TK-8854',
    subject: 'Invoice #INV-2023-011 missing',
    updated: 'Yesterday',
    status: 'Resolved',
    tone: 'success',
  },
  {
    id: '#TK-8840',
    subject: 'AI Generator creating repetitive captions',
    updated: '3 days ago',
    status: 'Waiting for Reply',
    tone: 'primary',
  },
]

const FAQS = [
  {
    id: 'faq-1',
    question: 'How do I connect a new channel?',
    answer:
      "To connect a new social media channel, navigate to the 'Channels' tab in the sidebar. Click on the 'Connect Channel' button at the top right, select your platform (e.g., LinkedIn, Instagram), and follow the secure OAuth authentication steps.",
  },
  {
    id: 'faq-2',
    question: 'Where can I download my invoices?',
    answer:
      "All your billing information is located in the 'Billing' section of the sidebar. Under the 'Payment History' tab, you can see a list of all past transactions and click the 'Download PDF' icon next to each entry to save your invoice.",
  },
  {
    id: 'faq-3',
    question: 'What are AI Words?',
    answer:
      'AI Words are the currency used by our generative engine to craft captions, hashtags, and strategy suggestions. Each generation consumes a specific number of AI Words depending on its complexity. You can track your monthly quota in the Dashboard.',
  },
  {
    id: 'faq-4',
    question: 'Can I share my workspace with teammates?',
    answer:
      "Yes! On Team and Enterprise plans, you can invite collaborators via the 'Settings > Team' menu. You can assign different roles like 'Viewer', 'Editor', or 'Admin' to control access levels.",
  },
]

// ---------------------------------------------------------------------------
// AccordionItem
// ---------------------------------------------------------------------------
function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-border rounded-card overflow-hidden bg-surface">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-canvas transition-colors"
      >
        <span className="text-sm font-medium text-ink">{question}</span>
        <ChevronDown
          size={18}
          className={`text-ink-muted flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? 'max-h-48' : 'max-h-0'
        }`}
      >
        <p className="px-6 pb-5 text-sm text-ink-muted leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
/**
 * Support — Stitch-generated Support Center design converted to React.
 */
export default function Support() {
  // Ticket form state
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Technical Issue')
  const [message, setMessage] = useState('')
  /** @type {'idle'|'submitting'|'sent'} */
  const [submitState, setSubmitState] = useState('idle')

  // Accordion: id of currently open FAQ (null = all closed)
  const [openFaq, setOpenFaq] = useState(FAQS[0].id)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitState('submitting')
    setTimeout(() => {
      setSubmitState('sent')
      setTimeout(() => {
        setSubmitState('idle')
        setSubject('')
        setCategory('Technical Issue')
        setMessage('')
      }, 2000)
    }, 1500)
  }

  const toggleFaq = (id) => setOpenFaq((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Support Center"
        description="Need help? We're here for you 24/7. Browse FAQs or reach out directly."
      />

      {/* Main Grid: Ticket Form + Quick Help */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Create Support Ticket ── */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-control bg-primary-50 flex items-center justify-center">
                {/* Ticket icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-primary"
                >
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="M13 5v2" />
                  <path d="M13 17v2" />
                  <path d="M13 11v2" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-ink">Create a Support Ticket</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Subject"
                  id="support-subject"
                  placeholder="Brief summary of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="support-category" className="text-sm font-medium text-ink">
                    Category
                  </label>
                  <select
                    id="support-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option>Technical Issue</option>
                    <option>Billing &amp; Invoices</option>
                    <option>AI Suggestions Feedback</option>
                    <option>Channel Connection</option>
                    <option>Feature Request</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="support-message" className="text-sm font-medium text-ink">
                  Message
                </label>
                <textarea
                  id="support-message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your problem in detail..."
                  required
                  className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-ink-muted">Estimated response time: &lt; 2 hours</p>
                <Button
                  type="submit"
                  variant={submitState === 'sent' ? 'secondary' : 'primary'}
                  disabled={submitState !== 'idle'}
                  className="min-w-[140px]"
                >
                  {submitState === 'submitting' && 'Submitting…'}
                  {submitState === 'sent' && '✓ Sent!'}
                  {submitState === 'idle' && 'Submit Ticket'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* ── Quick Help Sidebar ── */}
        <div className="space-y-6">
          <Card className="p-6 overflow-hidden relative">
            {/* Decorative glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-50 rounded-full blur-2xl pointer-events-none" />

            <h3 className="text-base font-semibold text-ink mb-1 relative">Quick Help</h3>
            <p className="text-sm text-ink-muted mb-5 relative">
              Need an immediate answer? Try our instant support channels.
            </p>

            <div className="space-y-3 relative">
              {/* Live Chat */}
              <button className="w-full flex items-center justify-between p-3 rounded-card border border-primary-100 bg-primary-50 hover:bg-primary-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                    <MessageCircle size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-primary">Live Chat</p>
                    <p className="text-xs text-ink-muted">Average wait: 2 mins</p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-primary group-hover:translate-x-1 transition-transform"
                />
              </button>

              {/* WhatsApp */}
              <button className="w-full flex items-center justify-between p-3 rounded-card border border-accent-100 bg-accent-50 hover:bg-accent-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white flex-shrink-0">
                    <MessageCircle size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-accent-600">Contact via WhatsApp</p>
                    <p className="text-xs text-ink-muted">Available 9am–6pm EST</p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-accent-600 group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>

            {/* Priority Support */}
            <div className="mt-5 pt-5 border-t border-border relative">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-primary" />
                <p className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Priority Support
                </p>
              </div>
              <p className="text-xs text-ink-muted">
                Pro members get access to a dedicated account manager and video call support.
              </p>
              <a
                href="#"
                className="inline-block mt-3 text-sm font-semibold text-primary hover:underline"
              >
                Learn more about Pro
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* ── My Tickets ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">My Tickets</h2>
          <Button variant="ghost" size="sm" className="gap-1.5 text-primary">
            <History size={16} />
            View Archive
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border">
                  {['Ticket ID', 'Subject', 'Last Updated', 'Status', ''].map((col, i) => (
                    <th
                      key={col || i}
                      className={`px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider${
                        i === 4 ? ' text-right' : ''
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TICKETS.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-canvas transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-ink">{ticket.id}</td>
                    <td className="px-6 py-4 text-sm text-ink">{ticket.subject}</td>
                    <td className="px-6 py-4 text-sm text-ink-muted">{ticket.updated}</td>
                    <td className="px-6 py-4">
                      <Badge tone={ticket.tone}>{ticket.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        title={`View ticket ${ticket.id}`}
                        className="text-ink-muted hover:text-primary transition-colors p-1.5 rounded-control hover:bg-primary-50"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── FAQ ── */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-ink mb-1">Frequently Asked Questions</h2>
          <p className="text-sm text-ink-muted">
            Quick answers to common questions about the platform.
          </p>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq) => (
            <AccordionItem
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaq === faq.id}
              onToggle={() => toggleFaq(faq.id)}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-muted">
          Didn't find what you were looking for?{' '}
          <a href="#" className="font-semibold text-primary hover:underline">
            Browse our Full Documentation
          </a>
        </p>
      </div>
    </div>
  )
}
