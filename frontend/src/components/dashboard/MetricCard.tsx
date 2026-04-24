import { Sparkline } from "./Sparkline";

type Tone = "emerald" | "amber" | "rose" | "sky";

const toneBar: Record<Tone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

type Props = {
  title: string;
  valueLabel: string;
  subLabel?: string;
  sent: number;
  received: number;
  barPercent: number;
  tone?: Tone;
  spark?: number[];
};

export function MetricCard({
  title,
  valueLabel,
  subLabel,
  sent,
  received,
  barPercent,
  tone = "emerald",
  spark = [42, 48, 44, 52, 58, 55, 62],
}: Props) {
  const pct = Math.max(0, Math.min(100, barPercent));
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-none">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{valueLabel}</p>
          {subLabel && <p className="text-xs text-slate-500 dark:text-slate-400">{subLabel}</p>}
        </div>
        <Sparkline values={spark} className="text-sky-500 opacity-90" />
      </div>
      <div className="mt-4 flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Sent: {sent}</span>
        <span>Received: {received}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${toneBar[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
