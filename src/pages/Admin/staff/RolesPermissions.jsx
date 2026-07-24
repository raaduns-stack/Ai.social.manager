import { useState } from 'react'
import { ChevronRight, Save, Lock, CheckCircle } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import RoleBadge from '../../../components/staff/RoleBadge'
import { cn } from '../../../utils/cn'

const ROLES = [
  'Super Admin',
  'Admin',
  'Content Manager',
  'Customer Support',
  'Finance',
  'Marketing',
  'Moderator',
]

const MODULES = [
  'Dashboard',
  'Users',
  'Billing',
  'Content Calendar',
  'AI Management',
  'Support',
  'Staff Management',
  'Analytics',
  'Settings',
]

const ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
]

export default function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState('Admin')
  const [toastMessage, setToastMessage] = useState(null)

  // Initialize permission matrix with mock configurations
  const [matrix, setMatrix] = useState(() => {
    const initial = {}
    ROLES.forEach((role) => {
      initial[role] = {}
      MODULES.forEach((mod) => {
        const isSuperAdmin = role === 'Super Admin'
        const isAdmin = role === 'Admin'

        initial[role][mod] = {
          view: isSuperAdmin || ['Admin', 'Content Manager', 'Customer Support', 'Finance', 'Marketing', 'Moderator'].includes(role),
          create: isSuperAdmin || (isAdmin && ['Users', 'Content Calendar'].includes(mod)) || (role === 'Content Manager' && mod === 'Content Calendar'),
          edit: isSuperAdmin || (isAdmin && ['Users', 'Content Calendar', 'Support'].includes(mod)) || (role === 'Content Manager' && mod === 'Content Calendar') || (role === 'Customer Support' && mod === 'Support'),
          delete: isSuperAdmin || (isAdmin && mod === 'Content Calendar'),
        }
      })
    })
    return initial
  })

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleCheckboxChange = (role, moduleName, actionKey, checked) => {
    if (role === 'Super Admin') return // Read-only for Super Admin

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

  const handleSave = () => {
    showToast(`Access policies for ${selectedRole} updated successfully!`)
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

              {selectedRole !== 'Super Admin' && (
                <Button
                  variant="primary"
                  onClick={handleSave}
                  className="flex items-center gap-2 font-semibold text-xs h-9 px-4 self-end sm:self-auto shrink-0"
                >
                  <Save size={14} />
                  Save Permissions
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
                    const isSuperAdmin = selectedRole === 'Super Admin'

                    return (
                      <tr
                        key={moduleName}
                        className="hover:bg-canvas/40 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-ink whitespace-nowrap">
                          {moduleName}
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
