import { useState, useEffect } from 'react'
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ChevronRight,
} from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { cn } from '../../utils/cn'

const ICON_MAP = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
}

export default function AISettingsModal({
  isOpen,
  onClose,
  customerName,
  platforms = [],
  onSave,
}) {
  const [localPrompts, setLocalPrompts] = useState({})
  const [activeTab, setActiveTab] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Initialize and synchronize local prompt values on modal load/props change
  useEffect(() => {
    if (isOpen && platforms && platforms.length > 0) {
      const initial = {}
      platforms.forEach((p) => {
        initial[p.key] = p.customerPrompt || ''
      })
      setLocalPrompts(initial)

      // Ensure activeTab is configured to a valid platform key
      if (!activeTab || !platforms.some((p) => p.key === activeTab)) {
        setActiveTab(platforms[0].key)
      }
    }
  }, [isOpen, platforms])

  // Return early if no active platform is matched
  const activePlatform = platforms.find((p) => p.key === activeTab) || platforms[0]

  if (!isOpen || !activePlatform) return null

  const handleSave = () => {
    const updatedPlatforms = platforms.map((p) => ({
      ...p,
      customerPrompt: localPrompts[p.key] !== undefined ? localPrompts[p.key] : p.customerPrompt,
    }))
    if (onSave) {
      onSave(updatedPlatforms)
    }
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleCancel}
      title={`AI Settings — ${customerName}`}
    >
      <div className="space-y-5 pt-2">
        {/* Horizontal Platform Switcher Tab Bar */}
        <div className="flex border-b border-border bg-canvas/30 p-1 rounded-control gap-1 overflow-x-auto select-none scrollbar-none">
          {platforms.map((p) => {
            const Icon = ICON_MAP[p.key] || Linkedin
            const isActive = activeTab === p.key
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setActiveTab(p.key)
                  setIsPreviewOpen(false)
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-control transition-all shrink-0 whitespace-nowrap',
                  isActive
                    ? 'bg-white shadow-soft text-primary'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Icon size={14} />
                <span>{p.label}</span>
              </button>
            )
          })}
        </div>

        {/* Selected Platform Prompt Form Workspace */}
        <div className="space-y-4">
          {/* Read-only Global Prompt instructions box */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Global Prompt (applies to all customers)
            </span>
            <div className="p-3 text-xs font-mono bg-canvas border border-border rounded-control text-ink-muted leading-relaxed whitespace-pre-wrap select-none opacity-80 max-h-32 overflow-y-auto">
              {activePlatform.globalPrompt}
            </div>
          </div>

          {/* Editable Customer Specific Prompt field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Customer-Specific Instructions — {activePlatform.label}
            </label>
            <textarea
              value={localPrompts[activeTab] || ''}
              onChange={(e) =>
                setLocalPrompts((prev) => ({
                  ...prev,
                  [activeTab]: e.target.value,
                }))
              }
              rows={4}
              className="w-full p-3 text-sm text-ink bg-surface border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono leading-relaxed"
              placeholder={`Enter customized guidelines or rules for ${customerName} on ${activePlatform.label}...`}
            />
          </div>

          {/* Collapsible Concatenated Preview */}
          <div className="border border-border rounded-control bg-canvas overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-canvas hover:bg-canvas/80 text-xs font-bold text-ink-muted uppercase tracking-wider transition-colors"
            >
              <span>Final Prompt Preview</span>
              <ChevronRight
                size={14}
                className={cn(
                  'text-ink-muted transition-transform duration-200',
                  isPreviewOpen && 'rotate-90 text-primary'
                )}
              />
            </button>
            {isPreviewOpen && (
              <div className="p-4 border-t border-border/60 bg-surface">
                <pre className="whitespace-pre-wrap font-mono p-3 bg-primary/5 border border-primary/20 rounded-control text-ink text-[11px] leading-relaxed max-h-40 overflow-y-auto">
                  {`${activePlatform.globalPrompt}\n\n${localPrompts[activeTab] || ''}`}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            className="px-6"
          >
            Save AI Settings
          </Button>
        </div>
      </div>
    </Modal>
  )
}
