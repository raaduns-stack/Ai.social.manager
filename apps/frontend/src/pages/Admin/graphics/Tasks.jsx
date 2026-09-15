/**
 * graphics/Tasks.jsx
 * ---------------------------------------------------------------------------
 * Admin Design Task Management (FeatureList GRAPHICS §3).
 * Merged into the existing admin portal: mounted from AdminRoutes inside
 * AdminLayout, listed in AdminSidebar under a "Graphics" section.
 * Live data over /api/admin/graphics/tasks/* via features/admin/graphics-api.
 * ---------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ClipboardList,
  CircleDot,
  Timer,
  CheckCircle2,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";
import DataTable from "../../../components/ui/DataTable";
import ErrorBanner from "../../../components/error-banner";
import {
  listGraphicsTasks,
  getGraphicsTask,
  createGraphicsTask,
  updateGraphicsTask,
  deleteGraphicsTask,
  listGraphicsDesigners,
} from "../../../features/admin/graphics-api";

const STATUS_TONE = { open: "warning", in_progress: "primary", done: "success" };
const STATUS_LABEL = { open: "Open", in_progress: "In Progress", done: "Done" };
const PRIORITY_TONE = { high: "danger", medium: "warning", low: "neutral" };

const formatDate = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 10);
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 16).replace("T", " ");
};

const toApiError = (err) => err?.message || "Something went wrong. Please try again.";

export default function AdminGraphicsTasks() {
  const [tasks, setTasks] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("all"); // all | active
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskRows, designerRows] = await Promise.all([
        listGraphicsTasks(),
        listGraphicsDesigners(),
      ]);
      setTasks(taskRows);
      setDesigners(designerRows);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const openDetail = async (task) => {
    setSelectedId(task.id);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await getGraphicsTask(task.id));
    } catch (err) {
      setError(toApiError(err));
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const stats = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "done").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const today = new Date().toISOString().slice(0, 10);
    const overdue = tasks.filter(
      (t) => t.status !== "done" && t.dueDate && String(t.dueDate).slice(0, 10) < today
    ).length;
    return { total: tasks.length, active, done, overdue };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (tab === "active" && t.status === "done") return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, tab, statusFilter, priorityFilter]);

  const designerName = (id) => designers.find((d) => d.id === id)?.name ?? "Unassigned";

  const openCreate = () => {
    setFormError(null);
    setEditing({
      title: "",
      brief: "",
      priority: "medium",
      status: "open",
      dueDate: "",
      designerId: designers[0]?.id ?? "",
    });
    setIsFormOpen(true);
  };

  const openEdit = (task) => {
    setFormError(null);
    setEditing({
      id: task.id,
      title: task.title,
      brief: task.brief ?? "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
      designerId: task.designerId,
    });
    setIsFormOpen(true);
  };

  const saveForm = async () => {
    if (!editing.title.trim() || !editing.designerId) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        title: editing.title.trim(),
        brief: editing.brief.trim() || undefined,
        priority: editing.priority,
        dueDate: editing.dueDate || undefined,
        designerId: editing.designerId,
      };
      if (editing.id) {
        await updateGraphicsTask(editing.id, { ...payload, status: editing.status });
      } else {
        await createGraphicsTask(payload);
      }
      setIsFormOpen(false);
      setEditing(null);
      await loadTasks();
    } catch (err) {
      setFormError(toApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteGraphicsTask(selectedId);
      setIsDeleteOpen(false);
      closeDetail();
      await loadTasks();
    } catch (err) {
      setError(toApiError(err));
      setIsDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: "title", label: "Task" },
    {
      key: "designerId",
      label: "Designer",
      render: (row) => <span className="text-sm">{row.designerName ?? designerName(row.designerId)}</span>,
    },
    {
      key: "priority",
      label: "Priority",
      render: (row) => <Badge tone={PRIORITY_TONE[row.priority]}>{row.priority}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (row) => <span className="text-sm">{formatDate(row.dueDate)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <button
            onClick={() => openDetail(row)}
            aria-label={`View ${row.title}`}
            className="rounded-control p-1.5 text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openEdit(row)}
            aria-label={`Edit ${row.title}`}
            className="rounded-control p-1.5 text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedId(row.id);
              setDetail(row);
              setIsDeleteOpen(true);
            }}
            aria-label={`Delete ${row.title}`}
            className="rounded-control p-1.5 text-ink-muted hover:bg-canvas hover:text-danger transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design Tasks"
        description="Create, assign, and track every design task."
        action={
          <Button variant="primary" size="md" onClick={openCreate} disabled={loading}>
            <Plus size={16} /> New Task
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadTasks} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Tasks", value: stats.total, icon: ClipboardList },
          { label: "Active", value: stats.active, icon: Timer },
          { label: "Completed", value: stats.done, icon: CheckCircle2 },
          { label: "Overdue", value: stats.overdue, icon: CircleDot },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-control bg-canvas p-2 text-ink-muted">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
                <p className="text-lg font-semibold text-ink">{loading ? "—" : value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs + filters */}
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex rounded-control border border-border bg-canvas p-1 text-sm font-medium">
            {[
              { key: "all", label: "All Design Tasks" },
              { key: "active", label: "Active Tasks" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-control px-3 py-1.5 transition-colors ${
                  tab === t.key ? "bg-surface text-ink shadow-soft" : "text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="rounded-control border border-border bg-surface px-3 py-2 text-ink"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
              className="rounded-control border border-border bg-surface px-3 py-2 text-ink"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted">
            <Loader2 size={16} className="animate-spin" /> Loading tasks…
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            searchKeys={["title", "brief"]}
            emptyMessage="No tasks match these filters."
          />
        )}
      </Card>

      {/* Detail drawer */}
      <Modal open={!!selectedId && !isDeleteOpen} onClose={closeDetail} title={detail?.title}>
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted">
            <Loader2 size={16} className="animate-spin" /> Loading task…
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
              <Badge tone={PRIORITY_TONE[detail.priority]}>{detail.priority} priority</Badge>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Requirements</p>
              <p className="mt-1 text-ink">{detail.brief || "No brief provided."}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Assigned to</p>
                <p className="mt-1 text-ink">{detail.designerName ?? designerName(detail.designerId)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Due date</p>
                <p className="mt-1 text-ink">{formatDate(detail.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Created</p>
                <p className="mt-1 text-ink">{formatDate(detail.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Linked submissions</p>
                <p className="mt-1 text-ink">
                  {Array.isArray(detail.submissions) ? detail.submissions.length : detail.submissions}
                </p>
              </div>
            </div>
            {Array.isArray(detail.submissions) && detail.submissions.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Linked submissions</p>
                <ul className="mt-2 space-y-2">
                  {detail.submissions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-control border border-border bg-canvas px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-ink">{s.title}</span>
                      <span className="text-xs text-ink-muted">{s.status.replace(/_/g, " ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(detail.timeline) && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Activity timeline</p>
                <ul className="mt-2 space-y-2 border-l border-border pl-4">
                  {detail.timeline.map((e, i) => (
                    <li key={`${e.at}-${i}`}>
                      <p className="text-ink">{e.text}</p>
                      <p className="text-xs text-ink-muted">{formatDateTime(e.at)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create / edit modal */}
      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing?.id ? "Edit task" : "New task"}
      >
        {editing && (
          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gt-title">
                Title
              </label>
              <input
                id="gt-title"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                maxLength={255}
                placeholder="e.g. Ramadan promo banner set"
                className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gt-brief">
                Requirements brief
              </label>
              <textarea
                id="gt-brief"
                value={editing.brief}
                onChange={(e) => setEditing({ ...editing, brief: e.target.value })}
                rows={4}
                maxLength={2000}
                placeholder="Sizes, brand rules, deliverables…"
                className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gt-designer">
                  Assign to
                </label>
                <select
                  id="gt-designer"
                  value={editing.designerId}
                  onChange={(e) => setEditing({ ...editing, designerId: e.target.value })}
                  className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink"
                >
                  {designers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gt-priority">
                  Priority
                </label>
                <select
                  id="gt-priority"
                  value={editing.priority}
                  onChange={(e) => setEditing({ ...editing, priority: e.target.value })}
                  className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gt-due">
                  Due date
                </label>
                <input
                  id="gt-due"
                  type="date"
                  value={editing.dueDate}
                  onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                  className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gt-status">
                  Status
                </label>
                <select
                  id="gt-status"
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            {formError && (
              <p className="text-sm text-danger" role="alert">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={saveForm}
                disabled={!editing.title.trim() || !editing.designerId || saving}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing.id ? "Save changes" : "Create task"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete task">
        <p className="text-sm text-ink">
          Delete <span className="font-semibold">“{detail?.title}”</span>? Linked submissions stay in the
          submissions queue. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="md" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" size="md" onClick={confirmDelete} disabled={deleting}>
            {deleting && <Loader2 size={16} className="animate-spin" />} Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
