import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  MoreVertical,
  RefreshCw,
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import { getAdminUsers, suspendUser, deleteUser } from '../../features/admin/admin-api'
import ErrorBanner from '../../components/error-banner'
import { cn } from '../../utils/cn'

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState(() => {
    const group = searchParams.get('group')
    return group === 'free' || group === 'paid' ? group : 'all'
  })
  const [activeActionsId, setActiveActionsId] = useState(null)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    plan: 'Free',
    status: 'Active',
    manager: '',
  })

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminUsers()
      setUsers(data)
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

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
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || (user.status || '').toLowerCase() === statusFilter.toLowerCase()
      const matchesPlan = planFilter === '' || (user.plan || '').toLowerCase() === planFilter.toLowerCase()
      const isCustomer = user.role === 'user'
      const matchesGroup =
        groupFilter === 'all' ||
        (isCustomer && (groupFilter === 'paid' ? user.isPaid : !user.isPaid))
      return matchesSearch && matchesStatus && matchesPlan && matchesGroup
    })
  }, [users, searchTerm, statusFilter, planFilter, groupFilter])

  const setGroup = (group) => {
    setGroupFilter(group)
    if (group === 'all') {
      searchParams.delete('group')
    } else {
      searchParams.set('group', group)
    }
    setSearchParams(searchParams, { replace: true })
  }

  // Manage dropdown actions toggle
  const toggleActions = (id) => {
    setActiveActionsId((prev) => (prev === id ? null : id))
  }

  // Suspend/unsuspend user
  const handleSuspend = async (id, currentStatus) => {
    const isSuspended = currentStatus === 'Suspended'
    try {
      await suspendUser(id, !isSuspended)
      alert(`User account successfully ${!isSuspended ? 'suspended' : 'activated'}.`)
      loadUsers()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Action failed.')
    }
    setActiveActionsId(null)
  }

  // Delete user
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to permanently delete this user?')) {
      try {
        await deleteUser(id)
        alert('User successfully deleted.')
        loadUsers()
      } catch (err) {
        console.error(err)
        alert(err.message || 'Failed to delete user.')
      }
    }
    setActiveActionsId(null)
  }

  // Handle Add user form submission (Disabled / Backend pending)
  const handleAddSubmit = (e) => {
    e.preventDefault()
    alert('User creation is only supported via signups. Real users list is managed dynamically.')
    setIsAddModalOpen(false)
  }

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <Link to={`/admin/users/${row.id}`} className="flex items-center gap-3 group/name hover:opacity-85 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant font-label-bold text-xs flex items-center justify-center shrink-0 border border-surface-variant group-hover/name:bg-primary group-hover/name:text-on-primary transition-colors">
            {(row.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span className="font-label-bold text-label-bold text-on-surface group-hover/name:text-primary transition-colors">{row.name}</span>
        </Link>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="text-on-surface-variant">{row.email}</span>,
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-DEFAULT text-xs font-semibold bg-surface-container-highest text-on-surface border border-surface-variant">
          {row.plan}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isActive = row.status === 'Active'
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
            isActive ? "bg-primary-fixed text-on-primary-fixed-variant" : "bg-surface-variant text-on-surface-variant"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-primary-container" : "bg-tertiary")}></span>
            {row.status}
          </span>
        )
      },
    },
    {
      key: 'joinedDate',
      label: 'Joined',
      render: (row) => (
        <span className="text-on-surface-variant text-sm">
          {new Date(row.joinedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
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
            className="text-on-surface-variant hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-surface-variant cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {activeActionsId === row.id && (
            <div className="absolute right-0 top-8 z-10 w-44 rounded-card border border-surface-variant bg-surface shadow-hover py-1 animate-in fade-in duration-100">
              <Link
                to={`/admin/users/${row.id}`}
                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2"
              >
                View Profile
              </Link>
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

  return (
    <div className="space-y-6">
      {/* Page Header & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">User Management</h2>
          <p className="text-sm text-on-surface-variant">Monitor system registration and update user account statuses.</p>
          <p className="text-sm text-on-surface mt-2 font-medium">
            Free Users: {loading ? '—' : freeCount}
            <span className="mx-2 text-on-surface-variant">·</span>
            Paid Users: {loading ? '—' : paidCount}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-surface-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-on-surface"
            />
          </div>

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
            className="rounded-DEFAULT border border-surface-variant bg-surface text-on-surface font-ui-mono text-xs px-3 py-1.5 hover:border-on-surface focus:outline-none focus:border-on-surface transition-colors cursor-pointer"
          >
            <option value="">Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-DEFAULT border border-surface-variant bg-surface text-on-surface font-ui-mono text-xs px-3 py-1.5 hover:border-on-surface focus:outline-none focus:border-on-surface transition-colors cursor-pointer"
          >
            <option value="">Plan</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
            <option value="brand domination">Brand Domination</option>
          </select>

          <div className="w-px h-6 bg-surface-variant mx-1 hidden sm:block"></div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-on-surface text-surface font-label-bold text-label-bold py-1.5 px-4 rounded-DEFAULT flex items-center gap-2 hover:bg-tertiary transition-colors"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {error && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
          <p className="text-sm text-on-surface-variant">Loading user database...</p>
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
                : 'No users found matching your filters.'
          }
        />
      )}

      {/* Add User Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New User">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={newUser.name}
            onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))}
            placeholder="Alex Rivera"
          />
          <Input
            label="Email Address"
            type="email"
            required
            value={newUser.email}
            onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))}
            placeholder="alex.rivera@example.com"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
