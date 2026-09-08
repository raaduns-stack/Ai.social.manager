const map = {
  draft: "bg-gray-300",
  submitted: "bg-amber-500",
  not_started: "bg-gray-300",
  accepted: "bg-emerald-500",
  received: "bg-gray-400",
  under_review: "bg-amber-500",
  revision_required: "bg-red-500",
  resubmitted: "bg-amber-500",
  approved: "bg-emerald-500",
  completed: "bg-emerald-600",
  open: "bg-amber-500",
  in_progress: "bg-primary",
  done: "bg-emerald-500",
  pending: "bg-amber-500",
  processing: "bg-amber-500",
  paid: "bg-emerald-500",
};

export default function StatusDot({ status, pulse = false, className = "" }) {
  return <span className={`w-2 h-2 rounded-full shrink-0 ${map[status] || "bg-gray-300"} ${pulse ? "dp-pulse" : ""} ${className}`} />;
}
