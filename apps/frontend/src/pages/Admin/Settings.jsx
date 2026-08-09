import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Info, ShieldCheck } from 'lucide-react'
import { changePassword } from '../../features/auth/auth-api'
import { getCompanyProfile, updateCompanyProfile } from '../../features/admin/settings-api'

const TABS = [
  { id: 'company-info', label: 'Company Profile' },
  { id: 'security', label: 'Security' },
]

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

function CompanyInfoTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('NG')
  const [postalCode, setPostalCode] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [taxId, setTaxId] = useState('')

  useEffect(() => {
    let active = true
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError('')
        const profile = await getCompanyProfile()
        if (active) {
          setCompanyName(profile.companyName || '')
          setLogoUrl(profile.logoUrl || '')
          setContactEmail(profile.contactEmail || '')
          setContactPhone(profile.contactPhone || '')
          setWebsite(profile.website || '')
          setAddressLine1(profile.addressLine1 || '')
          setAddressLine2(profile.addressLine2 || '')
          setCity(profile.city || '')
          setState(profile.state || '')
          setCountry(profile.country || 'NG')
          setPostalCode(profile.postalCode || '')
          setBusinessDescription(profile.businessDescription || '')
          setRegistrationNumber(profile.registrationNumber || '')
          setTaxId(profile.taxId || '')
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load company profile')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    fetchProfile()
    return () => {
      active = false
    }
  }, [])

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    try {
      setSaving(true)
      setSaveSuccess(false)
      await updateCompanyProfile({
        companyName,
        logoUrl,
        contactEmail,
        contactPhone,
        website,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        businessDescription,
        registrationNumber,
        taxId,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to update company profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center h-48">
        <p className="text-sm text-ink-muted">Loading company profile...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-danger/30 bg-danger/5">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        label="Company Profile"
        description="Configure your administrative company settings and default regional location details."
      >
        <Card className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                label="Logo URL"
                id="logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Email"
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <Input
                label="Contact Phone"
                id="contact-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Website URL"
                id="website-url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="country" className="text-sm font-medium text-ink">
                  Country
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.dialCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Address Line 1"
                id="address-line-1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
              <Input
                label="Address Line 2"
                id="address-line-2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Input
                label="State"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <Input
                label="Postal Code"
                id="postal-code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Registration Number"
                id="registration-number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
              <Input
                label="Tax ID"
                id="tax-id"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="business-description" className="text-sm font-medium text-ink">
                Business Description
              </label>
              <textarea
                id="business-description"
                rows={4}
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border border-border rounded-control resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </SettingsSection>
    </div>
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
              Must be at least 8 characters.
            </p>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Updating...' : pwSaved ? '✓ Updated!' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      </SettingsSection>

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

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company-info')

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Admin Settings"
        description="Manage system administrative controls, company presence, and security protocols."
      />

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

      <div>
        {activeTab === 'company-info' && <CompanyInfoTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}
