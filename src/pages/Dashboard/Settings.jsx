import { useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Info, ShieldCheck } from 'lucide-react'

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

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------
function CompanyInfoTab() {
  const [businessName, setBusinessName] = useState('SocialAI Pro')
  const [industry, setIndustry] = useState('Technology & SaaS')
  const [description, setDescription] = useState(
    'A forward-thinking management firm leveraging artificial intelligence to streamline social media workflows for high-growth startups.'
  )
  const [email, setEmail] = useState('contact@socialai.pro')
  const [phone, setPhone] = useState('+1 (555) 123-4567')
  const [website, setWebsite] = useState('https://socialai.pro')
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
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
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Official Email"
                  id="official-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Phone Number"
                  id="phone-number"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Input
                label="Website URL"
                id="website-url"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setBusinessName('SocialAI Pro')
                setIndustry('Technology & SaaS')
                setDescription(
                  'A forward-thinking management firm leveraging artificial intelligence to streamline social media workflows for high-growth startups.'
                )
                setEmail('contact@socialai.pro')
                setPhone('+1 (555) 123-4567')
                setWebsite('https://socialai.pro')
              }}
            >
              Discard
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {saved ? '✓ Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </SettingsSection>
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
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  const handlePasswordUpdate = (e) => {
    e.preventDefault()
    setPwError('')
    if (!currentPw) { setPwError('Current password is required.'); return }
    if (newPw.length < 12) { setPwError('New password must be at least 12 characters.'); return }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return }
    setPwSaved(true)
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setTimeout(() => setPwSaved(false), 2000)
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
              <Button type="submit" variant="primary">
                {pwSaved ? '✓ Updated!' : 'Update Password'}
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
