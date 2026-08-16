/**
 * DataTable.jsx
 * Generic sortable / filterable / paginated table.
 * Used by: User Management, Audit Logs, Payments, Uploads, Tickets list.
 */
import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({
  columns,
  data,
  searchKeys = [],
  pageSize = 10,
  emptyMessage = "No records found.",
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query || searchKeys.length === 0) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(q))
    );
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const startItem = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(sorted.length, page * pageSize);
  const totalItems = sorted.length;

  return (
    <div className="bg-surface border border-surface-variant rounded-xl overflow-hidden shadow-sm">
      {searchKeys.length > 0 && (
        <div className="flex items-center gap-2 border-b border-surface-variant px-4 py-3 bg-surface-bright">
          <Search size={16} className="text-on-surface-variant/70" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className="w-full text-sm bg-transparent outline-none placeholder:text-on-surface-variant/50 text-on-surface"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-bright border-b border-surface-variant">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  className="py-3 px-6 font-ui-mono text-ui-mono text-on-surface-variant uppercase tracking-wider font-semibold text-xs select-none cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key &&
                      (sortDir === "asc" ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant bg-surface">
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 px-6 text-center text-on-surface-variant/70"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id ?? i} className="hover:bg-surface-container-low transition-colors group">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-6 whitespace-nowrap text-on-surface-variant">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-surface-bright border-t border-surface-variant px-6 py-3 flex items-center justify-between text-sm text-on-surface-variant font-ui-mono">
          <span>
            Showing {startItem} to {endItem} of {totalItems} results
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1 rounded-DEFAULT border border-surface-variant text-on-surface-variant hover:bg-surface-variant disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 rounded-DEFAULT border border-surface-variant text-on-surface hover:bg-surface-variant disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
