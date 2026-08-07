import { useState, useEffect, useRef } from 'react'
import {
  Search,
  X,
  Send,
  User,
  Loader,
  MessageSquare,
  ArrowRight,
  HelpCircle,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { getAdminUsers } from '../../features/admin/admin-api'
import {
  adminGetTickets,
  adminGetTicketDetails,
  adminAssignTicket,
  adminUpdateTicketStatus,
  adminAddTicketMessage,
} from '../../features/support/support-api'
import { cn } from '../../utils/cn'
import { useAdminAuth } from '../../context/useAdminAuth'

export default function Support() {
  const { admin } = useAdminAuth()
  const isSuperAdmin = admin?.role === 'super_admin'

  const [tickets, setTickets] = useState([])
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Drawer state for replying
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const messagesEndRef = useRef(null)

  // Fetch initial tickets and staff list
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [allTickets, allUsers] = await Promise.all([
        adminGetTickets(),
        getAdminUsers(),
      ])
      setTickets(allTickets)
      // Staff members are those whose role is not 'user'
      const staff = allUsers.filter((u) => u.role !== 'user')
      setStaffList(staff)
    } catch (err) {
      console.error(err)
      setError('Failed to load support tickets. Please ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Poll ticket thread details when selected
  useEffect(() => {
    if (!selectedTicketId) return

    let isMounted = true
    async function loadThread() {
      setLoadingThread(true)
      try {
        const ticketDetail = await adminGetTicketDetails(selectedTicketId)
        if (isMounted) {
          setSelectedTicket(ticketDetail)
        }
      } catch (err) {
        console.error('Failed to load ticket thread:', err)
      } finally {
        if (isMounted) {
          setLoadingThread(false)
        }
      }
    }

    loadThread()

    return () => {
      isMounted = false
    }
  }, [selectedTicketId])

  // Scroll to bottom of message thread
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedTicket?.messages, selectedTicketId])

  // Inline Handlers: Assign Ticket
  const handleAssign = async (ticketId, staffId) => {
    setError(null)
    try {
      const updated = await adminAssignTicket(ticketId, staffId)
      // Update in-state tickets array
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, assignedToStaffId: staffId, status: 'in_progress' } : t))
      )
      // Update drawer if current
      if (selectedTicketId === ticketId) {
        setSelectedTicket((prev) => prev ? { ...prev, assignedToStaffId: staffId, status: 'in_progress' } : null)
      }
      
      // Reload tickets to get updated relational objects (assignedStaff name)
      const freshTickets = await adminGetTickets()
      setTickets(freshTickets)
    } catch (err) {
      console.error('Failed to assign ticket:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to assign ticket. You may not have permission.')
      setTimeout(() => setError(null), 5000)
    }
  }

  // Inline Handlers: Update Status
  const handleStatusChange = async (ticketId, status) => {
    try {
      await adminUpdateTicketStatus(ticketId, status)
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: status } : t))
      )
      if (selectedTicketId === ticketId) {
        setSelectedTicket((prev) => prev ? { ...prev, status: status } : null)
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err)
    }
  }

  // Submit reply message from admin
  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicketId) return

    setSubmittingReply(true)
    try {
      const newMsg = await adminAddTicketMessage(selectedTicketId, replyText.trim())
      setSelectedTicket((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...(prev.messages || []), newMsg],
          status: 'in_progress', // auto updates state on admin response
        }
      })
      setReplyText('')
      
      // Update tickets array locally
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicketId ? { ...t, status: 'in_progress' } : t))
      )
    } catch (err) {
      console.error('Failed to post reply:', err)
    } finally {
      setSubmittingReply(false)
    }
  }

  // Filter logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.user?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getPriorityDot = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="inline-block w-2.5 h-2.5 bg-danger rounded-full" title="High Priority" />
      case 'medium':
        return <span className="inline-block w-2.5 h-2.5 bg-warning rounded-full" title="Medium Priority" />
      case 'low':
        return <span className="inline-block w-2.5 h-2.5 bg-ink-muted/40 rounded-full" title="Low Priority" />
    }
  }

  const getStatusBadgeTone = (status) => {
    switch (status) {
      case 'open':
      case 'in_progress':
        return 'warning'
      case 'resolved':
      case 'closed':
        return 'success'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Center (Admin)"
        description="Review customer issues, reassign tickets to staff, and post replies directly to threads."
      />

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-control text-sm">
          {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 rounded-control border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 shadow-soft"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-control border border-border bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-soft cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Tickets Table Container */}
      <Card className="overflow-hidden p-0 rounded-card border border-border">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader size={24} label="Loading customer tickets..." />
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-canvas border-b border-border text-ink-muted font-semibold text-xs">
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Staff</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">{getPriorityDot(ticket.priority)}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      <div>
                        <p>{ticket.subject}</p>
                        <p className="text-[10px] text-ink-muted font-normal mt-0.5">{ticket.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-ink">{ticket.user?.fullName}</p>
                        <p className="text-[10px] text-ink-muted">{ticket.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        className={cn(
                          'h-8 px-2 py-0.5 border border-border rounded-control text-xs font-semibold focus:outline-none capitalize cursor-pointer',
                          ticket.status === 'resolved' || ticket.status === 'closed'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        )}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        <select
                          value={ticket.assignedToStaffId || ''}
                          onChange={(e) => handleAssign(ticket.id, e.target.value)}
                          className="h-8 px-2 py-0.5 border border-border rounded-control text-xs text-ink bg-surface focus:outline-none cursor-pointer w-full max-w-[150px]"
                        >
                          <option value="">Unassigned</option>
                          {staffList.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.fullName || staff.name || staff.email} ({staff.role})
                            </option>
                          ))}
                        </select>
                      ) : (
                        !ticket.assignedToStaffId ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssign(ticket.id, admin?.id)}
                            className="text-xs h-8 px-3"
                          >
                            Claim this ticket
                          </Button>
                        ) : ticket.assignedToStaffId === admin?.id ? (
                          <span className="text-xs font-semibold text-ink">Claimed by you</span>
                        ) : (
                          <span className="text-xs text-ink-muted">
                            Claimed by {ticket.assignedStaff?.fullName || ticket.assignedStaff?.name || 'another staff member'}
                          </span>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTicketId(ticket.id)
                          setIsDrawerOpen(true)
                        }}
                        className="gap-1 text-primary hover:text-primary-700"
                      >
                        Reply <ArrowRight size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-ink-muted">
            <p className="font-semibold">No support tickets found.</p>
            <p className="text-xs mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </Card>

      {/* Side Reply Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/40 transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-surface shadow-2xl flex flex-col border-l border-border h-full">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border bg-canvas flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-ink">Ticket Conversation</h3>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed truncate max-w-[280px]">
                    Subject: {selectedTicket?.subject}
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-control p-1.5 text-ink-muted hover:bg-border/50 hover:text-ink transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 bg-canvas space-y-4 flex flex-col">
                {loadingThread ? (
                  <div className="my-auto py-12 flex justify-center">
                    <Loader size={20} label="Fetching details..." />
                  </div>
                ) : selectedTicket?.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg, idx) => {
                    const isCustomer = msg.senderId === selectedTicket.userId
                    return (
                      <div
                        key={msg.id || idx}
                        className={cn(
                          'flex flex-col max-w-[85%] rounded-card p-3 shadow-soft border border-border/30',
                          isCustomer
                            ? 'bg-surface text-ink self-start'
                            : 'bg-primary text-white border-primary self-end'
                        )}
                      >
                        <div className="flex justify-between items-center gap-3 mb-1 text-[10px] opacity-75 font-semibold">
                          <span>{isCustomer ? 'Customer' : 'Support Team'}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    )
                  })
                ) : (
                  <div className="my-auto text-center text-ink-muted text-xs">
                    No messages in this thread.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              {selectedTicket?.status !== 'closed' && (
                <div className="p-4 border-t border-border bg-surface shrink-0">
                  <form onSubmit={handleSendReply} className="flex gap-2 items-end">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a response to customer..."
                      required
                      rows={2}
                      className="flex-1 rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={submittingReply || !replyText.trim()}
                      className="h-9 px-3 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Send size={12} />
                      Send
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
