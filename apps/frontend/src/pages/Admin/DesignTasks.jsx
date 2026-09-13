import { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  getAdminDesignTasks,
  createAdminDesignTask,
  updateAdminDesignTask,
  deleteAdminDesignTask,
} from '../../features/admin/design-management-api';
import apiClient from '../../lib/api-client';

const PRIORITY_TONES = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

const STATUS_TONES = {
  open: 'warning',
  in_progress: 'primary',
  done: 'success',
};

export default function AdminDesignTasks() {
  const [tasks, setTasks] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [designerFilter, setDesignerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });

  // Selected Task for Edit/View
  const [editingTask, setEditingTask] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, designersRes] = await Promise.all([
        getAdminDesignTasks(),
        apiClient.get('/admin/users?role=designer').catch(() => ({ data: { data: [] } })),
      ]);

      setTasks(tasksRes || []);
      const dList = designersRes?.data?.data || designersRes?.data || [];
      setDesigners(Array.isArray(dList) ? dList : []);
    } catch (err) {
      console.error('Failed to load design tasks:', err);
      setError('Failed to load design tasks from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!formData.title.trim()) {
      setModalError('Task title is required.');
      return;
    }
    if (!formData.assignedTo) {
      setModalError('Please select a graphic designer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminDesignTask({
        title: formData.title.trim(),
        brief: formData.brief.trim() || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        assignedTo: formData.assignedTo,
      });

      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        brief: '',
        priority: 'medium',
        dueDate: '',
        assignedTo: '',
      });
      await fetchInitialData();
    } catch (err) {
      console.error('Failed to create task:', err);
      setModalError(err?.response?.data?.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateAdminDesignTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert('Could not update task status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteAdminDesignTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Could not delete task.');
    }
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (designerFilter !== 'all' && t.assignedTo !== designerFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchAssignee = t.assignee?.fullName?.toLowerCase().includes(q);
        if (!matchTitle && !matchAssignee) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, designerFilter, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const total = tasks.length;
    const open = tasks.filter((t) => t.status === 'open').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    return { total, open, inProgress, done };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Design Tasks & Assignments"
        description="Assign, track, and manage graphic design tasks, deadlines, and priorities."
        action={
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} />
            <span>Create Design Task</span>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase">Total Tasks</span>
            <div className="text-2xl font-bold text-ink mt-1">{kpis.total}</div>
          </div>
          <CheckSquare className="w-8 h-8 text-primary/30" />
        </Card>
        <Card className="p-4 border-l-4 border-l-warning flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase">Open Tasks</span>
            <div className="text-2xl font-bold text-ink mt-1">{kpis.open}</div>
          </div>
          <Clock className="w-8 h-8 text-warning/30" />
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase">In Progress</span>
            <div className="text-2xl font-bold text-ink mt-1">{kpis.inProgress}</div>
          </div>
          <AlertCircle className="w-8 h-8 text-blue-500/30" />
        </Card>
        <Card className="p-4 border-l-4 border-l-success flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase">Completed</span>
            <div className="text-2xl font-bold text-ink mt-1">{kpis.done}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-success/30" />
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by title or designer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-control border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-3 rounded-control border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Designer Filter */}
            <select
              value={designerFilter}
              onChange={(e) => setDesignerFilter(e.target.value)}
              className="h-9 px-3 rounded-control border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary max-w-[180px]"
            >
              <option value="all">All Designers</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName || d.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tasks Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-ink-muted text-sm flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading tasks...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-danger text-sm flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-danger" />
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={fetchInitialData}>
              Retry
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-sm flex flex-col items-center gap-2">
            <CheckSquare className="w-10 h-10 text-border" />
            <span className="font-medium text-ink">No tasks found</span>
            <span className="text-xs max-w-sm">
              {tasks.length === 0
                ? 'Get started by creating your first task and assigning it to a graphic designer.'
                : 'No tasks match your selected filter criteria.'}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-ink-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Designer</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-variant/30 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-ink truncate">{t.title}</div>
                      {t.brief && (
                        <div className="text-xs text-ink-muted line-clamp-1 mt-0.5">{t.brief}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-ink">
                        {t.assignee?.fullName || 'Unassigned'}
                      </div>
                      <div className="text-[11px] text-ink-muted">{t.assignee?.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge tone={PRIORITY_TONES[t.priority] || 'neutral'} className="capitalize">
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {t.dueDate ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-ink-muted" />
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-ink-muted/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        className="h-7 px-2 text-xs rounded border border-border bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1.5 text-danger/80 hover:text-danger hover:bg-danger/10 rounded transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create & Assign Design Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Task Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramadan Sale Instagram Banners"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-9 px-3 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Assign To Designer <span className="text-danger">*</span>
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full h-9 px-3 rounded-control border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select a designer...</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName ? `${d.fullName} (${d.email})` : d.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full h-9 px-3 rounded-control border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full h-9 px-3 rounded-control border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Brief & Instructions</label>
            <textarea
              rows={4}
              placeholder="Detailed design brief, format requirements, brand guidelines..."
              value={formData.brief}
              onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
              className="w-full p-3 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : 'Create & Assign Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
