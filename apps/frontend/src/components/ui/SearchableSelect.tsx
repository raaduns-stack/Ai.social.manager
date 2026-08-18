import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SearchableSelectProps {
  label?: string
  options?: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

/**
 * A beautiful, accessible SearchableSelect component for select inputs
 * with long lists (like countries).
 */
export default function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  required = false,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className={cn('flex flex-col gap-1.5 w-full text-left relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold text-[#111111]">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-control border border-gray-300 bg-white px-3 py-2 text-sm text-[#111111] cursor-pointer hover:border-gray-400 focus-within:ring-1 focus-within:ring-[#FF6600] focus-within:border-[#FF6600] transition-colors select-none",
          isOpen && "ring-1 ring-[#FF6600] border-[#FF6600]"
        )}
      >
        <span className={cn('truncate', !value && 'text-[#999999]')}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {value && !required && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-gray-100 text-[#999999] hover:text-[#111111] transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn('text-[#999999] transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-gray-200 bg-white shadow-xl max-h-72 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 shrink-0 bg-gray-50">
            <Search size={14} className="text-[#999999]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#999999]"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt === value
                return (
                  <div
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "px-3 py-2 text-sm text-[#666666] hover:bg-gray-50 hover:text-[#111111] cursor-pointer transition-colors truncate",
                      isSelected && "bg-[#FFF5F0] text-[#FF6600] font-semibold hover:text-[#FF6600] hover:bg-[#FFF5F0]"
                    )}
                  >
                    {opt}
                  </div>
                )
              })
            ) : (
              <div className="px-3 py-3 text-sm text-[#999999] text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
