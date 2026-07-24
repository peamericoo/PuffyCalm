"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import {
  CATALOG_SORT_OPTIONS,
  type CatalogSort,
} from "@/lib/catalog/types";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";

type MenuPosition = {
  top: number;
  right: number;
};

/**
 * Custom sort dropdown — elegant glass menu (no native select chrome).
 * Keyboard: Esc closes, arrows move, Enter selects.
 */
export function CategorySortDropdown({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { sort, setSort, pending } = useCatalogUrl();
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const active =
    CATALOG_SORT_OPTIONS.find((o) => o.value === sort) ??
    CATALOG_SORT_OPTIONS[0];

  const close = useCallback(() => setOpen(false), []);
  const syncMenuPosition = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPosition({
      top: Math.round(rect.bottom + 8),
      right: Math.max(8, Math.round(window.innerWidth - rect.right)),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    const onLayout = () => syncMenuPosition();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [close, open, syncMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const activeEl = listRef.current?.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    activeEl?.focus({ preventScroll: true });
  }, [open]);

  const pick = (value: CatalogSort) => {
    setSort(value);
    close();
  };

  const toggle = () => {
    if (!open) syncMenuPosition();
    setOpen((v) => !v);
  };

  const onListKeyDown = (e: ReactKeyboardEvent) => {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    if (items.length === 0) return;
    const idx = items.findIndex((el) => el === document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[Math.min(idx + 1, items.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[Math.max(idx - 1, 0)]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggle}
        className={cn(
          "group inline-flex h-10 items-center gap-2 rounded-full pl-3.5 pr-3",
          compact && "h-[2.85rem] gap-1.5 px-4",
          "bg-white/75 text-[12.5px] font-semibold tracking-tight text-foreground",
          "border border-white/80",
          "shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,0_8px_20px_-12px_rgb(26_35_50/0.18)]",
          "outline-none transition-[background,box-shadow,border-color,transform] duration-200",
          "hover:bg-white hover:shadow-[0_1px_0_rgb(255_255_255/0.95)_inset,0_12px_24px_-12px_rgb(26_35_50/0.22)]",
          "focus-visible:border-brand-deep/45 focus-visible:ring-2 focus-visible:ring-brand/30",
          "disabled:opacity-50",
          open && "bg-white border-brand-deep/25 ring-2 ring-brand/20",
        )}
      >
        <span
          className={cn(
            "font-medium",
            compact ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Sort
        </span>
        {compact ? null : (
          <span className="max-w-[7.5rem] truncate sm:max-w-none">
            {active.label}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-brand-deep",
          )}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>

      {open && menuPosition
        ? createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Sort products"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          style={{
            position: "fixed",
            top: menuPosition.top,
            right: menuPosition.right,
          }}
          className={cn(
            "z-[95] min-w-[12.5rem] overflow-hidden rounded-2xl py-1.5",
            "isolate bg-white/98 [backface-visibility:hidden] [contain:layout_paint_style] [transform:translateZ(0)]",
            "border border-white/90",
            "shadow-[0_1px_0_rgb(255_255_255/0.9)_inset,0_18px_40px_-18px_rgb(26_35_50/0.35),0_0_0_1px_rgb(212_226_236/0.45)]",
            "origin-top-right animate-[catalog-menu-in_180ms_cubic-bezier(0.22,1,0.36,1)_both]",
            "[view-transition-name:none]",
          )}
        >
          {CATALOG_SORT_OPTIONS.map((opt) => {
            const selected = opt.value === sort;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-active={selected || undefined}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => pick(opt.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pick(opt.value);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium",
                    "outline-none transition-colors duration-150",
                    "hover:bg-brand-soft/80 focus-visible:bg-brand-soft/80",
                    selected
                      ? "text-brand-deep"
                      : "text-foreground/85",
                  )}
                >
                  <span className="flex-1 tracking-tight">{opt.label}</span>
                  {selected ? (
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-brand-deep"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>,
          document.body,
        )
        : null}
    </div>
  );
}
