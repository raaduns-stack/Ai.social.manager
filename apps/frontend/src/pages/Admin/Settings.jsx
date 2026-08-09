import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Info, ShieldCheck } from 'lucide-react'
import { changePassword } from '../../features/auth/auth-api'
import {
  getCompanyProfile,
  updateCompanyProfile,
  getSystemSettings,
  updateSystemSettings,
  getNotificationSettings,
  updateNotificationTypeSetting,
  getEmailConfig,
  updateEmailConfig,
  sendTestEmail,
  getSocialApiSettings,
  updateSocialApiSetting,
  getPaymentGatewaySettings,
  updatePaymentGatewaySettings,
} from '../../features/admin/settings-api'

const TABS = [
  { id: 'company-info', label: 'Company Profile' },
  { id: 'system', label: 'System Settings' },
  { id: 'notifications', label: 'Notification Settings' },
  { id: 'email', label: 'Email Configuration' },
  { id: 'social', label: 'Social API Settings' },
  { id: 'payment', label: 'Payment Gateway' },
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
          'w-11 h-6 rounded-full transition-colors duration-200 relative',
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

function SystemSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [defaultTimezone, setDefaultTimezone] = useState('UTC')
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true)
  const [freeTrialDays, setFreeTrialDays] = useState(14)
  const [maxSocialAccountsPerCustomer, setMaxSocialAccountsPerCustomer] = useState(5)
  const [contentApprovalRequired, setContentApprovalRequired] = useState(false)
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD')

  useEffect(() => {
    let active = true
    const fetchSettings = async () => {
      try {
        setLoading(true)
        setError('')
        const settings = await getSystemSettings()
        if (active) {
          setDefaultTimezone(settings.defaultTimezone || 'UTC')
          setDefaultCurrency(settings.defaultCurrency || 'USD')
          setMaintenanceMode(!!settings.maintenanceMode)
          setAllowNewRegistrations(!!settings.allowNewRegistrations)
          setFreeTrialDays(settings.freeTrialDays ?? 14)
          setMaxSocialAccountsPerCustomer(settings.maxSocialAccountsPerCustomer ?? 5)
          setContentApprovalRequired(!!settings.contentApprovalRequired)
          setDateFormat(settings.dateFormat || 'YYYY-MM-DD')
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load system settings')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    fetchSettings()
    return () => {
      active = false
    }
  }, [])

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    try {
      setSaving(true)
      setSaveSuccess(false)
      await updateSystemSettings({
        defaultTimezone,
        defaultCurrency,
        maintenanceMode,
        allowNewRegistrations,
        freeTrialDays: Number(freeTrialDays),
        maxSocialAccountsPerCustomer: Number(maxSocialAccountsPerCustomer),
        contentApprovalRequired,
        dateFormat,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to update system settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center h-48">
        <p className="text-sm text-ink-muted">Loading system settings...</p>
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
        label="General Configuration"
        description="Global system preferences, regional defaults, and formats."
      >
        <Card className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Default Timezone"
                id="default-timezone"
                value={defaultTimezone}
                onChange={(e) => setDefaultTimezone(e.target.value)}
              />
              <Input
                label="Default Currency"
                id="default-currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date Format"
                id="date-format"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
              />
              <Input
                label="Free Trial Days"
                id="free-trial-days"
                type="number"
                value={freeTrialDays}
                onChange={(e) => setFreeTrialDays(e.target.value)}
              />
            </div>

            <Input
              label="Max Social Accounts Per Customer"
              id="max-social-accounts"
              type="number"
              value={maxSocialAccountsPerCustomer}
              onChange={(e) => setMaxSocialAccountsPerCustomer(e.target.value)}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </SettingsSection>

      <SettingsSection
        label="Feature Controls"
        description="Enable/disable platform-wide systems and registration flows."
      >
        <Card className="divide-y divide-border">
          <div className="p-6 flex items-center justify-between hover:bg-canvas transition-colors">
            <div className="max-w-md pr-4">
              <p className="text-sm font-medium text-ink">Maintenance Mode</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Platform becomes read-only or offline for normal users during updates.
              </p>
            </div>
            <Toggle
              id="maintenance-mode"
              checked={maintenanceMode}
              onChange={() => setMaintenanceMode(!maintenanceMode)}
            />
          </div>

          <div className="p-6 flex items-center justify-between hover:bg-canvas transition-colors">
            <div className="max-w-md pr-4">
              <p className="text-sm font-medium text-ink">Allow New Registrations</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Toggles whether new users can sign up on the landing page.
              </p>
            </div>
            <Toggle
              id="allow-registrations"
              checked={allowNewRegistrations}
              onChange={() => setAllowNewRegistrations(!allowNewRegistrations)}
            />
          </div>

          <div className="p-6 flex items-center justify-between hover:bg-canvas transition-colors">
            <div className="max-w-md pr-4">
              <p className="text-sm font-medium text-ink">Content Approval Required</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                All scheduled posts must be approved by an administrator before publishing.
              </p>
            </div>
            <Toggle
              id="content-approval"
              checked={contentApprovalRequired}
              onChange={() => setContentApprovalRequired(!contentApprovalRequired)}
            />
          </div>

          <div className="p-6 flex justify-end bg-surface">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save System Settings'}
            </Button>
          </div>
        </Card>
      </SettingsSection>
    </div>
  )
}

function NotificationSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState([])
  const [savingRows, setSavingRows] = useState({}) // { [notificationType]: 'saving' | 'saved' | 'error' }

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getNotificationSettings()
      setSettings(data)
    } catch (err) {
      setError(err.message || 'Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleToggle = async (notificationType, field, currentValue) => {
    // Optimistic update
    setSettings((prev) =>
      prev.map((s) =>
        s.notificationType === notificationType ? { ...s, [field]: !currentValue } : s
      )
    )

    setSavingRows((prev) => ({ ...prev, [notificationType]: 'saving' }))

    try {
      await updateNotificationTypeSetting(notificationType, {
        [field]: !currentValue,
      })
      setSavingRows((prev) => ({ ...prev, [notificationType]: 'saved' }))
      setTimeout(() => {
        setSavingRows((prev) => ({ ...prev, [notificationType]: null }))
      }, 2000)
    } catch (err) {
      setSavingRows((prev) => ({ ...prev, [notificationType]: 'error' }))
      // Rollback
      setSettings((prev) =>
        prev.map((s) =>
          s.notificationType === notificationType ? { ...s, [field]: currentValue } : s
        )
      )
      alert(err.message || 'Failed to update setting')
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center h-48">
        <p className="text-sm text-ink-muted">Loading notification settings...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-danger/30 bg-danger/5">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadSettings}>
          Retry
        </Button>
      </Card>
    )
  }

  const formatTypeName = (type) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-border bg-canvas">
        <h3 className="text-base font-semibold text-ink">Global Notification Type Settings</h3>
        <p className="text-xs text-ink-muted mt-0.5">
          Control which notification channels are available to users globally and enable/disable them platform-wide.
        </p>
      </div>

      <div className="divide-y divide-border">
        {settings.map((row) => {
          const status = savingRows[row.notificationType]
          return (
            <div
              key={row.notificationType}
              className="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-canvas transition-colors"
            >
              <div className="max-w-md">
                <p className="text-sm font-semibold text-ink">
                  {formatTypeName(row.notificationType)}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Type ID: <code className="bg-canvas-card px-1 py-0.5 rounded">{row.notificationType}</code>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">Email</span>
                  <Toggle
                    id={`email-${row.notificationType}`}
                    checked={row.emailAvailable}
                    onChange={() => handleToggle(row.notificationType, 'emailAvailable', row.emailAvailable)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">In-App</span>
                  <Toggle
                    id={`inapp-${row.notificationType}`}
                    checked={row.inAppAvailable}
                    onChange={() => handleToggle(row.notificationType, 'inAppAvailable', row.inAppAvailable)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">WhatsApp</span>
                  <Toggle
                    id={`whatsapp-${row.notificationType}`}
                    checked={row.whatsappAvailable}
                    onChange={() => handleToggle(row.notificationType, 'whatsappAvailable', row.whatsappAvailable)}
                  />
                </div>

                <div className="flex items-center gap-2 border-l border-border pl-6">
                  <span className="text-xs font-semibold text-ink">Enabled Globally</span>
                  <Toggle
                    id={`global-${row.notificationType}`}
                    checked={row.isEnabledGlobally}
                    onChange={() => handleToggle(row.notificationType, 'isEnabledGlobally', row.isEnabledGlobally)}
                  />
                </div>

                {status && (
                  <span className="text-xs w-16 text-right">
                    {status === 'saving' && <span className="text-primary animate-pulse">Saving...</span>}
                    {status === 'saved' && <span className="text-success font-semibold">✓ Saved</span>}
                    {status === 'error' && <span className="text-danger font-semibold">✗ Failed</span>}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function PlatformCard({ initialData, onSave }) {
  const [clientId, setClientId] = useState(initialData.clientId || '')
  const [clientSecret, setClientSecret] = useState('')
  const [clientSecretMasked, setClientSecretMasked] = useState(initialData.clientSecretMasked || '')
  const [redirectUri, setRedirectUri] = useState(initialData.redirectUri || '')
  const [isEnabled, setIsEnabled] = useState(!!initialData.isEnabled)

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setSaveSuccess(false)
      const data = {
        clientId,
        redirectUri,
        isEnabled,
      }
      if (clientSecret) {
        data.clientSecret = clientSecret
      }
      const updated = await onSave(initialData.platform, data)
      setClientSecretMasked(updated.clientSecretMasked || '')
      setClientSecret('')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to update social API setting')
    } finally {
      setSaving(false)
    }
  }

  const formatName = (name) => {
    if (name === 'twitter') return 'Twitter / X'
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <h4 className="text-sm font-semibold text-ink">{formatName(initialData.platform)}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">{isEnabled ? 'Active' : 'Disabled'}</span>
            <Toggle
              id={`enable-${initialData.platform}`}
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Client ID"
            id={`client-id-${initialData.platform}`}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label="Client Secret"
              id={`client-secret-${initialData.platform}`}
              type="password"
              placeholder="Leave blank to keep current secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
            {clientSecretMasked && (
              <p className="text-xs text-ink-muted">
                Current secret: <code className="bg-canvas-card px-1 py-0.5 rounded">{clientSecretMasked}</code>
              </p>
            )}
          </div>
        </div>

        <Input
          label="Redirect URI"
          id={`redirect-uri-${initialData.platform}`}
          value={redirectUri}
          onChange={(e) => setRedirectUri(e.target.value)}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Credentials'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function SocialApiSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [platforms, setPlatforms] = useState([])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getSocialApiSettings()
      setPlatforms(data)
    } catch (err) {
      setError(err.message || 'Failed to load social API settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (platform, data) => {
    return await updateSocialApiSetting(platform, data)
  }

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center h-48">
        <p className="text-sm text-ink-muted">Loading social API settings...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-danger/30 bg-danger/5">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadSettings}>
          Retry
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        label="OAuth Configurations"
        description="Provide Client IDs and Secrets for each social provider. These keys are used when customers connect their channels."
      >
        <div className="space-y-6">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.platform}
              initialData={platform}
              onSave={handleSave}
            />
          ))}
        </div>
      </SettingsSection>
    </div>
  )
}

function EmailConfigTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpPasswordMasked, setSmtpPasswordMasked] = useState('')
  const [smtpSecure, setSmtpSecure] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')

  // Test Email state
  const [testRecipient, setTestRecipient] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  const [testSuccess, setTestSuccess] = useState('')
  const [testError, setTestError] = useState('')

  const loadConfig = async () => {
    try {
      setLoading(true)
      setError('')
      const config = await getEmailConfig()
      setSmtpHost(config.smtpHost || '')
      setSmtpPort(config.smtpPort ?? 587)
      setSmtpUsername(config.smtpUsername || '')
      setSmtpPassword('') // Keep password empty on load
      setSmtpPasswordMasked(config.smtpPasswordMasked || '')
      setSmtpSecure(!!config.smtpSecure)
      setSenderName(config.senderName || '')
      setSenderEmail(config.senderEmail || '')
      setReplyToEmail(config.replyToEmail || '')
    } catch (err) {
      setError(err.message || 'Failed to load email config')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    try {
      setSaving(true)
      setSaveSuccess(false)
      const data = {
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUsername,
        smtpSecure,
        senderName,
        senderEmail,
        replyToEmail,
      }
      if (smtpPassword) {
        data.smtpPassword = smtpPassword
      }
      const updated = await updateEmailConfig(data)
      setSmtpPasswordMasked(updated.smtpPasswordMasked || '')
      setSmtpPassword('') // Reset password input after save
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to update email config')
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!testRecipient) {
      setTestError('Recipient email is required.')
      return
    }
    try {
      setTestingEmail(true)
      setTestSuccess('')
      setTestError('')
      const res = await sendTestEmail(testRecipient)
      setTestSuccess(res.message || 'Test email sent successfully!')
    } catch (err) {
      setTestError(err.response?.data?.message || err.message || 'Failed to send test email')
    } finally {
      setTestingEmail(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center h-48">
        <p className="text-sm text-ink-muted">Loading email config...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-danger/30 bg-danger/5">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadConfig}>
          Retry
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        label="SMTP Credentials"
        description="Configure SMTP settings used by the platform to send automated messages, resets, and notifications."
      >
        <Card className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="SMTP Host"
                  id="smtp-host"
                  placeholder="smtp.example.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>
              <Input
                label="SMTP Port"
                id="smtp-port"
                type="number"
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SMTP Username"
                id="smtp-username"
                placeholder="user@example.com"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <Input
                  label="SMTP Password"
                  id="smtp-password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                />
                {smtpPasswordMasked && (
                  <p className="text-xs text-ink-muted">
                    Current password: <code className="bg-canvas-card px-1 py-0.5 rounded">{smtpPasswordMasked}</code>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
              <Toggle
                id="smtp-secure"
                checked={smtpSecure}
                onChange={() => setSmtpSecure(!smtpSecure)}
              />
              <label htmlFor="smtp-secure" className="text-sm font-medium text-ink">
                Use Secure Connection (SSL/TLS)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Sender Name"
                id="sender-name"
                placeholder="SocialPilot AI"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
              <Input
                label="Sender Email"
                id="sender-email"
                type="email"
                placeholder="no-reply@socialpilot.test"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
            </div>

            <Input
              label="Reply-To Email"
              id="reply-to-email"
              type="email"
              placeholder="support@socialpilot.test"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Config'}
              </Button>
            </div>
          </form>
        </Card>
      </SettingsSection>

      <SettingsSection
        label="Test Mailer Connection"
        description="Verify SMTP credentials by sending a test email to a specific recipient."
      >
        <Card className="p-6">
          <form onSubmit={handleSendTestEmail} className="space-y-4">
            <Input
              label="Recipient Email Address"
              id="test-recipient"
              type="email"
              placeholder="admin@example.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
            />

            {testError && <p className="text-xs text-danger font-medium">{testError}</p>}
            {testSuccess && <p className="text-xs text-success font-medium">{testSuccess}</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="outline" disabled={testingEmail}>
                {testingEmail ? 'Sending Test...' : 'Send Test Email'}
              </Button>
            </div>
          </form>
        </Card>
      </SettingsSection>
    </div>
  )
}

function PaymentGatewaySettingsTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [secretKeyMasked, setSecretKeyMasked] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [webhookSecretMasked, setWebhookSecretMasked] = useState('')
  const [supportedMethods, setSupportedMethods] = useState([])
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError('')
      const settings = await getPaymentGatewaySettings()
      setPublicKey(settings.publicKey || '')
      setSecretKey('')
      setSecretKeyMasked(settings.secretKeyMasked || '')
      setWebhookSecret('')
      setWebhookSecretMasked(settings.webhookSecretMasked || '')
      setSupportedMethods(settings.supportedMethods || [])
      setIsLiveMode(!!settings.isLiveMode)
      setIsEnabled(!!settings.isEnabled)
    } catch (err) {
      setError(err.message || 'Failed to load payment gateway settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    try {
      setSaving(true)
      setSaveSuccess(false)
      const data = {
        publicKey,
        supportedMethods,
        isLiveMode,
        isEnabled,
      }
      if (secretKey) {
        data.secretKey = secretKey
      }
      if (webhookSecret) {
        data.webhookSecret = webhookSecret
      }
      const updated = await updatePaymentGatewaySettings(data)
      setSecretKeyMasked(updated.secretKeyMasked || '')
      setWebhookSecretMasked(updated.webhookSecretMasked || '')
      setSecretKey('')
      setWebhookSecret('')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      alert(err.message || 'Failed to update payment settings')
    } finally {
      setSaving(false)
    }
  }

  const handleMethodToggle = (methodId) => {
    setSupportedMethods((prev) =>
      prev.includes(methodId)
        ? prev.filter((m) => m !== methodId)
        : [...prev, methodId]
    )
  }

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center h-48">
        <p className="text-sm text-ink-muted">Loading payment settings...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-danger/30 bg-danger/5">
        <p className="text-sm text-danger">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadSettings}>
          Retry
        </Button>
      </Card>
    )
  }

  const PAYMENT_METHODS = [
    { id: 'card', label: 'Credit / Debit Card' },
    { id: 'bank_transfer', label: 'Bank Transfer' },
    { id: 'ussd', label: 'USSD Code' },
    { id: 'mobile_money', label: 'Mobile Money' },
  ]

  return (
    <div className="space-y-8">
      <SettingsSection
        label="Gateway Integration"
        description="Provide keys and secrets for your payment gateway merchant account."
      >
        <Card className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h4 className="text-sm font-semibold text-ink">Configuration Status</h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-muted">Live Mode</span>
                    <Toggle
                      id="is-live-mode"
                      checked={isLiveMode}
                      onChange={() => setIsLiveMode(!isLiveMode)}
                    />
                  </div>
                  <div className="flex items-center gap-2 border-l border-border pl-6">
                    <span className="text-xs font-semibold text-ink">Enabled Gateway</span>
                    <Toggle
                      id="gateway-enabled"
                      checked={isEnabled}
                      onChange={() => setIsEnabled(!isEnabled)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="Public Key"
              id="payment-public-key"
              placeholder="pk_test_..."
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Input
                  label="Secret Key"
                  id="payment-secret-key"
                  type="password"
                  placeholder="Leave blank to keep current key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
                {secretKeyMasked && (
                  <p className="text-xs text-ink-muted">
                    Current key: <code className="bg-canvas-card px-1 py-0.5 rounded">{secretKeyMasked}</code>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Input
                  label="Webhook Secret"
                  id="payment-webhook-secret"
                  type="password"
                  placeholder="Leave blank to keep current secret"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                />
                {webhookSecretMasked && (
                  <p className="text-xs text-ink-muted">
                    Current secret: <code className="bg-canvas-card px-1 py-0.5 rounded">{webhookSecretMasked}</code>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Gateway Settings'}
              </Button>
            </div>
          </form>
        </Card>
      </SettingsSection>

      <SettingsSection
        label="Supported Payment Methods"
        description="Select which billing channels are offered to subscribers during the checkout process."
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAYMENT_METHODS.map((method) => {
                const checked = supportedMethods.includes(method.id)
                return (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border border-border rounded-control hover:bg-canvas transition-colors"
                  >
                    <label htmlFor={`method-${method.id}`} className="text-sm font-medium text-ink cursor-pointer select-none">
                      {method.label}
                    </label>
                    <Toggle
                      id={`method-${method.id}`}
                      checked={checked}
                      onChange={() => handleMethodToggle(method.id)}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} variant="primary" disabled={saving}>
                {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Supported Methods'}
              </Button>
            </div>
          </div>
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
        {activeTab === 'system' && <SystemSettingsTab />}
        {activeTab === 'notifications' && <NotificationSettingsTab />}
        {activeTab === 'email' && <EmailConfigTab />}
        {activeTab === 'social' && <SocialApiSettingsTab />}
        {activeTab === 'payment' && <PaymentGatewaySettingsTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}
