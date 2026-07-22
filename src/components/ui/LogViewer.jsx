/**
 * LogViewer.jsx
 * Read-only timeline/list view for any log-shaped data:
 * Connection Logs, Audit Logs, AI Activity/Error Logs.
 *
 * Usage:
 *   <LogViewer
 *     logs={auditLogs}
 *     typeColors={{ login: "bg-blue-100 text-blue-700", payment: "bg-emerald-100 text-emerald-700" }}
 *   />
 */
export default function LogViewer({ logs, typeColors = {}, emptyMessage = "No activity yet." }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-card border border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B7280]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-[#E5E7EB] bg-white divide-y divide-[#E5E7EB]">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 px-4 py-3">
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              typeColors[log.type] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {log.type}
          </span>
          <div className="flex-1">
            <p className="text-sm text-[#111827]">{log.detail}</p>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              {log.actor} · {log.at}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
