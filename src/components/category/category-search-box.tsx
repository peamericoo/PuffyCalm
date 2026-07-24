"use client";

import { FormEvent, useState } from "react";
import { Search, X } from "lucide-react";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";

type Props = {
  compact?: boolean;
  className?: string;
};

export function CategorySearchBox({ compact = false, className }: Props) {
  const { q, setQuery } = useCatalogUrl();
  const [draft, setDraft] = useState(q);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(draft);
  };

  const clear = () => {
    setDraft("");
    setQuery("");
  };

  return (
    <form
      role="search"
      aria-label="Search catalog"
      onSubmit={submit}
      className={cn("relative min-w-0", className)}
    >
      <Search
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-deep/70",
          compact ? "h-4 w-4" : "h-[17px] w-[17px]",
        )}
        aria-hidden
      />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={compact ? "Search" : "Search products"}
        aria-label="Search products by name"
        className={cn(
          "w-full rounded-full border border-white/70 bg-white/62 text-foreground outline-none shadow-[0_1px_0_rgb(255_255_255/0.82)_inset]",
          "placeholder:text-muted-foreground/70 transition focus:border-brand/40 focus:bg-white focus:ring-2 focus:ring-brand/15",
          compact
            ? "h-10 pl-10 pr-9 text-[13px]"
            : "h-10 min-w-[13.5rem] pl-10 pr-9 text-[13px] font-medium xl:min-w-[17rem]",
        )}
      />
      {draft.trim() ? (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-brand-soft hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </form>
  );
}
