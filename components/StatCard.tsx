export default function StatCard({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="panel rounded-2xl px-5 py-5">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-semibold text-white">
        {value}
        {suffix && (
          <span className="ml-1 text-lg font-normal text-neutral-500">
            {suffix}
          </span>
        )}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
