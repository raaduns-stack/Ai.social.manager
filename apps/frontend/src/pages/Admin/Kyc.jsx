/**
 * Kyc.jsx
 * ---------------------------------------------------------------------------
 * Admin dashboard page for reviewing KYC business verification requests.
 * Allows listing, viewing full details, downloading documents, approving,
 * and rejecting with a custom reason.
 * ---------------------------------------------------------------------------
 */
import { useState, useEffect } from 'react'
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  AlertCircle,
  FileText,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import DataTable from '../../components/ui/DataTable'
import ErrorBanner from '../../components/error-banner'
import {
  adminGetAllKyc,
  adminGetKyc,
  adminReviewKyc,
  adminKycDocumentUrl,
  adminDownloadKycDocument,
} from '../../features/kyc/kyc-api'

export default function AdminKyc() {
  const [kycs, setKycs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Selected KYC for the detail drawer/view
  const [selectedKyc, setSelectedKyc] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Review action modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState('approved') // 'approved' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  // Document preview and download states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewDocType, setPreviewDocType] = useState('')
  const [loadingDoc, setLoadingDoc] = useState(null) // null or { type: 'view' | 'download', docType: string }

  const handleViewDocument = async (docType, label) => {
    if (!selectedKyc) return
    setLoadingDoc({ type: 'view', docType })
    try {
      const blob = await adminDownloadKycDocument(selectedKyc.id, docType)
      const url = window.URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPreviewType(blob.type)
      setPreviewTitle(label)
      setPreviewDocType(docType)
      setIsPreviewOpen(true)
    } catch (err) {
      console.error('Failed to preview document', err)
      alert(err.message || 'Failed to preview document.')
    } finally {
      setLoadingDoc(null)
    }
  }

  const handleDownloadDocument = async (docType) => {
    if (!selectedKyc) return
    setLoadingDoc({ type: 'download', docType })
    try {
      const blob = await adminDownloadKycDocument(selectedKyc.id, docType)
      const url = window.URL.createObjectURL(blob)

      // Determine file extension
      let ext = '.bin'
      if (blob.type === 'application/pdf') ext = '.pdf'
      else if (blob.type === 'image/png') ext = '.png'
      else if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') ext = '.jpg'

      const filename = `${selectedKyc.businessName.replace(/[^a-z0-9]/gi, '_')}_${docType}${ext}`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download document', err)
      alert(err.message || 'Failed to download document.')
    } finally {
      setLoadingDoc(null)
    }
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    setPreviewType('')
    setPreviewTitle('')
    setPreviewDocType('')
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const loadKycs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminGetAllKyc()
      setKycs(data)
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKycs()
  }, [])

  const handleOpenDetail = async (kycId) => {
    setDetailLoading(true)
    setError(null)
    try {
      const record = await adminGetKyc(kycId)
      setSelectedKyc(record)
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!selectedKyc) return

    if ((reviewAction === 'rejected' || reviewAction === 'resubmission_required') && !rejectionReason.trim()) {
      setReviewError(new Error('Please provide a reason explaining the issue.'))
      return
    }

    setSubmittingReview(true)
    setReviewError(null)
    try {
      const updated = await adminReviewKyc(selectedKyc.id, {
        status: reviewAction,
        rejectionReason: reviewAction === 'rejected' ? rejectionReason : undefined,
      })
      setSelectedKyc(updated)
      setIsReviewOpen(false)
      setRejectionReason('')
      // Refresh list
      loadKycs()
    } catch (err) {
      console.error(err)
      setReviewError(err)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Define columns for the DataTable
  const columns = [
    {
      key: 'businessName',
      label: 'Business Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-ink">{row.businessName}</span>
          {row.registrationNumber && (
            <span className="block text-xs text-ink-muted">Reg: {row.registrationNumber}</span>
          )}
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div>
          <span className="block font-medium text-ink">{row.user?.fullName || 'Unknown'}</span>
          <span className="block text-xs text-ink-muted">{row.user?.email || ''}</span>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      label: 'Submission Date',
      render: (row) => (
        <span className="text-sm text-ink-muted">
          {new Date(row.submittedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        if (row.status === 'approved') {
          return (
            <Badge variant="success" className="inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Approved
            </Badge>
          )
        }
        if (row.status === 'rejected') {
          return (
            <Badge variant="danger" className="inline-flex items-center gap-1">
              <XCircle size={12} /> Rejected
            </Badge>
          )
        }
        if (row.status === 'resubmission_required') {
          return (
            <Badge variant="warning" className="inline-flex items-center gap-1">
              <AlertCircle size={12} /> Resubmission Required
            </Badge>
          )
        }
        return (
          <Badge variant="warning" className="inline-flex items-center gap-1">
            <Clock size={12} /> Pending
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenDetail(row.id)}
          className="inline-flex items-center gap-1.5"
        >
          <Eye size={14} /> Review
        </Button>
      ),
    },
  ]

  if (loading && kycs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Verifications (KYC)"
        description="Review business verification requests from users before they can connect social channels."
      />

      {error && <ErrorBanner error={error} />}

      {selectedKyc ? (
        // Detailed View / Back button
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedKyc(null)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft size={16} /> Back to KYC List
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-muted">Current Status:</span>
              {selectedKyc.status === 'approved' && (
                <Badge variant="success" className="inline-flex items-center gap-1">
                  <CheckCircle2 size={12} /> Approved
                </Badge>
              )}
              {selectedKyc.status === 'rejected' && (
                <Badge variant="danger" className="inline-flex items-center gap-1">
                  <XCircle size={12} /> Rejected
                </Badge>
              )}
              {selectedKyc.status === 'resubmission_required' && (
                <Badge variant="warning" className="inline-flex items-center gap-1">
                  <AlertCircle size={12} /> Resubmission Required
                </Badge>
              )}
              {selectedKyc.status === 'pending' && (
                <Badge variant="warning" className="inline-flex items-center gap-1">
                  <Clock size={12} /> Pending
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Business Information Card */}
            <Card className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-base font-bold text-ink mb-4 border-b border-border pb-2">
                  Business Information
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Business Name</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">{selectedKyc.businessName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Registration Number</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">
                      {selectedKyc.registrationNumber || <span className="text-ink-muted italic">N/A</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Business Type</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">{selectedKyc.businessType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Country</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">{selectedKyc.country}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Official Email</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">{selectedKyc.businessEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Phone Number</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">{selectedKyc.businessPhone}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Business Address</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">{selectedKyc.businessAddress}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Business Description</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5 whitespace-pre-wrap leading-relaxed">
                      {selectedKyc.businessDescription}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-base font-bold text-ink mb-4 border-b border-border pb-2">
                  User Details
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase">Full Name</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">{selectedKyc.user?.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase">User Email</dt>
                    <dd className="text-sm font-medium text-ink mt-0.5">{selectedKyc.user?.email}</dd>
                  </div>
                </dl>
              </div>

              {(selectedKyc.status === 'rejected' || selectedKyc.status === 'resubmission_required') && selectedKyc.rejectionReason && (
                <div className="p-4 rounded-control bg-red-50 border border-red-200">
                  <span className="text-xs font-bold text-danger uppercase">
                    {selectedKyc.status === 'rejected' ? 'Rejection Reason' : 'Resubmission Instructions'}
                  </span>
                  <p className="text-sm text-ink-muted mt-1 leading-relaxed">{selectedKyc.rejectionReason}</p>
                </div>
              )}
            </Card>

            {/* Documents & Review Actions Card */}
            <div className="space-y-6">
              {/* Documents Card */}
              <Card>
                <h3 className="text-base font-bold text-ink mb-4 border-b border-border pb-2">
                  Verification Documents
                </h3>
                <div className="space-y-4">
                  {/* Certificate of Registration */}
                  <div className="flex items-center justify-between p-3 rounded-control border border-border bg-canvas">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-ink block truncate">Registration Cert</span>
                        <span className="text-[10px] text-ink-muted block">Cert. of Incorporation</span>
                      </div>
                    </div>
                    {selectedKyc.certOfRegistrationPath ? (
                      <div className="flex items-center gap-1 shrink-0">
                        {loadingDoc?.docType === 'cert' && (
                          <Loader2 size={14} className="animate-spin text-ink-muted mr-1" />
                        )}
                        <button
                          onClick={() => handleViewDocument('cert', 'Certificate of Registration')}
                          disabled={loadingDoc !== null}
                          className="p-1.5 rounded-control text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                          title="View Certificate"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument('cert')}
                          disabled={loadingDoc !== null}
                          className="p-1.5 rounded-control text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                          title="Download Certificate"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted italic">Not uploaded</span>
                    )}
                  </div>

                  {/* Utility Bill */}
                  <div className="flex items-center justify-between p-3 rounded-control border border-border bg-canvas">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-ink block truncate">Proof of Address</span>
                        <span className="text-[10px] text-ink-muted block">Utility Bill / Lease</span>
                      </div>
                    </div>
                    {selectedKyc.utilityBillPath ? (
                      <div className="flex items-center gap-1 shrink-0">
                        {loadingDoc?.docType === 'utility' && (
                          <Loader2 size={14} className="animate-spin text-ink-muted mr-1" />
                        )}
                        <button
                          onClick={() => handleViewDocument('utility', 'Proof of Address / Utility Bill')}
                          disabled={loadingDoc !== null}
                          className="p-1.5 rounded-control text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                          title="View Utility Bill"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument('utility')}
                          disabled={loadingDoc !== null}
                          className="p-1.5 rounded-control text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                          title="Download Utility Bill"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted italic">Not uploaded</span>
                    )}
                  </div>

                  {/* Owner ID */}
                  <div className="flex items-center justify-between p-3 rounded-control border border-border bg-canvas">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-ink block truncate">Owner/Rep ID</span>
                        <span className="text-[10px] text-ink-muted block">Govt ID / Passport</span>
                      </div>
                    </div>
                    {selectedKyc.ownerIdPath ? (
                      <div className="flex items-center gap-1 shrink-0">
                        {loadingDoc?.docType === 'ownerId' && (
                          <Loader2 size={14} className="animate-spin text-ink-muted mr-1" />
                        )}
                        <button
                          onClick={() => handleViewDocument('ownerId', 'Government-issued ID')}
                          disabled={loadingDoc !== null}
                          className="p-1.5 rounded-control text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                          title="View ID"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument('ownerId')}
                          disabled={loadingDoc !== null}
                          className="p-1.5 rounded-control text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                          title="Download ID"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted italic">Not uploaded</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Actions Card */}
              <Card className="space-y-4">
                <h3 className="text-base font-bold text-ink pb-2 border-b border-border">
                  Verification Decision
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Carefully review the business details and verify the uploaded documents match before
                  making a decision.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setReviewAction('approved')
                      setIsReviewOpen(true)
                    }}
                    className="w-full inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Approve Verification
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setReviewAction('resubmission_required')
                      setIsReviewOpen(true)
                    }}
                    className="w-full inline-flex items-center justify-center gap-2"
                  >
                    <Clock size={16} /> Request Resubmission
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setReviewAction('rejected')
                      setIsReviewOpen(true)
                    }}
                    className="w-full text-danger border-danger-200 hover:bg-red-50 inline-flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} /> Reject Verification
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        // List View (Default)
        <Card className="p-0">
          <DataTable
            columns={columns}
            data={kycs}
            searchKeys={['businessName', 'country', 'businessEmail']}
            pageSize={10}
            emptyMessage="No KYC submissions found."
          />
        </Card>
      )}

      {/* Decision Dialog Modal */}
      <Modal
        open={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false)
          setRejectionReason('')
          setReviewError(null)
        }}
        title={reviewAction === 'approved' ? 'Approve Verification' : reviewAction === 'rejected' ? 'Reject Verification' : 'Request Resubmission'}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          {reviewError && (
            <div className="flex items-center gap-2 text-sm text-danger bg-red-50 border border-red-200 rounded-control px-4 py-2">
              <AlertCircle size={16} />
              <span>{reviewError.message || 'Action failed.'}</span>
            </div>
          )}

          {reviewAction === 'approved' ? (
            <p className="text-sm text-ink-muted leading-relaxed">
              Are you sure you want to <strong>APPROVE</strong> this business verification request? This will
              immediately lift the overlay and allow the user to connect their social accounts.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-ink-muted leading-relaxed">
                {reviewAction === 'rejected'
                  ? 'Provide a reason for rejecting this business verification. This will block their onboarding permanently unless they resubmit.'
                  : 'Provide instructions on what information or documents are missing or incorrect for the customer to fix.'
                }
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink uppercase">
                  {reviewAction === 'rejected' ? 'Rejection Reason' : 'Resubmission Feedback'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={reviewAction === 'rejected'
                    ? "e.g. The utility bill uploaded does not match the company name. Please upload a matching proof of address."
                    : "e.g. Certificate of registration is blurry. Please upload a clearer copy."
                  }
                  className="w-full text-sm text-ink p-3 rounded-control border border-border bg-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsReviewOpen(false)
                setRejectionReason('')
                setReviewError(null)
              }}
              disabled={submittingReview}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submittingReview}
              className={reviewAction === 'rejected' ? 'bg-danger hover:bg-red-700 text-white' : ''}
            >
              {submittingReview ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={16} className="animate-spin" /> Processing…
                </span>
              ) : reviewAction === 'approved' ? (
                'Approve'
              ) : reviewAction === 'rejected' ? (
                'Reject Submission'
              ) : (
                'Request Resubmission'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        open={isPreviewOpen}
        onClose={handleClosePreview}
        title={`Document Preview: ${previewTitle}`}
        className="max-w-4xl"
      >
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="border border-border rounded-control overflow-hidden bg-canvas flex items-center justify-center min-h-[300px]">
            {previewType === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                title={previewTitle}
                className="w-full h-[60vh] border-0"
              />
            ) : previewType?.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={previewTitle}
                className="max-w-full max-h-[60vh] object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <AlertCircle className="mx-auto text-[#9CA3AF] mb-2 animate-bounce" size={32} />
                <p className="text-sm text-ink font-medium">Unable to preview this document format directly.</p>
                <p className="text-xs text-ink-muted mt-1">Please download it to view.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-ink-muted">
              Securely retrieved · {selectedKyc?.businessName}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => handleDownloadDocument(previewDocType)}
                className="inline-flex items-center gap-1.5"
                disabled={loadingDoc !== null}
              >
                <Download size={14} /> Download Document
              </Button>
              <Button variant="primary" onClick={handleClosePreview}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
