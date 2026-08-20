import { useState, useEffect } from 'react'
import { ChevronRight, Save, Lock, CheckCircle } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import RoleBadge from '../../../components/staff/RoleBadge'
import { cn } from '../../../utils/cn'
import { getRolePermissions, updateRolePermissions, createStaff } from '../../../features/admin/admin-api'
import { useAdminAuth } from '../../../context/useAdminAuth'

const ROLES = [
  'super_admin',
  'account_manager',
  'reviewer',
  'support_staff',
  'designer',
]

const ROLE_DISPLAY_MAP = {
  super_admin: 'Super Admin',
  account_manager: 'Account Manager',
  reviewer: 'Reviewer',
  support_staff: 'Support Staff',
  designer: 'Designer',
}

const MODULES = [
  'dashboard',
  'user_management',
  'billing',
  'social_accounts',
  'content_calendar',
  'content_creation',
  'upload_management',
  'analytics',
  'ai_config',
  'support',
  'notification_management',
  'settings',
  'audit_logs',
  'staff_management',
  'money_management',
]

const MODULE_DISPLAY_MAP = {
  dashboard: 'Dashboard',
  user_management: 'User Management',
  billing: 'Billing',
  social_accounts: 'Social Accounts',
  content_calendar: 'Content Calendar',
  content_creation: 'Content Creation',
  upload_management: 'Upload Management',
  analytics: 'Analytics',
  ai_config: 'AI Management',
  support: 'Support',
  notification_management: 'Notification Management',
  settings: 'Settings',
  audit_logs: 'Audit Logs',
  staff_management: 'Staff Management',
  money_management: 'Money Management',
}

const ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
]

function accessLevelToActions(level) {
  return {
    view: ['view', 'own_only', 'manage', 'full'].includes(level),
    create: ['own_only', 'manage', 'full'].includes(level),
    edit: ['own_only', 'manage', 'full'].includes(level),
    delete: level === 'full',
  };
}

function actionsToAccessLevel(actions) {
  if (actions.delete) return 'full';
  if (actions.edit || actions.create) return 'manage';
  if (actions.view) return 'view';
  return 'none';
}

export default function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState('account_manager')
  const [toastMessage, setToastMessage] = useState(null)
  const [matrix, setMatrix] = useState({})
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const { refreshPermissions, admin } = useAdminAuth()
  const isSuperAdminUser = admin?.role === 'super_admin'

  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'designer',
  })

  const handleStaffFormChange = (e) => {
    const { name, value } = e.target
    setStaffForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    try {
      await createStaff(staffForm)
      showToast(`Staff account for ${staffForm.fullName} created successfully!`)
      setStaffForm({
        fullName: '',
        email: '',
        password: '',
        role: 'designer',
      })
    } catch (err) {
      console.error('Failed to create staff account:', err)
      const errorMsg = err.response?.data?.message || 'Failed to create staff account. Please try again.'
      showToast(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg)
    }
  }

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const data = await getRolePermissions()
      
      const initial = {}
      ROLES.forEach((role) => {
        initial[role] = {}
        MODULES.forEach((mod) => {
          initial[role][mod] = {
            view: false,
            create: false,
            edit: false,
            delete: false,
          }
        })
      })

      data.forEach((item) => {
        if (initial[item.role] && initial[item.role][item.module]) {
          initial[item.role][item.module] = accessLevelToActions(item.accessLevel)
        }
      })

      setMatrix(initial)
    } catch (err) {
      console.error('Failed to fetch role permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleCheckboxChange = (role, moduleName, actionKey, checked) => {
    if (role === 'super_admin') return // Read-only for Super Admin

    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleName]: {
          ...prev[role][moduleName],
          [actionKey]: checked,
        },
      },
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const updates = MODULES.map((mod) => {
        const actions = matrix[selectedRole]?.[mod] || { view: false, create: false, edit: false, delete: false }
        const accessLevel = actionsToAccessLevel(actions)
        return { module: mod, accessLevel }
      })

      await updateRolePermissions({
        role: selectedRole,
        permissions: updates,
      })

      await refreshPermissions()
      showToast(`Access policies for ${ROLE_DISPLAY_MAP[selectedRole]} updated successfully!`)
    } catch (err) {
      console.error('Failed to save permissions:', err)
      showToast('Failed to save permissions. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-semibold text-ink-muted animate-pulse">Loading permissions...</div>
      </div>
    )
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
          <span className="text-primary font-semibold">Roles & Permissions</span>
        </div>

        <PageHeader
          title="Access Control Matrix"
          description="Configure module-level permissions for all system user roles."
        />
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-accent-50 border border-accent-100 rounded-control text-xs font-semibold text-accent-600 flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={14} className="shrink-0 text-accent-500" />
          {toastMessage}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Role Selector */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-border bg-canvas/30">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Roles
              </h3>
            </div>
            <ul className="flex flex-col">
              {ROLES.map((role) => {
                const isActive = selectedRole === role
                return (
                  <li key={role}>
                    <button
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left border-l-4 font-medium text-sm',
                        isActive
                          ? 'bg-primary-50 text-primary border-primary font-bold'
                          : 'text-ink-muted hover:bg-canvas hover:text-ink border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RoleBadge role={role} />
                      </div>
                      <ChevronRight
                        size={14}
                        className={cn(
                          'opacity-0 transition-opacity duration-150',
                          isActive && 'opacity-100 text-primary-600'
                        )}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>

          {isSuperAdminUser && (
            <Card className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-ink">Create Staff Account</h3>
              <form onSubmit={handleCreateStaff} className="space-y-3.5">
                <Input
                  label="Full Name"
                  type="text"
                  name="fullName"
                  value={staffForm.fullName}
                  onChange={handleStaffFormChange}
                  placeholder="Amaka Obi"
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={staffForm.email}
                  onChange={handleStaffFormChange}
                  placeholder="amaka.obi@example.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={staffForm.password}
                  onChange={handleStaffFormChange}
                  placeholder="Min 8 characters"
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="staff-role" className="text-sm font-medium text-ink">Role</label>
                  <select
                    id="staff-role"
                    name="role"
                    value={staffForm.role}
                    onChange={handleStaffFormChange}
                    className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="designer">Designer</option>
                    <option value="support_staff">Support Staff</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="account_manager">Account Manager</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <Button type="submit" variant="primary" className="w-full font-semibold text-xs h-9 mt-2">
                  Create Account
                </Button>
              </form>
            </Card>
          )}

          {/* Help Info Card */}
          <Card className="p-4 bg-canvas border border-border flex items-start gap-3">
            <Lock size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-ink">Super Admin Rule</p>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                The Super Admin role possesses full read, write, and execute permissions across all modules. 
                These permissions are static and cannot be modified.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Side: Permissions Matrix */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <Card className="flex flex-col p-6 gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-ink">
                    Permission Matrix
                  </h3>
                  <span className="text-xs text-ink-muted font-normal">for</span>
                  <RoleBadge role={selectedRole} />
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  Manage the view, create, edit, and delete rules of the current selected role.
                </p>
              </div>

              {selectedRole !== 'super_admin' && (
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 font-semibold text-xs h-9 px-4 self-end sm:self-auto shrink-0"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Permissions
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Matrix Table */}
            <div className="w-full overflow-x-auto border border-border rounded-control bg-canvas/10">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-canvas/30">
                    <th className="px-6 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wider select-none">
                      Module
                    </th>
                    {ACTIONS.map((action) => (
                      <th
                          key={action.key}
                          className="px-6 py-3.5 text-xs font-bold text-ink-muted uppercase tracking-wider select-none text-center"
                        >
                          {action.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {MODULES.map((moduleName) => {
                      const isSuperAdmin = selectedRole === 'super_admin'

                      return (
                        <tr
                          key={moduleName}
                          className="hover:bg-canvas/40 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-ink whitespace-nowrap">
                            {MODULE_DISPLAY_MAP[moduleName]}
                          </td>
                          {ACTIONS.map((action) => {
                            // Super Admin checkboxes are always checked and disabled
                            const isChecked = isSuperAdmin
                              ? true
                              : !!matrix[selectedRole]?.[moduleName]?.[action.key]

                            return (
                              <td
                                key={action.key}
                                className="px-6 py-4 text-center whitespace-nowrap"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isSuperAdmin}
                                  onChange={(e) =>
                                    handleCheckboxChange(
                                      selectedRole,
                                      moduleName,
                                      action.key,
                                      e.target.checked
                                    )
                                  }
                                  className={cn(
                                    'rounded border-border text-primary focus:ring-primary h-4.5 w-4.5 transition-all select-none',
                                    isSuperAdmin
                                      ? 'cursor-not-allowed opacity-60'
                                      : 'cursor-pointer'
                                  )}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
  )
}
