import { useState, useEffect } from 'react'
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
  Sparkles,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import AISettingsModal from '../../components/ai/AISettingsModal'
import { getAdminUserDetail, suspendUser, deleteUser } from '../../features/admin/admin-api'
import ErrorBanner from '../../components/error-banner'

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
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeTab, setActiveTab] = useState('overview')
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminUserDetail(userId)
      setUser(data)
      setEditForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        plan: data.plan || 'Free',
        manager: data.manager || '',
      })
    } catch (err) {
      console.error(err)
      setError('Failed to fetch user details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const [userPlatforms, setUserPlatforms] = useState([
    {
      key: 'linkedin',
      label: 'LinkedIn',
      globalPrompt: `Generate professional LinkedIn content.
Always use a business tone.
Maximum 250 words.
Include CTA.`,
      customerPrompt: 'Always mention our premium products. Use British English.',
    },
    {
      key: 'twitter',
      label: 'X/Twitter',
      globalPrompt: `Generate engaging tweets/X posts.
Keep it concise and punchy.
Maximum 280 characters.
Use 1-2 relevant hashtags.`,
      customerPrompt: 'Focus on technology innovation. Use a bold, active voice.',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      globalPrompt: `Generate friendly and social Facebook posts.
Encourage user engagement or comments.
Keep tone conversational.
Include a link description.`,
      customerPrompt: 'Promote local community involvement and family values.',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      globalPrompt: `Generate catchy captions for Instagram posts.
Start with a strong hook line.
Maximum 150 words.
Include a clean list of hashtags at the end.`,
      customerPrompt: 'Highlight aesthetic values, use friendly emojis, write in lower case.',
    },
  ])

  const handleSaveAISettings = (updatedPlatforms) => {
    setUserPlatforms(updatedPlatforms)
    console.log('Saved AI settings for user:', updatedPlatforms)
  }

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'Free',
    manager: '',
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

  const handleSuspendConfirm = async () => {
    try {
      const isCurrentlySuspended = user.status === 'Suspended'
      await suspendUser(userId, !isCurrentlySuspended)
      alert(isCurrentlySuspended ? 'User has been unsuspended.' : 'User has been suspended.')
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to update suspension status.')
    }
    setIsSuspendModalOpen(false)
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(userId)
      alert(`User ${user.name} has been deleted.`)
      navigate('/admin/users')
    } catch (err) {
      console.error(err)
      alert('Failed to delete user.')
    }
    setIsDeleteModalOpen(false)
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'activity', label: 'Activity' },
    { id: 'accounts', label: 'Connected Accounts' },
    { id: 'tickets', label: 'Tickets' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-ink-muted">Loading user profile database...</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        {error && <ErrorBanner error={error} />}
        <Link to="/admin/users" className="text-sm font-semibold text-primary hover:underline">
          &larr; Back to Users List
        </Link>
      </div>
    )
  }

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
            className="text-xs h-9 px-4 font-semibold text-primary border-primary/20 hover:bg-primary-50 gap-1.5 flex items-center"
            onClick={() => setIsAISettingsOpen(true)}
          >
            <Sparkles size={14} />
            <span>AI Content Settings</span>
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
                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                   —
                </div>
                <p className="text-sm font-bold text-ink-muted">—</p>
              </div>
            </Card>

            <Card className="p-5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Member Since</span>
              <p className="text-xl font-bold text-ink">
                {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : '—'}
              </p>
            </Card>

            <Card className="p-5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">User Status</span>
              <div className="flex items-center gap-1.5 text-accent">
                <p className="text-xl font-bold">{user.status}</p>
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
                {!user.activities || user.activities.length === 0 ? (
                  <div className="px-6 py-10 text-center text-ink-muted text-xs font-medium">
                    No recent activity recorded.
                  </div>
                ) : (
                  user.activities.slice(0, 5).map((act) => (
                    <div
                      key={act.id}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-canvas/30 transition-colors group cursor-default"
                    >
                      <div className="w-10 h-10 rounded-control flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform bg-primary-50 text-primary">
                        <Clock size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{act.title}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{act.description}</p>
                      </div>
                      <span className="text-xs text-ink-muted font-medium ml-4 shrink-0 whitespace-nowrap">
                        {new Date(act.time).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
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
                  <span className="text-sm font-medium text-ink">
                    {user.subscription ? 'Monthly/Annual' : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Renewal Date</span>
                  <span className="text-sm font-medium text-ink">
                    {user.subscription?.currentPeriodEnd
                      ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-base font-semibold text-ink">Invoice History</h3>
              </div>
              <div className="overflow-x-auto">
                {!user.invoices || user.invoices.length === 0 ? (
                  <div className="px-6 py-10 text-center text-ink-muted text-xs font-medium">
                    No invoice records found.
                  </div>
                ) : (
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
                      {user.invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-canvas/20">
                          <td className="px-6 py-3 font-medium text-ink">{inv.invoiceNumber}</td>
                          <td className="px-6 py-3 text-ink-muted">
                            {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-3 font-semibold text-ink">
                            {inv.currency} {inv.amount?.toLocaleString()}
                          </td>
                          <td className="px-6 py-3">
                            <Badge tone={inv.status === 'paid' ? 'success' : 'warning'} className="font-semibold text-[10px]">
                              {inv.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
              {!user.activities || user.activities.length === 0 ? (
                <div className="px-6 py-10 text-center text-ink-muted text-xs font-medium">
                  No activity log database recorded.
                </div>
              ) : (
                user.activities.map((act) => (
                  <div
                    key={act.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-canvas/30 transition-colors group cursor-default"
                  >
                    <div className="w-10 h-10 rounded-control flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform bg-canvas text-ink-muted">
                      <Clock size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{act.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{act.description}</p>
                    </div>
                    <span className="text-xs text-ink-muted font-medium ml-4 shrink-0 whitespace-nowrap">
                      {new Date(act.time).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {activeTab === 'accounts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!user.socialAccounts || user.socialAccounts.length === 0 ? (
              <div className="md:col-span-2 text-center text-sm text-ink-muted py-10">No connected social accounts found.</div>
            ) : (
              user.socialAccounts.map((acct) => (
                <Card key={acct.id} className="p-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-control flex items-center justify-center shrink-0 bg-primary-50 text-primary">
                      <Share2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink capitalize">{acct.platform}</h4>
                      <p className="text-xs text-ink-muted mt-0.5">{acct.accountHandle}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={acct.status === 'Connected' ? 'success' : 'neutral'} className="font-semibold text-[10px]">
                      {acct.status}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'tickets' && (
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-semibold text-ink">Support Tickets</h3>
            </div>
            <div className="p-6 text-center text-sm text-ink-muted">No support tickets found for this user.</div>
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

      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        customerName={user.name}
        platforms={userPlatforms}
        onSave={handleSaveAISettings}
      />
    </div>
  )
}

