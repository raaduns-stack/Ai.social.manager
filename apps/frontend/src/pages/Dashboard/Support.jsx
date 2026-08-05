import { useState, useEffect, useRef } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Loader from '../../components/ui/Loader'
import { 
  getFaqs, 
  getTickets, 
  getTicketDetails, 
  createTicket, 
  addTicketMessage,
} from '../../features/support/support-api'
import { 
  HelpCircle, 
  History, 
  Eye, 
  ChevronDown, 
  Bot, 
  Send, 
  Plus, 
  ArrowLeft,
  MessageSquare,
  Clock,
  User
} from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Support() {
  const [activeTab, setActiveTab] = useState('faqs')
  
  // FAQs State
  const [faqs, setFaqs] = useState([])
  const [loadingFaqs, setLoadingFaqs] = useState(true)
  const [faqSearch, setFaqSearch] = useState('')
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('All')
  const [openFaqId, setOpenFaqId] = useState(null)

  // Tickets State
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  
  // New Ticket Form State
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('General')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [submittingTicket, setSubmittingTicket] = useState(false)
  const [ticketError, setTicketError] = useState(null)

  // Selected Ticket/Thread State
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  // Chatbot State (Client-side mock/interactive)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'bot-welcome',
      role: 'bot',
      text: "Hi! I'm your AI assistant. I know this platform inside and out — ask me about channels, billing, AI Words, or team settings.",
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)
  const WHATSAPP_NUMBER = '09120879032' // Mock support WhatsApp number
  const WHATSAPP_PREFILL = "Hi! I'd like help with my account."

  const messagesEndRef = useRef(null)

  // Load FAQs and Tickets
  useEffect(() => {
    async function loadFaqs() {
      try {
        const data = await getFaqs()
        setFaqs(data)
      } catch (err) {
        console.error('Failed to fetch FAQs:', err)
      } finally {
        setLoadingFaqs(false)
      }
    }

    async function loadTickets() {
      try {
        const data = await getTickets()
        setTickets(data)
      } catch (err) {
        console.error('Failed to fetch tickets:', err)
      } finally {
        setLoadingTickets(false)
      }
    }

    loadFaqs()
    loadTickets()
  }, [])

  // Poll / Reload ticket details when viewing thread
  useEffect(() => {
    if (!selectedTicketId) return

    let isMounted = true
    async function fetchThread() {
      setLoadingThread(true)
      try {
        const data = await getTicketDetails(selectedTicketId)
        if (isMounted) {
          setSelectedTicket(data)
        }
      } catch (err) {
        console.error('Failed to fetch ticket details:', err)
      } finally {
        if (isMounted) {
          setLoadingThread(false)
        }
      }
    }

    fetchThread()

    return () => {
      isMounted = false
    }
  }, [selectedTicketId])

  // Scroll thread to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedTicket?.messages, selectedTicketId])

  // FAQ Filtering
  const faqCategories = ['All', ...Array.from(new Set(faqs.map((f) => f.category)))]
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
    const matchesCategory =
      selectedFaqCategory === 'All' || faq.category === selectedFaqCategory
    return matchesSearch && matchesCategory
  })

  // Submit Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault()
    setSubmittingTicket(true)
    setTicketError(null)

    try {
      const ticket = await createTicket({
        subject,
        category,
        message: description,
        priority,
      })
      setTickets((prev) => [ticket, ...prev])
      setIsNewTicketOpen(false)
      // Reset form
      setSubject('')
      setCategory('General')
      setDescription('')
      setPriority('medium')
      // Auto open the new ticket thread
      setSelectedTicketId(ticket.id)
    } catch (err) {
      setTicketError(err?.message || 'Failed to create support ticket. Please try again.')
    } finally {
      setSubmittingTicket(false)
    }
  }

  // Submit Reply Message
  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicketId) return

    setSubmittingReply(true)
    try {
      const newMsg = await addTicketMessage(selectedTicketId, replyText.trim())
      setSelectedTicket((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...(prev.messages || []), newMsg],
          status: 'open', // Reopens/updates state visually
        }
      })
      setReplyText('')
      
      // Update the ticket status in the main list
      setTickets(prev => prev.map(t => t.id === selectedTicketId ? { ...t, status: 'open' } : t))
    } catch (err) {
      console.error('Failed to send reply:', err)
    } finally {
      setSubmittingReply(false)
    }
  }

  // Bot mock interactions
  const handleBotChat = (e) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text) return

    const userMsg = { id: `user-${Date.now()}`, role: 'user', text }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setBotTyping(true)

    setTimeout(() => {
      let reply = "Got it — I can help with channels, billing, AI Words, and team settings. For anything more specific, our human support team is one tap away on WhatsApp."
      const query = text.toLowerCase()
      if (query.includes('invoice') || query.includes('billing') || query.includes('payment')) {
        reply = "You'll find all your invoices under Billing → Payment History. Each entry has a 'Download PDF' icon next to it."
      } else if (query.includes('channel') || query.includes('connect')) {
        reply = "To connect a new channel, open the Channels tab, click 'Connect Channel', pick your platform, then follow the OAuth steps."
      } else if (query.includes('ai word') || query.includes('credit') || query.includes('quota')) {
        reply = "AI Words are the credits used to generate captions, hashtags, and strategy suggestions. You can track your monthly quota on the Dashboard."
      } else if (query.includes('team') || query.includes('invite') || query.includes('collaborat')) {
        reply = "You can invite teammates from Settings → Team. Team and Enterprise plans support Viewer, Editor, and Admin roles."
      }

      setChatMessages((prev) => [...prev, { id: `bot-${Date.now()}`, role: 'bot', text: reply }])
      setBotTyping(false)
    }, 850)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
      case 'in_progress':
        return <Badge tone="warning">In Progress</Badge>
      case 'resolved':
      case 'closed':
        return <Badge tone="success">Resolved</Badge>
      default:
        return <Badge tone="neutral">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Center"
        description="Browse our FAQs, talk to our AI chatbot, or open a direct ticket with our helpdesk team."
      />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            setActiveTab('faqs')
            setSelectedTicketId(null)
          }}
          className={cn(
            'px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2',
            activeTab === 'faqs' && !selectedTicketId
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          )}
        >
          <HelpCircle size={16} />
          Frequently Asked Questions
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={cn(
            'px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2',
            activeTab === 'tickets' || selectedTicketId
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          )}
        >
          <History size={16} />
          My Tickets
        </button>
      </div>

      {/* Thread View Gate */}
      {selectedTicketId ? (
        <div className="space-y-4">
          <button
            onClick={() => {
              setSelectedTicketId(null)
              setSelectedTicket(null)
            }}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink font-semibold"
          >
            <ArrowLeft size={16} />
            Back to Tickets
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Thread Area */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6">
                <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-ink">{selectedTicket?.subject}</h2>
                    <p className="text-xs text-ink-muted mt-1">
                      Category: <span className="font-semibold text-ink">{selectedTicket?.category}</span>
                    </p>
                  </div>
                  <div>{selectedTicket && getStatusBadge(selectedTicket.status)}</div>
                </div>

                {loadingThread ? (
                  <div className="py-12 flex justify-center">
                    <Loader size={24} label="Loading conversation thread..." />
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[380px] overflow-y-auto pr-2 mb-4 flex flex-col">
                    {selectedTicket?.messages?.map((msg, index) => {
                      const isCurrentUser = msg.senderId === selectedTicket.userId
                      return (
                        <div
                          key={msg.id || index}
                          className={cn(
                            'flex flex-col max-w-[85%] rounded-card p-3.5 text-sm',
                            isCurrentUser
                              ? 'bg-primary/5 border border-primary-100 self-end text-ink'
                              : 'bg-canvas border border-border self-start text-ink'
                          )}
                        >
                          <div className="flex justify-between items-center gap-4 mb-1 text-[10px] text-ink-muted font-medium">
                            <span className="flex items-center gap-1">
                              <User size={10} />
                              {isCurrentUser ? 'You' : 'Support Agent'}
                            </span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Reply Form */}
                {selectedTicket?.status !== 'closed' && (
                  <form onSubmit={handleSendReply} className="border-t border-border pt-4">
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply message..."
                        required
                        rows={2}
                        className="flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submittingReply || !replyText.trim()}
                        className="h-10 px-4 flex items-center justify-center gap-2 shrink-0"
                      >
                        <Send size={14} />
                        {submittingReply ? 'Sending...' : 'Reply'}
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            </div>

            {/* Sidebar chatbot info */}
            <div>
              <Card className="p-4 bg-canvas text-ink-muted space-y-3">
                <h3 className="text-sm font-semibold text-ink">Ticket Metadata</h3>
                <div className="text-xs space-y-2 leading-relaxed">
                  <p>
                    <span className="font-semibold text-ink">Ticket ID:</span> {selectedTicket?.id}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Created:</span>{' '}
                    {selectedTicket && new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-semibold text-ink">Last Activity:</span>{' '}
                    {selectedTicket && new Date(selectedTicket.updatedAt).toLocaleString()}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : activeTab === 'faqs' ? (
        // FAQ View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main FAQ list */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search FAQ questions or answers..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full h-11 rounded-control border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-soft"
                />
              </div>

              {/* Chips */}
              {!loadingFaqs && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {faqCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedFaqCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-semibold rounded-full border transition-all',
                        selectedFaqCategory === cat
                          ? 'bg-primary border-primary text-white'
                          : 'bg-surface border-border text-ink-muted hover:text-ink'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* FAQ List */}
              {loadingFaqs ? (
                <div className="py-12 flex justify-center">
                  <Loader size={24} label="Loading FAQs..." />
                </div>
              ) : filteredFaqs.length > 0 ? (
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => {
                    const isOpen = openFaqId === faq.id
                    return (
                      <div key={faq.id} className="border border-border rounded-card overflow-hidden bg-surface transition-all">
                        <button
                          onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-canvas transition-colors"
                        >
                          <span className="text-sm font-medium text-ink">{faq.question}</span>
                          <ChevronDown
                            size={18}
                            className={cn('text-ink-muted shrink-0 transition-transform duration-300', isOpen && 'rotate-180')}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 text-sm text-ink-muted leading-relaxed border-t border-border/30 pt-3 bg-canvas/30">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-ink-muted text-sm">
                  No FAQs found matching your query.
                </div>
              )}
            </Card>
          </div>

          {/* AI Assist Sidebar */}
          <div className="space-y-6">
            <Card className="p-0 overflow-hidden flex flex-col border-border shadow-soft" style={{ height: '400px' }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-canvas">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                  <Bot size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">AI Assistant</p>
                  <p className="text-[10px] text-ink-muted flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                    Online helpdesk bot
                  </p>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] px-3 py-2 rounded-card text-xs leading-relaxed',
                        msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-canvas text-ink rounded-bl-none'
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {botTyping && (
                  <div className="flex justify-start">
                    <div className="bg-canvas text-ink-muted px-3 py-2 rounded-card rounded-bl-none text-xs italic">
                      thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Form Input */}
              <form onSubmit={handleBotChat} className="flex gap-2 p-3 border-t border-border bg-canvas">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 h-9 rounded-control border border-border bg-surface px-3 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-control bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </Card>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 p-4 rounded-card bg-[#25D366] hover:bg-[#1FBF5C] transition-colors text-white shadow-soft"
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.15.347-.397.520-.596.174-.198.232-.34.348-.566.116-.225.058-.42-.04-.57-.099-.149-.669-1.612-.917-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.05 3.13 4.965 4.264.694.269 1.235.43 1.657.55.696.198 1.33.17 1.83.103.558-.075 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12.004 2.003c-5.523 0-10 4.477-10 10 0 1.771.468 3.483 1.352 4.976L2 22l5.176-1.334A9.953 9.953 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-9.997-10-9.997zm0 18.166a8.14 8.14 0 0 1-4.15-1.135l-.297-.177-3.077.793.822-3.001-.194-.309a8.15 8.15 0 0 1-1.256-4.34c0-4.508 3.67-8.176 8.155-8.176 4.485 0 8.153 3.668 8.153 8.176 0 4.508-3.668 8.169-8.156 8.169z" />
                </svg>
              </div>
              <div className="text-left leading-tight">
                <p className="text-sm font-bold">Human Support Desk</p>
                <p className="text-[10px] text-white/95">Chat on WhatsApp</p>
              </div>
            </a>
          </div>
        </div>
      ) : (
        // Ticket List View
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-ink">Support Tickets</h2>
            <Button variant="primary" className="flex items-center gap-1.5" onClick={() => setIsNewTicketOpen(true)}>
              <Plus size={16} />
              New Ticket
            </Button>
          </div>

          <Card className="overflow-hidden">
            {loadingTickets ? (
              <div className="py-12 flex justify-center">
                <Loader size={24} label="Loading your tickets..." />
              </div>
            ) : tickets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-canvas border-b border-border text-ink-muted font-medium text-xs">
                      <th className="px-6 py-3">Subject</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Last Updated</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-canvas transition-colors">
                         <td className="px-6 py-4 font-semibold text-ink">{ticket.subject}</td>
                        <td className="px-6 py-4 text-ink-muted">{ticket.category}</td>
                        <td className="px-6 py-4 text-ink-muted">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="p-1.5 hover:bg-primary-50 rounded-control text-ink-muted hover:text-primary transition-all"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-ink-muted">
                <p className="font-semibold">No tickets yet.</p>
                <p className="text-xs mt-1">If you have any questions or issues, feel free to open a ticket above.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* New Ticket Modal */}
      <Modal open={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)} title="Create a Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4">
          {ticketError && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-control text-xs">
              {ticketError}
            </div>
          )}

          <Input
            label="Subject"
            id="ticket-subject"
            placeholder="Brief summary of your issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ticket-category" className="text-xs font-semibold text-ink">
              Category
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="General">General</option>
              <option value="Technical Issue">Technical Issue</option>
              <option value="Billing & Invoices">Billing & Invoices</option>
              <option value="AI Suggestions Feedback">AI Suggestions Feedback</option>
              <option value="Channel Connection">Channel Connection</option>
              <option value="Feature Request">Feature Request</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ticket-description" className="text-xs font-semibold text-ink">
              Description
            </label>
            <textarea
              id="ticket-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              required
              className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsNewTicketOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submittingTicket}>
              {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}