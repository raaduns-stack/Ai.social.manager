import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  Phone,
  CheckCircle,
  Award,
  Zap,
  CreditCard,
  Share2,
  Megaphone,
  Ticket,
  User,
  Clock,
  ShieldAlert,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'

const MOCK_USER_PROFILES = {
  '1': {
    id: 1,
    name: 'Amaka Obi',
    email: 'amaka.obi@example.com',
    phone: '+234 801 234 5678',
    status: 'Active',
    plan: 'Brand Domination',
    manager: 'Sarah Connor',
    managerInitials: 'SC',
    joinedDate: 'Oct 12, 2023',
    lastActive: '2 hours ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuDL7e89oUmiEFSMqsKBTSYuI621AZ6UKGFyhVQIANQIKnwOTdzYYeZiFtPg-XP8NOyDR7psAKfR4F-aZc1ef0h5NNmHFlU3Uf-bfZ8iyBZc766d9Jk_n7uVj6TKJmStLugxsO2Sa5clU8BgYxA5O7medcAKDF9XWc_WG7AmMplMvAYAnPPurp6oByzDUS1h-j1NxLiSRGRyFOpAtURZ5oueztclADS0-CrdG42tdLcqoX43VxpklccKDCpj7fjzr-0xLqsXRGKhki',
    activities: [
      {
        id: 1,
        title: 'Subscribed to Brand Domination Monthly',
        description: 'Billing cycle successfully updated to premium tier.',
        time: 'Just now',
        icon: CreditCard,
        color: 'bg-primary-50 text-primary',
      },
      {
        id: 2,
        title: 'Connected Facebook Page',
        description: "Linked 'Obi Creative Studio' official page.",
        time: '2 hours ago',
        icon: Share2,
        color: 'bg-accent-50 text-accent',
      },
      {
        id: 3,
        title: 'Created new campaign',
        description: 'Holiday Blitz 2024 - Active for 15 nodes.',
        time: 'Yesterday, 4:22 PM',
        icon: Megaphone,
        color: 'bg-primary-50 text-primary-700',
      },
      {
        id: 4,
        title: 'Support ticket resolved',
        description: 'Ticket #8841: API Authentication Issue settled.',
        time: 'Dec 12, 2023',
        icon: Ticket,
        color: 'bg-accent-50 text-accent-600',
      },
      {
        id: 5,
        title: 'Updated profile photo',
        description: 'System synchronization completed successfully.',
        time: 'Nov 30, 2023',
        icon: User,
        color: 'bg-canvas text-ink-muted',
      },
    ],
    subscription: {
      billingCycle: 'Monthly',
      price: '₦150,000/month',
      nextRenewal: 'Nov 12, 2026',
      paymentMethod: 'Visa ending in 4242',
      invoices: [
        { id: 'INV-2026-004', date: 'Oct 12, 2026', amount: '₦150,000', status: 'Paid' },
        { id: 'INV-2026-003', date: 'Sep 12, 2026', amount: '₦150,000', status: 'Paid' },
        { id: 'INV-2026-002', date: 'Aug 12, 2026', amount: '₦150,000', status: 'Paid' },
      ],
    },
    accounts: [
      { id: 'fb', platform: 'Facebook', page: 'Obi Creative Studio', status: 'Connected', icon: Share2 },
      { id: 'tw', platform: 'Twitter/X', page: '@amaka_obi', status: 'Connected', icon: Share2 },
      { id: 'li', platform: 'LinkedIn', page: 'Amaka Obi Professional', status: 'Connected', icon: Share2 },
      { id: 'ig', platform: 'Instagram', page: '@obi.creatives', status: 'Disconnected', icon: Share2 },
    ],
    tickets: [
      { id: '8841', subject: 'API Authentication Issue', status: 'Resolved', date: 'Dec 12, 2023' },
      { id: '8210', subject: 'Custom Template Request', status: 'Closed', date: 'Nov 15, 2023' },
    ],
  },
}

const PLAN_PRICES = {
  'Free': '₦0/month',
  'Starter': '₦30,000/month',
  'Growth': '₦100,000/month',
  'Brand Domination': '₦150,000/month'
}

export default function UserDetail() {
  const { userId } = useParams()
  const id = userId
  const navigate = useNavigate()
  
  // Lookup user by ID, fallback to Amaka Obi (id = 1)
  const [user, setUser] = useState(() => {
    const profile = MOCK_USER_PROFILES[id] || MOCK_USER_PROFILES['1']
    return { ...profile }
  })

  const [activeTab, setActiveTab] = useState('overview')
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    plan: user.plan,
    manager: user.manager,
  })

  const handleEditSubmit = (e) => {
    e.preventDefault()
    const newPrice = PLAN_PRICES[editForm.plan] || '₦0/month'
    const newAmount = newPrice.split('/')[0]
    
    setUser((prev) => ({
      ...prev,
      ...editForm,
      managerInitials: editForm.manager
        ? editForm.manager.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '',
      subscription: {
        ...prev.subscription,
        price: newPrice,
        invoices: prev.subscription.invoices.map((inv, idx) => ({
          ...inv,
          amount: idx === 0 ? newAmount : inv.amount
        }))
      }
    }))
    setIsEditModalOpen(false)
  }

  const handleSuspendConfirm = () => {
    setUser((prev) => ({
      ...prev,
      status: prev.status === 'Suspended' ? 'Active' : 'Suspended',
    }))
    setIsSuspendModalOpen(false)
  }

  const handleDeleteConfirm = () => {
    setIsDeleteModalOpen(false)
    alert(`User ${user.name} has been deleted.`)
    navigate('/admin/users')
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'activity', label: 'Activity' },
    { id: 'accounts', label: 'Connected Accounts' },
    { id: 'tickets', label: 'Tickets' },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/users"
          className="w-10 h-10 flex items-center justify-center rounded-control border border-border bg-surface hover:bg-canvas text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <nav className="flex items-center gap-2 text-sm text-ink-muted">
          <Link to="/admin/users" className="hover:text-primary transition-colors font-medium">
            Users
          </Link>
          <ChevronRight size={14} className="text-ink-muted/50" />
          <span className="text-ink font-semibold">{user.name}</span>
        </nav>
      </div>

      {/* Profile Header Section */}
      <Card className="p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-canvas ring-1 ring-border shrink-0"
            />
            <span className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-surface rounded-full ${
              user.status === 'Active' ? 'bg-accent' : 'bg-danger'
            }`} />
          </div>
          <div className="text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-ink">{user.name}</h2>
              <Badge tone={user.status === 'Active' ? 'success' : 'danger'} className="gap-1 font-semibold uppercase tracking-wider text-[10px]">
                <CheckCircle size={10} className="fill-current" />
                {user.status}
              </Badge>
            </div>
            <div className="space-y-1.5 text-sm text-ink-muted">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail size={14} className="opacity-70" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone size={14} className="opacity-70" />
                <span>{user.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            as={Link}
            to={`/admin/users/${user.id}/calendar`}
            variant="outline"
            className="text-xs h-9 px-4 font-semibold text-primary border-primary/20 hover:bg-primary-50 gap-1.5 flex items-center"
          >
            <Calendar size={14} />
            <span>Content Calendar</span>
          </Button>
          <Button
            variant="outline"
            className="text-xs h-9 px-4 font-semibold"
            onClick={() => setIsSuspendModalOpen(true)}
          >
            {user.status === 'Suspended' ? 'Activate' : 'Suspend'}
          </Button>
          <Button
            variant="outline"
            className="text-xs h-9 px-4 font-semibold text-ink-muted hover:text-ink"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            className="text-xs h-9 px-4 font-semibold"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      </Card>

      {/* Custom Tabs */}
      <div className="border-b border-border">
        <nav className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Current Plan</span>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-primary">{user.plan}</p>
                <Award size={24} className="text-primary opacity-30" />
              </div>
            </Card>

            <Card className="p-5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Account Manager</span>
              <div className="flex items-center gap-3">
                {user.manager ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-primary-50 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {user.managerInitials}
                    </div>
                    <p className="text-sm font-bold text-ink">{user.manager}</p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-ink-muted">—</p>
                )}
              </div>
            </Card>

            <Card className="p-5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Member Since</span>
              <p className="text-xl font-bold text-ink">{user.joinedDate}</p>
            </Card>

            <Card className="p-5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Last Active</span>
              <div className="flex items-center gap-1.5 text-accent">
                <p className="text-xl font-bold">{user.lastActive}</p>
                <Zap size={16} className="fill-current" />
              </div>
            </Card>

            {/* Timeline */}
            <Card className="lg:col-span-4 overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-semibold text-ink">Recent Activity</h3>
                <button
                  onClick={() => setActiveTab('activity')}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  View History
                </button>
              </div>
              <div className="divide-y divide-border/50">
                {user.activities.slice(0, 5).map((act) => {
                  const Icon = act.icon
                  return (
                    <div
                      key={act.id}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-canvas/30 transition-colors group cursor-default"
                    >
                      <div className={`w-10 h-10 rounded-control flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${act.color}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{act.title}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{act.description}</p>
                      </div>
                      <span className="text-xs text-ink-muted font-medium ml-4 shrink-0 whitespace-nowrap">
                        {act.time}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-6 space-y-6">
              <h3 className="text-base font-semibold text-ink">Plan Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Plan Status</span>
                  <Badge tone={user.status === 'Active' ? 'success' : 'danger'} className="font-semibold">
                    {user.status}
                  </Badge>
                </div>
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Tier</span>
                  <span className="text-sm font-semibold text-primary">{user.plan}</span>
                </div>
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Billing Cycle</span>
                  <span className="text-sm font-medium text-ink">{user.subscription.billingCycle}</span>
                </div>
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Amount</span>
                  <span className="text-sm font-semibold text-ink">{user.subscription.price}</span>
                </div>
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Renewal Date</span>
                  <span className="text-sm font-medium text-ink">{user.subscription.nextRenewal}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-sm text-ink-muted">Method</span>
                  <span className="text-sm font-medium text-ink">{user.subscription.paymentMethod}</span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-base font-semibold text-ink">Invoice History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border text-ink-muted">
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Invoice ID</th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {user.subscription.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-canvas/20">
                        <td className="px-6 py-3 font-medium text-ink">{inv.id}</td>
                        <td className="px-6 py-3 text-ink-muted">{inv.date}</td>
                        <td className="px-6 py-3 font-semibold text-ink">{inv.amount}</td>
                        <td className="px-6 py-3">
                          <Badge tone="success" className="font-semibold text-[10px]">
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'activity' && (
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-ink">Comprehensive Activity Timeline</h3>
            </div>
            <div className="divide-y divide-border/50">
              {user.activities.map((act) => {
                const Icon = act.icon
                return (
                  <div
                    key={act.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-canvas/30 transition-colors group cursor-default"
                  >
                    <div className={`w-10 h-10 rounded-control flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${act.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{act.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{act.description}</p>
                    </div>
                    <span className="text-xs text-ink-muted font-medium ml-4 shrink-0 whitespace-nowrap">
                      {act.time}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {activeTab === 'accounts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.accounts.map((acct) => {
              const Icon = acct.icon
              return (
                <Card key={acct.id} className="p-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-control flex items-center justify-center shrink-0 ${
                      acct.status === 'Connected' ? 'bg-primary-50 text-primary' : 'bg-canvas text-ink-muted'
                    }`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink">{acct.platform}</h4>
                      <p className="text-xs text-ink-muted mt-0.5">{acct.status === 'Connected' ? acct.page : 'Not connected'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={acct.status === 'Connected' ? 'success' : 'neutral'} className="font-semibold text-[10px]">
                      {acct.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-primary font-semibold text-xs h-7 hover:underline hover:bg-transparent">
                      {acct.status === 'Connected' ? 'Manage' : 'Connect'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {activeTab === 'tickets' && (
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-semibold text-ink">Support Tickets</h3>
              <Button variant="outline" size="sm" className="text-xs h-8">
                Create Ticket
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-ink-muted bg-canvas/30">
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Ticket ID</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Date Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {user.tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-canvas/20">
                      <td className="px-6 py-3 font-bold text-ink">#{t.id}</td>
                      <td className="px-6 py-3 font-medium text-ink">{t.subject}</td>
                      <td className="px-6 py-3">
                        <Badge tone={t.status === 'Resolved' ? 'success' : 'neutral'} className="font-bold text-[10px]">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-ink-muted">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User Profile">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <Input
            label="Phone Number"
            value={editForm.phone}
            onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Subscription Plan</label>
            <select
              value={editForm.plan}
              onChange={(e) => setEditForm((p) => ({ ...p, plan: e.target.value }))}
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
            >
              <option value="Free">Free</option>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Brand Domination">Brand Domination</option>
            </select>
          </div>
          <Input
            label="Account Manager"
            value={editForm.manager}
            onChange={(e) => setEditForm((p) => ({ ...p, manager: e.target.value }))}
            placeholder="Sarah Connor"
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Suspend Confirmation Modal */}
      <Modal open={isSuspendModalOpen} onClose={() => setIsSuspendModalOpen(false)} title={user.status === 'Suspended' ? 'Activate Account' : 'Suspend Account'}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <ShieldAlert size={24} className="fill-amber-50" />
            <p className="font-semibold text-sm">Are you absolutely sure?</p>
          </div>
          <p className="text-sm text-ink-muted">
            {user.status === 'Suspended'
              ? `This will restore account access for ${user.name}. They will be able to log in, schedule posts, and make changes to their profile.`
              : `This will suspend account access for ${user.name}. They will not be able to log in or schedule new posts, but their existing scheduled queue will remain intact.`}
          </p>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSuspendConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete User Account">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-danger">
            <ShieldAlert size={24} className="fill-red-50" />
            <p className="font-semibold text-sm">This action is permanent and irreversible.</p>
          </div>
          <p className="text-sm text-ink-muted">
            Are you sure you want to permanently delete the profile, connected account syncs, billing information, and support history for <strong className="text-ink">{user.name}</strong>?
          </p>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

