import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import Loader from '../ui/Loader'
import { cn } from '../../utils/cn'

const getStatusTone = (status) => {
  if (!status) return 'neutral'
  const val = status.toString().toLowerCase().trim()
  if (val === 'successful' || val === 'resolved' || val === 'success') {
    return 'success'
  }
  if (val === 'failed' || val === 'suspicious' || val === 'error' || val === 'danger') {
    return 'danger'
  }
  return 'neutral'
}

/**
 * LogTable renders a generic responsive table for logs (Publishing, Activity, Login history).
 * 
 * Usage:
 * <LogTable
 *   columns={[
 *     { key: 'time', label: 'Time' },
 *     { key: 'action', label: 'Action' },
 *     { key: 'status', label: 'Status' }
 *   ]}
 *   rows={[
 *     { id: 1, time: '10:00 AM', action: 'Log In', status: 'Successful' }
 *   ]}
 *   statusKey="status"
 *   isLoading={false}
 *   emptyMessage="No activity history found"
 * />
 */
export default function LogTable({
  columns = [],
  rows = [],
  statusKey,
  isLoading = false,
  emptyMessage = 'No logs scheduled',
}) {
  return (
    <Card className="overflow-hidden p-0">
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader size={24} label="Loading logs..." />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No records found"
            description={emptyMessage}
            className="border-dashed"
          />
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-canvas/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider select-none"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="hover:bg-canvas/50 transition-colors duration-150"
                >
                  {columns.map((col) => {
                    const value = row[col.key]
                    const isStatus = statusKey && col.key === statusKey

                    return (
                      <td
                        key={col.key}
                        className="px-6 py-4 text-sm text-ink font-medium whitespace-nowrap"
                      >
                        {isStatus ? (
                          <Badge tone={getStatusTone(value)}>{value}</Badge>
                        ) : (
                          value
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
