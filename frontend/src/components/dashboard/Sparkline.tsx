type Props = {
  values: number[];
  className?: string;
};

/** Tiny SVG trend line — decorative; pass normalized 0–100-ish values. */
export function Sparkline({ values, className = "" }: Props) {
  if (values.length < 2) return <div className={`h-8 ${className}`} />;
  const w = 120;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-8 w-[120px] ${className}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts.join(" ")}
      />
    </svg>
  );
}
