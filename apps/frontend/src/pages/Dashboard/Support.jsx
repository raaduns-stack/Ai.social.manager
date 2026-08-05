import { useState, useEffect, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
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
  getWhatsappLink
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
  User,
  Lock,
  MessageCircle
} from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Support() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('faqs')
  
  // WhatsApp State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false)
  
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
  const handleWhatsappClick = async () => {
    const isPremium = user?.plan?.slug === 'growth' || user?.plan?.slug === 'enterprise'
    if (!isPremium) {
      setIsUpgradeModalOpen(true)
      return
    }

    setLoadingWhatsapp(true)
    try {
      const { url } = await getWhatsappLink()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      // 403 means stale state or not premium
      if (err?.statusCode === 403 || err?.response?.status === 403) {
        setIsUpgradeModalOpen(true)
      } else {
        console.error('Failed to get WhatsApp link:', err)
      }
    } finally {
      setLoadingWhatsapp(false)
    }
  }

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
        <Card className="p-6">
          {/* Search & WhatsApp */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search FAQ questions or answers..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="flex-1 h-11 rounded-control border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-soft"
            />
            
            <Button
              variant="outline"
              onClick={handleWhatsappClick}
              disabled={loadingWhatsapp}
              className="h-11 px-5 flex items-center gap-2 whitespace-nowrap shrink-0 border-primary-500/30 hover:border-primary-500 hover:bg-primary-50 text-primary-700"
            >
              {loadingWhatsapp ? (
                <Loader size={16} />
              ) : (
                <MessageCircle size={18} />
              )}
              Premium Human Support
              {(!user?.plan?.slug || !['growth', 'enterprise'].includes(user.plan.slug)) && (
                <Badge tone="warning" className="ml-1 scale-90"><Lock size={12} className="mr-1 inline" />Locked</Badge>
              )}
            </Button>
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

      {/* Upgrade Modal */}
      <Modal open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} title="Premium Feature">
        <div className="space-y-4 py-2">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center text-warning">
              <Lock size={24} />
            </div>
          </div>
          <p className="text-center text-sm text-ink-muted leading-relaxed">
            Direct WhatsApp human support is a premium feature available on our <strong className="text-ink">Growth</strong> and <strong className="text-ink">Enterprise</strong> plans. 
            Upgrade your plan to instantly connect with our support agents.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
              Maybe Later
            </Button>
            <Button variant="primary" onClick={() => { setIsUpgradeModalOpen(false); navigate('/pricing'); }}>
              Upgrade Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}