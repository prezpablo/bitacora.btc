export function Sparkline({
  values,
  color = "var(--color-foreground)",
}: {
  values: number[];
  color?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-9);
  const w = 140;
  const h = 32;
  let d = "";
  values.forEach((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 2 - ((v - min) / span) * (h - 4);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-36" aria-hidden="true">
      <path
        d={d.trim()}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}