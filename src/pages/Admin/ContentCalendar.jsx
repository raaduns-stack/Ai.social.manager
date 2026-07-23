import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Calendar,
  ChevronRight,
  User,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import DataTable from '../../components/ui/DataTable'

const CUSTOMERS = [
  { id: 1, name: 'Amaka Obi', email: 'amaka.obi@example.com', plan: 'Brand Domination', status: 'Active' },
  { id: 2, name: 'Lena Dubois', email: 'l.dubois@creative.io', plan: 'Starter', status: 'Suspended' },
  { id: 3, name: 'David Chen', email: 'david.chen@freelance.org', plan: 'Free', status: 'Expired' },
  { id: 4, name: 'Sasha Kovic', email: 's.kovic@agencymedia.com', plan: 'Starter', status: 'Active' },
  { id: 5, name: 'Marcus Thorne', email: 'm.thorne@globalnet.co', plan: 'Growth', status: 'Suspended' },
  { id: 6, name: 'Julia Peters', email: 'julia.p@personal.blog', plan: 'Free', status: 'Active' },
  { id: 7, name: 'Alex Rivera', email: 'alex.rivera@enterprise.com', plan: 'Brand Domination', status: 'Active' },
]

export default function ContentCalendar() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = useMemo(() => {
    return CUSTOMERS.filter((customer) => {
      const nameMatch = customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      const emailMatch = customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      return nameMatch || emailMatch
    })
  }, [searchTerm])

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {row.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h4 className="font-semibold text-ink text-sm leading-none mb-1">{row.name}</h4>
            <span className="text-[10px] text-ink-muted block md:hidden">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      className: 'hidden md:table-cell',
      render: (row) => <span className="text-ink-muted font-medium">{row.email}</span>,
    },
    {
      key: 'plan',
      label: 'Subscription Tier',
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
          <Badge tone={tone} className="uppercase tracking-wider text-[10px] font-semibold">
            {row.status}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <Button
          as={Link}
          to={`/admin/users/${row.id}/calendar`}
          variant="outline"
          size="sm"
          className="text-primary border-primary/20 hover:bg-primary-50 font-semibold gap-1.5 h-8 text-xs inline-flex items-center"
        >
          <Calendar size={13} />
          <span>View Calendar</span>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Calendars"
        description="Select a customer from the directory below to view and manage their content calendar queue."
      />

      <Card className="p-6 space-y-6">
        {/* Search controls */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-3 text-ink-muted" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name or email..."
            className="pl-9"
          />
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredCustomers}
          pageSize={10}
          emptyMessage="No customers found matching your search term."
        />
      </Card>
    </div>
  )
}
