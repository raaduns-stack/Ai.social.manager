import { useState, useMemo, useEffect } from "react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/layout/PageHeader";
import PremiumCard from "../../components/designer/premium/PremiumCard";
import SegmentedControl from "../../components/designer/premium/SegmentedControl";
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Wallet, ClipboardList, Check } from "lucide-react";
import {
  getDesignerNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../features/designer/designer-api";
import { timeAgo, groupLabel } from "../../features/designer/format";

const TYPE_META = {
  task: { tone: "primary", Icon: ClipboardList },
  revision: { tone: "danger", Icon: AlertTriangle },
  approved: { tone: "success", Icon: CheckCircle2 },
  payment: { tone: "success", Icon: Wallet },
  system: { tone: "neutral", Icon: Bell },
};

export default function DesignerNotifications() {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getDesignerNotifications());
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unreadCount = items.filter((i) => !i.read).length;

  const filtered = useMemo(() => {
    const withMeta = items.map((i) => ({
      ...i,
      group: groupLabel(i.createdAt),
      meta: TYPE_META[i.type] || TYPE_META.system,
    }));
    if (filter === "all") return withMeta;
    return withMeta.filter((i) => i.type === filter);
  }, [items, filter]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: e?.response?.data?.message || "Could not mark all as read.", type: "error" } }));
    } finally {
      setMarkingAll(false);
    }
  };

  const markOneRead = async (id, alreadyRead) => {
    if (alreadyRead) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    try {
      await markNotificationRead(id);
    } catch {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: false } : i)));
    }
  };

  const groups = ["Today", "Yesterday", "Earlier"];

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <PremiumCard className="p-5">
          <div className="h-6 w-48 rounded bg-canvas animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-canvas animate-pulse mt-2" />
        </PremiumCard>
        {[0, 1, 2].map((i) => (
          <PremiumCard key={i} className="p-4 h-20 animate-pulse bg-canvas/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-3xl">
        <PremiumCard className="p-12 text-center space-y-3 border-dashed">
          <span className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-danger">
            <AlertCircle size={20} />
          </span>
          <p className="font-bold text-ink">Could not load notifications</p>
          <p className="text-sm text-ink-muted">{error}</p>
          <Button onClick={load} className="rounded-lg text-sm">Try again</Button>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        variant="premium"
        eyebrow="Inbox — Notifications"
        title="Notifications"
        description="Grouped by time. Mark read, filter by type — and mirror to email in Settings."
      />

      <PremiumCard className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <SegmentedControl
          options={[
            { value: "all", label: "All" },
            { value: "task", label: "Tasks" },
            { value: "revision", label: "Revisions" },
            { value: "approved", label: "Approvals" },
            { value: "payment", label: "Payments" },
          ]}
          value={filter}
          onChange={setFilter}
          size="sm"
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-xs font-mono text-ink-muted">{unreadCount} unread • {filtered.length} total</span>
          <button onClick={markAllRead} disabled={unreadCount === 0 || markingAll} className="h-8 px-3 rounded-full bg-ink hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none">
            <Check size={12} /> {markingAll ? "Marking…" : "Mark all read"}
          </button>
        </div>
      </PremiumCard>

      <div className="space-y-6">
        {groups.map((g) => {
          const groupItems = filtered.filter((i) => i.group === g);
          if (groupItems.length === 0) return null;
          return (
            <div key={g} className="space-y-3">
              <p className="dp-mono text-ink-muted px-1">{g}</p>
              <div className="space-y-2">
                {groupItems.map(({ id, title, message, createdAt, type, read, meta }) => {
                  const { tone, Icon } = meta;
                  const unread = !read;
                  return (
                    <PremiumCard
                      key={id}
                      onClick={() => markOneRead(id, read)}
                      className={`p-4 flex items-start gap-3 relative overflow-hidden ${unread ? "border-primary-100 bg-primary-50/30 cursor-pointer" : ""}`}
                    >
                      {unread && <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${tone === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : tone === "danger" ? "bg-red-50 text-red-600 border-red-200" : tone === "primary" ? "bg-primary-50 text-primary border-primary-100" : "bg-white text-ink-muted border-border"}`}>
                        <Icon size={16} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink leading-snug">{title}</p>
                        {message && <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{message}</p>}
                        <p className="text-xs text-ink-muted mt-1 flex items-center gap-1.5"><ClockDot time={timeAgo(createdAt)} /> • {type}</p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                        <Badge tone={tone} className="capitalize text-[11px]">{type}</Badge>
                        {unread ? <span className="w-2 h-2 rounded-full bg-primary dp-pulse" /> : <span className="text-[11px] text-ink-muted">read</span>}
                      </div>
                    </PremiumCard>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <PremiumCard className="p-12 text-center space-y-3 border-dashed">
            <span className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center mx-auto text-ink-muted">
              <Bell size={20} />
            </span>
            <p className="font-bold text-ink">No notifications in this filter</p>
            <p className="text-sm text-ink-muted">Try "All" or check back — we'll notify for tasks, revisions and payouts.</p>
          </PremiumCard>
        )}
      </div>

      {unreadCount === 0 && filtered.length > 0 && (
        <PremiumCard className="p-4 bg-canvas border-dashed text-center">
          <p className="text-xs text-ink-muted">You're all caught up. Also sent via email if enabled in <span className="font-semibold text-ink">Settings → Notifications</span>.</p>
        </PremiumCard>
      )}
    </div>
  );
}

function ClockDot({ time }) {
  return <span className="inline-flex items-center gap-1 text-xs text-ink-muted"><span className="w-1 h-1 rounded-full bg-border" /> {time}</span>;
}
