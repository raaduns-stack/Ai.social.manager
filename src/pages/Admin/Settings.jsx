import { useState } from 'react'
import {
  Settings as SettingsIcon,
  ChevronDown,
  MapPin,
  Plus,
  Trash2,
  Camera,
  ShieldCheck,
  Shield,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'

// Countries details for dialing prefix dropdown
const COUNTRIES = [
  { flag: '🇳🇬', code: '+234', name: 'Nigeria' },
  { flag: '🇺🇸', code: '+1', name: 'United States' },
  { flag: '🇬🇧', code: '+44', name: 'United Kingdom' },
  { flag: '🇨🇦', code: '+1', name: 'Canada' },
  { flag: '🇩🇪', code: '+49', name: 'Germany' },
]

// Navigation tabs
const SETTINGS_TABS = [
  { id: 'profile', label: 'Company Profile' },
  { id: 'system', label: 'System Settings' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'email', label: 'Email Config' },
  { id: 'social', label: 'Social API' },
  { id: 'payment', label: 'Payment Gateway' },
  { id: 'password', label: 'Password' },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  // Form states
  const [companyName, setCompanyName] = useState('Precision AI Solutions')
  const [websiteUrl, setWebsiteUrl] = useState('precisionai.io')
  const [competitorLinks, setCompetitorLinks] = useState(['competitor-one.com', 'competitor-two.com'])
  const [phoneNumber, setPhoneNumber] = useState('800 000 0000')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [location, setLocation] = useState('Lagos, Nigeria')
  const [logoUrl, setLogoUrl] = useState(null)

  // Interactive UI states
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'

  const handleAddCompetitorLink = () => {
    setCompetitorLinks([...competitorLinks, ''])
  }

  const handleRemoveCompetitorLink = (index) => {
    setCompetitorLinks(competitorLinks.filter((_, idx) => idx !== index))
  }

  const handleCompetitorLinkChange = (index, value) => {
    const updated = [...competitorLinks]
    updated[index] = value
    setCompetitorLinks(updated)
  }

  // Local Logo Uploader utilizing FileReader
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Simulated Save Form logic
  const handleSubmit = (e) => {
    e.preventDefault()
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    }, 850)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <PageHeader
          title="Settings"
          description="Manage your company details, branding elements, and system preferences."
        />
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-4 border-b border-border overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
        {SETTINGS_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-2 text-sm font-semibold transition-all relative",
                isActive
                  ? "text-primary after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                  : "text-ink-muted hover:text-primary"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Main Settings Panel */}
      {activeTab === 'profile' ? (
        <div className="space-y-6">
          <Card className="border border-border bg-surface overflow-hidden shadow-soft">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Company Name */}
                <div className="space-y-1.5">
                  <Input
                    label="Company Name"
                    placeholder="e.g. Precision AI Solutions"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                {/* Website URL */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Business Website URL</label>
                  <div className="flex h-10 border border-border rounded-control overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-surface transition-all">
                    <span className="flex items-center px-3 bg-canvas text-ink-muted border-r border-border text-sm font-medium select-none">
                      https://
                    </span>
                    <input
                      type="text"
                      className="flex-1 px-3 border-none bg-transparent text-sm text-ink outline-none focus:ring-0"
                      placeholder="www.yourcompany.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Competitor Links */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink">Competitor Website / Social Links</label>
                  <div className="space-y-2">
                    {competitorLinks.map((link, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Link ${index + 1}`}
                          value={link}
                          onChange={(e) => handleCompetitorLinkChange(index, e.target.value)}
                          className="flex-1"
                        />
                        {competitorLinks.length > 1 && (
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => handleRemoveCompetitorLink(index)}
                            className="p-2 text-danger hover:bg-red-50 hover:text-danger rounded-control shrink-0 h-10 w-10 flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCompetitorLink}
                    className="text-primary text-xs font-semibold hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <Plus size={14} />
                    <span>Add another</span>
                  </button>
                </div>

                {/* Phone & Location Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Phone Number */}
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-medium text-ink">Phone Number</label>
                    <div className="flex h-10 border border-border rounded-control overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-surface transition-all">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-3 bg-canvas border-r border-border gap-1.5 cursor-pointer hover:bg-border/10 transition-colors shrink-0"
                      >
                        <span className="text-base select-none">{selectedCountry.flag}</span>
                        <span className="text-xs font-semibold text-ink-muted">{selectedCountry.code}</span>
                        <ChevronDown size={14} className="text-ink-muted" />
                      </button>
                      <input
                        type="tel"
                        className="flex-1 px-3 border-none bg-transparent text-sm text-ink outline-none focus:ring-0"
                        placeholder="000 000 0000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>

                    {showCountryDropdown && (
                      <div className="absolute left-0 mt-1 w-48 bg-surface border border-border rounded-card shadow-hover z-20 divide-y divide-border/50">
                        {COUNTRIES.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country)
                              setShowCountryDropdown(false)
                            }}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-canvas transition-colors"
                          >
                            <span className="select-none">{country.flag}</span>
                            <span className="font-medium text-ink text-xs">{country.name}</span>
                            <span className="text-[10px] text-ink-muted ml-auto font-mono">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Business Location */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink">Business Location</label>
                    <div className="relative h-10">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="text"
                        className="w-full h-full pl-10 pr-4 rounded-control border border-border bg-surface text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        placeholder="Enter full address"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                </div>

                {/* Footer Save Button */}
                <div className="pt-4 border-t border-border flex justify-end">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={saveStatus === 'saving'}
                    className="min-w-[140px] flex items-center justify-center gap-2"
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : saveStatus === 'saved' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Changes Saved!</span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>

              </form>
            </div>
          </Card>

          {/* Branding Extra Card & Verification Badge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Logo upload Card */}
            <Card className="md:col-span-2 p-6 flex items-center justify-between border border-border bg-surface shadow-soft">
              <div>
                <h4 className="text-sm font-bold text-ink">Company Logo</h4>
                <p className="text-xs text-ink-muted mt-1">Recommended size: 400x400px. PNG or SVG.</p>
              </div>
              
              <div className="relative">
                <input
                  type="file"
                  id="logo-upload-btn"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload-btn"
                  className="w-16 h-16 rounded-control border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary bg-canvas overflow-hidden hover:bg-primary-50/20 transition-all shrink-0"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={20} className="text-ink-muted" />
                  )}
                </label>
              </div>
            </Card>

            {/* Business Verification Badge */}
            <div className="bg-primary text-white rounded-card p-6 relative overflow-hidden group cursor-pointer shadow-soft">
              <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                <ShieldCheck size={24} className="text-white" />
                <div>
                  <h4 className="text-sm font-bold mb-1">Business Verified</h4>
                  <p className="text-[11px] text-white/80 leading-relaxed">
                    Your company profile is fully verified for priority API access.
                  </p>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Shield size={96} className="text-white" />
              </div>
            </div>

          </div>
        </div>
      ) : (
        <Card className="p-12 flex items-center justify-center border border-border bg-surface shadow-soft">
          <EmptyState
            icon={<SettingsIcon size={40} className="text-ink-muted" />}
            title={`${SETTINGS_TABS.find((t) => t.id === activeTab)?.label} Settings`}
            description={`Preferences and configs for ${SETTINGS_TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} are currently under development in this preview.`}
            action={
              <Button variant="outline" onClick={() => setActiveTab('profile')}>
                Return to Company Profile
              </Button>
            }
          />
        </Card>
      )}
    </div>
  )
}
