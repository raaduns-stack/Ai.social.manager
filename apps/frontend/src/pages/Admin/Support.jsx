import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  Search,
  Archive,
  MoreVertical,
  Paperclip,
  Smile,
  Image,
  Send,
  User,
  Inbox,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'

// Mock Data representing ticket priorities, statuses, and conversation histories
const INITIAL_TICKETS = [
  {
    id: 1,
    customer: 'Amaka Obi',
    status: 'Open',
    subject: "Payment issue with Pro subscription",
    preview: "Payment issue with Pro subscription - can't access features",
    priority: 'High',
    time: '12m ago',
    messages: [
      { sender: 'customer', name: 'Amaka Obi', time: '10:42 AM', text: "Hello support team, I upgraded to the Pro plan two hours ago but my dashboard still says I'm on the Free Tier. I can't access the multi-channel scheduler which I desperately need for a client campaign starting today." },
      { sender: 'admin', name: 'Alex Rivera', time: '10:45 AM', text: "Hi Amaka, I'm sorry to hear about this delay. I can see your payment was successful in our billing logs. Let me manually refresh your account status on our end. Just a moment." },
      { sender: 'customer', name: 'Amaka Obi', time: '10:48 AM', text: "Thank you Alex, that would be great. I've tried logging out and back in but it didn't help. Is there anything else I need to do?" },
      { sender: 'admin', name: 'Alex Rivera', time: '10:52 AM', text: "I've just updated your license seat manually. Could you please refresh your browser and check the 'Channels' tab? You should see all 12 slots available now." }
    ]
  },
  {
    id: 2,
    customer: 'Tunde Bakare',
    status: 'Pending',
    subject: "API endpoint returning 500 error",
    preview: "API endpoint returning 500 error on bulk upload...",
    priority: 'Medium',
    time: '45m ago',
    messages: [
      { sender: 'customer', name: 'Tunde Bakare', time: '09:30 AM', text: "Getting a 500 internal server error when uploading a CSV file with 50 posts. The server log mentions a timeout." },
      { sender: 'admin', name: 'Alex Rivera', time: '09:45 AM', text: "Hi Tunde, let me check the server logs. It looks like the processing takes longer than the timeout limit for large batch files. We are looking into extending it." }
    ]
  },
  {
    id: 3,
    customer: 'Sarah Jenkins',
    status: 'Open',
    subject: "Audience insights export",
    preview: "How do I export audience insights to PDF?",
    priority: 'Low',
    time: '2h ago',
    messages: [
      { sender: 'customer', name: 'Sarah Jenkins', time: '08:15 AM', text: "Hi, I am preparing a weekly report for my manager and need to export the audience graphs to PDF. Is there a button for that?" }
    ]
  },
  {
    id: 4,
    customer: 'Michael Chen',
    status: 'Resolved',
    subject: "Enterprise branding options",
    preview: "Request for custom enterprise branding options",
    priority: 'Medium',
    time: '5h ago',
    messages: [
      { sender: 'customer', name: 'Michael Chen', time: '05:10 AM', text: "We need custom domains and enterprise branding for client reports. Is this on your roadmap?" },
      { sender: 'admin', name: 'Alex Rivera', time: '05:30 AM', text: "Yes, Michael! Enterprise white-labeling is supported on our Custom plan. I've sent the details to your email." }
    ]
  },
  {
    id: 5,
    customer: 'Ibrahim Diallo',
    status: 'Open',
    subject: "Instagram scheduler issue",
    preview: "Instagram scheduler failing to post carousel...",
    priority: 'High',
    time: '6h ago',
    messages: [
      { sender: 'customer', name: 'Ibrahim Diallo', time: '04:00 AM', text: "My scheduled carousel post for Instagram failed twice. It says 'Media format not supported' even though they are standard JPGs." }
    ]
  }
]

export default function Support() {
  const [statusTab, setStatusTab] = useState('Open Tickets') // 'Open Tickets' | 'Pending Tickets' | 'Closed Tickets'
  const [activeChannel, setActiveChannel] = useState('tickets') // 'tickets' | 'chat' | 'whatsapp'
  const [tickets, setTickets] = useState(INITIAL_TICKETS)
  const [activeTicketId, setActiveTicketId] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [replyText, setReplyText] = useState('')

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false)

  // Message scroll reference
  const messageEndRef = useRef(null)

  // Filtered tickets based on search query AND status tab
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.preview.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesStatus = false
    if (statusTab === 'Open Tickets') {
      matchesStatus = t.status === 'Open'
    } else if (statusTab === 'Pending Tickets') {
      matchesStatus = t.status === 'Pending'
    } else if (statusTab === 'Closed Tickets') {
      matchesStatus = t.status === 'Closed' || t.status === 'Resolved'
    }

    return matchesSearch && matchesStatus
  })

  const activeTicket = tickets.find((t) => t.id === activeTicketId)

  // Auto-select first ticket in active status tab if activeTicketId is not in filtered list
  useEffect(() => {
    if (filteredTickets.length > 0 && !filteredTickets.some((t) => t.id === activeTicketId)) {
      setActiveTicketId(filteredTickets[0].id)
    }
  }, [statusTab, searchQuery, tickets])

  // Scroll to bottom on load/update of messages
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeChannel === 'tickets') {
      scrollToBottom()
    }
  }, [activeTicket?.messages, activeChannel, activeTicketId])

  const handleSendMessage = () => {
    if (!replyText.trim() || !activeTicketId) return

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newMessage = {
      sender: 'admin',
      name: 'Alex Rivera',
      time: timeString,
      text: replyText.trim(),
    }

    setTickets((prevTickets) =>
      prevTickets.map((t) => {
        if (t.id === activeTicketId) {
          return {
            ...t,
            messages: [...t.messages, newMessage],
            preview: newMessage.text,
            time: 'Just now',
          }
        }
        return t
      })
    )

    setReplyText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleArchiveTicket = () => {
    setTickets((prevTickets) =>
      prevTickets.map((t) => {
        if (t.id === activeTicketId) {
          return { ...t, status: 'Resolved' }
        }
        return t
      })
    )
    setShowArchiveModal(false)
  }

  // Get tone for badge mapping
  const getBadgeTone = (status) => {
    switch (status) {
      case 'Open':
        return 'primary'
      case 'Pending':
        return 'warning'
      case 'Resolved':
      case 'Closed':
        return 'success'
      default:
        return 'neutral'
    }
  }

  // Priority color indicators
  const getPriorityDotClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-danger'
      case 'Medium':
        return 'bg-warning'
      case 'Low':
        return 'bg-ink-muted opacity-40'
      default:
        return 'bg-ink-muted'
    }
  }

  const TABS = ['Open Tickets', 'Pending Tickets', 'Closed Tickets']

  const getTabCount = (tabName) => {
    return tickets.filter((t) => {
      if (tabName === 'Open Tickets') return t.status === 'Open'
      if (tabName === 'Pending Tickets') return t.status === 'Pending'
      if (tabName === 'Closed Tickets') return t.status === 'Closed' || t.status === 'Resolved'
      return false
    }).length
  }

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Page Header */}
      <div className="mb-4">
        <PageHeader
        action={<Badge tone="warning" className="font-bold uppercase tracking-wider text-xs px-3 py-1.5 border border-warning/30 bg-warning/5 text-warning shrink-0">DEV MODE: MOCK DATA (Backend Pending)</Badge>}
          title="Support Center"
          description="Manage client issues, live chat queries, and system assistance."
        />
      </div>

      {/* Top Status Tabs */}
      <div className="flex border-b border-border mb-4 shrink-0">
        {TABS.map((tab) => {
          const isActive = statusTab === tab
          const count = getTabCount(tab)
          return (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={cn(
                "px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 -mb-px",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-border"
              )}
            >
              <span>{tab}</span>
              <Badge tone={isActive ? 'primary' : 'neutral'} className="text-xs px-2 py-0.5">
                {count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Main Support Panel Workspace */}
      <div className="flex-1 flex border border-border rounded-card bg-surface overflow-hidden shadow-soft">
        
        {/* Left Panel: Ticket List */}
        <div className="w-[320px] md:w-[380px] flex flex-col border-r border-border bg-surface overflow-hidden shrink-0">
          
          {/* Sub-Navigation Tabs & Search */}
          <div className="px-6 pt-4 border-b border-border bg-canvas">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ink">Support Hub</h2>
              <div className="relative w-36">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-border rounded-control pl-7 pr-2 py-1 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveChannel('tickets')}
                className={cn(
                  "pb-3 border-b-2 font-semibold text-xs transition-colors",
                  activeChannel === 'tickets'
                    ? "border-primary text-primary"
                    : "border-transparent text-ink-muted hover:text-primary"
                )}
              >
                Tickets
              </button>
              <button
                onClick={() => setActiveChannel('chat')}
                className={cn(
                  "pb-3 border-b-2 font-semibold text-xs transition-colors",
                  activeChannel === 'chat'
                    ? "border-primary text-primary"
                    : "border-transparent text-ink-muted hover:text-primary"
                )}
              >
                Live Chat
              </button>
              <button
                onClick={() => setActiveChannel('whatsapp')}
                className={cn(
                  "pb-3 border-b-2 font-semibold text-xs transition-colors",
                  activeChannel === 'whatsapp'
                    ? "border-primary text-primary"
                    : "border-transparent text-ink-muted hover:text-primary"
                )}
              >
                WhatsApp
              </button>
            </div>
          </div>

          {/* Ticket Listing or Empty Lists */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/30 bg-surface">
            {activeChannel === 'tickets' ? (
              filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => {
                  const isActive = ticket.id === activeTicketId
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setActiveTicketId(ticket.id)}
                      className={cn(
                        "p-4 flex flex-col gap-1.5 cursor-pointer transition-colors border-l-4",
                        isActive
                          ? "bg-primary-50/50 border-primary"
                          : "border-transparent hover:bg-canvas"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-ink">{ticket.customer}</span>
                        <Badge tone={getBadgeTone(ticket.status)} className="px-2 py-0.5 text-[10px]">
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-muted truncate font-medium">{ticket.subject}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", getPriorityDotClass(ticket.priority))}></span>
                          <span className="text-[10px] text-ink-muted font-medium">{ticket.priority} Priority</span>
                        </div>
                        <span className="text-[10px] text-ink-muted">{ticket.time}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center text-ink-muted">
                  <p className="text-xs font-semibold">No {statusTab.toLowerCase()} found</p>
                  <p className="text-[11px] mt-1">Try broadening your search or switching tabs.</p>
                </div>
              )
            ) : (
              <div className="p-8 text-center text-ink-muted flex flex-col items-center justify-center h-full">
                <MessageSquare size={24} className="mb-2 opacity-40 text-ink-muted" />
                <p className="text-xs font-semibold">No active sessions</p>
                <p className="text-[10px] mt-1 leading-relaxed">Integration channels are ready but currently idle.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chat Thread or Channel Empty State */}
        {activeChannel === 'tickets' ? (
          activeTicket && filteredTickets.some(t => t.id === activeTicket.id) ? (
            <div className="flex-1 flex flex-col bg-canvas overflow-hidden">
              
              {/* Active Ticket Header */}
              <div className="px-6 py-4 bg-surface border-b border-border flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-ink">{activeTicket.subject}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-muted">
                    <User size={12} className="text-ink-muted" />
                    <span>Assigned to:</span>
                    <span className="font-semibold text-primary">Alex Rivera</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowArchiveModal(true)}
                    title="Mark resolved / Archive"
                    className="p-2 text-ink-muted hover:bg-canvas hover:text-ink transition-colors rounded-control"
                  >
                    <Archive size={16} />
                  </button>
                  <button className="p-2 text-ink-muted hover:bg-canvas hover:text-ink transition-colors rounded-control">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Message List Area */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-canvas">
                
                {/* Date separator */}
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-surface border border-border/50 rounded-full text-[10px] font-semibold text-ink-muted">
                    Today
                  </span>
                </div>

                {activeTicket.messages.map((msg, index) => {
                  const isAdmin = msg.sender === 'admin'
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        isAdmin ? "self-end items-end" : "self-start items-start"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {!isAdmin && <span className="text-xs font-bold text-ink">{msg.name}</span>}
                        <span className="text-[10px] text-ink-muted">{msg.time}</span>
                        {isAdmin && <span className="text-xs font-bold text-primary">{msg.name}</span>}
                      </div>
                      <div
                        className={cn(
                          "p-3 rounded-card text-sm shadow-soft border border-border/30",
                          isAdmin
                            ? "bg-primary text-white border-primary"
                            : "bg-surface text-ink-muted"
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  )
                })
                }
                <div ref={messageEndRef} />
              </div>

              {/* Bottom Reply Bar */}
              <div className="p-4 bg-surface border-t border-border shrink-0">
                <div className="flex items-end gap-3 bg-canvas border border-border rounded-card p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                  <div className="flex flex-col flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-sm text-ink py-1 px-3 min-h-[40px] max-h-[150px] overflow-y-auto"
                      placeholder="Type your reply..."
                      rows={1}
                    />
                    <div className="flex items-center gap-2 px-3 pb-1 pt-2">
                      <button type="button" className="text-ink-muted hover:text-primary transition-colors p-1 rounded hover:bg-surface">
                        <Paperclip size={16} />
                      </button>
                      <button type="button" className="text-ink-muted hover:text-primary transition-colors p-1 rounded hover:bg-surface">
                        <Smile size={16} />
                      </button>
                      <button type="button" className="text-ink-muted hover:text-primary transition-colors p-1 rounded hover:bg-surface">
                        <Image size={16} />
                      </button>
                      <div className="w-[1px] h-4 bg-border mx-2"></div>
                      <span className="text-[11px] text-ink-muted italic">Shift + Enter for new line</span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!replyText.trim()}
                    className="w-10 h-10 rounded-control flex items-center justify-center p-0 shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-canvas p-12">
              <EmptyState
                icon={<Inbox size={48} className="text-ink-muted" />}
                title="No Ticket Selected"
                description="Select a ticket from the active tab list to view history and draft responses."
              />
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 bg-canvas">
            <EmptyState
              icon={<MessageSquare size={48} className="text-ink-muted" />}
              title={`${activeChannel === 'chat' ? 'Live Chat' : 'WhatsApp'} Integration`}
              description={`The ${activeChannel === 'chat' ? 'Live Chat' : 'WhatsApp'} support channel is configured but not connected to live clients yet.`}
              action={
                <Button variant="outline" onClick={() => setActiveChannel('tickets')}>
                  Return to Tickets
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Archive Modal Confirmation */}
      <Modal
        open={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Resolve & Archive Ticket?"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted leading-relaxed">
            Are you sure you want to mark this ticket as <strong>Resolved</strong> and archive the thread? It will move to the Closed Tickets tab.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowArchiveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleArchiveTicket}>
              Confirm & Resolve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
