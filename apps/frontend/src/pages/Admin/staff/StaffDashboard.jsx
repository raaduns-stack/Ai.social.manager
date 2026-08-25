import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, UserX, Clock, ChevronRight, RefreshCw } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import StatsCard from '../../../components/ui/StatsCard'
import Button from '../../../components/ui/Button'
import RoleBadge from '../../../components/staff/RoleBadge'
import LogTable from '../../../components/staff/LogTable'
import { getStaffOverview } from '../../../features/admin/admin-api'

export default function StaffDashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'device', label: 'Device / IP' },
    { key: 'time', label: 'Time' },
    { key: 'status', label: 'Status' },
  ]

  useEffect(() => {
    let isMounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getStaffOverview()
        if (isMounted) setOverview(data)
      } catch (err) {
        console.error(err)
        if (isMounted) setError('Failed to load staff dashboard.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const rows = (overview?.recentLogins || []).map((row) => ({
    id: row.id,
    name: row.name,
    role: <RoleBadge role={row.role} />,
    device: row.device,
    time: row.time
      ? new Date(row.time).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '—',
    status: row.status,
  }))

  return (
    <div className="space-y-6">
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
                onClick={() => navigate('/admin/staff/manage')}
                className="font-semibold text-xs h-9"
              >
                Add Staff
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/admin/staff/manage')}
                className="font-semibold text-xs h-9"
              >
                Add Admin
              </Button>
            </div>
          }
        />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Admins"
          value={loading ? '—' : String(overview?.totalAdmins ?? 0)}
          icon={<Users size={20} />}
          tone="default"
        />
        <StatsCard
          label="Total Staff"
          value={loading ? '—' : String(overview?.totalStaff ?? 0)}
          icon={<UserCheck size={20} />}
          tone="default"
        />
        <StatsCard
          label="Active Users"
          value={loading ? '—' : String(overview?.activeUsers ?? 0)}
          icon={<Clock size={20} />}
          tone="default"
        />
        <StatsCard
          label="Disabled Accounts"
          value={loading ? '—' : String(overview?.disabledAccounts ?? 0)}
          icon={<UserX size={20} />}
          tone="default"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-ink">Recent Logins</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted py-8">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading login history...
          </div>
        ) : (
          <LogTable
            columns={columns}
            rows={rows}
            statusKey="status"
            isLoading={false}
            emptyMessage="No recent activity"
          />
        )}
      </div>
    </div>
  )
}
