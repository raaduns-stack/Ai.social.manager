import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Globe,
  FileText,
  ShieldCheck,
  CreditCard,
  User,
  ShieldAlert,
  Edit,
  Trash2,
  Calendar,
  Download,
  Eye,
  Loader2,
  UserCheck,
  Upload,
  Sparkles,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import SearchableSelect from '../../components/ui/SearchableSelect'
import ErrorBanner from '../../components/error-banner'
import { COUNTRIES } from '../../utils/countries'
import {
  getAdminUserDetail,
  updateAdminUser,
  suspendUser,
  deleteUser,
  assignAccountManager,
  getStaffManagers,
  uploadUserProfileImage,
} from '../../features/admin/admin-api'
import {
  adminReviewKyc,
  adminDownloadKycDocument,
  adminRejectKycDocument,
} from '../../features/kyc/kyc-api'
import AISettingsModal from '../../components/ai/AISettingsModal'

const PLAN_PRICES = {
  'Free': '₦0/month',
  'Starter': '₦30,000/month',
  'Growth': '₦100,000/month',
  'Brand Domination': '₦150,000/month'
}

export default function UserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false)
  const [userPlatforms, setUserPlatforms] = useState([
    {
      key: 'linkedin',
      label: 'LinkedIn',
      globalPrompt: `Generate professional LinkedIn content.
Always use a business tone.
Maximum 250 words.
Include CTA.`,
      customerPrompt: 'Always mention our premium products. Use British English.',
    },
    {
      key: 'twitter',
      label: 'X/Twitter',
      globalPrompt: `Generate engaging tweets/X posts.
Keep it concise and punchy.
Maximum 280 characters.
Use 1-2 relevant hashtags.`,
      customerPrompt: 'Focus on technology innovation. Use a bold, active voice.',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      globalPrompt: `Generate friendly and social Facebook posts.
Encourage user engagement or comments.
Keep tone conversational.
Include a link description.`,
      customerPrompt: 'Promote local community involvement and family values.',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      globalPrompt: `Generate catchy captions for Instagram posts.
Start with a strong hook line.
Maximum 150 words.
Include a clean list of hashtags at the end.`,
      customerPrompt: 'Highlight aesthetic values, use friendly emojis, write in lower case.',
    },
  ])

  const handleSaveAISettings = (updatedPlatforms) => {
    setUserPlatforms(updatedPlatforms)
    console.log('Saved AI settings for user:', updatedPlatforms)
  }

  const [data, setData] = useState(null)
  const [staffManagers, setStaffManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAssignManagerOpen, setIsAssignManagerOpen] = useState(false)
  const [isReviewKycOpen, setIsReviewKycOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [reviewAction, setReviewAction] = useState('approved')
  const [rejectionReason, setRejectionReason] = useState('')

  const [editForm, setEditForm] = useState({
    fullName: '',
    businessName: '',
    phoneNumber: '',
    country: '',
    accountManagerId: '',
  })

  const [selectedManagerId, setSelectedManagerId] = useState('')
  const [loadingDoc, setLoadingDoc] = useState(null)

  const loadUserDetail = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [res, managers] = await Promise.all([
        getAdminUserDetail(userId),
        getStaffManagers(),
      ])
      setData(res)
      setStaffManagers(managers)
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserDetail()
  }, [userId])

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateAdminUser(userId, {
        fullName: editForm.fullName,
        businessName: editForm.businessName,
        phoneNumber: editForm.phoneNumber,
        country: editForm.country,
        accountManagerId: editForm.accountManagerId || undefined,
      })
      setIsEditModalOpen(false)
      loadUserDetail()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to update user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuspendConfirm = async () => {
    if (!data) return
    setSubmitting(true)
    const isSuspended = data.accountInfo.accountStatus === 'SUSPENDED'
    try {
      await suspendUser(userId, !isSuspended)
      setIsSuspendModalOpen(false)
      loadUserDetail()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to update user status.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setSubmitting(true)
    try {
      await deleteUser(userId)
      setIsDeleteModalOpen(false)
      alert('User profile soft-deleted successfully.')
      navigate('/admin/users')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to delete user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignManagerSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await assignAccountManager(userId, selectedManagerId || null)
      setIsAssignManagerOpen(false)
      loadUserDetail()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to assign account manager.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKycReviewSubmit = async (e) => {
    e.preventDefault()
    if (!data?.kyc?.id) return
    setSubmitting(true)
    try {
      await adminReviewKyc(data.kyc.id, {
        status: reviewAction,
        rejectionReason: reviewAction === 'rejected' ? rejectionReason : undefined,
      })
      setIsReviewKycOpen(false)
      setRejectionReason('')
      loadUserDetail()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to review KYC.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadDocument = async (docType, label) => {
    if (!data?.kyc?.id) return
    setLoadingDoc(docType)
    try {
      const blob = await adminDownloadKycDocument(data.kyc.id, docType)
      const url = window.URL.createObjectURL(blob)
      let ext = '.bin'
      if (blob.type === 'application/pdf') ext = '.pdf'
      else if (blob.type === 'image/png') ext = '.png'
      else if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') ext = '.jpg'

      const a = document.createElement('a')
      a.href = url
      a.download = `${data.accountInfo.fullName.replace(/\s+/g, '_')}_${docType}${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed', err)
      alert(err.message || 'Failed to download document.')
    } finally {
      setLoadingDoc(null)
    }
  }

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadUserProfileImage(userId, file)
      loadUserDetail()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to upload profile image.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-4 flex-col">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <p className="text-sm text-on-surface-variant">Loading user profile and details...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <ErrorBanner error={error || new Error('User not found')} />
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          Back to Users
        </Button>
      </div>
    )
  }

  const { accountInfo, businessInfo, kyc, subscription, accountManager, activities } = data

  const apiBase = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '')
  const avatarUrl = accountInfo.profileImage
    ? (accountInfo.profileImage.startsWith('http') ? accountInfo.profileImage : `${apiBase}/uploads/${accountInfo.profileImage}`)
    : null

  const tabs = [
    { id: 'profile', label: 'Account Profile' },
    { id: 'business', label: 'Business Information' },
    { id: 'kyc', label: 'KYC Verification' },
    { id: 'accounts', label: 'Social Accounts' },
    { id: 'subscription', label: 'Subscription & Billing' },
    { id: 'manager', label: 'Account Manager' },
    { id: 'activity', label: 'Activity Logs' },
    { id: 'tickets', label: 'Support Tickets' },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/users"
          className="w-10 h-10 flex items-center justify-center rounded-control border border-border bg-surface hover:bg-canvas text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <nav className="flex items-center gap-2 text-sm text-ink-muted">
          <Link to="/admin/users" className="hover:text-primary transition-colors font-medium">
            User Management
          </Link>
          <ChevronRight size={14} className="text-ink-muted/50" />
          <span className="text-ink font-semibold">{accountInfo.fullName}</span>
        </nav>
      </div>

      {/* Header Profile Summary */}
      <Card className="p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={accountInfo.fullName}
                className="w-28 h-28 rounded-full object-cover border-4 border-surface ring-1 ring-border shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-bold text-2xl flex items-center justify-center shrink-0 border-4 border-surface ring-1 ring-border">
                {accountInfo.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-2 bg-primary text-on-primary rounded-full cursor-pointer shadow-md hover:scale-105 transition-transform">
              <Upload size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
            </label>
          </div>

          <div className="text-center md:text-left space-y-1">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h2 className="text-2xl font-bold text-ink">{accountInfo.fullName}</h2>
              <Badge
                tone={accountInfo.accountStatus === 'ACTIVE' ? 'success' : accountInfo.accountStatus === 'SUSPENDED' ? 'danger' : 'warning'}
                className="gap-1 font-semibold uppercase tracking-wider text-[10px]"
              >
                {accountInfo.accountStatus}
              </Badge>
            </div>

            <p className="text-sm font-semibold text-primary">{businessInfo.businessName}</p>

            <div className="space-y-1 pt-1 text-sm text-ink-muted">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail size={14} className="opacity-70" />
                <span>{accountInfo.email}</span>
                {accountInfo.isEmailVerified ? (
                  <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Verified</span>
                ) : (
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Pending Email</span>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone size={14} className="opacity-70" />
                <span>{accountInfo.phoneNumber}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            as={Link}
            to={`/admin/users/${userId}/calendar`}
            variant="outline"
            className="text-xs h-9 px-4 font-semibold text-primary border-primary/20 hover:bg-primary-50 gap-1.5 flex items-center"
          >
            <Calendar size={14} />
            <span>Content Calendar</span>
          </Button>
          <Button
            variant="outline"
            className="text-xs h-9 px-4 font-semibold text-primary border-primary/20 hover:bg-primary-50 gap-1.5 flex items-center"
            onClick={() => setIsAISettingsOpen(true)}
          >
            <Sparkles size={14} />
            <span>AI Content Settings</span>
          </Button>

          <Button
            variant="outline"
            className="text-xs h-9 px-4 font-semibold"
            onClick={() => {
              setEditForm({
                fullName: accountInfo.fullName,
                businessName: businessInfo.businessName !== '—' ? businessInfo.businessName : '',
                phoneNumber: accountInfo.phoneNumber !== '—' ? accountInfo.phoneNumber : '',
                country: accountInfo.country !== '—' ? accountInfo.country : '',
                accountManagerId: accountManager?.id || '',
              })
              setIsEditModalOpen(true)
            }}
          >
            <Edit size={14} className="mr-1.5" /> Edit
          </Button>

          <Button
            variant="outline"
            className="text-xs h-9 px-4 font-semibold"
            onClick={() => setIsSuspendModalOpen(true)}
          >
            {accountInfo.accountStatus === 'SUSPENDED' ? 'Re-activate' : 'Suspend'}
          </Button>

          <Button
            variant="destructive"
            className="text-xs h-9 px-4 font-semibold"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 size={14} className="mr-1.5" /> Delete
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex items-center gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* ACCOUNT PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-2">
                Account Summary
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-ink-muted">Account Status</dt>
                  <dd className="font-bold text-ink">{accountInfo.accountStatus}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted">Email Verification</dt>
                  <dd className="font-bold text-ink">
                    {accountInfo.isEmailVerified ? 'Verified' : 'Unverified'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted">Role</dt>
                  <dd className="font-bold text-primary">{accountInfo.role}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted">Country</dt>
                  <dd className="font-semibold text-ink">{accountInfo.country}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-2">
                Important Timestamps
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-ink-muted">Registered Date</dt>
                  <dd className="font-semibold text-ink">
                    {new Date(accountInfo.registeredAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted">Email Verified Date</dt>
                  <dd className="font-semibold text-ink">
                    {accountInfo.emailVerifiedAt ? new Date(accountInfo.emailVerifiedAt).toLocaleString() : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted">First Login Date</dt>
                  <dd className="font-semibold text-ink">
                    {accountInfo.firstLoginAt ? new Date(accountInfo.firstLoginAt).toLocaleString() : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted">Last Login Date</dt>
                  <dd className="font-semibold text-ink">
                    {accountInfo.lastLoginAt ? new Date(accountInfo.lastLoginAt).toLocaleString() : '—'}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-border pb-2">
                Assigned Staff & Support
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-medium text-ink-muted block">Account Manager</span>
                  {accountManager ? (
                    <div className="font-bold text-ink mt-1 flex items-center justify-between">
                      <span>{accountManager.name} ({accountManager.email})</span>
                      <Button variant="ghost" size="sm" onClick={() => setIsAssignManagerOpen(true)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-ink-muted italic">Unassigned</span>
                      <Button variant="outline" size="sm" onClick={() => setIsAssignManagerOpen(true)}>
                        Assign Manager
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BUSINESS INFORMATION TAB */}
        {activeTab === 'business' && (
          <Card className="p-6 space-y-6">
            <h3 className="text-base font-bold text-ink border-b border-border pb-3">
              Registration & Business Details
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Business Name</dt>
                <dd className="text-base font-bold text-ink mt-1">{businessInfo.businessName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Business Type</dt>
                <dd className="text-base font-semibold text-ink mt-1">{businessInfo.businessType}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Registration Number</dt>
                <dd className="text-base font-semibold text-ink mt-1">{businessInfo.registrationNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Country</dt>
                <dd className="text-base font-semibold text-ink mt-1">{businessInfo.country}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Business Email</dt>
                <dd className="text-base font-semibold text-ink mt-1">{businessInfo.businessEmail}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Business Phone</dt>
                <dd className="text-base font-semibold text-ink mt-1">{businessInfo.businessPhone}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs font-semibold text-ink-muted uppercase">Business Address</dt>
                <dd className="text-base font-semibold text-ink mt-1">{businessInfo.businessAddress}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs font-semibold text-ink-muted uppercase">Business Description</dt>
                <dd className="text-sm font-medium text-ink mt-1 whitespace-pre-wrap leading-relaxed">
                  {businessInfo.businessDescription}
                </dd>
              </div>
            </dl>
          </Card>
        )}

        {/* KYC VERIFICATION TAB */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-bold text-ink">KYC Verification Record</h3>
                  <p className="text-xs text-ink-muted">Business identity and document verification status.</p>
                </div>
                {kyc ? (
                  <Badge tone={kyc.status === 'approved' ? 'success' : kyc.status === 'rejected' ? 'danger' : 'warning'}>
                    {kyc.kycStatusLabel}
                  </Badge>
                ) : (
                  <Badge tone="neutral">NOT STARTED</Badge>
                )}
              </div>

              {kyc ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-canvas p-4 rounded-control border border-border">
                    <div>
                      <span className="text-xs font-semibold text-ink-muted uppercase block">Submitted At</span>
                      <span className="font-semibold text-ink">{new Date(kyc.submittedAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-ink-muted uppercase block">Reviewed At</span>
                      <span className="font-semibold text-ink">{kyc.reviewedAt ? new Date(kyc.reviewedAt).toLocaleString() : '—'}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-ink-muted uppercase block">Reviewer</span>
                      <span className="font-semibold text-ink">{kyc.reviewedBy || '—'}</span>
                    </div>
                  </div>

                  {kyc.rejectionReason && (
                    <div className="p-4 rounded-control bg-red-50 border border-red-200">
                      <span className="text-xs font-bold text-danger uppercase">Rejection Reason</span>
                      <p className="text-sm text-ink mt-1">{kyc.rejectionReason}</p>
                    </div>
                  )}

                  {/* Documents List */}
                  <div>
                    <h4 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Uploaded Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Certificate */}
                      <div className="p-4 rounded-card border border-border bg-surface space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink uppercase">Registration Cert</span>
                          <Badge tone={kyc.documents.certOfRegistration.status === 'approved' ? 'success' : kyc.documents.certOfRegistration.status === 'rejected' ? 'danger' : 'warning'}>
                            {kyc.documents.certOfRegistration.status || 'PENDING'}
                          </Badge>
                        </div>
                        {kyc.documents.certOfRegistration.path ? (
                          <div className="space-y-2">
                            <p className="text-xs text-ink-muted truncate">
                              Name: {kyc.documents.certOfRegistration.originalName || kyc.documents.certOfRegistration.path}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-1.5 text-xs"
                              disabled={loadingDoc === 'cert'}
                              onClick={() => handleDownloadDocument('cert', 'Certificate of Registration')}
                            >
                              <Download size={14} /> Download File
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-ink-muted italic">No file uploaded</p>
                        )}
                      </div>

                      {/* Utility Bill */}
                      <div className="p-4 rounded-card border border-border bg-surface space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink uppercase">Proof of Address</span>
                          <Badge tone={kyc.documents.utilityBill.status === 'approved' ? 'success' : kyc.documents.utilityBill.status === 'rejected' ? 'danger' : 'warning'}>
                            {kyc.documents.utilityBill.status || 'PENDING'}
                          </Badge>
                        </div>
                        {kyc.documents.utilityBill.path ? (
                          <div className="space-y-2">
                            <p className="text-xs text-ink-muted truncate">
                              Name: {kyc.documents.utilityBill.originalName || kyc.documents.utilityBill.path}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-1.5 text-xs"
                              disabled={loadingDoc === 'utility'}
                              onClick={() => handleDownloadDocument('utility', 'Proof of Address')}
                            >
                              <Download size={14} /> Download File
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-ink-muted italic">No file uploaded</p>
                        )}
                      </div>

                      {/* Owner ID */}
                      <div className="p-4 rounded-card border border-border bg-surface space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink uppercase">Owner / Rep ID</span>
                          <Badge tone={kyc.documents.ownerId.status === 'approved' ? 'success' : kyc.documents.ownerId.status === 'rejected' ? 'danger' : 'warning'}>
                            {kyc.documents.ownerId.status || 'PENDING'}
                          </Badge>
                        </div>
                        {kyc.documents.ownerId.path ? (
                          <div className="space-y-2">
                            <p className="text-xs text-ink-muted truncate">
                              Name: {kyc.documents.ownerId.originalName || kyc.documents.ownerId.path}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-1.5 text-xs"
                              disabled={loadingDoc === 'ownerId'}
                              onClick={() => handleDownloadDocument('ownerId', 'Government ID')}
                            >
                              <Download size={14} /> Download File
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-ink-muted italic">No file uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Decision Actions */}
                  <div className="flex justify-end gap-3 border-t border-border pt-4">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setReviewAction('approved')
                        setIsReviewKycOpen(true)
                      }}
                    >
                      Approve KYC Verification
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setReviewAction('rejected')
                        setIsReviewKycOpen(true)
                      }}
                    >
                      Reject KYC Verification
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-ink-muted">
                  <p className="text-sm font-medium">User has not submitted a KYC verification record yet.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* SUBSCRIPTION & BILLING TAB */}
        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-6 space-y-4">
              <h3 className="text-base font-bold text-ink border-b border-border pb-2">Active Plan</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Plan Name</span>
                  <span className="font-bold text-primary">{subscription.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Price</span>
                  <span className="font-semibold text-ink">{subscription.price ? `₦${subscription.price.toLocaleString()}` : 'Free'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Status</span>
                  <Badge tone={subscription.status === 'active' ? 'success' : 'neutral'}>
                    {subscription.status}
                  </Badge>
                </div>
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Tier</span>
                  <span className="text-sm font-semibold text-primary">{subscription.planName}</span>
                </div>
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Billing Cycle</span>
                  <span className="text-sm font-medium text-ink">
                    {subscription.plan?.interval || 'Monthly'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/55 pb-3">
                  <span className="text-sm text-ink-muted">Renewal Date</span>
                  <span className="text-sm font-medium text-ink">
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 p-6 space-y-4">
              <h3 className="text-base font-bold text-ink border-b border-border pb-2">Payment & Invoice History</h3>
              <div className="overflow-x-auto">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Payments</h4>
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-border text-ink-muted">
                          <th className="py-2 font-semibold text-xs">Date</th>
                          <th className="py-2 font-semibold text-xs">Amount</th>
                          <th className="py-2 font-semibold text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {subscription.payments && subscription.payments.length > 0 ? (
                          subscription.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2.5 text-xs text-ink-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                              <td className="py-2.5 text-xs font-bold text-ink">₦{p.amount?.toLocaleString()}</td>
                              <td className="py-2.5">
                                <Badge tone={p.status === 'successful' ? 'success' : 'neutral'} className="text-[10px]">
                                  {p.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-xs text-ink-muted">
                              No payment records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Invoices</h4>
                    {!subscription.invoices || subscription.invoices.length === 0 ? (
                      <div className="py-6 text-center text-ink-muted text-xs font-medium">
                        No invoice records found.
                      </div>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-border text-ink-muted">
                            <th className="py-2 font-semibold text-xs">Invoice ID</th>
                            <th className="py-2 font-semibold text-xs">Date</th>
                            <th className="py-2 font-semibold text-xs">Amount</th>
                            <th className="py-2 font-semibold text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {subscription.invoices.map((inv) => (
                            <tr key={inv.id}>
                              <td className="py-2.5 text-xs font-medium text-ink">{inv.invoiceNumber}</td>
                              <td className="py-2.5 text-xs text-ink-muted">
                                {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}
                              </td>
                              <td className="py-2.5 text-xs font-semibold text-ink">
                                {inv.currency} {inv.amount?.toLocaleString()}
                              </td>
                              <td className="py-2.5">
                                <Badge tone={inv.status === 'paid' ? 'success' : 'warning'} className="font-semibold text-[10px]">
                                  {inv.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ACCOUNT MANAGER TAB */}
        {activeTab === 'manager' && (
          <Card className="p-6 space-y-6 max-w-xl">
            <h3 className="text-base font-bold text-ink border-b border-border pb-2">Assigned Staff Account Manager</h3>
            {accountManager ? (
              <div className="p-4 bg-canvas border border-border rounded-control space-y-2">
                <p className="text-sm font-bold text-ink">{accountManager.name}</p>
                <p className="text-xs text-ink-muted">Email: {accountManager.email}</p>
                <p className="text-xs text-primary font-semibold">Role: {accountManager.role}</p>
              </div>
            ) : (
              <p className="text-sm text-ink-muted italic">No account manager assigned to this user.</p>
            )}
            <Button variant="primary" onClick={() => setIsAssignManagerOpen(true)}>
              {accountManager ? 'Change Account Manager' : 'Assign Account Manager'}
            </Button>
          </Card>
        )}

        {/* ACTIVITY LOGS TAB */}
        {activeTab === 'activity' && (
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-ink">User Activity Logs</h3>
            </div>
            <div className="divide-y divide-border/50">
              {activities && activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="p-4 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-ink">{act.action}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{act.description}</p>
                    </div>
                    <span className="text-xs text-ink-muted whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-ink-muted">
                  No activity history recorded yet.
                </div>
              )}
            </div>
          </Card>
        )}

        {/* SOCIAL ACCOUNTS TAB */}
        {activeTab === 'accounts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!data.socialAccounts || data.socialAccounts.length === 0 ? (
              <div className="md:col-span-2 text-center text-sm text-ink-muted py-10">No connected social accounts found.</div>
            ) : (
              data.socialAccounts.map((acct) => (
                <Card key={acct.id} className="p-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-control flex items-center justify-center shrink-0 bg-primary-50 text-primary">
                      <Share2 size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink capitalize">{acct.platform}</h4>
                      <p className="text-xs text-ink-muted mt-0.5">{acct.accountHandle}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={acct.status === 'Connected' ? 'success' : 'neutral'} className="font-semibold text-[10px]">
                      {acct.status}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab === 'tickets' && (
          <Card className="overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-semibold text-ink">Support Tickets</h3>
            </div>
            <div className="p-6 text-center text-sm text-ink-muted">No support tickets found for this user.</div>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User Profile">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={editForm.fullName}
            onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
            required
          />
          <Input
            label="Business Name"
            value={editForm.businessName}
            onChange={(e) => setEditForm((p) => ({ ...p, businessName: e.target.value }))}
          />
          <Input
            label="Phone Number"
            value={editForm.phoneNumber}
            onChange={(e) => setEditForm((p) => ({ ...p, phoneNumber: e.target.value }))}
          />
          <SearchableSelect
            label="Country"
            options={COUNTRIES}
            value={editForm.country}
            onChange={(val) => setEditForm((p) => ({ ...p, country: val }))}
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Suspend Confirmation Modal */}
      <Modal open={isSuspendModalOpen} onClose={() => setIsSuspendModalOpen(false)} title={accountInfo.accountStatus === 'SUSPENDED' ? 'Activate Account' : 'Suspend Account'}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <ShieldAlert size={24} className="fill-amber-50" />
            <p className="font-semibold text-sm">Confirm status update</p>
          </div>
          <p className="text-sm text-ink-muted">
            {accountInfo.accountStatus === 'SUSPENDED'
              ? `Restore account access for ${accountInfo.fullName}?`
              : `Suspend account access for ${accountInfo.fullName}? Suspended users cannot log in.`}
          </p>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSuspendConfirm} disabled={submitting}>
              {submitting ? 'Updating...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete User Account">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-danger">
            <ShieldAlert size={24} className="fill-red-50" />
            <p className="font-semibold text-sm">Soft-delete user account</p>
          </div>
          <p className="text-sm text-ink-muted">
            Are you sure you want to soft-delete the profile for <strong className="text-ink">{accountInfo.fullName}</strong>?
          </p>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Manager Modal */}
      <Modal open={isAssignManagerOpen} onClose={() => setIsAssignManagerOpen(false)} title="Assign Account Manager">
        <form onSubmit={handleAssignManagerSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Select Staff Account Manager</label>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none"
            >
              <option value="">-- Remove Manager (Unassign) --</option>
              {staffManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email}) — {m.role}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAssignManagerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* KYC Review Modal */}
      <Modal open={isReviewKycOpen} onClose={() => setIsReviewKycOpen(false)} title="Review KYC Verification">
        <form onSubmit={handleKycReviewSubmit} className="space-y-4">
          <p className="text-sm text-ink-muted">
            Selected Action: <strong className="text-ink uppercase">{reviewAction}</strong>
          </p>
          {reviewAction === 'rejected' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">
                Rejection Reason <span className="font-normal text-ink-muted text-xs">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this KYC is rejected..."
                className="rounded-control border border-border p-2 text-sm text-ink"
              />
            </div>
          )}
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsReviewKycOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Decision'}
            </Button>
          </div>
        </form>
      </Modal>

      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        customerName={accountInfo.fullName}
        platforms={userPlatforms}
        onSave={handleSaveAISettings}
      />
    </div>
  )
}
