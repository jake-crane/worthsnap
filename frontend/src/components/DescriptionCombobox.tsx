import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
  error?: boolean
}

export default function DescriptionCombobox({
  value,
  onChange,
  options,
  placeholder,
  className,
  error,
}: Props) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered =
    value.trim() === ''
      ? options
      : options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectOption(option: string) {
    onChange(option)
    setOpen(false)
    setHighlightedIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && highlightedIndex >= 0 && filtered[highlightedIndex]) {
        e.preventDefault()
        selectOption(filtered[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlightedIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-2 text-sm ${
          error
            ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500'
            : 'border-slate-300'
        }`}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-invalid={error}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {filtered.map((option, i) => (
            <li key={option} role="option" aria-selected={i === highlightedIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlightedIndex(i)}
                onClick={() => selectOption(option)}
                className={`block w-full px-3 py-2 text-left ${
                  i === highlightedIndex ? 'bg-slate-100' : 'hover:bg-slate-100'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
