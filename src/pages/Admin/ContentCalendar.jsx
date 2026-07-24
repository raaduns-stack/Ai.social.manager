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
  { id: 15, businessName: 'Stellar Tech Hub', avatarUrl: '', postCount: 2 },
  { id: 16, businessName: 'Zen Yoga Studios', avatarUrl: '', postCount: 3 },
  { id: 17, businessName: 'Fresh Bakery', avatarUrl: '', postCount: 2 },
  { id: 18, businessName: 'ABC Stores', avatarUrl: '', postCount: 1 },
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
        dayCustomers = MOCK_CUSTOMERS_POOL.slice(5, 17)
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
    <div className="w-full max-w-full overflow-hidden space-y-6 flex flex-col h-full">
      <PageHeader
        title="Content Calendar"
        description={weekSubtitle}
      />

      {/* Horizontal scrolling flex container (embedded inside the page) */}
      <div className="w-full overflow-x-auto pb-6 scrollbar-thin">
        <div className="flex gap-6 flex-nowrap snap-x snap-mandatory">
          {days.map((day, index) => {
            const totalPosts = day.customers.reduce((sum, c) => sum + (c.postCount || 0), 0)
            
            // Inject total scheduled posts inside the date field safely to respect day card design
            const dateProp = (
              <span className="block mt-1">
                <span className="text-xs text-ink-muted block">{day.dateStr}</span>
                <span className="mt-1.5 text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full inline-block">
                  {totalPosts} Scheduled {totalPosts === 1 ? 'Post' : 'Posts'}
                </span>
              </span>
            )

            return (
              <div
                key={day.dayLabel}
                className="w-[290px] sm:w-[320px] shrink-0 snap-start"
              >
                <WeekDayCard
                  dayLabel={day.dayLabel}
                  date={dateProp}
                  isToday={index === 0}
                  customers={day.customers}
                  maxVisible={10}
                  onCustomerClick={handleCustomerClick}
                  onViewAllClick={() => setSelectedDayModal(day)}
                />
              </div>
            )
          })}
        </div>
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
