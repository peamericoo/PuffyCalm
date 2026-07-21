/**
 * Full-width commercial ticker at the very top of the site.
 * Messages come from CMS-lite API (Phase J) via layout props.
 * Hidden when empty (clean storefront — no demo copy).
 */

type Props = {
  messages: string[];
};

export function PromoBar({ messages }: Props) {
  if (messages.length === 0) {
    return null;
  }

  const loop = [...messages, ...messages];

  return (
    <div className="promo-bar fixed inset-x-0 top-0 z-[60] h-[var(--promo-h)] overflow-hidden text-white">
      <div className="flex h-full w-max items-center animate-marquee gap-10 whitespace-nowrap px-4">
        {loop.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="inline-flex items-center gap-10 text-[12px] font-medium tracking-wide sm:text-[13px]"
          >
            {text}
            <span
              className="h-1 w-1 shrink-0 rounded-full bg-white/55"
              aria-hidden
            />
          </span>
        ))}
      </div>
    </div>
  );
}
