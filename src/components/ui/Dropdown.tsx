"use client";

import { clsx } from "clsx";
import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownItem {
  label: string;
  value: string;
  onClick?: () => void;
}

interface DropdownProps {
  trigger?: ReactNode;
  items: DropdownItem[];
  onSelect?: (value: string) => void;
  label?: string;
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  onSelect,
  label = "Select",
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={clsx("relative inline-block", className)}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 border border-border-subtle bg-surface px-4 py-2 font-label text-sm text-foreground transition-colors hover:bg-surface-elevated"
        >
          {label}
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
      {isOpen && (
        <div className="absolute z-40 mt-1 min-w-[160px] border border-border-subtle bg-surface py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                item.onClick?.();
                onSelect?.(item.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left font-label text-sm text-foreground transition-colors hover:bg-surface-elevated"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
