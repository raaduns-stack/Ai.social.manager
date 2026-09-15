/**
 * SubmissionSearch.jsx
 * Search input with a suggestion dropdown for /designer/submissions.
 * Suggestions search the full list (ignoring period/activity filters),
 * capped at MAX_SUGGESTIONS. Enter/click opens the submission detail.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import StatusDot from "./premium/StatusDot";
import { timeAgo } from "../../features/designer/format";

const MAX_SUGGESTIONS = 4;

function shortId(id) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

export default function SubmissionSearch({ submissions, query, onQueryChange, onSelect }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listId = "submission-search-listbox";

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return submissions
      .filter((s) => `${s.title} ${s.id} ${s.category}`.toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS);
  }, [submissions, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const h = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const choose = (s) => {
    if (!s) return;
    setOpen(false);
    onSelect(s);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (open && suggestions[active]) {
        e.preventDefault();
        choose(suggestions[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className="relative">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
      <input
        value={query}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-activedescendant={showDropdown && suggestions[active] ? `sub-search-opt-${suggestions[active].id}` : undefined}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search title, ID…"
        className={`h-8 pl-8 w-44 sm:w-56 rounded-full border border-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${query ? "pr-8" : "pr-3"}`}
      />
      {query && (
        <button
          onClick={() => {
            onQueryChange("");
            setOpen(false);
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
        >
          <X size={12} />
        </button>
      )}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-white shadow-premium z-50 overflow-hidden">
          {suggestions.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-ink-muted">
              No matches for “{query.trim()}”.
            </p>
          ) : (
            <ul id={listId} role="listbox" className="p-1.5 max-h-72 overflow-y-auto dp-scroll">
              {suggestions.map((s, i) => (
                <li key={s.id} role="option" id={`sub-search-opt-${s.id}`} aria-selected={i === active}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(s)}
                    className={`w-full text-left flex items-center gap-2.5 p-2 rounded-xl border transition-colors ${i === active ? "bg-primary-50 border-primary-100" : "border-transparent hover:bg-canvas"}`}
                  >
                    <StatusDot status={s.status} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-ink truncate leading-snug">{s.title}</span>
                      <span className="block text-[11px] text-ink-muted mt-0.5">
                        {s.category} • {shortId(s.id)} • {timeAgo(s.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {suggestions.length > 0 && (
            <p className="px-4 py-2 border-t border-border text-[11px] text-ink-muted">
              Enter ↵ opens the highlighted match
            </p>
          )}
        </div>
      )}
    </div>
  );
}
