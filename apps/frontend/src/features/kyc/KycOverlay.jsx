/**
 * KycOverlay.jsx
 * ---------------------------------------------------------------------------
 * Renders on top of the Channels page when the user's KYC is not APPROVED.
 *
 * States handled:
 *   1. none      — no KYC record yet → show the multi-section form
 *   2. pending   — submitted, under review → show waiting message
 *   3. rejected  — show rejection reason + allow re-submission (same form
 *                  with a rejection notice at the top)
 *   4. approved  — overlay is NOT rendered (parent decides this)
 *
 * The overlay sits in a fixed full-screen container with a semi-transparent
 * backdrop (same pattern as the existing Modal.jsx) so the Channels page
 * underneath is visible but faded/disabled.
 *
 * Document uploads use HTML <input type="file"> (same approach as Uploads.jsx)
 * and are sent via FormData just like the existing upload feature.
 * ---------------------------------------------------------------------------
 */
import { useState, useRef } from 'react'
import {
  Shield,
  Building2,
  FileCheck2,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { submitKyc } from './kyc-api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Human-readable labels for the file input slots */
const DOC_LABELS = {
  certOfRegistration: 'Certificate of Registration / Incorporation',
  utilityBill: 'Utility Bill / Proof of Business Address',
  ownerId: 'Government-issued ID of Owner / Representative',
}

/** Accepted MIME types for KYC documents */
const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png'

// ---------------------------------------------------------------------------
// FileInput — a styled file picker with name preview
// ---------------------------------------------------------------------------
function FileInput({ label, name, onChange, required, file }) {
  const inputRef = useRef(null)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <div
        className="flex items-center gap-3 h-10 px-3 rounded-control border border-border bg-surface cursor-pointer hover:border-primary-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={16} className="text-ink-muted shrink-0" />
        <span className="text-sm truncate text-ink-muted">
          {file ? file.name : 'Click to select file (PDF, JPG, PNG)'}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PendingState — shown after submission or while status = 'pending'
// ---------------------------------------------------------------------------
function PendingState() {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4 gap-4">
      <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
        <Clock size={32} className="text-primary-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-ink mb-2">Verification Under Review</h3>
        <p className="text-sm text-ink-muted leading-relaxed max-w-sm">
          Your business verification has been submitted successfully. Your information is currently
          under review. You will be able to connect your social channels once your verification is
          approved.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-muted bg-canvas border border-border rounded-control px-4 py-2">
        <Clock size={14} className="text-warning" />
        <span>Average review time: 1–2 business days</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FeedbackBanner — shown at the top of the form when re-submitting
// ---------------------------------------------------------------------------
function FeedbackBanner({ status, reason }) {
  const isRejected = status === 'rejected'
  return (
    <div className={`flex gap-3 p-4 rounded-control ${isRejected ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} border mb-4`}>
      {isRejected ? (
        <XCircle size={20} className="text-danger shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
      )}
      <div>
        <p className={`text-sm font-semibold ${isRejected ? 'text-danger' : 'text-warning'}`}>
          {isRejected ? 'Verification Rejected' : 'Resubmission Required'}
        </p>
        {reason && (
          <p className="text-sm text-ink-muted mt-1 leading-relaxed">{reason}</p>
        )}
        <p className="text-xs text-ink-muted mt-2">
          Please correct the information below and resubmit.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KYC Form — sections 1 (business info) + 2 (documents)
// ---------------------------------------------------------------------------
function KycForm({ existingData, onSubmitted }) {
  const isRejected = existingData?.status === 'rejected'
  const isResubmitReq = existingData?.status === 'resubmission_required'
  const needsResubmit = isRejected || isResubmitReq

  // ----- Section 1 — Business Information -----
  const [businessName, setBusinessName] = useState(existingData?.businessName ?? '')
  const [registrationNumber, setRegistrationNumber] = useState(existingData?.registrationNumber ?? '')
  const [businessType, setBusinessType] = useState(existingData?.businessType ?? '')
  const [businessAddress, setBusinessAddress] = useState(existingData?.businessAddress ?? '')
  const [country, setCountry] = useState(existingData?.country ?? '')
  const [businessEmail, setBusinessEmail] = useState(existingData?.businessEmail ?? '')
  const [businessPhone, setBusinessPhone] = useState(existingData?.businessPhone ?? '')
  const [businessDescription, setBusinessDescription] = useState(existingData?.businessDescription ?? '')

  // ----- Section 2 — Documents -----
  const [certFile, setCertFile] = useState(null)
  const [utilityFile, setUtilityFile] = useState(null)
  const [ownerIdFile, setOwnerIdFile] = useState(null)

  // ----- Submission state -----
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // For first submission, all three documents are required.
    // For re-submissions, docs are optional if previously uploaded.
    const isFirstSubmission = !existingData
    if (isFirstSubmission) {
      if (!certFile || !utilityFile || !ownerIdFile) {
        setError('Please upload all three required documents.')
        return
      }
    }

    setSubmitting(true)
    try {
      await submitKyc({
        businessName,
        registrationNumber: registrationNumber || undefined,
        businessType,
        businessAddress,
        country,
        businessEmail,
        businessPhone,
        businessDescription,
        certOfRegistration: certFile,
        utilityBill: utilityFile,
        ownerId: ownerIdFile,
      })
      onSubmitted()
    } catch (err) {
      setError(err?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rejection / Resubmission notice */}
      {needsResubmit && (
        <FeedbackBanner status={existingData?.status} reason={existingData?.rejectionReason} />
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-danger bg-red-50 border border-red-200 rounded-control px-4 py-2.5">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---- Section 1: Business Information ---- */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-primary-600" />
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
            Section 1 — Business Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Business / Company Name"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Limited"
            />
          </div>

          <Input
            label="Business Registration Number"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="RC12345678 (optional)"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">
              Business Type <span className="text-danger">*</span>
            </label>
            <select
              required
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select type…</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="Partnership">Partnership</option>
              <option value="Limited Liability Company">Limited Liability Company (LLC)</option>
              <option value="Private Limited Company">Private Limited Company</option>
              <option value="Public Limited Company">Public Limited Company</option>
              <option value="Non-Governmental Organisation">Non-Governmental Organisation (NGO)</option>
              <option value="Cooperative">Cooperative</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Business Address"
              required
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="12 Commerce Street, Lagos Island"
            />
          </div>

          <Input
            label="Country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Nigeria"
          />

          <Input
            label="Business Email"
            type="email"
            required
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            placeholder="info@acme.com"
          />

          <Input
            label="Business Phone Number"
            type="tel"
            required
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            placeholder="+2348012345678"
          />

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">
              Business Description <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Brief description of what your business does…"
              className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* ---- Section 2: Verification Documents ---- */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileCheck2 size={18} className="text-primary-600" />
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
            Section 2 — Verification Documents
          </h3>
        </div>
        <p className="text-xs text-ink-muted mb-4 ml-6">
          Accepted formats: PDF, JPG, JPEG, PNG · Max 10 MB each
          {existingData && ' · You only need to re-upload documents that have changed.'}
        </p>

        <div className="space-y-4">
          <FileInput
            label={DOC_LABELS.certOfRegistration}
            name="certOfRegistration"
            onChange={setCertFile}
            required={!existingData}
            file={certFile}
          />
          <FileInput
            label={DOC_LABELS.utilityBill}
            name="utilityBill"
            onChange={setUtilityFile}
            required={!existingData}
            file={utilityFile}
          />
          <FileInput
            label={DOC_LABELS.ownerId}
            name="ownerId"
            onChange={setOwnerIdFile}
            required={!existingData}
            file={ownerIdFile}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" disabled={submitting} className="min-w-[160px]">
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Submitting…
            </span>
          ) : needsResubmit ? (
            'Resubmit Verification'
          ) : (
            'Submit Verification'
          )}
        </Button>
      </div>
    </form>


  )
}

// ---------------------------------------------------------------------------
// KycOverlay — main export
// ---------------------------------------------------------------------------
/**
 * @param {object|null} kycRecord  The user's current KYC record from the API (or null)
 * @param {function}    onRefresh  Called after a successful submission so the parent
 *                                 can re-fetch the KYC record and re-render.
 */
export default function KycOverlay({ kycRecord, onRefresh, onClose }) {
  const [submitted, setSubmitted] = useState(false)

  const status = kycRecord?.status ?? null

  // Show post-submission pending state immediately after the user clicks Submit
  const showPending = status === 'pending' || submitted

  return (
    // Fixed overlay: covers the full viewport, sits above the Channels page
    <div className="fixed inset-0 z-40 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      {/*
        Semi-transparent backdrop — Channels page content is visible behind it
        but the user cannot interact with it (pointer-events on the backdrop
        itself are none; the panel above absorbs all clicks).
      */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* KYC Panel */}
      <Card
        className="relative w-full max-w-2xl rounded-card bg-surface shadow-hover border border-border p-0 overflow-hidden mb-8"
        role="dialog"
        aria-modal="true"
        aria-label="Business Verification Required"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-canvas relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Business Verification Required</h2>
              <p className="text-xs text-ink-muted">
                Complete your KYC to unlock social channel connections
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink transition-colors p-1.5 rounded-full hover:bg-border"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Panel body */}
        <div className="px-6 py-6">
          {showPending ? (
            <PendingState />
          ) : (
            <KycForm
              existingData={kycRecord}
              onSubmitted={() => {
                setSubmitted(true)
                onRefresh()
              }}
            />
          )}
        </div>

        {/* Footer notice */}
        {!showPending && (
          <div className="px-6 py-3 bg-canvas border-t border-border flex items-center gap-2">
            <Shield size={14} className="text-ink-muted shrink-0" />
            <p className="text-xs text-ink-muted leading-relaxed">
              Your information is encrypted and stored securely. We only use it for identity
              verification purposes and will never share it without your consent.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
