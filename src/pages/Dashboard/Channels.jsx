import { useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import {
  Camera,
  Music,
  Linkedin,
  Youtube,
  Facebook,
  Plus,
  RefreshCw,
  Link,
  Shield,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

export default function Channels() {
  // State for channels list
  const [channels, setChannels] = useState([
    {
      id: 'instagram',
      name: 'Instagram Business',
      platform: 'instagram',
      handle: '@studio_creative_official',
      status: 'Connected',
      lastSynced: '2m ago',
    },
    {
      id: 'tiktok',
      name: 'TikTok Pro',
      platform: 'tiktok',
      handle: 'Not linked',
      status: 'Disconnected',
      lastSynced: 'Waiting for authentication...',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Company',
      platform: 'linkedin',
      handle: 'SocialAI Enterprise',
      status: 'Connected',
      lastSynced: '1h ago',
    },
    {
      id: 'x',
      name: 'X / Twitter',
      platform: 'x',
      handle: '@SocialAI_App',
      status: 'Action Required',
      lastSynced: 'Token expired. Please re-authenticate.',
    },
    {
      id: 'youtube',
      name: 'YouTube Studio',
      platform: 'youtube',
      handle: 'SocialAI Global',
      status: 'Connected',
      lastSynced: '45m ago',
    },
    {
      id: 'facebook',
      name: 'Facebook Page',
      platform: 'facebook',
      handle: 'SocialAI Official',
      status: 'Connected',
      lastSynced: '5h ago',
    },
  ])

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('instagram')
  const [newHandle, setNewHandle] = useState('')
  const [connectError, setConnectError] = useState('')

  // Dynamically compute stats from state
  const totalChannels = channels.length
  const activeConnections = channels.filter((c) => c.status === 'Connected').length
  const actionRequiredCount = channels.filter((c) => c.status === 'Action Required').length
  const hasWarnings = actionRequiredCount > 0

  const getPlatformDetails = (platform) => {
    switch (platform) {
      case 'instagram':
        return {
          icon: <Camera size={24} />,
          style: { background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' },
        }
      case 'tiktok':
        return {
          icon: <Music size={24} />,
          style: { backgroundColor: '#000000' },
        }
      case 'linkedin':
        return {
          icon: <Linkedin size={24} />,
          style: { backgroundColor: '#0077b5' },
        }
      case 'x':
        return {
          icon: <span className="font-bold text-xl leading-none">X</span>,
          style: { backgroundColor: '#000000' },
        }
      case 'youtube':
        return {
          icon: <Youtube size={24} />,
          style: { backgroundColor: '#FF0000' },
        }
      case 'facebook':
        return {
          icon: <Facebook size={24} />,
          style: { backgroundColor: '#1877F2' },
        }
      default:
        return {
          icon: <Link size={24} />,
          style: { backgroundColor: '#4F46E5' },
        }
    }
  }

  // Handle individual card connect/disconnect button clicks
  const handleChannelAction = (id, currentStatus) => {
    if (currentStatus === 'Connected') {
      // Disconnect channel
      setChannels((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: 'Disconnected', handle: 'Not linked', lastSynced: 'Waiting for authentication...' }
            : c
        )
      )
    } else {
      // Connect / Reconnect channel
      const handleInput = prompt('Enter account handle/name to link:', '@')
      if (handleInput && handleInput.trim() !== '' && handleInput !== '@') {
        setChannels((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, status: 'Connected', handle: handleInput, lastSynced: 'Just now' }
              : c
          )
        )
      }
    }
  }

  // Handle adding/connecting account via Top Right Modal
  const handleConnectSubmit = (e) => {
    e.preventDefault()
    if (!newHandle.trim()) {
      setConnectError('Please enter an account handle or username.')
      return
    }

    const platformNameMap = {
      instagram: 'Instagram Business',
      tiktok: 'TikTok Pro',
      linkedin: 'LinkedIn Company',
      x: 'X / Twitter',
      youtube: 'YouTube Studio',
      facebook: 'Facebook Page',
    }

    const formattedHandle = newHandle.startsWith('@') || selectedPlatform === 'linkedin' || selectedPlatform === 'facebook' || selectedPlatform === 'youtube'
      ? newHandle
      : `@${newHandle}`

    // Update existing matching platform to Connected, or append a new one
    setChannels((prev) => {
      const matchIndex = prev.findIndex((c) => c.platform === selectedPlatform)
      if (matchIndex > -1) {
        return prev.map((c, idx) =>
          idx === matchIndex
            ? { ...c, status: 'Connected', handle: formattedHandle, lastSynced: 'Just now' }
            : c
        )
      } else {
        // Add new platform if not found (though default list includes all 6, this is a clean fallback)
        return [
          ...prev,
          {
            id: selectedPlatform,
            name: platformNameMap[selectedPlatform] || selectedPlatform,
            platform: selectedPlatform,
            handle: formattedHandle,
            status: 'Connected',
            lastSynced: 'Just now',
          },
        ]
      }
    })

    setNewHandle('')
    setConnectError('')
    setIsConnectModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Social Channels"
        description="Manage your connected social accounts and synchronization status."
        action={
          <Button
            variant="primary"
            className="flex items-center gap-1.5 font-medium"
            onClick={() => setIsConnectModalOpen(true)}
          >
            <Plus size={18} />
            Connect New Account
          </Button>
        }
      />

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-6">
          <div className="w-12 h-12 rounded-control bg-accent-50 flex items-center justify-center text-accent">
            <Link size={24} className="stroke-2" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Active Connections</p>
            <p className="text-2xl font-bold text-ink mt-1">
              {activeConnections} / {totalChannels}
            </p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-6">
          <div className="w-12 h-12 rounded-control bg-primary-50 flex items-center justify-center text-primary-700">
            <RefreshCw size={24} className="stroke-2" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Sync Status</p>
            <p className={`text-2xl font-bold mt-1 ${hasWarnings ? 'text-warning' : 'text-accent-600'}`}>
              {hasWarnings ? 'Action Required' : 'Healthy'}
            </p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-6">
          <div className="w-12 h-12 rounded-control bg-red-50 flex items-center justify-center text-danger">
            <AlertTriangle size={24} className="stroke-2" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Action Required</p>
            <p className="text-2xl font-bold text-ink mt-1">
              {actionRequiredCount} {actionRequiredCount === 1 ? 'Account' : 'Accounts'}
            </p>
          </div>
        </Card>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => {
          const details = getPlatformDetails(channel.platform)
          return (
            <Card
              key={channel.id}
              className="p-6 flex flex-col justify-between hover:shadow-hover transition-all duration-150 transform hover:-translate-y-0.5 border border-border"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={details.style}
                  >
                    {details.icon}
                  </div>
                  <Badge
                    tone={
                      channel.status === 'Connected'
                        ? 'success'
                        : channel.status === 'Action Required'
                        ? 'danger'
                        : 'neutral'
                    }
                  >
                    {channel.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-ink">{channel.name}</h3>
                <p className="text-xs text-ink-muted mt-1">{channel.handle}</p>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      channel.status === 'Action Required' ? 'text-danger font-medium' : 'text-ink-muted'
                    }`}
                  >
                    {channel.status === 'Connected'
                      ? `Last synced: ${channel.lastSynced}`
                      : channel.status === 'Action Required'
                      ? 'Token expired. Reconnect needed.'
                      : 'Waiting for authentication...'}
                  </span>
                  {channel.status === 'Connected' && (
                    <CheckCircle2 size={16} className="text-accent" />
                  )}
                </div>
              </div>

              <Button
                className="mt-6 w-full"
                variant={channel.status === 'Connected' ? 'outline' : 'primary'}
                onClick={() => handleChannelAction(channel.id, channel.status)}
              >
                {channel.status === 'Connected'
                  ? 'Disconnect'
                  : channel.status === 'Action Required'
                  ? 'Reconnect'
                  : 'Connect Account'}
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Footer Info Banner */}
      <Card className="p-6 bg-canvas border border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h4 className="text-sm font-bold text-ink mb-1 flex items-center gap-1.5">
            <Shield size={16} className="text-primary-700" />
            Data Privacy &amp; Security
          </h4>
          <p className="text-xs text-ink-muted leading-relaxed">
            SocialAI uses OAuth 2.0 to securely access your accounts. We never store your passwords and only request the minimum permissions required to manage your content effectively.
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <Button
            variant="ghost"
            className="text-primary hover:underline h-auto p-0 font-semibold flex items-center gap-1 bg-transparent hover:bg-transparent"
            onClick={() => alert('Opening Help Center...')}
          >
            <HelpCircle size={16} />
            Help Center
          </Button>
          <Button
            variant="ghost"
            className="text-ink-muted hover:text-ink h-auto p-0 font-semibold bg-transparent hover:bg-transparent"
            onClick={() => alert('Opening Privacy Policy...')}
          >
            Privacy Policy
          </Button>
        </div>
      </Card>

      {/* Connect New Account Modal */}
      <Modal
        open={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect New Account"
      >
        <form onSubmit={handleConnectSubmit} className="space-y-4">
          {connectError && <p className="text-xs text-danger">{connectError}</p>}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Choose Social Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="instagram">Instagram Business</option>
              <option value="tiktok">TikTok Pro</option>
              <option value="linkedin">LinkedIn Company</option>
              <option value="x">X / Twitter</option>
              <option value="youtube">YouTube Studio</option>
              <option value="facebook">Facebook Page</option>
            </select>
          </div>

          <Input
            label="Account Handle or Page Name"
            required
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            placeholder="e.g. @mybrand_official or Brand Page"
          />

          <p className="text-xs text-ink-muted italic leading-relaxed">
            * Clicking Connect will redirect you to the platform's official OAuth consent page.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConnectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Connect Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
