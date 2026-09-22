// Hand-rolled — no charting library exists anywhere in this app, and none
// of these dashboards need more than a labeled proportional bar.
// Width-percentage divs rather than literal <svg> rects: they reflow
// naturally at any container width, which a fixed SVG viewBox would need
// extra work for.
export function BarChart({ data, valueLabel }: { data: { label: string; value: number }[]; valueLabel?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 truncate text-charcoal/65">{d.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ivory-soft">
            <div className="h-full rounded-full bg-gold" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-charcoal">{valueLabel ? valueLabel(d.value) : d.value.toLocaleString()}</span>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-charcoal/50">No data yet.</p>}
    </div>
  );
}
