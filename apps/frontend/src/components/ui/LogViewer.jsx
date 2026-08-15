/**
 * LogViewer.jsx
 * Read-only timeline/list view for any log-shaped data:
 * Connection Logs, Audit Logs, AI Activity/Error Logs.
 */
export default function LogViewer({ logs, typeColors = {}, emptyMessage = "No activity yet." }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-surface-variant bg-surface p-8 text-center text-sm text-on-surface-variant">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-variant bg-surface divide-y divide-surface-variant shadow-soft">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors">
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              typeColors[log.type] ?? "bg-surface-variant text-on-surface-variant border border-surface-variant"
            }`}
          >
            {log.type}
          </span>
          <div className="flex-1">
            <p className="text-sm text-on-surface font-medium">{log.detail}</p>
            <p className="mt-0.5 text-xs text-on-surface-variant/70">
              {log.actor} · {log.at}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
