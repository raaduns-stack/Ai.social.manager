import { Users, UserCheck, UserX, Clock, ChevronRight } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import StatsCard from '../../../components/ui/StatsCard'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import RoleBadge from '../../../components/staff/RoleBadge'
import LogTable from '../../../components/staff/LogTable'

export default function StaffDashboard() {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'device', label: 'Device / IP' },
    { key: 'time', label: 'Time' },
    { key: 'status', label: 'Status' },
  ]

  const rows = [
    {
      id: 1,
      name: 'Amaka Obi',
      role: <RoleBadge role="Super Admin" />,
      device: 'Chrome (192.168.1.1) - Windows',
      time: 'Jul 24, 2026, 10:45 PM',
      status: 'Successful',
    },
    {
      id: 2,
      name: 'Lena Dubois',
      role: <RoleBadge role="Admin" />,
      device: 'Safari (10.0.0.12) - macOS',
      time: 'Jul 24, 2026, 09:30 PM',
      status: 'Successful',
    },
    {
      id: 3,
      name: 'Marcus Thorne',
      role: <RoleBadge role="Content Manager" />,
      device: 'Firefox (172.16.254.1) - Linux',
      time: 'Jul 24, 2026, 08:15 PM',
      status: 'Suspicious',
    },
    {
      id: 4,
      name: 'Sasha Kovic',
      role: <RoleBadge role="Customer Support" />,
      device: 'Chrome - Android',
      time: 'Jul 24, 2026, 07:05 PM',
      status: 'Failed',
    },
    {
      id: 5,
      name: 'Julia Peters',
      role: <RoleBadge role="Moderator" />,
      device: 'Edge - Windows',
      time: 'Jul 24, 2026, 06:12 PM',
      status: 'Successful',
    },
    {
      id: 6,
      name: 'Alex Rivera',
      role: <RoleBadge role="Marketing" />,
      device: 'Chrome - macOS',
      time: 'Jul 24, 2026, 05:45 PM',
      status: 'Successful',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1 text-xs text-ink-muted mb-2 font-medium">
          <span className="hover:text-ink cursor-pointer">Admin</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="text-primary font-semibold">Staff Dashboard</span>
        </div>
        
        <PageHeader
          title="Staff Directory & Security Dashboard"
          description="Overview of staff accounts, credentials, and authentication activity."
          action={
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => console.log('Add Staff clicked')}
                className="font-semibold text-xs h-9"
              >
                Add Staff
              </Button>
              <Button
                variant="primary"
                onClick={() => console.log('Add Admin clicked')}
                className="font-semibold text-xs h-9"
              >
                Add Admin
              </Button>
            </div>
          }
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Admins"
          value="4"
          icon={<Users size={20} />}
          tone="default"
        />
        <StatsCard
          label="Total Staff"
          value="12"
          icon={<UserCheck size={20} />}
          tone="default"
        />
        <StatsCard
          label="Active Users"
          value="15"
          icon={<Clock size={20} />}
          tone="default"
        />
        <StatsCard
          label="Disabled Accounts"
          value="1"
          icon={<UserX size={20} />}
          tone="default"
        />
      </div>

      {/* Recent Logins Table */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-ink">Recent Logins</h3>
        <LogTable
          columns={columns}
          rows={rows}
          statusKey="status"
          isLoading={false}
          emptyMessage="No login activity history found."
        />
      </div>
    </div>
  )
}
