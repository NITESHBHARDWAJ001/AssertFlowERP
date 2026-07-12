interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-brand-600/70" aria-hidden="true" />
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink dark:text-slate-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
