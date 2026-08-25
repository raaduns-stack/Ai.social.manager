import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  MoreVertical,
  RefreshCw,
  UserCheck,
  MailWarning,
  FileClock,
  Clock,
  UserX,
  Users as UsersIcon,
  ShieldAlert,
  UserPlus,
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ErrorBanner from '../../components/error-banner'
import { COUNTRIES } from '../../utils/countries'
import {
  getAdminUsers,
  getAdminUserStats,
  getStaffManagers,
  createAdminUser,
  updateAdminUser,
  suspendUser,
  deleteUser,
  assignAccountManager,
} from '../../features/admin/admin-api'
import { cn } from '../../utils/cn'

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingVerification: 0,
    kycPending: 0,
    kycUnderReview: 0,
    suspendedUsers: 0,
    freeUsers: 0,
    paidUsers: 0,
  })
  const [staffManagers, setStaffManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'verified' | 'email_pending' | 'kyc_pending' | 'kyc_under_review' | 'suspended'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState(() => {
    const group = searchParams.get('group')
    return group === 'free' || group === 'paid' ? group : 'all'
  })
  const [activeActionsId, setActiveActionsId] = useState(null)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAssignManagerOpen, setIsAssignManagerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null)
  const [selectedUserForManager, setSelectedUserForManager] = useState(null)
  const [selectedManagerId, setSelectedManagerId] = useState('')

  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    phoneNumber: '',
    country: '',
    accountStatus: 'ACTIVE',
    accountManagerId: '',
  })

  const [editForm, setEditForm] = useState({
    fullName: '',
    businessName: '',
    phoneNumber: '',
    country: '',
    accountManagerId: '',
  })

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, statsData, managersData] = await Promise.all([
        getAdminUsers({ tab: activeTab, search: searchTerm }),
        getAdminUserStats(),
        getStaffManagers(),
      ])
      setUsers(usersData)
      setStats(statsData)
      setStaffManagers(managersData)
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  // Client-side quick filter refiner
  const customers = useMemo(
    () => users.filter((user) => user.role === 'user'),
    [users],
  )
  const freeCount = customers.filter((user) => !user.isPaid).length
  const paidCount = customers.filter((user) => user.isPaid).length

  // Filter user base
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        (user.fullName || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.country || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === '' || (user.status || '').toLowerCase() === statusFilter.toLowerCase()
      const matchesPlan = planFilter === '' || (user.plan || '').toLowerCase() === planFilter.toLowerCase()
      const matchesCountry = countryFilter === '' || (user.country || '').toLowerCase() === countryFilter.toLowerCase()
      const isCustomer = user.role === 'user'
      const matchesGroup =
        groupFilter === 'all' ||
        (isCustomer && (groupFilter === 'paid' ? user.isPaid : !user.isPaid))

      return matchesSearch && matchesStatus && matchesPlan && matchesCountry && matchesGroup
    })
  }, [users, searchTerm, statusFilter, planFilter, countryFilter, groupFilter])

  const setGroup = (group) => {
    setGroupFilter(group)
    if (group === 'all') {
      searchParams.delete('group')
    } else {
      searchParams.set('group', group)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const toggleActions = (id) => {
    setActiveActionsId((prev) => (prev === id ? null : id))
  }

  const handleSuspend = async (id, currentStatus) => {
    const isSuspended = currentStatus === 'Suspended'
    try {
      await suspendUser(id, !isSuspended)
      loadData()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Action failed.')
    }
    setActiveActionsId(null)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete/soft-delete this user account?')) {
      try {
        await deleteUser(id)
        loadData()
      } catch (err) {
        console.error(err)
        alert(err.message || 'Failed to delete user.')
      }
    }
    setActiveActionsId(null)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createAdminUser({
        fullName: newUser.fullName,
        email: newUser.email,
        password: newUser.password || undefined,
        businessName: newUser.businessName || undefined,
        phoneNumber: newUser.phoneNumber || undefined,
        country: newUser.country || undefined,
        accountStatus: newUser.accountStatus,
        accountManagerId: newUser.accountManagerId || undefined,
      })
      setIsAddModalOpen(false)
      setNewUser({
        fullName: '',
        email: '',
        password: '',
        businessName: '',
        phoneNumber: '',
        country: '',
        accountStatus: 'ACTIVE',
        accountManagerId: '',
      })
      loadData()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (user) => {
    setSelectedUserForEdit(user)
    setEditForm({
      fullName: user.fullName || user.name || '',
      businessName: user.businessName !== '—' ? user.businessName : '',
      phoneNumber: user.phoneNumber !== '—' ? user.phoneNumber : '',
      country: user.country !== '—' ? user.country : '',
      accountManagerId: user.accountManager?.id || '',
    })
    setIsEditModalOpen(true)
    setActiveActionsId(null)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUserForEdit) return
    setSubmitting(true)
    try {
      await updateAdminUser(selectedUserForEdit.id, {
        fullName: editForm.fullName,
        businessName: editForm.businessName || undefined,
        phoneNumber: editForm.phoneNumber || undefined,
        country: editForm.country || undefined,
        accountManagerId: editForm.accountManagerId || undefined,
      })
      setIsEditModalOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to update user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenAssignManager = (user) => {
    setSelectedUserForManager(user)
    setSelectedManagerId(user.accountManager?.id || '')
    setIsAssignManagerOpen(true)
    setActiveActionsId(null)
  }

  const handleAssignManagerSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUserForManager) return
    setSubmitting(true)
    try {
      await assignAccountManager(selectedUserForManager.id, selectedManagerId || null)
      setIsAssignManagerOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to assign account manager.')
    } finally {
      setSubmitting(false)
    }
  }

  const apiBase = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '')

  const columns = [
    {
      key: 'name',
      label: 'Customer & Profile',
      render: (row) => {
        const avatarUrl = row.profileImage
          ? (row.profileImage.startsWith('http') ? row.profileImage : `${apiBase}/uploads/${row.profileImage}`)
          : null

        return (
          <Link to={`/admin/users/${row.id}`} className="flex items-center gap-3 group/name hover:opacity-85 transition-opacity">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={row.name}
                className="w-9 h-9 rounded-full object-cover border border-surface-variant shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-surface-variant text-on-surface-variant font-label-bold text-xs flex items-center justify-center shrink-0 border border-surface-variant group-hover/name:bg-primary group-hover/name:text-on-primary transition-colors">
                {(row.name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <div>
              <span className="font-label-bold text-label-bold text-on-surface group-hover/name:text-primary transition-colors block">
                {row.name}
              </span>
              <span className="text-xs text-on-surface-variant block">{row.email}</span>
            </div>
          </Link>
        )
      },
    },
    {
      key: 'businessName',
      label: 'Business Name',
      render: (row) => (
        <span className="font-medium text-on-surface text-sm">
          {row.businessName || '—'}
        </span>
      ),
    },
    {
      key: 'plan',
      label: 'Plan Tier',
      render: (row) => (
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-DEFAULT text-xs font-semibold border",
          row.isPaid
            ? "bg-primary-fixed text-on-primary-fixed-variant border-primary/30 font-bold"
            : "bg-surface-container-highest text-on-surface-variant border-surface-variant"
        )}>
          {row.plan}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Account Status',
      render: (row) => {
        const isAct = row.status === 'Active'
        const isSusp = row.status === 'Suspended'
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
            isAct ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
              isSusp ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" :
                "bg-amber-500/10 text-amber-600 border border-amber-500/20"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isAct ? "bg-emerald-500" : isSusp ? "bg-rose-500" : "bg-amber-500"
            )}></span>
            {row.status}
          </span>
        )
      },
    },
    {
      key: 'kycStatus',
      label: 'KYC Level',
      render: (row) => {
        const k = row.kycStatus
        if (k === 'APPROVED') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-DEFAULT text-[11px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
              APPROVED
            </span>
          )
        }
        if (k === 'REJECTED') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-DEFAULT text-[11px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
              REJECTED
            </span>
          )
        }
        if (k === 'UNDER_REVIEW' || k === 'RESUBMISSION_REQUIRED') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-DEFAULT text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              UNDER REVIEW
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-DEFAULT text-[11px] font-bold bg-gray-500/10 text-gray-500 border border-gray-200">
            NOT STARTED
          </span>
        )
      },
    },
    {
      key: 'joinedDate',
      label: 'Registered Date',
      render: (row) => (
        <span className="text-on-surface-variant text-xs">
          {new Date(row.joinedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'accountManager',
      label: 'Account Manager',
      render: (row) => (
        <span className="text-xs font-medium text-on-surface">
          {row.accountManager ? row.accountManager.name : '— Unassigned'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="relative flex justify-end">
          <button
            onClick={() => toggleActions(row.id)}
            className="text-on-surface-variant hover:text-on-surface opacity-80 hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-surface-variant cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {activeActionsId === row.id && (
            <div className="absolute right-0 top-8 z-20 w-48 rounded-card border border-surface-variant bg-surface shadow-hover py-1 animate-in fade-in duration-100">
              <Link
                to={`/admin/users/${row.id}`}
                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                View Details & KYC
              </Link>
              <button
                onClick={() => handleOpenEdit(row)}
                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer"
              >
                Edit Information
              </button>
              <button
                onClick={() => handleOpenAssignManager(row)}
                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer"
              >
                Assign Account Manager
              </button>
              <button
                onClick={() => handleSuspend(row.id, row.status)}
                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer"
              >
                {row.status === 'Suspended' ? 'Re-activate Account' : 'Suspend Account'}
              </button>
              <div className="border-t border-surface-variant my-1" />
              <button
                onClick={() => handleDelete(row.id)}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
              >
                Delete User
              </button>
            </div>
          )}
        </div>
      ),
    },
  ]

  const tabs = [
    { id: 'all', label: 'All Users', count: stats.totalUsers, icon: UsersIcon },
    { id: 'verified', label: 'Primary / Verified', count: stats.activeUsers, icon: UserCheck },
    { id: 'email_pending', label: 'Email Verification Pending', count: stats.pendingVerification, icon: MailWarning },
    { id: 'kyc_pending', label: 'KYC Pending', count: stats.kycPending, icon: FileClock },
    { id: 'kyc_under_review', label: 'KYC Under Review', count: stats.kycUnderReview, icon: Clock },
    { id: 'suspended', label: 'Suspended', count: stats.suspendedUsers, icon: UserX },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            User Management
          </h2>
          <p className="text-sm text-on-surface-variant">
            Full view and management of system users, registration flows, KYC, and accounts.
          </p>
          <p className="text-sm text-on-surface mt-2 font-medium">
            Free Users: {loading ? '—' : freeCount}
            <span className="mx-2 text-on-surface-variant">·</span>
            Paid Users: {loading ? '—' : paidCount}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-on-primary font-label-bold text-label-bold py-2 px-4 rounded-DEFAULT flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <UserPlus size={18} />
            Add New User
          </button>
        </div>
      </div>

      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      {/* Tabs Filter Header */}
      <div className="border-b border-surface-variant overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max pb-1">
          {tabs.map((t) => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary bg-surface-container-low"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                )}
              >
                <Icon size={14} />
                <span>{t.label}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                  isActive ? "bg-primary text-on-primary" : "bg-surface-variant text-on-surface-variant"
                )}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search & Select Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-card border border-surface-variant shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, business, country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-surface-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 border border-surface-variant bg-surface rounded-lg p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'free', label: 'Free Users' },
              { value: 'paid', label: 'Paid Users' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setGroup(item.value)}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-all font-ui-mono",
                  groupFilter === item.value
                    ? 'bg-primary text-on-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-DEFAULT border border-surface-variant bg-surface text-on-surface text-xs px-3 py-1.5 hover:border-on-surface focus:outline-none cursor-pointer"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="email pending">Email Pending</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-DEFAULT border border-surface-variant bg-surface text-on-surface text-xs px-3 py-1.5 hover:border-on-surface focus:outline-none cursor-pointer"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="brand domination">Brand Domination</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            className="text-xs text-on-surface-variant hover:text-on-surface gap-1.5"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Users Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
          <p className="text-sm text-on-surface-variant">Fetching latest users from database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchKeys={[]}
          emptyMessage={
            groupFilter === 'free'
              ? 'No users yet'
              : groupFilter === 'paid'
                ? 'No paid users yet'
                : 'No users found matching your tab filter and search queries.'
          }
        />
      )}

      {/* Add New User Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New User Account">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            required
            value={newUser.fullName}
            onChange={(e) => setNewUser((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="John Doe"
          />
          <Input
            label="Email Address *"
            type="email"
            required
            value={newUser.email}
            onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
            placeholder="john.doe@example.com"
          />
          <Input
            label="Initial Password (optional, default: SocialPilot@2026!)"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
          />
          <Input
            label="Business Name"
            value={newUser.businessName}
            onChange={(e) => setNewUser((p) => ({ ...p, businessName: e.target.value }))}
            placeholder="Doe Enterprises"
          />
          <Input
            label="Phone Number"
            value={newUser.phoneNumber}
            onChange={(e) => setNewUser((p) => ({ ...p, phoneNumber: e.target.value }))}
            placeholder="+234 801 234 5678"
          />

          <SearchableSelect
            label="Country"
            options={COUNTRIES}
            value={newUser.country}
            onChange={(val) => setNewUser((p) => ({ ...p, country: val }))}
            placeholder="Select Country..."
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">Initial Account Status</label>
            <select
              value={newUser.accountStatus}
              onChange={(e) => setNewUser((p) => ({ ...p, accountStatus: e.target.value }))}
              className="h-10 rounded-control border border-surface-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
            >
              <option value="ACTIVE">ACTIVE (Fully Verified & Active)</option>
              <option value="EMAIL_VERIFICATION_PENDING">EMAIL_VERIFICATION_PENDING</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">Assign Account Manager (optional)</label>
            <select
              value={newUser.accountManagerId}
              onChange={(e) => setNewUser((p) => ({ ...p, accountManagerId: e.target.value }))}
              className="h-10 rounded-control border border-surface-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
            >
              <option value="">-- Unassigned --</option>
              {staffManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User Information">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            required
            value={editForm.fullName}
            onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
          />
          <Input
            label="Business Name"
            value={editForm.businessName}
            onChange={(e) => setEditForm((p) => ({ ...p, businessName: e.target.value }))}
          />
          <Input
            label="Phone Number"
            value={editForm.phoneNumber}
            onChange={(e) => setEditForm((p) => ({ ...p, phoneNumber: e.target.value }))}
          />
          <SearchableSelect
            label="Country"
            options={COUNTRIES}
            value={editForm.country}
            onChange={(val) => setEditForm((p) => ({ ...p, country: val }))}
            placeholder="Select Country..."
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">Account Manager</label>
            <select
              value={editForm.accountManagerId}
              onChange={(e) => setEditForm((p) => ({ ...p, accountManagerId: e.target.value }))}
              className="h-10 rounded-control border border-surface-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
            >
              <option value="">-- Unassigned --</option>
              {staffManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Account Manager Modal */}
      <Modal open={isAssignManagerOpen} onClose={() => setIsAssignManagerOpen(false)} title="Assign Account Manager">
        <form onSubmit={handleAssignManagerSubmit} className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Select a staff member or administrator to manage <strong className="text-on-surface">{selectedUserForManager?.name}</strong>.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-on-surface">Select Account Manager</label>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="h-10 rounded-control border border-surface-variant bg-surface px-3 text-sm text-on-surface focus:outline-none"
            >
              <option value="">-- Remove Account Manager (Unassign) --</option>
              {staffManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email}) — {m.role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsAssignManagerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
