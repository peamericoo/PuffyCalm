const phrases = [
  "Recovery that feels premium",
  "Comfort for long days",
  "Everyday upgrades",
  "Calm by design",
  "Ships to US · UK · AU · CA",
  "Guest checkout ready",
];

export function MarqueeStrip() {
  const loop = [...phrases, ...phrases];

  return (
    <section className="overflow-hidden border-y border-border/70 bg-white/50 py-3.5">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-4">
        {loop.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="inline-flex items-center gap-10 text-sm font-medium tracking-wide text-muted-foreground"
          >
            {text}
            <span className="h-1 w-1 rounded-full bg-accent/50" aria-hidden />
          </span>
        ))}
      </div>
    </section>
  );
}
