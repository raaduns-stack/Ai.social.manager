import { useState, useEffect, useMemo } from "react";
import { Wallet, CreditCard, Landmark, ShieldCheck, AlertCircle, Download, TrendingUp, Clock, X, Calendar, Check } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/layout/PageHeader";
import PremiumCard from "../../components/designer/premium/PremiumCard";
import {
  getDesignerPayments,
  getDesignerPaymentOverview,
  requestDesignerPayout,
  getPaymentMethod,
  updatePaymentMethod,
} from "../../features/designer/designer-api";
import { naira, timeAgo } from "../../features/designer/format";

const statusTone = { pending: "warning", processing: "warning", paid: "success", failed: "danger" };

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthlySeries(payments) {
  const buckets = new Map();
  const months = [];
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push(key);
    buckets.set(key, 0);
  }
  payments
    .filter((p) => p.status === "paid")
    .forEach((p) => {
      const d = new Date(p.paidAt || p.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + p.amount);
    });
  return months.map((k) => {
    const parts = k.split("-").map(Number);
    return { m: MONTH_NAMES[parts[1]], v: Math.round(buckets.get(k) / 100) };
  });
}

function shortId(id) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Lotus Bank",
  "Moniepoint MFB",
  "OPay",
  "Optimus Bank",
  "Palmpay",
  "Parallex Bank",
  "Polaris Bank",
  "PremiumTrust Bank",
  "Providus Bank",
  "Rubies Bank",
  "Signature Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "TAJBank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "VFD Microfinance Bank",
  "Wema Bank",
  "Zenith Bank",
];

export default function DesignerPayments() {
  const [payouts, setPayouts] = useState([]);
  const [method, setMethod] = useState({ accountName: "", accountNumber: "", bankName: "" });
  const [hasMethod, setHasMethod] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestAmountNaira, setRequestAmountNaira] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, savedMethod, ov] = await Promise.all([
        getDesignerPayments(),
        getPaymentMethod(),
        getDesignerPaymentOverview(),
      ]);
      setPayouts(list || []);
      setOverview(ov || null);
      if (savedMethod && savedMethod.bankName && savedMethod.accountNumber) {
        setMethod({
          accountName: savedMethod.accountName || "",
          accountNumber: savedMethod.accountNumber || "",
          bankName: savedMethod.bankName || "",
        });
        setHasMethod(true);
        setEditing(false);
      } else {
        setMethod({ accountName: "", accountNumber: "", bankName: "" });
        setHasMethod(false);
        setEditing(true);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const availableNaira = useMemo(() => {
    return (overview?.availableBalance || 0) / 100;
  }, [overview]);

  const liveRequestCalculation = useMemo(() => {
    const grossKobo = Math.round(Number(requestAmountNaira || 0) * 100);
    if (grossKobo <= 0) return { gross: 0, fee: 0, net: 0, feePercent: 0, isScheduled: false };

    const isScheduled = Boolean(overview?.isTodayGlobalPayout);
    let feePercent = 0;
    if (!isScheduled) {
      feePercent = overview?.manualPayoutFeePercent || 2;
    }
    const fee = Math.round(grossKobo * (feePercent / 100));
    const net = Math.max(0, grossKobo - fee);
    return { gross: grossKobo, fee, net, feePercent, isScheduled };
  }, [requestAmountNaira, overview]);

  const openRequestModal = () => {
    if (!hasMethod || !method.bankName?.trim() || !method.accountNumber?.trim() || !method.accountName?.trim()) {
      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: {
            message: "Please complete and save your bank payment details below before requesting a payout.",
            type: "error",
          },
        })
      );
      setEditing(true);
      setTimeout(() => {
        document.getElementById("payout-method-card")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    if (availableNaira <= 0) {
      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: {
            message: "You have no eligible approved earnings available to request payment.",
            type: "error",
          },
        })
      );
      return;
    }

    setRequestAmountNaira(String(availableNaira));
    setRequestNotes("");
    setRequestError(null);
    setRequestModalOpen(true);
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amtKobo = Math.round(Number(requestAmountNaira) * 100);
    if (isNaN(amtKobo) || amtKobo <= 0) {
      setRequestError("Please enter a valid payout amount greater than ₦0.");
      return;
    }
    if (amtKobo > (overview?.availableBalance || 0)) {
      setRequestError(`Requested amount exceeds your eligible available balance of ${naira(overview?.availableBalance || 0)}.`);
      return;
    }

    setSubmittingRequest(true);
    setRequestError(null);
    try {
      await requestDesignerPayout({
        amount: amtKobo,
        payoutType: overview?.isTodayGlobalPayout ? 'global' : 'manual',
        notes: requestNotes || undefined,
      });
      setRequestModalOpen(false);
      await load();
      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: {
            message: `Payout request for ${naira(amtKobo)} submitted successfully. Admin will review and process payment.`,
            type: "success",
          },
        })
      );
    } catch (err) {
      setRequestError(err?.response?.data?.message || "Failed to submit payout request. Please try again.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleSave = async () => {
    if (!method.accountName.trim() || !method.accountNumber.trim() || !method.bankName.trim()) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Please fill all payout fields.", type: "error" } }));
      return;
    }
    if (!/^\d{8,12}$/.test(method.accountNumber.replace(/\s/g, ""))) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Account number must be 8–12 digits.", type: "error" } }));
      return;
    }
    setSaving(true);
    try {
      const updated = await updatePaymentMethod({
        accountName: method.accountName.trim(),
        accountNumber: method.accountNumber.replace(/\s/g, ""),
        bankName: method.bankName,
      });
      setMethod({
        accountName: updated.accountName,
        accountNumber: updated.accountNumber,
        bankName: updated.bankName,
      });
      setHasMethod(true);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Payout method saved.", type: "success" } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: e?.response?.data?.message || "Could not save payout method.", type: "error" } }));
    } finally {
      setSaving(false);
    }
  };

  const downloadStatement = () => {
    const header = ["Payment ID", "Period / Earnings", "Amount", "Method", "Date", "Status"];
    const rows = payouts.map((p) =>
      [shortId(p.id), p.period || "—", naira(p.amount), p.bankName ? `Bank Transfer (${p.bankName})` : "Bank Transfer", p.paidAt || p.createdAt, p.status].map(csvEscape).join(",")
    );
    const csv = [header.map(csvEscape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raasocial-designer-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PremiumCard className="p-5">
          <div className="h-6 w-48 rounded bg-canvas animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-canvas animate-pulse mt-2" />
        </PremiumCard>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <PremiumCard key={i} className="p-5 h-44 animate-pulse bg-canvas/50" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PremiumCard className="p-12 text-center space-y-3 border-dashed">
          <span className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-danger">
            <AlertCircle size={20} />
          </span>
          <p className="font-bold text-ink">Could not load payments</p>
          <p className="text-sm text-ink-muted">{error}</p>
          <Button onClick={load} className="rounded-lg text-sm">Try again</Button>
        </PremiumCard>
      </div>
    );
  }

  const paid = payouts.filter((p) => p.status === "paid");
  const pending = payouts.filter((p) => p.status === "pending");
  const totalEarned = paid.reduce((s, p) => s + p.amount, 0);
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);
  const lastPaid = [...paid].sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt))[0];
  const spark = monthlySeries(payouts);

  const columns = [
    { key: "id", label: "Payment ID", render: (r) => <span className="font-mono text-xs tracking-wide text-ink-muted">{shortId(r.id)}</span> },
    { key: "period", label: "Period / Earnings", render: (r) => <span className="text-sm text-ink">{r.period || "—"}</span> },
    { key: "amount", label: "Amount", render: (r) => <span className="font-bold text-ink tabular-nums">{naira(r.amount)}</span> },
    { key: "method", label: "Method", render: (r) => <span className="text-xs text-ink-muted border border-border bg-white px-2 py-1 rounded-full">{r.bankName ? `Bank Transfer (${r.bankName})` : "Bank Transfer"}</span> },
    { key: "date", label: "Date", render: (r) => <span className="text-xs text-ink-muted flex items-center gap-1"><Clock size={12} />{timeAgo(r.paidAt || r.createdAt)}</span> },
    { key: "status", label: "Status", render: (r) => <Badge tone={statusTone[r.status]} className="capitalize text-xs">{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        variant="premium"
        eyebrow="Account — Payments"
        title="Payments"
        description="Track earnings, manage payout method and download statements. Payouts run every Tuesday."
        action={
          <Button variant="outline" onClick={downloadStatement} className="rounded-lg gap-2 text-xs font-semibold">
            <Download size={14} /> Statement
          </Button>
        }
      />

      {/* Scheduled Payout Policy Banner */}
      <div className="bg-gradient-to-r from-primary-50 via-white to-accent-50 border border-primary-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <div className="font-bold text-ink flex items-center gap-2">
              <span>Scheduled Payout Cycle: Every Tuesday</span>
              {overview?.isTodayGlobalPayout && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  TODAY IS SCHEDULED PAYOUT DAY
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Normal payout cycle for eligible designer earnings occurs every Tuesday. Need payment before the scheduled date? You can submit an early payout request.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={openRequestModal}
          className="shrink-0 text-xs font-semibold border-primary/30 text-primary hover:bg-primary-50"
        >
          Request Early Payout
        </Button>
      </div>

      {/* Summary bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Available for Payout */}
        <PremiumCard className="p-5 bg-gradient-to-br from-white to-primary-50 border-primary-100 overflow-hidden flex flex-col justify-between">
          <div>
            <p className="dp-mono text-ink-muted flex items-center gap-1.5"><Wallet size={12} className="text-primary" /> Available for payout</p>
            <p className="dp-display text-[26px] leading-none text-primary mt-1">{naira(overview?.availableBalance ?? Math.max(0, totalEarned - pendingTotal))}</p>
            <p className="text-xs text-ink-muted mt-1.5">
              {overview?.approvedImagesCount || 0} approved graphics • {overview?.acceptedImageToCodeCount || 0} code accepted
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-ink-muted">
            <span className="text-[11px] font-medium flex items-center gap-1.5">
              <Calendar size={12} className="text-primary" /> Auto-disbursed on {overview?.nextScheduledDescription || "scheduled cycle"}
            </span>
          </div>
        </PremiumCard>

        {/* Card 2: Pending Payouts in Queue */}
        <PremiumCard className="p-5 flex flex-col justify-between">
          <div>
            <p className="dp-mono text-ink-muted flex items-center gap-1.5"><Clock size={12} className="text-warning" /> Pending in queue</p>
            <p className="text-[26px] font-extrabold text-warning leading-none mt-1">{naira(overview?.pendingPayouts ?? pendingTotal)}</p>
            <p className="text-xs text-ink-muted mt-1.5">{pending.length} pending request{pending.length === 1 ? "" : "s"} awaiting Admin review</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Clock size={14} /> {pending.length > 0 ? `${pending[0].period || "Current period"} • in review` : "No pending payouts in queue"}
          </div>
        </PremiumCard>

        {/* Card 3: Total Paid Out */}
        <PremiumCard className="p-5 flex flex-col justify-between bg-ink border-ink text-white overflow-hidden">
          <div>
            <p className="dp-mono text-white/60">Total paid out</p>
            <p className="text-[26px] font-extrabold leading-none mt-1">{naira(overview?.paidEarnings ?? totalEarned)}</p>
            <p className="text-xs text-white/60 mt-1.5">{lastPaid ? `Last: ${naira(lastPaid.amount)} paid ${timeAgo(lastPaid.paidAt || lastPaid.createdAt)}` : "No payouts completed yet"}</p>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: payouts.length > 0 ? `${Math.round((paid.length / payouts.length) * 100)}%` : "0%" }} />
            </div>
            <p className="text-[11px] text-white/60 mt-1.5 flex items-center gap-1"><TrendingUp size={12} /> {paid.length} of {payouts.length} payouts completed</p>
          </div>
        </PremiumCard>
      </div>

      {/* Payout method */}
      <PremiumCard id="payout-method-card" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Landmark size={18} className="text-primary" /> Payment information</h3>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs font-semibold text-success bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Saved</span>}
            {hasMethod && !editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-lg text-xs font-semibold">Manage</Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="rounded-lg text-xs font-semibold">
                {saving ? "Saving…" : hasMethod ? "Save changes" : "Save method"}
              </Button>
            )}
          </div>
        </div>
        {!hasMethod && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle size={14} className="shrink-0" /> No payout method saved yet — please add your bank details to receive payouts.
          </div>
        )}
        {!editing ? (
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-canvas border border-border">
              <p className="dp-mono text-ink-muted !text-[11px]">Account name</p>
              <p className="font-semibold text-ink mt-1">{method.accountName || "—"}</p>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border">
              <p className="dp-mono text-ink-muted !text-[11px]">Account number</p>
              <p className="font-semibold text-ink mt-1 font-mono tracking-wide">{method.accountNumber || "—"}</p>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border">
              <p className="dp-mono text-ink-muted !text-[11px]">Bank</p>
              <p className="font-semibold text-ink mt-1">{method.bankName || "—"}</p>
            </div>
            <div className="sm:col-span-3 flex items-center gap-2 text-xs text-success bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
              <ShieldCheck size={14} /> Securely connected. Payouts are processed to this bank account. Keep details up to date to avoid delays.
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="dp-mono text-ink-muted">Account name *</label>
              <input value={method.accountName} onChange={(e) => setMethod({ ...method, accountName: e.target.value })} placeholder="Account holder full name" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="dp-mono text-ink-muted">Account number *</label>
              <input value={method.accountNumber} onChange={(e) => setMethod({ ...method, accountNumber: e.target.value })} placeholder="10-digit account number" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="dp-mono text-ink-muted">Bank *</label>
              <select value={method.bankName} onChange={(e) => setMethod({ ...method, bankName: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                <option value="" disabled>Select your bank</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertCircle size={14} className="shrink-0" /> Double-check these details — payouts go to this account once saved.
            </div>
          </div>
        )}
        <p className="text-xs text-ink-muted flex gap-1.5"><CreditCard size={12} className="mt-0.5 shrink-0" /> Payouts go to the bank account above. Contact admin to change payout currency or add a domiciliary account.</p>
      </PremiumCard>

      {/* History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Earnings & payment history</h3>
          <span className="text-xs font-mono text-ink-muted">{payouts.length} records</span>
        </div>
        <div className="overflow-hidden rounded-2xl">
          <DataTable columns={columns} data={payouts} searchKeys={["id", "period"]} emptyMessage="No payments yet. Earnings appear after submissions are approved." />
        </div>
      </div>

      <div className="flex gap-2 p-3 rounded-xl bg-canvas border border-dashed border-border text-xs text-ink-muted">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <span>Statuses: <span className="font-semibold text-ink">pending</span> → <span className="font-semibold text-ink">processing</span> → <span className="font-semibold text-ink">paid</span>. Contact support if a payment stays in processing longer than expected.</span>
      </div>

      {/* REQUEST PAYOUT MODAL */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Request Designer Payout</h3>
                  <p className="text-xs text-ink-muted">Submit an early payment request for Admin review.</p>
                </div>
              </div>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="p-1 rounded-lg hover:bg-canvas text-ink-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="p-5 space-y-4">
              {requestError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {requestError}
                </div>
              )}

              {/* Eligible Balance Preview */}
              <div className="p-3.5 bg-canvas border border-border rounded-xl flex justify-between items-center text-xs">
                <span className="text-ink-muted">Available Eligible Balance:</span>
                <span className="font-extrabold text-primary text-base">{naira(overview?.availableBalance || 0)}</span>
              </div>

              {/* Bank Destination */}
              <div className="p-3 bg-primary-50/50 border border-primary-100 rounded-xl text-xs space-y-0.5">
                <div className="font-semibold text-ink flex items-center gap-1">
                  <Landmark size={13} className="text-primary" /> Destination Bank Account
                </div>
                <div className="text-ink-muted">
                  {method.bankName} • <span className="font-mono">{method.accountNumber}</span> ({method.accountName})
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Requested Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted">₦</span>
                  <input
                    type="number"
                    min="1"
                    max={availableNaira}
                    step="1"
                    value={requestAmountNaira}
                    onChange={(e) => setRequestAmountNaira(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-white pl-8 pr-3 text-sm text-ink font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="text-[11px] text-ink-muted mt-1">
                  Maximum available: {naira(overview?.availableBalance || 0)}
                </p>
              </div>

              {/* Live Fee Breakdown */}
              {liveRequestCalculation.gross > 0 && (
                <div className="p-3 bg-canvas rounded-xl border border-border space-y-1.5 text-xs">
                  <div className="flex justify-between text-ink-muted">
                    <span>Gross Requested:</span>
                    <span className="font-semibold text-ink">{naira(liveRequestCalculation.gross)}</span>
                  </div>
                  <div className="flex justify-between items-center text-ink-muted">
                    <span>
                      {liveRequestCalculation.isScheduled
                        ? 'Scheduled Cycle Fee:'
                        : `Early Manual Processing Fee (${liveRequestCalculation.feePercent}%):`}
                    </span>
                    <span className={`font-semibold ${liveRequestCalculation.fee > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {liveRequestCalculation.fee > 0 ? `-${naira(liveRequestCalculation.fee)}` : '₦0 (Tuesday normal cycle)'}
                    </span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between items-center text-sm font-bold text-ink">
                    <span>Net Amount You Receive:</span>
                    <span className="text-primary text-base font-extrabold">{naira(liveRequestCalculation.net)}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Early payout request for completed design tasks"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                Submitting this sends an early payout request to Admin. Admin will review the request, coordinate the external transfer to your bank account, and update the status to paid once sent.
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingRequest}
                  className="bg-primary text-white text-xs px-4 py-2 gap-2 font-semibold"
                >
                  {submittingRequest ? "Submitting..." : `Confirm Request (${naira(liveRequestCalculation.net)})`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
