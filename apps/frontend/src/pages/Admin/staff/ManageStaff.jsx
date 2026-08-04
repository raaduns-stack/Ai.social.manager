import { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Power,
  Key,
  ChevronRight,
  CheckCircle,
  X,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import Badge from '../../../components/ui/Badge'
import Avatar from '../../../components/ui/Avatar'
import RoleBadge from '../../../components/staff/RoleBadge'
import { cn } from '../../../utils/cn'

const INITIAL_STAFF = [
  {
    id: 1,
    name: 'Amaka Obi',
    email: 'amaka.obi@example.com',
    avatarUrl: '',
    type: 'admin',
    roles: ['Super Admin'],
    status: 'Active',
  },
  {
    id: 2,
    name: 'Lena Dubois',
    email: 'l.dubois@creative.io',
    avatarUrl: '',
    type: 'admin',
    roles: ['Admin'],
    status: 'Active',
  },
  {
    id: 3,
    name: 'Marcus Thorne',
    email: 'm.thorne@globalnet.co',
    avatarUrl: '',
    type: 'staff',
    roles: ['Content Manager', 'Moderator'],
    status: 'Active',
  },
  {
    id: 4,
    name: 'Sasha Kovic',
    email: 's.kovic@agencymedia.com',
    avatarUrl: '',
    type: 'staff',
    roles: ['Customer Support'],
    status: 'Disabled',
  },
  {
    id: 5,
    name: 'Julia Peters',
    email: 'julia.p@personal.blog',
    avatarUrl: '',
    type: 'staff',
    roles: ['Moderator'],
    status: 'Active',
  },
]

const AVAILABLE_ROLES = [
  'Super Admin',
  'Admin',
  'Content Manager',
  'Customer Support',
  'Finance',
  'Marketing',
  'Moderator',
]

const DEFAULT_FORM = {
  id: null,
  name: '',
  email: '',
  roles: [],
  status: 'Active',
}

export default function ManageStaff() {
  const [staffList, setStaffList] = useState(INITIAL_STAFF)
  const [activeTab, setActiveTab] = useState('admin') // 'admin' | 'staff'

  // Modal control states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [formMode, setFormMode] = useState('create') // 'create' | 'edit'

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)

  const [toastMessage, setToastMessage] = useState(null)

  const filteredStaff = staffList.filter((s) => s.type === activeTab)

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Toggle active status directly in table
  const handleToggleStatus = (id) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'Active' ? 'Disabled' : 'Active' }
          : s
      )
    )
    const target = staffList.find((s) => s.id === id)
    showToast(`Account for ${target?.name} ${target?.status === 'Active' ? 'Disabled' : 'Enabled'} successfully.`)
  }

  // Add/Edit Form submit
  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      alert('Name and Email are required.')
      return
    }

    if (formMode === 'create') {
      const newId = Math.max(...staffList.map((s) => s.id), 0) + 1
      const newMember = {
        ...formData,
        id: newId,
        avatarUrl: '',
        type: activeTab,
      }
      setStaffList((prev) => [...prev, newMember])
      showToast(`Account for ${newMember.name} created successfully as ${activeTab === 'admin' ? 'Admin' : 'Staff'}.`)
    } else {
      setStaffList((prev) =>
        prev.map((s) => (s.id === formData.id ? { ...s, ...formData } : s))
      )
      showToast(`Account for ${formData.name} updated successfully.`)
    }

    setIsFormModalOpen(false)
    setFormData(DEFAULT_FORM)
  }

  // Open Edit Modal
  const openEditModal = (member) => {
    setFormData({
      id: member.id,
      name: member.name,
      email: member.email,
      roles: member.roles || [],
      status: member.status,
    })
    setFormMode('edit')
    setIsFormModalOpen(true)
  }

  // Open Create Modal
  const openCreateModal = () => {
    setFormData(DEFAULT_FORM)
    setFormMode('create')
    setIsFormModalOpen(true)
  }

  // Confirm delete handler
  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      setStaffList((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      showToast(`Account for ${deleteTarget.name} deleted successfully.`)
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
    }
  }

  // Confirm reset handler
  const handleResetConfirm = () => {
    if (resetTarget) {
      showToast(`Password reset link sent to ${resetTarget.email}!`)
      setIsResetModalOpen(false)
      setResetTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1 text-xs text-ink-muted mb-2 font-medium">
          <span className="hover:text-ink cursor-pointer">Admin</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="hover:text-ink cursor-pointer">Staff Dashboard</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="text-primary font-semibold">Manage Accounts</span>
        </div>

        <PageHeader
          title="Manage Staff Directory"
          description="Create, update, enable/disable or delete administrator and staff credentials."
          action={
            <Button
              variant="primary"
              onClick={openCreateModal}
              className="flex items-center gap-2 font-semibold text-xs h-9"
            >
              <Plus size={16} />
              {activeTab === 'admin' ? 'Add Admin' : 'Add Staff'}
            </Button>
          }
        />
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-accent-50 border border-accent-100 rounded-control text-xs font-semibold text-accent-600 flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={14} className="shrink-0 text-accent-500" />
          {toastMessage}
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-border bg-canvas/30 p-1 rounded-control w-fit gap-1">
        <button
          onClick={() => setActiveTab('admin')}
          className={cn(
            'px-5 py-2 text-xs font-bold rounded-control transition-all',
            activeTab === 'admin'
              ? 'bg-white shadow-soft text-primary'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          Administrators
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={cn(
            'px-5 py-2 text-xs font-bold rounded-control transition-all',
            activeTab === 'staff'
              ? 'bg-white shadow-soft text-primary'
              : 'text-ink-muted hover:text-ink'
          )}
        >
          Staff Directory
        </button>
      </div>

      {/* Staff directory table */}
      <Card className="overflow-hidden p-0">
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-muted">
            No accounts configured in this category.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-canvas/50">
                  <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider select-none">
                    Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider select-none">
                    Email
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider select-none">
                    Roles
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider select-none">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider select-none text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-canvas/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm text-ink font-medium whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.name}
                          src={member.avatarUrl}
                          size={32}
                          className="shrink-0"
                        />
                        <span className="font-semibold">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted font-medium whitespace-nowrap">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink font-medium whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(member.roles || []).map((role) => (
                          <RoleBadge key={role} role={role} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <Badge tone={member.status === 'Active' ? 'success' : 'neutral'}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Action */}
                        <button
                          onClick={() => openEditModal(member)}
                          title="Edit Account"
                          className="p-1.5 text-ink-muted hover:text-primary hover:bg-canvas rounded-control transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Power Toggle Action */}
                        <button
                          onClick={() => handleToggleStatus(member.id)}
                          title={member.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                          className={cn(
                            'p-1.5 rounded-control transition-colors',
                            member.status === 'Active'
                              ? 'text-accent hover:text-accent-600 hover:bg-accent-50'
                              : 'text-ink-muted hover:text-ink hover:bg-canvas'
                          )}
                        >
                          <Power size={15} />
                        </button>

                        {/* Reset Password Action */}
                        <button
                          onClick={() => {
                            setResetTarget(member)
                            setIsResetModalOpen(true)
                          }}
                          title="Send Password Reset"
                          className="p-1.5 text-ink-muted hover:text-primary hover:bg-canvas rounded-control transition-colors"
                        >
                          <Key size={15} />
                        </button>

                        {/* Delete Action */}
                        <button
                          onClick={() => {
                            setDeleteTarget(member)
                            setIsDeleteModalOpen(true)
                          }}
                          title="Delete Account"
                          className="p-1.5 text-ink-muted hover:text-danger hover:bg-red-50 rounded-control transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Form Modal */}
      <Modal
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'create' ? `Add New ${activeTab === 'admin' ? 'Admin' : 'Staff'}` : 'Edit Staff Account'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john.doe@company.com"
            required
          />

          {/* Roles Selection (Multi-select Checkboxes) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Roles</label>
            <div className="grid grid-cols-2 gap-2 border border-border rounded-control p-3 bg-canvas/30">
              {AVAILABLE_ROLES.map((role) => {
                const isChecked = formData.roles.includes(role)
                return (
                  <label
                    key={role}
                    className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setFormData((prev) => ({
                          ...prev,
                          roles: checked
                            ? [...prev.roles, role]
                            : prev.roles.filter((r) => r !== role),
                        }))
                      }}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{role}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Status Toggle Selector */}
          <div className="flex items-center justify-between border border-border rounded-control p-3.5 bg-canvas/30 mt-2">
            <div>
              <span className="text-xs font-bold text-ink uppercase block">Account Status</span>
              <span className="text-[11px] text-ink-muted block mt-0.5 leading-normal max-w-[240px]">
                Active accounts can authenticate. Disabled accounts block log in attempts.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.status === 'Active'}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.checked ? 'Active' : 'Disabled',
                  }))
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="px-6">
              {formMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeleteTarget(null)
        }}
        title="Delete Account?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-ink-muted leading-relaxed">
            Are you sure you want to delete the account for <span className="font-bold text-ink">{deleteTarget?.name}</span> ({deleteTarget?.email})? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDeleteTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="px-6"
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Confirmation Modal */}
      <Modal
        open={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false)
          setResetTarget(null)
        }}
        title="Reset Password?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-ink-muted leading-relaxed">
            Send password reset link to <span className="font-bold text-ink">{resetTarget?.email}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetModalOpen(false)
                setResetTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResetConfirm} className="px-6">
              Send
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
