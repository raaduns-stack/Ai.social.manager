import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  Music,
  Linkedin,
  Youtube,
  Facebook,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram Business', type: 'instagram', color: 'bg-pink-600', icon: <Camera size={20} /> },
  { id: 'facebook', name: 'Facebook Page', type: 'facebook', color: 'bg-blue-600', icon: <Facebook size={20} /> },
  { id: 'linkedin', name: 'LinkedIn Company', type: 'linkedin', color: 'bg-blue-700', icon: <Linkedin size={20} /> },
  { id: 'tiktok', name: 'TikTok Pro', type: 'tiktok', color: 'bg-black', icon: <Music size={20} /> },
  { id: 'youtube', name: 'YouTube Studio', type: 'youtube', color: 'bg-red-600', icon: <Youtube size={20} /> },
  { id: 'x', name: 'X / Twitter', type: 'x', color: 'bg-black', icon: <span className="font-bold text-sm">X</span> },
]

export default function ConnectAccountsOnboarding() {
  const navigate = useNavigate()
  const [connections, setConnections] = useState({})

  const handleConnect = (platformId) => {
    const handle = prompt(`Enter your handle for ${platformId}:`, '@')
    if (handle && handle.trim() !== '' && handle !== '@') {
      setConnections((prev) => ({
        ...prev,
        [platformId]: handle.trim(),
      }))
    }
  }

  const handleDisconnect = (platformId) => {
    setConnections((prev) => {
      const updated = { ...prev }
      delete updated[platformId]
      return updated
    })
  }

  const handleNext = () => {
    // Save current connected channels to localStorage if needed
    localStorage.setItem('onboarding_connected_accounts', JSON.stringify(connections))
    navigate('/setup/brand-voice')
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <LinkIcon className="text-primary w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Connect Social Channels</h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Link your profiles to automate content scheduling. You can connect or change these anytime.
        </p>
      </div>

      <Card className="p-6 space-y-4 bg-surface border border-border">
        <div className="divide-y divide-border">
          {PLATFORMS.map((platform) => {
            const isConnected = !!connections[platform.id]
            const handle = connections[platform.id]

            return (
              <div key={platform.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{platform.name}</h3>
                    {isConnected ? (
                      <p className="text-xs text-accent flex items-center gap-1 font-medium mt-0.5">
                        <CheckCircle2 size={12} /> Connected as {handle}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-muted mt-0.5">Not connected</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => (isConnected ? handleDisconnect(platform.id) : handleConnect(platform.id))}
                  variant={isConnected ? 'outline' : 'primary'}
                  size="sm"
                  className="font-medium px-4 cursor-pointer"
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            )
          })}
        </div>

        <div className="pt-4 flex flex-col items-center gap-4 border-t border-border">
          <Button
            onClick={handleNext}
            variant="primary"
            size="lg"
            className="w-full font-semibold cursor-pointer"
          >
            {Object.keys(connections).length > 0 ? 'Next: Custom AI Tone' : 'Next Step'}
          </Button>

          <button
            onClick={() => navigate('/setup/brand-voice')}
            className="text-xs font-semibold text-ink-muted hover:text-primary transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </Card>
    </div>
  )
}
