import { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  FileCheck2,
  Code2,
  User,
  Building2,
  CreditCard,
  ChevronDown,
  X,
  Save,
  Check,
  Ban,
  ArrowRight,
  Info,
  ExternalLink,
  Trash2,
  Copy,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ErrorBanner from '../../components/error-banner';
import {
  getDesignerPaymentDashboard,
  getDesignerEarnings,
  getDesignerPaymentRecords,
  updateDesignerPaymentStatus,
  deleteDesignerPaymentRecord,
  getDesignerPaymentSettings,
  updateDesignerPaymentSettings,
} from '../../features/admin/designer-payments-api';

// Currency formatter for kobo to Naira
const formatNaira = (kobo) => {
  const value = (kobo || 0) / 100;
  return '₦' + value.toLocaleString('en-NG', { maximumFractionDigits: 0 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'successful':
    case 'paid':
      return { tone: 'success', label: 'Successful' };
    case 'approved':
      return { tone: 'primary', label: 'Approved' };
    case 'processing':
      return { tone: 'warning', label: 'Processing' };
    case 'pending':
      return { tone: 'warning', label: 'Pending' };
    case 'failed':
      return { tone: 'danger', label: 'Failed' };
    case 'declined':
      return { tone: 'danger', label: 'Declined' };
    default:
      return { tone: 'neutral', label: status || 'Pending' };
  }
};

const WEEKDAY_NAMES = [
  { val: 1, label: 'Monday' },
  { val: 2, label: 'Tuesday' },
  { val: 3, label: 'Wednesday' },
  { val: 4, label: 'Thursday' },
  { val: 5, label: 'Friday' },
  { val: 6, label: 'Saturday' },
  { val: 7, label: 'Sunday' },
];

export default function DesignerPayments() {
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'earnings' | 'settings'

  // Data states
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Settings edit form state
  const [settingsForm, setSettingsForm] = useState({
    perImageNaira: 5000,
    perImageToCodeNaira: 10000,
    payoutSchedule: 'weekly',
    payoutDayOfWeek: 2,
    payoutDayOfMonth: 28,
    manualPayoutFeePercent: 2,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState(null);

  // Copy to clipboard state for bank details
  const [copiedKey, setCopiedKey] = useState(null);

  // Status Action Modal state
  const [actionModal, setActionModal] = useState({
    open: false,
    record: null,
    targetStatus: '',
    title: '',
    notes: '',
    submitting: false,
  });

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedStats, fetchedEarnings, fetchedRecords, fetchedSettings] = await Promise.all([
        getDesignerPaymentDashboard(),
        getDesignerEarnings(),
        getDesignerPaymentRecords(),
        getDesignerPaymentSettings(),
      ]);

      setStats(fetchedStats);
      setEarnings(fetchedEarnings);
      setRecords(fetchedRecords);
      setSettings(fetchedSettings);

      setSettingsForm({
        perImageNaira: (fetchedSettings.perImageAmount || 0) / 100,
        perImageToCodeNaira: (fetchedSettings.perImageToCodeAmount || 0) / 100,
        payoutSchedule: fetchedSettings.payoutSchedule || 'weekly',
        payoutDayOfWeek: fetchedSettings.payoutDayOfWeek || 2,
        payoutDayOfMonth: fetchedSettings.payoutDayOfMonth || 28,
        manualPayoutFeePercent: fetchedSettings.manualPayoutFeePercent ?? 2,
      });
    } catch (err) {
      console.error('Failed to load designer payments:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load designer payments data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered payment records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'successful' && (r.status === 'successful' || r.status === 'paid')) ||
        r.status?.toLowerCase() === statusFilter.toLowerCase();

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        r.designerName?.toLowerCase().includes(q) ||
        r.designerEmail?.toLowerCase().includes(q) ||
        r.reference?.toLowerCase().includes(q) ||
        r.period?.toLowerCase().includes(q) ||
        r.bankName?.toLowerCase().includes(q) ||
        r.accountNumber?.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [records, statusFilter, searchQuery]);

  // Filtered designers
  const filteredEarnings = useMemo(() => {
    return earnings.filter((d) => {
      const q = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        d.fullName?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.paymentMethod?.bankName?.toLowerCase().includes(q)
      );
    });
  }, [earnings, searchQuery]);

  // Handle saving settings
  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const payload = {
        perImageAmount: Math.round(Number(settingsForm.perImageNaira) * 100),
        perImageToCodeAmount: Math.round(Number(settingsForm.perImageToCodeNaira) * 100),
        payoutSchedule: settingsForm.payoutSchedule,
        payoutDayOfWeek: Number(settingsForm.payoutDayOfWeek),
        payoutDayOfMonth: Number(settingsForm.payoutDayOfMonth),
        manualPayoutFeePercent: Number(settingsForm.manualPayoutFeePercent),
      };

      const updated = await updateDesignerPaymentSettings(payload);
      setSettings(updated);

      // Refresh dashboard & earnings to reflect newly updated global earning settings immediately
      const [refreshedStats, refreshedEarnings] = await Promise.all([
        getDesignerPaymentDashboard(),
        getDesignerEarnings(),
      ]);
      setStats(refreshedStats);
      setEarnings(refreshedEarnings);

      setSettingsMsg({ type: 'success', text: 'Global earning & payout settings updated successfully!' });
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: { message: 'Settings saved & earnings recalculated.', type: 'success' },
        })
      );
      setTimeout(() => setSettingsMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setSettingsMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to update settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Copy bank details helper for Admin external payment coordination
  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: { message: `Copied: ${text}`, type: 'success' },
      })
    );
  };

  // Open status action confirmation modal
  const openStatusActionModal = (record, targetStatus, title) => {
    setActionModal({
      open: true,
      record,
      targetStatus,
      title,
      notes: record.notes || '',
      submitting: false,
    });
  };

  // Execute status update
  const handleConfirmStatusAction = async () => {
    if (!actionModal.record || !actionModal.targetStatus) return;
    setActionModal((prev) => ({ ...prev, submitting: true }));
    try {
      await updateDesignerPaymentStatus(actionModal.record.id, {
        status: actionModal.targetStatus,
        notes: actionModal.notes,
      });

      // Refresh records and dashboard
      const [refreshedRecords, refreshedStats, refreshedEarnings] = await Promise.all([
        getDesignerPaymentRecords(),
        getDesignerPaymentDashboard(),
        getDesignerEarnings(),
      ]);
      setRecords(refreshedRecords);
      setStats(refreshedStats);
      setEarnings(refreshedEarnings);

      setActionModal((prev) => ({ ...prev, open: false, submitting: false }));
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: `Payment status updated to "${actionModal.targetStatus.toUpperCase()}".`,
            type: 'success',
          },
        })
      );
    } catch (err) {
      console.error(err);
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: err?.response?.data?.message || 'Failed to update payment status.',
            type: 'error',
          },
        })
      );
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Are you sure you want to delete payment record "${record.reference}"?`)) {
      return;
    }
    try {
      await deleteDesignerPaymentRecord(record.id);
      const [refreshedRecords, refreshedStats, refreshedEarnings] = await Promise.all([
        getDesignerPaymentRecords(),
        getDesignerPaymentDashboard(),
        getDesignerEarnings(),
      ]);
      setRecords(refreshedRecords);
      setStats(refreshedStats);
      setEarnings(refreshedEarnings);
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: `Payment record ${record.reference} deleted successfully.`,
            type: 'success',
          },
        })
      );
    } catch (err) {
      console.error(err);
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: err?.response?.data?.message || 'Failed to delete payment record.',
            type: 'error',
          },
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw size={36} className="text-primary animate-spin" />
        <span className="text-sm font-semibold text-ink-muted">Loading Designer Payment Management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Designer Payment Management"
        description="Oversee designer earnings, verify and process payouts, configure global payout schedules, and manage manual payouts."
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              className="gap-2"
              title="Refresh payments"
            >
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        }
      />

      {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

      {/* Payout Schedule Banner */}
      {stats?.schedule && (
        <div className="bg-gradient-to-r from-primary-50 via-surface to-accent-50 border border-primary-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <div className="font-semibold text-ink flex items-center gap-2">
                <span>Scheduled Payout Cycle: {stats.schedule.description}</span>
                {stats.schedule.isTodayGlobalPayout && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    TODAY IS PAYOUT DAY
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Next scheduled payout: <span className="font-medium text-ink">{formatDate(stats.schedule.nextDate)}</span>.
                Manual early payout charge: <span className="font-bold text-amber-700">{settingsForm.manualPayoutFeePercent}%</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start md:self-auto cursor-pointer"
          >
            Configure Schedule <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hover className="p-5 flex flex-col justify-between border-l-4 border-l-primary">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Total Designer Earnings</span>
            <div className="p-2 rounded-lg bg-primary-50 text-primary">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-ink">{formatNaira(stats?.totalDesignerEarnings)}</div>
            <p className="text-xs text-ink-muted mt-1">Total approved design & code work</p>
          </div>
        </Card>

        <Card hover className="p-5 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Pending Payments</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-ink">{formatNaira(stats?.pendingPayments)}</div>
            <p className="text-xs text-ink-muted mt-1">{stats?.pendingPayoutsCount || 0} payout requests in queue</p>
          </div>
        </Card>

        <Card hover className="p-5 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Processed Payments</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-ink">{formatNaira(stats?.processedPayments)}</div>
            <p className="text-xs text-ink-muted mt-1">{stats?.processedPayoutsCount || 0} completed payouts</p>
          </div>
        </Card>

        <Card hover className="p-5 flex flex-col justify-between border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Outstanding Payments</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-ink">{formatNaira(stats?.outstandingPayments)}</div>
            <p className="text-xs text-ink-muted mt-1">Approved balance available for payout</p>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {[
            { id: 'records', label: 'Pending Payouts', count: records.length },
            { id: 'earnings', label: 'Designer Earnings', count: earnings.length },
            { id: 'settings', label: 'Global Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-ink-muted border-transparent hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-primary-100 text-primary font-bold' : 'bg-canvas text-ink-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Pending Payouts */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search by reference, designer, bank or account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="successful">Successful / Paid</option>
                <option value="failed">Failed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>

          {/* Records Table Card */}
          <Card className="overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-canvas border-b border-border text-ink-muted font-semibold text-xs uppercase tracking-wider">
                    <th className="p-4">Reference & Type</th>
                    <th className="p-4">Designer</th>
                    <th className="p-4">Gross Amount</th>
                    <th className="p-4">Early Fee</th>
                    <th className="p-4">Net Payout</th>
                    <th className="p-4">Bank Details (Copy)</th>
                    <th className="p-4">Related Work</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-ink-muted">
                        <Wallet size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-ink">No pending payouts found</p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {records.length === 0
                            ? 'Payout requests submitted by designers awaiting Admin review will appear here.'
                            : 'Try adjusting your status filter or search query.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const badge = getStatusBadge(record.status);
                      const isManual = record.payoutType === 'manual';
                      return (
                        <tr key={record.id} className="hover:bg-canvas/50 transition-colors">
                          <td className="p-4">
                            <div className="font-mono text-xs font-bold text-ink">{record.reference}</div>
                            <div className="mt-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isManual ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isManual ? 'Manual Payout' : 'Scheduled Payout'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-ink">{record.designerName}</div>
                            <div className="text-xs text-ink-muted">{record.designerEmail}</div>
                          </td>
                          <td className="p-4 font-semibold text-ink">{formatNaira(record.amount)}</td>
                          <td className="p-4">
                            {record.fee > 0 ? (
                              <span className="font-semibold text-amber-700">
                                -{formatNaira(record.fee)}{' '}
                                <span className="text-[10px] text-amber-600 block">({settings?.manualPayoutFeePercent ?? 2}% early fee)</span>
                              </span>
                            ) : (
                              <span className="text-xs text-ink-muted">₦0</span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-primary text-base">
                            {formatNaira(record.netAmount || record.amount - (record.fee || 0))}
                          </td>
                          <td className="p-4 text-xs">
                            <div className="flex items-center gap-1.5 font-medium text-ink">
                              <span>{record.bankName || 'Bank Transfer'}</span>
                              {record.bankName && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(record.bankName, `bank-${record.id}`)}
                                  className="text-ink-muted hover:text-primary transition-colors cursor-pointer p-0.5"
                                  title="Copy Bank Name"
                                >
                                  {copiedKey === `bank-${record.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-ink-muted mt-0.5">
                              <span>{record.accountNumber || '—'}</span>
                              {record.accountNumber && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(record.accountNumber, `acc-${record.id}`)}
                                  className="text-ink-muted hover:text-primary transition-colors cursor-pointer p-0.5"
                                  title="Copy Account Number"
                                >
                                  {copiedKey === `acc-${record.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              )}
                            </div>
                            {record.accountName && (
                              <div className="flex items-center gap-1.5 text-ink-muted text-[11px] mt-0.5">
                                <span className="truncate max-w-[140px]">{record.accountName}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(record.accountName, `name-${record.id}`)}
                                  className="text-ink-muted hover:text-primary transition-colors cursor-pointer p-0.5"
                                  title="Copy Account Name"
                                >
                                  {copiedKey === `name-${record.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-xs max-w-[200px]">
                            <div className="font-medium text-ink truncate">{record.relatedWork || '—'}</div>
                            <div className="text-ink-muted truncate">{record.period || '—'}</div>
                          </td>
                          <td className="p-4">
                            <Badge tone={badge.tone} className="capitalize font-semibold">
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-xs text-ink-muted">
                            <div>{formatDate(record.createdAt)}</div>
                            {record.paidAt && (
                              <div className="text-[10px] text-emerald-700">Paid {formatDate(record.paidAt)}</div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {record.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      openStatusActionModal(
                                        record,
                                        'approved',
                                        `Approve Payout: ${record.reference}`
                                      )
                                    }
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openStatusActionModal(
                                        record,
                                        'declined',
                                        `Decline Payout: ${record.reference}`
                                      )
                                    }
                                    className="text-red-600 hover:bg-red-50 border-red-200 text-xs px-2.5 py-1"
                                  >
                                    Decline
                                  </Button>
                                </>
                              )}

                              {record.status === 'approved' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      openStatusActionModal(
                                        record,
                                        'processing',
                                        `Move to Processing: ${record.reference}`
                                      )
                                    }
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1"
                                  >
                                    Process
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      openStatusActionModal(
                                        record,
                                        'successful',
                                        `Mark Successful: ${record.reference}`
                                      )
                                    }
                                    className="bg-primary text-white text-xs px-2.5 py-1"
                                  >
                                    Mark Paid
                                  </Button>
                                </>
                              )}

                              {record.status === 'processing' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      openStatusActionModal(
                                        record,
                                        'successful',
                                        `Mark Successful: ${record.reference}`
                                      )
                                    }
                                    className="bg-primary text-white text-xs px-2.5 py-1"
                                  >
                                    Mark Paid
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openStatusActionModal(
                                        record,
                                        'failed',
                                        `Mark Failed: ${record.reference}`
                                      )
                                    }
                                    className="text-red-600 hover:bg-red-50 text-xs px-2.5 py-1"
                                  >
                                    Failed
                                  </Button>
                                </>
                              )}

                              {(record.status === 'successful' || record.status === 'paid') && (
                                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                                  <Check size={14} /> Completed
                                </span>
                              )}

                              {(record.status === 'failed' || record.status === 'declined') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openStatusActionModal(
                                      record,
                                      'pending',
                                      `Re-queue Payout: ${record.reference}`
                                    )
                                  }
                                  className="text-xs text-ink-muted hover:text-ink px-2 py-1"
                                >
                                  Re-open
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRecord(record)}
                                className="text-red-500 hover:bg-red-50 hover:text-red-700 border-border hover:border-red-200 text-xs px-2 py-1"
                                title="Delete payment record"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Designer Earnings */}
      {activeTab === 'earnings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search designer by name, email or bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-ink-muted">
              Earnings calculated from: <span className="font-semibold text-ink">{formatNaira(settings?.perImageAmount)}</span>/image •{' '}
              <span className="font-semibold text-ink">{formatNaira(settings?.perImageToCodeAmount)}</span>/image-to-code
            </p>
          </div>

          <Card className="overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-canvas border-b border-border text-ink-muted font-semibold text-xs uppercase tracking-wider">
                    <th className="p-4">Designer</th>
                    <th className="p-4">Approved Designs</th>
                    <th className="p-4">Approved Code</th>
                    <th className="p-4">Approved Earnings</th>
                    <th className="p-4">Pending Work</th>
                    <th className="p-4">Paid Out</th>
                    <th className="p-4">Available Earnings</th>
                    <th className="p-4">Bank Payout Info (Copy)</th>
                    <th className="p-4">Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEarnings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-ink-muted">
                        No designers found.
                      </td>
                    </tr>
                  ) : (
                    filteredEarnings.map((designer) => (
                      <tr key={designer.designerId} className="hover:bg-canvas/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary font-bold flex items-center justify-center shrink-0">
                              {designer.fullName?.slice(0, 2).toUpperCase() || 'DE'}
                            </div>
                            <div>
                              <div className="font-semibold text-ink">{designer.fullName}</div>
                              <div className="text-xs text-ink-muted">{designer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-ink flex items-center gap-1.5">
                            <FileCheck2 size={16} className="text-emerald-600" />
                            {designer.approvedImagesCount} {designer.approvedImagesCount === 1 ? 'image' : 'images'}
                          </div>
                          <div className="text-[11px] text-ink-muted">
                            @{formatNaira(settings?.perImageAmount)} each
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-ink flex items-center gap-1.5">
                            <Code2 size={16} className="text-indigo-600" />
                            {designer.acceptedImageToCodeCount} conversions
                          </div>
                          <div className="text-[11px] text-ink-muted">
                            @{formatNaira(settings?.perImageToCodeAmount)} each
                          </div>
                        </td>
                        <td className="p-4 font-bold text-ink">
                          {formatNaira(designer.approvedEarnings)}
                        </td>
                        <td className="p-4 text-xs">
                          <div className="font-medium text-amber-700">
                            {formatNaira(designer.pendingEarnings)}
                          </div>
                          <div className="text-ink-muted text-[11px]">
                            {designer.pendingImagesCount} img • {designer.pendingImageToCodeCount} code pending
                          </div>
                        </td>
                        <td className="p-4 font-medium text-emerald-700">
                          {formatNaira(designer.paidEarnings)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-black text-base ${
                              (designer.availableBalance ?? designer.outstandingBalance) > 0 ? 'text-primary' : 'text-ink-muted'
                            }`}
                          >
                            {formatNaira(designer.availableBalance ?? designer.outstandingBalance)}
                          </span>
                        </td>
                        <td className="p-4 text-xs">
                          {designer.paymentMethod ? (
                            <div>
                              <div className="flex items-center gap-1.5 font-medium text-ink">
                                <span>{designer.paymentMethod.bankName}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(designer.paymentMethod.bankName, `d-bank-${designer.designerId}`)}
                                  className="text-ink-muted hover:text-primary transition-colors cursor-pointer p-0.5"
                                  title="Copy Bank Name"
                                >
                                  {copiedKey === `d-bank-${designer.designerId}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-ink-muted mt-0.5">
                                <span>{designer.paymentMethod.accountNumber}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(designer.paymentMethod.accountNumber, `d-acc-${designer.designerId}`)}
                                  className="text-ink-muted hover:text-primary transition-colors cursor-pointer p-0.5"
                                  title="Copy Account Number"
                                >
                                  {copiedKey === `d-acc-${designer.designerId}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                              {designer.paymentMethod.accountName && (
                                <div className="flex items-center gap-1.5 text-ink-muted text-[11px] mt-0.5">
                                  <span className="truncate max-w-[130px]">{designer.paymentMethod.accountName}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(designer.paymentMethod.accountName, `d-name-${designer.designerId}`)}
                                    className="text-ink-muted hover:text-primary transition-colors cursor-pointer p-0.5"
                                    title="Copy Account Name"
                                  >
                                    {copiedKey === `d-name-${designer.designerId}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-600 text-xs italic">No bank details</span>
                          )}
                        </td>
                        <td className="p-4">
                          {designer.pendingPayouts > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              <Clock size={12} /> Pending Request ({formatNaira(designer.pendingPayouts)})
                            </span>
                          ) : (designer.availableBalance ?? designer.outstandingBalance) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              <CheckCircle2 size={12} /> Eligible ({formatNaira(designer.availableBalance ?? designer.outstandingBalance)})
                            </span>
                          ) : designer.approvedEarnings > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <Check size={12} /> All Settled
                            </span>
                          ) : (
                            <span className="text-xs text-ink-muted">No Earnings</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Global Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earning Rates Settings */}
          <Card className="p-6 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Global Earning Settings</h3>
                  <p className="text-xs text-ink-muted">Set unit rates used to compute real designer earnings.</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Amount Paid per Approved Image Uploaded (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">₦</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={settingsForm.perImageNaira}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, perImageNaira: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Stored in database as {Math.round(Number(settingsForm.perImageNaira || 0) * 100).toLocaleString()} kobo.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Amount Paid per Accepted Image-to-Code Uploaded (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">₦</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={settingsForm.perImageToCodeNaira}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, perImageToCodeNaira: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Stored in database as {Math.round(Number(settingsForm.perImageToCodeNaira || 0) * 100).toLocaleString()} kobo.
                  </p>
                </div>

              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-primary text-white text-sm px-4 py-2 gap-2"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Earning Settings
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Payout Schedule Settings */}
          <Card className="p-6 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Payout Schedule Settings</h3>
                  <p className="text-xs text-ink-muted">Configure automated schedule and manual payout fee policies.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Payout Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettingsForm((f) => ({ ...f, payoutSchedule: 'weekly' }))}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        settingsForm.payoutSchedule === 'weekly'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-surface text-ink border-border hover:bg-canvas'
                      }`}
                    >
                      Weekly Payouts
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsForm((f) => ({ ...f, payoutSchedule: 'monthly' }))}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        settingsForm.payoutSchedule === 'monthly'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-surface text-ink border-border hover:bg-canvas'
                      }`}
                    >
                      Monthly Payouts
                    </button>
                  </div>
                </div>

                {settingsForm.payoutSchedule === 'weekly' ? (
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Scheduled Day of Week</label>
                    <select
                      value={settingsForm.payoutDayOfWeek}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, payoutDayOfWeek: Number(e.target.value) }))}
                      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {WEEKDAY_NAMES.map((d) => (
                        <option key={d.val} value={d.val}>
                          Every {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Scheduled Day of Month</label>
                    <select
                      value={settingsForm.payoutDayOfMonth}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, payoutDayOfMonth: Number(e.target.value) }))}
                      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of every month
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">
                    Manual Early Payout Charge (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settingsForm.manualPayoutFeePercent}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, manualPayoutFeePercent: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-border bg-surface px-3 pr-8 text-sm text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">%</span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">Charge deducted when a payout is requested before the scheduled payout day.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-primary text-white text-sm px-4 py-2 gap-2"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Payout Settings
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: Status Action Confirmation */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border bg-canvas/40">
              <h3 className="text-base font-bold text-ink">{actionModal.title}</h3>
              <button
                onClick={() => setActionModal((prev) => ({ ...prev, open: false }))}
                className="p-1 rounded-lg hover:bg-canvas text-ink-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-canvas rounded-lg border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Designer:</span>
                  <span className="font-semibold text-ink">{actionModal.record?.designerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Net Amount:</span>
                  <span className="font-bold text-primary">{formatNaira(actionModal.record?.netAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Current Status:</span>
                  <span className="font-semibold capitalize">{actionModal.record?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">New Status:</span>
                  <span className="font-bold text-indigo-700 uppercase">{actionModal.targetStatus}</span>
                </div>
              </div>

              {actionModal.targetStatus === 'approved' && actionModal.record?.fee > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <p className="font-semibold">2% Early Manual Payout Charge Applied</p>
                  <p className="text-[11px] mt-0.5">
                    Gross: {formatNaira(actionModal.record?.amount)} • Fee: -{formatNaira(actionModal.record?.fee)} • Net: {formatNaira(actionModal.record?.netAmount)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Admin Notes / Reason</label>
                <textarea
                  rows={3}
                  value={actionModal.notes}
                  onChange={(e) => setActionModal((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes visible in payment log and notification..."
                  className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionModal((prev) => ({ ...prev, open: false }))}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={actionModal.submitting}
                  onClick={handleConfirmStatusAction}
                  className={`text-white gap-1.5 ${
                    actionModal.targetStatus === 'declined' || actionModal.targetStatus === 'failed'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {actionModal.submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Confirm Update
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
