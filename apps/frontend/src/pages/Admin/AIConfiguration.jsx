import { useState, useEffect, useMemo } from 'react'
import {
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  ChevronRight,
  Save,
  CheckCircle,
  Info,
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { cn } from '../../utils/cn'
import { getPrompts, updatePrompt, createPrompt } from '../../features/admin/prompt-api'
import ErrorBanner from '../../components/error-banner'

const PLATFORMS = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    Icon: Linkedin,
    defaultPrompt: `Generate professional LinkedIn content.
Always use a business tone.
Maximum 250 words.
Include CTA.`,
    sampleCustomerPrompt: 'Always mention our premium products. Use British English.',
  },
  {
    id: 'twitter',
    label: 'X/Twitter',
    Icon: Twitter, // Using Twitter from lucide-react as closest available
    defaultPrompt: `Generate engaging tweets/X posts.
Keep it concise and punchy.
Maximum 280 characters.
Use 1-2 relevant hashtags.`,
    sampleCustomerPrompt: 'Focus on technology innovation. Use a bold, active voice.',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    Icon: Facebook,
    defaultPrompt: `Generate friendly and social Facebook posts.
Encourage user engagement or comments.
Keep tone conversational.
Include a link description.`,
    sampleCustomerPrompt: 'Promote local community involvement and family values.',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    Icon: Instagram,
    defaultPrompt: `Generate catchy captions for Instagram posts.
Start with a strong hook line.
Maximum 150 words.
Include a clean list of hashtags at the end.`,
    sampleCustomerPrompt: 'Highlight aesthetic values, use friendly emojis, write in lower case.',
  },
]

export default function AIConfiguration() {
  const [activeTab, setActiveTab] = useState('linkedin')
  const [toastMessage, setToastMessage] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Current prompt being edited
  const [editingPrompt, setEditingPrompt] = useState('')

  const loadPrompts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPrompts()
      setTemplates(data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch global prompt templates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const activePlatform = useMemo(() => PLATFORMS.find((p) => p.id === activeTab), [activeTab])

  // Sync editingPrompt state when active tab or templates load
  useEffect(() => {
    if (activePlatform) {
      const match = templates.find((t) => t.category.toLowerCase() === activePlatform.id.toLowerCase())
      setEditingPrompt(match ? match.prompt : activePlatform.defaultPrompt)
    }
  }, [activeTab, templates])

  const handleSave = async (platformId) => {
    setError(null)
    const label = PLATFORMS.find((p) => p.id === platformId)?.label
    try {
      const match = templates.find((t) => t.category.toLowerCase() === platformId.toLowerCase())
      if (match) {
        await updatePrompt(match.id, { prompt: editingPrompt })
      } else {
        await createPrompt({
          name: `${label} Baseline Template`,
          category: platformId,
          prompt: editingPrompt,
          isActive: true,
        })
      }
      setToastMessage(`${label} prompt updated successfully!`)
      loadPrompts()
      setTimeout(() => {
        setToastMessage(null)
      }, 3000)
    } catch (err) {
      console.error(err)
      setError(`Failed to update ${label} baseline prompt template.`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1 text-xs text-ink-muted mb-2 font-medium">
          <span className="hover:text-ink cursor-pointer">Admin</span>
          <ChevronRight size={12} className="text-ink-muted" />
          <span className="text-primary font-semibold">AI Settings</span>
        </div>
        <PageHeader
          title="Global AI Content Settings"
          description="Configure the default baseline prompt templates used for content generation across all customers."
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Sub-Navigation */}
        <div className="col-span-12 md:col-span-3 space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="p-4 border-b border-border bg-canvas/30">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Platforms
              </h3>
            </div>
            <ul className="flex flex-col">
              {PLATFORMS.map((platform) => {
                const Icon = platform.Icon
                const isActive = activeTab === platform.id
                return (
                  <li key={platform.id}>
                    <button
                      onClick={() => {
                        setActiveTab(platform.id)
                        setIsPreviewOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left border-l-4 font-medium text-sm',
                        isActive
                          ? 'bg-primary-50 text-primary border-primary font-bold'
                          : 'text-ink-muted hover:bg-canvas hover:text-ink border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{platform.label}</span>
                      </div>
                      <ChevronRight
                        size={14}
                        className={cn(
                          'opacity-0 transition-opacity duration-150',
                          isActive && 'opacity-100 text-primary-600'
                        )}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* Prompting Note */}
          <Card className="p-4 bg-canvas border border-border flex items-start gap-3">
            <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-ink">System Prompts</p>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                These settings configure the default instructions appended to every AI request. 
                Customer-specific overrides can be set on their detail profiles.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Side: Config Editor */}
        <div className="col-span-12 md:col-span-9 space-y-6">
          {toastMessage && (
            <div className="p-3.5 bg-accent-50 border border-accent-100 rounded-control text-xs font-semibold text-accent-600 flex items-center gap-2 animate-fadeIn">
              <CheckCircle size={14} className="shrink-0 text-accent-500" />
              {toastMessage}
            </div>
          )}

          <Card className="flex flex-col p-6 gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="p-2.5 bg-primary-50 rounded-control text-primary">
                <activePlatform.Icon size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {activePlatform.label} Base Prompt
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Customize the system prompt template for {activePlatform.label} scheduling.
                </p>
              </div>
            </div>

            {/* Prompt Editor */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-ink">System Prompt Rules</label>
              <textarea
                value={editingPrompt}
                onChange={(e) => setEditingPrompt(e.target.value)}
                rows={6}
                className="w-full p-3.5 text-sm text-ink bg-surface border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono leading-relaxed"
                placeholder={`Enter baseline rules for ${activePlatform.label}...`}
              />
            </div>

            {/* Collapsible Merged Preview */}
            <div className="border border-border rounded-control bg-canvas overflow-hidden">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-canvas hover:bg-canvas/80 text-xs font-bold text-ink-muted uppercase tracking-wider transition-colors"
              >
                <span>Preview Merged Example Prompt</span>
                <ChevronRight
                  size={16}
                  className={cn(
                    'text-ink-muted transition-transform duration-200',
                    isPreviewOpen && 'rotate-90 text-primary'
                  )}
                />
              </button>
              {isPreviewOpen && (
                <div className="p-4 border-t border-border/60 bg-surface space-y-4 text-xs font-mono">
                  <div>
                    <span className="font-bold text-ink-muted uppercase block mb-1">
                      [Global Prompt]
                    </span>
                    <pre className="whitespace-pre-wrap font-mono p-2.5 bg-canvas border border-border rounded-control text-ink text-[11px] leading-relaxed">
                      {editingPrompt}
                    </pre>
                  </div>
                  <div>
                    <span className="font-bold text-ink-muted uppercase block mb-1">
                      [Customer Prompt]
                    </span>
                    <pre className="whitespace-pre-wrap font-mono p-2.5 bg-canvas border border-border rounded-control text-ink text-[11px] leading-relaxed">
                      {activePlatform.sampleCustomerPrompt}
                    </pre>
                  </div>
                  <div className="border-t border-border/80 pt-3">
                    <span className="font-bold text-primary uppercase block mb-1">
                      [Final Merged Prompt]
                    </span>
                    <pre className="whitespace-pre-wrap font-mono p-2.5 bg-primary/5 border border-primary/20 rounded-control text-ink text-[11px] leading-relaxed">
                      {`${editingPrompt}\n\n${activePlatform.sampleCustomerPrompt}`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="primary"
                onClick={() => handleSave(activeTab)}
                className="flex items-center gap-2 px-6"
              >
                <Save size={16} />
                Save Prompt
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
