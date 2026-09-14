import { useState, useMemo, useEffect } from "react";
import { UploadCloud, Eye, Search, LayoutGrid, Table2, Clock, FileImage, AlertCircle, FileText } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/layout/PageHeader";
import DesignerUploadModal from "../../components/designer/DesignerUploadModal";
import PremiumCard from "../../components/designer/premium/PremiumCard";
import CoverImage from "../../components/designer/premium/CoverImage";
import StatusDot from "../../components/designer/premium/StatusDot";
import SegmentedControl from "../../components/designer/premium/SegmentedControl";
import TimelineStepper from "../../components/designer/premium/TimelineStepper";
import {
  getDesignerSubmissions,
  getDesignerSubmission,
  getSubmissionActivity,
  submitSubmission,
} from "../../features/designer/designer-api";
import { timeAgo, resolveFileUrl } from "../../features/designer/format";

const statusTone = {
  draft: "neutral", submitted: "warning", received: "neutral", under_review: "neutral",
  revision_required: "danger", resubmitted: "warning", approved: "success", completed: "success",
};

const activityFilterOptions = [
  { value: "all", label: "All activity" },
  { value: "draft", label: "Created" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "revision", label: "Revisions" },
];

const PERIOD_DAYS = { day: 1, week: 7, month: 30 };

function withinPeriod(value, period) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - PERIOD_DAYS[period]);
  return new Date(value) >= start;
}

function shortId(id) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

const activityPeriods = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export default function DesignerSubmissions() {
  const [detail, setDetail] = useState(null);
  const [detailFiles, setDetailFiles] = useState([]);
  const [detailActivity, setDetailActivity] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [view, setView] = useState(() => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem("designer_sub_view") || "grid" : "grid";
    } catch {
      return "grid";
    }
  });
  const [query, setQuery] = useState("");
  const [activityPeriod, setActivityPeriod] = useState("week");
  const [activeActivity, setActiveActivity] = useState("all");

  const setViewPersist = (v) => {
    setView(v);
    try {
      localStorage.setItem("designer_sub_view", v);
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getDesignerSubmissions();
      setSubmissions(list);
      const allActivity = (
        await Promise.all(list.map((s) => getSubmissionActivity(s.id).catch(() => [])))
      ).flat();
      setActivities(allActivity);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load submissions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = async (row) => {
    setDetail(row);
    setDetailFiles([]);
    setDetailActivity(activities.filter((a) => a.submissionId === row.id));
    try {
      const full = await getDesignerSubmission(row.id);
      setDetailFiles(full.files || []);
    } catch {}
  };

  const handleSubmitForReview = async (id) => {
    setSubmittingId(id);
    try {
      const updated = await submitSubmission(id);
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      setDetail((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
      const fresh = await getSubmissionActivity(id).catch(() => []);
      setActivities((prev) => [...prev.filter((a) => a.submissionId !== id), ...fresh]);
      setDetailActivity(fresh);
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Submitted for review.", type: "success" } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: e?.response?.data?.message || "Submit failed. Please try again.", type: "error" } }));
    } finally {
      setSubmittingId(null);
    }
  };

  const activityMatchedIds = useMemo(() => {
    if (activeActivity === "all") return null;
    const inPeriod = activities.filter((a) => withinPeriod(a.createdAt, activityPeriod));
    return new Set(inPeriod.filter((a) => a.type === activeActivity).map((a) => a.submissionId));
  }, [activities, activeActivity, activityPeriod]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (query && !`${s.title} ${s.id} ${s.category}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (!withinPeriod(s.updatedAt, activityPeriod)) return false;
      if (activityMatchedIds && !activityMatchedIds.has(s.id)) return false;
      return true;
    });
  }, [submissions, query, activityPeriod, activityMatchedIds]);

  const filteredActivity = useMemo(() => activities.filter((a) => withinPeriod(a.createdAt, activityPeriod)), [activities, activityPeriod]);
  const activityCountByType = useMemo(() => {
    const c = {};
    filteredActivity.forEach((a) => {
      c[a.type] = (c[a.type] || 0) + 1;
    });
    return c;
  }, [filteredActivity]);

  const columns = [
    { key: "id", label: "ID", render: (r) => <span className="font-mono text-xs text-ink-muted">{shortId(r.id)}</span> },
    {
      key: "title",
      label: "Design",
      render: (r) => (
        <div className="flex gap-3 items-center min-w-[260px]">
          <CoverImage id={r.id} alt={r.title} className="w-14 h-10 shrink-0" ratio="14/10" />
          <div className="min-w-0">
            <p className="font-semibold text-ink text-sm leading-tight truncate">{r.title}</p>
            <p className="text-xs text-ink-muted">{r.category} • {r.files} file(s)</p>
          </div>
        </div>
      ),
    },
    { key: "status", label: "Status", render: (r) => <span className="inline-flex items-center gap-1.5"><StatusDot status={r.status} /><Badge tone={statusTone[r.status] || "neutral"} className="capitalize text-xs">{r.status.replaceAll("_", " ")}</Badge></span> },
    { key: "updatedAt", label: "Updated", render: (r) => <span className="text-xs text-ink-muted flex items-center gap-1"><Clock size={12} />{timeAgo(r.updatedAt)}</span> },
    { key: "action", label: "", render: (r) => <Button variant="ghost" size="sm" onClick={() => openDetail(r)} className="gap-1 rounded-lg text-xs"><Eye size={14} /> View</Button> },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PremiumCard className="p-5">
          <div className="h-6 w-48 rounded bg-canvas animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-canvas animate-pulse mt-2" />
        </PremiumCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <PremiumCard key={i} className="p-0 h-64 animate-pulse bg-canvas/50 overflow-hidden" />
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
          <p className="font-bold text-ink">Could not load submissions</p>
          <p className="text-sm text-ink-muted">{error}</p>
          <Button onClick={load} className="rounded-lg text-sm">Try again</Button>
        </PremiumCard>
      </div>
    );
  }

  const canSubmitDetail = detail && (detail.status === "draft" || detail.status === "revision_required");

  return (
    <div className="space-y-6">
      <PageHeader
        variant="premium"
        eyebrow="Work — Submissions"
        title="My Submissions"
        description="Image-first tracking from draft to completed. Grid is default — switch to list for bulk review."
        action={<Button onClick={() => setShowUpload(true)} className="gap-2 font-semibold rounded-lg bg-primary hover:bg-primary-700"><UploadCloud size={16} /> Upload</Button>}
      />

      <PremiumCard className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SegmentedControl options={activityPeriods} value={activityPeriod} onChange={setActivityPeriod} size="sm" />
          <div className="flex items-center gap-2 lg:ml-auto">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, ID…" className="h-8 pl-8 pr-3 w-44 sm:w-56 rounded-full border border-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="flex rounded-full border border-border p-1 bg-canvas">
              <button onClick={() => setViewPersist("grid")} className={`w-7 h-7 rounded-full flex items-center justify-center ${view === "grid" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}><LayoutGrid size={14} /></button>
              <button onClick={() => setViewPersist("table")} className={`w-7 h-7 rounded-full flex items-center justify-center ${view === "table" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}><Table2 size={14} /></button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {activityFilterOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setActiveActivity(o.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${activeActivity === o.value ? "bg-primary text-white border-primary" : "bg-white text-ink-muted border-border hover:border-primary-100 hover:bg-primary-50"}`}
            >
              {o.label} <span className={`ml-1 text-[11px] ${activeActivity === o.value ? "text-white/70" : "text-ink-muted"}`}>({o.value === "all" ? filteredActivity.length : activityCountByType[o.value] || 0})</span>
            </button>
          ))}
        </div>
      </PremiumCard>

      {filtered.length === 0 ? (
        <PremiumCard className="p-12 text-center space-y-3 border-dashed">
          <span className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center mx-auto text-ink-muted"><FileImage size={20} /></span>
          <p className="font-bold text-ink">No submissions match filters</p>
          <p className="text-sm text-ink-muted">Nothing updated in this period — try a wider range like Week or Month, switch to "All" activity, or clear your search. Your first upload starts as a draft you submit for review.</p>
          <Button onClick={() => setShowUpload(true)} className="rounded-lg mt-2 bg-primary hover:bg-primary-700"><UploadCloud size={16} /> Upload</Button>
        </PremiumCard>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <PremiumCard key={s.id} hover className="overflow-hidden p-0 flex flex-col group cursor-pointer" onClick={() => openDetail(s)}>
              <CoverImage id={s.id} alt={s.title} className="rounded-b-none border-0 border-b" ratio="16/10">
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-full border border-border shadow-sm">
                  <StatusDot status={s.status} pulse={s.status === "under_review"} />
                  <span className="text-[11px] font-bold capitalize text-ink">{s.status.replaceAll("_", " ")}</span>
                </div>
                <span className="absolute top-2 right-2 text-[11px] font-mono bg-ink text-white px-2 py-1 rounded-full">{shortId(s.id)}</span>
              </CoverImage>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h4 className="text-sm font-bold text-ink leading-tight line-clamp-2 group-hover:text-primary transition-colors">{s.title}</h4>
                <div className="flex items-center gap-1.5 text-xs">
                  <Badge tone={s.category === "Hospitality" ? "warning" : "neutral"} className="text-[11px]">{s.category}</Badge>
                  <span className="text-ink-muted">• {s.files} file(s)</span>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <span className="text-xs text-ink-muted flex items-center gap-1"><Clock size={12} /> {timeAgo(s.updatedAt)}</span>
                  <span className="text-xs font-bold text-primary group-hover:text-primary-700 flex items-center gap-1">View <Eye size={12} /></span>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl">
          <DataTable columns={columns} data={filtered} searchKeys={[]} emptyMessage="No submissions match your filters." />
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title} className="max-w-xl rounded-2xl bg-white">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-border text-xs font-bold capitalize"><StatusDot status={detail.status} /> {detail.status.replaceAll("_", " ")}</span>
              <span className="text-xs text-ink-muted font-mono">{detail.category} • {shortId(detail.id)} • {timeAgo(detail.updatedAt)}</span>
            </div>
            <CoverImage
              src={detailFiles.length > 0 ? resolveFileUrl(detailFiles[0].fileUrl) : null}
              id={detail.id}
              alt={detail.title}
              className="rounded-xl"
              ratio="16/9"
            />
            {detail.description && (
              <p className="text-sm text-ink-muted leading-relaxed">{detail.description}</p>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">Lifecycle</p>
              <TimelineStepper current={detail.status} />
              <p className="text-xs text-ink-muted mt-2">Current: {detail.status.replaceAll("_", " ")} • Updated {timeAgo(detail.updatedAt)}</p>
            </div>
            {detailFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">Files ({detailFiles.length})</p>
                {detailFiles.map((f) => (
                  <a
                    key={f.id}
                    href={resolveFileUrl(f.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-white hover:border-primary-100 hover:bg-primary-50/40 transition-colors"
                  >
                    <FileText size={14} className="text-ink-muted shrink-0" />
                    <span className="text-xs font-medium text-ink truncate flex-1">{f.originalName}</span>
                    <span className="text-[11px] text-ink-muted font-mono shrink-0">{Math.max(1, Math.round(f.fileSize / 1024))} KB</span>
                  </a>
                ))}
              </div>
            )}
            {detailActivity.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">Activity</p>
                {detailActivity.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs text-ink-muted">
                    <Clock size={12} className="shrink-0" />
                    <span className="flex-1">{a.title}</span>
                    <span className="font-mono text-[11px] shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-canvas p-3 rounded-xl border border-border">
              <p className="font-semibold text-ink text-sm">Reviewer feedback</p>
              <p className="text-ink-muted text-xs mt-1 leading-relaxed">No written feedback on this submission yet. You will be notified when review completes. Activity is logged automatically above.</p>
              {canSubmitDetail && (
                <Button
                  size="sm"
                  className="mt-3 rounded-lg bg-primary hover:bg-primary-700"
                  disabled={submittingId === detail.id}
                  onClick={() => handleSubmitForReview(detail.id)}
                >
                  {submittingId === detail.id ? "Submitting…" : detail.status === "revision_required" ? "Resubmit for review" : "Submit for review"}
                </Button>
              )}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setDetail(null)} className="rounded-lg">Close</Button>
              {detailFiles.length > 0 ? (
                <a href={resolveFileUrl(detailFiles[0].fileUrl)} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="rounded-lg">Open files</Button>
                </a>
              ) : (
                <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "No files attached to this submission yet.", type: "info" } }))} className="rounded-lg">Open files</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
      <DesignerUploadModal open={showUpload} onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); load(); }} />
    </div>
  );
}
