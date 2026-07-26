import { useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import { MessageCircle, ChevronRight, ShieldCheck, History, Eye, ChevronDown, Bot, Send } from 'lucide-react'

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
    subject: 'Invoice #INV-2026-011 missing',
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
// AI Chatbot mock data — canned responses so the bot "feels" smart
// ---------------------------------------------------------------------------
const WHATSAPP_NUMBER = '09120879032' // TODO: replace with your real support number (no + , spaces, or dashes)
const WHATSAPP_PREFILL = "Hi! I'd like help with my account."

const INITIAL_BOT_MESSAGE = {
  id: 'bot-welcome',
  role: 'bot',
  text: "Hi! I'm your AI assistant. I know this platform inside and out — ask me about channels, billing, AI Words, or team settings.",
}

function getBotReply(userText) {
  const text = userText.toLowerCase()

  if (text.includes('invoice') || text.includes('billing') || text.includes('payment')) {
    return "You'll find all your invoices under Billing → Payment History. Each entry has a 'Download PDF' icon next to it."
  }
  if (text.includes('channel') || text.includes('connect')) {
    return "To connect a new channel, open the Channels tab, click 'Connect Channel', pick your platform, then follow the OAuth steps."
  }
  if (text.includes('ai word') || text.includes('credit') || text.includes('quota')) {
    return "AI Words are the credits used to generate captions, hashtags, and strategy suggestions. You can track your monthly quota on the Dashboard."
  }
  if (text.includes('team') || text.includes('invite') || text.includes('collaborat')) {
    return "You can invite teammates from Settings → Team. Team and Enterprise plans support Viewer, Editor, and Admin roles."
  }
  return "Got it — I can help with channels, billing, AI Words, and team settings. For anything more specific, our human support team is one tap away on WhatsApp."
}

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
          className={`text-ink-muted flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-48' : 'max-h-0'
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

  // AI Chatbot state
  const [chatMessages, setChatMessages] = useState([INITIAL_BOT_MESSAGE])
  const [chatInput, setChatInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)

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

  // Handles sending a message to the mock AI chatbot
  const handleChatSend = (e) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text) return

    const userMsg = { id: `user-${Date.now()}`, role: 'user', text }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setBotTyping(true)

    setTimeout(() => {
      const botMsg = { id: `bot-${Date.now()}`, role: 'bot', text: getBotReply(text) }
      setChatMessages((prev) => [...prev, botMsg])
      setBotTyping(false)
    }, 900)
  }

  const toggleFaq = (id) => setOpenFaq((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Support Center"
        description="Need help? We're here for you 24/7. Browse FAQs or reach out directly."
      />

      {/* Main Grid: Ticket Form + Support Sidebar */}
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

        {/* ── Support Sidebar: AI Chatbot + WhatsApp ── */}
        <div className="space-y-6">
          {/* AI Chatbot Card */}
          <Card className="p-0 overflow-hidden flex flex-col" style={{ height: '440px' }}>
            {/* Chatbot header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-canvas">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                <Bot size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">AI Assistant</p>
                <p className="text-xs text-ink-muted flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  Online — knows the platform
                </p>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-card text-sm leading-relaxed ${msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-canvas text-ink rounded-bl-none'
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {botTyping && (
                <div className="flex justify-start">
                  <div className="bg-canvas text-ink-muted px-3.5 py-2.5 rounded-card rounded-bl-none text-sm">
                    typing…
                  </div>
                </div>
              )}
            </div>

            {/* Chat input */}
            <form
              onSubmit={handleChatSend}
              className="flex items-center gap-2 px-4 py-3 border-t border-border bg-canvas"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything…"
                className="flex-1 h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="submit"
                className="w-10 h-10 flex-shrink-0 rounded-control bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                title="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </Card>

          {/* WhatsApp Human Support Button */}

          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 p-4 rounded-card bg-[#25D366] hover:bg-[#1FBF5C] transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white flex-shrink-0">
              {/* WhatsApp glyph (inline SVG, no extra icon package needed) */}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.15.347-.397.520-.596.174-.198.232-.34.348-.566.116-.225.058-.42-.04-.57-.099-.149-.669-1.612-.917-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.05 3.13 4.965 4.264.694.269 1.235.43 1.657.55.696.198 1.33.17 1.83.103.558-.075 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12.004 2.003c-5.523 0-10 4.477-10 10 0 1.771.468 3.483 1.352 4.976L2 22l5.176-1.334A9.953 9.953 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-9.997-10-9.997zm0 18.166a8.14 8.14 0 0 1-4.15-1.135l-.297-.177-3.077.793.822-3.001-.194-.309a8.15 8.15 0 0 1-1.256-4.34c0-4.508 3.67-8.176 8.155-8.176 4.485 0 8.153 3.668 8.153 8.176 0 4.508-3.668 8.169-8.156 8.169z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white leading-tight">Human Support</p>
              <p className="text-xs text-white/90">Chat on WhatsApp</p>
            </div>
            <ChevronRight size={18} className="text-white ml-auto flex-shrink-0" />
          </a>
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
                      className={`px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider${i === 4 ? ' text-right' : ''
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