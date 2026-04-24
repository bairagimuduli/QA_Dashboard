type Slice = { label: string; value: number; color: string };

type Props = {
  slices: Slice[];
  centerLabel: string;
  size?: number;
};

export function DonutChart({ slices, centerLabel, size = 160 }: Props) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  const r = 45;
  const c = 50;
  const stroke = 14;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <g transform="rotate(-90 50 50)">
        {slices.map((s) => {
          const frac = s.value / total;
          const dash = frac * circ;
          const el = (
            <circle
              key={s.label}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </g>
      <circle cx={50} cy={50} r={r - stroke} fill="white" />
      <text x={50} y={54} textAnchor="middle" className="fill-slate-700 text-[11px] font-bold">
        {centerLabel}
      </text>
    </svg>
  );
}
