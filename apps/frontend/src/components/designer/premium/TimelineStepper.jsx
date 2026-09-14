import { Check } from "lucide-react";

const mainSteps = ["draft", "submitted", "received", "under_review", "approved", "completed"];
const revisionSteps = ["draft", "submitted", "received", "under_review", "revision_required", "resubmitted", "approved", "completed"];

export default function TimelineStepper({ current }) {
  const isRevision = current === "revision_required" || current === "resubmitted";
  const steps = isRevision ? revisionSteps : mainSteps;
  const indexOf = steps.indexOf(current);
  const activeIdx = indexOf === -1 ? steps.indexOf("submitted") : indexOf;

  return (
    <div className="flex items-center gap-1 overflow-x-auto dp-scroll py-1">
      {steps.map((s, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;
        const isRevisionStep = s === "revision_required";
        const label = s.replaceAll("_", " ");
        return (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all shrink-0 ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                    ? isRevisionStep
                      ? "bg-red-500 border-red-500 text-white shadow-sm scale-105"
                      : "bg-primary border-primary text-white shadow-sm scale-105"
                    : "bg-white border-border text-ink-muted"
                }`}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`text-[10px] font-semibold capitalize tracking-wide whitespace-nowrap ${
                  isActive ? "text-ink" : "text-ink-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={`w-6 sm:w-8 h-[2px] rounded-full mx-1 mt-[-14px] ${
                  i < activeIdx ? "bg-emerald-500" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
