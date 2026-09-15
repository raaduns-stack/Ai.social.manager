
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/auth-store'
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
import { useSearchParams } from 'react-router-dom'
import {
  MessageSquare,
  Camera,
  Music,
  Linkedin,
  Youtube,
  Facebook,
  Ghost,
  Plus,
  RefreshCw,
  Link,
  Shield,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'

export default function Channels() {
  const apiBase = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '')

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
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [newHandle, setNewHandle] = useState('');
  const [connectError, setConnectError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

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
      case 'tumblr':
        return 'Tumblr Blog';
      case 'discord':
        return 'Discord Channel';
      case 'snapchat':
        return 'Snapchat (Public Profile)';
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

  // Unified listener for all OAuth callbacks (Discord, Tumblr, Snapchat, TikTok)
  useEffect(() => {
    fetchChannels();

    const params = new URLSearchParams(window.location.search);
    let shouldCleanUrl = false;

    // Discord callback
    const discordStatus = params.get('discord');
    if (discordStatus === 'connected') {
      trackEvent('social_account_connected', { platform: 'discord' });
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: 'Discord channel connected successfully!', type: 'success' },
        })
      );
      shouldCleanUrl = true;
    } else if (discordStatus === 'error') {
      const reason = params.get('reason') || 'authorization_failed';
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: `Discord connection failed: ${decodeURIComponent(reason)}`, type: 'error' },
        })
      );
      shouldCleanUrl = true;
    }

    // Tumblr callback
    const tumblrStatus = params.get('tumblr');
    if (tumblrStatus === 'success') {
      trackEvent('social_account_connected', { platform: 'tumblr' });
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: 'Tumblr account connected successfully!', type: 'success' },
        })
      );
      shouldCleanUrl = true;
    } else if (tumblrStatus === 'error') {
      const message = params.get('message') || 'Failed to connect Tumblr account.';
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: `Tumblr connection failed: ${decodeURIComponent(message)}`, type: 'error' },
        })
      );
      shouldCleanUrl = true;
    }

    // Snapchat callback
    const snapConnected = params.get('connected');
    const snapError = params.get('snapchat_error');
    if (snapConnected === 'snapchat') {
      trackEvent('social_account_connected', { platform: 'snapchat' });
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: 'Snapchat connected successfully!', type: 'success' },
        })
      );
      shouldCleanUrl = true;
    } else if (snapError) {
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: `Snapchat connection failed: ${decodeURIComponent(snapError)}`, type: 'error' },
        })
      );
      shouldCleanUrl = true;
    }

    // TikTok callback
    const tiktokStatus = params.get('tiktok');
    if (tiktokStatus === 'connected') {
      trackEvent('social_account_connected', { platform: 'tiktok' });
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: 'TikTok account connected successfully!', type: 'success' },
        })
      );
      shouldCleanUrl = true;
    } else if (tiktokStatus === 'error') {
      const reason = params.get('reason') || 'authorization_failed';
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: `TikTok connection failed: ${decodeURIComponent(reason)}`, type: 'error' },
        })
      );
      shouldCleanUrl = true;
    }

    if (shouldCleanUrl) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      fetchChannels();
    }
  }, []);

  /** Helper to trigger Discord OAuth flow */
  const startDiscordOAuth = () => {
    setConnectLoading(true);
    setConnectError('');
    apiClient
      .get('/channels/discord/connect')
      .then((res) => {
        if (res.data?.authUrl) {
          setIsConnectModalOpen(false);
          window.location.href = res.data.authUrl;
        } else {
          throw new Error('No authorization URL returned by server.');
        }
      })
      .catch((err) => {
        console.error('Failed to initiate Discord connection:', err);
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to initiate Discord connection.';
        setConnectError(errMsg);
        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: {
              message: `Discord connection failed: ${errMsg}`,
              type: 'error',
            },
          })
        );
      })
      .finally(() => {
        setConnectLoading(false);
      });
  };

  /** Helper to trigger TikTok OAuth flow */
  const startTikTokOAuth = () => {
    setConnectLoading(true);
    setConnectError('');
    apiClient
      .get('/channels/tiktok/connect')
      .then((res) => {
        if (res.data?.authUrl) {
          setIsConnectModalOpen(false);
          window.location.href = res.data.authUrl;
        } else {
          throw new Error('No authorization URL returned by server.');
        }
      })
      .catch((err) => {
        console.error('Failed to initiate TikTok connection:', err);
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to initiate TikTok connection.';
        setConnectError(errMsg);
        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: {
              message: `TikTok connection failed: ${errMsg}`,
              type: 'error',
            },
          })
        );
      })
      .finally(() => {
        setConnectLoading(false);
      });
  };

  /** Helper to trigger Tumblr OAuth flow */
  const startTumblrOAuth = () => {
    setConnectLoading(true);
    setConnectError('');
    apiClient
      .get('/channels/tumblr/connect')
      .then((res) => {
        if (res.data?.authUrl) {
          setIsConnectModalOpen(false);
          window.location.href = res.data.authUrl;
        } else {
          throw new Error('No authorization URL returned by server.');
        }
      })
      .catch((err) => {
        console.error('Failed to initiate Tumblr connection:', err);
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to initiate Tumblr connection.';
        setConnectError(errMsg);
        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: {
              message: `Tumblr connection failed: ${errMsg}`,
              type: 'error',
            },
          })
        );
      })
      .finally(() => {
        setConnectLoading(false);
      });
  };

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
      case 'tumblr':
        return {
          icon: <span className="font-heading text-xl font-bold leading-none">t</span>,
          style: { backgroundColor: '#35465d' },
        }
      case 'discord':
        return {
          icon: <MessageSquare size={24} />,
          style: { backgroundColor: '#5865F2' },
        }
      case 'snapchat':
        return {
          icon: <Ghost size={24} />,
          style: { backgroundColor: '#FFFC00', color: '#000000' },
        }
      default:
        return {
          icon: <Link size={24} />,
          style: { backgroundColor: '#FF6600' },
        }
    }
  }

  /** Initiate Snapchat OAuth: ask backend for the auth URL, then redirect the browser. */
  const handleSnapchatConnect = async () => {
    setConnectLoading(true);
    setConnectError('');
    try {
      const res = await apiClient.get('/social-accounts/snapchat/connect?json=true');
      const { url } = res.data;
      if (!url) throw new Error('No authorization URL returned by the server.');
      // Close modal before redirecting so it doesn't flash on return
      setIsConnectModalOpen(false);
      window.location.href = url;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to start Snapchat OAuth. Please try again.';
      setConnectError(msg);
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: `Snapchat connection failed: ${msg}`,
            type: 'error',
          },
        })
      );
    } finally {
      setConnectLoading(false);
    }
  };

  // Handle individual card connect/disconnect button clicks
  const handleChannelAction = (id, currentStatus) => {
    const channel = channels.find((c) => c.id === id);

    if (currentStatus === 'Connected') {
      // Disconnect channel via backend DELETE
      apiClient
        .delete(`/social-accounts/${id}`)
        .then(() => {
          if (channel) {
            trackEvent('social_account_disconnected', { platform: channel.platform });
          }
          window.dispatchEvent(
            new CustomEvent('app-toast', {
              detail: {
                message: `${channel?.name || 'Channel'} disconnected successfully.`,
                type: 'success',
              },
            })
          );
          fetchChannels();
        })
        .catch((error) => {
          console.error('Failed to disconnect channel:', error);
          window.dispatchEvent(
            new CustomEvent('app-toast', {
              detail: {
                message: error?.response?.data?.message || 'Failed to disconnect channel.',
                type: 'error',
              },
            })
          );
        });
      return;
    }

    // Reconnecting or connecting
    if (channel?.platform === 'snapchat') {
      handleSnapchatConnect();
      return;
    }
    if (channel?.platform === 'discord') {
      startDiscordOAuth();
      return;
    }
    if (channel?.platform === 'tiktok') {
      startTikTokOAuth();
      return;
    }
    if (channel?.platform === 'tumblr') {
      startTumblrOAuth();
      return;
    }

    // Direct handle platform reconnect
    if (channel && channel.id) {
      apiClient
        .patch(`/social-accounts/${id}`, { status: 'connected' })
        .then(() => {
          trackEvent('social_account_connected', { platform: channel.platform });
          window.dispatchEvent(
            new CustomEvent('app-toast', {
              detail: {
                message: `${channel.name} reconnected successfully!`,
                type: 'success',
              },
            })
          );
          fetchChannels();
        })
        .catch((error) => {
          console.error('Failed to reconnect channel:', error);
          setFetchError(error?.response?.data?.message || 'Failed to reconnect channel.');
        });
    } else {
      setSelectedPlatform(channel?.platform || 'instagram');
      setIsConnectModalOpen(true);
    }
  };

  // Handle adding/connecting account via Top Right Modal
  const handleConnectSubmit = (e) => {
    e.preventDefault();

    if (selectedPlatform === 'snapchat') {
      handleSnapchatConnect();
      return;
    }

    if (selectedPlatform === 'discord') {
      startDiscordOAuth();
      return;
    }

    if (selectedPlatform === 'tiktok') {
      startTikTokOAuth();
      return;
    }

    if (selectedPlatform === 'tumblr') {
      startTumblrOAuth();
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

    setConnectLoading(true);
    setConnectError('');
    apiClient
      .post('/social-accounts', payload)
      .then(() => {
        trackEvent('social_account_connected', { platform: selectedPlatform });
        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: {
              message: `${getDisplayName(selectedPlatform)} connected successfully!`,
              type: 'success',
            },
          })
        );
        fetchChannels();
        setNewHandle('');
        setConnectError('');
        setIsConnectModalOpen(false);
      })
      .catch((error) => {
        console.error('Failed to connect account:', error);
        const errMsg = error?.response?.data?.message || 'Failed to connect account.';
        setConnectError(errMsg);
      })
      .finally(() => {
        setConnectLoading(false);
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
              <div className="relative w-full md:w-auto flex justify-start md:justify-end">
                <Button
                  variant="primary"
                  className="flex items-center gap-1.5 font-medium w-full md:w-auto justify-center"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Plus size={18} />
                  Connect Account
                  <ChevronDown size={16} />
                </Button>
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-control border border-border bg-surface shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 text-xs font-semibold text-ink-muted border-b border-border/40 mb-1 uppercase tracking-wider">
                        Select Platform
                      </div>
                      {[
                        { key: 'instagram', label: 'Instagram Business', icon: <Camera size={14} className="text-pink-500" /> },
                        { key: 'tiktok', label: 'TikTok Pro', icon: <Music size={14} className="text-ink" /> },
                        { key: 'linkedin', label: 'LinkedIn Company', icon: <Linkedin size={14} className="text-primary" /> },
                        { key: 'x', label: 'X / Twitter', icon: <span className="font-bold text-xs leading-none text-ink">X</span> },
                        { key: 'youtube', label: 'YouTube Studio', icon: <Youtube size={14} className="text-red-500" /> },
                        { key: 'facebook', label: 'Facebook Page', icon: <Facebook size={14} className="text-blue-600" /> },
                        { key: 'tumblr', label: 'Tumblr Blog', icon: <span className="font-heading text-sm font-bold leading-none text-blue-900">t</span> },
                        { key: 'discord', label: 'Discord Channel', icon: <MessageSquare size={14} className="text-indigo-500" /> },
                        { key: 'snapchat', label: 'Snapchat', icon: <Ghost size={14} className="text-black" /> },
                      ].map((plat) => (
                        <button
                          key={plat.key}
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-canvas flex items-center gap-2.5 transition-colors font-medium"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (plat.key === 'snapchat') {
                              handleSnapchatConnect();
                            } else if (plat.key === 'discord') {
                              startDiscordOAuth();
                            } else if (plat.key === 'tiktok') {
                              startTikTokOAuth();
                            } else if (plat.key === 'tumblr') {
                              startTumblrOAuth();
                            } else {
                              setSelectedPlatform(plat.key);
                              setIsConnectModalOpen(true);
                            }
                          }}
                        >
                          <span className="w-5 h-5 rounded bg-canvas flex items-center justify-center shrink-0">
                            {plat.icon}
                          </span>
                          {plat.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
                const isSnapchat = channel.platform === 'snapchat'
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
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-soft ${isSnapchat ? 'text-black' : 'text-white'}`}
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
                            ? `Synced: ${channel.lastSynced ? new Date(channel.lastSynced).toLocaleDateString() : 'Active'}`
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
                  onChange={(e) => { setSelectedPlatform(e.target.value); setConnectError(''); setNewHandle(''); }}
                  className="h-10 rounded-control border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="instagram">Instagram Business</option>
                  <option value="discord">Discord Channel</option>
                  <option value="tiktok">TikTok Pro</option>
                  <option value="linkedin">LinkedIn Company</option>
                  <option value="x">X / Twitter</option>
                  <option value="youtube">YouTube Studio</option>
                  <option value="facebook">Facebook Page</option>
                  <option value="tumblr">Tumblr Blog</option>
                  <option value="snapchat">Snapchat (Public Profile)</option>
                </select>
              </div>

              {['snapchat', 'discord', 'tiktok', 'tumblr'].includes(selectedPlatform) ? (
                <div className="rounded-control border border-primary/20 bg-primary/5 p-4 text-sm text-ink leading-relaxed">
                  <div className="font-semibold text-primary mb-1">OAuth Authorization Required</div>
                  {selectedPlatform === 'snapchat' && 'Snapchat uses OAuth 2.0. Clicking Connect will redirect you to Snapchat to authorize access to your Public Profile.'}
                  {selectedPlatform === 'discord' && 'Discord uses OAuth 2.0. Clicking Connect will redirect you to Discord to authorize your bot and select a channel.'}
                  {selectedPlatform === 'tiktok' && 'TikTok Pro uses Login Kit. Clicking Connect will redirect you to TikTok to authorize video uploads and profile access.'}
                  {selectedPlatform === 'tumblr' && 'Tumblr uses OAuth 1.0a. Clicking Connect will redirect you to Tumblr to authorize access to your blogs.'}
                </div>
              ) : (
                <Input
                  label="Account Handle or Page Name"
                  required
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="e.g. @mybrand_official or Brand Page"
                />
              )}

              <p className="text-xs text-ink-muted italic leading-relaxed">
                * Connecting channels securely links your official account with RaaSocial.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConnectModalOpen(false)}
                  disabled={connectLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={connectLoading}>
                  {connectLoading
                    ? 'Connecting...'
                    : ['snapchat', 'discord', 'tiktok', 'tumblr'].includes(selectedPlatform)
                      ? `Connect via ${getDisplayName(selectedPlatform).split(' ')[0]}`
                      : 'Connect Account'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  )
}
