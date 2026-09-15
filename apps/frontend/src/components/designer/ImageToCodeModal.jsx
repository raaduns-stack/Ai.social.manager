import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCopy, Code2, Copy, Eraser, Eye, FileCode2, Lightbulb, RefreshCw, Save, Send, TriangleAlert } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import CoverImage from "./premium/CoverImage";
import SegmentedControl from "./premium/SegmentedControl";
import StatusDot from "./premium/StatusDot";
import { updateImageToCode, submitImageToCode } from "../../features/designer/designer-api";
import { resolveFileUrl } from "../../features/designer/format";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const previewTabs = [
  { value: "preview", label: "Preview" },
  { value: "design", label: "Design" },
];

export default function ImageToCodeModal({ open, item, onClose, onUpdate }) {
  const [code, setCode] = useState("");
  const [techNotes, setTechNotes] = useState("");
  const [previewTab, setPreviewTab] = useState("preview");
  const [frameKey, setFrameKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && item) {
      setCode(item.code || "");
      setTechNotes(item.techNotes || "");
      setCopied(false);
    }
  }, [open, item]);

  const toast = (message, type = "info") =>
    window.dispatchEvent(new CustomEvent("app-toast", { detail: { message, type } }));

  const looksLikeHtml = useMemo(
    () =>
      /<\s*(!DOCTYPE|html|body|div|section|article|header|nav|main|footer|span|p|h[1-6]|pre|blockquote|button|a|img|ul|ol|li|dl|table|thead|tbody|tr|td|th|form|input|select|textarea|label|video|iframe|svg|script|style)[\s>]/i.test(
        code
      ),
    [code]
  );

  const isAccepted = item?.conversionStatus === "accepted";
  const isRevision = item?.conversionStatus === "revision_required";
  const isSubmitted = item?.conversionStatus === "submitted";
  const locked = isAccepted || isSubmitted;

  if (!open || !item) return null;

  const canSubmit = code.trim().length >= 10;
  const charCount = code.length;

  const saveDraft = async () => {
    setSaving(true);
    try {
      const updated = await updateImageToCode(item.conversionId, { code, techNotes });
      onUpdate(updated);
      toast("Draft saved — resumable anytime", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Could not save draft.", "error");
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!canSubmit) {
      toast("Add at least 10 characters of code before submitting.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateImageToCode(item.conversionId, { code, techNotes });
      const updated = await submitImageToCode(item.conversionId);
      onUpdate(updated);
      toast("Code version submitted — status: Submitted", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Could not submit code.", "error");
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    setCode("");
    setTechNotes("");
    toast("Editor cleared — the saved draft is unchanged.", "info");
  };

  const copyCode = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast("Code copied to clipboard", "success");
    } catch {
      toast("Could not copy — select the code manually.", "error");
    }
  };

  const submitLabel = isRevision
    ? "Resubmit for review"
    : isSubmitted
      ? "Update & resubmit"
      : "Submit for review";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isAccepted ? "Accepted code version" : isSubmitted ? "Submitted code version" : "Add code version"}
      className="w-[80vw] max-w-[1400px] h-[80vh] rounded-2xl bg-white p-0 overflow-hidden"
    >
      <div className="p-5 space-y-4">
        {/* Meta header */}
        <div className="flex items-center gap-3">
          <CoverImage src={resolveFileUrl(item.coverFileUrl)} id={item.id} alt={item.title} className="w-20 h-14 shrink-0" ratio="16/10" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono text-ink-muted">
              #{String(item.id).slice(0, 8).toUpperCase()} • {item.category}
            </p>
            <h3 className="font-bold text-ink text-[15px] leading-snug truncate">{item.title}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className="text-[11px]">{item.category}</Badge>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize text-ink">
                <StatusDot status={item.conversionStatus} pulse={isRevision} />
                {item.conversionStatus.replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Status banners */}
        {isRevision && (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
            <TriangleAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-[13px]">Revision requested by the review team</p>
              <p className="text-amber-800/90 text-xs mt-0.5">
                {item.reviewerNote || "Please review the feedback, adjust the code, and resubmit."}
              </p>
            </div>
          </div>
        )}
        {isSubmitted && !isRevision && (
          <div className="flex gap-2 rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm">
            <Send size={15} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-primary-700 text-[13px]">
                Submitted {formatDate(item.submittedAt)}
              </p>
              <p className="text-primary-700/80 text-xs mt-0.5">
                Editing is locked while review is pending — you'll be notified when the reviewer responds.
              </p>
            </div>
          </div>
        )}
        {isAccepted && (
          <div className="flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
            <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-800 text-[13px]">Accepted — code is final</p>
              <p className="text-emerald-800/80 text-xs mt-0.5">
                This version was accepted {formatDate(item.submittedAt)}. Copy it or download from the original submission.
              </p>
            </div>
          </div>
        )}

        {/* Editor + preview */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
                <Code2 size={14} /> Code version
                <span className="normal-case font-mono font-medium text-[11px] px-1.5 py-0.5 rounded-md bg-canvas border border-border">markup</span>
              </p>
              <div className="flex items-center gap-1">
                {!locked && (
                  <button
                    onClick={clearAll}
                    title="Clear editor"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                  >
                    <Eraser size={14} />
                  </button>
                )}
                <button
                  onClick={copyCode}
                  title="Copy code"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <ClipboardCopy size={14} />}
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              readOnly={locked}
              spellCheck={false}
              placeholder={`<section class="hero">\n  <!-- paste your markup here -->\n</section>`}
              className={`w-full min-h-[300px] h-[36vh] resize-y rounded-xl border border-ink bg-ink p-4 font-mono text-xs leading-relaxed text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary caret-primary ${locked ? "cursor-not-allowed opacity-80" : ""}`}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
                <Eye size={14} /> Preview
              </p>
              <SegmentedControl options={previewTabs} value={previewTab} onChange={setPreviewTab} size="sm" />
            </div>
            {previewTab === "design" ? (
              <div className="space-y-1.5">
                <CoverImage src={resolveFileUrl(item.coverFileUrl)} id={item.id} alt={item.title} className="h-[36vh] min-h-[300px] w-full" />
                <p className="text-[11px] text-ink-muted">The approved source design this code should match.</p>
              </div>
            ) : !code.trim() ? (
              <div className="flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-border bg-canvas h-[36vh] min-h-[300px] gap-2">
                <span className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-ink-muted">
                  <FileCode2 size={18} />
                </span>
                <p className="text-sm font-semibold text-ink">No code yet</p>
                <p className="text-xs text-ink-muted px-6">Write your markup on the left to see a live preview here.</p>
              </div>
            ) : looksLikeHtml ? (
              <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 bg-canvas border-b border-border px-3 py-2">
                  <span className="flex gap-1.5 shrink-0" aria-hidden>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  </span>
                  <span className="flex-1 text-center text-[11px] font-mono text-ink-muted truncate">sandboxed render</span>
                  <button
                    onClick={() => setFrameKey((k) => k + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white transition-colors shrink-0"
                    title="Re-render preview"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
                <iframe
                  key={frameKey}
                  title="Code preview"
                  srcDoc={code}
                  sandbox=""
                  className="w-full h-[36vh] min-h-[300px] bg-white dp-scroll"
                />
              </div>
            ) : (
              <pre className="w-full h-[36vh] min-h-[300px] overflow-auto rounded-xl border border-border bg-canvas p-4 text-xs leading-relaxed text-ink dp-scroll">
                {code}
              </pre>
            )}
          </div>
        </div>

        {/* Technical instructions — spans both columns */}
        {!locked && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
              <Lightbulb size={13} className="text-primary" /> Technical instructions <span className="normal-case font-medium text-ink-muted">(optional)</span>
            </label>
            <textarea
              value={techNotes}
              onChange={(e) => setTechNotes(e.target.value)}
              spellCheck={false}
              rows={2}
              placeholder="Components used, breakpoints, dependencies, or a Figma link — this helps the reviewer understand intent not visible in the code."
              className="w-full resize-y rounded-xl border border-border bg-canvas p-3 text-xs leading-relaxed text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border bg-white px-5 py-4">
        {locked ? (
          <>
            <span className="text-[11px] text-ink-muted">Status: {isAccepted ? "accepted — no further edits allowed" : "submitted — locked pending review"}</span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" className="rounded-lg" onClick={onClose}>
                Close
              </Button>
              <Button className="rounded-lg" onClick={copyCode}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? " Copied" : " Copy code"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className={`text-[11px] font-mono ${!canSubmit && charCount > 0 ? "text-ink" : "text-ink-muted"}`}>
              {charCount} chars{!canSubmit && " · min 10 chars"}
            </span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" className="rounded-lg" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="outline" className="rounded-lg" onClick={saveDraft} disabled={saving}>
                <Save size={14} /> {saving ? "Saving…" : "Save draft"}
              </Button>
              <Button className="rounded-lg" onClick={submitForReview} disabled={!canSubmit || saving}>
                <Send size={14} /> {saving ? "Working…" : submitLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}