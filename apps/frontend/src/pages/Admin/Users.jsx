import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  MoreVertical,
  RefreshCw,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import { getAdminUsers, suspendUser, deleteUser } from '../../features/admin/admin-api'
import ErrorBanner from '../../components/error-banner'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
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

  // Filter user base
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || (user.status || '').toLowerCase() === statusFilter.toLowerCase()
      const matchesPlan = planFilter === '' || (user.plan || '').toLowerCase() === planFilter.toLowerCase()
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [users, searchTerm, statusFilter, planFilter])

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
      label: 'Name',
      render: (row) => (
        <Link to={`/admin/users/${row.id}`} className="flex items-center gap-3 group/name hover:opacity-85 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0 group-hover/name:bg-primary group-hover/name:text-white transition-colors">
            {(row.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span className="font-semibold text-ink group-hover/name:text-primary transition-colors">{row.name}</span>
        </Link>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => <span className="text-ink-muted">{row.email}</span>,
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row) => {
        let tone = 'neutral'
        if (row.plan === 'Brand Domination' || row.plan === 'Enterprise') tone = 'primary'
        if (row.plan === 'Growth') tone = 'success'
        if (row.plan === 'Starter') tone = 'warning'
        return (
          <Badge tone={tone} className="uppercase tracking-wider text-[10px] font-bold">
            {row.plan}
          </Badge>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'Active' ? 'success' : 'danger'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'joinedDate',
      label: 'Joined Date',
      render: (row) => (
        <span className="text-ink-muted text-sm">
          {new Date(row.joinedDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
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
            className="p-1 hover:bg-canvas rounded-full text-ink-muted hover:text-ink cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {activeActionsId === row.id && (
            <div className="absolute right-0 top-8 z-10 w-44 rounded-control border border-border bg-surface shadow-hover py-1 animate-in fade-in duration-100">
              <Link
                to={`/admin/users/${row.id}`}
                className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-canvas flex items-center gap-2"
              >
                View Profile
              </Link>
              <button
                onClick={() => handleSuspend(row.id, row.status)}
                className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-canvas flex items-center gap-2 cursor-pointer"
              >
                {row.status === 'Suspended' ? 'Re-activate Account' : 'Suspend Account'}
              </button>
              <div className="border-t border-border/60 my-1" />
              <button
                onClick={() => handleDelete(row.id)}
                className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50 flex items-center gap-2 cursor-pointer"
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
      <PageHeader
        title="User Management"
        description="Monitor system registration and update user account statuses."
      />

      {error && (
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
      )}

      {/* Controls Card */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-control border border-border bg-surface text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-control border border-border bg-surface text-sm text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-control border border-border bg-surface text-sm text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
              <option value="brand domination">Brand Domination</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
          <p className="text-sm text-ink-muted">Loading user database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          emptyState={
            <div className="text-center py-12">
              <p className="text-sm text-ink-muted">No users found matching your filters.</p>
            </div>
          }
        />
      )}

      {/* Add User Modal (Optional Static fallback helper) */}
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
