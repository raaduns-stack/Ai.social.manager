import { useState, useEffect } from "react";
import { Wallet, CreditCard, Landmark, ShieldCheck, AlertCircle, Download, TrendingUp, Clock } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/layout/PageHeader";
import PremiumCard from "../../components/designer/premium/PremiumCard";
import {
  getDesignerPayments,
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

export default function DesignerPayments() {
  const [payouts, setPayouts] = useState([]);
  const [method, setMethod] = useState({ accountName: "", accountNumber: "", bankName: "GTBank" });
  const [hasMethod, setHasMethod] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, savedMethod] = await Promise.all([getDesignerPayments(), getPaymentMethod()]);
      setPayouts(list);
      if (savedMethod) {
        setMethod({
          accountName: savedMethod.accountName,
          accountNumber: savedMethod.accountNumber,
          bankName: savedMethod.bankName,
        });
        setHasMethod(true);
        setEditing(false);
      } else {
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
    { key: "method", label: "Method", render: (r) => <span className="text-xs text-ink-muted border border-border bg-white px-2 py-1 rounded-full">Bank Transfer</span> },
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
        action={<Button variant="outline" onClick={downloadStatement} className="rounded-lg gap-2 text-xs font-semibold"><Download size={14} /> Statement</Button>}
      />

      {/* Summary bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PremiumCard className="p-5 bg-gradient-to-br from-white to-primary-50 border-primary-100 overflow-hidden">
          <p className="dp-mono text-ink-muted flex items-center gap-1.5"><Wallet size={12} /> Total earned</p>
          <p className="dp-display text-[26px] leading-none text-ink mt-1">{naira(totalEarned)}</p>
          <p className="text-xs text-ink-muted">{paid.length} paid • {payouts.length} records</p>
          <div className="h-12 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark}>
                <defs>
                  <linearGradient id="payG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111827" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area dataKey="v" type="monotone" stroke="#111827" strokeWidth={1.5} fill="url(#payG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PremiumCard>
        <PremiumCard className="p-5 flex flex-col justify-between">
          <div>
            <p className="dp-mono text-ink-muted">Pending</p>
            <p className="text-[26px] font-extrabold text-warning leading-none mt-1">{naira(pendingTotal)}</p>
            <p className="text-xs text-ink-muted">{pending.length} pending payout{pending.length === 1 ? "" : "s"}</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Clock size={14} /> {pending.length > 0 ? `${pending[0].period || "Current period"} • in queue` : "Nothing pending — payouts run Tuesdays"}
          </div>
        </PremiumCard>
        <PremiumCard className="p-5 flex flex-col justify-between bg-ink border-ink text-white overflow-hidden">
          <div>
            <p className="dp-mono text-white/60">Last paid</p>
            <p className="text-[26px] font-extrabold leading-none mt-1">{lastPaid ? naira(lastPaid.amount) : "—"}</p>
            <p className="text-xs text-white/60">{lastPaid ? `${lastPaid.period || ""} — paid ${timeAgo(lastPaid.paidAt || lastPaid.createdAt)} via Bank Transfer` : "No payouts yet"}</p>
          </div>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: payouts.length > 0 ? `${Math.round((paid.length / payouts.length) * 100)}%` : "0%" }} />
          </div>
          <p className="text-[11px] text-white/60 mt-1.5 flex items-center gap-1"><TrendingUp size={12} /> {paid.length} of {payouts.length} payouts completed</p>
        </PremiumCard>
      </div>

      {/* Payout method */}
      <PremiumCard className="p-6 space-y-4">
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
            <AlertCircle size={14} className="shrink-0" /> No payout method yet — add your bank details so earnings can be paid out.
          </div>
        )}
        {!editing ? (
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-canvas border border-border">
              <p className="dp-mono text-ink-muted !text-[11px]">Account name</p>
              <p className="font-semibold text-ink mt-1">{method.accountName}</p>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border">
              <p className="dp-mono text-ink-muted !text-[11px]">Account number</p>
              <p className="font-semibold text-ink mt-1 font-mono tracking-wide">{method.accountNumber}</p>
            </div>
            <div className="p-3 rounded-xl bg-canvas border border-border">
              <p className="dp-mono text-ink-muted !text-[11px]">Bank</p>
              <p className="font-semibold text-ink mt-1">{method.bankName}</p>
            </div>
            <div className="sm:col-span-3 flex items-center gap-2 text-xs text-success bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
              <ShieldCheck size={14} /> Securely connected. Payouts are processed to your bank account via our partner gateway (Flutterwave). Keep details up to date to avoid delays.
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="dp-mono text-ink-muted">Account name *</label>
              <input value={method.accountName} onChange={(e) => setMethod({ ...method, accountName: e.target.value })} placeholder="Alex Designer" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="dp-mono text-ink-muted">Account number *</label>
              <input value={method.accountNumber} onChange={(e) => setMethod({ ...method, accountNumber: e.target.value })} placeholder="0123456789" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="dp-mono text-ink-muted">Bank *</label>
              <select value={method.bankName} onChange={(e) => setMethod({ ...method, bankName: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                <option>GTBank</option>
                <option>Access Bank</option>
                <option>First Bank</option>
                <option>Zenith</option>
                <option>Kuda</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertCircle size={14} className="shrink-0" /> Verification: we'll send ₦100 micro-deposit to confirm account before next payout.
            </div>
          </div>
        )}
        <p className="text-xs text-ink-muted flex gap-1.5"><CreditCard size={12} className="mt-0.5 shrink-0" /> Integration: Flutterwave processes payouts to your bank account. Contact admin to change payout currency or add a domiciliary account.</p>
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
        <span>Statuses: <span className="font-semibold text-ink">pending</span> → <span className="font-semibold text-ink">processing</span> → <span className="font-semibold text-ink">paid</span>. Contact support if a payment is delayed beyond Tuesday.</span>
      </div>
    </div>
  );
}
