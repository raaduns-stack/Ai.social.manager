import { useState, useEffect, useMemo } from "react";
import { UploadCloud, FileImage, Info, Lightbulb, Check, AlertCircle, X, Image as ImageIcon, Utensils, LayoutGrid, Package, Sparkles, Tag } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import CategoryCombobox from "./premium/CategoryCombobox";
import { createSubmission } from "../../features/designer/designer-api";

const DEFAULT_CATEGORIES = [
  { value: "General Graphics", icon: LayoutGrid },
  { value: "Hospitality", icon: Utensils },
  { value: "Other", icon: Package },
];

const categoryHints = {
  "General Graphics": "Tip: include dimensions, brand guidelines, and target platform in the details so reviewers can check intent.",
  Hospitality: "Tip: mention the venue/client, usage (print vs digital), and any property brand constraints in the details field.",
  Other: "Tip: describe the request clearly — purpose, audience, and references — so reviewers can route and check it.",
};

const CUSTOM_CATEGORIES_KEY = "designer_custom_categories";

function loadCustomCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_CATEGORIES_KEY) || "[]");
    if (Array.isArray(saved)) return saved.filter((n) => typeof n === "string" && n.trim());
  } catch {}
  return [];
}

export default function DesignerUploadModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("General Graphics");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [customCategories, setCustomCategories] = useState(loadCustomCategories);

  useEffect(() => {
    const urls = files.map((f) => (f?.type?.startsWith?.("image/") ? URL.createObjectURL(f) : null));
    setPreviews(urls);
    return () => urls.forEach((u) => { try { if (u) URL.revokeObjectURL(u) } catch {} });
  }, [files]);

  const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf", ".svg", ".webp"];
  const MAX_FILES = 5;
  const MAX_BYTES = 10 * 1024 * 1024;

  const handleFiles = (list) => {
    const incoming = Array.from(list || []);
    const valid = [];
    const sizeRejected = [];
    const typeRejected = [];
    incoming.forEach((f) => {
      const allowedType = ALLOWED_EXTENSIONS.some((ext) => (f.name || "").toLowerCase().endsWith(ext));
      if (!allowedType) typeRejected.push(f.name);
      else if (f.size > MAX_BYTES) sizeRejected.push(f.name);
      else valid.push(f);
    });
    if (sizeRejected.length) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: `${sizeRejected.length} file(s) exceed 10MB and were skipped: ${sizeRejected.slice(0, 3).join(", ")}${sizeRejected.length > 3 ? "…" : ""}`, type: "error" } }));
    }
    if (typeRejected.length) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: `${typeRejected.length} file(s) skipped — only PNG, JPG, PDF, SVG, WEBP allowed: ${typeRejected.slice(0, 3).join(", ")}${typeRejected.length > 3 ? "…" : ""}`, type: "error" } }));
    }
    const combined = [...files, ...valid].slice(0, MAX_FILES);
    const dropped = files.length + valid.length - combined.length;
    if (dropped > 0) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: `Only ${MAX_FILES} files allowed — ${dropped} file(s) skipped. Remove some first.`, type: "error" } }));
    }
    setFiles(combined);
  };
  const onInputFiles = (e) => handleFiles(e.target.files);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const canNext1 = files.length > 0;
  const canNext2 = title.trim().length >= 3;

  const resetAndClose = () => {
    setStep(1); setCategory("General Graphics"); setTitle(""); setDetails(""); setFiles([]); setPreviews([]); setSubmitting(false); setConfirmed(false);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", category);
      if (details.trim()) formData.append("description", details.trim());
      files.forEach((f) => formData.append("files", f));
      const created = await createSubmission(formData);
      if (onSuccess) onSuccess(created);
      resetAndClose();
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Submission created — status: Draft. Submit it for review from Submissions.", type: "success" } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: e?.response?.data?.message || "Upload failed. Please try again.", type: "error" } }));
    } finally {
      setSubmitting(false);
    }
  };

  const totalBytes = useMemo(() => files.reduce((a, f) => a + f.size, 0), [files]);

  const allCategories = useMemo(() => {
    const seen = new Set();
    return [...DEFAULT_CATEGORIES, ...customCategories.map((name) => ({ value: name, icon: Tag }))].filter((c) => {
      const key = c.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customCategories]);

  const addCategory = (name) => {
    const clean = (name || "").trim();
    if (!clean) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: "Enter a category name first.", type: "error" } }));
      return;
    }
    if (allCategories.some((c) => c.value.toLowerCase() === clean.toLowerCase())) {
      window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: `Category "${clean}" already exists.`, type: "error" } }));
      return;
    }
    const next = [...customCategories, clean];
    setCustomCategories(next);
    setCategory(clean);
    try { localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent("app-toast", { detail: { message: `Category "${clean}" created and selected.`, type: "success" } }));
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={resetAndClose} title="Upload" className="max-w-2xl p-0 rounded-2xl overflow-hidden">
      <div className="px-6 pt-1 pb-4 shrink-0 border-b border-border -mt-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 transition-all ${step > s ? "bg-success border-success text-white" : step >= s ? "bg-primary border-primary text-white shadow-sm scale-105" : "bg-white text-ink-muted border-border"}`}>
                {step > s ? <Check size={14} strokeWidth={3} /> : s}
              </span>
              <span className={`text-xs font-bold hidden sm:block ${step >= s ? "text-ink" : "text-ink-muted"}`}>{s === 1 ? "Files" : s === 2 ? "Category & Details" : "Review"}</span>
              {s < 3 && <span className={`flex-1 h-[2px] rounded-full ${step > s ? "bg-success" : "bg-border"}`} />}
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-2">Step {step} of 3 • {step === 1 ? "Upload finished graphics" : step === 2 ? "Add context for reviewers" : "Confirm and submit"}</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="dp-display text-[16px] text-ink flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-100 text-primary flex items-center justify-center"><FileImage size={16} /></span> Upload completed graphics</h3>
            <p className="text-sm text-ink-muted">Drag & drop or click — we generate previews instantly. No external platform needed.</p>
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary-50" : "border-border bg-canvas/60 hover:border-primary/40 hover:bg-primary-50/40"}`}
            >
              <UploadCloud size={24} className={`mx-auto mb-2 ${dragOver ? "text-primary" : "text-ink-muted"}`} />
              <span className="text-sm font-bold text-ink">{dragOver ? "Drop files here" : "Click to select or drag files"}</span>
              <span className="block text-xs text-ink-muted mt-1">PNG, JPG, PDF, SVG, WEBP — max 10MB each • Up to 5 files</span>
              <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.svg,.webp" className="hidden" onChange={onInputFiles} />
            </label>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-ink">{files.length} file(s) • {(totalBytes / (1024*1024)).toFixed(2)} MB</p>
                  <button onClick={() => setFiles([])} className="text-xs font-semibold text-danger hover:text-red-700">Clear all</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((f, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-border bg-white">
                      <div className="aspect-[4/3] bg-canvas overflow-hidden flex items-center justify-center">
                        {previews[i] ? (
                          <img src={previews[i]} alt={f.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-ink-muted">
                            <ImageIcon size={16} />
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-ink truncate">{f.name}</p>
                        <p className="text-[11px] text-ink-muted">{(f.size / 1024).toFixed(0)} KB • {(f.type?.split?.("/")[1] || "file")}</p>
                      </div>
                      <button onClick={() => removeFile(i)} className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-success bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex gap-2">
                  <Check size={14} className="shrink-0 mt-0.5" /> Ready — review thumbnails and hover a file to remove it before continuing.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="dp-display text-[15px] text-ink">Select category <span className="text-danger">*</span></h3>
            <div className="space-y-2">
              <CategoryCombobox
                options={allCategories}
                value={category}
                onChange={(name) => setCategory(name)}
                onCreate={addCategory}
              />
              <p className="text-xs text-ink-muted">{allCategories.length} categor{allCategories.length === 1 ? "y" : "ies"} • type to search or create a new one.</p>
            </div>

            <div className={`flex items-start gap-2 p-3 rounded-xl border ${categoryHints[category] ? "bg-primary-50 border-primary-100" : "bg-canvas border-border"}`}>
              <Lightbulb size={14} className="shrink-0 mt-0.5 text-primary" />
              <span className={`text-xs leading-relaxed ${categoryHints[category] ? "text-primary-700" : "text-ink-muted"}`}>{categoryHints[category] || "Tip: describe this custom category clearly — purpose, audience, and references — so reviewers can route and check it."}</span>
            </div>

            <div className="space-y-2">
              <label className="dp-mono text-ink-muted">Title / Short brief <span className="text-danger">*</span></label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g., Hospitality Menu Revamp — Eko Hotels (6 variants)" className="w-full px-3 py-2.5 border border-border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <p className="text-xs text-ink-muted">{title.length}/80 • Keep it scannable for reviewers</p>
            </div>
            <div className="space-y-2">
              <label className="dp-mono text-ink-muted flex items-center gap-1.5"><Info size={12} className="text-primary" /> Relevant details / instructions</label>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Purpose, audience, dimensions, brand guidelines, deadlines, links..." className="w-full px-3 py-2.5 border border-border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <p className="text-xs text-ink-muted">Reviewers need this to understand intent not visible in the image.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="dp-display text-[15px] text-ink">Review & submit</h3>
            {previews.some(Boolean) && (
              <div className="flex gap-2 overflow-x-auto dp-scroll pb-1">
                {files.map((f, i) => (
                  <div key={i} className="w-20 h-16 rounded-xl overflow-hidden border border-border bg-canvas shrink-0">
                    {previews[i] ? <img src={previews[i]} alt={f.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-ink-muted"><ImageIcon size={14} /></div>}
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 space-y-2.5 bg-canvas border border-border rounded-2xl">
              <div className="flex justify-between text-sm"><span className="font-semibold text-ink-muted">Files</span><span className="font-bold text-ink">{files.length} • {(totalBytes / (1024*1024)).toFixed(2)} MB</span></div>
              <div className="flex justify-between text-sm"><span className="font-semibold text-ink-muted">Category</span><Badge tone={category === "Hospitality" ? "warning" : "neutral"} className="text-xs">{category}</Badge></div>
              <div className="text-sm"><span className="font-semibold text-ink-muted">Title</span><p className="font-medium text-ink mt-0.5">{title || "—"}</p></div>
              {details && <div className="text-sm"><span className="font-semibold text-ink-muted">Details</span><p className="text-ink-muted mt-0.5 line-clamp-2">{details}</p></div>}
              <div className="pt-2 border-t border-border flex items-center gap-2 text-xs font-semibold text-success">
                <Sparkles size={12} /> Est. payout ~₦6k per approval • Paid Tuesday cycle
              </div>
            </div>
            <label className="flex gap-2.5 p-3 rounded-xl border border-border bg-white cursor-pointer hover:bg-canvas transition-colors">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="text-xs leading-relaxed text-ink-muted"><span className="font-semibold text-ink">I confirm</span> files are final, exported at 2x, and respect brand guidelines. I understand revision requests may delay payout.</span>
            </label>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2 text-xs text-amber-800">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Submission starts as <span className="font-semibold">Submitted</span> and tracks through review — activity is logged automatically under Submissions.</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border flex justify-between shrink-0 bg-white rounded-b-2xl">
        <Button variant="ghost" onClick={() => (step === 1 ? resetAndClose() : setStep((s) => s - 1))} className="rounded-lg">
          {step === 1 ? "Cancel" : "← Back"}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 ? !canNext1 : !canNext2} className="rounded-lg bg-ink hover:bg-black text-white disabled:opacity-40">
            Continue →
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting || !confirmed} className="rounded-lg gap-2 bg-primary hover:bg-primary-700 disabled:opacity-40">
            {submitting ? "Submitting..." : <><Check size={16} /> Submit design</>}
          </Button>
        )}
      </div>
    </Modal>
  );
}
