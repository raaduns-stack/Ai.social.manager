import { useState } from 'react'
import {
  Rocket,
  Cpu,
  Layers,
  FileCode,
  Network,
  Database,
  Gauge,
  History,
  AlertTriangle,
  Key,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  Info,
  Sliders,
  Loader2,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { cn } from '../../utils/cn'

// Sub-Modules metadata
const SUB_MODULES = [
  { id: 'OpenClaw', label: 'OpenClaw', icon: Rocket },
  { id: 'Ollama', label: 'Ollama', icon: Cpu },
  { id: 'ModelManagement', label: 'AI Model Management', icon: Layers },
  { id: 'PromptTemplates', label: 'Prompt Templates', icon: FileCode },
  { id: 'Workflow', label: 'n8n Workflow', icon: Network },
  { id: 'KnowledgeBase', label: 'Knowledge Base', icon: Database },
  { id: 'Performance', label: 'Performance Monitoring', icon: Gauge },
  { id: 'UsageLogs', label: 'Usage Logs', icon: History },
  { id: 'ErrorLogs', label: 'Error Logs', icon: AlertTriangle },
  { id: 'ApiSettings', label: 'API & Integration Settings', icon: Key },
]

// Toggle Switch Component (Styled using tailwind.config.js classes)
function Toggle({ id, checked, onChange, disabled }) {
  return (
    <label htmlFor={id} className={cn("relative inline-flex items-center cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed")}>
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div
        className={cn(
          'w-11 h-6 rounded-full transition-colors duration-200 relative',
          'after:content-[\'\'] after:absolute after:top-[2px] after:start-[2px]',
          'after:bg-white after:border after:border-border after:rounded-full',
          'after:h-5 after:w-5 after:transition-all',
          'peer-checked:after:translate-x-full peer-checked:after:border-white',
          checked ? 'bg-primary' : 'bg-border'
        )}
      />
    </label>
  )
}

export default function AIConfiguration() {
  const [activeTab, setActiveTab] = useState('OpenClaw')

  // Form states
  const [apiKey, setApiKey] = useState('sk-claw-8a7e1b2c3d4e5f6g7h8i')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [environment, setEnvironment] = useState('production')
  const [maxRequests, setMaxRequests] = useState(1000)

  // Advanced states
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [topP, setTopP] = useState(0.9)
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.0)

  // Save/Discard states
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const [showDiscardModal, setShowDiscardModal] = useState(false)

  const handleSave = () => {
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    }, 1200)
  }

  const handleDiscardClick = () => {
    setShowDiscardModal(true)
  }

  const confirmDiscard = () => {
    setApiKey('sk-claw-8a7e1b2c3d4e5f6g7h8i')
    setShowApiKey(false)
    setIsEnabled(true)
    setEnvironment('production')
    setMaxRequests(1000)
    setTemperature(0.7)
    setTopP(0.9)
    setFrequencyPenalty(0.0)
    setShowDiscardModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1 text-xs text-ink-muted mb-2 font-medium">
          <span className="hover:text-ink cursor-pointer">Settings</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="text-primary font-semibold">AI Configuration</span>
        </div>
        <PageHeader title="AI Configuration" description="Configure global system integrations and thresholds." />
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Sub-navigation */}
        <div className="col-span-12 md:col-span-3 space-y-6">
          <Card className="overflow-hidden border border-border bg-surface shadow-soft">
            <div className="p-4 border-b border-border bg-canvas">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Sub-Modules</h3>
            </div>
            <ul className="flex flex-col">
              {SUB_MODULES.map((module) => {
                const Icon = module.icon
                const isActive = activeTab === module.id
                return (
                  <li key={module.id} className="group">
                    <button
                      onClick={() => setActiveTab(module.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-6 py-3 transition-colors text-left border-l-4 font-medium text-sm",
                        isActive
                          ? "bg-primary-50 text-primary-700 border-primary font-bold"
                          : "text-ink-muted hover:bg-canvas hover:text-ink border-transparent"
                      )}
                    >
                      <span>{module.label}</span>
                      <Icon
                        size={16}
                        className={cn(
                          "transition-opacity duration-150",
                          isActive ? "opacity-100 text-primary-600" : "opacity-0 group-hover:opacity-100 text-ink-muted"
                        )}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* Need Help Card */}
          <Card className="p-4 bg-canvas border border-border flex items-start gap-3">
            <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-ink">Need help?</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                View the{' '}
                <a href="#" className="text-primary hover:underline font-medium">
                  OpenClaw Docs
                </a>
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Config Panel */}
        <div className="col-span-12 md:col-span-9">
          {activeTab === 'OpenClaw' ? (
            <div className="space-y-6">
              <Card className="flex flex-col shadow-soft border border-border bg-surface overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">OpenClaw Configuration</h3>
                    <p className="text-xs text-ink-muted mt-0.5 italic">UI-only preview — not connected to a live backend</p>
                  </div>
                  <div>
                    <Badge tone="success" className="py-1 px-3 gap-1.5 flex items-center shrink-0">
                      <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                      Engine Active
                    </Badge>
                  </div>
                </div>

                {/* Form Body */}
                <div className="p-6 space-y-6">
                  {/* API Key */}
                  <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <label className="col-span-1 text-sm font-semibold text-ink">API Key</label>
                    <div className="col-span-3 relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        disabled={!isEnabled}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        disabled={!isEnabled}
                        className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-primary transition-colors",
                          !isEnabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Enabled Toggle */}
                  <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <label className="col-span-1 text-sm font-semibold text-ink">Enabled</label>
                    <div className="col-span-3 flex items-center gap-3">
                      <Toggle
                        id="toggle-enabled"
                        checked={isEnabled}
                        onChange={() => setIsEnabled(!isEnabled)}
                      />
                      <span className="text-xs text-ink-muted font-medium">
                        {isEnabled ? 'System is currently processing requests' : 'System is currently paused'}
                      </span>
                    </div>
                  </div>

                  {/* Environment */}
                  <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <label className="col-span-1 text-sm font-semibold text-ink">Environment</label>
                    <div className="col-span-3">
                      <select
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        disabled={!isEnabled}
                        className="h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                  </div>

                  {/* Max Requests */}
                  <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <div className="col-span-1">
                      <label className="text-sm font-semibold text-ink">Max Requests/Min</label>
                      <p className="text-xs text-ink-muted mt-0.5">Global rate limit per minute</p>
                    </div>
                    <div className="col-span-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <Input
                          type="number"
                          value={maxRequests}
                          onChange={(e) => setMaxRequests(Number(e.target.value))}
                          disabled={!isEnabled}
                          className="w-full sm:w-32"
                        />
                        <div className="flex-1 flex items-center gap-3 w-full">
                          <div className="flex-1 bg-canvas border border-border h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, (maxRequests / 1500) * 100))}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-ink-muted min-w-[80px] text-right">
                            {Math.round(Math.min(100, Math.max(0, (maxRequests / 1500) * 100)))}% Threshold
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-canvas border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <History size={16} />
                    <span className="text-xs">Last updated: 14 mins ago by System Admin</span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      onClick={handleDiscardClick}
                      disabled={saveStatus === 'saving' || !isEnabled}
                      className="w-full sm:w-auto"
                    >
                      Discard
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={saveStatus === 'saving' || !isEnabled}
                      className="w-full sm:w-auto min-w-[140px] flex items-center justify-center gap-2"
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : saveStatus === 'saved' ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Changes Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Advanced Settings Expansion */}
              <Card className="overflow-hidden border border-border bg-surface">
                <div
                  onClick={() => isEnabled && setIsAdvancedOpen(!isAdvancedOpen)}
                  className={cn(
                    "p-4 flex items-center justify-between cursor-pointer hover:bg-canvas transition-colors group",
                    !isEnabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 bg-canvas rounded-control border border-border transition-colors",
                      isAdvancedOpen && "bg-primary-50 border-primary-100 text-primary-700"
                    )}>
                      <Sliders size={18} className={cn("text-ink-muted", isAdvancedOpen && "text-primary")} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink">Advanced Model Tuning</h4>
                      <p className="text-xs text-ink-muted">Modify temperature, top-p, and frequency penalty settings.</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={cn(
                      "text-ink-muted transition-transform duration-200",
                      isAdvancedOpen && "rotate-90 text-primary"
                    )}
                  />
                </div>

                {isAdvancedOpen && isEnabled && (
                  <div className="px-6 pb-6 pt-2 border-t border-border bg-canvas space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <div className="col-span-1">
                        <label className="text-sm font-semibold text-ink">Temperature</label>
                        <p className="text-xs text-ink-muted mt-0.5">Controls randomness of the AI outputs.</p>
                      </div>
                      <div className="col-span-3 flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="flex-1 accent-primary h-1 bg-border rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="w-12 text-right text-sm font-mono text-ink font-semibold">{temperature.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <div className="col-span-1">
                        <label className="text-sm font-semibold text-ink">Top P</label>
                        <p className="text-xs text-ink-muted mt-0.5">Nucleus sampling probability threshold.</p>
                      </div>
                      <div className="col-span-3 flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={topP}
                          onChange={(e) => setTopP(parseFloat(e.target.value))}
                          className="flex-1 accent-primary h-1 bg-border rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="w-12 text-right text-sm font-mono text-ink font-semibold">{topP.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <div className="col-span-1">
                        <label className="text-sm font-semibold text-ink">Frequency Penalty</label>
                        <p className="text-xs text-ink-muted mt-0.5">Decreases likelihood to repeat lines verbatim.</p>
                      </div>
                      <div className="col-span-3 flex items-center gap-4">
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={frequencyPenalty}
                          onChange={(e) => setFrequencyPenalty(parseFloat(e.target.value))}
                          className="flex-1 accent-primary h-1 bg-border rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="w-12 text-right text-sm font-mono text-ink font-semibold">{frequencyPenalty.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <Card className="flex items-center justify-center p-12 border border-border bg-surface shadow-soft">
              <EmptyState
                icon={<Cpu size={40} className="text-ink-muted" />}
                title={`${SUB_MODULES.find(m => m.id === activeTab)?.label} Configuration`}
                description={`Settings and statistics for ${SUB_MODULES.find(m => m.id === activeTab)?.label} are not available in this preview.`}
                action={
                  <Button variant="outline" onClick={() => setActiveTab('OpenClaw')}>
                    Back to OpenClaw
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      </div>

      {/* Discard Changes Confirmation Modal */}
      <Modal
        open={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title="Discard Unsaved Changes?"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted leading-relaxed">
            Are you sure you want to revert all settings to their default values? Any unsaved modifications will be lost.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowDiscardModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDiscard}>
              Yes, Discard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
