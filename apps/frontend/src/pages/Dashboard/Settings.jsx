import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Info, ShieldCheck } from 'lucide-react'
import BrandVoiceForm from '../../components/BrandVoiceForm'
import { getCompanyInfo, updateCompanyInfo } from '../../features/settings/settings-api'
import { changePassword } from '../../features/auth/auth-api'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'company-info', label: 'Company Info' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
]

const NOTIFICATION_PREFS = [
  {
    id: 'post-published',
    title: 'Post Published',
    description: 'Receive a confirmation when a scheduled post goes live successfully.',
    defaultChecked: true,
  },
  {
    id: 'connection-alerts',
    title: 'Connection Alerts',
    description:
      'Get notified if an API connection to a social platform needs re-authentication.',
    defaultChecked: true,
  },
  {
    id: 'weekly-reports',
    title: 'Weekly Reports',
    description:
      'Summary of engagement, reach, and performance delivered every Monday.',
    defaultChecked: false,
  },
  {
    id: 'billing-alerts',
    title: 'Billing Alerts',
    description: 'Receive invoices, payment confirmations, and subscription updates.',
    defaultChecked: true,
  },
]

// ---------------------------------------------------------------------------
// Country codes with flags
// ---------------------------------------------------------------------------
const COUNTRIES = [
  { code: 'US', dialCode: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dialCode: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'CA', dialCode: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', dialCode: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'DE', dialCode: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dialCode: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'IN', dialCode: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'JP', dialCode: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: 'BR', dialCode: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: 'MX', dialCode: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: 'ZA', dialCode: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: 'NG', dialCode: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'GH', dialCode: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: 'SG', dialCode: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: 'NL', dialCode: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: 'ES', dialCode: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: 'IT', dialCode: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: 'SE', dialCode: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: 'NO', dialCode: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: 'CH', dialCode: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: 'PL', dialCode: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: 'NZ', dialCode: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: 'AR', dialCode: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: 'CO', dialCode: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: 'PH', dialCode: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: 'PK', dialCode: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: 'BD', dialCode: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'EG', dialCode: '+20',  flag: '🇪🇬', name: 'Egypt' },
]

// ---------------------------------------------------------------------------
// Phone Input with country selector
// ---------------------------------------------------------------------------
function PhoneInput({ id, label, countryCode, onCountryChange, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-ink">
          {label}
        </label>
      )}
      <div
        style={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
        className="flex h-10 bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500"
      >
        {/* Country selector */}
        <div className="relative flex-shrink-0 border-r border-border">
          <select
            aria-label="Country code"
            value={countryCode}
            onChange={(e) => onCountryChange(e.target.value)}
            className="h-full appearance-none bg-transparent pl-3 pr-6 text-sm text-ink focus:outline-none cursor-pointer"
            style={{ minWidth: '84px' }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.dialCode}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-muted text-[10px]">
            ▾
          </span>
        </div>

        {/* Number input */}
        <input
          id={id}
          type="tel"
          value={value}
          onChange={onChange}
          placeholder="(555) 123-4567"
          className="flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------
function Toggle({ id, checked, onChange }) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={[
          'w-11 h-6 rounded-full transition-colors duration-200',
          'after:content-[\'\'] after:absolute after:top-[2px] after:start-[2px]',
          'after:bg-white after:border after:border-border after:rounded-full',
          'after:h-5 after:w-5 after:transition-all',
          'peer-checked:after:translate-x-full peer-checked:after:border-white',
          checked ? 'bg-primary' : 'bg-border',
        ].join(' ')}
      />
    </label>
  )
}

// ---------------------------------------------------------------------------
// Section layout helper
// ---------------------------------------------------------------------------
function SettingsSection({ label, description, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <h3 className="text-base font-semibold text-ink mb-1">{label}</h3>
        <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  )
}

// Shared field style — 1px border, 8px border-radius
const fieldCls =
  'h-10 bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
const fieldStyle = { borderRadius: '8px', border: '1px solid var(--color-border)' }
const textareaStyle = { borderRadius: '8px', border: '1px solid var(--color-border)' }

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------
function CompanyInfoTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [originalProfile, setOriginalProfile] = useState(null)

  const [businessName, setBusinessName] = useState('SocialAI Pro')
  const [industry, setIndustry] = useState('Technology & SaaS')
  const [description, setDescription] = useState(
    'A forward-thinking management firm leveraging artificial intelligence to streamline social media workflows for high-growth startups.'
  )
  const [email, setEmail] = useState('contact@socialai.pro')
  // Phone split into country + number
  const [phoneCountry, setPhoneCountry] = useState('US')
  const [phoneNumber, setPhoneNumber] = useState('(555) 123-4567')
  // Business location
  const [location, setLocation] = useState('')
  // URLs
  const [website, setWebsite] = useState('https://socialai.pro')
  const [businessWebsite, setBusinessWebsite] = useState('')
  const [competitorUrls, setCompetitorUrls] = useState('')
  const [competitorSocials, setCompetitorSocials] = useState('')
  const [brandVoice, setBrandVoice] = useState({
    tone: 'Professional',
    targetAudience: 'Tech startups, digital agencies',
    writingStyle: 'Conversational',
  })
  const [logoUrl, setLogoUrl] = useState('')

  const [saved, setSaved] = useState(false)

  const applyProfile = (profile) => {
    setBusinessName(profile.businessName || '')
    setIndustry(profile.industry || 'Technology & SaaS')
    setDescription(profile.businessDescription || '')
    setEmail(profile.contactEmail || '')
    setPhoneNumber(profile.contactPhone || '')
    setLocation(profile.addressLine1 || '')
    setWebsite(profile.website || '')
    setLogoUrl(profile.logoUrl || '')
  }

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const profile = await getCompanyInfo()
      setOriginalProfile(profile)
      applyProfile(profile)
    } catch (err) {
      setError(err.message || 'Failed to load company info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    try {
      setSaving(true)
      const updated = await updateCompanyInfo({
        businessName,
        businessDescription: description,
        industry,
        website,
        contactEmail: email,
        contactPhone: phoneNumber,
        addressLine1: location,
        logoUrl,
      })
      setOriginalProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    if (originalProfile) {
      applyProfile(originalProfile)
    } else {
      setBusinessName('')
      setIndustry('Technology & SaaS')
      setDescription('')
      setEmail('')
      setPhoneCountry('US')
      setPhoneNumber('')
      setLocation('')
      setWebsite('')
      setLogoUrl('')
      setBusinessWebsite('')
      setCompetitorUrls('')
      setCompetitorSocials('')
      setBrandVoice({
        tone: 'Professional',
        targetAudience: 'Tech startups, digital agencies',
        writingStyle: 'Conversational',
      })
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center h-48">
        <p className="text-sm text-ink-muted">Loading settings...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-danger/30 bg-danger/5">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadProfile}>
          Retry
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Business Profile */}
      <SettingsSection
        label="Business Profile"
        description="This information will be displayed publicly on your generated reports."
      >
        <Card className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="business-name" className="text-xs font-medium text-ink">
                Business Name
              </label>
              <input
                id="business-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={fieldCls}
                style={fieldStyle}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="industry" className="text-xs font-medium text-ink">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={fieldCls}
                style={fieldStyle}
              >
                <option>Technology &amp; SaaS</option>
                <option>Marketing Agency</option>
                <option>E-commerce</option>
                <option>Content Creation</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="company-description" className="text-xs font-medium text-ink">
                Company Description
              </label>
              <textarea
                id="company-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                style={textareaStyle}
              />
            </div>
          </form>
        </Card>
      </SettingsSection>

      {/* Contact Details */}
      <SettingsSection
        label="Contact Details"
        description="How our support team and your partners reach the organization."
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Official Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="official-email" className="text-xs font-medium text-ink">
                  Official Email
                </label>
                <input
                  id="official-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldCls}
                  style={fieldStyle}
                />
              </div>

              {/* Phone Number with country selector */}
              <PhoneInput
                id="phone-number"
                label="Phone Number"
                countryCode={phoneCountry}
                onCountryChange={setPhoneCountry}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            {/* Business Location */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="business-location" className="text-xs font-medium text-ink">
                Business Location
              </label>
              <input
                id="business-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY, USA"
                className={fieldCls}
                style={fieldStyle}
              />
            </div>

            {/* Website URL */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="website-url" className="text-xs font-medium text-ink">
                Website URL
              </label>
              <input
                id="website-url"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className={fieldCls}
                style={fieldStyle}
              />
            </div>
          </div>
        </Card>
      </SettingsSection>

      {/* AI Context — Competitor & Online Presence */}
      <SettingsSection
        label="AI Context"
        description="These details help the AI generate more relevant and competitive content tailored to your market."
      >
        <Card className="p-6">
          <div className="space-y-4">
            {/* Business Website URL */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="business-website-url" className="text-xs font-medium text-ink">
                Business Website URL
              </label>
              <input
                id="business-website-url"
                type="url"
                value={businessWebsite}
                onChange={(e) => setBusinessWebsite(e.target.value)}
                placeholder="https://yourbusiness.com"
                className={fieldCls}
                style={fieldStyle}
              />
              <p className="text-[11px] text-ink-muted leading-relaxed">
                The AI will use this to understand your brand voice and offerings.
              </p>
            </div>

            {/* Competitor Website URLs */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="competitor-urls" className="text-xs font-medium text-ink">
                Competitor Website URLs
              </label>
              <textarea
                id="competitor-urls"
                rows={3}
                value={competitorUrls}
                onChange={(e) => setCompetitorUrls(e.target.value)}
                placeholder="https://competitor1.com, https://competitor2.com"
                className="border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                style={fieldStyle}
              />
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Separate multiple URLs with commas. The AI uses these for competitive positioning.
              </p>
            </div>

            {/* Competitor Social Media Links */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="competitor-socials" className="text-xs font-medium text-ink">
                Competitor Social Media Links
              </label>
              <textarea
                id="competitor-socials"
                rows={3}
                value={competitorSocials}
                onChange={(e) => setCompetitorSocials(e.target.value)}
                placeholder="https://twitter.com/competitor, https://instagram.com/competitor"
                className="border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                style={fieldStyle}
              />
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Separate multiple links with commas. Helps the AI benchmark your social strategy.
              </p>
            </div>
          </div>
        </Card>
      </SettingsSection>

      {/* Brand Voice Section */}
      <SettingsSection
        label="Brand Voice"
        description="Configure target audience and style guidelines for AI content generation."
      >
        <Card className="p-6">
          <BrandVoiceForm
            initialValues={brandVoice}
            onSubmit={(updated) => {
              setBrandVoice(updated)
              handleSave()
            }}
            buttonText={saved ? '✓ Saved!' : 'Save Brand Voice'}
          />
        </Card>
      </SettingsSection>

      {/* Save / Discard */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleDiscard}>
          Discard
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState(
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, p.defaultChecked]))
  )
  const [saved, setSaved] = useState(false)

  const toggle = (id) => setPrefs((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-border bg-canvas">
        <h3 className="text-base font-semibold text-ink">Notification Preferences</h3>
        <p className="text-xs text-ink-muted mt-0.5">
          Control which updates are delivered to your inbox and dashboard.
        </p>
      </div>

      <div className="divide-y divide-border">
        {NOTIFICATION_PREFS.map((pref) => (
          <div
            key={pref.id}
            className="px-6 py-4 flex items-center justify-between hover:bg-canvas transition-colors"
          >
            <div className="max-w-md pr-4">
              <p className="text-sm font-medium text-ink">{pref.title}</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{pref.description}</p>
            </div>
            <Toggle
              id={`notif-${pref.id}`}
              checked={prefs[pref.id]}
              onChange={() => toggle(pref.id)}
            />
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-border flex justify-end bg-surface">
        <Button variant="primary" onClick={handleSave}>
          {saved ? '✓ Saved!' : 'Save Preferences'}
        </Button>
      </div>
    </Card>
  )
}

function SecurityTab() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [currentPwError, setCurrentPwError] = useState('')
  const [pwError, setPwError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setPwError('')
    setCurrentPwError('')
    setPwSaved(false)

    if (!currentPw) {
      setCurrentPwError('Current password is required.')
      return
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.')
      return
    }

    try {
      setLoading(true)
      await changePassword(currentPw, newPw)
      setPwSaved(true)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to update password'
      if (message.toLowerCase().includes('current password')) {
        setCurrentPwError(message)
      } else {
        setPwError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <SettingsSection
        label="Change Password"
        description="Update your account password regularly to maintain high security."
      >
        <Card className="p-6">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <Input
              label="Current Password"
              id="current-password"
              type="password"
              placeholder="••••••••"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              error={currentPwError}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="New Password"
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <Input
                label="Confirm New Password"
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
            </div>

            {pwError && <p className="text-xs text-danger">{pwError}</p>}

            <p className="text-xs text-ink-muted flex items-center gap-1.5">
              <Info size={14} className="text-primary flex-shrink-0" />
              Must be at least 12 characters including symbols.
            </p>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Updating...' : pwSaved ? '✓ Updated!' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      </SettingsSection>

      {/* MFA */}
      <SettingsSection
        label="Multi-Factor Auth"
        description="Add an extra layer of protection to your account access."
      >
        <Card className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-control bg-accent-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} className="text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Two-Factor Authentication</p>
              <div className="mt-1">
                <Badge tone="success">Active</Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Configure
          </Button>
        </Card>
      </SettingsSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
/**
 * Settings — Stitch-generated Settings page converted to React.
 */
export default function Settings() {
  const [activeTab, setActiveTab] = useState('company-info')

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Account Settings"
        description="Manage your organization's presence and security protocols."
      />

      {/* Tab Bar */}
      <div className="flex border-b border-border -mb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'company-info' && <CompanyInfoTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}
