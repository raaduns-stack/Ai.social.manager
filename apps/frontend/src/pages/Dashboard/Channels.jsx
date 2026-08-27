import { useState, useEffect } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'

import apiClient from '../../lib/api-client'
import Modal from '../../components/ui/Modal'
import Loader from '../../components/ui/Loader'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/error-banner'
import { trackEvent } from '../../lib/analytics'
// KYC overlay — rendered when user's KYC is not yet approved
import KycOverlay from '../../features/kyc/KycOverlay'
import { getMyKyc } from '../../features/kyc/kyc-api'
import {
  MessageSquare,
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
  // ---- KYC state ----
  // kycRecord: null (loading) | object (loaded). When kycRecord.status === 'approved'
  // the overlay is hidden and the user can interact with channels normally.
  const [kycRecord, setKycRecord] = useState(undefined) // undefined = loading
  const [kycLoading, setKycLoading] = useState(true)
  const [isKycModalOpen, setIsKycModalOpen] = useState(false)

  /** Fetch the user's KYC status. Re-called after submission to refresh state. */
  const fetchKyc = () => {
    setKycLoading(true)
    getMyKyc()
      .then((record) => setKycRecord(record))
      .catch(() => setKycRecord(null))
      .finally(() => setKycLoading(false))
  }

  useEffect(() => {
    fetchKyc()
  }, [])

  // True when the KYC overlay should be shown (block channel interactions)
  const kycBlocked = kycLoading || kycRecord?.status !== 'approved'

  // State for channels list
  const [channels, setChannels] = useState([]);

  // Helper to map backend status to UI status
  const mapStatus = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'action_required':
        return 'Action Required';
      default:
        return status;
    }
  };

  // Helper to generate display name from platform
  const getDisplayName = (platform) => {
    switch (platform) {
      case 'instagram':
        return 'Instagram Business';
      case 'tiktok':
        return 'TikTok Pro';
      case 'linkedin':
        return 'LinkedIn Company';
      case 'x':
        return 'X / Twitter';
      case 'youtube':
        return 'YouTube Studio';
      case 'facebook':
        return 'Facebook Page';
      case 'discord':
        return 'Discord Channel';
      default:
        return platform;
    }
  };

  // Function to fetch channels from backend
  const fetchChannels = () => {
    setLoading(true);
    setFetchError(null);
    apiClient
      .get('/social-accounts')
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data)) {
          const mapped = data.map((item) => ({
            id: item.id ?? item.platform,
            platform: item.platform,
            name: getDisplayName(item.platform),
            handle: item.accountHandle,
            status: mapStatus(item.status),
            lastSynced: item.connectedAt,
          }));
          setChannels(mapped);
        } else {
          console.error('Unexpected response format:', data);
          setChannels([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch social accounts:', error);
        setFetchError(error);
        setChannels([]);
        setLoading(false);
      });
  };

  // Fetch channels on component mount + check for OAuth callback query parameters
  useEffect(() => {
    fetchChannels();

    const params = new URLSearchParams(window.location.search);
    if (params.get('discord') === 'connected') {
      trackEvent('social_account_connected', { platform: 'discord' });
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchChannels();
    } else if (params.get('discord') === 'error') {
      const reason = params.get('reason') || 'authorization_failed';
      setFetchError(`Discord connection failed: ${reason}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  /** Helper to trigger Discord OAuth flow */
  const startDiscordOAuth = () => {
    apiClient
      .get('/channels/discord/connect')
      .then((res) => {
        if (res.data?.authUrl) {
          window.location.href = res.data.authUrl;
        }
      })
      .catch((err) => {
        console.error('Failed to initiate Discord connection:', err);
        setConnectError('Failed to initiate Discord OAuth flow. Please try again.');
      });
  };

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('instagram')
  const [newHandle, setNewHandle] = useState('')
  const [connectError, setConnectError] = useState('')

  // Dynamically compute stats from state
  // Stats will recompute automatically when channels change
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
      case 'discord':
        return {
          icon: <MessageSquare size={24} />,
          style: { backgroundColor: '#5865F2' },
        }
      default:
        return {
          icon: <Link size={24} />,
          style: { backgroundColor: '#FF6600' },
        }
    }
  }

  // Handle individual card connect/disconnect button clicks
  const handleChannelAction = (id, currentStatus) => {
    const channel = channels.find((c) => c.id === id);
    if (channel && channel.platform === 'discord' && currentStatus !== 'Connected') {
      startDiscordOAuth();
      return;
    }

    if (currentStatus === 'Connected') {
      // Disconnect channel via backend DELETE
      apiClient
        .delete(`/social-accounts/${id}`)
        .then(() => {
          if (channel) {
            trackEvent('social_account_disconnected', { platform: channel.platform })
          }
          fetchChannels();
        })
        .catch((error) => {
          console.error('Failed to disconnect channel:', error);
        });
    } else {
      // Connect or reconnect channel
      const handleInput = prompt('Enter account handle/name to link:', '@');
      if (handleInput && handleInput.trim() !== '' && handleInput !== '@') {
        if (channel && channel.id) {
          // Reconnect existing account: set status to connected
          apiClient
            .patch(`/social-accounts/${id}`, { status: 'connected' })
            .then(() => {
              if (channel) {
                trackEvent('social_account_connected', { platform: channel.platform })
              }
              fetchChannels();
            })
            .catch((error) => {
              console.error('Failed to reconnect channel:', error);
              setFetchError(error?.response?.data?.message || 'Failed to reconnect channel.');
            });
        } else {
          // New connection
          const payload = {
            platform: selectedPlatform,
            accountHandle: handleInput,
          };
          apiClient
            .post('/social-accounts', payload)
            .then(() => {
              trackEvent('social_account_connected', { platform: selectedPlatform })
              fetchChannels();
            })
            .catch((error) => {
              console.error('Failed to connect new channel:', error);
              setFetchError(error?.response?.data?.message || 'Failed to connect new channel.');
            });
        }
      }
    }
  };

  // Handle adding/connecting account via Top Right Modal
  const handleConnectSubmit = (e) => {
    e.preventDefault();
    if (selectedPlatform === 'discord') {
      startDiscordOAuth();
      setIsConnectModalOpen(false);
      return;
    }

    if (!newHandle.trim()) {
      setConnectError('Please enter an account handle or username.');
      return;
    }

    const payload = {
      platform: selectedPlatform,
      accountHandle:
        newHandle.startsWith('@') || selectedPlatform === 'linkedin' || selectedPlatform === 'facebook' || selectedPlatform === 'youtube'
          ? newHandle
          : `@${newHandle}`,
    };

    apiClient
      .post('/social-accounts', payload)
      .then(() => {
        trackEvent('social_account_connected', { platform: selectedPlatform })
        fetchChannels();
        setNewHandle('');
        setConnectError('');
        setIsConnectModalOpen(false);
      })
      .catch((error) => {
        console.error('Failed to connect account:', error);
        const errMsg = error?.response?.data?.message || 'Failed to connect account.';
        setConnectError(errMsg);
      });
  };

  return (
    <div className="relative">
      {!kycLoading && kycRecord?.status !== 'approved' && (
        <KycOverlay kycRecord={kycRecord} onRefresh={fetchKyc} />
      )}

      {/* Channels page content — faded when KYC overlay is active */}
      <div
        className={kycBlocked ? 'opacity-40 pointer-events-none select-none' : ''}
        aria-hidden={kycBlocked}
      >
        <div className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-t-4 border-t-primary flex items-center gap-6 hover:shadow-hover transition-all">
              <div className="w-12 h-12 rounded-control bg-primary/5 flex items-center justify-center text-primary">
                <Link size={24} className="stroke-2" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Active Connections</p>
                <p className="text-2xl font-bold text-ink mt-1">
                  {activeConnections} / {totalChannels}
                </p>
              </div>
            </Card>

            <Card className="p-6 border-t-4 border-t-secondary flex items-center gap-6 hover:shadow-hover transition-all">
              <div className="w-12 h-12 rounded-control bg-secondary/5 flex items-center justify-center text-secondary">
                <RefreshCw size={24} className="stroke-2" />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Sync Status</p>
                <p className={`text-2xl font-bold mt-1 ${hasWarnings ? 'text-warning' : 'text-primary'}`}>
                  {hasWarnings ? 'Action Required' : 'Healthy'}
                </p>
              </div>
            </Card>

            <Card className="p-6 border-t-4 border-t-primary flex items-center gap-6 hover:shadow-hover transition-all">
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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader />
              <p className="text-sm text-ink-muted mt-2">Loading connected channels...</p>
            </div>
          ) : fetchError ? (
            <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-control">
              <ErrorBanner error={fetchError} onDismiss={() => setFetchError(null)} />
              <Button variant="primary" onClick={fetchChannels}>Retry</Button>
            </div>
          ) : channels.length === 0 ? (
            <EmptyState
              title="No Social Channels Connected"
              description="You have no connected accounts. Link your first channel to start automating content."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map((channel) => {
                const details = getPlatformDetails(channel.platform)
                const isConnected = channel.status === 'Connected'
                return (
                  <Card
                    key={channel.id}
                    className={`p-6 flex flex-col justify-between hover:shadow-hover transition-all duration-150 transform hover:-translate-y-0.5 border ${
                      isConnected ? 'border-primary/20 bg-gradient-to-br from-surface to-primary/5 border-t-4 border-t-primary' : 'border-border'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-soft"
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
                      <p className="text-xs text-ink-muted mt-1 font-mono">{channel.handle}</p>

                      <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                        <span
                          className={`text-xs ${channel.status === 'Action Required' ? 'text-danger font-semibold' : 'text-ink-muted'
                            }`}
                        >
                          {channel.status === 'Connected'
                            ? `Synced: ${new Date(channel.lastSynced).toLocaleDateString()}`
                            : channel.status === 'Action Required'
                              ? 'Token expired. Reconnect needed.'
                              : 'Waiting for authentication...'}
                        </span>
                        {channel.status === 'Connected' && (
                          <CheckCircle2 size={16} className="text-primary" />
                        )}
                      </div>
                    </div>

                    <Button
                      className="mt-6 w-full font-semibold"
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
          )}

          <Card className="p-6 bg-canvas border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h4 className="text-sm font-bold text-ink mb-1 flex items-center gap-1.5">
                <Shield size={16} className="text-primary-700" />
                Data Privacy &amp; Security
              </h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Raasocial uses OAuth 2.0 to securely access your accounts. We never store your passwords and only request the minimum permissions required to manage your content effectively.
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
                  <option value="discord">Discord Channel</option>
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
      </div>
    </div>
  )
}
