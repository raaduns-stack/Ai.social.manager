import { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Download,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  getAdminDesignSubmissions,
  getAdminDesignSubmissionDetail,
  reviewAdminDesignSubmission,
} from '../../features/admin/design-management-api';
import apiClient from '../../lib/api-client';

const STATUS_TONES = {
  draft: 'neutral',
  submitted: 'warning',
  received: 'neutral',
  under_review: 'primary',
  revision_required: 'danger',
  resubmitted: 'warning',
  approved: 'success',
  completed: 'success',
};

export default function AdminDesignSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [designerFilter, setDesignerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, designersRes] = await Promise.all([
        getAdminDesignSubmissions(),
        apiClient.get('/admin/users?role=designer').catch(() => ({ data: { data: [] } })),
      ]);

      setSubmissions(subsRes || []);
      const dList = designersRes?.data?.data || designersRes?.data || [];
      setDesigners(Array.isArray(dList) ? dList : []);
    } catch (err) {
      console.error('Failed to load design submissions:', err);
      setError('Failed to load designer submissions from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleOpenReview = async (subId) => {
    setReviewError('');
    setIsReviewModalOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getAdminDesignSubmissionDetail(subId);
      setSelectedSubmission(detail);
      setReviewDecision(detail.status === 'revision_required' ? 'revision_required' : 'approved');
      setReviewNotes('');
    } catch (err) {
      console.error('Failed to fetch submission detail:', err);
      setReviewError('Failed to load submission details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setReviewError('');
    setIsSubmittingReview(true);
    try {
      const updated = await reviewAdminDesignSubmission(selectedSubmission.id, {
        status: reviewDecision,
        notes: reviewNotes.trim() || undefined,
      });

      setSelectedSubmission(updated);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, status: updated.status } : s))
      );
      setIsReviewModalOpen(false);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewError(err?.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(submissions.map((s) => s.category).filter(Boolean));
    return Array.from(set);
  }, [submissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (designerFilter !== 'all' && s.designerId !== designerFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchDesigner = s.designer?.fullName?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesigner) return false;
      }
      return true;
    });
  }, [submissions, statusFilter, categoryFilter, designerFilter, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) =>
      ['submitted', 'received', 'under_review', 'resubmitted'].includes(s.status)
    ).length;
    const approved = submissions.filter((s) =>
      ['approved', 'completed'].includes(s.status)
    ).length;
    const revisions = submissions.filter((s) => s.status === 'revision_required').length;
    return { total, pending, approved, revisions };
  }, [submissions]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Submissions & Reviews"
        description="Inspect graphic designer work, review submitted files, approve deliverables, and request revisions."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase">Total Submissions</span>
            <div className="text-2xl font-bold text-ink mt-1">{kpis.total}</div>
          </div>
          <FileCheck className="w-8 h-8 text-primary/30" />
        </Card>
        <Card className="p-4 border-l-4 border-l-warning flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase">Pending Review</span>
            <div className="text-2xl font-bold text-ink mt-1">{kpis.pending}</div>
          </div>
          <Clock className="w-8 h-8 text-warning/30" />
        </Card>
        <Card className="p-4 border-l-4 border-l-success flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase">Approved</span>
            <div className="text-2xl font-bold text-ink mt-1">{kpis.approved}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-success/30" />
        </Card>
        <Card className="p-4 border-l-4 border-l-danger flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase">Revisions Req.</span>
            <div className="text-2xl font-bold text-ink mt-1">{kpis.revisions}</div>
          </div>
          <XCircle className="w-8 h-8 text-danger/30" />
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
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="revision_required">Revision Required</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-control border border-border bg-surface text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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

      {/* Submissions Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-ink-muted text-sm flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading submissions...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-danger text-sm flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-danger" />
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={fetchSubmissions}>
              Retry
            </Button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-16 text-center text-ink-muted text-sm flex flex-col items-center gap-2">
            <FileCheck className="w-10 h-10 text-border" />
            <span className="font-medium text-ink">No submissions found</span>
            <span className="text-xs max-w-sm">
              {submissions.length === 0
                ? 'When graphic designers submit design files, they will appear here for staff review and approval.'
                : 'No submissions match your selected filter criteria.'}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border text-ink-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Designer</th>
                  <th className="px-4 py-3">Linked Task</th>
                  <th className="px-4 py-3">Files</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-variant/30 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-ink truncate">{s.title}</div>
                      <div className="text-[11px] text-ink-muted mt-0.5">{s.category}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-ink">
                        {s.designer?.fullName || 'Unknown Designer'}
                      </div>
                      <div className="text-[11px] text-ink-muted">{s.designer?.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.task ? (
                        <span className="text-ink font-medium truncate max-w-[150px] inline-block">
                          {s.task.title}
                        </span>
                      ) : (
                        <span className="text-ink-muted/50">Direct Submission</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-ink font-medium">
                        <FileText size={13} className="text-primary" />
                        {s.files?.length || 0} file(s)
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge tone={STATUS_TONES[s.status] || 'neutral'} className="capitalize">
                        {s.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1.5 ml-auto"
                        onClick={() => handleOpenReview(s.id)}
                      >
                        <Eye size={13} />
                        <span>Review</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Submission Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={selectedSubmission ? `Review: ${selectedSubmission.title}` : 'Review Submission'}
      >
        {detailLoading ? (
          <div className="py-12 text-center text-ink-muted text-sm flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading submission details...</span>
          </div>
        ) : selectedSubmission ? (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {reviewError && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Submission Info Bar */}
            <div className="p-3 bg-canvas border border-border rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Designer:</span>
                <span className="font-semibold text-ink">
                  {selectedSubmission.designer?.fullName} ({selectedSubmission.designer?.email})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Category:</span>
                <span className="font-semibold text-ink">{selectedSubmission.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Current Status:</span>
                <Badge tone={STATUS_TONES[selectedSubmission.status] || 'neutral'} className="capitalize">
                  {selectedSubmission.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              {selectedSubmission.description && (
                <div className="pt-2 border-t border-border/50 text-ink-muted">
                  <span className="font-medium text-ink">Notes: </span>
                  {selectedSubmission.description}
                </div>
              )}
            </div>

            {/* Attached Files */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Attached Files ({selectedSubmission.files?.length || 0})
              </label>
              {selectedSubmission.files && selectedSubmission.files.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedSubmission.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-md text-xs hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={15} className="text-primary shrink-0" />
                        <span className="font-medium text-ink truncate">{file.originalName}</span>
                        <span className="text-[11px] text-ink-muted shrink-0">
                          ({Math.round(file.fileSize / 1024)} KB)
                        </span>
                      </div>
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-primary hover:text-primary-hover flex items-center gap-1 font-medium shrink-0 ml-2"
                      >
                        <ExternalLink size={13} />
                        <span>View</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-ink-muted bg-canvas rounded border border-border">
                  No files attached to this submission.
                </div>
              )}
            </div>

            {/* Activity History */}
            {selectedSubmission.activities && selectedSubmission.activities.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Review & Activity History
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[11px]">
                  {selectedSubmission.activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-2 bg-canvas rounded border border-border/60 flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-ink capitalize">{act.type}: </span>
                        <span className="text-ink-muted">{act.title}</span>
                      </div>
                      <span className="text-ink-muted shrink-0">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Decision Form */}
            <div className="pt-3 border-t border-border space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Review Decision <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('approved')}
                    className={`h-9 rounded-control border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      reviewDecision === 'approved'
                        ? 'bg-success text-white border-success'
                        : 'border-border text-ink hover:bg-surface-variant'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('revision_required')}
                    className={`h-9 rounded-control border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      reviewDecision === 'revision_required'
                        ? 'bg-danger text-white border-danger'
                        : 'border-border text-ink hover:bg-surface-variant'
                    }`}
                  >
                    <XCircle size={14} />
                    <span>Request Revision</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('under_review')}
                    className={`h-9 rounded-control border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      reviewDecision === 'under_review'
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-ink hover:bg-surface-variant'
                    }`}
                  >
                    <Clock size={14} />
                    <span>In Review</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Review Notes / Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    reviewDecision === 'approved'
                      ? 'Optional approval comments or congratulations...'
                      : 'Specify what needs revision or changes...'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-control border border-border bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmittingReview}>
                {isSubmittingReview ? 'Submitting...' : 'Save Review Decision'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
