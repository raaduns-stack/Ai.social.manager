import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  MoreVertical,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'

const INITIAL_USERS = [
  {
    id: 1,
    name: 'Alex Rivera',
    email: 'alex.rivera@enterprise.com',
    plan: 'Brand Domination',
    status: 'Active',
    manager: 'Sarah Connor',
    joinedDate: 'Oct 12, 2023',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhUDVYWShKupzFe1dZGiLXom-Uy-NC1m5Geqka14WOl6CoSpmD48BydbE93Gnn-eDRVxvTR1BJCdaqFUs1aXnNLb_I8Y4t6KfahcuCixdWtycWzReNeUm0nxkNkzhsvrVZHtUHg6qDAoqbQuXt6gPFadimfhgXwTVJ5RJD0oaza5-THWkzfLHjoqAsSH0auOhE7DgNdRI49l-bnsv5L98ahrOmkctoaVoEyCFPHEHXI0JlxDmPkm5WGyf46xANkydsIJYbUQwnx3xb',
  },
  {
    id: 2,
    name: 'Lena Dubois',
    email: 'l.dubois@creative.io',
    plan: 'Starter',
    status: 'Suspended',
    manager: 'Mike Vossen',
    joinedDate: 'Jan 05, 2024',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcDoiSCc6SY1EkN6eibEpiD5eG5EDLwGznoLcJmG--kU16_pxMulOSrCWutCWpOPPFXGoPWs9iX0XoOWrssFnKe6QSM9Plw_WAfCM4q9_6ax818GasOI7PulGmC2b8Qxq9D7oV6O9dS9BQrV9oLO5gODZgyHd9W7qnx9fVPHMxLj-KL6-gAU3lm69Hj_7P68ohzIL1BtI7kQ6x73kYDQbCZfmQCyD5z6EZcXlhMB1lKWAL0MoGE1O3d5xQ6aaxmPjLQMvRRAkL7IIs',
  },
  {
    id: 3,
    name: 'David Chen',
    email: 'david.chen@freelance.org',
    plan: 'Free',
    status: 'Expired',
    manager: '',
    joinedDate: 'Nov 20, 2023',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCysmFuaUZk1ZTJOZyiceK-F0JNYx9hu_T-OGgjyXNOqhbMMfn1MzMuIHkun5dhX1ix-5KsGRkQ2RWMs9z9v_QkskdqDBb0GW1DkzB68JfgQqE2y4UZztgjC8pd_iDfCJvhIeAzqxRu8DBWhmtSXl3_whp8QR0b4jjE00A8j3SomvIqm6VUrvmcXmTuVEu7aQNqG-dydLmQQmgisWlfYquym1UkCmCAiPjT1NcHxT6M017l8OiychTBP7ttKAiNwa0ixQy9hbFt5UWS',
  },
  {
    id: 4,
    name: 'Sasha Kovic',
    email: 's.kovic@agencymedia.com',
    plan: 'Starter',
    status: 'Active',
    manager: 'Sarah Connor',
    joinedDate: 'Feb 14, 2024',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBT-5nRCxZqUlzY74lRomo0FtrIeAS7okRFp0lSXe1OVnEefObuYgf4KWsCQ2N9O7OhiHSbe88zM_fBPf8uPi0QE2iC1x6pKUM3ItsNW2A4xUf1QGmacS6AIcP6iNhXutU3eBolvkouOC3VWIbVHYB7G0SoWkdd_y0scb6T_uc4LYlAWOmjYZ1xwi8S12w9V-Y31BhPmDsSwlOL0SVdUh12C6yxl_mBQnakq-QmOCoqMIYdL7_z6xp-DHRPVEy5OJA2895KpmxW7awM',
  },
  {
    id: 5,
    name: 'Marcus Thorne',
    email: 'm.thorne@globalnet.co',
    plan: 'Growth',
    status: 'Suspended',
    manager: 'Mike Vossen',
    joinedDate: 'Dec 01, 2023',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdPn-qvmY4bvYXpAGj3sk-F1krsEUH6ki50BCXXwP3xqmPwgoWdFaOAIFVAERhhEiQCiKhv7wnHcjXgxtbISqxd0qho2xixtY43EILhzsk2iixKlqPPi-pvfN8NiDKDyd1u1EuWEH9msG__7QthqKJW0-qqoGMyzQRqC-HzQWxHKomqCPR2scRGz6H8iBz_MtbMxsfqZHJl7u7j5WmD2vxbPsABXxRMRr2y-dgMq0_vKPA_jFh0Bx6MT41XBYRSAqhdJgpWUvx7DBo',
  },
  {
    id: 6,
    name: 'Julia Peters',
    email: 'julia.p@personal.blog',
    plan: 'Free',
    status: 'Active',
    manager: '',
    joinedDate: 'Mar 10, 2024',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeUsrtHpbGEOiWryV6kGNSjlyUgiju0BRY4301MZ4al0FuwpNleETlqAXeFIIgozxhTGWlbthaGLTQArUnJJAZxdtUTFkBmdW9uxPo9Pd3drVEX8vZ8TiOnicEyBObhaDp-QkaOJQfyrbsr84vWemKUkDpsk8rj5MYQG_cxHl0aBjU1n-IqZXXENTUnc3M4Vg86MNZcJbpdZ_L1JPagngj5xJaDxVhV-uZGy_uJpX5tXwaEboMfnPcUYJDwMKzdYs_yq23D5KBV81U',
  },
]

export default function Users() {
  const [users, setUsers] = useState(INITIAL_USERS)
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

  // Filter user base
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === '' || user.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesPlan = planFilter === '' || user.plan.toLowerCase() === planFilter.toLowerCase()
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [users, searchTerm, statusFilter, planFilter])

  // Manage dropdown actions toggle
  const toggleActions = (id) => {
    setActiveActionsId((prev) => (prev === id ? null : id))
  }

  // Suspend/unsuspend user
  const handleSuspend = (id) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id === id) {
          return {
            ...user,
            status: user.status === 'Suspended' ? 'Active' : 'Suspended',
          }
        }
        return user
      })
    )
    setActiveActionsId(null)
  }

  // Delete user
  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers((prev) => prev.filter((user) => user.id !== id))
    }
    setActiveActionsId(null)
  }

  // Handle Add user form submission
  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) return

    const joinedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })

    const created = {
      id: Date.now(),
      name: newUser.name,
      email: newUser.email,
      plan: newUser.plan,
      status: newUser.status,
      manager: newUser.manager || '—',
      joinedDate,
    }

    setUsers((prev) => [created, ...prev])
    setIsAddModalOpen(false)
    setNewUser({
      name: '',
      email: '',
      plan: 'Free',
      status: 'Active',
      manager: '',
    })
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <Link to={`/admin/users/${row.id}`} className="flex items-center gap-3 group/name hover:opacity-85 transition-opacity">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-10 h-10 rounded-full border border-border object-cover shrink-0 group-hover/name:border-primary transition-colors" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0 group-hover/name:bg-primary group-hover/name:text-white transition-colors">
              {row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          )}
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
        if (row.plan === 'Brand Domination') tone = 'primary'
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
      render: (row) => {
        let tone = 'neutral'
        if (row.status === 'Active') tone = 'success'
        if (row.status === 'Suspended') tone = 'danger'
        if (row.status === 'Expired') tone = 'warning'

        return (
          <Badge tone={tone} className="gap-1.5 font-bold uppercase tracking-wider text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${
              row.status === 'Active' ? 'bg-accent' : row.status === 'Suspended' ? 'bg-danger' : 'bg-warning'
            }`} />
            {row.status}
          </Badge>
        )
      },
    },
    {
      key: 'manager',
      label: 'Account Manager',
      render: (row) => <span className="text-ink font-medium">{row.manager || '—'}</span>,
    },
    {
      key: 'joinedDate',
      label: 'Joined Date',
      render: (row) => <span className="text-ink-muted">{row.joinedDate}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="relative flex justify-end">
          <button
            onClick={() => toggleActions(row.id)}
            className="p-1.5 hover:bg-canvas rounded-control text-ink-muted hover:text-ink transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          {activeActionsId === row.id && (
            <>
              {/* Overlay backdrop to dismiss action dropdown when clicking outside */}
              <div className="fixed inset-0 z-20 cursor-default" onClick={() => setActiveActionsId(null)} />
              <div className="absolute right-0 top-8 z-30 w-36 rounded-card border border-border bg-surface p-1 shadow-hover">
                <Link
                  to={`/admin/users/${row.id}`}
                  className="block w-full text-left px-3 py-1.5 text-xs hover:bg-canvas rounded-control text-ink transition-colors font-medium"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => handleSuspend(row.id)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-canvas rounded-control text-ink transition-colors font-medium"
                >
                  {row.status === 'Suspended' ? 'Activate' : 'Suspend'}
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-canvas rounded-control text-danger transition-colors font-medium"
                >
                  Delete User
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage your organization's user base, permissions, and subscription statuses."
        action={
          <Button variant="primary" className="gap-1.5 font-semibold text-sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            Add New User
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-surface border border-border rounded-card p-4 flex flex-wrap items-center gap-4 shadow-soft">
        <div className="relative flex-grow min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 border border-border rounded-control pl-10 pr-4 text-sm bg-surface text-ink focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-ink-muted"
            placeholder="Search users..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 border border-border rounded-control px-3 bg-surface text-sm text-ink min-w-[140px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none cursor-pointer"
          >
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-10 border border-border rounded-control px-3 bg-surface text-sm text-ink min-w-[140px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none cursor-pointer"
          >
            <option value="">Plan: All</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="brand domination">Brand Domination</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        pageSize={6}
        emptyMessage="No users found matching your search filters."
      />

      {/* Add New User Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Name"
            value={newUser.name}
            onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="E.g. Jordan Smith"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="E.g. jordan.smith@example.com"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Plan</label>
              <select
                value={newUser.plan}
                onChange={(e) => setNewUser((prev) => ({ ...prev, plan: e.target.value }))}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
              >
                <option value="Free">Free</option>
                <option value="Starter">Starter</option>
                <option value="Growth">Growth</option>
                <option value="Brand Domination">Brand Domination</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser((prev) => ({ ...prev, status: e.target.value }))}
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
          <Input
            label="Account Manager"
            value={newUser.manager}
            onChange={(e) => setNewUser((prev) => ({ ...prev, manager: e.target.value }))}
            placeholder="E.g. Sarah Connor (optional)"
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

