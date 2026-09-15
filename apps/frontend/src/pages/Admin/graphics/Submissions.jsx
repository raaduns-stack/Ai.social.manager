/**
 * graphics/Submissions.jsx
 * ---------------------------------------------------------------------------
 * Admin Design Submission, Review & Approval (FeatureList GRAPHICS §4).
 * Live data over /api/admin/graphics/submissions/* via
 * features/admin/graphics-api. Review modal follows the Kyc.jsx
 * approve/reject pattern; the reviewer note is required for revisions.
 * ---------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  Inbox,
  SearchCheck,
  History,
  CheckCircle2,
  FileImage,
  FileText,
  MessageSquareText,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
function resolveFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  try {
    const base = new URL(API_BASE_URL, window.location.origin);
    return base.origin + (path.startsWith("/") ? path : "/" + path);
  } catch {
    return path;
  }
}
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";
import DataTable from "../../../components/ui/DataTable";
import ErrorBanner from "../../../components/error-banner";
import {
  listGraphicsSubmissions,
  getGraphicsSubmission,
  reviewGraphicsSubmission,
} from "../../../features/admin/graphics-api";

const REVIEW_ACTIONS = [
  { key: "received", label: "Mark Received" },
  { key: "under_review", label: "Start Review" },
  { key: "revision_required", label: "Request Revision" },
  { key: "approved", label: "Approve" },
  { key: "completed", label: "Mark Completed" },
];

const STATUS_TONE = {
  draft: "neutral",
  submitted: "warning",
  received: "primary",
  under_review: "primary",
  revision_required: "danger",
  resubmitted: "warning",
  approved: "success",
  completed: "success",
};

const STATUS_LABEL = {
  draft: "Draft",
  submitted: "Submitted",
  received: "Received",
  under_review: "Under Review",
  revision_required: "Revision Required",
  resubmitted: "Resubmitted",
  approved: "Approved",
  completed: "Completed",
};

const actionNeedsNote = (action) => action === "revision_required";

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 16).replace("T", " ");
};

const toApiError = (err) => err?.message || "Something went wrong. Please try again.";

export default function AdminGraphicsSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewFileId, setPreviewFileId] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState("under_review");
  const [reviewerNote, setReviewerNote] = useState("");
  const [reviewError, setReviewError] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      setSubmissions(await listGraphicsSubmissions());
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const openDetail = async (submission) => {
    setSelectedId(submission.id);
    setDetail(null);
    setPreviewFileId(null);
    setDetailLoading(true);
    try {
      const full = await getGraphicsSubmission(submission.id);
      setDetail(full);
      const firstImg = Array.isArray(full.files) ? full.files.find((f) => f.mimeType?.startsWith("image/")) : null;
      if (firstImg) setPreviewFileId(firstImg.id);
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
    setPreviewFileId(null);
  };

  const stats = useMemo(() => {
    const awaiting = submissions.filter((s) =>
      ["submitted", "received", "resubmitted"].includes(s.status)
    ).length;
    const inReview = submissions.filter((s) => s.status === "under_review").length;
    const revisions = submissions.filter((s) => s.status === "revision_required").length;
    const approved = submissions.filter((s) => ["approved", "completed"].includes(s.status)).length;
    return { awaiting, inReview, revisions, approved };
  }, [submissions]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      return true;
    });
  }, [submissions, statusFilter, categoryFilter]);

  const detailImageFiles = useMemo(
    () => (Array.isArray(detail?.files) ? detail.files.filter((f) => f.mimeType?.startsWith("image/")) : []),
    [detail],
  );
  const detailPreviewFile = useMemo(
    () => detailImageFiles.find((f) => f.id === previewFileId) || detailImageFiles[0] || null,
    [detailImageFiles, previewFileId],
  );

  const openReview = async (submission, action) => {
    setSelectedId(submission.id);
    setReviewAction(action);
    setReviewerNote("");
    setReviewError(null);
    setIsReviewOpen(true);
    // Table rows carry no files/history — load the full detail for the modal.
    if (Array.isArray(submission.files) && Array.isArray(submission.history)) {
      setDetail(submission);
      const firstImg = submission.files.find((f) => f.mimeType?.startsWith("image/"));
      setPreviewFileId(firstImg ? firstImg.id : null);
    } else {
      try {
        const full = await getGraphicsSubmission(submission.id);
        setDetail(full);
        const firstImg = Array.isArray(full.files) ? full.files.find((f) => f.mimeType?.startsWith("image/")) : null;
        setPreviewFileId(firstImg ? firstImg.id : null);
      } catch (err) {
        setReviewError(toApiError(err));
      }
    }
  };

  const submitReview = async () => {
    if (actionNeedsNote(reviewAction) && !reviewerNote.trim()) {
      setReviewError("A note is required when requesting a revision.");
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const updated = await reviewGraphicsSubmission(selectedId, {
        status: reviewAction,
        note: reviewerNote.trim() || undefined,
      });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === selectedId ? { ...s, ...updated } : s))
      );
      setIsReviewOpen(false);
      // Refresh the open detail view with files + history.
      setDetail(await getGraphicsSubmission(selectedId));
    } catch (err) {
      setReviewError(toApiError(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const columns = [
    { key: "title", label: "Submission" },
    {
      key: "designer",
      label: "Designer",
      render: (row) => <span className="text-sm">{row.designer ?? "—"}</span>,
    },
    { key: "category", label: "Category" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      key: "files",
      label: "Files",
      sortable: false,
      render: (row) => <span className="text-sm">{row.files}</span>,
    },
    {
      key: "updatedAt",
      label: "Updated",
      render: (row) => <span className="text-sm">{formatDateTime(row.updatedAt)}</span>,
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
            onClick={() => openReview(row, "approved")}
            aria-label={`Review ${row.title}`}
            className="rounded-control p-1.5 text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
          >
            <SearchCheck size={16} />
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design Submissions"
        description="Review submitted graphics against task requirements, then approve or request revisions."
      />

      {error && <ErrorBanner message={error} onRetry={loadSubmissions} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Awaiting Review", value: stats.awaiting, icon: Inbox },
          { label: "Under Review", value: stats.inReview, icon: SearchCheck },
          { label: "Revisions", value: stats.revisions, icon: MessageSquareText },
          { label: "Approved", value: stats.approved, icon: CheckCircle2 },
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

      {/* Filters + table */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="rounded-control border border-border bg-surface px-3 py-2 text-ink"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="rounded-control border border-border bg-surface px-3 py-2 text-ink"
          >
            <option value="all">All categories</option>
            <option value="General Graphics">General Graphics</option>
            <option value="Hospitality">Hospitality</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted">
            <Loader2 size={16} className="animate-spin" /> Loading submissions…
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            searchKeys={["title", "designer", "task"]}
            emptyMessage="No submissions match these filters."
          />
        )}
      </Card>

      {/* Detail modal */}
      <Modal open={!!selectedId && !isReviewOpen} onClose={closeDetail} title={detail?.title}>
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted">
            <Loader2 size={16} className="animate-spin" /> Loading submission…
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[detail.status] ?? "neutral"}>
                {STATUS_LABEL[detail.status] ?? detail.status}
              </Badge>
              <Badge tone="neutral">{detail.category}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Designer</p>
                <p className="mt-1 text-ink">{detail.designer ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Task</p>
                <p className="mt-1 text-ink">{detail.task ?? "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Description</p>
              <p className="mt-1 text-ink">{detail.description || "No description provided."}</p>
            </div>
            {/* Design preview — images rendered inline, not just filenames */}
            {Array.isArray(detail.files) && detail.files.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Design preview</p>
                {detailPreviewFile ? (
                  <div className="mt-2 space-y-2">
                    <div className="rounded-xl overflow-hidden border border-border bg-canvas">
                      <a href={resolveFileUrl(detailPreviewFile.fileUrl)} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={resolveFileUrl(detailPreviewFile.fileUrl)}
                          alt={detailPreviewFile.originalName || detail.title}
                          className="w-full h-auto max-h-[420px] object-contain bg-white"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </a>
                    </div>
                    {detailImageFiles.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {detailImageFiles.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setPreviewFileId(f.id)}
                            aria-label={`Preview ${f.originalName}`}
                            className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${detailPreviewFile.id === f.id ? "border-primary" : "border-transparent hover:border-border"}`}
                          >
                            <img
                              src={resolveFileUrl(f.fileUrl)}
                              alt=""
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                              className="h-14 w-20 object-cover bg-canvas"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink-muted truncate flex-1">{detailPreviewFile.originalName} • {formatFileSize(detailPreviewFile.fileSize)}</span>
                      <a href={resolveFileUrl(detailPreviewFile.fileUrl)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:text-primary-700 shrink-0">
                        Open full →
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-border bg-canvas p-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-ink-muted shrink-0">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink truncate">{detail.files[0]?.originalName}</p>
                      <p className="text-xs text-ink-muted mt-0.5">PDF preview isn&apos;t inline — open the file to view the design.</p>
                    </div>
                    <a href={resolveFileUrl(detail.files[0]?.fileUrl)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="rounded-lg shrink-0">Open</Button>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Files ({Array.isArray(detail.files) ? detail.files.length : detail.files ?? 0})
              </p>
              {Array.isArray(detail.files) ? (
                <ul className="mt-2 space-y-2">
                  {detail.files.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 rounded-control border border-border bg-canvas px-3 py-2"
                    >
                      <a href={resolveFileUrl(f.fileUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 flex-1 hover:text-primary transition-colors">
                        <FileImage size={16} className="shrink-0 text-ink-muted" />
                        <span className="min-w-0 flex-1 truncate text-ink">{f.originalName}</span>
                      </a>
                      <span className="text-xs text-ink-muted">{formatFileSize(f.fileSize)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-ink-muted">Open the submission to load file details.</p>
              )}
            </div>
            {Array.isArray(detail.history) && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Approval history</p>
                {detail.history.length === 0 ? (
                  <p className="mt-1 text-xs text-ink-muted">No activity recorded yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2 border-l border-border pl-4">
                    {detail.history.map((h) => (
                      <li key={h.id}>
                        <p className="text-ink">{h.title}</p>
                        <p className="text-xs text-ink-muted">{formatDateTime(h.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => openReview(detail, "revision_required")}>
                Request Revision
              </Button>
              <Button variant="primary" size="md" onClick={() => openReview(detail, "approved")}>
                <CheckCircle2 size={16} /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Review modal (Kyc approve/reject pattern) */}
      <Modal open={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Review submission">
        <div className="space-y-4 text-sm">
          <p className="text-ink">
            Reviewing <span className="font-semibold">“{detail?.title}”</span> by {detail?.designer ?? "—"}.
          </p>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gs-action">
              Decision
            </label>
            <select
              id="gs-action"
              value={reviewAction}
              onChange={(e) => {
                setReviewAction(e.target.value);
                setReviewError(null);
              }}
              className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink"
            >
              {REVIEW_ACTIONS.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gs-note">
              Reviewer note {actionNeedsNote(reviewAction) ? "(required)" : "(optional)"}
            </label>
            <textarea
              id="gs-note"
              value={reviewerNote}
              onChange={(e) => {
                setReviewerNote(e.target.value);
                setReviewError(null);
              }}
              rows={4}
              maxLength={2000}
              placeholder="What passes, what must change, and why…"
              className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink outline-none focus:border-primary"
            />
          </div>
          {reviewError && (
            <p className="flex items-center gap-2 text-sm text-danger" role="alert">
              <History size={16} /> {reviewError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setIsReviewOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={submitReview} disabled={submittingReview}>
              {submittingReview && <Loader2 size={16} className="animate-spin" />} Submit review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
