/**
 * DataTable.jsx
 * Generic sortable / filterable / paginated table.
 * Used by: User Management, Audit Logs, Payments, Uploads, Tickets list.
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: "name", label: "Name" },
 *       { key: "email", label: "Email" },
 *       { key: "status", label: "Status", render: (row) => <Badge ... /> },
 *     ]}
 *     data={customers}
 *     searchKeys={["name", "email"]}
 *     pageSize={8}
 *   />
 */
import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

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

  return (
    <div className="rounded-card border border-[#E5E7EB] bg-white">
      {searchKeys.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-4 py-3">
          <Search size={16} className="text-[#6B7280]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className="w-full text-sm outline-none placeholder:text-[#6B7280]"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left text-[#6B7280]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  className="px-4 py-3 font-medium select-none cursor-pointer"
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
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[#6B7280]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id ?? i} className="border-b border-[#E5E7EB] last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-[#111827]">
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
        <div className="flex items-center justify-between px-4 py-3 text-sm text-[#6B7280]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[#E5E7EB] px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#E5E7EB] px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
