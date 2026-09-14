import { useState, useMemo, useEffect } from "react";
import { ClipboardList, Calendar, LayoutGrid, Table2, Timer, AlertCircle } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/layout/PageHeader";
import PremiumCard from "../../components/designer/premium/PremiumCard";
import SegmentedControl from "../../components/designer/premium/SegmentedControl";
import StatusDot from "../../components/designer/premium/StatusDot";
import { Link } from "react-router-dom";
import { getDesignerTasks } from "../../features/designer/designer-api";
import { formatDue } from "../../features/designer/format";

const priorityTone = { high: "danger", medium: "warning", low: "neutral" };
const statusTone = { open: "warning", in_progress: "primary", done: "success" };

function shortId(id) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

function dueTone(dateStr) {
  if (!dateStr) return "text-ink-muted bg-canvas border-border";
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 2) return "text-danger bg-red-50 border-red-200";
  if (diff < 5) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-ink-muted bg-canvas border-border";
}

export default function DesignerTasks() {
  const [filter, setFilter] = useState("all");
  const [prio, setPrio] = useState("all");
  const [view, setView] = useState("table");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await getDesignerTasks());
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (prio !== "all" && t.priority !== prio) return false;
      return true;
    });
  }, [tasks, filter, prio]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PremiumCard className="p-5">
          <div className="h-6 w-48 rounded bg-canvas animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-canvas animate-pulse mt-2" />
        </PremiumCard>
        <PremiumCard className="p-5 h-64 animate-pulse bg-canvas/50" />
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
          <p className="font-bold text-ink">Could not load tasks</p>
          <p className="text-sm text-ink-muted">{error}</p>
          <Button onClick={load} className="rounded-lg text-sm">Try again</Button>
        </PremiumCard>
      </div>
    );
  }

  const columns = [
    { key: "id", label: "ID", sortable: true, render: (r) => <span className="font-mono text-xs tracking-wide text-ink-muted">{shortId(r.id)}</span> },
    {
      key: "title",
      label: "Task",
      render: (r) => (
        <div className="flex gap-3 items-start min-w-[240px]">
          <span className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center shrink-0 mt-0.5">
            <ClipboardList size={14} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink text-sm leading-tight">{r.title}</p>
            <p className="text-xs text-ink-muted line-clamp-1">{r.brief}</p>
          </div>
        </div>
      ),
    },
    { key: "priority", label: "Priority", render: (r) => <Badge tone={priorityTone[r.priority]} className="capitalize text-xs">{r.priority}</Badge> },
    {
      key: "dueDate",
      label: "Due",
      render: (r) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${dueTone(r.dueDate)}`}>
          <Calendar size={12} /> {formatDue(r.dueDate)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status={r.status} pulse={r.status === "in_progress"} />
          <Badge tone={statusTone[r.status]} className="capitalize text-xs">{r.status.replace("_", " ")}</Badge>
        </span>
      ),
    },
    { key: "action", label: "", render: () => <Button as={Link} to="/designer/submissions" variant="outline" size="sm" className="rounded-lg text-xs">Start Submission</Button> },
  ];

  const boardGroups = [
    { key: "open", label: "Open", color: "#F59E0B" },
    { key: "in_progress", label: "In Progress", color: "#FF6600" },
    { key: "done", label: "Done", color: "#10B981" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        variant="premium"
        eyebrow="Work — Assigned Tasks"
        title="Assigned Tasks"
        description="Every brief assigned to you. Start a submission directly — drafts auto-save to Submissions."
      />

      {/* Controls */}
      <PremiumCard className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            options={[
              { value: "all", label: "All" },
              { value: "open", label: "Open" },
              { value: "in_progress", label: "In Progress" },
              { value: "done", label: "Done" },
            ]}
            value={filter}
            onChange={setFilter}
            size="sm"
          />
          <select
            value={prio}
            onChange={(e) => setPrio(e.target.value)}
            className="h-8 px-2.5 rounded-full border border-border bg-white text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <span className="text-xs font-mono text-ink-muted flex items-center gap-1.5"><ClipboardList size={14} /> {filtered.length} tasks</span>
          <div className="h-6 w-px bg-border mx-1" />
          <div className="flex rounded-full border border-border overflow-hidden p-1 bg-canvas">
            <button onClick={() => setView("table")} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${view === "table" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}>
              <Table2 size={14} />
            </button>
            <button onClick={() => setView("board")} className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${view === "board" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </PremiumCard>

      {filtered.length === 0 ? (
        <PremiumCard className="p-12 text-center space-y-3 border-dashed">
          <span className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center mx-auto text-ink-muted">
            <ClipboardList size={20} />
          </span>
          <p className="font-bold text-ink">No tasks in this filter</p>
          <p className="text-sm text-ink-muted">Try another priority or check back later. Tasks are created by admins.</p>
        </PremiumCard>
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-2xl">
          <DataTable columns={columns} data={filtered} searchKeys={["title", "brief", "id"]} emptyMessage="No tasks assigned yet." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boardGroups.map((g) => {
            const items = filtered.filter((t) => t.status === g.key);
            return (
              <div key={g.key} className="rounded-2xl border border-border bg-canvas/50 overflow-hidden flex flex-col min-h-[280px]">
                <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-border">
                  <span className="flex items-center gap-2 text-xs font-bold text-ink">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} /> {g.label}
                  </span>
                  <span className="text-xs font-mono bg-canvas border border-border px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="p-3 space-y-3 flex-1">
                  {items.length === 0 ? (
                    <p className="text-xs text-ink-muted text-center py-6">No tasks</p>
                  ) : (
                    items.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl bg-white border border-border shadow-sm hover:shadow-premium hover:border-primary-100 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-ink leading-tight">{t.title}</p>
                          <Badge tone={priorityTone[t.priority]} className="capitalize text-[11px] shrink-0">{t.priority}</Badge>
                        </div>
                        <p className="text-xs text-ink-muted mt-1 line-clamp-2">{t.brief}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${dueTone(t.dueDate)}`}>
                            <Timer size={11} /> {formatDue(t.dueDate)}
                          </span>
                          <Link to="/designer/submissions" className="text-xs font-bold text-primary hover:text-primary-700">Start →</Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
