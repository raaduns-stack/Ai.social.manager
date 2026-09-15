/**
 * graphics/ImageToCode.jsx
 * ---------------------------------------------------------------------------
 * Admin Image-to-Code Management (FeatureList GRAPHICS §5).
 * Live data over /api/admin/graphics/image-to-code/* via
 * features/admin/graphics-api. Guidelines are static content and developer
 * handoff is copy/download (agreed — no guidelines table).
 * ---------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  Code2,
  ClipboardCheck,
  Copy,
  Download,
  Check,
  CheckCircle2,
  BookOpenText,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";
import DataTable from "../../../components/ui/DataTable";
import ErrorBanner from "../../../components/error-banner";
import {
  listGraphicsConversions,
  getGraphicsConversion,
  reviewGraphicsConversion,
  backfillGraphicsConversions,
} from "../../../features/admin/graphics-api";

const GUIDELINES = [
  "Export designs at 2x with exact spacing values annotated.",
  "Call out every interactive state (hover, active, focus, loading, empty).",
  "List fonts, sizes, and color hex values — never “same as before”.",
  "Flag anything the static image cannot show in Technical Notes.",
];

const STATUS_TONE = {
  not_started: "neutral",
  draft: "neutral",
  submitted: "warning",
  revision_required: "danger",
  accepted: "success",
};

const STATUS_LABEL = {
  not_started: "Not Started",
  draft: "Draft",
  submitted: "Submitted",
  revision_required: "Revision Required",
  accepted: "Accepted",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 16).replace("T", " ");
};

const toApiError = (err) => err?.message || "Something went wrong. Please try again.";

export default function AdminGraphicsImageToCode() {
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState("accepted"); // accepted | revision_required
  const [reviewerNote, setReviewerNote] = useState("");
  const [reviewError, setReviewError] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const loadConversions = async () => {
    setLoading(true);
    setError(null);
    try {
      setConversions(await listGraphicsConversions());
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Pull already-approved designs missing a conversion row into the queue.
  const syncApproved = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await backfillGraphicsConversions();
      setSyncMessage(
        result.created === 0
          ? "Queue is already in sync — no approved designs were missing."
          : `${result.created} approved design${result.created === 1 ? "" : "s"} added to the queue.`
      );
      await loadConversions();
    } catch (err) {
      setSyncMessage(toApiError(err));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadConversions();
  }, []);

  const openDetail = async (conversion) => {
    setSelectedId(conversion.id);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await getGraphicsConversion(conversion.id));
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
    const queue = conversions.filter((c) => c.status === "submitted").length;
    const revisions = conversions.filter((c) => c.status === "revision_required").length;
    const accepted = conversions.filter((c) => c.status === "accepted").length;
    return { queue, revisions, accepted, total: conversions.length };
  }, [conversions]);

  const filtered = useMemo(() => {
    return conversions.filter((c) => statusFilter === "all" || c.status === statusFilter);
  }, [conversions, statusFilter]);

  const openReview = async (conversion, action) => {
    setSelectedId(conversion.id);
    setReviewAction(action);
    setReviewerNote(conversion.reviewerNote ?? "");
    setReviewError(null);
    setIsReviewOpen(true);
    // Table rows carry no code/history — load the full detail for the modal.
    if (conversion.code !== undefined && Array.isArray(conversion.history)) {
      setDetail(conversion);
    } else {
      try {
        const full = await getGraphicsConversion(conversion.id);
        setDetail(full);
        setReviewerNote(full.reviewerNote ?? "");
      } catch (err) {
        setReviewError(toApiError(err));
      }
    }
  };

  const submitReview = async () => {
    if (reviewAction === "revision_required" && !reviewerNote.trim()) {
      setReviewError("A reviewer note is required when requesting a revision.");
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const updated = await reviewGraphicsConversion(selectedId, {
        status: reviewAction,
        note: reviewerNote.trim() || undefined,
      });
      setConversions((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, ...updated } : c))
      );
      setIsReviewOpen(false);
      setDetail(await getGraphicsConversion(selectedId));
    } catch (err) {
      setReviewError(toApiError(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const copyCode = async () => {
    if (!detail?.code) return;
    try {
      await navigator.clipboard.writeText(detail.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadCode = () => {
    if (!detail?.code) return;
    const blob = new Blob([detail.code], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${String(detail.submission).replace(/[^a-z0-9]/gi, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    { key: "submission", label: "Design" },
    {
      key: "designer",
      label: "Designer",
      render: (row) => <span className="text-sm">{row.designer ?? "—"}</span>,
    },
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
      key: "submittedAt",
      label: "Submitted",
      render: (row) => <span className="text-sm">{formatDateTime(row.submittedAt)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <button
          onClick={() => openDetail(row)}
          aria-label={`Review ${row.submission}`}
          className="rounded-control p-1.5 text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image-to-Code"
        description="Review code conversions against approved designs, then accept or request revisions."
      />

      {error && <ErrorBanner message={error} onRetry={loadConversions} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "In Queue", value: stats.queue, icon: Code2 },
          { label: "Revisions", value: stats.revisions, icon: ClipboardCheck },
          { label: "Accepted", value: stats.accepted, icon: CheckCircle2 },
          { label: "Total", value: stats.total, icon: Eye },
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

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Queue */}
        <Card className="p-5 xl:col-span-2">
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
            <Button variant="outline" size="md" onClick={syncApproved} disabled={syncing || loading}>
              {syncing && <Loader2 size={16} className="animate-spin" />} Sync approved
            </Button>
            {syncMessage && <span className="text-xs text-ink-muted">{syncMessage}</span>}
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted">
              <Loader2 size={16} className="animate-spin" /> Loading conversions…
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              searchKeys={["submission", "designer"]}
              emptyMessage="No conversions match this filter."
            />
          )}
        </Card>

        {/* Guidelines (static content — agreed, no CRUD table) */}
        <Card className="h-fit p-5">
          <div className="flex items-center gap-2">
            <BookOpenText size={18} className="text-ink-muted" />
            <h2 className="text-lg font-semibold text-ink">Designer Guidelines</h2>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            How designs should be prepared for accurate conversion into code.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink">
            {GUIDELINES.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Detail + review modal */}
      <Modal
        open={!!selectedId && !isReviewOpen}
        onClose={closeDetail}
        title={detail?.submission}
        className="max-w-2xl"
      >
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted">
            <Loader2 size={16} className="animate-spin" /> Loading conversion…
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[detail.status] ?? "neutral"}>
                {STATUS_LABEL[detail.status] ?? detail.status}
              </Badge>
              <span className="text-xs text-ink-muted">
                {detail.designer ?? "—"} · submitted {formatDateTime(detail.submittedAt)}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Technical notes</p>
              <p className="mt-1 text-ink">{detail.techNotes || "No technical notes provided."}</p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Submitted code</p>
                <span className="inline-flex gap-2">
                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-1 rounded-control border border-border px-2 py-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={downloadCode}
                    className="inline-flex items-center gap-1 rounded-control border border-border px-2 py-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                  >
                    <Download size={16} /> Handoff file
                  </button>
                </span>
              </div>
              <pre className="mt-2 max-h-64 overflow-auto rounded-control border border-border bg-canvas p-3 font-mono text-xs leading-5 text-ink">
                {detail.code || "No code submitted yet."}
              </pre>
            </div>
            {detail.reviewerNote && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Reviewer note</p>
                <p className="mt-1 text-ink">{detail.reviewerNote}</p>
              </div>
            )}
            {Array.isArray(detail.history) && detail.history.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">History</p>
                <ul className="mt-2 space-y-2 border-l border-border pl-4">
                  {detail.history.map((h) => (
                    <li key={h.id}>
                      <p className="text-ink">{h.title}</p>
                      <p className="text-xs text-ink-muted">{formatDateTime(h.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => openReview(detail, "revision_required")}>
                Request Revision
              </Button>
              <Button variant="primary" size="md" onClick={() => openReview(detail, "accepted")}>
                <CheckCircle2 size={16} /> Accept
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Review confirm modal */}
      <Modal open={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Review conversion">
        <div className="space-y-4 text-sm">
          <p className="text-ink">
            {reviewAction === "accepted" ? "Accept" : "Request revision on"}{" "}
            <span className="font-semibold">“{detail?.submission}”</span> by {detail?.designer ?? "—"}.
          </p>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink-muted" htmlFor="gc-note">
              Reviewer note {reviewAction === "revision_required" ? "(required)" : "(optional)"}
            </label>
            <textarea
              id="gc-note"
              value={reviewerNote}
              onChange={(e) => {
                setReviewerNote(e.target.value);
                setReviewError(null);
              }}
              rows={4}
              maxLength={2000}
              placeholder="What is accurate, what must change, and why…"
              className="mt-1 w-full rounded-control border border-border bg-surface px-3 py-2 text-ink outline-none focus:border-primary"
            />
          </div>
          {reviewError && (
            <p className="text-sm text-danger" role="alert">
              {reviewError}
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
