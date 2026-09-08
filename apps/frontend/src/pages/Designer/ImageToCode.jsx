import { useState, useMemo, useEffect } from "react";
import { FileCode2, Clock, LayoutGrid, Table2, HelpCircle, Sparkles, ChevronDown, AlertCircle } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/layout/PageHeader";
import PremiumCard from "../../components/designer/premium/PremiumCard";
import CoverImage from "../../components/designer/premium/CoverImage";
import StatusDot from "../../components/designer/premium/StatusDot";
import SegmentedControl from "../../components/designer/premium/SegmentedControl";
import ImageToCodeModal from "../../components/designer/ImageToCodeModal";
import { Link } from "react-router-dom";
import { getImageToCodeConversions } from "../../features/designer/designer-api";
import { timeAgo } from "../../features/designer/format";

const conversionTone = {
  not_started: "neutral",
  draft: "neutral",
  submitted: "warning",
  accepted: "success",
  revision_required: "danger",
};

const statusGroups = [
  { value: "all", label: "All" },
  { value: "not_started", label: "Not started" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "accepted", label: "Accepted" },
  { value: "revision_required", label: "Revision" },
];

const VIEW_KEY = "designer_conv_view";

function shortId(id) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

function toItem(row) {
  return {
    conversionId: row.id,
    id: row.submissionId,
    title: row.submissionTitle,
    category: row.submissionCategory,
    conversionStatus: row.status,
    code: row.code || "",
    techNotes: row.techNotes || "",
    submittedAt: row.submittedAt,
    reviewerNote: row.reviewerNote,
    updatedAt: row.updatedAt,
  };
}

function actionLabel(status) {
  if (status === "accepted") return "View code";
  if (status === "submitted") return "View submission";
  if (status === "revision_required") return "Resubmit code";
  return "Add code";
}

export default function DesignerImageToCode() {
  const [rows, setRows] = useState([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(VIEW_KEY) || "grid";
    } catch {
      return "grid";
    }
  });
  const [active, setActive] = useState(null);
  const [showHow, setShowHow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setViewPersist = (v) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getImageToCodeConversions();
      setRows(list.map(toItem));
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load conversions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdate = (updatedRow) => {
    const mapped = toItem(updatedRow);
    setRows((prev) => prev.map((r) => (r.conversionId === mapped.conversionId ? mapped : r)));
    setActive(mapped);
  };

  const filtered = useMemo(() => {
    if (activeStatus === "all") return rows;
    return rows.filter((r) => r.conversionStatus === activeStatus);
  }, [rows, activeStatus]);

  const statusCounts = useMemo(() => {
    const c = { all: rows.length };
    rows.forEach((r) => {
      c[r.conversionStatus] = (c[r.conversionStatus] || 0) + 1;
    });
    return c;
  }, [rows]);

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
            <p className="text-xs text-ink-muted">{r.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: "conversionStatus",
      label: "Code status",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status={r.conversionStatus} pulse={r.conversionStatus === "revision_required"} />
          <Badge tone={conversionTone[r.conversionStatus] || "neutral"} className="capitalize text-xs">{r.conversionStatus.replaceAll("_", " ")}</Badge>
        </span>
      ),
    },
    { key: "updatedAt", label: "Updated", render: (r) => <span className="text-xs text-ink-muted flex items-center gap-1"><Clock size={12} />{timeAgo(r.updatedAt)}</span> },
    { key: "action", label: "", render: (r) => <Button variant="outline" size="sm" onClick={() => setActive(r)} className="rounded-lg text-xs">{actionLabel(r.conversionStatus)}</Button> },
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
          <p className="font-bold text-ink">Could not load conversions</p>
          <p className="text-sm text-ink-muted">{error}</p>
          <Button onClick={load} className="rounded-lg text-sm">Try again</Button>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        variant="premium"
        eyebrow="Work — Image-to-Code"
        title="Image-to-Code"
        description="Every approved design can be shipped as code. Add the code version for each design and submit it for review."
        action={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex h-9 items-center px-3 rounded-lg border border-border bg-white text-xs font-mono text-ink-muted">{rows.length} approved designs</span>
            <Button onClick={() => setShowHow((v) => !v)} variant="outline" className="h-9 rounded-lg gap-2 text-xs font-semibold">
              <HelpCircle size={14} /> How it works
            </Button>
          </div>
        }
      />

      {showHow && (
        <PremiumCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="dp-display text-[15px] text-ink flex items-center gap-2"><FileCode2 size={16} className="text-primary" /> Image-to-Code — how it works</p>
            <button onClick={() => setShowHow(false)} className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1"><ChevronDown size={14} /> Hide</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-xs leading-relaxed text-ink-muted bg-canvas border border-border rounded-xl p-3">
            <p><span className="font-semibold text-ink">Preparation:</span> Export at 2x, name layers, keep spacing notes and font names in the brief.</p>
            <p><span className="font-semibold text-ink">This page:</span> Write the code version for each approved design below — or attach a Figma link in technical instructions.</p>
            <p><span className="font-semibold text-ink">Submission:</span> Submit the code for review. The team checks markup, responsiveness, and interactions.</p>
            <p><span className="font-semibold text-ink">Guidelines:</span> Clean grid, consistent padding, annotated interactions. Avoid overlapping text and low-res exports.</p>
          </div>
          <p className="text-xs text-ink-muted flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary" /> Drafts save to your workspace. Accepted code moves to completed once verified.
            <Link to="/designer/submissions" className="font-semibold text-primary hover:text-primary-700 underline decoration-primary-100">See submissions</Link>
          </p>
        </PremiumCard>
      )}

      {/* Controls */}
      <PremiumCard className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl options={statusGroups} value={activeStatus} onChange={setActiveStatus} size="sm" />
          <span className="text-xs font-mono text-ink-muted hidden sm:inline-flex items-center gap-1.5"><FileCode2 size={14} /> {filtered.length} of {rows.length}</span>
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <span className="text-xs font-mono text-ink-muted flex items-center gap-1.5"><Clock size={14} /> grid updated automatically</span>
          <div className="flex rounded-full border border-border p-1 bg-canvas">
            <button onClick={() => setViewPersist("grid")} className={`w-7 h-7 rounded-full flex items-center justify-center ${view === "grid" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setViewPersist("table")} className={`w-7 h-7 rounded-full flex items-center justify-center ${view === "table" ? "bg-ink text-white" : "text-ink-muted hover:text-ink"}`}><Table2 size={14} /></button>
          </div>
        </div>
      </PremiumCard>

      <div className="flex flex-wrap items-center gap-1.5">
        {statusGroups.map((g) => (
          <button
            key={g.value}
            onClick={() => setActiveStatus(g.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${activeStatus === g.value ? "bg-ink text-white border-ink" : "bg-white text-ink-muted border-border hover:border-primary-100 hover:bg-primary-50"}`}
          >
            {g.label} <span className={`ml-1 text-[11px] ${activeStatus === g.value ? "text-white/70" : "text-ink-muted"}`}>({statusCounts[g.value] || 0})</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <PremiumCard className="p-12 text-center space-y-3 border-dashed">
          <span className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center mx-auto text-ink-muted"><FileCode2 size={20} /></span>
          <p className="font-bold text-ink">No approved designs yet</p>
          <p className="text-sm text-ink-muted">Approved designs land here automatically. Upload work and wait for approval to start converting to code.</p>
          <Button as={Link} to="/designer/submissions" className="rounded-lg mt-2 bg-primary hover:bg-primary-700">Go to Submissions</Button>
        </PremiumCard>
      ) : filtered.length === 0 ? (
        <PremiumCard className="p-12 text-center space-y-3 border-dashed">
          <span className="w-12 h-12 rounded-2xl bg-canvas border border-border flex items-center justify-center mx-auto text-ink-muted"><FileCode2 size={20} /></span>
          <p className="font-bold text-ink">No conversions match this filter</p>
          <p className="text-sm text-ink-muted">Try switching to "All" or check back after you save drafts.</p>
        </PremiumCard>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <PremiumCard key={r.conversionId} hover className="overflow-hidden p-0 flex flex-col group cursor-pointer" onClick={() => setActive(r)}>
              <CoverImage id={r.id} alt={r.title} className="rounded-b-none border-0 border-b" ratio="16/10">
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur px-2 py-1 rounded-full border border-border shadow-sm">
                  <StatusDot status={r.conversionStatus} pulse={r.conversionStatus === "revision_required"} />
                  <span className="text-[11px] font-bold capitalize text-ink">{r.conversionStatus.replaceAll("_", " ")}</span>
                </div>
                <span className="absolute top-2 right-2 text-[11px] font-mono bg-ink text-white px-2 py-1 rounded-full">{shortId(r.id)}</span>
              </CoverImage>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h4 className="text-sm font-bold text-ink leading-tight line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h4>
                <div className="flex items-center gap-1.5 text-xs">
                  <Badge tone={r.category === "Hospitality" ? "warning" : "neutral"} className="text-[11px]">{r.category}</Badge>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <span className="text-xs text-ink-muted flex items-center gap-1"><Clock size={12} /> {timeAgo(r.updatedAt)}</span>
                  <span className="text-xs font-bold text-primary group-hover:text-primary-700 flex items-center gap-1">{actionLabel(r.conversionStatus)} <span aria-hidden>→</span></span>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl">
          <DataTable columns={columns} data={filtered} searchKeys={["title", "id", "category"]} emptyMessage="No conversions match your filters." />
        </div>
      )}

      <ImageToCodeModal open={!!active} item={active} onClose={() => setActive(null)} onUpdate={handleUpdate} />
    </div>
  );
}
