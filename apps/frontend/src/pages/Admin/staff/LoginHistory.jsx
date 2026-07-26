import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Input from '../../../components/ui/Input'
import LogTable from '../../../components/staff/LogTable'

const MOCK_LOGINS = [
  {
    id: 1,
    name: 'Amaka Obi',
    device: 'Windows PC',
    browser: 'Chrome 126.0',
    ip: '197.210.64.12',
    location: 'Lagos, Nigeria',
    time: 'Jul 25, 2026, 00:15 AM',
    status: 'Successful',
  },
  {
    id: 2,
    name: 'Lena Dubois',
    device: 'MacBook Pro',
    browser: 'Safari 17.4',
    ip: '82.124.32.90',
    location: 'Paris, France',
    time: 'Jul 24, 2026, 11:20 PM',
    status: 'Successful',
  },
  {
    id: 3,
    name: 'Marcus Thorne',
    device: 'Linux Desktop',
    browser: 'Firefox 125.0',
    ip: '203.0.113.195',
    location: 'London, UK',
    time: 'Jul 24, 2026, 10:45 PM',
    status: 'Suspicious',
  },
  {
    id: 4,
    name: 'Sasha Kovic',
    device: 'Samsung Galaxy',
    browser: 'Chrome Mobile',
    ip: '109.252.12.87',
    location: 'Belgrade, Serbia',
    time: 'Jul 24, 2026, 09:12 PM',
    status: 'Failed',
  },
  {
    id: 5,
    name: 'Julia Peters',
    device: 'Windows PC',
    browser: 'Edge 126.0',
    ip: '188.45.92.124',
    location: 'Berlin, Germany',
    time: 'Jul 24, 2026, 08:33 PM',
    status: 'Successful',
  },
  {
    id: 6,
    name: 'Alex Rivera',
    device: 'MacBook Air',
    browser: 'Chrome 126.0',
    ip: '198.51.100.4',
    location: 'New York, USA',
    time: 'Jul 24, 2026, 07:15 PM',
    status: 'Successful',
  },
  {
    id: 7,
    name: 'Amaka Obi',
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    ip: '197.210.64.12',
    location: 'Lagos, Nigeria',
    time: 'Jul 24, 2026, 06:40 PM',
    status: 'Successful',
  },
  {
    id: 8,
    name: 'Unknown User',
    device: 'Android Device',
    browser: 'Chrome Mobile',
    ip: '198.51.100.89',
    location: 'Unknown Location',
    time: 'Jul 24, 2026, 05:12 PM',
    status: 'Failed',
  },
  {
    id: 9,
    name: 'Sasha Kovic',
    device: 'Windows PC',
    browser: 'Chrome 126.0',
    ip: '109.252.12.87',
    location: 'Belgrade, Serbia',
    time: 'Jul 24, 2026, 04:30 PM',
    status: 'Successful',
  },
  {
    id: 10,
    name: 'Marcus Thorne',
    device: 'iPad Pro',
    browser: 'Safari Mobile',
    ip: '203.0.113.195',
    location: 'London, UK',
    time: 'Jul 24, 2026, 03:15 PM',
    status: 'Successful',
  },
  {
    id: 11,
    name: 'Julia Peters',
    device: 'Ubuntu Workstation',
    browser: 'Firefox 125.0',
    ip: '188.45.92.124',
    location: 'Berlin, Germany',
    time: 'Jul 24, 2026, 02:05 PM',
    status: 'Successful',
  },
  {
    id: 12,
    name: 'Lena Dubois',
    device: 'iPhone 13',
    browser: 'Safari Mobile',
    ip: '82.124.32.90',
    location: 'Paris, France',
    time: 'Jul 24, 2026, 01:40 PM',
    status: 'Successful',
  },
]

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'device', label: 'Device' },
  { key: 'browser', label: 'Browser' },
  { key: 'ip', label: 'IP Address' },
  { key: 'location', label: 'Location' },
  { key: 'time', label: 'Time' },
  { key: 'status', label: 'Status' },
]

export default function LoginHistory() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogins = MOCK_LOGINS.filter((log) =>
    log.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1 text-xs text-ink-muted mb-2 font-medium">
          <span className="hover:text-ink cursor-pointer">Admin</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="hover:text-ink cursor-pointer">Staff Dashboard</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="text-primary font-semibold">Login History</span>
        </div>

        <PageHeader
          title="Audit Authentication Logs"
          description="View recent staff dashboard access attempts, authentication channels, and geographic origins."
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-4 bg-surface border border-border p-4 rounded-control shadow-soft">
        <div className="relative max-w-xs w-full">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by staff name..."
            className="pl-9 text-xs"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>

      {/* Login History Table */}
      <div className="space-y-3">
        <LogTable
          columns={COLUMNS}
          rows={filteredLogins}
          statusKey="status"
          isLoading={false}
          emptyMessage="No login activity matched your search filters."
        />
      </div>
    </div>
  )
}
