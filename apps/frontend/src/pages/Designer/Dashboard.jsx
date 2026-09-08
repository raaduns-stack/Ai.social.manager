import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Wallet, UploadCloud, ArrowRight, AlertCircle, Clock, Eye, CheckCircle2, Sparkles, Timer, ClipboardList, FileText, User, Bell } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/layout/PageHeader";
import DesignerUploadModal from "../../components/designer/DesignerUploadModal";
import PremiumCard from "../../components/designer/premium/PremiumCard";
import CoverImage from "../../components/designer/premium/CoverImage";
import StatusDot from "../../components/designer/premium/StatusDot";
import { useDesignerAuth } from "../../context/useDesignerAuth";
import { getDesignerDashboard } from "../../features/designer/designer-api";
import { naira, nairaShort, timeAgo, formatDue } from "../../features/designer/format";

const DONUT_COLORS = {
  Approved: "#10B981",
  "Under review": "#F59E0B",
  Revision: "#EF4444",
  Draft: "#E5E7EB",
};

function toDonut(statusCounts) {
  const approved = (statusCounts.approved ?? 0) + (statusCounts.completed ?? 0);
  const review =
    (statusCounts.submitted ?? 0) +
    (statusCounts.received ?? 0) +
    (statusCounts.under_review ?? 0) +
    (statusCounts.resubmitted ?? 0);
  return [
    { name: "Approved", value: approved, color: DONUT_COLORS.Approved },
    { name: "Under review", value: review, color: DONUT_COLORS["Under review"] },
    { name: "Revision", value: statusCounts.revision_required ?? 0, color: DONUT_COLORS.Revision },
    { name: "Draft", value: statusCounts.draft ?? 0, color: DONUT_COLORS.Draft },
  ];
}

function shortId(id) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

const statusTone = {
  draft: "neutral", submitted: "warning", received: "neutral", under_review: "neutral",
  revision_required: "danger", resubmitted: "warning", approved: "success", completed: "success",
};

export default function DesignerDashboard() {
  const { designer } = useDesignerAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const firstName = designer?.name?.split(" ")[0] || "Alex";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await getDesignerDashboard());
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const quickActions = [
    { label: "Upload Design", icon: UploadCloud, primary: true, onClick: () => setShowUpload(true) },
    { label: "View Tasks", icon: ClipboardList, to: "/designer/tasks" },
    { label: "My Submissions", icon: FileText, to: "/designer/submissions" },
    { label: "Payments", icon: Wallet, to: "/designer/payments" },
    { label: "My Profile", icon: User, to: "/designer/settings" },
    { label: "Notifications", icon: Bell, to: "/designer/notifications" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PremiumCard className="p-5">
          <div className="h-6 w-48 rounded bg-canvas animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-canvas animate-pulse mt-2" />
        </PremiumCard>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6"><PremiumCard className="p-5 h-44 animate-pulse bg-canvas/50" /></div>
          <div className="col-span-6 lg:col-span-3"><PremiumCard className="p-5 h-44 animate-pulse bg-canvas/50" /></div>
          <div className="col-span-6 lg:col-span-3"><PremiumCard className="p-5 h-44 animate-pulse bg-canvas/50" /></div>
        </div>
        <PremiumCard className="p-5 h-64 animate-pulse bg-canvas/50" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <PremiumCard className="p-12 text-center space-y-3 border-dashed">
          <span className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-danger">
            <AlertCircle size={20} />
          </span>
          <p className="font-bold text-ink">Could not load dashboard</p>
          <p className="text-sm text-ink-muted">{error || "Something went wrong."}</p>
          <Button onClick={load} className="rounded-lg text-sm">Try again</Button>
        </PremiumCard>
      </div>
    );
  }

  const donutData = toDonut(summary.statusCounts || {});
  const earningsData = summary.monthlyEarnings || [];
  const recentSubmissions = summary.recentSubmissions || [];
  const attention = summary.attentionItems || [];
  const upcoming = summary.upcomingTasks || [];
  const approvedCount =
    (summary.statusCounts?.approved ?? 0) + (summary.statusCounts?.completed ?? 0);
  const inReview = donutData.find((d) => d.name === "Under review")?.value ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        variant="premium"
        eyebrow="Workspace — Graphic Designer"
        title={`Good morning, ${firstName}`}
        description={`${upcoming.length} open tasks • ${inReview} in review • ${nairaShort(summary.pendingEarnings)} pending. ${attention.length} submission${attention.length === 1 ? "" : "s"} need your attention.`}
        action={
          <Button onClick={() => setShowUpload(true)} className="h-9 rounded-lg gap-2 font-semibold bg-primary hover:bg-primary-700 shadow-sm">
            <UploadCloud size={16} /> Upload Design
          </Button>
        }
      />
      <DesignerUploadModal open={showUpload} onClose={() => { setShowUpload(false); load(); }} />

      {/* Quick actions */}
      <PremiumCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Sparkles size={14} className="text-primary" /> Quick actions</h3>
          <span className="text-xs text-ink-muted hidden sm:block">Jump into your most-used tools</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map((qa) => {
            const cls = qa.primary
              ? "flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm font-semibold text-ink hover:bg-primary-100/70 transition-colors"
              : "flex items-center gap-2 rounded-xl border border-border bg-white p-3 text-sm font-semibold text-ink hover:border-primary-100 hover:bg-primary-50/40 transition-colors";
            const iconCls = qa.primary
              ? "w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-sm"
              : "w-8 h-8 rounded-lg bg-canvas border border-border flex items-center justify-center text-ink-muted shrink-0";
            const inner = (
              <>
                <span className={iconCls}><qa.icon size={14} /></span>
                {qa.label}
              </>
            );
            return qa.to ? (
              <Link key={qa.label} to={qa.to} className={cls}>{inner}</Link>
            ) : (
              <button key={qa.label} onClick={qa.onClick} className={cls}>{inner}</button>
            );
          })}
        </div>
      </PremiumCard>

      {/* Bento Stats */}
      <div className="grid grid-cols-12 gap-4">
        {/* Earnings — 6 cols */}
        <div className="col-span-12 lg:col-span-6 dp-enter" style={{ animationDelay: "0ms" }}>
          <PremiumCard className="p-5 h-full bg-gradient-to-br from-white to-primary-50 border-primary-100 overflow-hidden relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="dp-mono text-ink-muted">Total earned</p>
                <p className="dp-display text-[28px] leading-none tracking-tight text-ink mt-1">{naira(summary.totalEarned)}</p>
                <p className="text-xs text-ink-muted mt-1">{approvedCount} approved • <span className="font-semibold text-primary">{nairaShort(summary.pendingEarnings)} pending</span></p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                <Wallet size={18} />
              </span>
            </div>
            <div className="h-16 mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient id="earnG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--dp-primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--dp-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="v" type="monotone" stroke="var(--dp-primary)" strokeWidth={2} fill="url(#earnG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 mt-2 text-[11px] font-mono text-ink-muted">
              {earningsData.map((d) => (
                <span key={d.m}>{d.m}</span>
              ))}
            </div>
          </PremiumCard>
        </div>

        {/* Approval Rate — 3 cols */}
        <div className="col-span-6 lg:col-span-3 dp-enter" style={{ animationDelay: "60ms" }}>
          <PremiumCard className="p-5 h-full flex flex-col">
            <p className="dp-mono text-ink-muted">Approval rate</p>
            <div className="flex items-center gap-4 mt-3 flex-1">
              <div className="w-[84px] h-[84px] shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ v: summary.approvalRate }, { v: 100 - summary.approvalRate }]} dataKey="v" innerRadius={28} outerRadius={40} startAngle={90} endAngle={-270} stroke="none">
                      <Cell fill="#111827" />
                      <Cell fill="#F3F4F6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-ink">{summary.approvalRate}%</span>
              </div>
              <div className="text-xs leading-5">
                <p className="font-bold text-ink">{approvedCount} approved</p>
                <p className="text-ink-muted">{summary.totalSubmissions} submissions</p>
                <p className="text-success font-semibold flex items-center gap-1 mt-1"><CheckCircle2 size={12} /> {inReview} in review</p>
              </div>
            </div>
          </PremiumCard>
        </div>

        {/* Stacked small */}
        <div className="col-span-6 lg:col-span-3 flex flex-col gap-4 dp-enter" style={{ animationDelay: "120ms" }}>
          <PremiumCard className="p-4 flex items-center justify-between flex-1">
            <div>
              <p className="dp-mono text-ink-muted">Tasks due</p>
              <p className="text-xl font-extrabold text-ink leading-none mt-1">{upcoming.length} <span className="text-xs font-semibold text-warning">open</span></p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Timer size={18} />
            </span>
          </PremiumCard>
          <PremiumCard className="p-4 flex items-center justify-between flex-1 bg-ink border-ink text-white">
            <div>
              <p className="dp-mono text-white/60">Revisions</p>
              <p className="text-xl font-extrabold leading-none mt-1">{attention.length} <span className="text-xs font-semibold text-white/60">need action</span></p>
            </div>
            <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <AlertCircle size={18} />
            </span>
          </PremiumCard>
        </div>
      </div>

      {/* Recent + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PremiumCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-border">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              Recent submissions <span className="text-xs font-mono font-normal text-ink-muted bg-canvas border border-border px-2 py-0.5 rounded-full">{recentSubmissions.length}</span>
            </h3>
            <Link to="/designer/submissions" className="text-xs font-bold text-primary hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-muted text-center">No submissions yet. Upload your first design to get started.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentSubmissions.map((row) => (
                <Link key={row.id} to="/designer/submissions" className="flex items-center gap-3 px-5 py-3.5 hover:bg-canvas/60 transition-colors group">
                  <CoverImage id={row.id} alt={row.title} className="w-[52px] h-9 shrink-0 rounded-lg" ratio="16/10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink truncate group-hover:text-primary transition-colors">{row.title}</p>
                    <p className="text-xs text-ink-muted flex items-center gap-1.5"><span className="font-mono text-[11px] tracking-wide">{shortId(row.id)}</span> • {row.category} • {timeAgo(row.updated)}</p>
                    <div className="h-1.5 bg-border rounded-full mt-2 overflow-hidden max-w-[180px]">
                      <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${row.progress}%` }} />
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <StatusDot status={row.status} pulse={row.status === "under_review"} />
                      <Badge tone={statusTone[row.status] || "neutral"} className="capitalize text-[11px] px-2 py-0.5">
                        {row.status.replaceAll("_", " ")}
                      </Badge>
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-border group-hover:text-ink-muted shrink-0 hidden sm:block" />
                </Link>
              ))}
            </div>
          )}
        </PremiumCard>

        <PremiumCard className="p-5 flex flex-col">
          <h3 className="text-sm font-bold text-ink">Submission status</h3>
          <div className="flex items-center gap-4 mt-4 flex-1">
            <div className="w-[110px] h-[110px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={32} outerRadius={52} paddingAngle={2} stroke="none">
                    {donutData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 flex-1">
              {donutData.map((r) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                    {r.name}
                  </span>
                  <span className="font-bold text-ink">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle size={14} className="shrink-0" /> {attention.length} submissions need your attention
          </div>
        </PremiumCard>
      </div>

      {/* Needs Attention + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PremiumCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-danger flex items-center justify-center">
                <AlertCircle size={14} />
              </span>
              Needs attention
            </h3>
            <span className="text-xs font-mono text-ink-muted bg-canvas border border-border px-2 py-1 rounded-full">{attention.length} items</span>
          </div>
          {attention.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">Nothing needs your attention right now.</p>
          ) : (
            <div className="space-y-3">
              {attention.map((a) => (
                <div key={a.id} className="flex gap-3 p-3 rounded-xl border border-border bg-white hover:border-primary-100 hover:bg-primary-50/40 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-danger flex items-center justify-center shrink-0">
                    <AlertCircle size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{a.title} <span className="font-mono text-xs font-normal text-ink-muted">{shortId(a.id)}</span></p>
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{a.reason}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <Link to="/designer/submissions" className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1">
                      View feedback <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>

        <PremiumCard className="p-5">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-primary-50 border border-primary-100 text-primary flex items-center justify-center">
              <Clock size={14} />
            </span>
            Upcoming deadlines
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">No open tasks. New briefs will appear here.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-canvas border border-border">
                  <span className={`w-2 h-8 rounded-full shrink-0 ${u.priority === "high" ? "bg-danger" : "bg-warning"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{u.title}</p>
                    <p className="text-xs text-ink-muted flex items-center gap-1.5"><span className="font-mono text-[11px]">{shortId(u.id)}</span> • {formatDue(u.dueDate)}</p>
                  </div>
                  <Badge tone={u.priority === "high" ? "danger" : "warning"} className="capitalize text-[11px] shrink-0">
                    {u.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <Link to="/designer/tasks" className="mt-4 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-ink hover:bg-black text-white text-sm font-semibold transition-colors">
            <Eye size={14} /> View all tasks
          </Link>
          <p className="text-[11px] text-ink-muted text-center mt-2.5 flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-primary" /> Activity tracked automatically from uploads & status changes — see Submissions
          </p>
        </PremiumCard>
      </div>
    </div>
  );
}
