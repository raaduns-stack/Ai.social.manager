import { useState, useEffect } from 'react'
import {
  Search,
  Download,
  Check,
  X,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'
import apiClient from '../../lib/api-client'
import { adminGetUploads, adminReviewUpload } from '../../features/uploads/uploads-api'

const CATEGORIES = [
  "Business Assets",
  "Brand Assets",
  "Staff",
  "Office View",
  "Products",
  "Events",
  "Business Documents",
]

const CATEGORY_MAP = {
  'Business Assets': 'business_assets',
  'Brand Assets': 'business_assets', // fallback
  'Staff': 'staff_images',
  'Office View': 'office_view',
  'Products': 'products',
  'Events': 'events',
  'Business Documents': 'business_documents',
}

const CATEGORY_TO_TAB = {
  'business_assets': 'Business Assets',
  'staff_images': 'Staff',
  'office_view': 'Office View',
  'products': 'Products',
  'events': 'Events',
  'business_documents': 'Business Documents',
}

export default function Uploads() {
  const [activeTab, setActiveTab] = useState('Products')
  const [customerFilter, setCustomerFilter] = useState('All Customers')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploads, setUploads] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadUploads = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminGetUploads()
      const mapped = data.map((u) => {
        const type = u.mimeType?.startsWith('image/')
          ? 'image'
          : u.mimeType?.startsWith('video/')
            ? 'video'
            : 'document';
        const sizeBytes = u.fileSize ?? 0;
        const size = sizeBytes > 1024 * 1024
          ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(sizeBytes / 1024)} KB`;
        const created = new Date(u.createdAt);
        return {
          id: u.id,
          name: u.originalName,
          category: CATEGORY_TO_TAB[u.category] || 'Products',
          type,
          size,
          sizeBytes,
          date: created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          timestamp: created.getTime(),
          status: u.status ? u.status.toUpperCase() : 'PENDING',
          description: u.description || '',
          url: u.fileUrl,
          uploader: u.user ? u.user.fullName : 'Unknown',
          customer: u.user ? (u.user.businessName || u.user.fullName) : 'Unknown',
          user: u.user,
        };
      });
      setUploads(mapped)
    } catch (err) {
      setError(err.message || 'Failed to fetch uploads')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUploads()
  }, [])

  const handleApprove = async (id) => {
    try {
      await adminReviewUpload(id, { status: 'approved' })
      loadUploads()
    } catch (err) {
      console.error('Failed to approve upload', err)
      alert('Failed to approve upload: ' + (err.message || err))
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:')
    if (reason === null) return
    if (!reason.trim()) {
      alert('A rejection reason is required to reject.')
      return
    }
    try {
      await adminReviewUpload(id, { status: 'rejected', rejectionReason: reason })
      loadUploads()
    } catch (err) {
      console.error('Failed to reject upload', err)
      alert('Failed to reject upload: ' + (err.message || err))
    }
  }

  const handleEvaluate = async (id) => {
    try {
      await adminReviewUpload(id, { status: 'pending' })
      loadUploads()
    } catch (err) {
      console.error('Failed to re-evaluate upload', err)
      alert('Failed to re-evaluate upload: ' + (err.message || err))
    }
  }

  const handleDownload = async (up) => {
    try {
      const response = await apiClient.get(`/admin/uploads/${up.id}/download`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', up.name)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download file', err)
    }
  }

  // Collect unique customers from all uploads to populate the filter dropdown
  const uniqueCustomers = Array.from(
    new Map(
      uploads
        .filter(u => u.user)
        .map(u => [u.user.id, u.user.businessName || u.user.fullName])
    ).entries()
  );

  const filteredUploads = uploads.filter(up => {
    // 1. Tab category filter
    const matchesCategory = up.category === activeTab

    // 2. Customer filter
    const matchesCustomer =
      customerFilter === 'All Customers' || (up.user && up.user.id === customerFilter)

    // 3. Status filter
    const matchesStatus =
      statusFilter === 'All Status' || up.status?.toUpperCase() === statusFilter.toUpperCase()

    // 4. Name search query
    const matchesSearch = up.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesCustomer && matchesStatus && matchesSearch
  })

  // Client-side pagination
  const ITEMS_PER_PAGE = 6
  const totalPages = Math.ceil(filteredUploads.length / ITEMS_PER_PAGE) || 1
  const paginatedUploads = filteredUploads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

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
                {uniqueCustomers.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
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
      {isLoading ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-xs text-ink-muted mt-3">Loading uploads...</p>
        </Card>
      ) : error ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center border-danger">
          <AlertCircle size={32} className="text-danger mb-2" />
          <h4 className="text-base font-semibold text-ink">Error Loading Uploads</h4>
          <p className="text-xs text-danger mt-1">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={loadUploads}>
            Retry
          </Button>
        </Card>
      ) : paginatedUploads.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="No uploaded files found"
          description="Try adjusting your filters or search query, or select another tab."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedUploads.map((up) => (
            <Card
              key={up.id}
              className="overflow-hidden border-border bg-surface shadow-soft group hover:shadow-hover transition-shadow duration-300"
            >
              {up.type !== 'image' && up.type !== 'video' ? (
                <div className="h-48 bg-canvas flex flex-col items-center justify-center relative p-4 border-b border-border">
                  <FileText size={64} className="text-ink-muted mb-2" />
                  <span className="text-[10px] text-ink-muted font-bold tracking-wider">DOCUMENT</span>
                  <div className="absolute top-3 right-3">
                    <Badge
                      tone={up.status?.toUpperCase() === 'APPROVED' ? 'success' : up.status?.toUpperCase() === 'REJECTED' ? 'danger' : 'warning'}
                      className="shadow-soft gap-1 flex items-center"
                    >
                      {up.status?.toUpperCase() === 'APPROVED' ? (
                        <>
                          <CheckCircle2 size={12} />
                          Approved
                        </>
                      ) : up.status?.toUpperCase() === 'REJECTED' ? (
                        <>
                          <AlertCircle size={12} />
                          Rejected
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
              ) : (
                <div className="h-48 overflow-hidden relative bg-canvas border-b border-border">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={up.url}
                    alt={up.name}
                  />
                  <div className="absolute top-3 right-3">
                    <Badge
                      tone={up.status?.toUpperCase() === 'APPROVED' ? 'success' : up.status?.toUpperCase() === 'REJECTED' ? 'danger' : 'warning'}
                      className="shadow-soft gap-1 flex items-center"
                    >
                      {up.status?.toUpperCase() === 'APPROVED' ? (
                        <>
                          <CheckCircle2 size={12} />
                          Approved
                        </>
                      ) : up.status?.toUpperCase() === 'REJECTED' ? (
                        <>
                          <AlertCircle size={12} />
                          Rejected
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
                  <h3 className="text-sm font-bold text-ink truncate mb-2" title={up.name}>
                    {up.name}
                  </h3>
                  <p className="text-xs text-ink-muted mb-3">
                    Uploaded by <span className="font-semibold text-ink">{up.uploader}</span>
                  </p>
                  
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-xs font-semibold text-ink-muted">File Name</span>
                      <span className="text-xs font-bold text-ink truncate max-w-[200px]" title={up.name}>
                        {up.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-xs font-semibold text-ink-muted">Category</span>
                      <Badge tone="primary" className="text-xs">
                        {up.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-xs font-semibold text-ink-muted">Size</span>
                      <span className="text-xs font-semibold text-ink">{up.size}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-xs font-semibold text-ink-muted">Status</span>
                      <span className="text-xs font-bold text-ink uppercase">{up.status}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-xs font-semibold text-ink-muted">Description</span>
                      <span className="text-xs font-semibold text-ink truncate max-w-[200px]" title={up.description}>
                        {up.description || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approve/Reject Actions Row */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Download Asset"
                      className="h-8 w-8 p-0 flex items-center justify-center hover:bg-canvas rounded-control"
                      onClick={() => handleDownload(up)}
                    >
                      <Download size={14} className="text-ink-muted" />
                    </Button>
                  </div>

                  <div className="flex gap-2 items-center">
                    {up.status?.toUpperCase() === 'REJECTED' ? (
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
                    ) : up.status?.toUpperCase() === 'APPROVED' ? (
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
      {!isLoading && !error && filteredUploads.length > 0 && (
        <footer className="mt-8 flex items-center justify-between py-4 border-t border-border">
          <p className="text-xs text-ink-muted">Showing {paginatedUploads.length} of {filteredUploads.length} uploads</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}
