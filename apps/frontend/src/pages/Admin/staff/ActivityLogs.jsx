import { useState } from 'react'
import { Filter, ChevronRight } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import LogTable from '../../../components/staff/LogTable'

const MOCK_ACTIVITIES = [
  {
    id: 1,
    timestamp: 'Jul 25, 2026, 00:10 AM',
    user: 'Amaka Obi',
    action: 'Created User',
    module: 'Users',
    description: 'Added new customer account for Tunde Phillips.',
  },
  {
    id: 2,
    timestamp: 'Jul 24, 2026, 11:45 PM',
    user: 'Lena Dubois',
    action: 'Deleted Campaign',
    module: 'Calendar',
    description: "Removed inactive campaign 'Holiday Blitz 2024'.",
  },
  {
    id: 3,
    timestamp: 'Jul 24, 2026, 10:12 PM',
    user: 'Marcus Thorne',
    action: 'Updated Subscription',
    module: 'Billing',
    description: 'Upgraded subscription tier for creative studio to Enterprise plan.',
  },
  {
    id: 4,
    timestamp: 'Jul 24, 2026, 09:20 PM',
    user: 'Sasha Kovic',
    action: 'Edited AI Prompt',
    module: 'AI Management',
    description: 'Updated LinkedIn default content prompt baseline rules.',
  },
  {
    id: 5,
    timestamp: 'Jul 24, 2026, 08:05 PM',
    user: 'Julia Peters',
    action: 'Reset Password',
    module: 'Staff',
    description: 'Requested credentials reset link for support staff account.',
  },
  {
    id: 6,
    timestamp: 'Jul 24, 2026, 07:14 PM',
    user: 'Alex Rivera',
    action: 'Approved Content',
    module: 'Calendar',
    description: "Approved Instagram photo scheduled post 'Product Showcase'.",
  },
  {
    id: 7,
    timestamp: 'Jul 24, 2026, 06:05 PM',
    user: 'Amaka Obi',
    action: 'Created User',
    module: 'Users',
    description: 'Added customer account for Obi Creative Ltd.',
  },
  {
    id: 8,
    timestamp: 'Jul 24, 2026, 05:12 PM',
    user: 'Lena Dubois',
    action: 'Updated Subscription',
    module: 'Billing',
    description: 'Set discount promo coupon for client campaign billing.',
  },
  {
    id: 9,
    timestamp: 'Jul 24, 2026, 04:22 PM',
    user: 'Sasha Kovic',
    action: 'Edited AI Prompt',
    module: 'AI Management',
    description: 'Customized Instagram captions prompt for user Amaka Obi.',
  },
  {
    id: 10,
    timestamp: 'Jul 24, 2026, 03:01 PM',
    user: 'Julia Peters',
    action: 'Approved Content',
    module: 'Calendar',
    description: 'Approved LinkedIn scheduling post for creative campaign.',
  },
  {
    id: 11,
    timestamp: 'Jul 24, 2026, 02:40 PM',
    user: 'Alex Rivera',
    action: 'Reset Password',
    module: 'Staff',
    description: 'Reset password credentials for staff member Julia Peters.',
  },
  {
    id: 12,
    timestamp: 'Jul 24, 2026, 01:15 PM',
    user: 'Marcus Thorne',
    action: 'Approved Content',
    module: 'Calendar',
    description: 'Approved Facebook scheduled video upload post.',
  },
]

const COLUMNS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'description', label: 'Description' },
]

export default function ActivityLogs() {
  const [selectedModule, setSelectedModule] = useState('All')

  const filteredActivities = selectedModule === 'All'
    ? MOCK_ACTIVITIES
    : MOCK_ACTIVITIES.filter((act) => act.module === selectedModule)

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1 text-xs text-ink-muted mb-2 font-medium">
          <span className="hover:text-ink cursor-pointer">Admin</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="hover:text-ink cursor-pointer">Staff Dashboard</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="text-primary font-semibold">Activity Logs</span>
        </div>

        <PageHeader
          title="System Activity Audit Trails"
          description="Track administrative operations, platform changes, and content moderation activities."
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-surface border border-border p-4 rounded-control shadow-soft">
        <Filter size={16} className="text-ink-muted shrink-0" />
        <span className="text-xs font-bold text-ink-muted uppercase select-none mr-2">Filter by module</span>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="h-9 rounded-control border border-border bg-surface px-3 text-xs text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer w-48"
        >
          <option value="All">All Modules</option>
          <option value="Users">Users</option>
          <option value="Billing">Billing</option>
          <option value="AI Management">AI Management</option>
          <option value="Staff">Staff</option>
          <option value="Calendar">Calendar</option>
        </select>
      </div>

      {/* Activity Table */}
      <div className="space-y-3">
        <LogTable
          columns={COLUMNS}
          rows={filteredActivities}
          isLoading={false}
          emptyMessage="No operations log history found matching selected module."
        />
      </div>
    </div>
  )
}
