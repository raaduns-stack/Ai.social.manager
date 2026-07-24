import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import PageHeader from '../../components/layout/PageHeader'
import WeekDayCard from '../../components/calendar/WeekDayCard'
import ViewAllCustomersModal from '../../components/calendar/ViewAllCustomersModal'

const MOCK_CUSTOMERS_POOL = [
  { id: 1, businessName: 'Amaka Obi', avatarUrl: '', postCount: 3 },
  { id: 2, businessName: 'Lena Dubois', avatarUrl: '', postCount: 1 },
  { id: 3, businessName: 'David Chen', avatarUrl: '', postCount: 5 },
  { id: 4, businessName: 'Sasha Kovic', avatarUrl: '', postCount: 2 },
  { id: 5, businessName: 'Marcus Thorne', avatarUrl: '', postCount: 4 },
  { id: 6, businessName: 'Julia Peters', avatarUrl: '', postCount: 6 },
  { id: 7, businessName: 'Alex Rivera', avatarUrl: '', postCount: 1 },
  { id: 8, businessName: 'TechNova Ltd', avatarUrl: '', postCount: 8 },
  { id: 9, businessName: 'John Clothing', avatarUrl: '', postCount: 3 },
  { id: 10, businessName: 'EcoBites Meal Prep', avatarUrl: '', postCount: 2 },
  { id: 11, businessName: 'Apex Law Partners', avatarUrl: '', postCount: 4 },
  { id: 12, businessName: 'Velocity Sports', avatarUrl: '', postCount: 5 },
  { id: 13, businessName: 'Luxe Beauty Spa', avatarUrl: '', postCount: 7 },
  { id: 14, businessName: 'Quantum Dev Agency', avatarUrl: '', postCount: 1 },
]

export default function ContentCalendar() {
  const navigate = useNavigate()
  const [selectedDayModal, setSelectedDayModal] = useState(null)

  const today = useMemo(() => new Date(), [])

  // Subtitle showing current week range (e.g. "Jul 27 – Aug 2, 2026")
  const weekSubtitle = useMemo(() => {
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    const sunday = endOfWeek(today, { weekStartsOn: 1 })
    return `${format(monday, 'MMM d')} – ${format(sunday, 'MMM d, yyyy')}`
  }, [today])

  // Compute 7 days starting from today with mock customers
  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const dateObj = addDays(today, index)
      
      // Vary mock customer count depending on index
      let dayCustomers = []
      if (index === 0) {
        dayCustomers = MOCK_CUSTOMERS_POOL.slice(0, 3)
      } else if (index === 1) {
        dayCustomers = []
      } else if (index === 2) {
        dayCustomers = MOCK_CUSTOMERS_POOL.slice(0, 8)
      } else if (index === 3) {
        dayCustomers = MOCK_CUSTOMERS_POOL
      } else if (index === 4) {
        dayCustomers = MOCK_CUSTOMERS_POOL.slice(3, 4)
      } else if (index === 5) {
        dayCustomers = MOCK_CUSTOMERS_POOL.slice(5, 9)
      } else if (index === 6) {
        dayCustomers = []
      }

      return {
        dayLabel: format(dateObj, 'EEEE'),
        dateStr: format(dateObj, 'MMM d'),
        customers: dayCustomers,
      }
    })
  }, [today])

  const handleCustomerClick = (customerId) => {
    navigate(`/admin/users/${customerId}/calendar`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Calendar"
        description={weekSubtitle}
      />

      {/* Grid of 7 weekday cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6 items-stretch">
        {days.map((day, index) => (
          <WeekDayCard
            key={day.dayLabel}
            dayLabel={day.dayLabel}
            date={day.dateStr}
            isToday={index === 0}
            customers={day.customers}
            maxVisible={6}
            onCustomerClick={handleCustomerClick}
            onViewAllClick={() => setSelectedDayModal(day)}
          />
        ))}
      </div>

      {/* Modal detail for "View All" */}
      <ViewAllCustomersModal
        isOpen={!!selectedDayModal}
        onClose={() => setSelectedDayModal(null)}
        dayLabel={selectedDayModal?.dayLabel || ''}
        customers={selectedDayModal?.customers || []}
        onCustomerClick={handleCustomerClick}
      />
    </div>
  )
}
