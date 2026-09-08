import { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, Plus, Search, Check } from "lucide-react";
import { cn } from "../../../utils/cn";

const uid = () => `cc-${Math.random().toString(36).slice(2, 8)}`;

export default function CategoryCombobox({
  options = [],
  value,
  onChange,
  onCreate,
  placeholder = "Select category…",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxRef = useRef(null);
  const containerRef = useRef(null);
  const listId = useRef(uid()).current;

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return options;
    return options.filter((o) => o.value.toLowerCase().includes(normalized));
  }, [options, normalized]);

  const exactMatch = filtered.some((o) => o.value.toLowerCase() === normalized);
  const canCreate = normalized.length > 0 && !exactMatch;
  const createItem = canCreate ? [{ create: true, name: query.trim() }] : [];
  const items = [...createItem, ...filtered];
  const itemId = (i) => `${listId}-opt-${i}`;

  useEffect(() => {
    setActiveIndex(0);
  }, [isOpen, query]);

  useEffect(() => {
    const node = listboxRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    node?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const commit = (item) => {
    if (item.create) {
      if (onCreate) onCreate(item.name);
    } else if (onChange) {
      onChange(item.value);
    }
    setIsOpen(false);
    setQuery("");
  };

  const open = () => {
    setIsOpen(true);
    setActiveIndex(0);
  };

  const onKeyDown = (e) => {
    if (!isOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        open();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (items.length) commit(items[activeIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        break;
      default:
        break;
    }
  };

  const showEmpty = !items.length;
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white text-sm transition-all text-left",
          isOpen
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/40 hover:bg-canvas/50"
        )}
      >
        {selected ? (
          <>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-border bg-canvas text-ink-muted">
              <selected.icon size={14} />
            </span>
            <span className="flex-1 min-w-0 font-semibold text-ink truncate">{selected.value}</span>
          </>
        ) : (
          <span className="flex-1 min-w-0 text-ink-muted">{placeholder}</span>
        )}
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-canvas border border-border text-ink-muted">
          <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-border bg-white shadow-hover overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-canvas/60">
            <Search size={14} className="text-ink-muted shrink-0" />
            <input
              type="text"
              role="combobox"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={40}
              placeholder="Search categories…"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={items[activeIndex] ? itemId(activeIndex) : undefined}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
          </div>

          <div ref={listboxRef} role="listbox" id={listId} aria-label="Categories" className="max-h-60 overflow-y-auto py-1">
            {showEmpty ? (
              <p role="option" aria-disabled="true" className="px-3 py-3 text-xs text-center text-ink-muted">
                No matches — type to create "{query.trim()}"
              </p>
            ) : (
              items.map((item, i) => {
                const isActive = i === activeIndex;
                const isSelected = !item.create && item.value === value;
                return (
                  <div
                    key={itemId(i)}
                    id={itemId(i)}
                    role="option"
                    aria-selected={isSelected}
                    data-idx={i}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(item)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors",
                      isActive ? "bg-primary-50 text-ink" : "text-ink-muted",
                      item.create && "border-b border-border"
                    )}
                  >
                    {item.create ? (
                      <>
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-primary text-white">
                          <Plus size={12} strokeWidth={3} />
                        </span>
                        <span className="truncate font-semibold text-primary">Create "{item.name}"</span>
                      </>
                    ) : (
                      <>
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-border bg-canvas text-ink-muted">
                          <item.icon size={12} />
                        </span>
                        <span className="flex-1 min-w-0 truncate font-medium text-ink">{item.value}</span>
                        {isSelected && <Check size={14} className="text-primary shrink-0" />}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}