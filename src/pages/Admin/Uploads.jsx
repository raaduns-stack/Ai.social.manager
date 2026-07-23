import { useState } from 'react'
import {
  Search,
  Download,
  Check,
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'

// ---------------------------------------------------------------------------
// Initial Mock Data (Preserving details from the Stitch HTML mockup)
// ---------------------------------------------------------------------------
const INITIAL_UPLOADS = [
  {
    id: "up_1",
    name: "Product_Shot_01.jpg",
    category: "Products",
    uploader: "Amaka Obi",
    customer: "TechCorp Solutions",
    size: "4.2 MB",
    date: "Oct 24, 2023",
    status: "Approved",
    type: "image",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvLQMoLA34w1BHU1Wy7B1NEiacHGcQcRLyKF-e9iY1hWN0J6YIeEYCNY9QevrOtLcTl6z_n2qLbe2pro_l_HzOYdyWpIK8gC-wy9KtZRYLpkCi_mrTMtk4tEx0OxQK339X3xYae__o-9tIg2d0WxthaTJuZc4MCEbCAm0KXnZLp29Dt6Yq2YV2D48IompR5g9eWBN5V8CtkZG8dDURhO2aWQc3E763XHOEvUEirtIMRHGamBQfX_bXOQ3UK6BB0R3knG1AhPKylRY9",
  },
  {
    id: "up_2",
    name: "Office_Team_Culture.png",
    category: "Products",
    uploader: "James Wilson",
    customer: "GreenWay Eco",
    size: "8.1 MB",
    date: "Oct 25, 2023",
    status: "Pending",
    type: "image",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs3cdt3BdjWuNUR0HAvwqY1XYoWnlacOYKmxLC7IbszGtVHa0DdwxsHJ8s6m3979Isl0sOI7KFfwgAvZIDJT9bvIRtucK7i_H72gVhoByM5KRF9DvFcHYcCcXah4nqMjzelpM5SSq70FQ0SkVF-NeiwJja-4c9PARogOC1gx9kjFV2E82RWvWbkIDf3uA7YK0lisrc9gEQx-r9TfCTgnhlDBpDJcidOeZCFVfB3JcyvX3dvjmlf9whCQRkpy4_53DHC-O-lwQjM6PE",
  },
  {
    id: "up_3",
    name: "Quarterly_Logistics_Draft.pdf",
    category: "Products",
    uploader: "Sarah Chen",
    customer: "Nova Financial",
    size: "1.4 MB",
    date: "Oct 22, 2023",
    status: "Rejected",
    type: "document",
    url: null,
  },
  {
    id: "up_4",
    name: "Main_Stage_Lighting.jpg",
    category: "Products",
    uploader: "Marcus Thorne",
    customer: "TechCorp Solutions",
    size: "5.7 MB",
    date: "Oct 21, 2023",
    status: "Approved",
    type: "image",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTXJu3thCV3BRJNxPjYktUqF6MVYquZ1LYmmtzBsISqhV4SWNP5tMJ9PpryO7SlIUKAxjBO-257LkqA5IiXPsqpjC7SgLd-xo_eN9XV7_2OtHn_v9_s0h9kelGzIlUK1VHIzxgnWFx-uckjn1Pbno4hAtflBVa-hnuAzlXCDAjIM9PBKfAC1kPA7QNlvwYZB19D820Jt41Jol9uAzxANn3YBc0KK5NmNFrGoNGt6RACxoSbjYSfA875lZqZI9JBR9aTKwRg0wKvV3p",
  },
  {
    id: "up_5",
    name: "Tech_Macro_Detail.png",
    category: "Products",
    uploader: "Amaka Obi",
    customer: "TechCorp Solutions",
    size: "3.1 MB",
    date: "Oct 20, 2023",
    status: "Approved",
    type: "image",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSmg5VWBzpQp3UwXHUhcdQARHo3SDCrRvjazJLOC0haToPiEjVxEtzsZYgHv7E6C_1NCi3I7w01hAPWLPvWX7CWIYi3bWwFqJx1u5uBedFJQmbji5TRG_EHuFBsJOw6_DR5eajMWKPViz7pLX2NGLXqtX29uA4lu11kjPwq9pkKu2m6X8eXOFA40aT8nPaI5PMucyW62jHkEOnfDZO0cpptNGikSnVascSBIA26Y-kmLPwPR1oLE7xCVP30ljbuwnBie9wuxVw7j9y",
  },
  {
    id: "up_6",
    name: "Main_Entrance_Concept.png",
    category: "Products",
    uploader: "Elena Rodriguez",
    customer: "GreenWay Eco",
    size: "12.4 MB",
    date: "Oct 25, 2023",
    status: "Pending",
    type: "image",
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBi9gIKkydOh3W-u_FBKV7K1LRW9DN15vB1SYpVjg8qdKx3GuBgiDKvT-uTeEhQQWXNdHzc-kqFYzy30s4LdyypVxf5rgfbyDL5tptQmK-LcmytpFNtAgZ4I_WmJopNxhtgHV7suzd5uO5yDxcic0NDibwjDNWGUj3RZLUgKT537sIKanUcmXP7KRlyaVZAyO-0ctHKYGnD4qogWzB_CYD08gDxcYG8qi6hnrWQ4_tg13c9t68dBqCNTqwuPpjDGWgU8y2mLFho7z3V",
  },
]

const CATEGORIES = [
  "Business Assets",
  "Logos",
  "Staff",
  "Office View",
  "Products",
  "Events",
  "Business Documents",
]

export default function Uploads() {
  // ---------------------------------------------------------------------------
  // State variables
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('Products')
  const [customerFilter, setCustomerFilter] = useState('All Customers')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploads, setUploads] = useState(INITIAL_UPLOADS)
  const [currentPage, setCurrentPage] = useState(1)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleApprove = (id) => {
    setUploads(prev =>
      prev.map(up => up.id === id ? { ...up, status: 'Approved' } : up)
    )
  }

  const handleReject = (id) => {
    setUploads(prev =>
      prev.map(up => up.id === id ? { ...up, status: 'Rejected' } : up)
    )
  }

  const handleEvaluate = (id) => {
    setUploads(prev =>
      prev.map(up => up.id === id ? { ...up, status: 'Pending' } : up)
    )
  }

  // ---------------------------------------------------------------------------
  // Filtering and Queries
  // ---------------------------------------------------------------------------
  const filteredUploads = uploads.filter(up => {
    // 1. Tab category filter
    const matchesCategory = up.category === activeTab

    // 2. Customer filter
    const matchesCustomer =
      customerFilter === 'All Customers' || up.customer === customerFilter

    // 3. Status filter
    const matchesStatus =
      statusFilter === 'All Status' || up.status === statusFilter

    // 4. Name search query
    const matchesSearch = up.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesCustomer && matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page Header Section */}
      <PageHeader
        title="Uploads Manager"
        description="Verify user content uploads, logo assets, and platform-specific media."
      />

      {/* Top Section: Tab Bar */}
      <div className="border-b border-border overflow-x-auto hide-scrollbar">
        <div className="flex space-x-6 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat)
                setCurrentPage(1)
              }}
              className={cn(
                "pb-3 px-1 text-sm font-medium transition-colors border-b-2",
                activeTab === cat
                  ? "text-primary border-primary font-semibold"
                  : "text-ink-muted border-transparent hover:text-ink"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Row Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-canvas p-4 rounded-card border border-border">
        <div className="flex flex-wrap items-center gap-4">
          {/* Customer select filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink-muted ml-1">Customer</label>
            <div className="relative">
              <select
                value={customerFilter}
                onChange={(e) => {
                  setCustomerFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="appearance-none bg-surface border border-border rounded-control text-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-ink min-w-[180px]"
              >
                <option value="All Customers">All Customers</option>
                <option value="TechCorp Solutions">TechCorp Solutions</option>
                <option value="GreenWay Eco">GreenWay Eco</option>
                <option value="Nova Financial">Nova Financial</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted" size={14} />
            </div>
          </div>

          {/* Status select filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink-muted ml-1">Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="appearance-none bg-surface border border-border rounded-control text-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-ink min-w-[140px]"
              >
                <option value="All Status">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted" size={14} />
            </div>
          </div>
        </div>

        {/* Name search field */}
        <div className="flex flex-col gap-1.5 w-full md:max-w-sm">
          <label className="text-xs font-semibold text-ink-muted ml-1">Search Files</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-surface border border-border rounded-control py-2 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid: Assets Cards */}
      {filteredUploads.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="No uploaded files found"
          description="Try adjusting your filters or search query, or select another tab."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUploads.map((up) => (
            <Card
              key={up.id}
              className="overflow-hidden border-border bg-surface shadow-soft group hover:shadow-hover transition-shadow duration-300"
            >
              {up.type === 'document' ? (
                <div className="h-48 bg-canvas flex flex-col items-center justify-center relative p-4 border-b border-border">
                  <FileText size={64} className="text-ink-muted mb-2" />
                  <span className="text-[10px] text-ink-muted font-bold tracking-wider">DOCUMENT</span>
                  <div className="absolute top-3 right-3">
                    <Badge tone="danger" className="shadow-soft gap-1 flex items-center">
                      <AlertCircle size={12} />
                      Rejected
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="h-48 overflow-hidden relative bg-canvas border-b border-border">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={up.url}
                    alt={up.name}
                  />
                  <div className="absolute top-3 right-3">
                    <Badge
                      tone={up.status === 'Approved' ? 'success' : 'warning'}
                      className="shadow-soft gap-1 flex items-center"
                    >
                      {up.status === 'Approved' ? (
                        <>
                          <CheckCircle2 size={12} />
                          Approved
                        </>
                      ) : (
                        <>
                          <Clock size={12} />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Card Footer Details */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-ink truncate" title={up.name}>
                    {up.name}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">
                    Uploaded by <span className="font-semibold text-ink">{up.uploader}</span>
                  </p>
                  <p className="text-[10px] text-ink-muted/80 mt-1 uppercase tracking-wider">
                    {up.date} • {up.size}
                  </p>
                </div>

                {/* Approve/Reject Actions Row */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Download Asset"
                      className="h-8 w-8 p-0 flex items-center justify-center hover:bg-canvas rounded-control"
                      onClick={() => alert(`Simulating download of: ${up.name}`)}
                    >
                      <Download size={14} className="text-ink-muted" />
                    </Button>
                  </div>

                  <div className="flex gap-2 items-center">
                    {up.status === 'Rejected' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          title="Already Rejected"
                          className="h-8 px-2 text-xs border border-border text-danger bg-danger/10 opacity-60 cursor-not-allowed"
                        >
                          <X size={14} className="mr-1" />
                          Rejected
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Re-evaluate Asset"
                          className="h-8 px-2 text-xs font-semibold"
                          onClick={() => handleEvaluate(up.id)}
                        >
                          Re-evaluate
                        </Button>
                      </>
                    ) : up.status === 'Approved' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Reject Asset"
                          className="h-8 w-8 p-0 flex items-center justify-center text-danger border border-border hover:bg-danger/10 rounded-control"
                          onClick={() => handleReject(up.id)}
                        >
                          <X size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          title="Already Approved"
                          className="h-8 px-2 text-xs border border-border text-accent-600 bg-accent-50 opacity-60 cursor-not-allowed"
                        >
                          <Check size={14} className="mr-1" />
                          Approved
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Reject Asset"
                          className="h-8 w-8 p-0 flex items-center justify-center text-danger border border-border hover:bg-danger/10 rounded-control"
                          onClick={() => handleReject(up.id)}
                        >
                          <X size={14} />
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          title="Approve Asset"
                          className="h-8 w-8 p-0 flex items-center justify-center rounded-control"
                          onClick={() => handleApprove(up.id)}
                        >
                          <Check size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <footer className="mt-8 flex items-center justify-between py-4 border-t border-border">
        <p className="text-xs text-ink-muted">Showing {filteredUploads.length} of 142 uploads</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-control text-xs font-semibold transition-colors",
                  currentPage === page
                    ? "bg-primary text-white"
                    : "text-ink-muted hover:bg-canvas hover:text-ink"
                )}
              >
                {page}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 3}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </footer>
    </div>
  )
}
